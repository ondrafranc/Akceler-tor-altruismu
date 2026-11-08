import { createClient } from '@supabase/supabase-js';
import { env as privateEnv } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import crypto from 'node:crypto';

/** @type {import('@supabase/supabase-js').SupabaseClient | null} */
let cachedServerClient = null;
let cachedKeySignature = '';

/**
 * Resolves the Supabase URL and private Service Role Key from environment variables.
 * Supports both SvelteKit standard names and Vercel-Supabase integration names.
 */
export function resolveSupabaseConfig() {
  const url = (
    privateEnv.SUPABASE_URL ||
    publicEnv.PUBLIC_SUPABASE_URL ||
    privateEnv.NEXT_PUBLIC_SUPABASE_URL ||
    ''
  ).trim();

  const serviceKey = (
    privateEnv.SUPABASE_SERVICE_ROLE_KEY ||
    privateEnv.SUPABASE_SECRET_KEY ||
    privateEnv['API Key'] ||
    ''
  ).trim();

  const anonKey = (
    publicEnv.PUBLIC_SUPABASE_ANON_KEY ||
    privateEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    privateEnv.SUPABASE_PUBLISHABLE_KEY ||
    privateEnv.PUBLISHABLE_API_KEY ||
    ''
  ).trim();

  return {
    url,
    serviceKey,
    anonKey,
    effectiveKey: serviceKey || anonKey,
    usingServiceRole: Boolean(serviceKey)
  };
}

/**
 * Custom fetch with a strict per-request timeout so serverless lambdas never hang.
 * @param {RequestInfo | URL} input
 * @param {RequestInit} [init]
 */
async function fetchWithTimeout(input, init = {}) {
  const timeoutSignal = AbortSignal.timeout(3000);
  const signal = init.signal
    ? AbortSignal.any([init.signal, timeoutSignal])
    : timeoutSignal;
  return fetch(input, { ...init, signal });
}

/**
 * Returns a module-level singleton Supabase client authenticated with SUPABASE_SERVICE_ROLE_KEY.
 * @returns {import('@supabase/supabase-js').SupabaseClient | null}
 */
export function getServerSupabase() {
  const { url, effectiveKey } = resolveSupabaseConfig();
  if (!url || !effectiveKey) return null;

  const sig = `${url}::${effectiveKey.slice(0, 16)}`;
  if (cachedServerClient && cachedKeySignature === sig) {
    return cachedServerClient;
  }

  cachedServerClient = createClient(url, effectiveKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    },
    global: {
      fetch: fetchWithTimeout
    }
  });
  cachedKeySignature = sig;
  return cachedServerClient;
}

/**
 * Runs a promise with a bounded timeout and always clears the timer in finally (M4).
 * @template T
 * @param {PromiseLike<T>} promise
 * @param {number} timeoutMs
 * @param {string} [label='Database timeout']
 * @returns {Promise<T>}
 */
export async function withTimeout(promise, timeoutMs = 2800, label = 'Database timeout') {
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let timerId;
  const timeoutPromise = new Promise((_, reject) => {
    timerId = setTimeout(() => reject(new Error(label)), timeoutMs);
  });
  try {
    return await Promise.race([Promise.resolve(promise), timeoutPromise]);
  } finally {
    if (timerId !== undefined) clearTimeout(timerId);
  }
}

/**
 * Anonymizes a client IP/identifier into a privacy-safe short SHA-256 hex digest.
 * @param {string} clientKey
 * @returns {string}
 */
export function hashClientKey(clientKey) {
  const salt = (privateEnv.SUPABASE_JWT_SECRET || 'akcelerator-ip-salt').slice(0, 32);
  return crypto
    .createHash('sha256')
    .update(`${salt}:${clientKey || 'anon'}`)
    .digest('hex')
    .slice(0, 24);
}

