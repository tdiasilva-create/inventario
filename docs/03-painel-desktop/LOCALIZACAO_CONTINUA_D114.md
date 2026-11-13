# D-114 — localização do técnico durante a fila

13/11/2026. Implementação solicitada pelo responsável após aprovação visual do APK 1.0.1. Fontes: pedido direto, resposta sobre expiração do login, governança/precedência, D105/D106/D107/D108/D110/D113, Android oficial e código atual. Coletor, agente Windows, inventário, alertas e plano gratuito preservados.

## Regra aprovada

- A atribuição pelo root, sozinha, não ativa GPS. O primeiro aceite confirmado, com permissão e posição atual, inicia o acompanhamento.
- O acompanhamento permanece enquanto existir ao menos uma demanda não concluída atribuída ao técnico. Concluir ou pausar uma demanda não interrompe o restante da fila. Demanda impedida continua aberta.
- Demandas novas atribuídas durante esse acompanhamento entram na mesma fila. Ao zerar a fila, o acompanhamento termina; uma nova atribuição posterior exige novo aceite para reiniciar.
- Dois técnicos continuam independentes. A conclusão por um deles vale para a equipe, mas a localização de cada técnico só termina quando a sua própria fila fica vazia.
- Uma demanda ativa por técnico permanece. Pausa libera esse atendimento; não significa encerrar localização. Sair da conta encerra o envio.
- Root acompanha a posição e a sequência viária restante, na ordem definida, com o mesmo avatar. Não se armazena trilha histórica de deslocamentos.
- Decisão específica do responsável: **a localização pode continuar após vencer o login**, exigindo novo login para consultar ou alterar demandas. Somente o envio de posição continua autorizado.

## Android 1.0.2

Pacote e certificado mantidos; versionCode 3. `LocationService` é um serviço nativo de localização em primeiro plano, independente da Activity/WebView, com notificação contínua. `stopWithTask=false` permite fechar/remover a tela sem encerrar o serviço; `START_STICKY` permite ao Android recriá-lo após encerramento do processo pelo sistema. Restaura apenas a credencial privada, revalida no servidor e só então pede posições.

GPS/rede: solicitação a partir de 15 segundos, distância mínima zero para também renovar a posição de técnico parado; envio aproximadamente a cada 25 segundos. `WAKE_LOCK` mantém a rotina durante tela bloqueada; é liberado no encerramento do serviço. Há custo de bateria e dados durante todo o roteiro. Não se solicita liberação automática de economia de bateria nem permissão de GPS permanente em segundo plano: o serviço é iniciado pela ação visível de aceite e permanece identificável na notificação.

Sem rede/5xx: novas tentativas com espera progressiva de 50 segundos a cinco minutos, sem fila de coordenadas. Depois da reconexão envia somente posição atual. Sem GPS: consulta autorização sem inventar localização. Posição vencida deixa de ser recente após 180 segundos no painel. Intervalo de leitura do mapa e cálculo OSRM preservados.

**Limites do Android:** Forçar parada, “Parar” no gerenciador de apps ativos, aparelho desligado, permissão revogada e restrições de fabricante podem interromper o serviço. Não contornar a decisão de parar do usuário. Reabrir o app permite verificar/retomar um acompanhamento ainda autorizado. Reiniciar o telefone não dispara GPS sozinho. Não é possível garantir posição ao vivo sem GPS/rede/execução. Testar cada modelo de aparelho utilizado.

Referências oficiais consultadas:
- https://developer.android.com/develop/background-work/services/fgs/service-types#location
- https://developer.android.com/reference/android/app/Service#START_STICKY
- https://developer.android.com/develop/background-work/services/fgs/handle-user-stopping
- https://developer.android.com/develop/background-work/services/fgs/restrictions-bg-start

## Autorização exclusiva para localização

O APK gera ID aleatório e segredo de 256 bits, enviados com o aceite autenticado e protegido por CSRF. O servidor guarda apenas SHA-256 do segredo. Recibo de aceite é idempotente e transacional; falha desfaz autorização, posição e eventos juntos. Não se entrega um segredo global no APK.

