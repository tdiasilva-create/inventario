# Dicionário físico do D1/SQLite

Gerado por `pnpm docs:schema`. Nenhum dado de produção. Instalação deve usar as migrações ordenadas, não copiar tabelas avulsas deste catálogo.

- `0001_auth.sql`
- `0002_credential_version.sql`
- `0003_units_assignments.sql`
- `0004_unit_manager.sql`
- `0005_review_catalogue.sql`
- `0006_collector.sql`
- `0007_collector_totals.sql`
- `0008_collector_publication.sql`
- `0009_published_totals.sql`
- `0010_in_progress.sql`
- `0011_root_deletion.sql`
- `0012_visit_answers.sql`
- `0013_photo_storage.sql`
- `0014_agentes.sql`
- `0015_questionario_v3.sql`
- `0016_unidades_cadastro_ampliado.sql`
- `0017_agent_monitoring.sql`
- `0018_service_desk.sql`
- `0019_photo_indexes.sql`
- `0020_photo_thumbnails.sql`
- `0021_environment_names.sql`
- `0022_equipment_names.sql`
- `0023_equipment_deletions.sql`
- `0024_hardware_reviews.sql`
- `0025_school_registration.sql`
- `0026_provider_reports.sql`
- `0027_technical_dispatch.sql`
- `0028_dispatch_road_routes.sql`
- `0029_technician_avatars.sql`
- `0030_d1_read_budget.sql`
- `0031_panel_read_revisions.sql`
- `0032_collection_control.sql`
- `0033_technician_tracking.sql`
- `0034_agent_network_tests.sql`
- `0035_audit_read_budget.sql`

## agent_audit_log

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| audit_id | TEXT | não | 1 | — |
| at | TEXT | sim |  | — |
| actor | TEXT | sim |  | — |
| action | TEXT | sim |  | — |
| target | TEXT | não |  | — |
| details_json | TEXT | não |  | — |

## agent_baseline

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| device_id | TEXT | não | 1 | — |
| inventory_id | TEXT | sim |  | — |
| version | INTEGER | sim |  | — |
| set_at | TEXT | sim |  | — |

## agent_claim_requests

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| request_key | TEXT | não | 1 | — |
| body_hash | TEXT | sim |  | — |
| status | INTEGER | sim |  | — |
| response_json | TEXT | sim |  | — |
| created_at | TEXT | sim |  | — |

## agent_current_snapshot

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| device_id | TEXT | não | 1 | — |
| inventory_id | TEXT | sim |  | — |
| collected_at | TEXT | sim |  | — |

## agent_devices

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| device_id | TEXT | não | 1 | — |
| state | TEXT | sim |  | — |
| created_at | TEXT | sim |  | — |
| revoked_at | TEXT | não |  | — |
| revoked_by | TEXT | não |  | — |
| revoke_reason | TEXT | não |  | — |

## agent_enrollment_challenges

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| challenge_id | TEXT | não | 1 | — |
| grant_id | TEXT | sim |  | — |
| challenge | TEXT | sim |  | — |
| created_at | TEXT | sim |  | — |
| expires_at | TEXT | sim |  | — |
| used_by | TEXT | não |  | — |

## agent_enrollments

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| enrollment_id | TEXT | não | 1 | — |
| device_id | TEXT | sim |  | — |
| grant_id | TEXT | sim |  | — |
| code_hash | TEXT | não |  | — |
| visual_code | TEXT | não |  | — |
| expires_at | TEXT | sim |  | — |
| failed_attempts | INTEGER | sim |  | 0 |
| renewals | INTEGER | sim |  | 0 |
| consumed_at | TEXT | não |  | — |
| summary_json | TEXT | sim |  | — |
| created_at | TEXT | sim |  | — |

## agent_equipment_links

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| link_id | TEXT | não | 1 | — |
| device_id | TEXT | sim |  | — |
| equipment_id | TEXT | sim |  | — |
| inspection_id | TEXT | não |  | — |
| linked_by | TEXT | sim |  | — |
| linked_at | TEXT | sim |  | — |
| device_confirmed_at | TEXT | não |  | — |
| ended_at | TEXT | não |  | — |
| end_reason | TEXT | não |  | — |

## agent_equipment_location_history

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| history_id | TEXT | não | 1 | — |
| equipment_id | TEXT | sim |  | — |
| version_before | INTEGER | sim |  | — |
| version_after | INTEGER | sim |  | — |
| kind | TEXT | sim |  | — |
| source | TEXT | sim |  | — |
| before_json | TEXT | não |  | — |
| after_json | TEXT | sim |  | — |
| reason | TEXT | não |  | — |
| changed_by | TEXT | sim |  | — |
| changed_at | TEXT | sim |  | — |
| inspection_id | TEXT | não |  | — |

## agent_hardware_reviews

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| notification_id | TEXT | não | 1 | — |
| decision | TEXT | sim |  | — |
| request_id | TEXT | não |  | — |
| operation_id | TEXT | sim |  | — |
| actor_id | TEXT | sim |  | — |
| actor_name | TEXT | sim |  | — |
| note | TEXT | sim |  | — |
| decided_at | INTEGER | sim |  | — |
| payload_json | TEXT | sim |  | — |
| context_json | TEXT | sim |  | — |

## agent_heartbeats

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| id | INTEGER | não | 1 | — |
| device_id | TEXT | sim |  | — |
| collected_at | TEXT | sim |  | — |
| received_at | TEXT | sim |  | — |
| boot_id | TEXT | sim |  | — |
| sequence | INTEGER | sim |  | — |
| reason | TEXT | sim |  | — |
| live | INTEGER | sim |  | — |

## agent_identity_conflicts

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| conflict_id | TEXT | não | 1 | — |
| detected_at | TEXT | sim |  | — |
| kind | TEXT | sim |  | — |
| installation_id | TEXT | não |  | — |
| key_id | TEXT | não |  | — |
| resolved_at | TEXT | não |  | — |
| resolved_by | TEXT | não |  | — |

## agent_install_grants

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| grant_id | TEXT | não | 1 | — |
| code_hash | TEXT | sim |  | — |
| created_by | TEXT | sim |  | — |
| created_at | TEXT | sim |  | — |
| expires_at | TEXT | sim |  | — |
| max_uses | INTEGER | sim |  | 1 |
| uses_count | INTEGER | sim |  | 0 |
| used_at | TEXT | não |  | — |
| last_used_at | TEXT | não |  | — |
| used_by_installation | TEXT | não |  | — |
| revoked_at | TEXT | não |  | — |
| note | TEXT | não |  | — |

