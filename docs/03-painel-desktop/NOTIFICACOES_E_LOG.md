# Notificações, log de comunicação e escolas offline — D-088

Pedido do responsável em 10/11/2026, com confirmação expressa de **mais de 48 horas**, e não minutos. Complementa D-070, D-081, D-083, D-085 e D-087. A alteração é exclusiva do painel/monitor; preserva o coletor, o protocolo do agente, Drive e dados das visitas.

## Hardware no mapa e no sino

- A comparação de inventários confiáveis permanece em `server/agent-monitoring.mjs`. Primeira leitura é referência; dados parciais não são retirada de peça. Cobertura e limites no [contrato de monitoramento](../04-dados-apis/MONITORAMENTO_E_NOTIFICACOES.md).
- A unidade com coordenadas mantém o círculo discreto no ponto do mapa: vermelho aguardando parecer, âmbar após encaminhamento para demanda ainda aberta; centro conserva a cor da categoria D-087. Nenhuma localização é inventada para unidade sem coordenadas.
- O sino conta somente alterações **aguardando parecer administrativo**, independentemente da leitura individual. Não soma perda de comunicação, eventos aceitos ou demandas já encaminhadas.
- Clicar no sino abre diretamente o modal filtrado por pendências de hardware. Clicar no ponto abre o mesmo modal para a unidade. Sem abertura automática ou som.
- Modal: unidade, ambiente, posição, nome/hostname do computador, componente e antes/depois. Root/admin podem aceitar ou encaminhar à Central de demandas. Visualizador apenas consulta. Fechar/ler não decide.
- Filtro do modal oferece pendentes, pendentes + demandas abertas e histórico completo, paginado. Aceitar retira a pendência sem apagar o histórico. Encaminhar retira o contador do sino, mantendo a demanda e o círculo âmbar até sua conclusão. Nova alteração gera nova pendência.
- Falha de consulta é sinalizada como indisponibilidade (`!`), não como zero hardware. Última execução do monitor é mostrada; atraso acima de três minutos é explícito. Polling visível de 15 s preservado, sem apagar observação em digitação.

## Perdas de comunicação: log separado

Nova página `/log-comunicacao`, acessível no menu **Consulta → Log de comunicação** por root/admin/visualizador. Operador permanece no coletor.

O monitor registra perda inesperada somente quando `agora - último contato vivo > 172800 segundos`. Exatamente 48 h não basta. A próxima rodada do cron de minuto detecta a condição. Contato vivo recebido no servidor mantém sua regra existente; uma mensagem antiga da fila não prova presença atual.

O prazo de **presença recente** permanece `3 × heartbeat + 120 s` (atualmente 17 min). Assim, um computador pode estar sem comunicação recente e sua escola offline sem ainda ter atingido o prazo de incidente no log. Isso evita apresentar a escola como online durante 48 h sem sinal.

Suspensão/desligamento informados, agente nunca comunicado, revogado e sem vínculo continuam distintos da perda inesperada. Retorno encerra o registro, sem apagá-lo ou concluir demanda manual. Fim do vínculo/inativação encerram com seu motivo. A duração exibida é até o encerramento registrado pelo monitor, não uma medição exata da indisponibilidade da rede.

Log contém unidade, ambiente, computador/hostname/ID/posição, último contato, data da detecção, duração, situação e encerramento. Busca por unidade/ambiente/computador, filtros Em aberto/Encerrados/Todos, 25 registros por página e atualização de 15 s em aba visível. Não grava nada ao consultar.

Histórico anterior: nenhum evento é apagado, marcado como lido ou encerrado apenas porque o prazo mudou. Incidentes antigos com período inferior a 48 h ficam no banco, fora desta lista. Os superiores a 48 h aparecem com indicação da regra anterior quando pertinente; se ainda abertos, não são duplicados. Eventos novos guardam o contexto de localização no momento da detecção; legado usa localização atual explicitamente rotulada.

API `GET /api/inventory/communication-log?q=&state=open|closed|all&offset=0`: autenticação e perfil no servidor; retorno paginado, `threshold_seconds`, saúde do monitor e horário do servidor. `GET /api/inventory/monitoring` passa a oferecer apenas hardware na lista/contadores de leitura; a interface usa `hardware.pending` no sino. `communication_lost: 0` permanece apenas por compatibilidade com scripts antigos, sem representar a contagem do log. `GET /api/inventory/hardware-alerts` aceita `state=all` para histórico. Nenhuma nova tabela/migração/credencial.

## Escolas offline e online

No Panorama e Mapa da Rede, “Escolas offline” aparece acima de “Escolas online”, no canto inferior direito do mapa. Mesmos filtros do painel, sem somar computadores em vez de escolas. Usam a mesma consulta de presença do pulso (60 s).

Preserva D-083: escolas municipais, militares e creches ativas; um ou mais agentes comunicando tornam a escola online; nenhum comunicando torna offline, inclusive quando não existe agente cadastrado. Não inclui núcleos, unidades administrativas, obras ou inativas. Isso é uma métrica de evidência de comunicação, **não prova de queda de internet ou de computador desligado**. O tooltip explica o critério. Falha de consulta apresenta traço nos dois indicadores, nunca offline/zero fictício. Não cria demanda ou alerta por escola offline.

## Operação e teste

[Aceite e publicação](../05-qualidade/NOTIFICACOES_48H_2026-11-10.md). Publicação somente do painel, onde roda o cron. Coletor/EXE e suas versões preservados. Não executar simulação de hardware ou exclusões no banco oficial para testar esta entrega.


## Atualização D-094 — círculo de atendimento geral

Demanda encaminhada deixa de usar halo âmbar: o anel externo #006D77 representa todas as solicitações não concluídas da unidade, inclusive toner, teclado/mouse e visitas manuais. Hardware sem parecer continua no círculo vermelho interno e no sino. O anel abre a Central filtrada; o centro de hardware mantém o modal. Clique não registra parecer nem conclui atendimento. Ver [aceite D-094](../05-qualidade/DEMANDAS_MAPA_2026-11-11.md).

## Atualização D-095 — navegação da unidade

O clique no marcador/anel passa a abrir Unidades no ID selecionado, ou a Central filtrada se existir demanda aberta. Esta decisão posterior supera a abertura do modal pelo centro de hardware. A consulta de alterações e os pareceres continuam pelo sino; o círculo vermelho permanece sinalizado. Hover informa nome, alunos e vagas do cadastro mestre, com nulo distinto de zero. [Aceite D-095](../05-qualidade/CONSULTA_UNIDADE_MAPA_2026-11-11.md).
