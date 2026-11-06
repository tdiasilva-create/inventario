**Estado operacional atual (05/11/2026):** consultar [manual de operação e migração](docs/07-operacao/README.md). O texto de consolidação abaixo é histórico; decisões D-048/D-057–D-062 registram Drive, questionário atual, agentes e identidade posteriores. Não confundir os requisitos originais preservados com a versão publicada.

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
