# Redução de leituras D1 — D-108

Autorizado em 12/11/2026: corrigir e testar localmente; validar e publicar após
o reset de 21h Fortaleza, mantendo plano gratuito, localização e alertas.
Não altera questionário, APK, protocolo dos agentes, Drive ou permissões.

## Evidência do incidente

D1 retornou 7500 (limite diário). O recorte de 100 consultas do Insights somou
8.330.305 linhas lidas em janela móvel de 24h; não confundir essa janela com
o dia UTC da franquia. Pendências de coleta e catálogo operacional somaram
4.104.404 leituras. As 16 consultas identificadas de GPS/roteiro/avatar somaram
124.578 (aproximadamente 1,5% do recorte). Não há evidência de que GPS tenha
sido o principal consumidor. Cinco usuários humanos não representam todo o
tráfego: agentes e cron também executam consultas sem navegador aberto.

## Migração aditiva 0030

- Índice de inspeções por unidade/estado e índice parcial de demandas abertas.
- Índice por dispositivo/equipamento/instante do snapshot. A expressão numérica
  preserva a ordem de timestamps ISO com ou sem frações de segundo.
- `panel_collection_states` projeta a regra já aprovada de pendência por unidade;
  `panel_collection_counts` contém apenas três contadores.
- Triggers recalculam unidades afetadas por criação/exclusão/mudança de estado
  de visita ou elegibilidade da unidade. Triggers dos estados aplicam o delta
  nos contadores na mesma transação. Rollback também desfaz o delta.
- Edição de respostas, GPS e heartbeat não atualizam esses contadores.
- O preenchimento inicial deriva dos registros existentes. Não cria unidades,
  visitas ou equipamentos, não muda respostas nem elimina histórico.
- Clientes/Workers anteriores continuam atualizando a projeção pelas triggers.

`collectionCTE` permanece como regra canônica da listagem e referência de
conferência. Não criar atualizações avulsas dos contadores fora das triggers.
Conferir, após migração, estados projetados contra a view e totais contra o CTE.

## Consultas e monitoramento

O catálogo operacional usa os índices e lê presença sem carregar snapshots,
fichas completas ou dados de inscrição. A consulta de computadores de toda a
rede classifica registros compactos com a mesma função de presença e carrega
detalhes somente dos 60 itens da página; não mudou o prazo de presença.

O cron continua a cada minuto. Lê vínculos/presença e cursores, busca somente
snapshots posteriores ao cursor pelo índice e carrega contexto detalhado apenas
quando há snapshot novo ou nova perda de comunicação. Consultas agrupam até
20 vínculos/80 parâmetros. Cada grupo oferece seus primeiros 200 candidatos;
o monitor ordena e processa os primeiros 200 globais. Os grupos leem somente
chaves; o JSON completo é carregado só para esses 200 finais, evitando multiplicar
o volume de hardware na memória quando vários grupos têm filas acumuladas.
A rodada seguinte retoma
o restante. Não substitui a fila pela última fotografia de hardware: mudanças
intermediárias permanecem detectáveis. Novo vínculo inicia pela referência atual,
como antes. Cursor, revisão, deduplicação e guarda de vínculo ativo permanecem.

Uma perda já aberta não tenta repetir a mesma inserção a cada minuto. O retorno
de comunicação continua encerrando a perda, sem concluir demanda manual.
Hardware continua no sino e no mapa; perda inesperada exige mais de 48h e fica
no log. Presença recente continua 17min. GPS/ruas e intervalos 15s/60s preservados.

## Medição e indisponibilidade

`Server-Timing` dos GETs de API desktop acrescenta `d1_rows_read` e
`d1_rows_written` provenientes dos metadados D1. Não grava uma linha de
telemetria para cada requisição. Nenhum SQL, parâmetro, identidade ou segredo
é exposto. `first()` sem argumento usa a mesma consulta uma vez por `all()` e
devolve a primeira linha; `first(coluna)`/`raw()` permanecem nativos e, quando
sem metadados, são contabilizados como `d1_unmeasured`, nunca zero presumido.
Não armazenar nem reutilizar autorização entre requisições.

Erro reconhecido de cota diária D1 retorna 503, `D1_DAILY_QUOTA`, `Retry-After`,
instante de renovação e `no-store`. Não confundir indisponibilidade com senha
incorreta ou gravação concluída. Leituras desktop que usam o helper interrompem
novas chamadas até esse instante, somente após esse erro específico; não há
bloqueio preventivo por estimativa, cache de dados ou aumento normal de intervalo.
Recuperação antecipada exige recarregar a aba. Outros erros mantêm tratamento
normal e novas tentativas previstas. A medida não altera a fila do EXE/APK.

## Limites de garantia

Resultados locais não garantem uma franquia gratuita ilimitada. Medir o total
da conta por dia UTC após publicação, considerando agentes, escritas e demais
aplicações. Meta operacional proposta: abaixo de 3 milhões de leituras e 70 mil
escritas/dia, deixando margem; ainda não constitui limitação automática.
Se o crescimento não couber, apresentar medição antes de alterar frequência,
contratar plano ou migrar. Nenhuma dessas ações está autorizada nesta correção.

Rollback: voltar os dois Workers às versões registradas antes da publicação;
manter 0030 (índices/projeções compatíveis). Não restaurar dump sobre dados novos
nem apagar tabelas por rotina. A correção de uma projeção divergente exige
investigação e reconstrução transacional a partir dos registros canônicos.

Validação: [registro D108](../05-qualidade/REDUCAO_D1_2026-11-12.md).