## agent_installations

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| installation_id | TEXT | não | 1 | — |
| device_id | TEXT | sim |  | — |
| agent_version | TEXT | não |  | — |
| current_key_id | TEXT | sim |  | — |
| created_at | TEXT | sim |  | — |
| revoked_at | TEXT | não |  | — |

## agent_inventory_snapshots

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| inventory_id | TEXT | não | 1 | — |
| device_id | TEXT | sim |  | — |
| equipment_id | TEXT | não |  | — |
| collected_at | TEXT | sim |  | — |
| received_at | TEXT | sim |  | — |
| boot_id | TEXT | sim |  | — |
| sequence | INTEGER | sim |  | — |
| reason | TEXT | sim |  | — |
| previous_inventory_id | TEXT | não |  | — |
| content_hash | TEXT | não |  | — |
| snapshot_hash | TEXT | sim |  | — |
| queue_gaps_json | TEXT | não |  | — |
| sections_json | TEXT | sim |  | — |

## agent_keys

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| key_id | TEXT | não | 1 | — |
| installation_id | TEXT | sim |  | — |
| public_jwk | TEXT | sim |  | — |
| status | TEXT | sim |  | — |
| created_at | TEXT | sim |  | — |
| valid_until | TEXT | não |  | — |

## agent_location_requests

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| request_key | TEXT | não | 1 | — |
| body_hash | TEXT | sim |  | — |
| status | INTEGER | sim |  | — |
| response_json | TEXT | sim |  | — |
| created_at | TEXT | sim |  | — |

## agent_message_receipts

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| device_id | TEXT | sim | 1 | — |
| message_id | TEXT | sim | 2 | — |
| body_hash | TEXT | sim |  | — |
| ack_json | TEXT | sim |  | — |
| expires_at | INTEGER | sim |  | — |

## agent_monitor_cursors

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| device_id | TEXT | não | 1 | — |
| link_id | TEXT | sim |  | — |
| collected_ms | INTEGER | sim |  | — |
| components_json | TEXT | sim |  | — |
| revision | INTEGER | sim |  | 0 |
| commit_token | TEXT | sim |  | — |
| updated_at | INTEGER | sim |  | — |

Referências: `device_id` → `agent_devices.device_id` (delete: NO ACTION).

## agent_monitor_health

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| id | INTEGER | não | 1 | — |
| last_success_at | INTEGER | sim |  | — |
| processed | INTEGER | sim |  | — |

## agent_network_tests

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| id | TEXT | não | 1 | — |
| request_id | TEXT | sim |  | — |
| requested_by | TEXT | sim |  | — |
| device_id | TEXT | sim |  | — |
| installation_id | TEXT | sim |  | — |
| link_id | TEXT | sim |  | — |
| equipment_id | TEXT | sim |  | — |
| unit_id | TEXT | sim |  | — |
| context_json | TEXT | sim |  | — |
| mode | TEXT | sim |  | — |
| state | TEXT | sim |  | — |
| created_at | INTEGER | sim |  | — |
| expires_at | INTEGER | sim |  | — |
| started_at | INTEGER | não |  | — |
| finished_at | INTEGER | não |  | — |
| attempt_id | TEXT | não |  | — |
| cancelled_by | TEXT | não |  | — |
| result_json | TEXT | não |  | — |
| observation_json | TEXT | não |  | — |

## agent_notification_reads

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| notification_id | TEXT | sim | 1 | — |
| user_id | TEXT | sim | 2 | — |
| read_at | INTEGER | sim |  | — |

Referências: `user_id` → `users.id` (delete: CASCADE); `notification_id` → `agent_notifications.id` (delete: CASCADE).

## agent_notifications

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| id | TEXT | não | 1 | — |
| event_key | TEXT | sim |  | — |
| device_id | TEXT | sim |  | — |
| link_id | TEXT | sim |  | — |
| equipment_id | TEXT | sim |  | — |
| unit_id | TEXT | sim |  | — |
| kind | TEXT | sim |  | — |
| observed_at | TEXT | sim |  | — |
| detected_at | INTEGER | sim |  | — |
| details_json | TEXT | sim |  | — |
| resolved_at | INTEGER | não |  | — |
| resolution | TEXT | não |  | — |

## agent_presence

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| device_id | TEXT | não | 1 | — |
| data_json | TEXT | sim |  | — |
| updated_at | TEXT | sim |  | — |
| boot_id | TEXT | não |  | — |
| sequence | INTEGER | não |  | — |
| collected_ms | INTEGER | não |  | — |

## agent_queue_gaps

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| device_id | TEXT | sim | 1 | — |
| gap_id | TEXT | sim | 2 | — |
| dropped_count | INTEGER | sim |  | — |
| dropped_change_count | INTEGER | sim |  | — |
| first_dropped_collected_at | TEXT | sim |  | — |
| last_dropped_collected_at | TEXT | sim |  | — |
| first_reported_inventory_id | TEXT | sim |  | — |
| received_at | TEXT | sim |  | — |

## agent_rate_limits

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| rate_key | TEXT | não | 1 | — |
| count | INTEGER | sim |  | — |
| window_start | INTEGER | sim |  | — |

## agent_request_nonces

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| key_id | TEXT | sim | 1 | — |
| nonce | TEXT | sim | 2 | — |
| expires_at | INTEGER | sim |  | — |

## agent_tx_guard

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| ok | INTEGER | sim |  | — |

## attempts

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| key | TEXT | não | 1 | — |
| count | INTEGER | sim |  | — |
| blocked_until | INTEGER | sim |  | — |
| updated_at | INTEGER | sim |  | — |

## audit

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| id | INTEGER | não | 1 | — |
| user_id | TEXT | não |  | — |
| event | TEXT | sim |  | — |
| created_at | INTEGER | sim |  | — |

## collection_conflicts

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| id | TEXT | não | 1 | — |
| unit_id | TEXT | sim |  | — |
| entity_id | TEXT | sim |  | — |
| actor_id | TEXT | sim |  | — |
| attempted_json | TEXT | sim |  | — |
| server_json | TEXT | sim |  | — |
| created_at | INTEGER | sim |  | — |

