# D-105 — organização de demandas e aplicativo técnico

Data: 12/11/2026. O planejamento original abaixo foi sucedido pela implementação autorizada. Ver o adendo ao final e [registro de testes/publicação](../05-qualidade/ROTEIRO_TECNICO_2026-11-12.md); as afirmações de ausência de implementação descrevem somente a etapa documental inicial.

## Fontes consultadas

- Pedido direto do responsável para organizar atendimentos, atribuir técnicos, mostrar roteiro no mapa e preparar aplicativo Android próprio.
- Respostas expressas desta conversa: lista única; até dois técnicos; qualquer um pode concluir pela equipe; localização começa ao aceitar e desaparece ao finalizar; localização disponível é condição para aceitar/iniciar.
- `00_LEIA_ANTES_DE_TUDO.md`, `AGENTS.md`, `docs/00-governanca/REGRAS_DE_PRECEDENCIA.md`, decisões e pendências atuais.
- `docs/03-painel-desktop/CENTRAL_DE_DEMANDAS.md`, `server/service-desk.mjs` e `migrations/0018_service_desk.sql` para comparar com o funcionamento atual.

## Aprovado pelo responsável

1. Root organiza **uma lista única de demandas**, com arraste vertical para estabelecer primeiro, segundo, terceiro etc. Não é um quadro de colunas por técnico.
2. Cada linha pode indicar até **dois técnicos**, vinculados a contas; o root pode retirar ou trocar os responsáveis e modificar a ordem.
3. Cada técnico recebe sua listagem na sequência definida pelo root. Deve receber notificações de atribuições e mudanças no roteiro.
4. O técnico **aceita a demanda** para iniciar o atendimento. A atribuição pelo root, isoladamente, não inicia o compartilhamento de localização.
5. É necessário ter permissão de localização concedida e localização disponível para aceitar/iniciar. O responsável escolheu explicitamente bloquear o início sem localização, em vez de permitir atendimento sem acompanhamento.
6. Ao aceitar/iniciar, o compartilhamento de localização deve ficar ativo durante esse atendimento. Ao finalizar, a localização correspondente deixa de aparecer no painel.
7. Havendo dois técnicos, **qualquer um pode concluir pela equipe**, registrando a autoria da conclusão. Não exigir confirmação de ambos nem aprovação posterior do root para esse encerramento.
8. Aplicativo técnico simples: consultar sequência, aceitar/iniciar, responder, informar andamento/impedimento, registrar observação quando necessário e concluir por ações práticas.
9. Botão para criar/abrir rota para a próxima unidade.
10. Mapa do painel deve exibir o roteiro restante com tracejado fino e animado; os trechos referentes a atendimentos concluídos deixam a apresentação do percurso restante. Histórico das demandas permanece.
11. Trata-se de **aplicativo Android exclusivo para atendimento técnico**, separado do coletor e do painel gerencial. O painel desktop recebe a organização e o acompanhamento; não transformar o APK em uma cópia do painel nem do coletor.

## Situação atual verificada

O campo `service_requests.responsible` é texto operacional. Ele não concede acesso a uma conta, não representa uma atribuição a dois usuários e não envia push. O servidor atual exige relato escrito para concluir uma demanda. Há estados, histórico, idempotência e versão; devem ser preservados na evolução.

Este documento não afirma que ordenação, aceite por técnico, localização, notificações no Android ou APK já existem. D-071/D-086 descrevem os limites anteriores; a aprovação da expansão não torna sua implementação automática.

## Requisitos derivados para uma implementação fiel

- Atribuição e aceite são distintos. Cada técnico compartilha a própria posição mediante sua permissão e seu aceite; a ação do colega não deve ativar rastreamento em outro celular.
- O servidor deve autorizar cada ação pelo usuário, pela atribuição vigente e pela versão da demanda. Não basta esconder botões no APK.
- Uma posição antiga ou uma mensagem atrasada não deve ser apresentada como localização ao vivo. Mostrar horário da última atualização e indisponibilidade quando necessário.
- A conclusão da demanda encerra o compartilhamento associado a ela, inclusive se realizada pelo outro técnico. Posições atrasadas não podem recolocar no mapa um atendimento encerrado.
- Remoção da atribuição deve impedir novas posições/ações pelo técnico retirado; tratar a atualização atrasada e a reconexão explicitamente.
- Autor e momento de aceite, reatribuição, reordenação e conclusão ficam auditáveis. Reduzir o tracejado não apaga o histórico de atendimento.
- Não usar a posição do técnico para alterar as coordenadas oficiais da unidade.
- Não presumir que conceder localização no aplicativo equivale a permissão Android de segundo plano, nem declarar funcionamento com tela bloqueada antes de testar em aparelhos reais.
- Nenhuma decisão desta etapa autoriza guardar um histórico permanente de deslocamentos. A necessidade aprovada é acompanhamento durante atendimento ativo.
- Preservar identidade do painel, cores de unidades, anéis de demandas/hardware, permissões existentes, dados oficiais, coletor, QR e agentes Windows.

## Pontos estruturais a fechar antes da implementação dependente

