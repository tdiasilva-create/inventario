# Galeria de fotografias — D-064

**Registro histórico:** D-065, de 06/11/2026, corrigiu o escopo: identidade em todo o painel e retirada da aba/página Fotografias. O endereço antigo redireciona ao Panorama. Os registros abaixo descrevem a entrega anterior; dados, armazenamento e verificação de leitura permanecem preservados. Ver [correção e publicação D-065](IDENTIDADE_PAINEL_2026-11-06.md).

## Pedido e escopo

Aplicar a identidade atual do coletor à visualização de imagens no desktop e verificar se as fotografias coletadas podem ser exibidas. Cores branco/preto/vermelho/laranja/pêssego, fontes locais Chakra Petch/Barlow, controles compactos, contexto da fotografia e navegação. Nenhuma pergunta ou tela do coletor foi alterada.

Documentos consultados: `00_LEIA_ANTES_DE_TUDO.md`, `AGENTS.md`, `REGRAS_DE_PRECEDENCIA.md`, decisões D-045/D-048/D-050/D-057/D-061–D-063, pendências/conflitos, documentos do painel em `docs/03-painel-desktop/`, modelo/fluxo/contratos e integração Drive em `docs/04-dados-apis/`, Base original §§7–8, manifesto visual, cinco PNGs desktop abertos, `FOTOS_PARCIAIS_2026-11-04.md`, `ACEITE.md` e manual operacional atual. As referências antigas não definem dados reais e a nova decisão visual tem escopo restrito à área fotográfica.

## Implementação

- Página `/fotografias`, acessível no menu e em “Ver todas” das galerias do panorama/unidade. Filtros de unidade, vínculo e estado; URL retoma filtros; páginas de 48 imagens, sem limite total artificial.
- Ampliação compartilhada com a galeria parcial: imagem integral, unidade quando disponível, vínculo/ID, autoria, data, anterior/próxima, setas do teclado, Escape, retorno do foco e tentativa após falha. Pendências de upload não ganham imagem fictícia.
- API `GET /api/inventory/photos` e proxy `GET /api/inventory/photo?id=UUID`: somente root/admin/visualizador, unidades ativas, registro `ready`, pertencimento à unidade/vistoria e regra de publicação do equipamento. Operador permanece sem consulta gerencial. Nenhum segredo/ID do Drive ou URL pública é retornado. Binário com cache privado/no-store.
- Fotos de visitas abertas são PARCIAIS; visitas pausadas são histórico PARCIAL, separadamente rotulado. Visitas concluídas continuam sendo a origem dos indicadores oficiais. A visualização não reabre ou conclui visitas.
- `server/photo-gallery.mjs`, integração em `server/worker.mjs`; autoria/data também incluídas nas miniaturas oficiais de `server/collector.mjs`. `web/desktop-photos.js/css`, `photo-viewer.js`, `desktop.js`, `panel-shell.js`, `desktop-progress-photos.js/css`, build desktop e testes.
- Tema isolado: nenhum token global dark-tech alterado. Coletores, mapa, matriz, respostas, esquema D1 e credenciais preservados.

## Verificação local

- 100 testes Node aprovados: 98 anteriores e dois novos de galeria. Novos casos cobrem paginação com datas iguais, ausência de duplicação, filtros, três estados, perfis, métodos, parâmetros inválidos, envio pendente, equipamento não publicado, unidade inativa, armazenamento ausente e arquivo não encontrado. Consultas não escrevem histórico nem publicam dados.
- Navegador com Worker real e SQLite isolado: 54 imagens sintéticas e uma pendente, páginas 48/6, filtros e recarga da URL, histórico pausado, ampliação, setas, Escape/foco, erro real de leitura seguido de nova tentativa, largura 390 px e integração da galeria de andamento. Zero erros JavaScript. Dados de teste nunca enviados à produção.
- Capturas locais revisadas: `evidencias/galeria-2026-11-05/01-galeria-desktop.png`, `02-foto-ampliada.png`, `03-galeria-390.png`, `04-ampliacao-390.png`, `05-coleta-parcial.png`. São ensaios sintéticos identificados na própria fotografia, não capturas de registros oficiais.

## Verificação do armazenamento real

Consulta em 05/11/2026 às 23:27 (Fortaleza): **10 fotos `ready` no Google Drive; 4 em visita aberta, 6 em visitas pausadas, 0 em visitas concluídas**. Todas as dez foram lidas diretamente da pasta privada pela API autorizada; 10/10 hashes SHA-256 conferidos, zero arquivos ausentes, 1.305.718 bytes no total. Não houve upload, exclusão, alteração de unidade/vistoria ou escrita no D1. Renovação OAuth feita apenas em memória para esta leitura. Resultado agregado privado em `private-data/photo-readiness-result.json`; nenhum arquivo real incluído no Git público.

Isso explica a galeria oficial anteriormente vazia: os registros existentes ainda não pertencem a vistorias concluídas. A nova galeria permite consultá-los com o estado correto, sem converter testes/rascunhos em inventário oficial.

## Limites e cobertura

Base §§7.1/7.5/7.6/7.10 e §8: distinção entre recebido, parcial e concluído; leitura autenticada. D-045/D-048: acompanhamento separado e armazenamento privado. A Base original foi preservada. Sem nova exigência de fotografia.

Não foi feita nova captura em celular nem ensaio de upload nesta rodada; comprovação de leitura não substitui câmera/galeria físicas. Miniaturas usam o próprio arquivo com carregamento tardio; geração de miniaturas menores no servidor permanece futura. O controle da aba autenticada não esteve disponível nesta sessão; testes de interface são locais, e a verificação real do Drive foi feita pela API. Publicação e sondas externas serão registradas abaixo após execução.

## Publicação real

Painel publicado em 05/11/2026 (Fortaleza), versão `9b25ccf1-fa98-4ae7-a2dd-7af35e59c991`, substituindo `827d6900-aa3a-450c-974d-ac13fd2ecca5`. Destino: `painel-semed-paco`, conta institucional, mesmo D1, provedor Drive, variáveis, segredos e cron. Coletor mantido na versão `5cf137cd-9c34-4e41-806b-d19cf0887bb6`; não foi republicado. Sem migração ou escrita de inventário em produção.

Ambos os builds aprovados (painel 54 arquivos; coletor 47), empacotamento Wrangler aprovado, 100 testes Node, 13 testes direcionados após ajuste dos metadados oficiais e roteiro de navegador aprovado novamente após revisão visual. Correção de contraste no contador parcial incluída. Bundle/configuração/versões anteriores preservados em `private-data/gallery-release/before/`; nenhuma credencial foi publicada no Git. A verificação pós-deploy aprovou 46 sondas existentes e sete da nova galeria (página/assets redirecionam ao login; APIs retornam 401 sem sessão).

Endereço: https://painel-semed-paco.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev/fotografias
