# Monitoramento dos computadores — D-070, 08/11/2026

Solicitação explícita: implementar no painel notificações de troca de peças e perda de comunicação, com atualização automática, e publicar em produção. Usa a telemetria assinada já recebida do agente; não modifica EXE, perguntas, QR, Drive ou dados publicados das visitas.

## Componentes e fluxo

1. Agente envia heartbeat/inventário às rotas existentes no coletor. Assinatura, vínculo ativo, idempotência e qualidade continuam validados pelo contrato 1.0.
2. O Worker do painel executa `runAgentMonitoring` a cada minuto (`* * * * *`). O agendamento diário `23 3 * * *` continua separado para a manutenção de retenção.
3. O monitor lê somente agentes vinculados a equipamentos de unidades ativas. Grava eventos e referências comparativas no mesmo D1. Não depende de um navegador aberto.
4. A interface consulta a cada 15 segundos, enquanto a aba está visível. Ao ocultar a aba suspende as consultas; ao retornar consulta novamente. Requisição com tempo limite de 12 segundos; falhas exibem estado desatualizado e tentam novamente em 30 segundos. Não há pedidos sobrepostos.
5. Sino, contador, filtro de não lidas e histórico paginado em 25 registros. Marcar como lida é individual por usuário. Eventos não são apagados por essa ação. Link abre a ficha do equipamento; cadastros ainda não publicados ficam rotulados PARCIAL e direcionam ao Planejamento.
6. Lista/ficha preservam filtro, cursor, seleção, rolagem, imagens e seções abertas nas atualizações. Horários exibidos em America/Fortaleza.

## Presença e perda de comunicação

Regra existente preservada: `3 × heartbeat_interval_seconds + 120 segundos`. Com intervalo atual de 300 segundos, são 17 minutos. O servidor usa o horário de recebimento do último heartbeat considerado vivo, não a data de uma mensagem antiga reenviada da fila. O horário da máquina continua visível separadamente.

Estados: comunicando, comunicando com falha de leitura, sem comunicação recente, suspensão informada, desligamento informado, nunca comunicou, revogado/sem vínculo. Ausência de comunicação não prova que o computador está desligado. Agentes sem vínculo e cadastros manuais não são classificados como computadores desconectados.

Um incidente por vínculo + último contato; verifica novamente a presença antes de inserir para evitar falso alerta se chegou heartbeat durante a rodada. Novo contato encerra o incidente, mantendo-o no histórico. Suspensão/desligamento informados não abrem incidente de perda inesperada. Revogação, fim do vínculo ou inativação da unidade encerram incidente aberto com motivo correspondente. O primeiro processamento pode identificar uma ausência já existente; a data de detecção é distinta da data do último contato.

## Mudança de hardware

A primeira observação de cada vínculo estabelece referência sem inventar alertas retroativos. Compara snapshots posteriores em ordem cronológica, somente nas seções com `quality=ok` e campos suficientes. Cada componente mantém a última leitura confiável: uma seção parcial/ausente não apaga a referência. Primeira série confiável estabelece referência, não indica troca. Snapshot antigo, repetido ou de outro vínculo não retrocede a comparação. São processados até 200 snapshots por rodada; eventual acúmulo continua na próxima rodada, sem limite total de cadastros.

Cobertura:

| Componente | Comparação |
|---|---|
| CPU | Modelo, quantidade e núcleos reportados |
| RAM | Total, capacidades/tipos dos módulos; séries quando confiáveis |
| Armazenamento | Modelo/capacidade dos discos e séries confiáveis; exclui externo/removível/virtual quando identificado |
| Placa-mãe | Fabricante/modelo e série confiável |
| Vídeo | Identificadores PCI válidos, sem depender de nome de driver |

Listas são normalizadas para que reordenação não indique troca. Não compara IP, usuário, espaço livre, clock, versão de driver ou BIOS. Uma lista vazia ou leitura insuficiente não é interpretada como retirada de todas as peças. Modelos idênticos sem séries confiáveis podem ser indistinguíveis. Dispositivos sem indicação de localização podem ser reportados como discos físicos, sem garantia de serem internos. Periféricos, placa de rede, fonte, bateria e peças não reportadas não têm detecção nesta entrega.

O evento registra componente, antes/depois, data da referência anterior, data coletada e data detectada. É uma diferença reportada pelo agente, sujeita à confirmação física; não atribui culpa nem prova remoção. A detecção depende do próximo inventário que o agente enviar (política periódica atual: seis horas; eventos do agente podem antecipar). Não promete detecção física instantânea.