## collection_data_presence

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| source | TEXT | sim | 1 | — |
| entity_id | TEXT | sim | 2 | — |
| unit_id | TEXT | sim |  | — |

## collection_history

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| id | TEXT | não | 1 | — |
| unit_id | TEXT | sim |  | — |
| inspection_id | TEXT | sim |  | — |
| entity_id | TEXT | sim |  | — |
| event | TEXT | sim |  | — |
| before_json | TEXT | não |  | — |
| after_json | TEXT | não |  | — |
| actor_id | TEXT | sim |  | — |
| created_at | INTEGER | sim |  | — |

## collection_photos

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| id | TEXT | não | 1 | — |
| unit_id | TEXT | sim |  | — |
| inspection_id | TEXT | sim |  | — |
| target_kind | TEXT | sim |  | — |
| target_id | TEXT | sim |  | — |
| object_key | TEXT | sim |  | — |
| mime_type | TEXT | sim |  | — |
| size | INTEGER | sim |  | — |
| sha256 | TEXT | sim |  | — |
| created_by | TEXT | sim |  | — |
| created_at | INTEGER | sim |  | — |
| status | TEXT | sim |  | 'pending' |
| storage_provider | TEXT | sim |  | 'r2' |
| storage_ref | TEXT | não |  | — |
| thumb_blob | BLOB | não |  | — |
| thumb_mime | TEXT | não |  | — |
| thumb_width | INTEGER | não |  | — |
| thumb_height | INTEGER | não |  | — |
| thumb_sha256 | TEXT | não |  | — |
| thumb_source_sha256 | TEXT | não |  | — |
| thumb_created_at | INTEGER | não |  | — |
| thumb_created_by | TEXT | não |  | — |

## computer_context

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| target_id | TEXT | não | 1 | — |
| unit_id | TEXT | sim |  | — |
| kind | TEXT | sim |  | — |
| value | TEXT | sim |  | — |
| version | INTEGER | sim |  | 1 |
| updated_at | INTEGER | sim |  | — |
| updated_by | TEXT | sim |  | — |

## computer_context_events

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| id | TEXT | não | 1 | — |
| target_id | TEXT | sim |  | — |
| actor_id | TEXT | sim |  | — |
| before_json | TEXT | não |  | — |
| after_json | TEXT | sim |  | — |
| created_at | INTEGER | sim |  | — |

## dispatch_assignments

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| id | TEXT | não | 1 | — |
| request_id | TEXT | sim |  | — |
| user_id | TEXT | sim |  | — |
| assigned_at | INTEGER | sim |  | — |
| assigned_by | TEXT | sim |  | — |
| ended_at | INTEGER | não |  | — |

Referências: `user_id` → `users.id` (delete: NO ACTION); `request_id` → `service_requests.id` (delete: NO ACTION).

## dispatch_attendances

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| id | TEXT | não | 1 | — |
| assignment_id | TEXT | sim |  | — |
| request_id | TEXT | sim |  | — |
| user_id | TEXT | sim |  | — |
| session_hash | TEXT | sim |  | — |
| started_at | INTEGER | sim |  | — |
| ended_at | INTEGER | não |  | — |
| end_reason | TEXT | não |  | — |

Referências: `user_id` → `users.id` (delete: NO ACTION); `request_id` → `service_requests.id` (delete: NO ACTION); `assignment_id` → `dispatch_assignments.id` (delete: NO ACTION).

## dispatch_events

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| id | TEXT | não | 1 | — |
| request_id | TEXT | não |  | — |
| actor_id | TEXT | sim |  | — |
| actor_name | TEXT | sim |  | — |
| action | TEXT | sim |  | — |
| detail_json | TEXT | sim |  | — |
| created_at | INTEGER | sim |  | — |

## dispatch_meta

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| id | INTEGER | não | 1 | — |
| revision | INTEGER | sim |  | 0 |
| attempt | TEXT | sim |  | '' |

## dispatch_notifications

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| id | INTEGER | não | 1 | — |
| user_id | TEXT | sim |  | — |
| request_id | TEXT | não |  | — |
| message | TEXT | sim |  | — |
| created_at | INTEGER | sim |  | — |
| read_at | INTEGER | não |  | — |

Referências: `user_id` → `users.id` (delete: NO ACTION).

## dispatch_open_counts

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| user_id | TEXT | não | 1 | — |
| open_count | INTEGER | sim |  | — |

Referências: `user_id` → `users.id` (delete: NO ACTION).

## dispatch_order

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| request_id | TEXT | não | 1 | — |
| position | INTEGER | sim |  | — |

Referências: `request_id` → `service_requests.id` (delete: NO ACTION).

## dispatch_positions

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| attendance_id | TEXT | não | 1 | — |
| latitude | REAL | sim |  | — |
| longitude | REAL | sim |  | — |
| accuracy | REAL | sim |  | — |
| observed_at | INTEGER | sim |  | — |
| received_at | INTEGER | sim |  | — |

Referências: `attendance_id` → `dispatch_attendances.id` (delete: NO ACTION).

## dispatch_receipts

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| operation_id | TEXT | não | 1 | — |
| actor_id | TEXT | sim |  | — |
| payload_hash | TEXT | sim |  | — |
| created_at | INTEGER | sim |  | — |

## dispatch_road_routes

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| attendance_id | TEXT | não | 1 | — |
| route_key | TEXT | sim |  | — |
| origin_latitude | REAL | sim |  | — |
| origin_longitude | REAL | sim |  | — |
| expires_at | INTEGER | sim |  | — |
| response_json | TEXT | sim |  | — |

Referências: `attendance_id` → `dispatch_attendances.id` (delete: CASCADE).

## dispatch_routing_gate

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| id | INTEGER | não | 1 | — |
| next_at | INTEGER | sim |  | 0 |
| lease_until | INTEGER | sim |  | 0 |
| token | TEXT | não |  | — |

## dispatch_technicians

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| user_id | TEXT | não | 1 | — |
| enabled | INTEGER | sim |  | — |
| updated_at | INTEGER | sim |  | — |
| updated_by | TEXT | sim |  | — |

Referências: `user_id` → `users.id` (delete: NO ACTION).

## dispatch_tracking

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| id | TEXT | não | 1 | — |
| user_id | TEXT | sim |  | — |
| session_hash | TEXT | sim |  | — |
| credential_version | INTEGER | sim |  | — |
| token_hash | TEXT | sim |  | — |
| started_at | INTEGER | sim |  | — |
| ended_at | INTEGER | não |  | — |
| end_reason | TEXT | não |  | — |

