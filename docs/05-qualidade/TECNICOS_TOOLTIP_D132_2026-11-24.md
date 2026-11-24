# D132 — verificação dos técnicos no mapa

24/11/2026. **Publicado após autorização explícita às 15:58:25 Fortaleza.** Painel `bfa2cbce-3faa-4e1f-8e2d-44981b73c173`, 100%; commit funcional `668dcbe`, branch `codex/tecnicos-tooltip-mapa-d132`. [Contrato](../03-painel-desktop/TECNICOS_TOOLTIP_MAPA_D132.md).

## Fase e critérios

Consultados: entrada e precedência, AGENTS, decisões/pendências/conflitos, Central de demandas, contratos D105/D106/D126 e qualidade relacionada, manifesto e referências desktop já inspecionadas nesta sequência, implementação de mapa/rotas. D065/D080 preservam identidade visual; D095 preserva clique; D114/D126 distinguem localização, sessão, aceite e atribuição. Sem decisão de produto bloqueando implementação local.

Arquivos: `web/desktop-map.js`, `dispatch-map.js`, novo `map-unit-technicians.js`; projeção de `server/dispatch-road-routing.mjs`; build, testes, CI e documentação. Critérios no contrato: nomes atuais por ID, não inferir aceite/GPS, atualização/falha explícita, root exclusivo, zero requisição por hover, sem esquema novo ou escrita oficial.

## Evidências locais

- Quatro testes D132 de funções/Worker/SQLite aprovados: agrupamento/estados; designação sem GPS e aceite independente de sessão; atribuições/contas/demandas atuais; autorização e plano SQL.
- `map-unit-technicians-browser.cjs` aprovado com Worker real/SQLite isolado e Edge: dois técnicos, deduplicação, atualização do aviso aberto após aceite/troca, erro inicial e após sucesso, HTML tratado como texto, mapa ampliado, 390 px, visualizador sem consulta de atribuições e **zero requisição por hover**.
- Regressões `map-demands-browser.cjs` e `map-agent-filter-browser.cjs` aprovadas; alertas/anéis, clique, filtro compacto e rascunho de rota preservados.
- `dispatch-road-routing-runtime.cjs` aprovado em workerd, provedor simulado; geometria por ruas e recusa de redirecionamento preservadas.
- Build desktop aprovado. Suíte completa `pnpm test:all`: **385 testes aprovados, zero falhas**, em 74 segundos. Logs privados locais em `private-data/d132-*.log`.
- Dry-run do Worker do painel aprovado, sem publicação (`private-data/d132-dry-run.log`).
- Verificação do repositório e links documentais aprovada; `git diff --check` sem erros. Índice de código/manual de transferência regenerados.

Capturas reais do navegador com dados sintéticos, sem registros oficiais:

- [Designados](evidencias/tecnicos-tooltip-d132-2026-11-24/01-designados.png).
- [Mapa ampliado](evidencias/tecnicos-tooltip-d132-2026-11-24/02-mapa-ampliado.png).
- [Aceite confirmado](evidencias/tecnicos-tooltip-d132-2026-11-24/03-aceite.png).
- [390 px](evidencias/tecnicos-tooltip-d132-2026-11-24/04-390.png).
- [Resultado do navegador](evidencias/tecnicos-tooltip-d132-2026-11-24/resultado.json).

Capturas de aceite/390 px abertas para inspeção: rótulo no marcador, mesma tipografia/cores, texto dentro da área útil, sem novo quadro fixo ou controle no mapa. A largura existente de 300 px quebra nomes longos. Dados geográficos dos testes não representam unidades reais.

## Consumo e limites

Comparação estrutural: antes e depois, um lote e três SELECTs em `readDispatchMap`; mesmo polling visível de 15 s. O único acréscimo SQL é lookup de aceite por atribuição. EXPLAIN confirmou `SEARCH activity USING INDEX sqlite_autoindex_dispatch_service_activity_1 (user_id=?) LEFT-JOIN`, sem `SCAN activity`. Não prometer delta zero de linhas D1; não foi necessário consultar banco oficial.

Testes de escrita somente em fixtures. Não houve migração, alteração de cadastros oficiais, APK ou avaliação física nova de GPS. Rollback para D131 sem restauração de banco.


## Publicação autorizada

O responsável respondeu “Sim, publicar no ambiente real” à pergunta específica D132. Publicado somente o Worker do painel em **24/11/2026 às 15:58:25 Fortaleza** (`2026-11-24T18:58:25.612Z`), versão `bfa2cbce-3faa-4e1f-8e2d-44981b73c173` em 100%. Build reproduzido antes do envio; mesmo commit funcional testado `668dcbe`.

**64 verificações HTTP aprovadas:** 51 de páginas/assets/acesso, 11 do aplicativo técnico e duas dos módulos do mapa. APK 1.0.4 mantém SHA256 `f258f5f8a483a52d092d9a0d4d8bceba89654256524dae24a28b369c397a82a5`; JS/CSS técnicos idênticos ao build. Sem novo polling, migração, publicação do coletor independente ou alteração de dados oficiais. Logs em `private-data/d132/`, fora do Git.

Ao conferir o Panorama, a sessão já estava expirada. A atualização abriu o login; solicitado novo acesso root para concluir a observação dos nomes com dados reais. Esta conferência permanece pendente, sem impedir a disponibilidade da alteração publicada.
