-- Proposta D-047: camada de armazenamento de fotografias com provedor configurável (R2 preservado; Google Drive privado).
-- Migração aditiva: nenhuma linha existente é alterada ou removida.
ALTER TABLE collection_photos ADD COLUMN storage_provider TEXT NOT NULL DEFAULT 'r2';
ALTER TABLE collection_photos ADD COLUMN storage_ref TEXT;
ALTER TABLE photo_deletion_queue ADD COLUMN storage_provider TEXT NOT NULL DEFAULT 'r2';
ALTER TABLE photo_deletion_queue ADD COLUMN storage_ref TEXT;
-- Tokens OAuth do servidor, sempre cifrados (AES-GCM, chave no segredo GOOGLE_TOKEN_KEY). Nunca expostos por rota.
CREATE TABLE integration_tokens(provider TEXT PRIMARY KEY,account_email TEXT,account_name TEXT,scope TEXT NOT NULL,refresh_token_enc TEXT,access_token_enc TEXT,access_token_expires_at INTEGER,folder_id TEXT,folder_name TEXT,connected_by TEXT NOT NULL,connected_at INTEGER NOT NULL,last_refresh_at INTEGER,last_test_at INTEGER,last_test_result TEXT,last_error TEXT,revoked_at INTEGER);
-- Estado anti-CSRF da autorização, vinculado ao usuário root que iniciou, ao cookie Lax do navegador (hash) e com validade curta.
CREATE TABLE integration_oauth_states(state TEXT PRIMARY KEY,provider TEXT NOT NULL,user_id TEXT NOT NULL,created_at INTEGER NOT NULL,expires_at INTEGER NOT NULL,nonce_hash TEXT NOT NULL);
-- Pastas criadas pela aplicação (raiz por conta; uma subpasta por unidade), para não repetir consultas ao Drive.
CREATE TABLE integration_folders(provider TEXT NOT NULL,scope_key TEXT NOT NULL,folder_id TEXT NOT NULL,created_at INTEGER NOT NULL,PRIMARY KEY(provider,scope_key));
-- Trilha específica da integração (conexão, revogação, testes, falhas), complementar à tabela audit.
CREATE TABLE integration_events(id INTEGER PRIMARY KEY AUTOINCREMENT,provider TEXT NOT NULL,event TEXT NOT NULL,actor_id TEXT,detail TEXT,created_at INTEGER NOT NULL);
CREATE INDEX integration_events_time ON integration_events(provider,created_at);