Referências: `user_id` → `users.id` (delete: NO ACTION).

## dispatch_tracking_positions

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| tracking_id | TEXT | não | 1 | — |
| latitude | REAL | sim |  | — |
| longitude | REAL | sim |  | — |
| accuracy | REAL | sim |  | — |
| observed_at | INTEGER | sim |  | — |
| received_at | INTEGER | sim |  | — |

Referências: `tracking_id` → `dispatch_tracking.id` (delete: NO ACTION).

## dispatch_tracking_routes

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| tracking_id | TEXT | não | 1 | — |
| route_key | TEXT | sim |  | — |
| origin_latitude | REAL | sim |  | — |
| origin_longitude | REAL | sim |  | — |
| expires_at | INTEGER | sim |  | — |
| response_json | TEXT | sim |  | — |

Referências: `tracking_id` → `dispatch_tracking.id` (delete: NO ACTION).

## environment_name_events

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| operation_id | TEXT | não | 1 | — |
| environment_id | TEXT | sim |  | — |
| unit_id | TEXT | sim |  | — |
| inspection_id | TEXT | não |  | — |
| actor_id | TEXT | sim |  | — |
| before_name | TEXT | sim |  | — |
| after_name | TEXT | sim |  | — |
| from_version | INTEGER | sim |  | — |
| to_version | INTEGER | sim |  | — |
| payload_json | TEXT | sim |  | — |
| created_at | INTEGER | sim |  | — |

## environments

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| id | TEXT | não | 1 | — |
| unit_id | TEXT | sim |  | — |
| name | TEXT | sim |  | — |
| type | TEXT | sim |  | — |
| created_at | INTEGER | sim |  | — |
| created_by | TEXT | sim |  | — |
| name_key | TEXT | não |  | — |
| name_version | INTEGER | sim |  | 1 |

Referências: `unit_id` → `units.id` (delete: NO ACTION).

## equipment_deletions

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| equipment_id | TEXT | não | 1 | — |
| unit_id | TEXT | sim |  | — |
| operation_id | TEXT | sim |  | — |
| actor_id | TEXT | sim |  | — |
| actor_name | TEXT | sim |  | — |
| reason | TEXT | sim |  | — |
| payload_json | TEXT | sim |  | — |
| snapshot_json | TEXT | sim |  | — |
| created_at | INTEGER | sim |  | — |

## equipment_locks

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| equipment_id | TEXT | não | 1 | — |
| user_id | TEXT | sim |  | — |
| token | TEXT | sim |  | — |
| expires_at | INTEGER | sim |  | — |

Referências: `equipment_id` → `equipments.id` (delete: NO ACTION).

## equipment_name_events

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| operation_id | TEXT | não | 1 | — |
| equipment_id | TEXT | sim |  | — |
| unit_id | TEXT | sim |  | — |
| actor_id | TEXT | sim |  | — |
| actor_name | TEXT | sim |  | — |
| before_name | TEXT | não |  | — |
| after_name | TEXT | sim |  | — |
| from_version | INTEGER | sim |  | — |
| to_version | INTEGER | sim |  | — |
| payload_json | TEXT | sim |  | — |
| created_at | INTEGER | sim |  | — |

## equipment_names

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| equipment_id | TEXT | não | 1 | — |
| unit_id | TEXT | sim |  | — |
| name | TEXT | sim |  | — |
| version | INTEGER | sim |  | — |
| updated_at | INTEGER | sim |  | — |
| updated_by | TEXT | sim |  | — |

Referências: `unit_id` → `units.id` (delete: NO ACTION); `equipment_id` → `equipments.id` (delete: CASCADE).

## equipment_verifications

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| inspection_id | TEXT | sim | 1 | — |
| equipment_id | TEXT | sim | 2 | — |
| result | TEXT | sim |  | — |
| reason | TEXT | sim |  | '' |
| user_id | TEXT | sim |  | — |
| created_at | INTEGER | sim |  | — |

Referências: `equipment_id` → `equipments.id` (delete: NO ACTION); `inspection_id` → `inspections.id` (delete: NO ACTION).

## equipments

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| id | TEXT | não | 1 | — |
| unit_id | TEXT | sim |  | — |
| inspection_id | TEXT | sim |  | — |
| category | TEXT | sim |  | — |
| environment_id | TEXT | sim |  | — |
| asset | TEXT | sim |  | — |
| serial | TEXT | sim |  | — |
| search_text | TEXT | sim |  | — |
| data_json | TEXT | sim |  | — |
| published_json | TEXT | não |  | — |
| version | INTEGER | sim |  | 1 |
| created_by | TEXT | sim |  | — |
| created_at | INTEGER | sim |  | — |
| updated_by | TEXT | sim |  | — |
| updated_at | INTEGER | sim |  | — |
| verified_at | INTEGER | não |  | — |
| verified_by | TEXT | não |  | — |
| mutation_id | TEXT | não |  | — |
| duplicate_flag | INTEGER | sim |  | 0 |
| published_verified_at | INTEGER | não |  | — |
| published_updated_at | INTEGER | não |  | — |
| position_label | TEXT | não |  | — |
| position_description | TEXT | não |  | — |
| location_state | TEXT | sim |  | 'declarada' |
| location_confirmed_by | TEXT | não |  | — |
| location_confirmed_at | TEXT | não |  | — |

Referências: `environment_id` → `environments.id` (delete: NO ACTION); `inspection_id` → `inspections.id` (delete: NO ACTION); `unit_id` → `units.id` (delete: NO ACTION).

## import_batches

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| id | TEXT | não | 1 | — |
| actor_id | TEXT | sim |  | — |
| rows_json | TEXT | sim |  | — |
| created_at | INTEGER | sim |  | — |
| expires_at | INTEGER | sim |  | — |
| commit_token | TEXT | não |  | — |

## inspection_collection_totals

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| inspection_id | TEXT | não | 1 | — |
| records | INTEGER | sim |  | 0 |
| items | INTEGER | sim |  | 0 |
| new_records | INTEGER | sim |  | 0 |
| changed_records | INTEGER | sim |  | 0 |

## inspection_environments

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| inspection_id | TEXT | sim | 1 | — |
| environment_id | TEXT | sim | 2 | — |
| data_json | TEXT | sim |  | — |

