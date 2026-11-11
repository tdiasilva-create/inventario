# D-090 — ampliação do cadastro das escolas

Decisões do responsável em 10/11/2026: ampliar somente o cadastro das escolas a partir da planilha fornecida; deixar CONTRATO de fora; somar escolas municipais militares em Escolas municipais e exibir o subconjunto Das quais militares. Implementação técnica de campos opcionais, sem importar linhas ou inferir classificações.

Fonte consultada, somente leitura: [API MAPA (SEMED), TesteApi](https://docs.google.com/spreadsheets/d/1FTNJJwNQkJtNONheGevNgLBJypwFRzhFcfoY3PsoR6s/edit?gid=1835004469#gid=1835004469). Também conferidos cabeçalhos de GEDUC_ESCOLAS, SIGAE_LOTACAO, CAPACIDADE_ESCOLAS e das abas de outros tipos para delimitar o escopo. Não armazenar dados pessoais de alunos nem cópias das linhas da planilha na documentação pública.

## Cadastro e dados reaproveitados

Nome da unidade, INEP, tipo, gestor, telefone, e-mail, coordenadas, endereço, bairro, polo, situação, código do prédio, totais de alunos/turmas/servidores/professores, etapas, capacidade, vagas, fonte e data já existiam (D-068). Não são criados campos concorrentes. GESTAO MILITAR é representado pelo tipo real, sem classificação pelo nome. PREDIO_COMPARTILHADO pode conter códigos como P04: esse código cabe em Código do prédio; o novo seletor indica somente se há compartilhamento.

Quatro blocos recolhíveis aparecem para Escola municipal, Escola municipal militar e Creche municipal. Os demais tipos conservam o formulário anterior. O root continua sendo o único perfil autorizado a escrever no cadastro mestre; o coletor não recebe novas perguntas.

| Bloco | Campos opcionais novos | Referências de cabeçalho |
| --- | --- | --- |
| Identificação e funcionamento | Nome oficial, secretário escolar, zona urbana/rural, turnos, tempo integral, prédio compartilhado | NOME_OFICIAL, dados cadastrais GEDUC_ESCOLAS, TEMPO_INTEGRAL, PREDIO_COMPARTILHADO, CAPACIDADE_ESCOLAS |
| Programas, estrutura e segurança | Situação PDDE, pendências no Censo, quadra, videomonitoramento, salas totais/em uso | STATUS_PDDE, PENDENCIAS_CENSO, QUADRA_POLIESPORTIVA, VIDEO_MONITORAMENTO, CAPACIDADE_ESCOLAS |
| Matrículas e espera | EJA inicial/final; espera creche/pré-escola/fundamental | MAT_EJA_I, MAT_EJA_F, CAPACIDADE_ESCOLAS |
| Equipe escolar | Gestão/coordenação, apoio pedagógico, administrativo, alimentação, limpeza/manutenção, vigilância, Educa Paço, outras funções; efetivos, contratados e comissionados | SIGAE_LOTACAO e NUM_VIGILANTES |

São 28 campos novos. Servidores contratados é uma quantidade de pessoas, não o identificador CONTRATO que foi excluído. Os grupos de função e vínculo funcional não devem ser somados entre si. Professores e total de servidores continuam nos campos existentes. Fontes podem divergir; o sistema não escolhe qual valor oficial usar.

## Persistência, validação e compatibilidade

Migração aditiva 0025_school_registration.sql: 28 colunas nullable em units. Não modifica linhas antigas, IDs, nomes, tipos, versões ou relações. Não cria valores provisórios. Banco e validação compartilhada restringem inteiros a 0–99999; texto tem limite e seletores têm opções explícitas. Vazio é NULL; zero e Não exigem informação explícita. Valores inválidos geram erro no campo.

API existente /api/root/unit-save: criação/edição mantêm CSRF, root, versão otimista e auditoria unit_changes. Edição combina o registro anterior com as chaves enviadas: clientes antigos não apagam campos novos ausentes. Reclassificar uma escola não apaga seu histórico ou metadados anteriores; a interface apenas oculta os blocos específicos. A API mantém compatibilidade de registros históricos, sem reclassificação automática.

Inconsistências entre total e detalhamento geram avisos, sem impedir salvar: salas em uso acima do total, soma EJA acima do total EJA, funções/vínculos acima do total de servidores. Não há soma automática nem transformação de vazio em zero.

O detalhe da unidade apresenta os dados preenchidos como cadastro mestre, separado de vistorias e telemetria. Os indicadores Rede em números preservam seus quatro totais D-068; os novos detalhamentos não são adicionados novamente a eles.

Modelo CSV/XLSX de 55 colunas: primeiras 27 preservadas, 28 novas ao final. Arquivos antigos de 12 e 27 colunas continuam aceitos. Importação mantém prévia/validação/confirmação e não realiza atualização automática da planilha Google. Fórmulas e células #ERROR! não são números oficiais; corrigir a fonte antes de importar. Nenhuma carga foi executada nesta entrega.

## Panorama

Contar o conjunto ativo filtrado. Escolas municipais = Escola municipal + Escola municipal militar. Das quais militares = Escola municipal militar. Não somar o segundo indicador ao primeiro. Exemplo exclusivamente didático: 59 municipais comuns + 10 militares = 69 municipais, das quais 10 militares; nenhum desses valores fica fixo no código. Creches, núcleos, administrativos e obras continuam em suas categorias. Filtro de tipo também é respeitado; militar isolada conta em ambos os indicadores, como total filtrado e subconjunto.

Tipos reais, cores do mapa D-087, políticas de coleta e identificação de escolas online/offline não mudam. Não é criada soma geral de unidades.

## Fora desta entrega

CONTRATO; preenchimento/importação automática dos cadastros; novas fichas para prédios administrativos/núcleos/obras; indicadores pedagógicos, alunos individuais, histórico de desempenho por ano; alteração de INEP/nome/tipo dos registros existentes; equipamentos e internet duplicados no cadastro mestre. As Fases 4/5 seguem pausadas.

[Aceite, evidências e publicação](../05-qualidade/CADASTRO_ESCOLAS_2026-11-10.md).
