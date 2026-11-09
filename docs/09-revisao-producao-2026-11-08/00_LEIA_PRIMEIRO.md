# Revisão técnica para produção — coletor, painel e servidor

**Data:** 08/11/2026 · **Base revisada:** commit `eddba99` (main) · **Finalidade:** entregar à equipe de produção/Codex um compilado de erros, lógicas não aplicadas, causas da lentidão nas fotografias e melhorias, com referência de arquivo e linha, para iniciar as correções.

> **Releitura de 09/11/2026:** a `main` avançou 8 commits (D-068 a D-071 e auditoria) depois desta revisão. [08_ATUALIZACAO_2026-11-09.md](08_ATUALIZACAO_2026-11-09.md) diz item a item o que foi resolvido (ERR-08, LNA-17, LNA-20, ICO-07/09), o que ficou parcial e o que continua aberto (toda a parte de fotografias e todo o coletor V3), traz a tabela de conversão das linhas citadas para o commit `8e59207` e as observações novas N-01…N-08. As migrações propostas passaram a ser `0019_photo_indexes.sql` e `0020_photo_thumbnails.sql`.

Nenhum arquivo de código foi alterado nesta revisão. Nenhum deploy, migração, credencial ou dado de produção foi tocado. As medições de D1/Drive foram feitas com os fixtures do próprio repositório (SQLite em memória + Drive simulado), não contra produção.

## Como usar esta pasta

| Arquivo | O que contém | Quem lê primeiro |
|---|---|---|
| [01_ERROS_ENCONTRADOS.md](01_ERROS_ENCONTRADOS.md) | 20 defeitos com severidade, arquivo:linha, reprodução, correção e critério de aceite | Desenvolvimento |
| [02_LOGICAS_NAO_APLICADAS.md](02_LOGICAS_NAO_APLICADAS.md) | 19 funções que existem no servidor ou no código mas não chegam ao usuário (botões ausentes, código morto, telas de espera) | Desenvolvimento + responsável |
| [03_DESEMPENHO_FOTOS.md](03_DESEMPENHO_FOTOS.md) | Diagnóstico completo da lentidão das fotografias, números medidos e plano técnico (miniaturas, cache, token, índices, cliente) | Desenvolvimento |
| [04_ICONES_E_EXIBICAO.md](04_ICONES_E_EXIBICAO.md) | Ícones que não funcionam ou não aparecem, forma de exibição das fotos e galerias, CSS | Desenvolvimento + design |
| [05_MELHORIAS_RECOMENDADAS.md](05_MELHORIAS_RECOMENDADAS.md) | Melhorias estruturais: placement do Worker, cache de assets, batch D1, manutenção do código, testes, observabilidade | Arquitetura |
| [06_PLANO_DE_CORRECAO.md](06_PLANO_DE_CORRECAO.md) | Ordem de execução em 5 fases, arquivos a tocar, riscos, testes de regressão e critérios de aceite por fase | Gestão + desenvolvimento |
| [07_INSTRUCAO_CODEX.txt](07_INSTRUCAO_CODEX.txt) | Texto pronto para colar como pedido ao Codex, por fase | Responsável |
| [08_ATUALIZACAO_2026-11-09.md](08_ATUALIZACAO_2026-11-09.md) | Releitura após os commits D-068–D-071: situação de cada item (resolvido/parcial/aberto), observações novas, conversão de linhas e plano ajustado | Todos |
| [evidencias/medir-fotos.mjs](evidencias/medir-fotos.mjs) · [evidencias/medicao-2026-11-08.txt](evidencias/medicao-2026-11-08.txt) | Script de medição (SQLite em memória + Drive simulado) e a saída usada nas tabelas; reexecutar com `node docs/09-revisao-producao-2026-11-08/evidencias/medir-fotos.mjs` a partir da raiz | Desenvolvimento |

Identificadores usados nos arquivos: `ERR-nn` (erro), `LNA-nn` (lógica não aplicada), `FOTO-nn` (fotografias), `ICO-nn` (ícones/exibição), `MEL-nn` (melhoria). Severidade: **Crítico** (afeta todos os usos, hoje), **Alto** (afeta uso frequente), **Médio** (afeta um fluxo ou cresce com o volume), **Baixo** (qualidade/manutenção).

## Resumo executivo

**1. A lentidão das fotografias tem três causas combinadas, todas corrigíveis sem trocar o Google Drive:**

- **Não existe miniatura.** Toda miniatura do coletor, do panorama, da galeria parcial e das ocorrências carrega o **arquivo integral** (até 3 MB, tipicamente 300–800 KB após a redução de 1600 px) vindo do Drive através do Worker (`web/collector-v3.js:40`, `web/desktop.js:72-76`, `web/desktop-results.js:11`, `web/desktop-progress-photos.js:12`).
- **Nada é cacheado.** `server/worker.mjs:121` sobrescreve `Cache-Control: no-store` em **todas** as respostas — fotos, fontes, CSS, JS, Leaflet (147 KB), jsQR (257 KB), imagem de login (2,6 MB). O navegador baixa tudo de novo a cada abertura e a cada vez que uma `<img>` é recriada.
- **O painel recria todas as `<img>` a cada interação.** `web/desktop.js:135` substitui o `innerHTML` de toda a página em cada clique no mapa, em cada tecla digitada na busca (`:158`) e em cada seleção de filtro; a página Ocorrências refaz todas as imagens **a cada 15 segundos** (`web/desktop-results.js:11,16`). Sem cache, cada recriação é um novo download Drive → Worker → navegador.