Referências: `inspection_id` → `inspections.id` (delete: NO ACTION).

## inspection_sections

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| inspection_id | TEXT | sim | 1 | — |
| section | TEXT | sim | 2 | — |
| data_json | TEXT | sim |  | '{}' |
| state | TEXT | sim |  | 'Pendente' |
| version | INTEGER | sim |  | 1 |
| updated_by | TEXT | sim |  | — |
| updated_at | INTEGER | sim |  | — |
| mutation_id | TEXT | não |  | — |

Referências: `inspection_id` → `inspections.id` (delete: NO ACTION).

## inspections

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| id | TEXT | não | 1 | — |
| unit_id | TEXT | sim |  | — |
| state | TEXT | sim |  | 'open' |
| questionnaire_version | TEXT | sim |  | '1.0' |
| created_by | TEXT | sim |  | — |
| created_at | INTEGER | sim |  | — |
| updated_at | INTEGER | sim |  | — |
| completed_at | INTEGER | não |  | — |
| revision | INTEGER | sim |  | 1 |
| completion_token | TEXT | não |  | — |

Referências: `created_by` → `users.id` (delete: NO ACTION); `unit_id` → `units.id` (delete: NO ACTION).

## integration_events

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| id | INTEGER | não | 1 | — |
| provider | TEXT | sim |  | — |
| event | TEXT | sim |  | — |
| actor_id | TEXT | não |  | — |
| detail | TEXT | não |  | — |
| created_at | INTEGER | sim |  | — |

## integration_folders

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| provider | TEXT | sim | 1 | — |
| scope_key | TEXT | sim | 2 | — |
| folder_id | TEXT | sim |  | — |
| created_at | INTEGER | sim |  | — |

## integration_oauth_states

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| state | TEXT | não | 1 | — |
| provider | TEXT | sim |  | — |
| user_id | TEXT | sim |  | — |
| created_at | INTEGER | sim |  | — |
| expires_at | INTEGER | sim |  | — |
| nonce_hash | TEXT | sim |  | — |

## integration_tokens

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| provider | TEXT | não | 1 | — |
| account_email | TEXT | não |  | — |
| account_name | TEXT | não |  | — |
| scope | TEXT | sim |  | — |
| refresh_token_enc | TEXT | não |  | — |
| access_token_enc | TEXT | não |  | — |
| access_token_expires_at | INTEGER | não |  | — |
| folder_id | TEXT | não |  | — |
| folder_name | TEXT | não |  | — |
| connected_by | TEXT | sim |  | — |
| connected_at | INTEGER | sim |  | — |
| last_refresh_at | INTEGER | não |  | — |
| last_test_at | INTEGER | não |  | — |
| last_test_result | TEXT | não |  | — |
| last_error | TEXT | não |  | — |
| revoked_at | INTEGER | não |  | — |

## miscellaneous_equipments

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| id | TEXT | não | 1 | — |
| unit_id | TEXT | sim |  | — |
| inspection_id | TEXT | sim |  | — |
| category | TEXT | sim |  | — |
| environment_id | TEXT | não |  | — |
| asset | TEXT | sim |  | — |
| serial | TEXT | sim |  | — |
| search_text | TEXT | sim |  | — |
| data_json | TEXT | sim |  | — |
| published_json | TEXT | não |  | — |
| version | INTEGER | sim |  | 1 |
| created_by | TEXT | sim |  | — |
| created_at | INTEGER | sim |  | — |
| updated_by | TEXT | sim |  | — |
| updated_at | INTEGER | sim |  | — |
| verified_at | INTEGER | não |  | — |
| verified_by | TEXT | não |  | — |
| mutation_id | TEXT | não |  | — |
| duplicate_flag | INTEGER | sim |  | 0 |
| published_verified_at | INTEGER | não |  | — |
| published_updated_at | INTEGER | não |  | — |
| position_label | TEXT | não |  | — |
| position_description | TEXT | não |  | — |
| location_state | TEXT | sim |  | 'declarada' |
| location_confirmed_by | TEXT | não |  | — |
| location_confirmed_at | TEXT | não |  | — |

Referências: `environment_id` → `environments.id` (delete: NO ACTION); `inspection_id` → `inspections.id` (delete: NO ACTION); `unit_id` → `units.id` (delete: NO ACTION).

## miscellaneous_locks

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| equipment_id | TEXT | não | 1 | — |
| user_id | TEXT | sim |  | — |
| token | TEXT | sim |  | — |
| expires_at | INTEGER | sim |  | — |

Referências: `equipment_id` → `miscellaneous_equipments.id` (delete: NO ACTION).

## missing_equipment_cases

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| id | TEXT | não | 1 | — |
| equipment_id | TEXT | sim |  | — |
| unit_id | TEXT | sim |  | — |
| inspection_id | TEXT | sim |  | — |
| state | TEXT | sim |  | 'open' |
| reason | TEXT | sim |  | — |
| created_by | TEXT | sim |  | — |
| created_at | INTEGER | sim |  | — |
| resolved_by | TEXT | não |  | — |
| resolved_at | INTEGER | não |  | — |

Referências: `equipment_id` → `equipments.id` (delete: NO ACTION).

## panel_collection_counts

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| state | TEXT | não | 1 | — |
| total | INTEGER | sim |  | — |

## panel_collection_states

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| unit_id | TEXT | não | 1 | — |
| state | TEXT | não |  | — |

Referências: `unit_id` → `units.id` (delete: CASCADE).

## panel_hardware_active

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| notification_id | TEXT | não | 1 | — |
| unit_id | TEXT | sim |  | — |
| detected_at | INTEGER | sim |  | — |
| state | TEXT | sim |  | — |

Referências: `notification_id` → `agent_notifications.id` (delete: CASCADE).

## panel_hardware_counts

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| unit_id | TEXT | não | 1 | — |
| pending | INTEGER | sim |  | — |
| demands | INTEGER | sim |  | — |

## panel_read_versions

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| name | TEXT | sim | 1 | — |
| epoch | TEXT | sim |  | — |
| revision | INTEGER | sim |  | 0 |

## photo_deletion_queue

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| object_key | TEXT | não | 1 | — |
| deletion_id | TEXT | sim |  | — |
| created_at | INTEGER | sim |  | — |
| storage_provider | TEXT | sim |  | 'r2' |
| storage_ref | TEXT | não |  | — |

