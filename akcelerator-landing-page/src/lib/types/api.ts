/**
 * Canonical API Request and Response Contract Definitions.
 */

export interface FeedbackRequestBody {
  message?: string;
  feedback_text?: string;
  text?: string;
  rating?: number | string;
  emotion?: string;
  category?: string;
  page_url?: string;
  pageUrl?: string;
  contact?: string;
  email?: string;
}

export interface SubmissionRequestBody {
  hp?: string;
  started_at?: number;
  elapsed_ms?: number;
  kind: 'org' | 'event' | string;
  name: string;
  category?: string | null;
  website?: string | null;
  url?: string | null;
  email?: string | null;
  phone?: string | null;
  contact?: string | null;
  description?: string | null;
  address_label?: string | null;
  address?: string | null;
  city?: string | null;
  postcode?: string | null;
  lat: number;
  lon: number;
  event_url?: string | null;
  event_start?: string | null;
  event_end?: string | null;
}

export interface SubmissionPatchBody {
  id: string;
  status: 'approved' | 'rejected' | 'pending';
}

export interface PulseEventItem {
  message: string;
  city: string;
  actionId: string;
  icon: string;
  ts: number;
  isLive: boolean;
  recentCount?: number;
  source: string;
}

export interface GeocodePlaceItem {
  label: string;
  lat: number;
  lon: number;
  type?: string;
  class?: string;
  address?: Record<string, string> | null;
}
