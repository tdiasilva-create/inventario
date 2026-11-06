# Coletas em andamento — D-045, 28/10/2026

## Pedido e fontes

Responsável solicitou acompanhar no desktop as informações durante o preenchimento. A regra de indicadores oficiais permanece; rascunhos passam a ter área própria de consulta com identificação PARCIAL.

Consultados: `00_LEIA_ANTES_DE_TUDO.md`, `AGENTS.md`, precedência, decisões, pendências/conflitos, documentos desktop e de dados/APIs, Base §§0/7/13 já lidos e aceite. Abertos os cinco PNGs desktop na ordem: `00_painel_geral_APROVADO.png`, `01_mapa_da_rede_APROVADO.png`, `02_matriz_equipamentos_APROVADA.png`, `03_unidade_selecionada_APROVADA.png`, `04_indicadores_integrados_ESTUDO_APROVADO.png`. Preservar composição dark-tech, mapa e dados oficiais. Diagramas técnicos não geraram novos requisitos.

## Implementação e aceite

- Nova rota `/coletas-em-andamento` no menu e resumo no Panorama.
- Lista de visitas abertas: unidade, iniciador, última atividade no servidor, estados A–H e totais de fichas trabalhadas nesta visita. Diferencia ficha nova de atualização de bem publicado. Não soma F e G duas vezes; lote contribui com quantidade física.
- Detalhe: respostas já salvas, ambientes cadastrados, equipamentos com identificação/condições/ação/notas/técnicos, autor/data da gravação e últimas 20 atividades. Rótulos PARCIAL e duplicidade em análise explícitos.
- Polling 15s, somente com aba visível e componente presente; Atualizar agora; horário de consulta; erro preserva mensagem e horário da última consulta válida. Não é digitação em tempo real nem armazenamento offline.
- Paginação de 50 visitas/equipamentos. Migração `0010_in_progress.sql`: projeção incremental e índices por inspeção para evitar varredura completa a cada refresh. Não impõe teto de itens.
- Somente consulta. root/admin/visualizador seguem acesso desktop; operador recebe 403 nas APIs gerenciais. Não há botão que altere ou finalize coleta pelo monitoramento.
- Ao concluir oficialmente, a visita sai da lista; um detalhe já aberto informa a conclusão e oferece consulta oficial da unidade. Rascunhos não mudam matriz/indicadores oficiais. Uma revisita preserva o inventário sem duplicar IDs.

Arquivos principais: `server/in-progress.mjs`, `server/collector.mjs`, `server/worker.mjs`, migração 0010; `web/desktop-progress.js`, `desktop-inventory.js`, `desktop.js`, `panel-shell.js`, `desktop.css`; build desktop. Nenhuma pergunta ou tela mobile alterada nesta fase.

## Testes

38 testes Node aprovados. Novos testes com handlers reais e SQLite isolado confirmaram:

1. Resposta rascunho visível no monitoramento imediatamente após a API salvar, ainda fora da consulta oficial.
2. Perfis de consulta, bloqueio operador, somente GET, cursor inválido e ID inexistente; leituras não geram alterações de histórico.
3. 54 fichas (53 individuais e lote de 12 = 65 itens), paginação sem duplicação, projeção incremental coerente.
4. Conclusão manual A–H e confirmação real no servidor retiram andamento e publicam 65 itens uma única vez.
5. Revisita com alteração de um bem: 1 ficha alterada, zero ficha nova; projeção oficial preservada até nova conclusão.

Chrome real em ambiente isolado: resposta inicial visível, alteração do operador recebida automaticamente dentro da janela de 15s, ambiente/equipamento novos aparecem sem concluir, rótulos parciais, URL restaura detalhe, 430px sem overflow e zero erros JS. Fixtures explicitamente isoladas; não gravadas na produção.

Scripts: `tests/in-progress.test.mjs`, `scripts/verify-in-progress.mjs`. Capturas e resultado: `evidencias/coletas-em-andamento/01-lista-desktop.png`, `02-atualizacao-automatica.png`, `03-equipamento-parcial.png`, `04-responsivo.png`, `05-panorama.png`, `resultado.json`.

## Cobertura e limites

Cobertura adicional da Base: observabilidade do rascunho confirmado, estados, responsáveis e continuidade, preservando a separação de resultados oficiais. Nenhum novo requisito de questionário. Campos ainda não enviados não são conhecidos pelo desktop. Totais parciais podem incluir suspeitas de duplicidade e não equivalem a inventário homologado.

Fotos R2, visualização de fotos parciais, offline protegido, resolução administrativa de conflitos/duplicidades, transferências/cancelamento e backup continuam pendentes. Esta entrega não elimina essas lacunas nem habilita armazenamento alternativo de imagens.

## Publicação

Migração aditiva 0010 aplicada ao D1 institucional. Desktop: `d6111141-5e90-4682-93fc-c1a2c9c86a6c`; backend coletor: `9f6e7661-90b1-4785-be2a-cdbc43c1e6b5`. Nenhuma tela mobile alterada; API e persistência compartilhadas.

Consulta somente leitura à produção identificou a coleta aberta da SECRETARIA MUNICIPAL DE EDUCAÇÃO - SEMED, com zero fichas de equipamento, elegível à nova lista; não foram inseridos dados de teste nem concluída essa vistoria. Respostas já salvas são lidas pelos endpoints de acompanhamento.

Verificação externa: login HTTP 200, nova página redireciona ao login sem sessão e as três APIs de acompanhamento respondem 401 sem autenticação. Testes de escrita e atualização automática desta fase foram isolados. Roteiro humano: `TESTE_COLETAS_EM_ANDAMENTO.txt`.

https://painel-semed-paco.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev/coletas-em-andamento
