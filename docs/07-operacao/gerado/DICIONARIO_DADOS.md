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

Referências: `unit_id` → `units.id` (delete: NO ACTION).

## equipment_locks

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| equipment_id | TEXT | não | 1 | — |
| user_id | TEXT | sim |  | — |
| token | TEXT | sim |  | — |
| expires_at | INTEGER | sim |  | — |

Referências: `equipment_id` → `equipments.id` (delete: NO ACTION).

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

## photo_deletion_queue

| Coluna | Tipo | NOT NULL | PK | Default |
|---|---|---|---|---|
| object_key | TEXT | não | 1 | — |
| deletion_id | TEXT | sim |  | — |
| created_at | INTEGER | sim |  | — |
| storage_provider | TEXT | sim |  | 'r2' |
| storage_ref | TEXT | não |  | — |

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

- `equipment_totals_insert` (trigger, equipments)
- `equipment_totals_update` (trigger, equipments)
- `misc_equipment_totals_insert` (trigger, miscellaneous_equipments)
- `misc_equipment_totals_update` (trigger, miscellaneous_equipments)
- `misc_progress_equipment_insert` (trigger, miscellaneous_equipments)
- `misc_progress_equipment_update` (trigger, miscellaneous_equipments)
- `misc_published_equipment_update` (trigger, miscellaneous_equipments)
- `progress_equipment_insert` (trigger, equipments)
- `progress_equipment_update` (trigger, equipments)
- `published_equipment_update` (trigger, equipments)
- `inventory_equipment_all` (view, inventory_equipment_all)