Medido com os fixtures do repositório: **1 foto lida = 5 consultas D1 + 1 chamada ao Drive**; **1 upload = 13–14 comandos D1 + 2 a 4 chamadas ao Drive**. Uma galeria de 48 miniaturas dispara ~240 consultas D1 e 48 downloads integrais. Com o D1 primário em WEUR (registrado na análise de 05/11) e o Worker executando em GRU, cada consulta sequencial custa uma travessia transatlântica.

**2. Ícones:** não há ícone "quebrado" por nome inexistente no código publicado, mas (a) `desktop-icons.js:33` substitui silenciosamente qualquer nome desconhecido pelo desenho de **monitor** — `app.js` (protótipo não publicado) já usa `arrow` e `save`, que não existem; (b) os símbolos dos assuntos no coletor são renderizados e depois **ocultados por CSS** (`collector-v3.css:17`); (c) vários ícones/botões do painel levam a telas de espera ou não fazem nada (sino, Relatórios, Planejamento, Exportar equipamentos, "Filtros avançados" sem tipo/ano, botão de exemplos do mapa nunca renderizado). Detalhes em `04_ICONES_E_EXIBICAO.md`.

**3. Lógicas não aplicadas:** o servidor já tem conferência de equipamentos (`/api/collector/verify`), sinalização de duplicidade/rascunho/não localizado, exportação CSV da matriz (`desktop.js:152`), alternância dos marcadores de exemplo do mapa e `details` de revisão por item — nenhum deles tem botão ou exibição no coletor V3/painel atual. Lista completa em `02_LOGICAS_NAO_APLICADAS.md`.

**4. O diagnóstico de 05/11 (`docs/05-qualidade/ANALISE_DESEMPENHO_COLETOR_2026-11-05.txt`) continua válido em parte:** o V3 ganhou `AbortController` (30 s) e navegação sem recarga integral, mas ainda bloqueia todos os botões enquanto um salva (`collector-v3.js:154`), ainda recarrega a vistoria inteira depois de cada equipamento/foto (`:66-67`), perdeu o indicador global de rede que o `collector.js:15` tinha, e o `no-store` indiscriminado continua.

## Ordem recomendada (detalhe em 06_PLANO_DE_CORRECAO.md)

1. **Fase 1 — ganhos imediatos, baixo risco (1–2 dias):** cache seletivo no Worker (`no-store` só para HTML/API), cache privado + ETag/304 para fotos, cache do token do Drive em memória, índices em `collection_photos`, upload sem a busca prévia no Drive, imagem de login comprimida, `loading="lazy"` e preservação de `<img>` no painel, Ocorrências sem refazer imagens a cada 15 s.
2. **Fase 2 — miniaturas (2–4 dias):** cliente gera miniatura de 320 px (~15–25 KB) junto da foto; servidor guarda em D1 (`thumb_blob`, migração aditiva 0020 — a 0016–0018 já existem na main); rotas aceitam `size=thumb`; todas as galerias passam a usar a miniatura; o viewer continua integral.
3. **Fase 3 — painel sem recriar a tela inteira (2–3 dias):** busca com debounce e atualização só da lista, mapa persistente entre renders, cache de detalhes com botão "Atualizar", correção do clique na célula da matriz, fachada no cabeçalho.
4. **Fase 4 — coletor V3 (2–3 dias):** indicador global de salvamento, botões de conferência/sinalização na lista, resposta do upload atualiza a galeria sem recarregar a vistoria, HEIC/`createImageBitmap`, tratamento de 401/403.
5. **Fase 5 — estrutural (medir antes):** Smart Placement do Worker junto ao D1, batch das leituras independentes em `equipment-save`/`inspection`, limpeza de código morto, testes de regressão para fotos e cache.

## O que esta revisão NÃO fez

- Não mediu tempos no celular do responsável nem em produção autenticada (limite igual ao da análise de 05/11). Os números aqui são contagens de consultas/chamadas, não milissegundos de produção.
- Não revisou `desktop-agents.js`, `admin-units.js`, `account.js` e `server/agentes/*` (telas administrativas e módulo do agente) além de leitura superficial; o pedido foi coletor e painel.
- Não propõe mudança de perguntas do questionário, de perfis ou de decisões D-0xx. Onde uma correção depende de decisão do responsável, está marcada como **DECISÃO**.

## Fontes consultadas

`README.md`, `AGENTS.md`, `docs/07-operacao/01_ARQUITETURA_ATUAL.md`, `09_ESTADO_E_PENDENCIAS.md`, `docs/05-qualidade/ANALISE_DESEMPENHO_COLETOR_2026-11-05.txt`, `GALERIA_FOTOGRAFIAS_2026-11-05.md`, `docs/06-entregas/MAPEAMENTO_COLETOR_PARA_PAINEL_DESKTOP_2026-11-05.txt`, `wrangler.jsonc`, `wrangler.collector.jsonc`, `scripts/build-*.mjs`, `migrations/*.sql`, `.github/workflows/ci.yml`, todo `server/` (exceto `agentes/`) e todo `web/*.js|css|html` não-vendor. Testes `photo-storage`, `photo-gallery`, `in-progress-photos` e `collector-v3` executados localmente (18/18 aprovados) e script de medição próprio sobre os mesmos fixtures.
