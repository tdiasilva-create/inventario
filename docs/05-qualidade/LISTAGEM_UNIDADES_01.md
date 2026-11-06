# Listagem inicial do operador — D-042, 28/10/2026

Correção solicitada: operador deve ver lista de unidades pendentes ao entrar, como na referência `C:/Users/SIGAE/Desktop/coleta-escolar-aparencia/coleta-escolar-aparencia/telas/01-selecionar-escola.png`; não exigir digitação nem atribuição individual para descobrir uma unidade pendente.

Fontes consultadas: `00_LEIA_ANTES_DE_TUDO.md`, `AGENTS.md`, precedência, decisões, pendências/conflitos; Base de Coleta original integral (preservada); especificação tela a tela, telas/transições, catálogo, fotos/estados e guia mobile; documentos de integração/dados e aceite previamente lidos. Referência nova inspecionada visualmente e comparada com capturas reais. Requisitos: Base §§2.4–2.5, 3.1, continuidade §9 e decisão posterior D-042.

Arquivos: `server/collector-access.mjs`, `units.mjs`, `collector.mjs`, `worker.mjs`; `web/collector-unit-list.js`, `collector.js`, `collector.css`; build do coletor. Sem migração ou alteração de catálogo, contas, senhas ou equipamentos.

## Comportamento

- Lista “Pendentes” aparece com a busca vazia, em cartões clicáveis com nome, município/INEP ou tipo e estado.
- Todas as unidades oficiais ativas ainda sem inventário de equipamentos publicado ficam disponíveis ao operador, sem atribuição individual. Root segue mantendo o catálogo oficial.
- Rascunhos/visitas em andamento continuam na lista; salvar o primeiro equipamento não deve retirar a unidade enquanto faltam os demais.
- Busca somente filtra cartões já disponíveis. Estado vazio distingue ausência de pendentes de filtro sem resultado.
- Inventário oficialmente recebido aparece separadamente em “Com inventário”, quando autorizado por atribuição ou participação prévia. Preserva revisitas/atualizações sem duplicar cadastro.
- Mesma autorização em listagem, início/retomada e inspeções. Inativas e inventários recebidos de outras equipes sem autorização seguem bloqueados.

## Aceite executado

29 testes Node aprovados. Os dois novos testes usam SQLite em memória com todas as migrações e as rotas reais do servidor: listar pendentes sem atribuição; manter rascunho; filtro opcional; acesso já atribuído; impedir inativa/inventário não autorizado/visualizador; iniciar/retomar mesmo ID; preservar acesso após publicação.

Chrome real, 360/390/430px: lista inicial com dois cartões e busca vazia; filtro reduz a lista; seleção abre oito cartões A–H; trocar unidade atualiza lista; inventários recebidos separados; sem overflow nem erros JS. API de teste usa os mesmos handlers com SQLite isolado; não testa novamente login Cloudflare nem grava fixtures no D1 oficial. Capturas em `evidencias/listagem-unidades/01-lista-inicial.png`, `02-inventario-recebido.png`, `lista-360.png`, `lista-430.png`; resultado em `resultado.json`.

Cobertura adicional do TXT: seleção/listagem, autorização e retomada; nenhuma mudança nas perguntas A–H. Fotos R2, offline protegido e demais lacunas registradas em `COLETOR_ONLINE_01.md` continuam pendentes. Nenhuma escola da imagem foi cadastrada como dado oficial.

## Publicação

Coletor `68531211-7890-4307-b87e-2fdd7162bfb0`; backend desktop `65f80051-0a32-4fb2-b6b5-6d83e530c1ea`. HTTP externo: login e proteção de APIs aprovados. Consulta somente leitura ao D1 oficial confirmou uma unidade ativa, SECRETARIA MUNICIPAL DE EDUCAÇÃO - SEMED, sem inventário publicado e sem vistoria iniciada: elegível à lista de pendentes sem atribuição. Não gravada vistoria de teste na produção; testes de início/retomada realizados em SQLite isolado com handlers reais.

Endereço: https://inventario-semed-lumiar.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev/
