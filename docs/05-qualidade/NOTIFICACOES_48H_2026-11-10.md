# D-088 — hardware no sino/mapa, comunicação em log e escolas offline

## Fontes e escopo

Pedido direto do responsável: hardware com círculo no mapa e sino abrindo modal; perda fora do sino e após “mais 48”; confirmação por pergunta assíncrona: **“Sim, mais de 48 horas”**; indicador offline acima do online. Implementação/publicação no contexto da autorização contínua de trabalho no ambiente real.

Consultados: `00_LEIA_ANTES_DE_TUDO.md`, `AGENTS.md`, `docs/00-governanca/REGRAS_DE_PRECEDENCIA.md`, `DECISOES.md`, `PENDENCIAS.md`, `CONFLITOS_DOCUMENTAIS.md`, `MONITORAMENTO_E_NOTIFICACOES.md`, `ESCOLAS_ONLINE_2026-11-10.md`, `HARDWARE_MAPA_CLIQUE_2026-11-10.md`, `CORES_CATEGORIAS_MAPA_2026-11-10.md` e `docs/07-operacao/05_PUBLICACAO_E_ROLLBACK.md`. Referências desktop já abertas na fase visual anterior; D-080/D-087 e a composição atual prevalecem sobre o dark-tech original.

Requisitos aplicáveis: decisões administrativas imutáveis/idempotentes; permissões no servidor; estados de presença distintos; PARCIAL explícito; filtros/cores/posição do mapa preservados; não confundir consulta em andamento com conclusão. Nenhuma nova pergunta/requisito da Base de Coleta TXT implementado ou alterado. Demais fases e pendências permanecem fora deste escopo.

Arquivos principais: `server/agent-monitoring.mjs`, novo `server/communication-log.mjs`, `server/hardware-review.mjs`, `server/worker.mjs`; `web/desktop-notifications.js`, `hardware-attention.js`, `school-presence.js`, `desktop.js`, `desktop-blocks.js`, `panel-shell.js`, `painel.css`, novos `communication-log.html/js`; build desktop e testes. [Contrato detalhado](../03-painel-desktop/NOTIFICACOES_E_LOG.md).

## Aceites locais executados

- `pnpm test`: **197/197 aprovados**, incluindo dez cenários do monitor. Limite exato 48 h, primeira perda após 48 h, deduplicação, retorno/novo incidente, suspensão/desligamento, ausência de vínculo, 200 máquinas, falha transacional, heartbeat concorrente, qualidade de hardware, permissões/CSRF/paginação e legado de 17 min.
- Log: hostname/contexto/posição, busca literal (incluindo tentativa de SQL como texto), filtros, 29 eventos em duas páginas; operador/coletor/anônimo recusados, admin/visualizador permitidos. Leitura sem escrita. Incidentes curtos antigos mantidos no banco; trocar prazo não registra retorno fictício nem duplica incidente antigo longo.
- `tests/agent-monitoring-browser.cjs`: status muda após 18 min sem criar aviso; após 49 h cria somente log; retorno automático preserva histórico e digitação; erro mantém dados identificados como desatualizados; mapa e sino abrem diretamente antes/depois; aceite retira badge e círculo; histórico acessível pelo filtro; erro/retry, sino na administração, visualizador e viewport 390 px. Worker real com SQLite em memória.
- `tests/hardware-review-browser.cjs`: círculo ancorado à coordenada antes/depois de zoom, movimento reduzido, clique/teclado sem modal automático, resposta perdida sem duplicar demanda, círculo âmbar, aceite, visualizador e mobile.
- `tests/school-presence-browser.cjs`: contagem distinta e tipo/filtro, uma escola com dois PCs, último PC sem comunicação, retorno, escola sem agente, offline acima de online, mesmas consultas compartilhadas, erro não vira zero, mapa preservado, quatro cores e visualizador/390 px. Indicadores também no Mapa da Rede.
- Ambos os builds concluídos: painel 86 arquivos; coletor 54 (somente verificação de compatibilidade, sem publicação do coletor).

