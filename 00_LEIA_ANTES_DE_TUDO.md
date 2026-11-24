**D-131 local (24/11/2026):** filtro Sem agente 0.1.9 diretamente no mapa do Panorama, independente de Criar rota; ao menos um computador compatível basta para ocultar a unidade, mesmo offline. Sem SQL adicional, migração ou novo APK. Publicação aguarda autorização específica; produção permanece D130 abaixo. [Contrato](docs/03-painel-desktop/FILTRO_AGENTE_INTERNET_D131.md) e [verificações](docs/05-qualidade/FILTRO_AGENTE_D131_2026-11-24.md).

**D-130 publicado (24/11/2026, 13:26:28 Fortaleza):** Criar rota no Panorama ampliado, proposta 1 com painel lateral; root seleciona/ordena unidades e atribui atividades a um técnico antes das pendências, preservando atendimento iniciado/GPS. Painel `c516cd99-c3d0-4480-b5ef-aaaf1383e5ed` em 100%, após aprovação específica. 378 testes, navegador, 68 verificações HTTP e conferência root real aprovados, sem criar demandas de teste oficiais. [Contrato](docs/03-painel-desktop/CRIAR_ROTA_MAPA_D130.md), [testes/limites](docs/05-qualidade/CRIAR_ROTA_D130_2026-11-24.md) e [estado atual](docs/07-operacao/21_ESTADO_ATUAL_D130.md). Sem migração, novo APK ou alteração do coletor independente.

**D-129 publicado (17/11/2026, 07:13 Fortaleza):** Registrar nova demanda ao lado do nome da unidade abre modal com necessidade, tipo e técnico. Painel `0933006b-fd3a-4b90-9622-2c037d0a46fc` em 100%; 372 testes, 11 verificações HTTP e conferência root real aprovados. [Contrato](docs/03-painel-desktop/REGISTRAR_DEMANDA_UNIDADE_D129.md), [verificações](docs/05-qualidade/DEMANDA_UNIDADE_D129_2026-11-17.md) e [estado atual](docs/07-operacao/20_ESTADO_ATUAL_D129.md). Sem migração ou novo APK; localização e alertas preservados.

**D-128 publicado (17/11/2026, 06:12 Fortaleza):** Designar coleta na lista Sem agente vinculado cria demanda atribuída, com proteção contra duplicidade. Painel `3aee0153-07d0-43d1-8998-83458594c30b` em 100%; 369 testes e conferência root real aprovados. [Contrato](docs/03-painel-desktop/DESIGNAR_COLETA_D128.md), [verificações](docs/05-qualidade/DESIGNAR_COLETA_D128_2026-11-17.md) e [estado atual](docs/07-operacao/19_ESTADO_ATUAL_D128.md). Sem migração ou novo APK; gratuito, localização e alertas preservados.

**D-127 publicado (16/11/2026, 22:51 Fortaleza):** Panorama com botões Com agente vinculado/Sem agente vinculado, contagem de unidades e listas com busca local. Sem SQL/polling adicional, migração ou atualização do APK. Painel `a816fd06-05e1-491b-bc3d-8deed5f2745f` em 100%; 360 testes e conferência root real aprovados. [Estado D127](docs/07-operacao/18_ESTADO_ATUAL_D127.md) e [verificações](docs/05-qualidade/VINCULOS_PANORAMA_D127_2026-11-16.md). Gratuito, GPS e alertas preservados.

**D-126 publicado (16/11/2026, 17:00 Fortaleza):** anel azul após aceite e Excluir demanda exclusivo do root, com histórico preservado. Migração 0037 e painel `13f871f2-d4f5-4b20-96b9-64cb73b32401` em 100%; 357 testes completos e verificações direcionadas/browser aprovados. GPS continua enquanto houver fila; APK/coletor/gratuito preservados. [Estado D126](docs/07-operacao/17_ESTADO_ATUAL_D126.md) e [verificações/limites](docs/05-qualidade/DEMANDAS_D126_2026-11-16.md). Conferência visual autenticada concluída; prévia cancelada e nenhuma demanda real excluída como teste. Item 19 da auditoria permanece pendente.