## provider_report_schedule

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| id | INTEGER | não | 1 | — |
| started_at | TEXT | sim |  | — |
| next_due_at | TEXT | sim |  | — |

## provider_reports

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| id | TEXT | não | 1 | — |
| period_key | TEXT | sim |  | — |
| kind | TEXT | sim |  | — |
| scheduled_at | TEXT | sim |  | — |
| generated_at | TEXT | sim |  | — |
| missed_weeks | INTEGER | sim |  | 0 |
| unit_count | INTEGER | sim |  | — |
| with_provider | INTEGER | sim |  | — |
| report_json | TEXT | sim |  | — |

## published_equipment_counts

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| unit_id | TEXT | sim | 1 | — |
| category | TEXT | sim | 2 | — |
| records | INTEGER | sim |  | 0 |
| items | INTEGER | sim |  | 0 |

## published_unit_status

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| unit_id | TEXT | não | 1 | — |
| visits | INTEGER | sim |  | 0 |
| latest | INTEGER | não |  | — |
| environment_count | INTEGER | sim |  | 0 |

## root_deletion_guard

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| id | TEXT | não | 1 | — |
| valid | INTEGER | sim |  | — |

## root_deletions

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| id | TEXT | não | 1 | — |
| unit_id | TEXT | sim |  | — |
| actor_id | TEXT | sim |  | — |
| unit_json | TEXT | sim |  | — |
| impact_json | TEXT | sim |  | — |
| reason | TEXT | sim |  | — |
| created_at | INTEGER | sim |  | — |

## service_request_counts

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| scope | TEXT | sim | 1 | — |
| status | TEXT | sim | 2 | — |
| total | INTEGER | sim |  | — |

## service_request_events

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| operation_id | TEXT | não | 1 | — |
| request_id | TEXT | sim |  | — |
| actor_id | TEXT | sim |  | — |
| actor_name | TEXT | sim |  | — |
| payload_json | TEXT | sim |  | — |
| snapshot_json | TEXT | sim |  | — |
| note | TEXT | sim |  | — |
| created_at | INTEGER | sim |  | — |

Referências: `request_id` → `service_requests.id` (delete: NO ACTION).

## service_requests

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| id | TEXT | não | 1 | — |
| number | INTEGER | sim |  | — |
| unit_id | TEXT | sim |  | — |
| equipment_id | TEXT | não |  | — |
| context_json | TEXT | sim |  | — |
| description | TEXT | sim |  | — |
| kind | TEXT | sim |  | — |
| source | TEXT | sim |  | — |
| requester | TEXT | sim |  | '' |
| status | TEXT | sim |  | — |
| responsible | TEXT | sim |  | '' |
| scheduled_date | TEXT | sim |  | '' |
| version | INTEGER | sim |  | 1 |
| created_at | INTEGER | sim |  | — |
| created_by | TEXT | sim |  | — |
| updated_at | INTEGER | sim |  | — |
| last_operation | TEXT | sim |  | — |

## sessions

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| token_hash | TEXT | não | 1 | — |
| user_id | TEXT | sim |  | — |
| csrf | TEXT | sim |  | — |
| expires_at | INTEGER | sim |  | — |
| created_at | INTEGER | sim |  | — |
| credential_version | INTEGER | sim |  | 0 |
| user_agent | TEXT | sim |  | '' |

Referências: `user_id` → `users.id` (delete: NO ACTION).

## settings

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| key | TEXT | não | 1 | — |
| value | INTEGER | sim |  | — |

## technician_avatar_events

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| operation_id | TEXT | não | 1 | — |
| user_id | TEXT | sim |  | — |
| actor_id | TEXT | sim |  | — |
| action | TEXT | sim |  | — |
| previous_id | TEXT | não |  | — |
| image_id | TEXT | não |  | — |
| version | INTEGER | sim |  | — |
| created_at | INTEGER | sim |  | — |

Referências: `user_id` → `users.id` (delete: NO ACTION).

## technician_avatar_uploads

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| id | TEXT | não | 1 | — |
| user_id | TEXT | sim |  | — |
| actor_id | TEXT | sim |  | — |
| expected_version | INTEGER | sim |  | — |
| sha256 | TEXT | sim |  | — |
| byte_size | INTEGER | sim |  | — |
| object_key | TEXT | sim |  | — |
| storage_provider | TEXT | sim |  | — |
| storage_ref | TEXT | não |  | — |
| state | TEXT | sim |  | — |
| created_at | INTEGER | sim |  | — |
| upload_token | TEXT | não |  | — |
| upload_until | INTEGER | não |  | — |

Referências: `actor_id` → `users.id` (delete: NO ACTION); `user_id` → `users.id` (delete: NO ACTION).

## technician_profiles

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| user_id | TEXT | não | 1 | — |
| image_id | TEXT | não |  | — |
| version | INTEGER | sim |  | 0 |
| last_operation | TEXT | não |  | — |
| updated_at | INTEGER | não |  | — |
| updated_by | TEXT | não |  | — |

Referências: `image_id` → `technician_avatar_uploads.id` (delete: NO ACTION); `user_id` → `users.id` (delete: NO ACTION).

## unit_assignments

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| user_id | TEXT | sim | 1 | — |
| unit_id | TEXT | sim | 2 | — |
| assigned_by | TEXT | sim |  | — |
| assigned_at | INTEGER | sim |  | — |

Referências: `assigned_by` → `users.id` (delete: NO ACTION); `unit_id` → `units.id` (delete: NO ACTION); `user_id` → `users.id` (delete: NO ACTION).

## unit_changes

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| id | INTEGER | não | 1 | — |
| actor_id | TEXT | sim |  | — |
| event | TEXT | sim |  | — |
| target_id | TEXT | sim |  | — |
| payload | TEXT | sim |  | — |
| created_at | INTEGER | sim |  | — |

## unit_collection_review_history

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| operation_id | TEXT | não | 1 | — |
| unit_id | TEXT | sim |  | — |
| before_status | TEXT | sim |  | — |
| after_status | TEXT | sim |  | — |
| version | INTEGER | sim |  | — |
| actor_id | TEXT | sim |  | — |
| actor_name | TEXT | sim |  | — |
| created_at | INTEGER | sim |  | — |

