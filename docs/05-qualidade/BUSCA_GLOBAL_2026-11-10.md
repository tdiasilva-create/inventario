# Busca global — D-084 — 10/11/2026

## Decisão e preparação

Responsável solicitou explicar opções antes de implantar a busca de equipamentos de toda a rede e selecionou **2 — busca unificada no cabeçalho**, com grupos de unidades/equipamentos. Implantação no contexto da publicação real contínua autorizada nesta sessão. Não implementa outras decisões pendentes do tour.

Consultados: `00_LEIA_ANTES_DE_TUDO.md`, `AGENTS.md`, `REGRAS_DE_PRECEDENCIA.md`, decisões D-045/D-065–D-083, `PENDENCIAS.md`, `CONFLITOS_DOCUMENTAIS.md`, `docs/03-painel-desktop/CONSULTA_EQUIPAMENTOS.md`, documentação/aceites do tour D-082 e escolas online D-083; contratos e testes reais de consulta, fotos, escopo de unidades e vínculo de agentes. Cinco PNGs desktop abertos na fase anterior; identidade posterior D-065/D-080 preservada. Sem novo arquivo do usuário neste pedido.

Requisitos/aceite: busca no servidor sobre toda a rede ativa, paginação independente, unidade/ambiente visíveis, abrir ficha e fotos do mesmo ID, rascunho rotulado, perfis respeitados e retorno à consulta. Alterar somente cabeçalho/filtro local, nova página, consulta no Worker, componente de ficha, build/testes/documentação. Não há dúvida estrutural bloqueante; demais pendências continuam sem decisão.

## Resultado implementado

Contrato e campos: [BUSCA_GLOBAL.md](../03-painel-desktop/BUSCA_GLOBAL.md). `/busca` usa a moldura do painel; o cabeçalho recebe Enter/lupa de todas as páginas. Filtro local das unidades continua nos Filtros do painel, sem interferência da digitação no cabeçalho. Unidades e equipamentos separados, paginação 20/30, sem downloads de inventário inteiro/fotos no resultado inicial.

Consulta `current` explícita para a ficha aberta pela busca; padrão `published` preservado na matriz/unidade. Mostra PARCIAL quando ficha salva difere da publicada, e fotos parciais recebidas do mesmo equipamento. IDs/vínculos e correções administrativas preservados; não promove rascunho a indicador oficial. Somente root mantém controles de nome/exclusão já existentes; testes não executam exclusão em produção.

## Verificações

- `tests/panel-search.test.mjs`: campos de busca, acentos/caixa, zeros iniciais e formatação numérica, separação de grupos, paginação, caracteres SQL literais, nenhum write, nomes corrigidos, inativos/legado, vínculo encerrado, perfis/métodos/parâmetros, ficha parcial/fotos e padrão publicado.
- `tests/panel-search-browser.cjs`: Worker real e SQLite isolado; busca pelo cabeçalho, grupos, páginas/voltar/recarregar, detalhe parcial, fotos do ID correto, telemetria, AnyDesk/RustDesk, acesso à unidade, falha/repetição, tela de 390 px, root/visualizador/operador.
- Regressões: `tour-logic-browser.cjs` (cinco pontos de entrada, ambientes, mapa e gestão), `panel-blocks-browser.cjs` (filtro local preserva mapa/foto/foco), `desktop-identity-browser.cjs` (17 rotas), `equipment-consultation-browser.cjs` (oficial, fotos/paginação, 1366/1440/1920 px), `panel-mesa-browser.cjs` (pulso, menu, login e teclado).
- Capturas reais da implementação local: `evidencias/busca-global-2026-11-10/01-resultados-desktop.png`, `02-ficha-parcial.png`, `03-resultados-mobile.png`, `04-ficha-mobile.png`. Dados sintéticos identificados e isolados; imagens abertas visualmente. Sem transbordamento horizontal em 390 px. Não representam navegação autenticada de produção ou homologação de teclado/câmera em celular físico.

Cobertura da Base TXT: consulta/autorização, vínculo equipamento–unidade, fotografias por ID e separação rascunho/publicação preservados. Não adiciona/resume perguntas, offline, instalador ou novos requisitos de coleta. Sem alteração da Base original.

## Pendências preservadas

LOG-08 (fichas vs quantidade física), Pendentes, Relatórios/Planejamento, Ano, destino da matriz, apresentação das escolas offline e Fases 4/5. Busca não inclui unidades inativas/excluídas nem versões históricas; valores ausentes não são inferidos. Homologação operacional pelo responsável após publicação.

## Publicação

Preparada somente para `painel-semed-paco`, sem migração ou alterações de segredos/Drive. Versão anterior esperada: `11b90747-7d5a-4585-b2a5-fbe0c3af5f17`. Coletor esperado sem alteração: `274ecd9b-002e-4f79-a4b9-325fc26fece1`. Registro de execução será acrescentado após conferência da versão ativa.

Validação final local: **185/185 testes**, seis roteiros de navegador aprovados (busca, tour, blocos, identidade, consulta oficial e mesa), build desktop de 80 arquivos e dry-run Wrangler aprovados. Links documentais conferidos. Falhas intermediárias de sintaxe/fixture foram corrigidas antes desta rodada; a execução final do navegador ocorreu depois do build, evitando arquivos indisponíveis durante sua reconstrução.
