# Fotos e miniaturas — D125

Continuação aprovada do item 6 da auditoria, em 16/11/2026. Complementa D072/D124; não muda perguntas, permissões, localização dos técnicos ou o plano gratuito. Estado de publicação e medidas no [registro de qualidade](../05-qualidade/FOTOS_MINIATURAS_D125_2026-11-16.md).

## Validação no servidor

`server/jpeg-thumbnail.mjs` verifica o envelope inteiro do JPEG e depois decodifica os pixels. Limites permanecem 64 KiB e 320 × 320 pixels; também limita quadros, segmentos, componentes e scans antes de chamar o decodificador. Cabeçalho aparentemente válido com corpo ilegível, imagem truncada, avisos do decodificador ou bytes depois do fim são recusados. A recusa não apaga uma derivada válida nem modifica o original, a visita ou seu histórico.

Decodificação local com `@jsquash/jpeg` 1.6.0, Apache-2.0, derivado de Squoosh/mozjpeg; versão/integridade fixadas em `pnpm-lock.yaml`. Origem: https://github.com/jamsinclair/jSquash/tree/main/packages/jpeg. O Worker importa estaticamente o módulo WASM; não baixa código, não usa compilação dinâmica nem Node filesystem. `#jpeg-decoder` seleciona o adaptador Node nos testes e o adaptador Worker via alias nos dois wrangler. `jpeg-js` 0.4.4 é exclusivamente dependência de desenvolvimento para fabricar imagens sintéticas nos testes.

O vínculo `thumb_source_sha256` continua apontando para o hash do original ready; autorizações, CSRF e estado são verificados por requisição. **Decodificar não prova que o conteúdo visual corresponde ao original.** Não foi adicionada comparação de pixels com download do Drive. O cliente oficial deriva a miniatura do original; este permanece a evidência principal. Fallback para o original e recriação pelo root continuam disponíveis, inclusive para derivadas antigas não revalidadas retroativamente.

## Consultas e contagens

Migração aditiva `0036_photo_gallery_reads.sql`:

- Índices parciais ordenados para fotos ready globais e por unidade; cursor composto data/ID evita ordenação temporária nos casos cobertos.
- Índice de manutenção contém somente ready sem derivada ou com hash ausente/diferente. `IS NOT` inclui a divergência NULL que `<>` não detectava.
- Tabela singleton de revisão, com epoch, e triggers de invalidação transacionais nos dados que determinam a elegibilidade das fotos.

`photo-gallery-cache.mjs` conserva somente contagens por filtro em memória do isolate, no máximo 64 combinações. Cada chamada autentica novamente e consulta página/revisão no mesmo batch. Na ausência de contagem atual, relê página e contagens em outro batch consistente. Não armazena sessões, permissões, linhas de fotografias ou arquivos nesse cache; falha não vira zero. A mudança de epoch impede reutilização após reconstrução da projeção.

Publicação/estado de visita, foto ready, unidade ativa/tipo e publicação/remoção de equipamentos invalidam as contagens. Atualizar bytes de miniatura, heartbeat ou GPS não invalida essa revisão. A primeira contagem de cada filtro/revisão ainda percorre as fotos elegíveis; encerrar o isolate perde o cache. Não há promessa de eliminar toda leitura ou certificar a frota de 101–300 computadores no gratuito.

## Implantação e retorno

Aplicar 0036 antes dos novos Workers. Índices anteriores são preservados; rollback dos Workers é compatível com a migração, sem restaurar um dump antigo sobre contribuições recentes. Os novos índices e triggers têm custo de armazenamento e escrita nas alterações de fotos/cadastro. Não mudam o intervalo dos agentes, alertas, cron ou rastreamento.

Testes reproduzíveis: `node scripts/test-audit.mjs`, build desktop/coletor, dry-run Wrangler e `node tests/photo-wasm-runtime.cjs DIRETORIO_DO_DRY_RUN SAIDA_JSON`. Comparação isolada: `node scripts/measure-photo-budget-d125.mjs SAIDA_JSON [DUMP_PRIVADO_SQL]`; só agregados são exportados. Nenhum teste deve inserir ou excluir fotos reais.