## unit_collection_reviews

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| unit_id | TEXT | não | 1 | — |
| status | TEXT | sim |  | — |
| version | INTEGER | sim |  | — |
| actor_id | TEXT | sim |  | — |
| actor_name | TEXT | sim |  | — |
| updated_at | INTEGER | sim |  | — |
| operation_id | TEXT | sim |  | — |

## unit_collection_totals

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| unit_id | TEXT | não | 1 | — |
| records | INTEGER | sim |  | 0 |
| items | INTEGER | sim |  | 0 |
| problems | INTEGER | sim |  | 0 |

## units

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| id | TEXT | não | 1 | — |
| name | TEXT | sim |  | — |
| name_key | TEXT | sim |  | — |
| code | TEXT | não |  | — |
| address | TEXT | sim |  | '' |
| neighborhood | TEXT | sim |  | '' |
| latitude | REAL | não |  | — |
| longitude | REAL | não |  | — |
| active | INTEGER | sim |  | 1 |
| version | INTEGER | sim |  | 1 |
| created_at | INTEGER | sim |  | — |
| updated_at | INTEGER | sim |  | — |
| manager_name | TEXT | sim |  | '' |
| unit_type | TEXT | sim |  | '' |
| region | TEXT | sim |  | '' |
| phone | TEXT | sim |  | '' |
| email | TEXT | sim |  | '' |
| students_total | INTEGER | não |  | — |
| students_daycare | INTEGER | não |  | — |
| students_preschool | INTEGER | não |  | — |
| students_early_years | INTEGER | não |  | — |
| students_final_years | INTEGER | não |  | — |
| students_eja | INTEGER | não |  | — |
| classes_total | INTEGER | não |  | — |
| seats_available | INTEGER | não |  | — |
| capacity_total | INTEGER | não |  | — |
| staff_total | INTEGER | não |  | — |
| teachers_total | INTEGER | não |  | — |
| building_code | TEXT | sim |  | '' |
| notes | TEXT | sim |  | '' |
| figures_source | TEXT | sim |  | '' |
| figures_reference_date | TEXT | não |  | — |
| official_name | TEXT | não |  | — |
| secretary_name | TEXT | não |  | — |
| school_zone | TEXT | não |  | — |
| school_shifts | TEXT | não |  | — |
| full_time | TEXT | não |  | — |
| shared_building | TEXT | não |  | — |
| pdde_status | TEXT | não |  | — |
| census_pending | TEXT | não |  | — |
| sports_court | TEXT | não |  | — |
| video_monitoring | TEXT | não |  | — |
| classrooms_total | INTEGER | não |  | — |
| classrooms_in_use | INTEGER | não |  | — |
| students_eja_initial | INTEGER | não |  | — |
| students_eja_final | INTEGER | não |  | — |
| waiting_daycare | INTEGER | não |  | — |
| waiting_preschool | INTEGER | não |  | — |
| waiting_elementary | INTEGER | não |  | — |
| staff_management | INTEGER | não |  | — |
| staff_pedagogical | INTEGER | não |  | — |
| staff_administrative | INTEGER | não |  | — |
| staff_food | INTEGER | não |  | — |
| staff_maintenance | INTEGER | não |  | — |
| staff_security | INTEGER | não |  | — |
| staff_educa_paco | INTEGER | não |  | — |
| staff_other | INTEGER | não |  | — |
| staff_permanent | INTEGER | não |  | — |
| staff_temporary | INTEGER | não |  | — |
| staff_commissioned | INTEGER | não |  | — |

## users

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| id | TEXT | não | 1 | — |
| username | TEXT | sim |  | — |
| role | TEXT | sim |  | — |
| password_hash | TEXT | sim |  | — |
| salt | TEXT | sim |  | — |
| active | INTEGER | sim |  | 1 |
| must_change | INTEGER | sim |  | 1 |
| temporary_expires | INTEGER | não |  | — |
| created_at | INTEGER | sim |  | — |
| credential_version | INTEGER | sim |  | 0 |
| display_name | TEXT | sim |  | '' |
| last_login_at | INTEGER | não |  | — |

## visit_answers

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| inspection_id | TEXT | não | 1 | — |
| data_json | TEXT | sim |  | '{}' |
| version | INTEGER | sim |  | 1 |
| updated_by | TEXT | sim |  | — |
| updated_at | INTEGER | sim |  | — |

Referências: `inspection_id` → `inspections.id` (delete: NO ACTION).

## Views e triggers

