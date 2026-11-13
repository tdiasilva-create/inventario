# Controle das coletas — D-111, 13/11/2026

Pedido explícito do responsável: nova aba por unidade, com Sem dados, Coleta parcial e Coleta completa. A completa permanece assim mesmo após novas contribuições; somente root pode alterar. Implementação, testes e produção autorizados.

## Comportamento

- `/controle-coletas` substitui a entrada Coletas em andamento no menu principal. A consulta antiga continua em seu endereço e nos links Visita aberta/Planejamento, preservando respostas e estados técnicos.
- Lista unidades ativas elegíveis para coleta: inclui escolas e administrativas; exclui obras, conveniadas e inativas conforme escopo vigente. Busca parcial por nome (normalização de acentos), filtros pelos três estados, contadores, páginas de 50 e Atualizar.
- Sem decisão manual: Sem dados se não há respostas preenchidas, ambientes, equipamentos ou fotos ready; caso contrário, Coleta parcial. Cadastro mestre, abertura de visita vazia, estado Concluído de cartão e foto pendente isoladamente não contam como informação preenchida. Respostas negativas, false e zero contam.
- Visita finalizada não torna a unidade completa automaticamente. Não existe conversão automática de visitas antigas em completa.
- Root escolhe parcial/completa; classificar completa exige ação e confirmação no formulário. Novas respostas, alterações ou exclusões não substituem a decisão. Root pode também classificar uma unidade ainda sem dados: a tela identifica explicitamente essa condição, sem inventar dados.
- Sem dados é detecção de ausência de dados, não uma ação para apagar respostas. Não há botão para forçar ausência de dados existentes.
- Root/admin/visualizador consultam; somente root grava. Operador e Worker coletor sem acesso às APIs da nova tela. Mantém sessões/CSRF e matriz atual.
- Toda alteração efetiva registra antes/depois, versão, usuário e horário. Repetição da mesma operação não duplica histórico; conflito de versão retorna 409. Histórico paginado por unidade.
- Classificar não conclui vistoria, publica dados, cria revisão de equipamento, altera fotos/QR, autores ou indicadores técnicos. D-045/D-085/D-086 continuam descrevendo visitas e suas pendências, distintas desta cobertura administrativa.

## Dados, consumo e migração

`0032_collection_control.sql` é aditiva. `collection_data_presence` guarda apenas existência de contribuição por origem/ID/unidade, nunca respostas, fotografias ou segredos. Índice por unidade resolve EXISTS sem reler JSON a cada abertura. Backfill inicial lê as fontes existentes uma vez. Triggers mantêm presença na criação/exclusão e somente quando muda a presença de respostas ou vínculo; digitação não salva não é conhecida. Respostas antigas preservadas também evidenciam coleta; não significa que a visita esteja oficialmente publicada.

`unit_collection_reviews` mantém a classificação atual; `unit_collection_review_history` registra alterações em trigger atômico. Não contém chaves estrangeiras que bloqueiem a exclusão administrativa da unidade; histórico da classificação permanece por ID e a classificação corrente é retirada quando a unidade é excluída.

Sem polling adicional: consultas da tela somente ao entrar, buscar, mudar página/filtro, atualizar ou salvar. Não modifica intervalos de GPS/alertas nem o medidor. Consulta usa duas leituras de negócio (totais e página); detalhe do histórico sob demanda. Permanecer gratuito não significa capacidade ilimitada; observar medidor D-109.

Endpoints: GET `/api/collection-control?q=&status=none|partial|complete&offset=0`; GET `/api/collection-control/history?unitId=ID&offset=0`; POST `/api/collection-control/classify` com `{unitId,status,version,operationId}`. JSON sem cache, dados privados autorizados em cada requisição. Confirmação de gravação permanece separada de eventual falha ao recarregar a lista.

## Testes e operação

[Registro de qualidade e publicação](../05-qualidade/CONTROLE_COLETAS_2026-11-13.md).
Testes: `tests/collection-control.test.mjs` e `tests/collection-control-browser.cjs`. Ensaio reproduzível: `node scripts/rehearse-collection-control.mjs CAMINHO_DO_BACKUP_PRIVADO.sql`; executa apenas SQLite local e compara hashes das tabelas anteriores. Gerador determinístico da migração: `scripts/generate-collection-control-migration.mjs`.

Reversão de UI: restaurar versão anterior do Worker, mantendo migração aditiva e dados da classificação para reaplicação. Não executar DROP, desfazer respostas ou restaurar backup sobre atividade recente. Coletor/EXE/APK não precisam ser republicados.
