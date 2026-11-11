# D-099 — provedores por unidade e histórico semanal

Decisão do responsável em 11/11/2026: substituir a relação por computador de D-098 por uma única linha por unidade, manter somente Nome da unidade, IP público, Provedor / rede identificada e Último contato (Fortaleza), gerar automaticamente toda segunda-feira às 08h e guardar as emissões no sistema. O horário foi confirmado expressamente. D-097, agentes existentes e demais relatórios permanecem preservados.

## Seleção e significado

O universo é o de D-098: computadores com vínculo atual de agente e dados recebidos, inclusive offline, ficha parcial e unidade inativa dentro do escopo. Cadastros manuais, agentes sem dados, vínculos encerrados, equipamentos removidos e tipos fora do escopo não entram. A ausência de uma unidade neste relatório não prova ausência de internet.

Agrupar pelo ID permanente da unidade, nunca pelo nome, hostname ou IP. Selecionar uma ficha com IP público, provedor e data de observação válidos; dentre essas, preferir a observação mais recente. Empate: menor ID permanente do equipamento. Se nenhuma ficha da unidade possui observação completa, usar o computador com último contato mais recente e mostrar os dados ausentes explicitamente, sem inventar provedor. Nome, IP, provedor e contato da linha pertencem à mesma seleção; não misturar informações de computadores diferentes.

Somente quatro colunas na tela, CSV, Excel e PDF. Hostname, IDs, ASN e metadados necessários para rastrear a escolha permanecem na resposta protegida/registro histórico, mas não são colunas ou informações adicionais visíveis do relatório. Último contato é o contato vivo do computador selecionado; a data de emissão é identificada separadamente.

Um computador é uma amostra da saída de internet da unidade. Havendo vários links, não significa levantamento de todos eles. A organização identificada pelo ASN pode diferir do provedor contratado. Usar exclusivamente a observação autenticada D-097, sem consulta externa ou endereço do navegador do administrador.

## Interface

Botão **Relatório de provedores** em Computadores e Relatórios. A janela possui **Dados atuais** e **Histórico semanal**. Os dados atuais são consultados ao abrir e ao clicar em Atualizar consulta; não mudam durante a leitura/exportação.

Ajuste de apresentação solicitado em 11/11/2026 após a publicação: retirar a frase sobre diferença entre rede identificada/provedor contratado e links da unidade. Texto atual e arquivado, inclusive impressão/PDF, mantêm apenas “Uma linha por unidade, usando o computador com informação de provedor mais recente, inclusive offline.” CSV/Excel já contêm apenas as quatro colunas. A retirada do texto não altera a fonte, seleção ou dados preservados.

Histórico ordenado da emissão mais recente para a mais antiga, 20 registros por página, com data de emissão em Fortaleza, quantidade de unidades e quantidade com provedor. Abrir uma emissão mostra sua leitura preservada e permite Excel, CSV ou impressão/PDF. Não permite atualizar os valores de um relatório arquivado. Voltar a Dados atuais consulta o estado corrente. Filtros da tela de origem não restringem nenhum desses relatórios.

Resposta incompleta, falha ou ausência de registros é explícita; não gerar arquivo parcial fingindo sucesso. Fechar cancela consultas pendentes. Downloads reproduzem a leitura apresentada, com quatro colunas, escape de HTML/fórmulas e data da emissão no nome do arquivo. O histórico pode conter um relatório sem unidades, registrando honestamente a leitura daquele momento.

## Emissão automática e persistência

Migração aditiva **0026_provider_reports.sql**: `provider_report_schedule` mantém início e próxima emissão; `provider_reports` armazena ID, chave única do período, tipo inicial/semanal, data prevista, data real de geração, semanas não reconstruídas, contagens e JSON da leitura. Sem vínculo de exclusão em cascata com cadastros mutáveis. Renomear/remover unidade ou computador, encerrar vínculo e receber novo IP não alteram relatórios existentes. Trigger recusa UPDATE das emissões. Não há API de edição/exclusão nem expurgo automático deste histórico.

O cron de minuto já existente no Worker do painel confere a data no D1. **Segunda-feira 08h America/Fortaleza = 11h UTC.** Não depende de navegador aberto, instalador novo, automação do Codex, acesso humano ou envio de e-mail. Não duplicar o agendamento no coletor; `APP_KIND=collector` é recusado pelo gerador.

Primeiro cron após publicação cria um **Registro inicial** com a data real; agenda a próxima segunda-feira futura. Não criar semanas anteriores. Cada semana produz uma emissão; chave única e transação com atualização da agenda impedem duplicação e avanço da agenda quando a gravação falha. Cron é executado em paralelo ao monitoramento, preservando a manutenção diária.

Em indisponibilidade, a próxima execução tenta novamente. Se passaram semanas, grava uma única leitura atual com data prevista original, data real de emissão e número de semanas que não foram reconstruídas, avançando para a segunda-feira futura. Não apresentar uma leitura atual como se tivesse sido capturada no passado. Horário previsto não constitui garantia de execução exata no segundo; a emissão real fica visível.

## Contratos e acesso

- `GET /api/inventory/provider-report`: consulta atual integral, `scope=one-per-unit-with-agent-data`, `items`, `total`, `complete`, `server_time`, `totals.units/with_provider/without_provider`.
- `GET /api/inventory/provider-reports?offset=0`: cabeçalhos paginados e agenda (`started_at`, `next_due_at`, timezone, label), total e próxima página.
- `GET /api/inventory/provider-report-saved?id=UUID`: JSON preservado mais `archive` com identificação/datas da emissão; 404 se inexistente.

Somente root/admin/visualizador autenticados no painel; operador/coletor recusados. Somente GET, sem writes por navegação, cache privado desativado. Leituras em lote, sem requisição por computador. Segredos, contas locais, senhas e inventário técnico bruto não entram. Não foi homologada escala ilimitada: JSON por emissão e consulta integral seguem os limites de D1/Worker; falha impede o avanço da agenda, sem truncamento silencioso.

## Operação e recuperação

Aplicar 0026 antes de publicar o painel; versão anterior e coletor existente ignoram as tabelas novas. Se precisar retornar, reverter apenas o código do painel mantendo tabelas e emissões preservadas. Não apagar histórico nem restaurar D1 automaticamente. Ao republicar D-099, agenda pendente é retomada pelas regras acima. Backup/migração do sistema deve incluir ambas as novas tabelas; não são arquivos no Drive. Sem novas variáveis ou segredos.

[Aceite, evidências e publicação](../05-qualidade/PROVEDORES_SEMANAIS_2026-11-11.md). Documentação D-098 preservada como histórico e superada neste escopo.
