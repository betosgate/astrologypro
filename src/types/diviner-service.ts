/**
 * Types for diviner service access control and audit logging.
 * Created in Task 01 of the 2026-04-17 sprint.
 */

export type ServicePublishStatus = 'draft' | 'published' | 'unpublished' | 'archived';

export type ServiceAccessAction =
  | 'service_enabled'
  | 'service_disabled'
  | 'landing_page_published'
  | 'landing_page_unpublished'
  | 'landing_page_archived'
  | 'override_applied'
  | 'override_removed'
  | 'custom_content_updated'
  | 'link_copied'
  | 'link_shared'
  | 'route_changed';

export interface DivinerServiceRecord {
  id: string;
  diviner_id: string;
  template_id: string;
  price: number;
  is_enabled: boolean;
  is_published: boolean;
  enabled_at: string | null;
  disabled_at: string | null;
  enabled_by: string | null;
  disabled_by: string | null;
  published_at: string | null;
  unpublished_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ServiceAccessAuditEntry {
  id: string;
  diviner_id: string;
  service_template_id: string | null;
  diviner_service_id: string | null;
  action: ServiceAccessAction;
  performed_by: string;
  performed_by_role: 'admin' | 'diviner' | 'system';
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  reason: string | null;
  ip_address: string | null;
  created_at: string;
}

/** Payload for writing an audit log entry via admin client */
export interface AuditLogInsert {
  diviner_id: string;
  service_template_id?: string | null;
  diviner_service_id?: string | null;
  action: ServiceAccessAction;
  performed_by: string;
  performed_by_role: 'admin' | 'diviner' | 'system';
  old_value?: Record<string, unknown> | null;
  new_value?: Record<string, unknown> | null;
  reason?: string | null;
  ip_address?: string | null;
}
