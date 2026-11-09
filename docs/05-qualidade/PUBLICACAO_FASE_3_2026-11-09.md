# Publicação real — auditoria Fase 3 / D-073

Data: 09/11/2026. Pedido explícito: iniciar a Fase 3, manter identidade visual, adiar decisões pendentes e publicar em produção. Código final `1c332b8`, incluindo implementação `1f2b77c` e preservação do resumo de monitoramento `e626e84`.

## Ambiente publicado

- Painel: https://painel-semed-paco.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev/panorama
- **Versão final ativa em 100%:** `104e92dc-7b74-4509-9ad9-24c215f7dbc1`.
- Coletor preservado, sem deploy nesta fase: `ef33d619-52da-4726-989c-6a49b551a899`.
- D1 compartilhado, Drive privado, cadastro automático do agente e cron do painel a cada minuto/03:23 UTC mantidos. Nenhuma migração, seed, exclusão, nova conta ou alteração de credencial.

A primeira publicação foi `92172d03-cddd-47b6-b78c-b42ffd87f941`. A conferência levou a dois pequenos ajustes: preservar o texto do monitor na atualização dos blocos (`75abe230-4e01-46a6-a70f-f8bf9afef29d`) e enquadrar a fachada inteira no cabeçalho, incluído na versão final acima. As versões intermediárias não são o alvo atual. `wrangler deployments list` confirmou a distribuição final.

## Dados preservados

SELECTs somente leitura antes/depois da publicação: **8 usuários, 76 unidades, 7 vistorias, 3 fotos, 3 miniaturas e 20 migrações**, sem mudança nas contagens. Não houve teste com inclusão de dados fictícios em produção. Nenhum novo upload/remoção foi feito no Drive. Logs, respostas e exportações operacionais ficam em `private-data/release-fase3-2026-11-09/`, fora do Git.

Sem alteração de esquema ou comandos de escrita de cadastro, esta publicação não exigiu nova restauração/exportação do D1. O backup conferido da Fase 2 continua registrado em [PUBLICACAO_FASE_2_2026-11-09.md](PUBLICACAO_FASE_2_2026-11-09.md). Isso não dispensa a política futura de backup/RPO/RTO.

## Testes e conferência real

- **141 testes de domínio/API e 12 roteiros de navegador aprovados**, builds separados, dry-run, documentação e verificação do índice Git. Repetidos os testes afetados após os ajustes finais. Escopo e limitações no [aceite da Fase 3](CORRECOES_PRODUCAO_FASE_3_2026-11-09.md).
- **46 verificações públicas** após a publicação final aprovadas. Mais sete verificações: dois novos módulos continuam protegidos por login e cinco rotas privadas retornam 401 sem sessão.
- Sessão root real: Panorama, seleção da EM RAIO DE LUZ, ficha oficial de computador e Atualizar carregaram. A composição, cores e mapa de ruas com limite desligado foram preservados.
- “Ver todas (3)” abriu a sequência real: equipamento → ambiente → fachada, com contagem 1/3–3/3, autoria, data e unidade. Ampliação usa a foto completa; não houve inserção de fotografia de teste.
- Detalhe da unidade exibiu sua fachada e botão de ampliação. Exportar dados apresentou unidades, matriz, fichas publicadas e ocorrências, com CSV/XLSX. O volume de 58 fichas/57 fotos foi validado no ambiente isolado; não foi fabricado na produção.

Capturas reais privadas em `docs/05-qualidade/evidencias/painel-fase3-2026-11-09/`: `06-producao-galeria.png`, `07-producao-fachada.png`. Imagens não integram o Git público. As capturas 01–05 são ensaios sintéticos identificados.

## Limites e retorno

Locais de referência, filtro Ano e demais decisões em aberto permanecem para o responsável. Fases 4/5, homologação física de celulares/EXE e medições em rede de campo não foram concluídas por esta entrega. Base de Coleta §§5 e 7–9 coberta no escopo de consulta, contexto de fotos, permissões e separação PARCIAL/oficial; perguntas e regras de coleta preservadas.

Para retornar o painel à Fase 2, versão `c6a440fb-ae93-4bd2-879c-eaba507e2fbc`. Não restaurar/apagar banco nem Drive; não modificar o coletor. Retorno de código não foi executado. Exportações CSV/XLSX de consulta não são backup transacional do sistema.
