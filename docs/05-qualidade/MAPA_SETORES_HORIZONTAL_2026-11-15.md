# Organograma horizontal — complemento D121

## Autorização e escopo

15/11/2026: responsável pediu implementar organograma horizontal com computadores em grade, preservar sinais de status/fotos/fichas, testar e publicar no ambiente real. Aprovação de publicação já consta do pedido, sem nova confirmação necessária.

Unidade à esquerda, setores em linhas e equipamentos em grade à direita. Em larguras menores, a composição se reorganiza verticalmente e mantém grade responsiva. Modo Lista, IDs, paginação, atualização de comunicação, dados, permissões e ações existentes preservados. Nenhuma migração ou mudança de consultas, localização, APK, instalador ou coletor.

Arquivos funcionais: `web/painel.css` e `web/unit-equipment-map.js` (descrição acessível e singular de ambiente).

## Validação local

- 12 testes Node passaram: unit-equipment-map, equipment-signal, equipment-consultation, panel-blocks. Incluem escopo, permissões, lotes, dados parciais, vínculos e estados de comunicação.
- Build desktop e Wrangler dry-run concluídos.
- Prévia CUA com SQLite local e registros explicitamente DEMONSTRAÇÃO: 60 fichas/67 itens, laboratório de 56 fichas, sala vazia, impressora e setor não informado.
- 1440 px: composição horizontal e cinco colunas de equipamentos; página 1 com 50 fichas e página 2 com seis. Paginação navegada, sem lista interna estreita.
- 768 px: unidade acima, setor à esquerda e três colunas; 390 px: título do setor acima e duas colunas. Sem transbordamento horizontal do documento nas três larguras.
- Teclado Enter recolheu/reabriu setor. Alternância Lista/Organograma preservou conteúdo/página.
- Seleção TESTE-PC-001 manteve status, miniatura e abriu ficha do ID exato. Foto ampliada carregada, com metadados do mesmo ID. Nenhuma gravação no ambiente real durante estes testes.
- Capturas: `evidencias/mapa-setores-2026-11-15/horizontal-local-1440.jpg` e `horizontal-local-390.jpg`. Dimensões simuladas no navegador não equivalem à homologação física de celular.

## Publicação

Publicado em 15/11/2026 às 09:55:05 Fortaleza (12:55:05 UTC), Worker `ad54b444-bae1-4024-84db-fc7f0d6e70cd`, 100%. As 51 verificações HTTP pós-publicação passaram. Reversão pelo Worker anterior `4e073f99-ade2-4d2d-9e7a-41875a996a51`. Artefatos operacionais privados em `private-data/mapa-setores-horizontal-2026-11-15/`.

Conferência CUA autenticada root na CMCB 02 DE JULHO UNIDADE LXI - BANDEIRA TRIBUZZI (`378b630a-c027-4108-a112-eff3c590b13b`): dois ambientes e 22 cadastros. Gestão com três equipamentos; Informática com 19 em grade de sete colunas a 1920 px. Sinais verdes/vermelhos/cinzas presentes. GEST-BAND (`18d93a33-810a-4f82-aef6-68fe2af1eb91`) online, miniatura real de 320 px carregada; ficha exata abriu, com foto e vínculo ativo, último contato 15/11/2026 09:52:39 Fortaleza. Não houve criação/edição/exclusão de registros ou solicitação de testes de velocidade. Captura `evidencias/mapa-setores-2026-11-15/horizontal-bandeira-publicado.jpg`. Viewport de teste restaurado ao concluir. Somente Worker do painel publicado, sem mudança no banco ou distribuição de APK.
