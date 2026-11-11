# D-101 — buscar unidade pelo nome na Central de demandas

## Pedido, fontes e limites

Responsável relatou dificuldade na lista suspensa de unidades para procurar e abrir uma demanda; pediu buscador por nome. Inspeção da produção como root confirmou selects longos no filtro e no formulário Registrar demanda. Aberto/fechado formulário vazio, sem criar registro real.

Consultados 00_LEIA_ANTES_DE_TUDO.md, AGENTS.md, REGRAS_DE_PRECEDENCIA.md, DECISOES.md, PENDENCIAS.md, CONFLITOS_DOCUMENTAIS.md e docs/03-painel-desktop/CENTRAL_DE_DEMANDAS.md; MESA_DE_DADOS.md e cinco imagens desktop já consultadas nesta sessão. Prevalece identidade D-080. Testes existentes operations-browser, tour-logic-browser e map-demands-browser examinados. Requisitos: seleção por ID oficial, equipamento da mesma unidade, contexto/histórico, permissões D-071/D-082, navegação D-095. Nenhuma decisão funcional nova pendente.

Arquivos: web/unit-name-picker.js (novo), web/operations.js, web/painel.css, scripts/build-desktop.mjs, testes e documentação. Coletor/Base TXT, servidor, banco, agente, Drive, crons e requisitos de atendimento preservados. Não há nova pergunta do questionário nem mudança de critérios de conclusão.

## Implementação e critérios de aceite

1. Campo Buscar unidade por nome no filtro da Central e ao registrar demanda; busca local por parte do nome, ignorando acentos/caixa/espaços repetidos. Reutiliza catálogo recebido, sem requisição por tecla.
2. Seleção explícita de resultado armazena ID, não nome livre. Enter/setas, clique/toque, Escape, Limpar e mensagem de resultado vazio. Nomes são texto, nunca HTML; homônimas mostram tipo e início do ID para distingui-las.
3. Filtro mantém ação Filtrar; Registrar demanda aproveita a unidade escolhida no buscador, mesmo quando a URL continha outra unidade. Contexto vindo de Computadores/equipamento e mapa continua preselecionado. Ao limpar não herda silenciosamente a seleção antiga.
4. Digitar depois de selecionar invalida o ID anterior. Formulário não salva nome livre; exige escolha da unidade. Trocar/limpar unidade remove equipamento selecionado, opções/página anteriores e busca anterior de equipamento; respostas assíncronas atrasadas não reinserem opções antigas.
5. Unidade histórica de demanda existente não muda. Mesmo conjunto de unidades do seletor anterior (ativas e a seleção inicial já contextualizada), com validação definitiva no servidor. Visualizador consulta/filtros, root/admin mantêm edição.
6. Polling continua 15 s e não apaga a digitação no buscador. Formulário aberto mantém suspensão da atualização operacional. Identidade, tamanhos compactos e viewport 390 preservados; nenhuma gravação oficial nos testes.

## Testes e evidências

Roteiro demand-unit-search-browser.cjs usa Worker real e SQLite isolado. Verifica pesquisa parcial/sem acento, duas unidades homônimas, seleção por ID, navegação por teclado, zero consultas por tecla, preservação da busca durante atualização, seleção atual em vez da URL antiga, limpeza do equipamento, gravação única na unidade correta, bloqueio de nome livre, ausência de inativas nos resultados gerais, nome contendo HTML como texto, viewport 390 e visualizador sem escrita. Nenhum erro JavaScript.

Regressões operations-browser.cjs, tour-logic-browser.cjs e map-demands-browser.cjs aprovadas: demanda com/sem equipamento, histórico, situação, unidades sem computadores, navegação cruzada, gravação inalterada sem evento, mapa/cores/sinalização e permissões. Dois seletores de testes atualizados de select para input hidden por ID e interação real com a busca. Ajustadas seleções iniciais do teste novo para não confundir o combobox/option de unidade com os selects nativos de Situação e Tipo; nenhuma alteração de aplicação para contornar essa ambiguidade do teste.

Screenshots sintéticos em docs/05-qualidade/evidencias/demandas-busca-2026-11-11 (fora do Git); desktop e viewport 390 inspecionados. Viewport não representa teste em aparelho físico. Build desktop: 89 arquivos, coletor não incluído.

## Publicação

Implementação commit **195e88f**. Build, dry-run, diff, links documentais e scanner do índice Git (655 arquivos) aprovados. Publicação real autorizada no fluxo contínuo da sessão. Painel publicado em **11/11/2026 às 20:14:10 Fortaleza**, versão **9544bdfb-2a9d-4873-bedb-7f1ea58ca80a**, 100% do tráfego. Três assets atualizados: operations.js, unit-name-picker.js e painel.css. Nenhuma migração, mudança de crons ou publicação de coletor.

**51 verificações HTTP reais aprovadas**, incluindo redirecionamento para login do novo módulo sem sessão. Conferência navegada com sessão root: busca “raio” encontrou EM RAIO DE LUZ no filtro; selecionar e abrir Registrar demanda preencheu a mesma escola. Dentro do formulário, busca “pirâmide” encontrou EM RESIDENCIAL PIRAMIDE sem exigir a grafia/acento do cadastro. Screenshot real observado e formulário deixado nessa busca para o responsável. Nenhuma descrição preenchida, demanda salva, conta alterada ou teste fictício gravado em produção.

Retorno: publicar versão anterior do painel **e1b208a6-7813-4901-9bed-7b1c34522d4a**, sem reverter banco. Endereço: https://painel-semed-paco.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev/demandas . Aceite operacional final do responsável permanece pendente.