1. Habilitação de técnicos nas contas: proposta de acesso específico concedido pelo root nas contas existentes, sem conceder o painel gerencial ao operador. Não foi aprovada criação de quinto perfil.
2. Aceite de uma demanda por vez ou de várias em paralelo. A regra precisa ser explícita para que concluir uma não deixe rastreamento indevido de outra.
3. Perda de GPS/permissão/rede **depois** do aceite: o bloqueio aprovado é para aceitar/iniciar. Não inferir cancelamento, conclusão automática ou impedimento de concluir um atendimento já iniciado.
4. Retirada/reprogramação, recusa, pausa e retomada: fechar as ações do técnico e seus efeitos no compartilhamento e na fila.
5. Rota por vias reais ou ligação visual entre unidades; ponto de partida, provedor de trajetos e comportamento para unidade sem coordenadas. Não anunciar navegação rodoviária a partir de uma linha reta.
6. Relato de conclusão no APK: pedido é de ações simples e observação quando necessária. Definir como a nova ação convive com a exigência atual de relato escrito no servidor, sem inventar relato do usuário.
7. Quem pode consultar localização no desktop; frequência, critério de posição recente e retenção técnica mínima. Não liberar a visualizador/admin por inferência das permissões antigas de demanda.
8. Distribuição e assinatura do APK, notificações push e suporte Android com tela bloqueada: escolhas técnicas e testes de campo ainda necessários; nenhuma credencial/serviço novo configurado.

## Critérios de aceite propostos

- Root arrasta/reordena, recarrega e encontra a mesma sequência; técnico vê somente suas atribuições nessa ordem. Erro/conflito de gravação fica explícito.
- Aceita até dois usuários distintos por demanda; terceiro é recusado pelo servidor. Nome livre não concede acesso.
- Sem permissão ou sem posição disponível, não confirmar aceite/início nem mostrar marcador de técnico fictício.
- Aceite e ações concorrentes/repetidas não duplicam eventos. Reatribuição invalida ações do usuário retirado.
- Conclusão por um dos dois encerra a demanda uma vez, registra quem concluiu e remove a localização associada; mensagens atrasadas não restauram o rastreamento.
- GPS ou rede indisponível não faz ponto antigo parecer atual. Testar em aparelho Android real, inclusive bloqueio de tela e retorno do aplicativo.
- Roteiro perde apenas os trechos concluídos; histórico e demandas pendentes permanecem. Unidade sem coordenadas recebe explicação, sem destino inventado.
- Novas atribuições e mudanças geram notificações apenas aos destinatários autorizados; repetir sincronização não duplica notificação.
- Identidade, coletor, dados existentes, fotos, anéis do mapa e consultas do painel não sofrem regressões.

Os testes acima são planejamento, não evidências de execução. Nenhum teste funcional, screenshot de aplicativo técnico ou instalação real ocorreu nesta etapa documental.

## Adendo de implementação — decisões finais e escolhas técnicas

Respostas expressas: um atendimento ativo por técnico; root habilita técnicos nas contas atuais sem criar quinto perfil; app abre rotas no Google Maps/similar, enquanto somente o root acompanha posições e tracejado no painel. Implementar, testar e publicar autorizado. Conclusão simples permite qualquer um dos dois atribuídos concluir um atendimento iniciado para a equipe, sem relato escrito obrigatório; auditoria registra autor e ação, sem inventar texto do técnico.

Central → Organizar atendimentos → Técnicos habilita as contas. Lista única com arraste/setas, dois seletores por linha e Salvar atribuição. Fila inicial conserva a ordem numérica; não habilitar nem atribuir contas automaticamente. Paginação de 100 linhas. Aplicativo próprio em `/tecnico`, APK `/tecnico/SEMED-Tecnico.apk`, root `/roteiro-demandas` no domínio do painel. Fonte Android e assinatura: [README](../../android/technician/README.md).

Escolhas técnicas reversíveis: somente root consulta posições; fila e mapa consultam a cada 15s em aba visível. O Android pede posições a partir de 15s/10m e envia aproximadamente a cada 25s. Aceite requer posição de até 90s, tolerância futura de 30s e precisão reportada maior que zero e até 5.000m. Não é prova antifraude. Posição deixa de ser recente após 180s; tooltip mostra horário e precisão. Armazenar apenas a última posição, nunca trilha permanente. Encerramento elimina posição imediatamente; cron de minuto limpa resíduos e sessões expiradas.

Tracejado fino animado conecta posição, destino atual e restante da sequência; não calcula ruas e isso é indicado na interface. Unidade sem coordenadas interrompe a ligação visual, sem destino inventado. Cores de unidades/anéis de hardware e demandas preservados.

Perda de GPS/rede depois do aceite não conclui nem cancela demanda. Posição vencida some; serviço nativo para após três minutos sem confirmação de autorização e retoma ao reabrir se ainda autorizado. Interromper/pausar encerra acompanhamento individual mantendo demanda e permitindo novo aceite. Conclusão/retirada/desabilitação/logout bloqueiam atualizações atrasadas. Coordenadas não aparecem no histórico de ações.

Avisos individuais persistentes de atribuição, retirada, reorganização e atualização. Com app aberto: 15s. Android em segundo plano: JobScheduler mínimo 15min, sujeito a adiamentos do sistema; **não é push instantâneo/FCM**. Foreground service de localização mostra notificação apenas durante atendimento. Forçar parada/reiniciar não inicia rastreamento sozinho. Sem fila offline durável.

Migração aditiva 0027, tabelas dispatch_* e transações com revisão/recibos. Usa demandas existentes; responsável textual anterior não vira conta por inferência. Não modifica coletor, inventário, QR, agente Windows ou Drive. Testes de servidor e navegador isolados executados, APK compilado/assinado. **GPS real, tela bloqueada, instalação e comportamento dos fabricantes Android ainda precisam do teste físico**, detalhado no roteiro de entrega.
