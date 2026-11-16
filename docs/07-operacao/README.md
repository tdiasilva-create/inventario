# Operação, manutenção e migração

Referência atual: **16/11/2026, até D124**. São **35 migrações**, 99 tabelas de aplicação, 72 índices explícitos, três views e 120 triggers, derivados em SQLite vazio. [Estado consolidado e versões](15_ESTADO_ATUAL_D124.md). [Entrada para auditoria independente](../08-auditoria/README.md). Os guias datados e adendos mantêm o histórico; contagens D110/D122 não representam a entrega atual. D123 e D124 já foram publicados; a preparação anterior de auditoria é histórica.

| Guia | Uso |
|---|---|
| [01 · Arquitetura](01_ARQUITETURA_ATUAL.md) | Interfaces, serviços e fluxos |
| [02 · Ambientes](02_AMBIENTES_E_CONFIGURACAO.md) | Recursos e nomes das chaves necessárias |
| [03 · Dados e contratos](03_BANCO_E_CONTRATOS.md) | Entidades, APIs e compatibilidade |
| [04 · Desenvolvimento](04_DESENVOLVIMENTO_E_TESTES.md) | Nova estação e verificações |
| [05 · Publicação](05_PUBLICACAO_E_ROLLBACK.md) | Release e retorno |
| [06 · Recuperação](06_BACKUP_E_RESTAURACAO.md) | Backup completo e restauração |
| [07 · Migração](07_MIGRACAO_DE_SERVIDOR.md) | Destino, corte e retorno |
| [08 · Segurança](08_SEGURANCA_E_INTEGRACOES.md) | Autenticação, Drive, QR e agentes |
| [09 · Pendências](09_ESTADO_E_PENDENCIAS.md) | Implementado versus homologado |
| [10 · Organização](10_REGISTRO_DA_ORGANIZACAO.md) | Verificações desta entrega |
| [11 · Estado D-110](11_ESTADO_ATUAL_D110.md) | Versões, serviços, rotinas e materiais de transferência |
| [12 · Mapa do código](12_MAPA_CODIGO_E_FLUXOS.md) | Módulos, contratos, fluxos e dependências de plataforma |
| [13 · Estado até D122](13_ESTADO_ATUAL_D122.md) | Versões, evolução recente e limites para a auditoria |
| [14 · Estado D123](14_ESTADO_ATUAL_D123.md) | Permissões e consumo após auditoria |
| [15 · Estado D124](15_ESTADO_ATUAL_D124.md) | Coleta, fotos, publicação e pendências preservadas |
| [Índice estático do código](gerado/CODIGO_E_ROTAS.md) / [JSON](gerado/codigo.json) | Arquivos, hashes, imports, variáveis e referências de API |
| [Checklist TXT](TRANSFERENCIA_E_MIGRACAO.txt) | Transferência para outra equipe |
| [Dicionário físico](gerado/DICIONARIO_DADOS.md) / [JSON](gerado/schema.json) | Esquema completo sem dados reais |

Onde cada resposta aparece: [mapeamento coletor → desktop](../06-entregas/MAPEAMENTO_COLETOR_PARA_PAINEL_DESKTOP_2026-11-05.txt).

## Autoridade

Requisitos seguem [DECISOES.md](../00-governanca/DECISOES.md) e [precedência](../00-governanca/REGRAS_DE_PRECEDENCIA.md). Documentação original preservada não é descrição literal da versão atual. Código local, commit Git e versão Cloudflare são identificadores diferentes. Prova de recuperação exige ensaio no destino; um SQL exportado sozinho não é essa prova.

Após mudança aprovada, atualizar guias, decisão/rastreabilidade, esquema quando houver SQL e registro da versão publicada. Nunca inserir segredos ou respostas reais nesses arquivos.

## Materiais privados de transferência