- `collection_review_audit_insert` (trigger, unit_collection_reviews)
- `collection_review_audit_update` (trigger, unit_collection_reviews)
- `coverage_environments_delete` (trigger, environments)
- `coverage_environments_insert` (trigger, environments)
- `coverage_environments_update` (trigger, environments)
- `coverage_equipments_delete` (trigger, equipments)
- `coverage_equipments_insert` (trigger, equipments)
- `coverage_equipments_update` (trigger, equipments)
- `coverage_miscellaneous_equipments_delete` (trigger, miscellaneous_equipments)
- `coverage_miscellaneous_equipments_insert` (trigger, miscellaneous_equipments)
- `coverage_miscellaneous_equipments_update` (trigger, miscellaneous_equipments)
- `coverage_photos_delete` (trigger, collection_photos)
- `coverage_photos_insert` (trigger, collection_photos)
- `coverage_photos_update` (trigger, collection_photos)
- `coverage_sections_delete` (trigger, inspection_sections)
- `coverage_sections_insert` (trigger, inspection_sections)
- `coverage_sections_update` (trigger, inspection_sections)
- `coverage_unit_delete` (trigger, units)
- `coverage_visit_delete` (trigger, visit_answers)
- `coverage_visit_insert` (trigger, visit_answers)
- `coverage_visit_update` (trigger, visit_answers)
- `dispatch_assignment_ended` (trigger, dispatch_assignments)
- `dispatch_assignment_max` (trigger, dispatch_assignments)
- `dispatch_attendance_ended` (trigger, dispatch_attendances)
- `dispatch_open_assigned` (trigger, dispatch_assignments)
- `dispatch_open_assignment_deleted` (trigger, dispatch_assignments)
- `dispatch_open_request_status` (trigger, service_requests)
- `dispatch_open_unassigned` (trigger, dispatch_assignments)
- `dispatch_request_changed` (trigger, service_requests)
- `dispatch_request_completed` (trigger, service_requests)
- `dispatch_request_insert` (trigger, service_requests)
- `dispatch_road_route_attendance_ended` (trigger, dispatch_attendances)
- `dispatch_road_route_position_deleted` (trigger, dispatch_positions)
- `dispatch_road_route_queue_changed` (trigger, dispatch_meta)
- `dispatch_session_removed` (trigger, sessions)
- `dispatch_technician_disabled` (trigger, dispatch_technicians)
- `dispatch_tracking_credentials` (trigger, users)
- `dispatch_tracking_disabled` (trigger, dispatch_technicians)
- `dispatch_tracking_ended` (trigger, dispatch_tracking)
- `dispatch_tracking_last_completed` (trigger, service_requests)
- `dispatch_tracking_last_unassigned` (trigger, dispatch_assignments)
- `dispatch_tracking_position_deleted` (trigger, dispatch_tracking_positions)
- `dispatch_tracking_queue_changed` (trigger, dispatch_meta)
- `dispatch_tracking_session_revoked` (trigger, sessions)
- `dispatch_user_disabled` (trigger, users)
- `equipment_deleted_identity` (trigger, equipments)
- `equipment_totals_delete` (trigger, equipments)
- `equipment_totals_insert` (trigger, equipments)
- `equipment_totals_update` (trigger, equipments)
- `misc_deleted_identity` (trigger, miscellaneous_equipments)
- `misc_equipment_totals_delete` (trigger, miscellaneous_equipments)
- `misc_equipment_totals_insert` (trigger, miscellaneous_equipments)
- `misc_equipment_totals_update` (trigger, miscellaneous_equipments)
- `misc_progress_equipment_insert` (trigger, miscellaneous_equipments)
- `misc_progress_equipment_update` (trigger, miscellaneous_equipments)
- `misc_published_equipment_update` (trigger, miscellaneous_equipments)
- `panel_collection_count_delete` (trigger, panel_collection_states)
- `panel_collection_count_insert` (trigger, panel_collection_states)
- `panel_collection_count_update` (trigger, panel_collection_states)
- `panel_collection_unit_insert` (trigger, units)
- `panel_collection_unit_update` (trigger, units)
- `panel_collection_visit_delete` (trigger, inspections)
- `panel_collection_visit_insert` (trigger, inspections)
- `panel_collection_visit_update` (trigger, inspections)
- `panel_hardware_count_delete` (trigger, panel_hardware_active)
- `panel_hardware_count_insert` (trigger, panel_hardware_active)
- `panel_hardware_equipment_move` (trigger, equipments)
- `panel_hardware_equipments_delete` (trigger, equipments)
- `panel_hardware_equipments_insert` (trigger, equipments)
- `panel_hardware_notification_delete` (trigger, agent_notifications)
- `panel_hardware_notification_insert` (trigger, agent_notifications)
- `panel_hardware_notification_update` (trigger, agent_notifications)
- `panel_hardware_request_delete` (trigger, service_requests)
- `panel_hardware_request_insert` (trigger, service_requests)
- `panel_hardware_request_update` (trigger, service_requests)
- `panel_hardware_review_delete` (trigger, agent_hardware_reviews)
- `panel_hardware_review_insert` (trigger, agent_hardware_reviews)
- `panel_hardware_review_update` (trigger, agent_hardware_reviews)
- `panel_hardware_units_delete` (trigger, units)
- `panel_hardware_units_insert` (trigger, units)
- `panel_revision_agent_devices_delete` (trigger, agent_devices)
- `panel_revision_agent_devices_insert` (trigger, agent_devices)
- `panel_revision_agent_devices_update` (trigger, agent_devices)
- `panel_revision_agent_equipment_links_delete` (trigger, agent_equipment_links)
- `panel_revision_agent_equipment_links_insert` (trigger, agent_equipment_links)
- `panel_revision_agent_equipment_links_update` (trigger, agent_equipment_links)
- `panel_revision_computer_context_delete` (trigger, computer_context)
- `panel_revision_computer_context_insert` (trigger, computer_context)
- `panel_revision_computer_context_update` (trigger, computer_context)
- `panel_revision_equipments_delete` (trigger, equipments)
- `panel_revision_equipments_fleet_delete` (trigger, equipments)
- `panel_revision_equipments_fleet_insert` (trigger, equipments)
- `panel_revision_equipments_fleet_update` (trigger, equipments)
- `panel_revision_equipments_insert` (trigger, equipments)
- `panel_revision_equipments_update` (trigger, equipments)
- `panel_revision_inspection_sections_delete` (trigger, inspection_sections)
- `panel_revision_inspection_sections_insert` (trigger, inspection_sections)
- `panel_revision_inspection_sections_update` (trigger, inspection_sections)
- `panel_revision_inspections_delete` (trigger, inspections)
- `panel_revision_inspections_insert` (trigger, inspections)
- `panel_revision_inspections_update` (trigger, inspections)
- `panel_revision_miscellaneous_equipments_delete` (trigger, miscellaneous_equipments)
- `panel_revision_miscellaneous_equipments_fleet_delete` (trigger, miscellaneous_equipments)
- `panel_revision_miscellaneous_equipments_fleet_insert` (trigger, miscellaneous_equipments)
- `panel_revision_miscellaneous_equipments_fleet_update` (trigger, miscellaneous_equipments)
- `panel_revision_miscellaneous_equipments_insert` (trigger, miscellaneous_equipments)
- `panel_revision_miscellaneous_equipments_update` (trigger, miscellaneous_equipments)
- `panel_revision_units_delete` (trigger, units)
- `panel_revision_units_insert` (trigger, units)
- `panel_revision_units_update` (trigger, units)
- `panel_revision_visit_answers_delete` (trigger, visit_answers)
- `panel_revision_visit_answers_insert` (trigger, visit_answers)
- `panel_revision_visit_answers_update` (trigger, visit_answers)
- `progress_equipment_insert` (trigger, equipments)
- `progress_equipment_update` (trigger, equipments)
- `provider_reports_immutable` (trigger, provider_reports)
- `published_equipment_update` (trigger, equipments)
- `service_request_count_delete` (trigger, service_requests)
- `service_request_count_insert` (trigger, service_requests)
- `service_request_count_update` (trigger, service_requests)
- `inventory_equipment_all` (view, inventory_equipment_all)
- `panel_collection_state_source` (view, panel_collection_state_source)
- `panel_hardware_source` (view, panel_hardware_source)
