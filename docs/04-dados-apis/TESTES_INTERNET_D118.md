# D-118 — medição de internet solicitada pelo root

**Atualização 18:56 Fortaleza:** usar instalador **rc2**, que corrigiu a falha do rc1. Serviço, vínculo, inventário, teste leve e velocidade confirmados no PC designado. Medição real: 90,15 Mbps de download e 82,09 Mbps de upload, persistidos no histórico; amostra limitada a 40 MiB. Acionamento pelo botão/tela autenticada, cancelamento, queda/retorno e atualização de máquina previamente vinculada continuam pendentes. [Piloto e limites](../05-qualidade/PILOTO_VELOCIDADE_D118_2026-11-14.md). Versões de servidor abaixo continuam as mesmas; relato anterior é histórico.

14/11/2026. **Publicado nos dois Workers às 17:47 Fortaleza, com migração 0034 e provedor habilitado, após autorização explícita. Instalador 0.1.9-rc1 permanece piloto sem homologação física.** Pedido do responsável: novo instalador, comando no painel para um computador selecionado e ambiente para consultar resultados. Não é monitoramento de pessoas nem execução de comandos livres.

## Funcionamento

1. Root abre `/testes-internet`, pesquisa unidade/hostname/nome da ficha e seleciona computador com vínculo ativo. Máquinas antigas aparecem como atualização necessária.
2. Escolhe verificação leve ou velocidade. Pedido recebe UUID, autor, contexto da unidade/ambiente/computador, instalação e vínculo exatos.
3. O agente 0.1.9 declara `network_test_protocol: 1` no heartbeat assinado. O servidor oferece o pedido na resposta da comunicação existente. Não há novo polling de comandos. O início pode aguardar o intervalo vigente do heartbeat.
4. O agente registra o pedido em diário local protegido antes de iniciar. Confirma início com tentativa UUID e assinatura ECDSA. O servidor valida instalação, vínculo atual, prazo e concorrência.
5. O teste usa somente HTTPS em `speed.cloudflare.com`, sem nomes de alunos, arquivos pessoais ou identificadores da demanda. O serviço de medição observa o IP e o tráfego sintético.
6. Resultado resumido e autenticado fica no D1; bytes do teste **não atravessam o Worker nem são armazenados no D1**. IP/rede são observados no Cloudflare no início assinado do teste, nunca fornecidos como verdade pelo cliente.
7. Histórico consulta manual, com páginas de 50. O restante do painel conserva seus intervalos, localização dos técnicos e alertas. Somente root pode consultar/solicitar/cancelar este módulo.

## Limites implementados

| Item | Regra técnica |
|---|---|
| Verificação leve | Cinco amostras HTTP, até 15 s; latência mediana e variação média entre amostras. Não é ping ICMP nem medição de perda de pacotes. |
| Velocidade | Até 45 s; no máximo 32 MiB recebidos e 8 MiB enviados. Uma conexão de transferência por vez. |
| Resultados | Mbps calculados pelo servidor a partir de bytes/tempo. Só mostra medição completa quando ambas as transferências terminaram e há latência. |
| Máquina ocupada | Tráfego nos adaptadores ativos é amostrado antes da transferência; mais de 768 KiB em 1,5 s recusa o teste. Não detecta o uso de outras máquinas da escola. |
| Concorrência | Um pedido ativo por unidade; intervalo mínimo de 5 min entre pedidos por unidade; fila global de até 20 e até dois testes iniciados. |
| Offline | Pedido aguarda até 30 min e expira; não representa velocidade zero. |
| Execução | Autorização de até 60 s; reserva até 120 s. Agente aplica prazo local e verifica cancelamento antes das fases e a cada aproximadamente 5 s durante a transferência. |
| Queda/reinício | Diário `network-test.json` em ProgramData protegido. Fase em execução não é repetida após reinício; registra falha. Resultado sem ACK é reenviado; prazo de recepção de 24 h, sem renovar autorização de tráfego. |
| Cancelamento | Antes de iniciar impede execução; em execução sinaliza interrupção. Parecer de cancelamento prevalece sobre resultado concorrente. |
| Vínculo | Mudança/revogação/encerramento impede novas ações da instalação anterior; sem revelar conexão de uma associação encerrada. |

Os limites são escolhas técnicas conservadoras e ajustáveis; não são regras sobre contratação de internet. Teste curto pode subestimar links rápidos e pode impactar atividades durante a medição. Não prometer zero impacto, capacidade máxima, SLA, link dedicado ou banda larga identificados automaticamente. Contrato/tipo de link continuam dados administrativos a conferir. A interface de rede é `unknown` enquanto não houver observação confiável da rota; não inferir pelo primeiro adaptador ativo.

