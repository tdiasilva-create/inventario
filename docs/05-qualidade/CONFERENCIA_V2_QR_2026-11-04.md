# Conferência objetiva — Coletor V2 + vínculo de computadores por QR Code (04/11/2026)

Resposta ao item "INÍCIO DO TRABALHO SOLICITADO" de `PEDIDO_IMPLEMENTACAO_CLAUDE_V2_QR_2026-11-04.txt`. Estado lido diretamente da pasta de trabalho `C:\Users\SIGAE\Documents\Codex\INVENTARIO` às 10h20 (America/Fortaleza); a pasta foi alterada de novo hoje às 09h (galeria de fotos parciais; PENDENCIAS/RASTREABILIDADE) e essas alterações foram incorporadas à cópia usada. Nada foi publicado; nenhum segredo, migração remota ou dado oficial foi tocado.

## 1. Fontes disponíveis e verificadas

| Fonte | Situação |
|---|---|
| Repositório (web/, server/, migrations 0001–0013, tests/, scripts/, docs/, wrangler*.jsonc) | Copiado integralmente; `npm test` no estado recebido: **60/60**. |
| `SEMED_Questionario_Reformulado_V2.txt` | Lido integral; SHA-256 `d25b9394…ea7` confere com o Anexo A. |
| `docs/02-coleta-mobile/BASE_DE_COLETA_V1_0_ORIGINAL.txt` e derivados 02–06 | Disponíveis na cópia; preservados. |
| Governança (D-046 a D-052, PENDENCIAS, RASTREABILIDADE, CONFLITOS) | Lidos; D-052 aprova a V2 e mantém quatro perfis. |
| `REVISAO_PACOTE_AGENTE_SEMED_0_1_6.txt` + `revisoes/agente-0.1.6-fonte/` (contract, mock-server, modulo-servidor, migrations, docs) e `revisoes/agente-0.1.6-analise/` | Lidos; digest técnico em `docs/04-dados-apis/DIGEST_AGENTE_0_1_6.md`. |
| Fontes C# do agente (`agent/src/Semed.Agent.Core/**`: Signing, ApiClient, AgentEngine, Models, QrEncoder) | Lidos para confirmar o que o EXE realmente envia (rotas, cabeçalhos, QR). |
| `contract/test-vectors/signatures.json` | **15/15 vetores** (Web Crypto e .NET, positivos e negativos) verificados pelo nosso `server/agent-crypto.mjs`. |
| Google Drive (D-048) e galeria de fotos parciais (04/11) | Preservados: `photo-storage.mjs`, `google-auth.mjs`, `in-progress-photos.mjs`, `desktop-progress-photos.*` intocados. |
| Referências visuais (design/) | Não copiadas nesta etapa; aparência clara/teal do coletor V2 (D-040) mantida, sem redesenho. |

## 2. Divergências reais encontradas (código × Anexo A / contrato)

Matriz completa (119 itens, file:line) em `docs/05-qualidade/MATRIZ_COBERTURA_V2.md`. Resumo do que **bloqueia ou distorce**:

Coletor/servidor V2
1. 4.2 — `registration` aceita só `Manual`; servidor rejeita qualquer outro valor (`collector-v2-schema.js:18–19`). Sem modo "Agente Windows + QR Code".
2. 4.M1 — `manualReason` condicionado à categoria, não ao modo manual.
3. 2.L11 — `schoolWifi` obrigatório no "Resultado externo manual" (bloqueio além da spec).
4. 7.C1 — situação opcional da categoria inexistente.
5. 5.1 — `physicalChanged` fica gravado no bem e reaparece em visitas futuras exigindo foto nova sem alteração.
6. Mensagem legada "(grupo B)" na V2; rótulos 4.7 ("Funcionando normalmente") divergem do texto exibido.
7. §7 — ambiente com nome igual é reutilizado sem aviso; sem aviso de nomes semelhantes.
8. §14 — telefone do acompanhante devolvido ao visualizador sem restrição.
9. 7.1 — revisão só lista pendências, não os registros.

Painel
10. `desktop-inventory.js:11` renderiza vistorias V2 com o esquema legado (A=Identificação, D=Rede interna…, B/E vazias; chaves V2 não aparecem).
11. `desktop-progress.js:13` mostra "B/E Pendente" e "G Recursos audiovisuais" em coletas V2.
12. `desktop-results.js:8` conta "Não testado" e ignora "Não foi possível testar" (V2).
13. Ficha de equipamento omite campos V2 (`registration`, `assetStatus`, `origin`, `connection`, `ip`, `ssid`…); "Sem agente" não é exibido; `missing` (Não localizado) não é mostrado.

