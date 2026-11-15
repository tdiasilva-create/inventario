# D122 — busca principal somente de unidades

Pedido de 15/11/2026: o buscador principal do Panorama deve pesquisar apenas unidades, apresentar resultados enquanto o responsável escreve e permanecer disponível no mapa em tela cheia. Substitui D084 apenas no campo compartilhado do cabeçalho; preserva a consulta de fichas em Equipamentos e os endereços antigos já salvos.

## Comportamento

- Sugestões pelo nome ou INEP, desde o primeiro caractere, sem diferenciar caixa/acentos. Somente unidades ativas no escopo atual; nomes renderizados como texto. Não consulta equipamentos nem telemetria enquanto se digita.
- Lista ordenada, seleção explícita por ID, suporte a setas/Enter, Limpar, Escape e atalho `/`. Digitar não navega nem altera cadastro. Falha de catálogo é informada e a lupa permite tentar novamente; não apresenta falha como lista vazia.
- O cabeçalho compartilhado usa o novo campo em todas as páginas gerenciais. No Panorama/Mapa, selecionar focaliza a unidade, mantendo a tela atual. O responsável confirmou expressamente “Localizar no mapa e manter a tela atual” e autorizou publicar em 15/11/2026. Nas demais páginas, abre a ficha da unidade pelo ID.
- Se a unidade escolhida estiver fora dos filtros atuais, limpa os filtros com aviso para mostrar seu marcador. Unidade sem coordenadas não recebe posição fictícia; informa a ausência e mantém seleção/contexto. Clique direto nos marcadores/demandas continua seguindo D095.
- Ao ampliar o mapa do Panorama, o MESMO formulário é movido para dentro da área ampliada, antes de tornar o cabeçalho inerte. Mantém texto, listeners e catálogo. Ao retornar/navegar, restaura o formulário ao cabeçalho. A busca entra no ciclo de foco do mapa; primeiro Escape fecha sugestões, segundo retorna ao Panorama. Diálogos superiores continuam prioritários.

## Desempenho e acesso

Desktop reutiliza `/api/units` já carregado. Páginas independentes carregam esse catálogo somente na primeira busca e reutilizam os dados nessa página. Cada tecla filtra em memória; sem polling novo, sem chamada de busca de equipamentos e sem cache de autorização. Falhas podem ser repetidas explicitamente. Respostas atrasadas não substituem o termo atual.

Não há migração, novas rotas de dados, alteração de permissões, APK, coleta, GPS, alertas ou agente. O Worker apenas acrescenta o módulo estático da busca à lista de assets da conta, permitindo os imports existentes sem expor dados. A API continua autenticada. A antiga rota `/busca?q=...` permanece compatível com links salvos e testes de consulta de fichas, mas o novo cabeçalho não a aciona.

## Arquivos e aceites

Aplicação: `web/panel-unit-search.js`, `web/panel-shell.js`, `web/desktop.js`, `web/desktop-map.js`, `web/painel.css`, mensagem histórica em `web/panel-search.js`, build desktop e allowlist de assets em `server/worker.mjs`.

Teste reproduzível: `npm run test:unit-search:browser` após `npm run build:desktop`. Ver [qualidade e estado de publicação](../05-qualidade/BUSCA_UNIDADES_2026-11-15.md).
