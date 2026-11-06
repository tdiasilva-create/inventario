# COMECE AQUI — pacote documental oficial para Codex

**Inventário Tecnológico SEMED** · transferência de contexto de 27/10/2026 · **não contém código executável**.

## Objetivo
Transferir o conhecimento aprovado em conversa para um repositório que o Codex consiga consultar sem depender de histórico de chat. Os documentos derivados são índices e especificações interpretativas: nunca substituem o arquivo original da coleta.

## Arquivos que devem ser preservados sem alterações
1. `docs/02-coleta-mobile/BASE_DE_COLETA_V1_0_ORIGINAL.txt` — 1.084 linhas do documento consolidado, autoridade funcional mobile.
2. `design/referencias/mobile/00_coleta_mobile_APROVADA.png` — referência visual mobile.
3. `design/referencias/desktop/00_painel_geral_APROVADO.png` — principal referência visual do desktop.
4. Demais PNGs de `design/referencias/desktop/` — telas específicas e estudo de indicadores.
5. `docs/00-governanca/DECISOES.md` — índice de decisões, subordinado às fontes originais.

## Ordem de leitura para Codex
1. `AGENTS.md` → `README.md` → `docs/00-governanca/INDICE.md`.
2. `docs/00-governanca/DECISOES.md`, `docs/00-governanca/PENDENCIAS.md` e `docs/00-governanca/REGRAS_DE_PRECEDENCIA.md`.
3. Abrir de verdade os PNGs no manifesto visual, em vez de confiar só nas descrições.
4. Para **coleta**, ler o TXT original integralmente e depois telas, campos, estados e fluxos derivados.
5. Para **desktop**, ler a documentação desktop, desenhos e limites do que não foi definido.
6. Para desenvolver, começar por `PLANO_DE_EXECUCAO_CODEX.md` e `prompts/00_PRIMEIRA_MENSAGEM_CODEX.txt`.

## Status claro
- **Aprovado:** separação em dois ambientes, D1/R2/Workers, coleta guiada mobile, inventário contínuo, as regras consolidadas no TXT e referências visuais escolhidas.
- **Ainda não aprovado:** engenharia final de sincronização offline, SQL definitivo, endpoints finais, mapa e geocodificação oficial, cálculos do painel, telas de relatório, política detalhada de validação personalizada.
- **Exemplo, não dado real:** nomes das escolas nas ilustrações, indicadores, datas, endereços, valores e brasões gerados graficamente.

## Importante para enviar ao GitHub
**Não envie apenas o ZIP para a raiz do GitHub como um único arquivo.** Extraia-o e versione **os arquivos dentro dele**. O Codex deve poder ler `AGENTS.md`, `docs/...` e `design/...` diretamente. Veja `COMO_PUBLICAR_NO_GITHUB.md`.

## Revisões futuras
Arquivos originais e versões não são sobrescritos sem autorização. Nova decisão passa por `docs/00-governanca/PROTOCOLO_DE_ATUALIZACAO.md`. O repositório é uma fonte única de verdade; a GitHub Wiki pode apontar para esses arquivos, mas não replicá-los como cópias divergentes.
