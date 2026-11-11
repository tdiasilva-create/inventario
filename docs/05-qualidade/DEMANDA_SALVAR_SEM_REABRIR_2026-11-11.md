# D-102 — salvar demanda sem reabrir o formulário

## Pedido, diagnóstico e escopo

Em 11/11/2026, responsável relatou que, após inserir uma demanda, o sistema abre a página novamente. Código confirmou a causa: o sucesso de request-save fechava o modal, atualizava a listagem e chamava openRequest(v.request.id), reabrindo automaticamente o registro acabado de salvar.

Consultados: 00_LEIA_ANTES_DE_TUDO.md, AGENTS.md, REGRAS_DE_PRECEDENCIA.md, DECISOES.md, PENDENCIAS.md, CONFLITOS_DOCUMENTAIS.md, CENTRAL_DE_DEMANDAS.md, código e testes de operações/D-101. Referências desktop e identidade D-080 já inspecionadas nesta sessão. Nenhuma dúvida de regra pendente: retirar a reabertura após sucesso, sem alterar campos, permissões ou persistência.

Arquivos: web/operations.js, web/painel.css, testes de navegador e documentação. Sem mudanças de servidor, migração, coleta, agente ou fotos. Base TXT preservada; nenhuma pergunta/requisito de coleta adicionado nesta correção.

## Comportamento e aceite

- Após confirmação do servidor, cadastrar ou editar fecha o formulário, atualiza a listagem atual e mostra “Demanda #N registrada/atualizada com sucesso”. Não abre página, não recarrega navegador e não consulta/reabre o detalhe automaticamente.
- Aviso recebe foco e permanece durante a atualização automática. Botão **Ver demanda** permite consulta explícita posterior, inclusive quando os filtros atuais não mostram o registro (por exemplo, demanda concluída no filtro Pendentes).
- Falha de gravação mantém formulário/preenchimento/erro. Reenvio conserva operação idempotente existente. Envio já em curso não aceita novo submit.
- Se a gravação foi confirmada e somente a atualização da lista falhar, mantém confirmação do salvamento e aviso separado de atualização indisponível. Não instrui a criar outra demanda.
- Unidade/equipamento, histórico, autores, versões, buscas D-101, situações e permissões D-071/D-082 permanecem iguais. Nenhuma escrita de teste em produção.

## Testes

Build desktop aprovado (89 arquivos, sem coletor). Quatro roteiros com Worker real/SQLite isolado aprovados:

1. demand-save-browser.cjs: criação/edição fecham modal, ausência de navegação/reabertura/leitura automática do detalhe, consulta manual, confirmação persistente e com foco, falha anterior ao envio, resposta perdida após gravação com repetição sem duplicar registro/histórico, lista indisponível após ACK, conclusão fora do filtro Pendentes e viewport 390. Zero erros JavaScript.
2. operations-browser.cjs: equipamentos/unidade sem computadores, demanda, histórico, mudanças de situação, atualização de agente e responsividade.
3. demand-unit-search-browser.cjs: seleção por nome/ID, acentos, contexto, vínculo, falhas de seleção e visualizador preservados.
4. tour-logic-browser.cjs: navegação cruzada, busca, gravar edição inalterada sem evento e demais verificações existentes preservadas.

Testes antigos que aguardavam reabertura automática agora usam explicitamente Ver demanda. Screenshots de sucesso desktop e viewport 390 inspecionados em docs/05-qualidade/evidencias/demandas-salvar-2026-11-11 (sintéticos/fora do Git). Não equivale a teste em celular físico.

## Publicação

Publicada em 11/11/2026 às 20:29:17 (Fortaleza), no painel real conforme autorização contínua da sessão. Versão `a905bd00-0115-43ae-aa99-96058b9eac5b`, 100% do tráfego; commit de implementação `a2bfcf8`. Dois assets alterados: operations.js e painel.css. Sem migração nem publicação do coletor; bindings e crons preservados.

Dry-run e verificação documental aprovados. Após publicação, verify-panel-release.mjs aprovou 51 checks HTTP. Central aberta como root, recarregada e conferida visualmente em produção às 20:29, com busca/lista/contadores funcionais. Nenhuma demanda criada/editada no teste real: os cenários de gravação, falhas e idempotência foram executados no Worker/SQLite isolado descrito acima.

Endereço: https://painel-semed-paco.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev/demandas

## Conferência real solicitada posteriormente pelo responsável — 20:42 Fortaleza

O responsável pediu explicitamente verificar o salvamento no painel real. Registrada a própria solicitação de verificação técnica como demanda #9, na SECRETARIA MUNICIPAL DE EDUCAÇÃO - SEMED, tipo Outro/origem Painel, sem equipamento nem defeito fictício. Após salvar às 20:42:10, apareceu “Demanda #9 registrada com sucesso”, o modal fechou e a demanda apareceu uma única vez na lista; atualização automática às 20:42:16 preservou o formulário fechado. O detalhe foi aberto somente por clique em Ver demanda.

Resultado registrado e demanda concluída às 20:42:41, sem deixar pendência técnica aberta. A edição também fechou o modal com confirmação. Filtro Concluída + busca pela descrição mostrou somente #9 na lista. Nenhuma demanda preexistente foi modificada. Evidências privadas (fora do Git): `evidencias/demandas-salvar-2026-11-11/03-producao-demanda-9-salva.jpg` e `04-producao-demanda-9-concluida.jpg`. Nenhuma alteração de código ou nova publicação nesta conferência.