Exportação consistente do D1; imagens e manifesto de vínculos; segredos em cofre; acesso institucional Cloudflare/Google e OAuth; fontes/binários exatos do agente; evidências privadas. Não acompanham o clone público. `.gitignore` ajuda a excluí-los; os exemplos locais não concedem acesso à produção.
## Correção de ambientes — D-076, 09/11/2026

Os dois ambientes permitem corrigir nomes mantendo o ID: operador no assunto Ambientes de uma visita aberta; root em Ambientes no painel. Migração 0021 adiciona versão e histórico/recibo; consultas exibem o nome corrigido sem reescrever snapshots ou mover equipamentos. [Aceite e versões publicadas](../05-qualidade/EDICAO_AMBIENTES_2026-11-09.md). Aplicar todas as 21 migrações em uma nova instalação; a descrição histórica de 20 migrações em materiais anteriores não substitui o diretório atual.

## Nomes de equipamentos — D-077, 09/11/2026

Aplicar as **22 migrações** em nova instalação. A migração 0022 cria nomes administrativos versionados e histórico/recibo separados dos dados do agente e da coleta. Root edita pelo painel, inclusive registros parciais, sem afetar IDs/fotos/vínculos. O coletor já publicado permanece compatível. [Aceite e publicação](../05-qualidade/EDICAO_NOMES_EQUIPAMENTOS_2026-11-09.md).

## D-078 — retirada administrativa de equipamento

Aplicar as **23 migrações** em nova instalação. 0023 conserva a ficha retirada e bloqueia reaproveitamento do ID; fotos e históricos permanecem. Root usa Apagar cadastro no painel. Publicar ambos os Workers para proteger abas antigas do coletor. [Aceite e publicação](../05-qualidade/EXCLUSAO_EQUIPAMENTOS_2026-11-09.md).
## Identificação do vínculo de computadores — D-079, 09/11/2026

Etiquetas e filtro de vínculo/cadastro nas consultas desktop, sem migração ou alteração de registros. Vinculado sem comunicação recente permanece vinculado; histórico encerrado, cadastro manual, pendência e ausência de informação são distintos. Publicação somente do painel. [Aceite e versão ativa](../05-qualidade/VINCULOS_AGENTES_2026-11-09.md).

## D-081 — revisão administrativa de hardware

Nova instalação aplica as 24 migrações. 0024 guarda decisão administrativa e vínculo à demanda sem modificar o inventário existente. Publicar apenas o painel é suficiente; o coletor continua compatível. [Aceite e versão](../05-qualidade/HARDWARE_DECISAO_2026-11-10.md). Novas tabelas e decisões integram backup/transferência; preservar eventos originais e histórico das demandas.

## D-090 — cadastro escolar

Nova instalação aplica as 25 migrações. 0025 acrescenta 28 campos opcionais em units, sem carga de dados. Ambos os Workers usam o esquema compartilhado; publicar após a migração. Backup de units/unit_changes deve preservar os metadados e histórico. Rollback de código pode deixar as colunas: não executar DROP/restauração destrutiva. Modelos CSV/XLSX atuais têm 55 colunas, compatíveis com entradas antigas de 12/27. [Contrato e limites](../04-dados-apis/CADASTRO_ESCOLAS_D090.md), [aceite/publicação](../05-qualidade/CADASTRO_ESCOLAS_2026-11-10.md).

## D-107 — avatares técnicos

Nova instalação aplica 29 migrações. 0029 só acrescenta perfis, uploads e eventos de avatar. Imagens no Drive privado em Avatares dos técnicos, preservando autorização e pasta atuais; nenhum binário no D1. Backup/migração devem incluir referências e arquivos privados anteriores/atuais. Rollback de código deixa tabelas aditivas; não restaurar banco e perder escritas concorrentes. [Contrato operacional](../03-painel-desktop/AVATARES_TECNICOS_D107.md), [validação/publicação](../05-qualidade/AVATARES_TECNICOS_2026-11-12.md).
