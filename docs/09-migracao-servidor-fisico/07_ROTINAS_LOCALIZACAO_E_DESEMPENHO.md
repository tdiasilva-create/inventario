# 07 · Rotinas, técnicos, alertas e desempenho

## Agendador único A IMPLEMENTAR

O export `scheduled()` em `server/worker.mjs` precisa ser executado por serviço de tarefas no destino. Não iniciar uma cópia por processo HTTP nem por host de interface. O sistema atual tem cron somente no Worker painel. Na transição, desligar o executor anterior antes de habilitar o novo escritor/executor.

| Rotina atual | Momento | O que preservar |
|---|---|---|
| `runAgentMonitoring` | Cron de minuto | Cursor incremental, baseline, deduplicação e recuperação de erro; não pular snapshots intermediários |
| `runProviderReports` | Chamado pelo minuto; decide vencimento | Segunda 08:00 Fortaleza, uma emissão por período, sem fabricar semanas ausentes |
| `cleanDispatchPositions` | Cron de minuto | Remover posições não autorizadas/expiradas; não arquivar trilha |
| `refreshD1Usage` | Cron respeitando cinco minutos | Analytics/KV independente de falha/quota do D1 |
| `manutencaoAgentes` | 03:23 UTC diariamente | Retenção aprovada, nonces/desafios/recibos vencidos; preservar snapshots/referências que a política mantém |

Agendador proposto: supervisão pelo SO, lease/lock com vencimento e execução idempotente; ao reiniciar não lançar dezenas de execuções atrasadas em paralelo. Registrar último início, sucesso, falha sanitizada e atraso. Distinguir falha de uma rotina das demais, preservando o comportamento relevante de `Promise.allSettled`/erros no código atual.

Em banco restaurado de ensaio, cron fica desligado e saídas para integrações reais bloqueadas. Caso contrário, tarefas podem purgar dados antigos, apagar arquivos reais ou gerar um relatório como se fosse produção.

## Técnicos e localização

Decisões atuais: root ordena fila única, cada demanda até dois técnicos habilitados, cada técnico até um atendimento ativo. Aceite exige posição válida; conclusão por um integrante conclui para a equipe com autoria. Não alterar essas regras ao trocar a tecnologia de localização.

O servidor valida tempo/precisão/coordenadas; a versão analisada exige observação nos últimos 90 s, tolera até 30 s no futuro e precisão positiva até 5.000 m. Esses limites são do código existente, não metas de qualidade de GPS. Posição antiga não deve ser exibida como recém-observada porque foi importada agora.

APK solicita localização a cada 15 s/10 m e está sujeito ao Android. O mapa usa posição recente e sessão/atendimento correspondentes. Encerramento, revogação ou perda da autorização interrompem o fluxo; localização não vira histórico permanente. Recuperação de app/permissão precisa ser testada no aparelho.

## Trajeto por ruas

`dispatch-road-routing.mjs` mantém a ordem do root, usa OSRM/FOSSGIS autorizado e não otimiza a sequência. Valores da versão analisada: posição fresca até 180 s, cache de rota 120 s, deslocamento de referência 75 m, snap máximo 500 m; janela global de chamadas de 1,2 s, lease 15 s, timeout 9 s e cache curto de falha 30 s.

Preservar controle global no banco/serviço compartilhado: cache por processo sozinho pode fazer vários processos excederem o limite combinado. Falha de OSRM não desenha reta fingindo rota calculada. Enviar somente coordenadas necessárias, nunca nomes, contas ou descrição da demanda. Não armazenar histórico de GPS para reaproveitar rotas sem decisão específica.

## Hardware, comunicação e mapa

- Hardware confiável alterado gera evento deduplicado; sino conta pendentes de parecer, leitura não resolve. Modal abre por interação e mantém contexto/antes/depois, autor/data e encaminhamento idempotente.
- Demanda aberta mantém anel no mapa conforme D-094, cor do centro segue tipo da unidade. Clique e tooltip seguem D-095; não reverter por usar outro servidor.
- Presença recente usa prazo padrão de 17 min; falta de heartbeat não comprova que a máquina esteja desligada.
- Perda inesperada vira log após mais de 48 h, não sino. Suspensão/desligamento informados e vínculos encerrados/revogados são estados diferentes.
- Escola online é a métrica aprovada de pelo menos um agente comunicando; offline não é prova de queda de todos os links de internet. Manter filtros e listas do modal.

Testar passagem do tempo sem receber eventos novos: uma implementação que só atualiza status quando grava heartbeat pode manter máquinas online indefinidamente.

## Desempenho: não perder as correções D-103–D-110

Conservar bundles/hash, pausa da aba oculta, consultas compartilhadas de 15/60 s, batch de fotos sem carregar BLOB desnecessário, redução de redesenho do mapa, índices/projeções e revisões transacionais. Resultado 304 só após autorização fresca e revisão correspondente; presença/demandas permanecem frescas mesmo com catálogo em cache. Não criar cache global de usuário/role/cookie/GPS.

Medições D-110 já existem, mas não representam benchmark do servidor físico. Definir cenário reproduzível: agentes a cada 300 s (200 máquinas são 40 heartbeats/min em média, sem contar inventário, retry ou rajada de boot), painéis a cada 15/60 s, técnicos ativos, coletas concorrentes e fotos. **40 requisições/min não são 40 leituras SQL**; cada requisição envolve autenticação/consultas/escritas e índices.

Executar no destino com dados sintéticos proporcionais ao volume previsto e pelo menos duas vezes a simultaneidade planejada, como proposta de margem a confirmar. Incluir rajada de reinício, relatórios/exportações, upload simultâneo, disco lento e perda de rede. Medir p50/p95/p99, erro, filas, tempo de lock, CPU/RAM, disco/WAL, bytes de tráfego e idade do GPS; não apenas tempo de abrir a página na LAN.

Não prometer suporte a 200 ou mais computadores com base só no tamanho atual do SQL. Registrar capacidade observada, limites e configuração usada. Configurar limites de concorrência/retry sem alterar o protocolo que os agentes já entendem.

## Medidor D1 após migração

Se D1 deixar de receber dados de negócio, seu medidor continua refletindo apenas a conta Cloudflare. Não mostrar zero de D1 como prova de saúde do servidor. Implementar, em módulo separado, saúde de HTTP, SQLite/PostgreSQL, disco/espaço, backup, Drive, cron, GPS e fila; definir alarmes e responsáveis.

Se houver ponte Worker/KV, quotas desses componentes continuam relevantes. Retirar D1 não elimina automaticamente limites da borda, internet do prédio, OSRM ou Google. Nenhuma mudança de plano foi feita nesta análise.
