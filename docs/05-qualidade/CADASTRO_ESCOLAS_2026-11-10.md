# Cadastro das escolas e contagem municipal — D-090

Escopo aprovado: somente escolas; CONTRATO fora; militares incluídas no total municipal e discriminadas como subconjunto. Autorização de implantação no ambiente real mantida no fluxo desta sessão. A planilha é referência de campos, sem autorização implícita para importar ou sobrescrever seus dados. [Contrato e mapa dos campos](../04-dados-apis/CADASTRO_ESCOLAS_D090.md).

## Documentos, arquivos e critérios

Consultados 00_LEIA_ANTES_DE_TUDO.md, AGENTS.md, REGRAS_DE_PRECEDENCIA.md, DECISOES.md, PENDENCIAS.md, CONFLITOS_DOCUMENTAIS.md; especificações desktop, indicadores, MESA_DE_DADOS.md; MODELO_CONCEITUAL.md, 02_FLUXO_DE_INTEGRACAO.md, diagrama de relacionamentos e fontes; CADASTRO_UNIDADES_2026-11-06.md e procedimentos de publicação/rollback. Os cinco PNGs desktop do manifesto foram abertos na ordem; D-065/D-080 prevalecem quanto à identidade atual. Base original já lida na fase D-089, preservada nesta fase.

Fontes externas: ORIENTACAO_OCORRIDO_E_CORRECAO.txt e planilha API MAPA (SEMED), com leitura das abas e identificação de lacunas/divergências. Alegações do relatório sobre importações anteriores não foram tratadas como novas ações executadas por esta entrega.

Arquivos principais: web/unit-schema.js, admin-units.js, unit-figures.js, desktop.js, painel.css; migrations/0025_school_registration.sql; testes, CI e dicionário gerado. Rotas existentes do servidor/importação usam o esquema compartilhado. Critérios: campos opcionais, dados persistentes e auditados, preservação de IDs/vínculos e clientes antigos, null diferente de zero, formulário limitado a escolas, modelos antigos aceitos e contagem filtrada sem duplicação conceitual.

## Verificação local

- 203 testes de servidor/dados aprovados, zero falhas. Novos cenários verificam migração aditiva, todos os campos, root/403, versão/409, clientes antigos, auditoria, valores inválidos, limpeza para NULL e importação explícita em banco isolado.
- school-registration-browser: 28 campos, quatro blocos, ocultação nos outros tipos, salvar/reabrir/editar, detalhe da unidade, largura 390 sem transbordamento; Worker real e SQLite isolado.
- desktop-identity-browser: 17 rotas, formulários, identidade, matriz, filtros e contagem municipal/militar como subconjunto. Nenhum número fixo na implementação.
- unit-catalogue-browser: três larguras, cadastro root, importação, totais da matriz, filtros e registro histórico fora do escopo.
- panel-navigation-browser: navegação, timeout, nova tentativa, sessão expirada.
- collector-v3-browser: fluxo atual completo com QR, sete fotos, respostas, conclusão e leitura desktop aprovado após a mudança do esquema compartilhado. Não implica teste físico do EXE/celular.
- CSV 12/27/55 e XLSX preservam vazio/zero; novos campos possuem cobertura de ida/leitura, fórmulas recusadas.

Capturas locais em evidencias/cadastro-escolas-2026-11-10/: 01-identificacao-funcionamento.png, 02-programas-estrutura.png, 03-equipe.png, 04-detalhe.png, 05-cadastro-390.png. Dados TESTE/DEMO somente em fixtures. 01 e 05 conferidas visualmente; identidade, campos compactos e blocos recolhíveis preservados. Não são capturas de dados oficiais.

## Requisitos da Base e limites

Atende ao cadastro oficial prévio, tipos reais, permissões em servidor, identidade estável e histórico, sob D-068/D-090. Nenhuma pergunta da Base/coletores V1–V3 é modificada. Offline durável, celular físico, instalador, dados pedagógicos e importação da planilha não são declarados homologados ou concluídos por estes testes.

## Publicação e reversão

Concluída em 10/11/2026 às 21:33 de Fortaleza, commit de implementação af9c6bf. Migração 0025 aplicada antes dos Workers; listagem posterior sem migrações pendentes. Versões confirmadas por deployments list, 100% do tráfego:

- Painel: 73b79751-7c50-4b38-86a0-c9e769f4ab93, 2026-11-11T00:33:10.893Z.
- Coletor (compatibilidade do esquema compartilhado): 91ba6200-d080-4026-8e92-7042bd67f86e, 2026-11-11T00:33:34.607Z. Perguntas/interface preservadas.

Backup privado de units e unit_changes exportado, carregado em SQLite isolado e conferido contra agregados remotos. SHA-256 a7287f55b4fa1f2f73f480637800197042478051febf36f8cd10ca073ef10d36, 222477 bytes. Antes/depois: 76 unidades, soma de versões 158, 96 registros de histórico; 59 municipais, 10 militares e 7 administrativas ativas. Os 28 campos novos estão NULL nas 76 unidades; nenhum preenchimento presumido. Esses números são evidência desta verificação, não constantes do aplicativo.

Builds e dry-run dos dois Workers aprovados; scanner de 619 arquivos do índice e links documentais aprovados. Cinco roteiros de navegador e 203 testes locais aprovados, com repetição específica do XLSX após ampliar sua cobertura. Nove verificações HTTP externas passaram: login 200, páginas/asset privados 302 para login, APIs privadas 401. Leitura agregada no D1 confirmou a migração e preservação das contagens/versões/histórico. Não houve criação, edição, exclusão ou importação de registros oficiais para teste. A navegação autenticada detalhada foi validada em Worker/SQLite isolado; não afirmar captura ou edição autenticada em produção.

Rollback de código: painel anterior a8166f95-8c6b-4534-9df6-c1b342a51cdc; coletor anterior 4df19c82-0b07-4b31-b115-62b8fe94e7ad. Pode manter as colunas aditivas; não executar DROP nem restaurar backup completo sobre novos dados. Os dois Workers usam a mesma validação e D1. Fotos/Drive, protocolos de agente, segredos e os dois agendamentos do painel permanecem preservados.

## Conferência pelo responsável

1. Abrir https://painel-semed-paco.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev/cadastro-unidades como root, recarregar e escolher Editar em uma escola.
2. Abaixo dos campos existentes, abrir os quatro blocos opcionais; preencher somente informações verificadas, salvar e reabrir.
3. Confirmar os novos dados no detalhe da unidade. CONTRATO não existe no formulário. Valores vazios não viram zero ou Não.
4. No Panorama sem filtros, verificar o conjunto municipal e Das quais militares; aplicar filtro militar para conferir o subconjunto filtrado.
5. Se for importar no futuro, baixar o modelo atual de 55 colunas e conferir a prévia; não enviar a planilha heterogênea inteira sem mapeamento/revisão.