## Capturas conferidas visualmente

Diretório local ignorado pelo Git `docs/05-qualidade/evidencias/notificacoes-48h-2026-11-10/`: `log-perda-49-horas.png`, `log-retorno-historico.png`, `mapa-sino-escolas.png`, `sino-modal-hardware.png`, `historico-hardware-sem-contar-no-sino.png`, `log-390.png`. Dados sintéticos explicitamente rotulados; não são produção. Evidências complementares de escolas no diretório `evidencias/escolas-online-2026-11-10/`. Uma captura desse roteiro mostrou tiles externos ainda não carregados; a captura do mapa no roteiro de notificações confirmou a base Ruas carregada. Nenhum dado/parecer/demanda fictício foi escrito na conta real.

## Limites

Não comprova troca física neste turno; detecção depende do próximo inventário confiável recebido do agente. Não testa 48 h esperando relógio real: o limite foi exercitado com relógio/contato controlados no banco isolado. Escola offline não comprova que a internet caiu. Não alterou o indicador de presença para aguardar 48 h. Fotos, QR, EXE e questionário preservados.

## Publicação

Publicado o commit 95fb3b3 em 10/11/2026 às 20:07:30 de Fortaleza (23:07:30 UTC). Painel ativo em 100% na versão cffd8c33-7fec-4a60-8e5e-7a5699fdd885. Sem migração, alteração de segredos ou novos crons. Versão anterior do painel: `78ca889a-b71b-4c7f-bb20-5f5a09164086`; coletor confirmado sem alteração: `274ecd9b-002e-4f79-a4b9-325fc26fece1`. Rollback somente do Worker; não restaurar banco sobre dados recebidos. A versão anterior volta ao prazo/notificações antigos, portanto só usar como retorno deliberado.

Regressões complementares aprovadas: pending-indicators-browser.cjs (três filas, parecer/encaminhamento, atualização e falhas); panel-navigation-browser.cjs (menus, voltar/avançar, timeout/retry e sessão expirada); desktop-identity-browser.cjs (17 rotas, identidade, formulários, filtros, fotos e mobile). Seis roteiros de navegador nesta entrega ao todo. Dry-run dos dois Workers aprovado; somente painel foi publicado. Pacotes reconstruídos após os testes; os 86 arquivos do painel conferidos exatamente contra o manifesto, sem arquivos adicionais.


Preparação: versões ativas dos dois Workers confirmadas por leitura. Cópia de segurança somente das cinco tabelas de monitoramento/pareceres exportada para private-data/release-notifications-48h-2026-11-10/monitor-before.sql (67.181 bytes, SHA-256 D2804ED635600A3DB79421A283CCC420D787F79BB36EA8612F51F38F910C763D). Nenhum dado da cópia foi enviado ao Git. Registro de saúde/contagens anterior em arquivo privado; sem mudança de dados por estas consultas.


Pós-publicação: nove verificações HTTP externas aprovadas (login 200, páginas/assets privados 302 para login e APIs privadas 401 sem sessão). Tráfego/versões dos dois Workers conferidos; cron de minuto e manutenção diária preservados. Três consultas agregadas de leitura no D1 real aprovadas: monitor executado em 10/11/2026 às 23:07:42.725 UTC, depois do deploy; zero perdas abertas acima de 48 h e zero alterações aguardando parecer naquele instante. Os números são instantâneos, não dados fixos da interface. Nenhum incidente ou decisão foi fabricado para validar produção.

A navegação autenticada detalhada foi testada no Worker/SQLite isolado. A conferência remota deste turno validou publicação, proteção HTTP e consultas/saúde no D1; não substitui o aceite físico do responsável com agente real. Logs e metadados remotos em private-data/release-notifications-48h-2026-11-10/. Recarregar abas abertas para receber os scripts novos.

Painel: https://painel-semed-paco.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev/panorama

Log: https://painel-semed-paco.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev/log-comunicacao
