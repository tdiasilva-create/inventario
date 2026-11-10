# D-085 — indicadores separados de pendências, 10/11/2026

Autorização explícita: “vamos com a opção 3, indicadores separados para coletas pendentes, demandas abertas e alertas de hardware aguardando parecer. implemente e publique no ambiente real”. Escopo: somente painel.

## Leitura e requisitos

Consultados `00_LEIA_ANTES_DE_TUDO.md`, `AGENTS.md`, regras de precedência, decisões, pendências e conflitos documentais; manifesto visual e cinco PNGs desktop originais; indicadores, Central de demandas e contratos/aceite de D-070, D-071, D-081, D-083 e D-084. A identidade atual D-065/D-080 prevalece sobre os PNGs originais. A Base de Coleta não foi modificada; nenhuma pergunta nova/removida nesta entrega.

Arquivos de implementação: `server/pending-indicators.mjs`, integração em `server/worker.mjs`, filtro em `server/hardware-review.mjs`; `web/desktop-demand-count.js`, `panel-pulse.js`, `desktop.js`, `hardware-attention.js`, `pending-collections.html/js`, `painel.css`; build, testes e CI. [Contrato e critérios exatos](../03-painel-desktop/INDICADORES_DE_PENDENCIAS.md).

## Aceite local executado

- `pnpm test`: **189 testes aprovados**. Os quatro novos testes cobrem unidades elegíveis, conclusão, revisita, histórico pausado sem duplicação, conclusão sem equipamentos, leitura vs parecer, aceite, encaminhamento/reenvio idempotente, estados de atendimento, reabertura de demanda, paginação acima de 50, filtros literais, permissões, isolamento do coletor e falha D1 sem falso zero.
- `tests/pending-indicators-browser.cjs`: Worker real + SQLite isolado. Três indicadores/escopo global, atualização automática de 15 s, aceite/encaminhamento e atualização imediata, modal por clique, lista de coletas e consulta parcial, filtros/voltar, erro/recuperação, visualizador sem escrita e largura 390 px.
- Regressões de navegador: `panel-mesa-browser.cjs`, `school-presence-browser.cjs`, `hardware-review-browser.cjs`, `panel-blocks-browser.cjs`, `desktop-identity-browser.cjs`, `panel-search-browser.cjs`. Incluem 17 rotas do painel, mapa preservado, escola online, fotos, galeria, busca unificada, identificação de vínculos e navegação/teclado.
- Capturas reais de teste em `docs/05-qualidade/evidencias/indicadores-pendencias-2026-11-10/`: `panorama-tres-indicadores.png`, `hardware-aguardando-parecer.png`, `coletas-pendentes.png`, `falha-explicita.png`, `panorama-390.png`. Rotuladas TESTE LOCAL/Dados sintéticos; não correspondem aos números de produção. Evidências locais ignoradas pelo Git conforme política vigente.
- Build do painel: 82 arquivos, sem inclusão do aplicativo coletor. Validação sintática dos novos módulos e revisão de diferenças. Verificações de links, repositório e dry-run registradas junto à publicação abaixo.

Não houve gravação de coleta, demanda ou parecer na base oficial para testar. Testes de câmera/EXE não se aplicam a esta alteração. Atualização de contagens não é conexão em tempo real: pode levar até 15 s na aba visível, além do tempo da consulta.

## Publicação

Em preparação. Versão anterior conferida: painel `5d01001e-6718-44c8-8399-c9c47e412d8d`; coletor `274ecd9b-002e-4f79-a4b9-325fc26fece1`. Publicar apenas `wrangler.jsonc`, preservando vínculos e segredos existentes. Sem migração.

Registro técnico local: `private-data/release-indicadores-pendencias-2026-11-10/`, excluído do Git. Reversão de código: versão anterior do painel, sem reversão de banco.