O segredo fica cifrado com AES-GCM e chave não exportável no Android Keystore, nas preferências privadas, fora do backup Android. Não há senha, cookie ou coordenadas nesse armazenamento. A ponte recebe o segredo somente para o aceite; nenhum token em URL, log, histórico de demanda ou resposta do mapa. O segredo não permite ler demandas, iniciar/concluir atendimentos ou acessar inventário.

Rotas exatas sem cookie (POST JSON com `Authorization: SEMED-Tracking ID.SEGREDO`):
- `/api/technician/tracking-heartbeat`: verifica usuário/capacidade/versão de credencial/fila; aceita somente uma posição atual ou consulta de autorização sem posição. Resposta: estado de autorização e horário do servidor, sem dados gerenciais.
- `/api/technician/tracking-stop`: encerra apenas o próprio acompanhamento; repetição é segura.

O coletor recusa ambas. Não há CORS de terceiros. Alterações normais continuam exigindo login, CSRF, atribuição e versão. A expiração natural/limpeza de sessão não encerra a capacidade nativa, conforme resposta do responsável. Logout/revogação da sessão válida que iniciou o acompanhamento, desabilitação de usuário/técnico, troca/reset de senha, retirada da última atribuição ou conclusão da última demanda invalidam a capacidade. O app também solicita revogação própria ao sair, inclusive com o login expirado; sem conexão, interrompe GPS imediatamente e um JobScheduler tenta enviar apenas a revogação. Não reativa GPS por esse job.

Novo aceite explícito em outro aparelho substitui o acompanhamento anterior; mensagens atrasadas do aparelho anterior são recusadas. Nenhuma autorização já encerrada é reaberta por repetição do recibo antigo.

## Dados e migração 0033

`dispatch_tracking`: autor, origem da sessão, versão de credencial, hash, início e encerramento/motivo; sem coordenadas. Uma linha ativa por usuário.

`dispatch_tracking_positions`: somente última posição, precisão, horário de observação e recebimento. Nova observação deve ser posterior; no máximo uma atualização a cada 15 segundos, cliente usa 25. Autorização revalidada na própria escrita para impedir uma posição concorrente à revogação.

`dispatch_tracking_routes`: somente última rota derivada, efêmera, removida ao encerrar/expirar/reordenar. Reutiliza gate OSRM e cache D106. Mapa prioriza acompanhamento da fila sobre posição legada, sem duplicar técnico; entre atendimentos mostra a próxima demanda na ordem do root.

`dispatch_open_counts`: contador por técnico mantido transacionalmente em atribuição, retirada, exclusão de atribuição e conclusão/reabertura. Evita varrer demandas históricas em cada heartbeat. Migração deriva contadores das atribuições existentes; não cria técnicos, demandas, aceites ou posições.

Encerramento limpa posição/rota imediatamente na transação. Cron remove posições com mais de 180 segundos e resíduos não autorizados, mantendo o histórico de início/fim, sem registrar deslocamentos. Dados posteriores de equipamento/coleta não são alterados.

## Compatibilidade, publicação e retorno

APK 1.0.0/1.0.1 e navegador preservam o acompanhamento por atendimento; não podem oferecer o novo serviço nativo por atualização de JavaScript. Nenhum aceite anterior é promovido automaticamente. Instalar APK 1.0.2 sobre o existente, com a mesma assinatura. Se já houver atendimento aberto no APK antigo, pausar e aceitar novamente com a versão nova para iniciar o acompanhamento da fila.

Aplicar 0033 antes do Worker e publicar APK/HTML/JavaScript compatíveis na mesma entrega. Não publicar o coletor nem alterar plano. Conferir projeção de contagens no banco e limites de acesso; não usar demandas/posições fictícias no banco oficial. Registro de execução: `docs/05-qualidade/LOCALIZACAO_D114_2026-11-13.md`.

Rollback de código conserva migração/dados. O Worker anterior não atende a nova credencial: novo APK deixa de atualizar localização e mostra falha, sem posicionamento fictício. Para retomar a versão antiga, voltar também à distribuição compatível e reabrir/aceitar atendimento conforme a versão. Não apagar histórico nem restaurar dump sobre novas gravações.
