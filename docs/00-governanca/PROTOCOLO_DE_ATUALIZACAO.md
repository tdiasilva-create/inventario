# Protocolo de documentação e mudanças

1. **Origem:** usuário envia novo TXT (chamado **Base de Coleta**) ou aprova mudança explicitamente na conversa.
2. **Análise de impacto:** localizar decisão, perguntas, rotas, dados e telas relacionadas. Comparar com a versão anterior; não reduzir o documento original a um resumo.
3. **Classificação:** `APROVADO`, `PROPOSTA`, `PENDENTE`, `SUBSTITUÍDO` (informar por qual decisão e data).
4. **Atualização:** adicionar nova versão imutável em `docs/02-coleta-mobile/`; atualizar arquivos derivados, registro de decisões, pendências e aceitação. Manter o original preservado.
5. **Imagens:** referência aprovada nunca é sobrescrita; novas variantes em `design/propostas/`, até aceite explícito.
6. **Revisão:** criação de branch/PR para mudanças substanciais; informar diferenças ao responsável antes de integração.
7. **Entrega ao Codex:** informar caminho exato das fontes; o Codex lê tudo antes de implementação, registra testes e eventuais incompatibilidades.

**Não deve haver duas fontes canônicas divergentes.** A Wiki pode ser uma capa/índice; documentação principal reside no repositório, versionada com o código.
