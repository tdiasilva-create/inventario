# Testes do coletor atual — D-089

Usar Node 24, pnpm install --frozen-lockfile e os dois builds. O helper helpers/playwright.cjs usa a dependência do repositório; SEMED_TEST_BROWSER=chromium seleciona Chromium instalado por pnpm exec playwright install chromium. Sem a variável, os roteiros atuais usam Edge neste PC.

Aceite atual:
- pnpm test — validação, permissões, concorrência, idempotência, fotos, versões e contratos compartilhados.
- pnpm test:v3:browser — fluxo atual, QR, fotos, perguntas, conclusão e consulta desktop.
- pnpm test:review-pending:browser — duas fichas em rascunho, diagnóstico individual, abrir ID exato, salvar e concluir manualmente.
- pnpm test:collector-refinement:browser — 210 fichas, busca limitada, páginas acumuladas, teclado em viewport reduzido, retorno, sessão expirada/mesmo usuário, resposta atrasada, reabertura e links ocultos.
- pnpm test:ux:browser e pnpm test:identity:browser — foco, cursor, composição e viewport.
- pnpm test:environments:browser, pnpm test:environment-edit:browser e pnpm test:auth:browser — ambientes compartilhados/renomeação e acesso dos dois ambientes.

Todos usam dados isolados. Capturas podem ser geradas em docs/05-qualidade/evidencias; não incluem dados da produção. Emulação NÃO homologa teclado, câmera ou QR físico de Android/iPhone.

## Roteiros históricos retirados do aceite atual (CL-16)

collector-evidence-browser.cjs, collector-v2-qr-lost-response-browser.cjs e desktop-v2-agent-browser.cjs pressupõem telas e rótulos anteriores. Foram preservados como referência histórica; não são chamados pelo CI nem apresentados como testes aprovados do produto atual. O carregamento do Playwright passa pelo helper local, sem dependência do USERPROFILE/Codex. Não executar esses três esperando uma homologação V3.

As garantias de recibo/idempotência e conflito de QR continuam nos testes de servidor agentes, v2-fase2 e revisao-independente; o fluxo QR atual está em collector-v3-browser.cjs. O ensaio histórico de resposta perdida no navegador V2 não equivale a uma homologação física atual. panel-blocks-browser.cjs já usa seletores atuais (sem .agent-flag) e continua no CI; não foi aposentado.
