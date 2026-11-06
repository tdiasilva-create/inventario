# Composição do Panorama e Planejamento — D-067

## Pedido, fontes e precedência

Publicação real solicitada expressamente pelo responsável. Dois esclarecimentos incorporados: retirar somente o título da primeira coluna da matriz, mantendo os nomes; conservar blocos também nas telas de origem. D-066 mantém contagens independentes por categoria, apesar do indicador genérico no modelo. D-065 mantém a identidade visual compartilhada. Coletor congelado.

Arquivos recebidos e preservados em `revisoes/painel-layout-2026-11-06/` (privado, fora do Git público):

| Original | SHA-256 |
|---|---|
| painel-pedido-alteracoes_2026-11-06_0655.txt | CC3366FC23C264EB0CCACF2179B687F46D8349E138E30E49516FAB2598C0F046 |
| painel-layout-editado_2026-11-06_0655.json | 1A888026810F65861F0DC70C980640ED256494AE611656C17417658CFEDF7527 |

Consultados: `00_LEIA_ANTES_DE_TUDO.md`, `AGENTS.md`, `REGRAS_DE_PRECEDENCIA.md`, `DECISOES.md`, `PENDENCIAS.md`, `CONFLITOS_DOCUMENTAIS.md`, manifesto e cinco PNGs desktop já abertos nesta conversa, documentação de `docs/03-painel-desktop/`, `docs/05-qualidade/ACEITE.md`, fontes atuais do painel e testes. O pedido posterior altera composição, não requisitos de coleta. Não altera nenhum campo ou pergunta da Base de Coleta original.

## Implementação

| Ordem no Panorama | Posição desktop | Conteúdo e aceite |
|---|---|---|
| 1. Mapa | colunas 1–8, 420 px | Cartografia preservada; contador de computadores funcionando sem cobrir controles |
| 2. Matriz | colunas 9–12, atravessa as três primeiras faixas | Nomes presentes; cabeçalho visual vazio; Notebooks no fim, valores/ações na categoria correta |
| 3. Indicadores | colunas 1–8, mínimo 133 px | D-066 por tipo; quatro indicadores do inventário preservados |
| 4. Filtros | colunas 1–8, mínimo 133 px | Filtros existentes mantidos |
| 5. Unidade selecionada | colunas 1–4 | Nome, gestor, última vistoria confirmada, situação e detalhes |
| 6. Evidência | colunas 5–8, mínimo 462 px | Foto da unidade selecionada, com ampliação protegida |
| 7. Questionário recebido | colunas 9–12 | Respostas da unidade/versão da vistoria; seções expansíveis |
| 8. Galeria | colunas 1–4, 182 px | Uma galeria no Panorama; acesso às fotos da unidade selecionada |
| 9. Resultados da rede | colunas 1–8, mínimo 168 px | Parcialmente funcionando, sem funcionar, não testados e impressoras; funcionando está no mapa |
| 10. Resultados da unidade | colunas 1–8 | Cinco indicadores e impressoras por marca/funcionamento |
| 11. Alertas | colunas 1–5, mínimo 273 px | Prioridades já recebidas, sem nova inferência de criticidade |

Alturas se adaptam ao conteúdo e larguras menores. Matriz mantém rolagem horizontal com nomes fixos. Questionário possui rolagem própria para não sobrepor blocos. Planejamento mantém o aviso atual e recebe a visão de coletas parciais, timestamp e atalhos. Página própria de acompanhamento, detalhe da unidade e Ambientes continuam disponíveis com seus blocos.

Arquivos: `web/desktop.js`, `web/desktop-results.js`, `web/panorama-layout.css`, `web/index.html`, `scripts/build-desktop.mjs` e `tests/desktop-identity-browser.cjs`. Sem alteração do Worker, banco, migrações, segredos, fotografias armazenadas ou coletor.

## Verificação executada

- `pnpm test`: 100 testes aprovados; zero falhas.
- Build desktop: 64 arquivos, sem inclusão do coletor.
- Teste de navegador com Worker e SQLite isolados: 17 rotas, login, formulários, filtros, fotografias contextuais, adaptação a 390 px e ausência de erros JavaScript.
- Casos específicos: onze blocos na ordem aprovada; sem blocos antigos duplicados; Notebooks e seus valores na última coluna; selecionar duas unidades mantém respostas, marca de impressora e foto no mesmo contexto; sete computadores funcionando no cenário isolado e quatro indicadores restantes da rede; acompanhamentos no Planejamento; blocos preservados nas fontes; todos os cenários de D-066.
- Capturas reais da implementação isolada em `docs/05-qualidade/evidencias/layout-panorama-2026-11-06/`: `layout-panorama.png`, `layout-panorama-completo.png`, `layout-panorama-unidade.png`, `layout-panorama-resultados.png`, `layout-planejamento.png` e `mobile-panorama.png`. Evidências privadas fora do Git; registros identificados como TESTE ISOLADO. A foto usada pelo ensaio é um arquivo mínimo de teste, não fotografia oficial.

## Limites e pendências preservadas

As 15 lacunas do anexo continuam não decididas: fachada como imagem principal, fotos por bem, paginação da galeria, estado do agente parcial, discos/telemetria, filtro de categoria da matriz, colunas legadas, seções B/F/G/O vazias, classificação de ocorrências, visão por sala, atualização uniforme, alcance dos filtros, relatórios/exportação/pendências e histórico completo. Não anunciar nenhuma como concluída nesta entrega.

Testes autenticados de interface são locais e isolados; verificações públicas de produção não equivalem a uma sessão autenticada de usuário no ambiente real. Não houve carga de dados fictícios, exclusão de unidade/foto nem operação destrutiva em produção.

## Publicação

Preparação: snapshot privado de deployments, bindings e bundle em `private-data/panel-layout-release/before/`. API Cloudflare voltou a responder HTTP 200. Versões anteriores confirmadas: painel `fb776adf-4b7b-4cac-8aa9-6923bd636144`; coletor `5cf137cd-9c34-4e41-806b-d19cf0887bb6`.

**Publicado e verificado em 06/11/2026:** painel `97d33dfb-8147-4591-9724-f44d8d7bb9ba`, 100% do tráfego. A publicação inclui D-066, antes pendente pelo erro 503, e D-067. Wrangler enviou os cinco assets alterados e preservou os demais. Coletor permanece `5cf137cd-9c34-4e41-806b-d19cf0887bb6`, 100%, sem novo deploy. Snapshot posterior em `private-data/panel-layout-release/after/` confirma bindings existentes, D1 comum, Drive e modo de autorização do agente preservados.

Após publicação: 46 verificações HTTP aprovadas; 13 assets públicos com hashes idênticos ao build; login real renderizado sem erros; novo `/panorama-layout.css` exige autenticação (302 ao login). Não foi realizada sessão autenticada de produção nesta rodada. O teste autenticado das 17 telas usou o código publicado com banco isolado. Resultado público e captura em `producao.json` e `producao-login.png`, na pasta privada de evidências desta entrega.

Endereços reais:

- https://painel-semed-paco.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev/panorama
- https://painel-semed-paco.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev/planejamento
