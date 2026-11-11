import { createClient } from '@supabase/supabase-js';
import { env as privateEnv } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import crypto from 'node:crypto';

/** @type {import('@supabase/supabase-js').SupabaseClient | null} */
let cachedServerClient = null;
let cachedKeySignature = '';
/** @type {import('@supabase/supabase-js').SupabaseClient | null} */
let cachedAdminClient = null;
let cachedAdminSignature = '';

/**
 * Resolves the Supabase URL and keys from environment variables.
 * Defaults effectiveKey to anonKey with active RLS.
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
    effectiveKey: anonKey,
    usingServiceRole: false
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
 * Returns a module-level singleton Supabase client authenticated with PUBLIC_SUPABASE_ANON_KEY with active RLS.
 * Client queries strictly use anonKey or fail, never escalating to superuser.
 * @returns {import('@supabase/supabase-js').SupabaseClient | null}
 */
export function getServerSupabase() {
  const { url, anonKey } = resolveSupabaseConfig();
  if (!url || !anonKey) return null;

  const sig = `${url}::anon::${anonKey.slice(0, 16)}`;
  if (cachedServerClient && cachedKeySignature === sig) {
    return cachedServerClient;
  }

  cachedServerClient = createClient(url, anonKey, {
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
 * Returns a privileged Supabase client authenticated with SUPABASE_SERVICE_ROLE_KEY.
 * Reserved strictly for verified server-side administrative tasks (e.g. verified moderation PATCH).
 * Never exposed to anonymous public endpoints.
 * @returns {import('@supabase/supabase-js').SupabaseClient | null}
 */
export function getAdminSupabase() {
  const { url, serviceKey } = resolveSupabaseConfig();
  if (!url || !serviceKey) return null;

  const sig = `${url}::admin::${serviceKey.slice(0, 16)}`;
  if (cachedAdminClient && cachedAdminSignature === sig) {
    return cachedAdminClient;
  }

  cachedAdminClient = createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    },
    global: {
      fetch: fetchWithTimeout
    }
  });
  cachedAdminSignature = sig;
  return cachedAdminClient;
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

