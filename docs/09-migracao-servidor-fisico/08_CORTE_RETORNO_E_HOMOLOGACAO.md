# 08 · Corte, retorno e homologação

**Runbook de planejamento. Não executar diretamente em produção.** Os comandos dependem de hostname, caminho, banco, acesso e runtime ainda não implementados. Não há flag de manutenção completa pronta que se possa simplesmente ligar hoje.

## Fase A — preparação, sem alterar a produção

1. Aprovar arquitetura, domínio, responsáveis, RPO/RTO e janela. Inventariar todos os clientes/integrações/escritores: dois Workers, cron, raiz/admin/operadores, APK, agentes Windows, uploads/callbacks e scripts administrativos.
2. Implementar adaptadores e barreira de corte. Novas alterações devem ter configuração por ambiente e teste de compatibilidade, sem modificar diretamente os dados reais.
3. Preparar servidor isolado, segredos de homologação e backups privados. Restaurar uma cópia sem egress de mutações para Drive real nem cron de manutenção ativo.
4. Executar matriz funcional e ensaio de carga. Usar tempo real de restore/validação para agendar janela, não estimativa baseada só em bytes.
5. Ensaiar todo o procedimento de corte e de volta usando cópias. Registrar tempo, hashes, IDs e resultado de cada etapa.

## Fase B — barreira de escrita a implementar

Precisamos impedir escrita tanto na origem antiga quanto em instâncias restauradas, inclusive jobs, agents, callbacks e arquivos. Só bloquear botões no navegador é insuficiente. Propor estado de manutenção/geração de destino validado no servidor e proxy, com mensagens de erro/retry compatíveis.

Definir como comandos já em trânsito terminam ou são recusados sem ACK falso. Drenar uploads, completar callbacks autorizados ou cancelá-los de forma explícita. Garantir que um agente não descarta mensagem só porque recebeu status de erro incompatível: testar versão real e política de fila antes do corte. A fila do coletor vive na aba; não há offline durável que proteja tudo automaticamente.

Não liberar dois escritores independentes durante propagação DNS. Se os hosts antigos permanecerem, passam a encaminhar ao novo backend único. Se o backend novo falhar, o antigo não pode voltar a gravar silenciosamente em uma base desatualizada.

## Fase C — janela aprovada

| Passo | Responsável / evidência de saída |
|---|---|
| Aviso operacional e pausa de novas coletas/atendimentos | Responsável; tratar atendimentos ativos e fotografias em envio |
| Suspender cron/mutações e drenar requisições | Operação; nenhum escritor remanescente |
| Export final de banco e manifesto de arquivos | Operação; data/hora, schema, release, hash e tamanho |
| Transferência cifrada/verificação de hash | Operação; origem = destino, sem anexar dump no Git |
| Restore final em destino vazio | Implementação; integridade, FKs e equivalência aprovadas |
| Configuração segura de runtime/hosts/segredos | Implementação; callback, sessão, origem de IP, permissões e assets conferidos |
| Testes ainda com escrita de usuários bloqueada | Homologação; login e consultas, leitura de fotos e agent handshake controlado |
| Apontar entrada/ponte para escritor novo | Operação; registrar instante e geração de corte |
| Liberar canário e depois usuários | Responsável; critérios de aceite abaixo, sem escritor antigo |
| Habilitar somente o cron novo | Operação; execução única e monitor de atraso |
| Observar janela combinada e manter backup de origem | Equipe; reconciliação de filas, uploads, hardware e GPS |

Durante o corte, dados que só existam na memória do navegador podem ser perdidos ao fechar a aba. Planejar conclusão de envios/rascunhos antes da pausa; não pedir para todos recarregarem sem avaliar pendências.

## Matriz mínima de homologação no destino

