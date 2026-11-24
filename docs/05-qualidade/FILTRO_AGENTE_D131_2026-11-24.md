# D131 — filtro de agente: testes e publicação

24/11/2026. Branch `codex/filtro-agente-internet-d131`. **Publicado após autorização específica**, conforme evidência abaixo. [Contrato e decisão](../03-painel-desktop/FILTRO_AGENTE_INTERNET_D131.md).

Consultados entrada, precedência, AGENTS, decisões/pendências/conflitos e referências desktop 00–04 abertas na ordem do manifesto; identidade atual D065/D080, mapa/busca D091/D122, vínculos D127, testes de internet D118, revalidação D110 e criador de rotas D130. Critérios: filtro independente, ao menos uma capacidade suficiente mesmo offline, nenhum SQL extra, busca/filtro/rascunho coerentes, falha explícita e permissões preservadas.

## Execuções e evidências

- Suíte completa `pnpm test:all`: **381 testes aprovados**, zero falhas, cancelamentos ou testes ignorados.
- Conjunto direcionado: **15 testes aprovados**, cobrindo D131, vínculos D127 e revalidação D110. Capacidade fresca após atualização sem invalidar catálogo; versão 0.1.9 sem protocolo declarado não basta; dispositivo revogado, vínculo encerrado e equipamento não computador não contam; cadastro parcial conta. Entrada duplicada, ausente ou inválida é recusada pelo filtro, sem ausência fictícia.
- `tests/map-agent-filter-browser.cjs`: aprovado. Worker real com SQLite isolado e dados TESTE; unidade com um compatível offline e um antigo some; sem agente permanece; busca não reintroduz unidade ocultada; mapa normal/ampliado, rota aberta depois do filtro, descrição preservada durante polling, atualização/downgrade/refiltragem, erro/recuperação, remoção do filtro durante falha e largura 390 px.
- Regressão D130: `tests/map-route-planner-browser.cjs` aprovado, incluindo arraste/setas, prévia, atomicidade, perda de ACK, revisão concorrente, permissões e rascunho durante atualização.
- Busca D122: `tests/panel-unit-search-browser.cjs` aprovado.
- Mapa: `tests/panorama-map-browser.cjs` aprovado, incluindo ampliação, zoom, Escape, sobreposições, atualização e largura móvel.
- Build desktop e `wrangler deploy --dry-run` aprovados, sem publicação real.
- Verificações de documentação (867 links) e índice Git (1.244 arquivos, caminhos privados e padrões conhecidos de segredos) aprovadas; `git diff --check` sem erros.

Capturas reais da implementação com **dados sintéticos**, abertas para comparação de composição/identidade:

- [Mapa com filtro independente](evidencias/filtro-agente-d131-2026-11-24/01-mapa-filtrado.png).
- [Criar rota sobre o mapa filtrado](evidencias/filtro-agente-d131-2026-11-24/02-rota-sobre-filtro.png).
- [390 px](evidencias/filtro-agente-d131-2026-11-24/03-390.png).
- [Resultado estruturado](evidencias/filtro-agente-d131-2026-11-24/resultado.json).

As capturas não apresentam unidades/contagens oficiais. Verificação física de agente/GPS não faz parte desses ensaios; binários inalterados. Nenhuma demanda ou vínculo de teste foi criado no ambiente real.

## Consumo

SQL de catálogo, membros, contatos e demandas permanece idêntico. Ensaio aquecido preserva **três chamadas D1**, nenhuma escrita; teste de navegador confirma **zero consulta de frota adicional por clique no filtro**. Capacidade agregada em memória a partir da leitura de presença já feita; frequência compartilhada de 60 segundos mantida. Não implica garantia de capacidade ilimitada do gratuito nem medição do consumo total da conta.

## Roteiro após publicação autorizada

1. Entrar no Panorama e ativar Sem agente 0.1.9, sem abrir Criar rota. Conferir desaparecimento das unidades com pelo menos um compatível e permanência das demais.
2. Ampliar o mapa e buscar uma unidade visível; manter filtro e posição atual.
3. Abrir Criar rota, selecionar unidades, preencher descrições; cancelar durante conferência técnica, sem atribuir tarefas reais de teste.
4. Em atividade real, atualizar/vincular um agente e aguardar comunicação assinada; próximo pulso deve retirar a unidade, mesmo que outros computadores permaneçam antigos.

## Publicação e conferência oficial

Responsável autorizou expressamente: “Sim, pode publicar o filtro Sem agente 0.1.9 no ambiente real. Depois acesse o Panorama e confira se as unidades com pelo menos um agente compatível desaparecem ao ativar o filtro.” Publicado em **24/11/2026 às 14:08:22 Fortaleza** (`2026-11-24T17:08:22.235Z`), painel `de6b5594-a28f-4aeb-a438-e94c5fa4dbb1`, 100% do tráfego; commit funcional `f19628f`.

**64 verificações HTTP aprovadas**: 51 de páginas/assets/autenticação, 11 do aplicativo e duas específicas D131 (módulo privado redireciona ao login; API exige autenticação). APK 1.0.4 conserva SHA-256 `f258f5f8a483a52d092d9a0d4d8bceba89654256524dae24a28b369c397a82a5`; JS/CSS do técnico conferidos contra build. Coletor independente continua `a1ff9077-58ac-4799-b733-5d88605c58da`; 37 migrações, plano, schedules, permissões, GPS e alertas preservados.

Conferência autenticada root no Panorama real: **77 marcadores antes, 45 depois, 32 retirados**. Nomes dos 32 retirados correspondem exatamente às unidades geolocalizadas com capacidade confirmada numa leitura oficial somente SELECT. Confirmados casos de versões mistas (inclusive unidade com 30 computadores vinculados e apenas um compatível) e compatível sem contato recente. Uma unidade sem coordenadas fica fora do mapa. Contagens são retrato do momento, não valores fixos.

Filtro ativado antes do criador de rotas, mantido ao ampliar o mapa; desativar restaurou 77 marcadores e reativar voltou a 45. Interface deixada com filtro ativo no mapa ampliado. Nenhuma demanda, vínculo ou cadastro alterado durante a validação. Consulta CLI por arquivo retornou apenas resumo; a conferência foi concluída com SELECT em uma linha, após corrigir passagem de quebras de linha no comando. Nenhuma escrita D1 nesses SELECTs.

Evidências privadas: `private-data/d131/panorama-filtro-producao.jpg`, `capability-rows.json`, `release-result.json`, logs e estados de deployment; fora do Git. Somente evidências sintéticas estão versionadas. A validação não é nova homologação de GPS físico ou do instalador Windows. [Estado operacional e rollback](../07-operacao/22_ESTADO_ATUAL_D131.md).