## Persistência e API

Migração aditiva `0034_agent_network_tests.sql`: tabela `agent_network_tests`; índices de entrega por device/state/expiry, histórico e exclusão de concorrência por unidade. Guarda autor/horários, contexto congelado, resultado e cancelador. Não altera unidades, equipamentos, fotos, agentes ou históricos existentes.

APIs humanas (sessão root do painel + CSRF/Origin nos POST):
- `GET /api/root/network-tests/computers?q=&after=` — vínculos atuais, capacidade e conexão mais recente, páginas de 50.
- `GET /api/root/network-tests?before=&unit=` — histórico, cursor composto horário + ID para não perder empates.
- `POST /api/root/network-tests/request` — `request_id`, `equipment_id`, `mode: light|speed`; mesmo UUID/conteúdo retorna mesmo pedido.
- `POST /api/root/network-tests/cancel` — `id`.

APIs de máquina: `POST /api/agent/v1/network-tests/start|check|result`. Mesma assinatura, timestamp, nonce, instalação e chave do protocolo atual; somente estado linked e vínculo ativo. Corpo fechado com `protocol_version: 1.0`, `installation_id`, `id`, `attempt_id` e resultado quando aplicável. Não existe URL/comando/script livre recebido pelo agente.

`AGENT_NETWORK_TESTS_PROVIDER=cloudflare` habilita oferta/início. Ausente: desligado. Resultados de testes já iniciados continuam podendo chegar para não perder evidência. Habilitar nos dois Workers quando a publicação for autorizada, pois o agente comunica com o coletor e o root usa o painel.

## Consumo D1 e implantação

Agente antigo não faz consulta de pedidos. Agente novo acrescenta uma busca indexada ao heartbeat existente quando a função está habilitada. Sem pedidos, não escreve em `agent_network_tests`. Consultas de acompanhamento existem somente durante o teste limitado. Tela não cria polling adicional. Testes HTTP volumosos vão diretamente ao serviço de medição; não há bucket, plano pago, novo cron, coleta de GPS adicional ou contratação.

Publicação realizada e próxima validação:
1. Responsável autorizou migração, ambos Workers, speed.cloudflare.com e piloto: “Sim, publicar e preparar o piloto”.
2. Backup privado conferido; somente a 0034 aplicada. Banco real confirmado com 34 migrações, seis índices da nova tabela e zero pedidos. Nenhum seed, exclusão ou instalação no PC administrativo.
3. API compatível nos dois Workers, flag habilitada; vars/segredos/bindings/cron preservados. Coletor `6146632e-8ad0-4998-afb8-89d1a5542c4a`; painel `3a576dde-3df4-4728-aa39-36a5210a2d5d`, ambos 100%. Os agentes 0.1.8 continuam compatíveis.
4. 78 verificações HTTP passaram, incluindo rotas novas protegidas e APK 1.0.4 idêntico. A ferramenta de navegação interrompeu a conferência por não identificar a URL com segurança; página/lista reais autenticadas ainda devem ser conferidas no piloto.
5. Atualizar UMA máquina designada com o instalador piloto; conferir identidade/vínculo/fila antes de medir. Depois testar leve, velocidade, cancelamento e reconexão. Para atualização de máquina já vinculada, não gerar outra ficha nem vincular outro QR.
6. Somente após homologação física, distribuir às demais máquinas. A API compatível já está publicada; não reverter para servidor que rejeite a capacidade enquanto houver agentes 0.1.9.

Reversão: desligar flag para interromper novos testes; preservar tabela e evidências. Servidor deve continuar aceitando a capacidade nova enquanto houver agentes 0.1.9. Instalador guarda backup local do Core, mas sua restauração não transforma instalação revogada em ativa.

## Fontes e limites do provedor

Serviço de medição: https://speed.cloudflare.com/about . Referência da implementação pública: https://github.com/cloudflare/speedtest . Destinos fixos `__down` e `__up`; disponibilidade/limites do serviço externo não são garantidos por este projeto. Não foram feitos testes de velocidade externos durante os testes locais: respostas de transferência foram controladas e identificadas como teste.

Referências do projeto: D-056/D-058 (instalador), D-070/D-088 (presença/alertas), D-097 (IP público/rede), D-099 (histórico de provedores) e D-108–D-110 (consumo). Nenhuma pergunta ou regra de coleta do TXT foi alterada nesta entrega.
