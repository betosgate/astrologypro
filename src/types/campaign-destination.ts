export type CampaignDestinationType = 'PROFILE' | 'SERVICE';

export type CampaignChannel =
  | 'facebook'
  | 'instagram'
  | 'whatsapp'
  | 'youtube'
  | 'email'
  | 'twitter'
  | 'tiktok'
  | 'linkedin'
  | 'direct'
  | 'other';

export interface CampaignDestination {
  destination_type: CampaignDestinationType;
  destination_profile_id: string | null;
  destination_service_template_id: string | null;
  destination_diviner_service_id: string | null;
}

export interface CampaignWithDestination {
  id: string;
  diviner_id: string;
  name: string;
  description: string | null;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'expired';
  destination_type: CampaignDestinationType | null;
  destination_profile_id: string | null;
  destination_service_template_id: string | null;
  destination_diviner_service_id: string | null;
  campaign_code: string | null;
  share_url: string | null;
  tracking_link_id: string | null;
  channel: CampaignChannel | null;
  content_variant: string | null;
  start_date: string;
  end_date: string | null;
  commission_type: 'percentage' | 'fixed';
  commission_value: number;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  auto_paused_at: string | null;
  auto_pause_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface CampaignClick {
  id: string;
  campaign_id: string | null;
  tracking_link_id: string | null;
  campaign_code: string | null;
  diviner_id: string;
  destination_type: CampaignDestinationType;
  destination_id: string;
  resolved_url: string;
  clicked_at: string;
  referrer_url: string | null;
  user_agent: string | null;
  ip_hash: string | null;
  device_type: 'desktop' | 'mobile' | 'tablet' | 'bot' | 'unknown' | null;
  browser: string | null;
  os: string | null;
  country_code: string | null;
  country_region: string | null;
  city: string | null;
  session_id: string | null;
  anonymous_visitor_id: string | null;
  source: string | null;
  medium: string | null;
  utm_campaign: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_content: string | null;
  is_unique_click: boolean;
  is_bot: boolean;
  converted: boolean;
  conversion_id: string | null;
  created_at: string;
}