**D-125 publicado (16/11/2026):** validação integral do corpo JPEG, galeria indexada e contagens por revisão; 36 migrações. Originais, permissões, GPS, alertas, gratuito e APK 1.0.4 preservados. [Estado/versões](docs/07-operacao/16_ESTADO_ATUAL_D125.md) e [testes, medidas e limites](docs/05-qualidade/FOTOS_MINIATURAS_D125_2026-11-16.md). Conferência visual autenticada root concluída; a auditoria completa permanece aberta.

**D123 publicado (15/11/2026, 16:40/16:41 Fortaleza):** correções de permissões e consumo nos dois Workers, 35 migrações; 331 testes e comparação real de consumo aprovados. Gratuito, GPS, alertas e binários preservados. [Estado vigente](docs/07-operacao/14_ESTADO_ATUAL_D123.md), [evidências e limites de capacidade](docs/05-qualidade/PERMISSOES_D1_D123_2026-11-15.md).

**Consolidação para auditoria (15/11/2026):** código até D122 e 34 migrações na branch `codex/auditoria-completa-2026-11-15`. Referência histórica: [estado D122](docs/07-operacao/13_ESTADO_ATUAL_D122.md) e [pedido integral ao Claude](docs/08-auditoria/2026-11-15/00_PEDIDO_AO_CLAUDE.txt). Essa consolidação anterior não publicou Workers.

**D-122 publicado (15/11/2026, 11:42 Fortaleza):** busca principal somente de unidades, sugestões locais enquanto digita e campo preservado no mapa ampliado. Selecionar mantém o mapa e focaliza a unidade. Painel 582b5ec9-993b-45fe-87b6-d88d9f516440, 100%; sem migração/coletor/APK. [Conferência e limites](docs/05-qualidade/BUSCA_UNIDADES_2026-11-15.md).

**D-119 (14/11/2026):** entregue `SemedAgente-Instalador-0.1.9-rc3.exe`, com opção explícita de recuperação de instalação revogada, backup verificado, fila antiga arquivada e nova identidade/QR. Atualização normal preserva a identidade. Testes locais passaram; recuperação no PC revogado ainda requer aceite físico. Sem deploy/migração. [Funcionamento, hashes e limites](docs/05-qualidade/RECUPERACAO_AGENTE_D119_2026-11-14.md), [passo a passo](docs/06-entregas/RECUPERAR_AGENTE_SEMED_0_1_9_RC3.txt).
**D-121 publicado (15/11/2026, 09:26 Fortaleza):** Mapa de Setores e Equipamentos em Unidades, com dados atuais incluindo parciais, Organograma/Lista, fotografia e ficha exata. Atalho de medição exclusivo do root para agentes compatíveis. Sem migração ou novo APK; coletor/localização/alertas preservados. 323 testes locais, 56 verificações HTTP pós-publicação e conferência autenticada real concluídos. [Contrato](docs/03-painel-desktop/MAPA_SETORES_E_EQUIPAMENTOS_D121.md) e [publicação/limites](docs/05-qualidade/MAPA_SETORES_D121_2026-11-15.md).

**D-118 atualizado (14/11/2026):** APIs/migração 0034 publicadas. Rc1 falhou no PowerShell 5.1; rc2 corrigiu a instalação e passou pelo piloto real de cadastro, QR, vínculo, inventário e velocidade. Acionamento pelo botão root e resultado visual confirmados às 21:36:18 (92,16 Mbps download / 84,30 Mbps upload). Rc3 acima acrescenta recuperação; cancelamento, queda/retorno e atualização de outras máquinas ainda requerem homologação. [Piloto e limites](docs/05-qualidade/PILOTO_VELOCIDADE_D118_2026-11-14.md), [correção rc2](docs/05-qualidade/CORRECAO_INSTALADOR_D118_RC2_2026-11-14.md) e [contrato](docs/04-dados-apis/TESTES_INTERNET_D118.md). D117/APK 1.0.4, localização e alertas preservados.

