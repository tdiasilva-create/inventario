# 04 · Banco, cópia consistente e restauração

## ATUAL: esquema reproduzido

31 arquivos SQL ordenados, 88 tabelas de aplicação, 58 índices explícitos, duas views e 68 triggers. O [dicionário](../07-operacao/gerado/DICIONARIO_DADOS.md) lista colunas, tipos, defaults, PK e FKs. O [JSON](../07-operacao/gerado/schema.json) contém SQL de objetos e SHA-256 de cada migração. Inclui miniaturas binárias, referências Drive e tokens cifrados; o dump real é privado.

`d1_migrations` é controle do serviço e não integra a contagem de 88 tabelas de aplicação. Exportações podem incluir objetos de controle; classificá-los durante o ensaio, sem descartar tabelas desconhecidas automaticamente. D1 é baseado em SQLite, mas exportação precisa ser validada no runtime escolhido. [Guia oficial de importação/exportação D1](https://developers.cloudflare.com/d1/best-practices/import-export-data/).

## Grupos que não podem ser separados

| Grupo | Preservação exigida |
|---|---|
| Usuários/sessões/perfis/configuração | IDs, hashes/salt, credential_version, must_change, habilitação técnico, auditoria; pepper correspondente fora do dump |
| Unidades/cadastro | IDs, tipo real, INEP/NULL, nome, gestor, coordenadas e campos escolares opcionais; não reclassificar pelo nome |
| Visitas/assuntos | ID, versão do formulário, estados, versões, autoria, respostas atuais e publicadas |
| Equipamentos/ambientes | ID permanente, vínculo de unidade/ambiente, posição, nomes administrativos e origem manual/agente |
| Publicação | Snapshots e totais correspondentes à mesma conclusão; não recalcular com respostas de rascunho |
| Históricos/exclusões | Recibos, alterações, arquivos de equipamentos retirados, motivos, autores e datas |
| Imagens | Foto/target/visita, estado ready, provedor/file ID, fila de exclusões, miniaturas e versões |
| OAuth | Integração, pasta, tokens cifrados e eventos; chave AES-GCM fora do dump |
| Agentes | Instalações/dispositivos/chaves públicas, vínculo, nonces, desafios/QR válidos, recibos, snapshots, presença e localização administrativa |
| Monitoramento | Baselines, último snapshot processado, eventos, decisão, leitura por usuário e vínculo com demanda |
| Demandas/técnicos | Ordem, atribuições, eventos/recibos, versão, atendimento ativo, posições efêmeras e perfis de avatar |
| Relatório/otimizações | Histórico semanal imutável, projeções D-108 e revisões/triggers D-110 |

Ao importar histórico com coordenadas efêmeras, não reexibir posição antiga como atual. Validar timestamp, sessão e atendimento ativo; executar a política de limpeza existente somente no ambiente/horário correto. Não criar trilha permanente como efeito colateral de backup ou de uma nova tabela de logs.

## Dois caminhos de restauração que não se misturam

**Banco vazio de desenvolvimento:** aplicar migrações 0001–0031 em ordem, com registro de hashes e testes. Seed sintético só em banco vazio isolado. `bootstrap-auth.mjs` contém DELETE e não é ferramenta de recuperação de produção.

**Banco completo restaurado de produção:** importar o dump consistente no destino vazio, conferir esquema/objetos e estabelecer controle de migrações já aplicadas. Não aplicar todas as migrações novamente sobre tabelas restauradas. Só executar migrações novas posteriores ao ponto do backup após revisão/ensaio.

Não renomear `0015_questionario_v3.sql`, reordenar SQL ou editar migração já aplicada para facilitar importação. Preservar os bytes dos SQLs; `.gitattributes` marca migrações como `-text` por causa dos hashes.

## Ensaio de restauração antes de qualquer corte

1. Obter export privado com instante, código, esquema e hash; salvar inventário de objetos e totais por tabela em material privado.
2. Criar diretório/banco exclusivo de ensaio. Bloquear saída para Drive real, envio de agentes e tarefas destrutivas. Não publicar o clone restaurado na internet com contas reais.
3. Inspecionar SQL/PRAGMAs/ordem de criação/carga. O export pode conter tabelas, triggers e projeções já materializadas: restaurar sem duplicar incrementos. Ensaiar exatamente o arquivo e estratégia que serão usados no corte.
4. Importar, capturar falhas e recusar restauração parcial. Se for necessário desabilitar FKs durante carga por dependência cíclica, fazê-lo somente em banco novo de ensaio, reativar e exigir `foreign_key_check` vazio antes de qualquer uso. Não desabilitar integridade no servidor em operação.
5. Executar `integrity_check`, `foreign_key_check`, comparar objetos/índices/views/triggers e tipos dos campos. Conferir também chaves lógicas sem FK explícita.
6. Comparar contagem e hash canônico das linhas por tabela, ordenadas por chave estável. BLOB comparado como bytes, JSON/texto sem conversão de significado; identificar diferenças esperadas somente se registradas.
7. Conferir consultas de negócio: lista/categoria das unidades, ambientes, parcial/publicado, fichas/nomes, fotos por ID, agente ativo versus encerrado, histórico, demandas e relatórios semanais.
8. Repetir teste com transação interrompida, erro de constraint e resposta perdida; verificar que recibos/versões impedem duplicação.
9. Medir duração real de exportação, transporte, importação, validação e abertura; esses tempos determinam janela e RTO.

Apenas contagem igual não prova equivalência. Índices e triggers fazem parte do funcionamento, não são dispensáveis para ganhar tempo. A view `inventory_equipment_all`, por exemplo, não deve virar uma cópia de tabela que duplica equipamentos.

## Política de backup PROPOSTA

Definir RPO (perda máxima de dados tolerada) e RTO (tempo máximo para recuperar) antes da instalação. Frequência/retencão precisam ser aprovadas pela instituição; não estabelecer prazos de eliminação de histórico nesta migração.

Para SQLite local ativo, usar mecanismo de backup consistente (API de backup ou alternativa validada), não copiar apenas o arquivo `.sqlite` enquanto há WAL aberto. Conferir restauração, hash, criptografia e espaço livre. [SQLite Backup API e alternativas](https://sqlite.org/backup.html).

Propor cópias em mídia/local distinto, inclusive fora do prédio, com acesso mínimo e teste recorrente de restauração. Backup deve incluir: banco, manifesto dos arquivos Drive, cópia recuperável das fotos/avatares, configurações, hashes do release e acesso às chaves em cofre separado. Sincronizar pastas não basta como versionamento contra exclusão.

Não armazenar dumps/credenciais no Git público, ticket, chat ou imagem de container. O histórico de relatório de provedores e logs de auditoria contém informações operacionais e acompanha a mesma proteção do banco.

## Quando optar por PostgreSQL

Criar exportação tipada e versão de esquema-alvo, em vez de importar SQL SQLite diretamente. Validar tradução de cada campo/tabela e executar equivalência funcional. Mantê-la como trilha separada do primeiro port de runtime evita mudar, ao mesmo tempo, domínio, autenticação, protocolo e dialeto do banco sem localizar a causa de erros.
