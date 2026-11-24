# Estado D132 — 24/11/2026

Publicado após resposta específica **“Sim, publicar no ambiente real”**, às **15:58:25 Fortaleza** (`2026-11-24T18:58:25.612Z`): painel `bfa2cbce-3faa-4e1f-8e2d-44981b73c173`, 100%, commit funcional `668dcbe`, branch `codex/tecnicos-tooltip-mapa-d132`. Complementa [D131](22_ESTADO_ATUAL_D131.md).

Root vê os técnicos designados às demandas abertas ao passar o mouse nas unidades; nomes deduplicados, aceite operacional identificado separadamente, texto seguro e falha explícita. Vale no mapa normal/ampliado. Reutiliza leitura existente `/api/dispatch/map` de 15 s; sem consulta por hover. Três statements preservados, com lookup indexado da atividade D126. Não se afirma delta zero de linhas D1: o lookup tem custo, sem novo polling. [Contrato](../03-painel-desktop/TECNICOS_TOOLTIP_MAPA_D132.md), [qualidade](../05-qualidade/TECNICOS_TOOLTIP_D132_2026-11-24.md).

**385 testes** locais e quatro verificações navegador/runtime aprovados. Build/dry-run e **64 verificações HTTP após publicação** aprovados. Conferência visual real root concluída após renovação da sessão: unidade localizada pela busca, mesmo tooltip exibido no mapa normal/ampliado com nome do responsável. Captura privada `private-data/d132/tooltip-tecnico-producao.jpg`. Não foram alteradas demandas, atribuições ou unidades oficiais para testar.

Continuam 37 migrações; APK 1.0.4 com SHA256 `f258f5f8a483a52d092d9a0d4d8bceba89654256524dae24a28b369c397a82a5`. Coletor independente permanece na publicação anterior; GPS D114, alertas, rotas por ruas e gratuito preservados. Nenhum instalador novo ou publicação do coletor independente.

Para migração física: manter atribuições por ID e atividade operacional D126 separadas da sessão/posição do técnico. O nome livre de responsável não é vínculo a usuário; uma posição ou a primeira parada não comprova aceite. Manter autorização root no endpoint e leitura atual sem consulta por hover.

Rollback: painel D131 `6c6c3da2-b60e-4ff9-b731-239a73eb7078`, sem restauração do banco. Logs privados da publicação/verificação em `private-data/d132/`, fora do repositório.
