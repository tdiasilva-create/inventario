# D118 — teste real de download e upload

14/11/2026, concluído às 18:56:03 (Fortaleza). Pedido expresso do responsável para medir esta máquina e conferir o resultado no painel.

## Máquina e execução

- DESKTOP-HOJK7JH, agente instalado 0.1.9 pelo rc2, unidade `teste`, ambiente `Casa`, posição `Mesa`.
- Equipamento `9897dea0-ae47-4588-9e7b-50e5562a450a`; pedido `25735a62-c952-4985-acc8-831e95e90c98`.
- Um pedido `speed`, criado às 18:54:43 pela conta administrativa Cloudflare autenticada. Autor `cloudflare-admin:piloto-autorizado`, origem `administrative_cli` e autorização expressa registrados no contexto. Não houve impersonação de sessão root.
- INSERT condicionado ao vínculo/instalação/unidade ativos, capacidade declarada, intervalo de cinco minutos e limite de fila; índice único por unidade preservado. Nenhum resultado foi inserido administrativamente.
- Agente recebeu o comando no heartbeat, iniciou pela API assinada às 18:55:47, mediu em `speed.cloudflare.com` e enviou o resultado pelas rotas autenticadas. Estado final `completed`, sem erro.

## Resultado real recebido

| Medida | Resultado |
|---|---|
| Download | 90,15 Mbps; 33.554.432 bytes em 2.977,7296 ms |
| Upload | 82,09 Mbps; 8.388.608 bytes em 817,523 ms |
| Latência HTTP | 52,47 ms |
| Variação | 36,30 ms |
| Duração total da medição | 14,113 segundos |
| Volume transferido | 40 MiB: 32 download + 8 upload |
| Rede identificada pelo servidor | PIX PROVEDOR DE INTERNET LTDA - ME |
| Interface local | Não identificada |

Ambas as amostras atingiram o limite de volume e estão marcadas `limited: true`. Representam esta medição breve, não capacidade máxima contratada, média semanal ou identificação de link dedicado/banda larga. IP público foi observado pelo servidor no início e está preservado no sistema/evidência privada.

## Verificações e limites

Recalculadas independentemente as duas velocidades a partir de bytes/tempo, conferidos os limites de 45 segundos/40 MiB, e repetida em produção a mesma consulta paginada usada pelo histórico do painel. O pedido aparece uma única vez na primeira página, com resultado idêntico. O renderizador da tela apresenta download/upload quando estado e resultado são `completed`, como neste registro.

Isso confirma medição física, envio assinado, persistência e presença na fonte de dados do histórico. A tela autenticada e o botão de solicitação não foram verificados visualmente neste ensaio: a revisão automática bloqueou a abertura da janela do navegador, sem motivo específico além de bloqueio pela política. Não foram extraídos cookies, criadas sessões nem contornada a restrição. O responsável pode abrir `/testes-internet` como root e clicar em Atualizar.

Evidências privadas: `private-data/releases/agent-0.1.9-rc2/pilot-speed/`, contendo manifesto, SQL do pedido, ACK administrativo, resultado real, consulta do histórico e verificação de cálculos/limites. Não versionar credenciais ou telemetria privada.

Permanecem pendentes: acionamento pelo botão com sessão humana, cancelamento, queda/retorno, atualização de máquina previamente vinculada e homologação antes de distribuição geral. Sem reinstalação, alteração de intervalo do agente, migração, deploy, permissões ou localização nesta execução.

## Complemento — solicitação real pelo painel root, 14/11/2026

A pedido do responsável, foi executado um novo teste inteiramente pela interface autenticada: busca por DESKTOP-HOJK7JH, Selecionar, tipo Velocidade · download e upload e Solicitar teste. Pedido das 21:36:18 (Fortaleza). A tela confirmou Aguardando agente e depois Concluído, sem novo INSERT administrativo nem novo pedido durante a espera.

Resultado desta execução: download 92,16 Mbps, upload 84,30 Mbps, latência 52,19 ms; IP/rede identificada e computador apresentados na mesma linha. A primeira linha do histórico foi deixada visível para o responsável. Captura real privada: private-data/releases/agent-0.1.9-rc2/pilot-panel/painel-teste-velocidade.jpg. A ferramenta de navegador voltou a estar disponível; a limitação visual registrada no primeiro ensaio é histórica e foi superada nesta conferência.

Acionamento pelo botão com sessão root e apresentação do resultado estão agora confirmados para esta máquina. Cancelamento, queda/retorno e atualização de outra máquina previamente vinculada permanecem pendentes. Nenhuma alteração de código, permissões ou deploy foi feita neste teste.