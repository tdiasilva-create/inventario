# D-098 — relatório semanal de provedores por computador

Pedido de 11/11/2026: botão para listar Unidade, Hostname, IP público e Provedor / rede identificada de todos os computadores com agente que já enviaram ou continuam enviando dados. A coluna Provedor veio duplicada; o responsável confirmou expressamente a substituição da repetição por Último contato: “Sim, usar Último contato”. Quinta coluna reaproveita D-097.

## Operação

Botão **Relatório de provedores** no cabeçalho de Computadores e nas ações de Relatórios. Abre prévia completa com instante de emissão em America/Fortaleza, totais de computadores/unidades e presença/ausência de provedor identificado. Botões Baixar Excel, Baixar CSV, Imprimir / salvar PDF, Atualizar relatório e Fechar. A leitura inicial independe da unidade, estado, página ou filtros que estavam selecionados na tela de origem.

É uma consulta manual do último dado disponível, para emissão e arquivamento semanal pelo usuário. Não agenda envio, não filtra últimos sete dias, não calcula uptime nem cria histórico retrospectivo de provedores. D-097 armazena a última observação, não cada mudança de IP. O horário no arquivo e na prévia identifica a emissão; Último contato identifica a última presença viva recebida do agente. Essas datas podem diferir.

As cinco colunas exportadas são Unidade, Hostname, IP público, Provedor / rede identificada e Último contato (Fortaleza). A prévia também contextualiza unidade inativa, ficha PARCIAL, estado de comunicação, ID, ASN e horário de observação do IP. Nome/hostname ausente não é inventado; IP e provedor ausentes ficam Não recebido/Não identificado. Não exporta contas locais, senhas, IP interno, respostas brutas ou credenciais.

## Inclusão e fonte

Uma linha por ficha de computador com vínculo atual de agente e heartbeat/inventário já recebido, em unidades dentro do escopo atual. Inclui computadores sem comunicação recente, suspensos/desligados informados e instalação revogada ainda vinculada, sempre com estado explícito na prévia. Inclui unidades inativas e fichas parciais recebidas. Exclui impressoras, cadastros manuais, instalações sem dados, vínculos encerrados, equipamentos removidos e conveniadas fora do escopo. Computadores com mesmo hostname, IP público ou nome de unidade continuam separados por seus IDs.

IP/provedor usam exclusivamente network_observation de D-097; não consultar um serviço externo ou usar o IP do usuário que gera o relatório. Provedor/rede de ASN pode diferir da operadora contratada; não deduzir contrato, escola, localização, internet de todas as máquinas ou disponibilidade física.

`GET /api/inventory/provider-report`, exclusivo do painel para root/admin/visualizador, sem parâmetros. Operador e APP_KIND=collector recusados. Resposta: items, total, complete, scope=all-linked-with-data, server_time e totals (units, with_provider, without_provider). Cada item contém IDs, unidade/hostname, public_ip/provider/asn/observed_at/last_contact_at, partial e presence_state; nenhum inventário bruto é exposto.

Uma consulta SQL integral, ordenada por unidade/ID/hostname/ID do equipamento, reaproveita joins/regras do inventário. Sem consulta por computador, paginação truncada, migração ou escrita. Interface espera até 30 segundos, mostra falha e permite tentar novamente. Resposta incompleta/duplicada bloqueia exportação. Fechar cancela a espera; não existe polling do relatório. Atualização é manual para estabilizar a conferência.

Excel/CSV/PDF usam a mesma leitura da prévia, inclusive se chegarem novos heartbeats enquanto ela estiver aberta. Filename contém data/hora de emissão; textos são escapados para HTML e fórmulas em planilhas pelo exportador compartilhado. Cabeçalhos repetem na impressão. Relatório vazio não gera arquivo fingindo conter dados.

[Aceite e publicação](../05-qualidade/RELATORIO_PROVEDORES_2026-11-11.md). D-086/D-097 e demais relatórios preservados; sem mudança de agente, QR, coleta ou fotos.
