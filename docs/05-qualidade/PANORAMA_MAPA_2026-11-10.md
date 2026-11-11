# D-091 — mapa ampliado e indicadores do Panorama

## Escopo e fontes

Pedido direto de aplicação do arquivo `DECISOES_PAINEL_2026-11-10.txt`, SHA-256 `bff3c3d51e6896bdd5ed565ca3d66b791c2b5b6a6170c1176a83741a088e5a70`, preservado em `docs/06-entregas/decisoes-painel-2026-11-10/`. O responsável confirmou: ampliar mapa e habilitar roda; manter a matriz. A implementação/publicação está abrangida pela autorização contínua da sessão.

Fontes consultadas: `00_LEIA_ANTES_DE_TUDO.md`, `AGENTS.md`, `REGRAS_DE_PRECEDENCIA.md`, `DECISOES.md`, `PENDENCIAS.md`, `CONFLITOS_DOCUMENTAIS.md`, `docs/03-painel-desktop/MESA_DE_DADOS.md` e aceite `ESCOLAS_ONLINE_2026-11-10.md`. Os cinco PNGs desktop foram abertos na fase precedente D-090; a identidade atual segue D-065/D-080. As composições antigas não geram novos requisitos.

## Aplicação

- PAN-02: o botão de expansão mantém o mesmo mapa e passa a ocupar a área do navegador. Roda do mouse liberada apenas nesse modo. **Voltar ao Panorama** ou **Esc** restaura o centro, zoom, tamanho e foco anteriores. Navegar para outra página limpa o estado ampliado. Camadas e seleção continuam utilizáveis.
- PAN-03: escala visual de 70% nos dois indicadores juntos, com âncora inferior direita. Mesmas consultas, filtros, ordem offline/online e valores; página Mapa da Rede mantém tamanho anterior.
- PAN-05: matriz integralmente preservada, conforme resposta direta do responsável.

Arquivos de aplicação: `web/desktop.js`, `web/desktop-map.js`, `web/painel.css`. Teste: `tests/panorama-map-browser.cjs`, comando `pnpm run test:panorama-map:browser`.

Correção de suporte encontrada no teste: reabrir mapa com hardware já conhecido podia acessar o elemento Leaflet do aviso antes de sua criação. A inicialização agora aguarda esse elemento e reaplica os avisos após posicionar a câmera. Sem nova regra de alerta ou alteração de suas cores/dados.

Nenhuma pergunta do TXT original alterada ou acrescentada. Coletor, fotos, QR, instalador, servidores e esquema do banco permanecem fora deste lote.

## Aceite executado localmente

Worker real com SQLite em memória e dados explicitamente sintéticos. Nenhuma escrita em produção para teste. Navegador Edge/Chromium automatizado, viewports 1672×1050, 390×844 e 812×375; não equivale a homologação física em celular.

1. Mapa ampliado cobre cabeçalho/menu e mantém `/panorama`, marcadores, contagens e camadas.
2. Roda altera zoom somente ampliado; botão e Esc restauram zoom e posição do marcador de referência exatamente.
3. Atualização automática após 61 segundos conserva a mesma instância do mapa e o modo ampliado.
4. Clique no alerta abre o modal existente sobre o mapa; Esc fecha primeiro o modal e mantém o mapa ampliado.
5. Navegação limpa travas de rolagem/foco; Mapa da Rede conserva comportamento e tamanho.
6. Indicadores: **250,5625 × 92,1875 px → 175,3937 × 64,53125 px**, redução de 30% em largura/altura. Na página Mapa da Rede seguem 250,5625 × 92,1875 px no mesmo viewport.
7. Sem transbordamento horizontal nos tamanhos menores; retorno acessível em retrato e paisagem. Capturas inspecionadas e ajuste de sobreposição do cabeçalho concluído.

Resultado: 14 testes de geografia, exemplos, blocos, presença escolar e decisões de hardware aprovados. Quatro roteiros de navegador aprovados: panorama-map, school-presence, hardware-review e panel-blocks. Nenhum erro JavaScript capturado.

## Evidências locais

Diretório `docs/05-qualidade/evidencias/panorama-mapa-2026-11-10/` (artefatos locais ignorados pelo Git, como as evidências anteriores):

- `panorama-antes.png`, `mapa-antes.png`: antes das alterações.
- `panorama-depois.png`, `mapa-ampliado.png`: depois, com dados de teste identificados.
- `hardware-no-mapa-ampliado.png`: modal existente sobre o mapa.
- `mapa-da-rede-preservado.png`: tela independente preservada.
- `mapa-ampliado-390.png`, `mapa-ampliado-paisagem.png`.
- `resultado.json`: medidas e resultados automatizados.

## Conferência pelo responsável

Abrir https://painel-semed-paco.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev/panorama e recarregar. Clicar no ícone de expandir ao lado de Limite do município, usar a roda do mouse e retornar por Voltar ao Panorama ou Esc. Confirmar os indicadores menores. Matriz e demais abas devem permanecer como estavam.

## Publicação

Publicação concluída em 10/11/2026 às 22:32 de Fortaleza (2026-11-11T01:32:13.165528Z), commit de implementação 2f4aa07. Painel: **376572e4-184b-4fd8-8d4a-2057c5b81cd8**, 100% do tráfego confirmado por deployments list. Versão anterior para rollback de código: 73b79751-7c50-4b38-86a0-c9e769f4ab93.

Build e dry-run aprovados, scanner do índice (622 arquivos) e links documentais sem erros. Nove verificações HTTP externas aprovadas: login acessível, páginas e assets privados redirecionados ao login, APIs privadas retornando 401 e login do coletor acessível. Verificação visual autenticada executada em Worker/SQLite isolado; não declarar navegação autenticada de produção neste lote.

Sem migração, escrita de registros oficiais, mudanças de configuração/segredos ou publicação do coletor. Dois agendamentos do painel e provedor Drive preservados. Evidência operacional privada em private-data/release-panorama-mapa-2026-11-10/.