## Persistência, transações e acesso

Migração aditiva `0017_agent_monitoring.sql`:

- `agent_monitor_cursors`: referência confiável por componente/vínculo, marca temporal, revisão e token de commit.
- `agent_notifications`: evento único, equipamento/unidade/vínculo, detalhes e resolução.
- `agent_notification_reads`: leitura individual, FK para usuário/evento.
- `agent_monitor_health`: última execução bem-sucedida e quantidade processada.

Atualização da referência e inserção dos eventos usam o mesmo `DB.batch` transacional. Revisão/token condicionam gravação concorrente; evento possui chave única. Falha não deixa referência avançada sem alerta. Não copia respostas, fotos ou credenciais para as notificações. Exclusões de unidade continuam preservando histórico técnico; alertas órfãos não são oferecidos na API, que exige unidade/equipamento existentes.

`GET /api/inventory/monitoring?offset=0&unread=0&equipmentIds=<até 50 UUIDs>`: página, total, não lidas, incidentes abertos, horário da rodada, estados atuais dos IDs consultados. Sem escrita no GET. `POST /api/inventory/notifications/read`, JSON `{id}`, usa sessão, Origin e CSRF do painel e marca leitura somente do usuário atual.

Somente root, admin e visualizador no painel. Operador e rotas no coletor recebem 403; acesso anônimo recebe 401. Nada de email, push ou mensagens externas foi habilitado. O contrato de heartbeat/inventário e seu ACK permanecem inalterados.

Se a última rodada tiver mais de três minutos, a janela avisa que os alertas podem estar desatualizados. Estados de presença ainda são calculados no GET usando relógio do servidor. Falhas de consulta são visíveis e não simulam lista atualizada. A criação/propagação inicial de Cron Triggers pode levar alguns minutos, conforme [Cloudflare](https://developers.cloudflare.com/workers/configuration/cron-triggers/). Consultas são agrupadas para respeitar os [limites do D1](https://developers.cloudflare.com/d1/platform/limits/).

## Operação e reversão

Publicar somente o painel é suficiente: ele lê o D1 compartilhado, já alimentado pelo coletor existente. Preservar todos os bindings/segredos e o agendamento diário. Aplicar 0017 antes do código novo. Backup de D1 e versão anterior do Worker antes de publicar. Para reverter a interface/monitor, restaurar a versão anterior do painel e remover somente o cron de minuto; não apagar as novas tabelas nem restaurar todo o banco sobre dados recebidos posteriormente. A versão anterior ignora as tabelas adicionais.

Testes e registro de publicação: `docs/05-qualidade/MONITORAMENTO_2026-11-08.md`.

## D-081 — análise administrativa e mapa

0024 adiciona `agent_hardware_reviews` (decisão única por notification_id, operation_id único, usuário/data/observação, request_id opcional e snapshots de payload/contexto). Não modifica `agent_notification_reads` nem os cursores de detecção. Audit registra ação e ID, sem copiar componentes/segredos no texto do evento.

`GET /api/inventory/hardware-alerts?id=<UUID>&unitId=<UUID>&offset=0`: filtro por evento ou unidade, 25 registros por página; pendentes primeiro, depois demandas abertas. Consulta por ID também inclui decisões encerradas. `POST /api/inventory/hardware-review` recebe `{id,operationId,decision:"accepted"|"demand",note}`; nota opcional até 1.000 caracteres. Reenvio do mesmo usuário/payload devolve recibo; outra decisão após a primeira retorna 409. Aceitação e criação de demanda/histórico/audit são atômicas. Unidade inativa não aceita nova demanda. Demanda usa o evento de origem e mantém unidade/equipamento, inclusive contexto parcial claramente identificado.

`GET /api/inventory/monitoring` acrescenta `hardware` com totais pendentes, IDs dos 25 primeiros e contagens por unidade (pendentes/demandas abertas), independente da página e do filtro de lidas. Cada alerta inclui decisão, demanda e nome/hostname/ambiente/posição. Eventos novos guardam a localização no momento da detecção; legado é rotulado contexto atual. Sem cadastro/unidade ativo na consulta, registro histórico não ganha marcador fictício.

Somente root/admin escrevem decisões; visualizador lê, operador/coletor recusados. No mapa só a pendência de decisão anima; demanda aberta usa âmbar estático. Preferência de movimento reduzido respeitada. O ciclo da demanda não altera referência de hardware, e uma nova mudança pode gerar outro alerta. [Teste e publicação](../05-qualidade/HARDWARE_DECISAO_2026-11-10.md).
