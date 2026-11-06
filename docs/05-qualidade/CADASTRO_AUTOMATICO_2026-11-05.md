# D-058 — cadastro automático do agente publicado em produção

## Resultado

Publicado em 05/11/2026, sem migração SQL nem instalação de executável nesta estação.

- Coletor: `924126fa-03e0-4df6-99cc-5a18ae799a5b`.
- Painel, versão final: `af6f0d5c-9fa4-472a-8473-2ef7b94e93dc` (sucede `e029d961-f334-4da1-bb39-e406d6180791`, ajuste de texto/contagem da manutenção).
- Dois Workers com `AGENTES_EXIGIR_AUTORIZACAO=nao`, mesmo D1 e Google Drive existente. Segredos não substituídos.
- Backup anterior: `backups/pre-cadastro-automatico-2026-11-05.sql`, 589.853 bytes, fora do Git e dos assets.
- Contagens antes/depois iguais: 71 unidades, 7 usuários, 8 visitas, 8 equipamentos, 0 diversos, 6 fotos, 2 agentes e 2 vínculos. Arquivos de comparação em `backups/*cadastro-automatico-2026-11-05-counts.json`.

Endereços:

https://inventario-semed-lumiar.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev/

https://painel-semed-paco.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev/configuracoes

## Fontes e escopo

Consultados: `00_LEIA_ANTES_DE_TUDO.md`, `AGENTS.md`, `REGRAS_DE_PRECEDENCIA.md`, `DECISOES.md`, `PENDENCIAS.md`, `CONFLITOS_DOCUMENTAIS.md`, `INSTALADOR_OFICIAL.md/json`, `CONTRATO_QR_E_AGENTE.md`, `CONFERENCIA_V2_QR_2026-11-04.md`; documento integral recebido `DUVIDAS_RECEBIDAS_2026-11-05.txt`; análise estática do EXE 0.1.8 preservada em `private-data/analise-instalador-0.1.8/`. Referências visuais/manifesto e documentação original já consultados na fase V3; a alteração desktop limita-se à área de agentes em Configurações, mantendo a identidade visual existente.

Requisitos aplicáveis da Base original preservados: vínculo do computador à unidade oficial, identidade permanente, localização na unidade, autoria/histórico, prevenção de duplicação, permissões no servidor e distinção entre coleta em andamento e indicadores oficiais. A mudança de autorização de instalação vem da decisão posterior D-058; não reinterpreta o TXT. Nenhuma pergunta, foto ou resposta do questionário foi alterada. Offline durável, alertas de hardware e demais pendências permanecem fora desta entrega.

Arquivos alterados: `server/agentes/index.mjs`, `server/agentes/nucleo/worker.mjs`, `d1-store.mjs`, `store.mjs`, novo `enrollment-policy.mjs`, `web/desktop-agents.js`, `wrangler.jsonc`, `wrangler.collector.jsonc`, testes/scripts e documentação. Nova inscrição mantém os formatos de protocolo 1.0 já emitidos pelo EXE 0.1.8. Desafio sem autorização; inscrição ainda assinada. Nenhuma rota anônima recebe inventário completo, atribui escola ou cria ficha escolar.

## Aceite executado

Suíte completa: **94/94 testes**, incluindo sete testes novos. Worker real com SQLite isolado, sem cadastro fictício no D1 oficial.

1. Cadastro sem grant: cria identidade/QR pendentes; nenhum lote consumido ou inventado.
2. Telemetria recusada antes do vínculo, aceita e confirmada por ACK depois do claim V3 por operador; painel consulta a mesma ficha. Sem login/CSRF: recusado.
3. Resposta perdida, desafio anterior expirado e nova tentativa: mesmos IDs recuperados, QR renovável, nenhuma duplicação.
4. Assinatura inválida, reutilização de desafio por outra instalação, corpo inesperado, clonagem e identidade revogada: recusados.
5. Limite por IP 600/h e Retry-After; desativar modo automático impede consumir desafio aberto.
6. 200 cadastros isolados no mesmo IP: 200 IDs e QRs diferentes; zero fichas escolares; zero autorizações.
7. Expiração auditada de 200 cadastros nunca vinculados em uma transação, com cinco instruções SQL, sem uma consulta por máquina. Até 250 por manutenção diária; requests individuais também verificam 30 dias.
8. Não expirar vinculados, cadastros por lote nem novos pendentes; não repetir auditoria; concorrência entre vínculo e expiração não revoga o vinculado. Registros preservados.
9. MemoryStore de testes reproduz a política; produção usa exclusivamente D1Store. Ajustado helper de assinatura adulterada para mudar bits efetivos, evitando depender de padding base64url.

Navegador: Edge headless contra painel/Worker reais em SQLite isolado. Confirmados texto do modo automático, ausência de formulário de lotes, manutenção e erro explícito ao falhar consulta. Sem erros JavaScript. Screenshot: `evidencias/cadastro-automatico-2026-11-05/painel-cadastro-automatico.png`; resultado: `browser.json`. A imagem usa configuração isolada, portanto o bloco de fotos nela não representa o estado do Drive de produção.

Builds: coletor 31 arquivos, painel 46; dry-run Wrangler aprovado nos dois. Deploy confirmado pelos IDs acima. Sonda HTTP real nos dois endereços: login 200; desafio sem Authorization 200; inscrição com assinatura deliberadamente nula 401 AUTH_FAILED; claim sem sessão 401; heartbeat sem identidade 401. Evidência `production-http.json`; script `scripts/verify-open-enrollment.mjs`.

A sonda de produção cria apenas desafios temporários, que expiram em cinco minutos, e contadores de taxa; assinatura inválida impede qualquer computador de teste ser cadastrado. Contagens posteriores confirmam os mesmos dois agentes/vínculos anteriores. Uma primeira execução recebeu 403 por Origin ausente na sonda de claim; corrigida a sonda para enviar Origin válido e verificar então a ausência de sessão (401). Uma consulta de contagens usou tabela inexistente `photos`; foi corrigida para `collection_photos`, sem escrita de dados. Esses ajustes não representaram falhas na versão publicada.

## Limites e continuidade

- O EXE exato 0.1.8 foi analisado estaticamente, não instalado/executado aqui. Compatibilidade de protocolo e testes automatizados não equivalem a homologação física.
- Falta executar o roteiro em dois Windows e no celular: instalação, QR, vínculo, telemetria, reinício, atualização e queda de rede. Instruções em `CADASTRO_AUTOMATICO_AGENTE_SEMED_2026-11-05.txt` na raiz.
- A janela do 0.1.8 pode aguardar cerca de dez minutos até uma nova tentativa após recusa anterior; depende de serviço/rede/energia. O servidor agora aceita o pedido sem grant.
- Expiração após 30 dias é revogação auditada dos nunca vinculados, não exclusão física nem reativação automática da mesma chave. QR de pareamento tem validade independente de dez minutos e não é etiqueta permanente.
- Cadastros iniciais recebem resumo técnico. Não afirmar que estão “sem dados”. Não alteram os indicadores escolares antes do vínculo/publicação apropriados.
- Sem sessão de navegador real automatizável nesta etapa, nenhuma credencial/sessão administrativa foi fabricada. Conferência visual autenticada foi feita localmente; produção foi verificada por deploy, D1 e HTTP.

Se for necessário desativar novas inscrições abertas, definir `AGENTES_EXIGIR_AUTORIZACAO=sim` nos dois Workers e republicar. Isso não desfaz vínculos nem restaura/exclui banco. Configuração de produção é A; manter documentos anteriores apenas como histórico.