| Cenário | Evidência exigida |
|---|---|
| Quatro perfis, técnico habilitado/desabilitado | Mesmos 401/403 e capacidades; operador sem painel gerencial |
| Login/expiração/troca de senha/CSRF | Senhas existentes válidas, troca não se repete indevidamente; Origin forjada recusada |
| Unidade/ambiente/equipamento | Mesmo ID, nome corrigível, nulo/zero preservado; dados publicados e parciais distintos |
| Dois usuários editam a mesma ficha | Conflito/versão/trava explícitos, sem sobrescrita silenciosa |
| Conclusão/revisita | Pendências por ficha visíveis; publicação só após validação; histórico preservado |
| Foto/câmera/galeria | Upload, ready, leitura no painel, miniatura/fallback, renovação Google e erro seguro |
| Upload interrompido/ACK perdido | Sem sucesso fictício, duplicação nem perda de referência |
| Agente existente e novo | Identidade/chave/vínculo mantidos; enrollment/QR/claim e recibos funcionais |
| Alteração de peça | Baseline e cursor corretos; um evento, contexto/unidade/equipamento e parecer/demanda |
| Presença e log | 17 min e mais de 48 h testados com relógio controlado em homologação; suspensão/reconexão distintas |
| IP público/provedor | Origem confiável, IP interno separado; cabeçalho forjado não se torna informação oficial |
| Dois técnicos | Ordem/atribuições, um ativo cada, GPS com permissão, conclusão por equipe remove posição |
| Rota/OSRM | Parte da localização válida, ruas, ordem preservada, indisponível sem fallback reto |
| Relatório semanal | Um registro por período, uma linha por unidade, Fortaleza, histórico imutável |
| Cache/concorrência | 304 autorizado, edição invalida, relógio altera presença sem heartbeat, erro não vira zero |
| Reinício/energia/disco cheio | Sem corrupção ou ACK de escrita perdida; recuperação e alerta de falha |
| Backup/retorno | Restauração integral demonstrada dentro do RTO proposto |

Referências dos testes já existentes: `tests/security.test.mjs`, `auth-flow.test.mjs`, `collector-v3.test.mjs`, `collector-review-pending.test.mjs`, `agentes.test.mjs`, `agentes-open-enrollment.test.mjs`, `photo-storage.test.mjs`, `google-worker.test.mjs`, `technical-dispatch.test.mjs`, `dispatch-road-routing.test.mjs`, `agent-monitoring.test.mjs`, `hardware-review.test.mjs`, `provider-report-history.test.mjs`, `panel-read-cache.test.mjs`. São ponto de partida; adaptador/bridge/corte exigem testes novos e aparelhos reais.

## Critérios de parada

Não liberar se houver divergência não explicada de IDs/dados/objetos, FK inválida, login/permissão incompatível, foto inacessível, assinatura de agente quebrada, escrita em dois bancos, cron duplicado, observação IP forjável, perda de recibos ou restauração não demonstrada. Problemas de quota/Drive/OSRM devem ser claramente separados de falha do banco.

Para desempenho, estabelecer metas após baseline no servidor: bloquear liberação se a carga acordada provoca erros recorrentes/locks prolongados, fila crescente ou atraso inaceitável de GPS. Os valores alvo devem ser registrados antes do teste; não aprovar uma configuração só porque passou com um usuário.

## Retorno: antes e depois de novas escritas

**Antes de aceitar qualquer escrita no destino:** manter escritor novo bloqueado, reverter entrada e cron para origem consistente e documentar o aborto. Conferir clientes e artefatos antes de liberar.

**Depois de aceitar escritas no destino:** não restaurar simplesmente o backup antigo. Ele não contém novos equipamentos, fotos, demandas ou mensagens já confirmadas. Congelar ambos os caminhos, extrair/reconciliar alterações desde o marco de corte ou produzir export consistente de volta, preservar IDs/recibos e testar compatibilidade com o servidor antigo. Essa ferramenta/procedimento também precisa ser implementada e ensaiada antes da liberação.

Snapshots de VM e voltar o DNS, sozinhos, não resolvem perda de escrita. Aceitar perda dentro de RPO é decisão explícita do responsável, não atalho técnico silencioso. Manter origem preservada e acessos de recuperação até encerramento formal da migração.