Pacote do agente 0.1.6 (reproduzidos pela revisão; confirmados no código)
14. R1 `checkPairingCode` (W:556) e `claimAtomic` (D1:202) não verificam dispositivo revogado; `revokeDevice` não anula o pedido pendente.
15. R2 `putClaimRequest` (W:775) fora do batch do vínculo.
16. R3 presença gravada incondicionalmente (`setPresence`, D1:278) após ler-modificar-escrever.
17. R4 `challenge-ip`/`enroll-ip` 30/h por IP (W:340, 379) antes do limite por autorização.
18. R5 `pairingCatalog` e `pairingPreview` com N+1 e `LIMIT 2000` (CAT:51).
19. Núcleo rejeita o perfil `admin` (W:270); `sistema.mjs` devolve `LOGIN_NAO_INTEGRADO`.
20. Ambiguidades do contrato (DIGEST G.4): `inspection_id` obrigatório no schema × opcional no código; `equipment_status` 'rascunho' × 'rascunho_parcial'; `serial_hint` 4 × 6 caracteres; OpenAPI sem as rotas 0.1.6 (grants GET/revoke, catalog, max_uses); `/health` no roteador de produção.

Decisões já dadas e respeitadas (não reabertas): quatro perfis; internet sem ambientes; H copiada de visita anterior como "Concluído" (D-052 — assinalado para confirmação, não alterado).

## 3. Arquivos alterados/criados nesta entrega (estado às 10h40; a lista final acompanha o pacote)

Já implementado e testado localmente
- `server/agent-crypto.mjs` (novo) — verificação ECDSA P-256/P1363, thumbprint RFC 7638, string canônica; 15/15 vetores.
- `migrations/0014_agentes.sql` (nova, aditiva) — tabelas `agent_*` do pacote renumeradas + colunas de localização confirmada em `equipments` (`position_label`, `position_description`, `location_state`, `location_confirmed_by/at`) + colunas de presença monotônica.
- `server/agentes/nucleo/{worker,d1-store,store,catalogo,crypto,validate}.mjs` — núcleo do pacote copiado (hashes registrados) com patches marcados `[SEMED]`: quatro perfis; R1 (guard de dispositivo dentro do batch + recusa na prévia); R2 (recibo no mesmo batch; resposta determinística); R3 (`setPresenceIfNewer` condicional em SQL); R4 (limite por IP 600/h, por autorização mantido); R5 (catálogo/prévia paginados por cursor com vínculo ativo embutido, sem N+1); diagnóstico de QR consumido antes das checagens de ficha.
- `server/agentes/catalogo.mjs` (novo) — adaptador para `units/environments/inspections/equipments` reais; atualização de localização altera coluna **e** `data_json` (+`registration='Agente'`) com versão e `collection_history` na mesma transação; criação de ficha pelo vínculo desligada (ficha nasce pelo fluxo normal do coletor).
- `server/agentes/index.mjs` (novo) — montagem: 9 rotas de máquina antes da sessão e sem Origin; 10 rotas humanas após sessão + CSRF do Worker.
- `server/worker.mjs` — despacho das rotas do módulo (máquina antes do filtro Origin; humanas antes de collector/unitRoutes).
- `tests/helpers/agent-client.mjs`, `tests/agentes.test.mjs` (novos) — 5 testes ponta a ponta no Worker: grant só root; cadastro assinado sem Origin; assinatura adulterada/replay/relógio; prévia e claim com CSRF; ficha existente mantém ID e versão+1; `request_id` repetido devolve o mesmo recibo; QR consumido; `confirm-device`; heartbeat/inventário e `agent-status`; R1 (revogado antes e durante), R2 (falha após gravar → repetição devolve o recibo), R3 (sequência atrasada, novo boot), R4 (40 desafios no mesmo IP; abuso ainda 429), R5 (61 fichas em 2 páginas, <12 consultas por página, busca). **Suíte completa: 65/65.**

Próximas fatias (ordem de execução)
- Fase 1 — `web/collector-v2-schema.js` (modo Agente, `manualReason`, `schoolWifi`, 7.C1, rótulos), `server/collector-v2.mjs` (vínculo obrigatório para concluir F quando modo Agente; `physicalChanged` por visita), `server/collector.mjs` (aviso de ambiente semelhante; telefone restrito), `web/collector-v2.js` (revisão com resumo).
- Fase 3 — `web/collector-qr.js` (novo; BarcodeDetector + `web/vendor/jsqr/` Apache-2.0 local), fluxo QR na ficha V2, `scripts/build-collector.mjs`, teste browser.
- Fase 4 — `web/desktop-inventory.js`, `desktop-progress.js`, `desktop-results.js`, `desktop.js` (esquema por versão; ficha do computador com dados do agente via `/api/inventory/agent-status`).
- Entrega — relatórios da seção 18, DECISOES (proposta D-053), PENDENCIAS, RASTREABILIDADE.

## 4. Primeiro conjunto de testes (executáveis agora)

`npm test` (65) inclui: `tests/agentes.test.mjs` (QR01 parcial, QR04, QR05/QR06, QR08/QR09/QR10, QR11, QR12, QR13, T03/T04, T09/T10, P03 parcial), `tests/collector-v2.test.mjs` (Q04–Q08, Q11–Q17, Q21–Q23), `tests/photo-storage.test.mjs` + `google-worker.test.mjs` (F05, F08–F10), demais regressões. Testes browser (`collector-v2-browser.cjs`, `collector-evidence-browser.cjs`) fora do `npm test`, a executar na Fase 3.

Não executado e não homologado: celulares físicos (QR02/QR03, F01–F04), EXE real em Windows (QR01 completo, T01/T02/T05–T08), carga em produção, offline (S04), unificação (S05).
