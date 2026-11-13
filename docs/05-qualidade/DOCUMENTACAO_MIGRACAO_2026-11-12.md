# Atualização do repositório para preparação de migração física

Pedido: atualizar código/documentação no GitHub e criar branch de análise. Autorização desta entrega cobre documentação e Git; **não executa migração, deploy, troca de DNS ou modificação de dados de produção**.

## Fontes e escopo

Consultados: `00_LEIA_ANTES_DE_TUDO.md`, `AGENTS.md`, precedência, decisões, pendências, conflitos e rastreabilidade; manuais `docs/07-operacao/`; contratos de autenticação, Drive/fotos, agente/instalador, D-097/D-099/D-103–D-110; `server/`, entradas frontend, configurações Wrangler, fontes Android, scripts, migrações e CI. Base original e referências visuais preservadas: esta fase não altera telas nem questionário.

Arquivos trabalhados: entradas README/leia-primeiro, manual operacional, índice gerado de código, dicionário físico, exportador TXT, validação de links/segredos e documentação da análise em branch própria. Requisitos: preservar todos os IDs/vínculos, estado parcial/publicado, quatro perfis, fotos privadas, técnicos/GPS/rotas, alertas e plano atual durante preparação.

Aceite: instruções reproduzíveis com caminhos reais; esquema reproduzível; diferenças entre runtime atual e proposto explícitas; decisões pendentes identificadas; ausência de segredos/dumps/binários privados; código atual e análise acessíveis no remoto. Sem promessa de migração executada ou de homologação de hardware.

## Verificações locais

- Histórico ainda não enviado: 91 commits; scanner examinou 1.900 objetos / 1.109 blobs e não encontrou caminhos privados ou assinaturas conhecidas de segredos. Revisão complementar dos arquivos de documentação/configuração; o scanner não prova ausência de todo tipo de dado sensível.
- Esquema: 31 migrações em SQLite vazio, 88 tabelas de aplicação, 58 índices explícitos, duas views, 68 triggers; integrity_check OK e zero erros de FK.
- Índice estático: 421 arquivos de texto, dos quais 57 módulos servidor. Exclui vendor/binários e não se declara OpenAPI completa.
- Builds desktop e coletor aprovados (108/55 arquivos, oito bundles desktop no checkout usado).
- Cinco testes de desempenho aprovados após build concluído. Uma primeira execução ocorreu enquanto o build reescrevia os assets e falhou na referência HTML/manifesto; repetição sequencial passou sem alteração do runtime. A CI já mantém essa ordem sequencial.
- Suíte atual: **268/268 testes aprovados**, mais teste de rotas no runtime Cloudflare workerd aprovado. Não houve escrita em produção.
- Links locais: 561 referências verificadas, sem erro no fechamento documental da main. Regeneração de esquema/índice/TXT conferida antes do commit. Novos links da branch serão verificados separadamente.

## Transferência e limitações

O banco real, imagens, tokens, keystore Android, executáveis e backups continuam privados. Cinco documentos avulsos já existentes e não rastreados no checkout foram preservados, sem inclusão automática como novas decisões. O código funcional-base é `5cb844b` (D-110), já publicado anteriormente; esta atualização documental não republica os Workers.

A branch de análise propõe arquitetura e tarefas, mas a escolha final de servidor, domínio, banco, continuidade dos agentes, RPO/RTO e janela de corte exige definição do responsável. Não há instalador/Docker de servidor físico pronto nesta entrega.