**D-117 publicado (14/11/2026, 13:12 Fortaleza):** APK 1.0.4 corrige controles sob as barras do Android. É necessário atualizar o APK sobre o anterior; mesma assinatura, permissões e localização preservadas. [Publicação/testes e limites](docs/05-qualidade/ANDROID_AREA_UTIL_D117_2026-11-14.md). As atualizações web D116 abaixo continuam vigentes; a frase histórica de que não era necessário reinstalar refere-se somente à entrega D116.

**D-116 publicado (14/11/2026, complemento às 11:38 Fortaleza):** coleta refinada rev3 nos dois endereços, sem novo APK. Conferência autenticada concluída e saída após descarte corrigida/testada nos dois contextos. Permissões, acompanhamento D114 e perguntas preservados; 301 testes, 22 verificações de concorrência e 104 checks HTTP na integração, mais regressões e 53 checks do complemento. [Publicação, versões e limites](docs/05-qualidade/PUBLICACAO_REFINO_COLETA_D116_2026-11-14.md). APK 1.0.3 recebe as páginas atualizadas; câmera/GPS físicos ainda requerem conferência.

**D-115 publicado (13/11/2026, 19:13 Fortaleza):** APK único 1.0.3 com Atendimento técnico e Coleta disponível; painel `77c27c3b-b823-4a0e-a362-0854516403d0` (100%). Mantém 33 migrações e regras D114; coletor independente preservado. [Contrato](docs/02-coleta-mobile/APP_UNIFICADO_D115.md) e [qualidade/limites](docs/05-qualidade/APP_UNIFICADO_D115_2026-11-13.md). Câmera/GPS físicos ainda dependem de homologação; estados datados abaixo são históricos.

**Atualização operacional D-114 (13/11/2026):** 33 migrações aplicadas. APK técnico 1.0.2 e localização durante a fila publicados; [contrato](docs/03-painel-desktop/LOCALIZACAO_CONTINUA_D114.md) e [publicação/testes](docs/05-qualidade/LOCALIZACAO_D114_2026-11-13.md). GPS físico/tela bloqueada ainda dependem de homologação. Os estados datados abaixo são históricos.

**Estado operacional atual (12/11/2026, D-110):** consultar [manual de operação e migração](docs/07-operacao/README.md), [estado técnico atualizado](docs/07-operacao/11_ESTADO_ATUAL_D110.md) e [guia de auditoria](docs/08-auditoria/README.md). São 31 migrações; painel, coleta, agentes e atendimento técnico compartilham a persistência. O texto de consolidação abaixo é histórico. Decisões posteriores até D-110 prevalecem sobre requisitos superados. Não confundir a documentação original com a versão publicada nem análise de migração com implantação realizada.

# INVENTÁRIO TECNOLÓGICO — SEMED | PACOTE ÚNICO PARA O CODEX

**Referência atual do instalador Windows (D-056, 04/11/2026):** `SemedAgente-InstaladorUnico.exe`. Identificação, hash e cópia preservada em [`docs/04-dados-apis/INSTALADOR_OFICIAL.md`](docs/04-dados-apis/INSTALADOR_OFICIAL.md). Esta escolha supera os instaladores anteriores como padrão para novos trabalhos.

**Este é o ponto de entrada do repositório.** Pacote v2, consolidado em 27/10/2026 com os arquivos reenviados pelo responsável.

## O que está aqui (não é só um prompt)

