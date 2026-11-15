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
  name: string;
  kind: string;
  address?: string;
  lat?: number;
  lon?: number;
  website?: string;
  phone?: string;
  email?: string;
  description?: string;
  quickMission?: string;
  helpWays?: string[];
  visitMode?: string;
  hp?: string;
  clientTimestamp?: number;
}

export interface PulseEventItem {
  id: string;
  action_id: string;
  city: string;
  verb: string;
  icon: string;
  created_at: string;
  relative_time: string;
}

export interface GeocodePlaceItem {
  lat: string | number;
  lon: string | number;
  display_name: string;
  name?: string;
  type?: string;
  address?: Record<string, string>;
}
