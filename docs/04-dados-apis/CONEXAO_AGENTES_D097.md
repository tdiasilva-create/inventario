# D-097 — conexão observada do computador

Decisão expressa do responsável em 11/11/2026: mostrar IP público, provedor e último contato na ficha de cada computador, preservando o IP interno separado. Publicar no ambiente real sem reinstalar agentes.

## Origem e validade

O Worker observa a conexão do heartbeat assinado que já existe em `/api/agent/v1`. A assinatura, instalação, vínculo, idempotência, sequência/boot e janela de presença continuam sendo validados pelo núcleo. Somente heartbeat considerado vivo (coleta dentro da janela de 120 segundos e sequência mais nova) atualiza a observação junto à presença. O horário é o de recebimento pelo servidor, em UTC; a interface apresenta America/Fortaleza.

O IP vem de `CF-Connecting-IP`, preferindo `CF-Connecting-IPv6` quando o modo Pseudo IPv4 fornece o IPv6 original. Provedor/rede e ASN vêm de `request.cf.asOrganization` e `request.cf.asn`, metadados do runtime Cloudflare. Nunca usar nome de provedor enviado em cabeçalho/corpo pelo cliente, IP do administrador que abre a ficha, IP da rede local ou X-Forwarded-For. Sem metadados confiáveis, IP válido ou em subrequisição indicada por CF-Worker, não registrar uma atribuição de rede. O heartbeat válido continua sendo aceito.

Não há consulta externa de IP, DNS reverso, localização ou velocidade. A organização do ASN pode diferir do provedor comercial contratado; NAT/CGNAT podem fazer vários computadores compartilhar o IP público. VPN/proxy podem alterar a rede observada. Não usar esse endereço como identidade permanente nem para mover coordenadas/unidade. Não gerar alerta de hardware por alteração de IP/provedor.

## Persistência e API

Campo aditivo `network_observation` no JSON existente `agent_presence.data_json`, gravado pela mesma atualização condicional da presença, sem nova tabela, migração ou escrita por equipamento adicional:

| Campo | Conteúdo |
| --- | --- |
| public_ip | IPv4/IPv6 normalizado observado pelo servidor |
| ip_version | 4 ou 6 |
| provider | Organização da rede, até 200 caracteres, ou null |
| asn | ASN inteiro válido, ou null |
| observed_at | Recebimento do heartbeat vivo, UTC |
| source | cloudflare |

`GET /api/inventory/agent-status?equipmentId=ID` expõe `agent.presence.network_observation`. Último contato continua em `agent.presence.last_live_contact_at`; última observação na máquina e recebimento de fila atrasada permanecem distintos. Leitura conserva autenticação, permissões e vínculo por ID. Vínculo encerrado não expõe a conexão atual de uma instalação posteriormente movida. Equipamento manual não recebe observação inferida.

Repetição idempotente, sequência antiga, heartbeat atrasado ou assinatura inválida não sobrescrevem a observação. A gravação usa o mesmo controle de concorrência de presença. Um heartbeat vivo sem metadados suficientes deixa a observação null; se apenas a organização estiver ausente, guarda IP/ASN disponíveis com provider null, sem reutilizar o provedor da conexão anterior. Dados legados sem o campo permanecem válidos. Armazenamento representa a última conexão observada, não um histórico de acessos.

## Interface e compatibilidade

Bloco compartilhado Conexão de rede na ficha de Computadores, na consulta de Equipamentos (também matriz/unidade/busca) e no modal Dados do agente. IP público, Provedor / rede identificada e Último contato do agente aparecem separados de IP interno / interfaces de rede, que lê somente os endereços já reportados no inventário técnico de rede. A política existente collect_network_addresses não é alterada; quando o agente não informa esses endereços, mostrar IP interno não informado pelo agente.

Ficha de Computadores consulta somente enquanto aberta e visível, a cada 15 segundos, com atualização manual. Fechamento cancela a consulta e o intervalo; erro mantém leitura anterior com aviso explícito. Consulta de Equipamentos mantém atualização já existente. Configurações conserva consulta sob demanda. Sem consultas por máquina na listagem geral. Textos são escapados e IPs longos quebram linha no celular.

Não altera corpo, assinatura, ACK, versão de protocolo, política de coleta, QR, instalador ou perguntas. Nenhuma reinstalação é necessária: agentes já vinculados preenchem os campos na próxima comunicação válida após a publicação. Máquinas que não comunicarem continuarão com dados anteriores/ausentes explicitamente identificados.

Referências oficiais: [Request / IncomingRequestCfProperties](https://developers.cloudflare.com/workers/runtime-apis/request/), [cabeçalhos Cloudflare](https://developers.cloudflare.com/fundamentals/reference/http-headers/). [Testes e publicação](../05-qualidade/CONEXAO_AGENTES_2026-11-11.md).