1. **O questionário extenso com as decisões aprovadas, preservado em sua íntegra**: [`docs/02-coleta-mobile/BASE_DE_COLETA_V1_0_ORIGINAL.txt`](docs/02-coleta-mobile/BASE_DE_COLETA_V1_0_ORIGINAL.txt). Não é uma lista resumida: é o TXT original consolidado do usuário, seção por seção, com as condições e exceções das respostas.
2. **Os desenhos reais escolhidos**: [imagem mobile aprovada](design/referencias/mobile/00_coleta_mobile_APROVADA.png) e [cinco PNGs do painel desktop](design/MANIFESTO_REFERENCIAS.md). Abrir essas imagens de verdade, não apenas seus nomes.
3. **Diagramas de arquitetura e fluxos**: [`arquitetura/DIAGRAMAS_E_STATUS.md`](arquitetura/DIAGRAMAS_E_STATUS.md) (SVG + PNG + fonte DOT). São diagramas técnicos EXPLICATIVOS, não decisões sobre stack frontend ou SQL final.
4. **Telas e regras operacionais**: [`docs/02-coleta-mobile/06_ESPECIFICACAO_TELA_A_TELA.md`](docs/02-coleta-mobile/06_ESPECIFICACAO_TELA_A_TELA.md) e [`docs/03-painel-desktop/04_ESPECIFICACAO_SETORES.md`](docs/03-painel-desktop/04_ESPECIFICACAO_SETORES.md).
5. **Índice pesquisável de perguntas e respostas**: [`docs/02-coleta-mobile/CATALOGO_DE_CAMPOS_EXTRAIDO.csv`](docs/02-coleta-mobile/CATALOGO_DE_CAMPOS_EXTRAIDO.csv) e [grupos originais A–H separados sem reescrita](docs/02-coleta-mobile/grupos-originais/).
6. **Integrações e modelo de dados**: `docs/04-dados-apis/`, com o que está APROVADO versus interfaces/contratos apenas PROPOSTOS.
7. **Decisões, pendências, testes, histórico**: `docs/00-governanca/` e `docs/05-qualidade/`.
8. **Processo de trabalho**: [`AGENTS.md`](AGENTS.md) + [`prompts/00_PRIMEIRA_MENSAGEM_CODEX.txt`](prompts/00_PRIMEIRA_MENSAGEM_CODEX.txt) + [`PLANO_DE_EXECUCAO_CODEX.md`](PLANO_DE_EXECUCAO_CODEX.md).

## Autoridade e precedência (fundamental)
- **Coleta mobile — funcional**: o TXT consolidado da Base de Coleta é a autoridade. Em caso de inconsistência em documentos derivados, prevalece ele.
- **Mobile — visual**: imagem aprovada. Campos, nomes, números e até algumas telas retratados na imagem são ilustrativos, e **não substituem as regras do TXT**.
- **Desktop — visual**: 5 imagens aprovadas e especificação visual. A imagem 00 é a base da composição; as especializadas refinam cada setor; o estudo de indicadores substitui caixas KPI genéricas.
- **Desktop — negócio**: somente as regras aprovadas. Um mapa ilustrativo **não** produz localizações das 90 unidades. O frontend não pode inventar indicadores.
- **Diagramas, tabelas de rastreio e contratos de API** são traduções técnicas com indicação de status. Não converter proposta em requisito aprovado sem validação.

## Atenção: não é a transcrição literal de todas as conversas
O documento consolidado registra o resultado aprovado do longo questionário. O projeto não dispõe, nos arquivos recebidos, de um log literal pergunta-resposta de cada rodada. Não afirmar que esse histórico completo está dentro do ZIP. Preservar o TXT original e sua versão como fonte primária.

## Execução inicial recomendada
Codex: leia `AGENTS.md`, indexe os documentos, abra os PNGs, mostre uma matriz de rastreabilidade do que entendeu e comece pelo alicerce da coleta mobile, conforme o planejamento. **Não gere um sistema fictício que pareça pronto sem conectar a persistência real.**

## Conteúdo faltante que ninguém deve inventar
Lista oficial completa das 90 unidades, credenciais e recursos Cloudflare, brasão/logotipos oficiais autorizados, coordenadas geográficas, regras de negócio desktop ainda não finalizadas, e os pontos P1–P11 do TXT (§14). É possível desenvolver com seeds DEMO rotuladas, nunca fingir que são dados oficiais.

## Atualização D-068 — publicada em 06/11/2026

Cadastro ampliado, tipos de unidade e matriz compacta publicados nos dois Workers reais após autorização do responsável. Migração aditiva 0016 aplicada ao D1 compartilhado, com backup prévio e sem carga de planilhas. Conveniadas fora do escopo e obras fora da coleta. Base original preservada. Consultar DECISOES/PENDENCIAS, [testes locais](docs/05-qualidade/CADASTRO_UNIDADES_2026-11-06.md) e [publicação real](docs/05-qualidade/PUBLICACAO_D068_2026-11-06.md).
