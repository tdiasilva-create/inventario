# Testes de internet — evidências e publicação D118

**Adendo às 18:42 Fortaleza:** o teste físico reproduziu falha do instalador rc1. Corrigido no **rc2**, que instalou e iniciou o serviço; cadastro aceito/QR disponível confirmados. Falta vincular à unidade e medir. [Falha, testes e execução acompanhada](CORRECAO_INSTALADOR_D118_RC2_2026-11-14.md). As evidências locais e a publicação originais abaixo permanecem históricas.

Estado em 14/11/2026: **publicado às 17:47 Fortaleza; ainda não homologado em máquina física**. Nenhuma instalação no computador do responsável, teste externo de velocidade ou dado fictício em produção.

## Evidências

- 311 testes Node aprovados (`node --test --test-concurrency=1 tests/*.test.mjs`), incluindo dez específicos novos nessa rodada. Após acrescentar a prova de concorrência/teto global/índice, os onze testes específicos passaram novamente. Cobrem permissões/CSRF, agentes antigos, idempotência, concorrência por unidade, cancelamento, expiração, assinatura, vínculo encerrado, resultado incompleto/inválido, recepção tardia e paginação com horários idênticos.
- 60 testes legados do núcleo reconstruído aprovados. Dois testes inicialmente falharam por configuração/caminho do executor novo; corrigidos modo InvariantGlobalization e caminho para Core, não relaxadas as regras de produto.
- Um teste adicional de diário/reinício aprovado: recuperação só envia resultado, preserva chave/estado, mantém resultado com resposta 503 e arquiva somente após confirmação. Nenhuma transferência repetida.
- 14 verificações de medição/compatibilidade: latência leve, sem tráfego volumoso nesse modo, cancelamento, erro HTTP, transferência incompleta, limites 32/8 MiB, destino fixo, ACK antigo/novo, capacidade no heartbeat, todas as assinaturas públicas do Core 0.1.8 preservadas. HTTP simulado, não prova velocidade real.
- Navegador Edge, Worker real com SQLite isolado: pesquisar/selecionar, solicitar, abrir detalhes, cancelar, consultar estado, busca vazia e feature flag desligada. Telas 1672 × 1050 e 390 × 844 capturadas em `evidencias/internet-d118/`. Dados marcados DEMO LOCAL, IP de documentação.
- Build painel: 142 arquivos base, 10 bundles; build coletor: 56 arquivos. Wrangler dry-run compilou sem publicação. Roteamento OSRM também passou na verificação workerd; nenhuma mudança de localização/permissões Android.
- Core compilado com 0 erros; 84 avisos de nulabilidade do código reconstruído preservados e registrados, sem apresentá-lo como fonte original limpa.
- Instalador NSIS produzido, extraído novamente sem execução e hashes de Core/base conferidos: `SemedAgente-Instalador-0.1.9-rc1.exe`, 26.596.836 bytes. SHA-256 `90EF90B2BFAD914D081B36CC6FD42822B760C85303B91D76FD6F3872DB4D54F2`. DLL nova `3FF51B57FC03010257246D676E4C72DF937931787307A115CF2555115657E26A`. A montagem não equivale à instalação aprovada.

Logs privados locais em `private-data/agent-build-tools/`: `network-core-build.log`, `network-tests.log`, `legacy-tests.log`, `full-node-tests.log`, `installer-build.log`, `worker-dry-run.log`. Origem, limitações e comandos reproduzíveis: [Windows](../../windows/agent/README.md) e [contrato D118](../04-dados-apis/TESTES_INTERNET_D118.md).

## Critérios restantes para o piloto

Conferência autenticada da página/lista reais; teste do serviço real após atualizar uma máquina, mesmas identidade/chave/vínculo/pendências; geração/leitura real de QR em instalação nova; amostra de download/upload via prestadora real; cancelamento durante transferência; falta de internet/retorno sem repetição; preservação de inventário e alertas de peças. Não confundir resultado sintético de teste, link contratado e medição física.

## Publicação autorizada e verificada — 14/11/2026

Autorização recebida: “Sim, publicar e preparar o piloto”, incluindo migração 0034, ambos Workers, destino speed.cloudflare.com e limites 45 s/40 MiB. Sem nova contratação.

- Backup prévio: `private-data/releases/network-tests-d118-2026-11-14/before-0034.sql`; SHA-256 `B031947D49BF0671497E923C2A4EFC63099E520BE4D5EBEF785B53E3F8EA3E03`. Dados/segredos permanecem privados, fora do repositório público.
- Aplicada somente `0034_agent_network_tests.sql`. Leitura remota confirmou 34 migrações, seis índices da tabela (incluindo os automáticos) e zero pedidos; nenhuma medição foi solicitada.
- Coletor publicado às 17:47:18 Fortaleza: `6146632e-8ad0-4998-afb8-89d1a5542c4a`, 100%.
- Painel publicado às 17:47:43 Fortaleza: `3a576dde-3df4-4728-aa39-36a5210a2d5d`, 100%.
- `AGENT_NETWORK_TESTS_PROVIDER=cloudflare` nos dois; demais variáveis, D1, KV, Drive, segredos e cron mantidos.
- 51 checks HTTP do painel + 14 do aplicativo + 13 específicos novos = 78 aprovados. Novas rotas de máquina retornam `401 AUTH_FAILED` sem assinatura; APIs root exigem sessão; página e código privado redirecionam ao login. Não equivale à homologação do fluxo autenticado físico.
- APK preservado: 1.0.4, SHA-256 `f258f5f8a483a52d092d9a0d4d8bceba89654256524dae24a28b369c397a82a5`. Coleta e localização D114/D115/D117 preservadas no build.
- Ferramenta de navegação interrompeu a conferência por não conseguir determinar a URL do navegador com segurança. Nenhuma ação de login, instalação ou teste foi feita por essa via. Capturas existentes são locais DEMO, não telas reais autenticadas.

Logs privados de deploy/migração no mesmo diretório do backup; evidências HTTP em `evidencias/internet-d118/producao/`. Script reproduzível: `scripts/verify-network-tests-release.mjs` (dois endereços como argumentos). Instalador e roteiro entregues em `C:/Users/SIGAE/Downloads/SEMED_PILOTO_INTERNET_0_1_9/`. Distribuição geral permanece condicionada ao piloto.

O instalador de referência D056 e o 0.1.8 recebido continuam preservados. Novo arquivo é piloto e não substitui automaticamente a distribuição existente. Base original do questionário, coleta mobile e fotos não mudam neste escopo.

Atualização física às 18:50 Fortaleza: vínculo, inventário e verificação leve concluídos no PC designado. Resultado real 92,49 ms / variação 22,44 ms; solicitação administrativa identificada, recebimento/execução/resultados pelas rotas assinadas reais. Velocidade e acionamento pelo botão ainda não homologados. Ver [piloto rc2](CORRECAO_INSTALADOR_D118_RC2_2026-11-14.md).
