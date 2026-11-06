# Ícones superiores — ajuste restrito D-026

27/10/2026. Referência: `design/referencias/desktop/05_icones_superiores_APROVADOS.png`, cópia da imagem `Imagem do ChatGPT 27 de out. de 2026, 19_07_39.png`. Escopo autorizado: ícones/indicadores superiores sem caixas coloridas. O desenho do mapa presente nessa referência não é uma instrução para alterar o mapa implementado.

Consultados AGENTS.md, decisões/precedência já lidas, referência visual aberta, função `stats()`, ícones e estilos do desktop. Requisitos aplicáveis: componentes SVG reais, preservar mapa e dados, somente apresentação. Arquivos: `web/metric-icons.js`, `web/desktop-metrics.css`, import/chamada de ícone em `web/desktop.js`, link de estilo em `web/index.html`, referência e documentação. Não foram modificados os ícones compartilhados, sidebar, tabelas, fotos ou código cartográfico.

## Alteração

Os cinco indicadores têm símbolos próprios em traço uniforme: unidades, equipamentos, ambientes, coletas e pendências. Azul, verde, roxo, laranja e vermelho aparecem nos ícones, com brilho discreto e ponto cromático. Fundos individuais azuis/verdes/roxos/laranjas/vermelhos removidos; uma única faixa escura mantém separações sutis. Valores/rótulos e lógica anteriores preservados. Anéis usam o fundo escuro da faixa.

## Verificação observada

- Sintaxe de `web/metric-icons.js` e `desktop.js` aprovada.
- Comparação no mesmo navegador/viewport 1672 × 941, alternando apenas a apresentação dos indicadores. Setor do mapa antes/depois: **x=246, y=270, largura=623.421875, altura=421**. Mesma instância de mapa mantida durante a comparação.
- SHA256 antes/depois idênticos em `web/desktop-map.js`, `desktop-map.css`, `map-geography.js`, `desktop-icons.js`, `data/map-v33.json`, `data/map-examples.json`.
- Cinco novos SVGs superiores; quatro marcadores institucionais preservados; fundos individuais sem imagem/gradiente; ausência de erros JavaScript.
- Capturas em larguras 1672, 1440 e 390 px, sem overflow horizontal. Inspeção visual da captura desktop confirma faixa contínua, sem alteração da composição inferior.
- Não foram criados novos testes permanentes para este ajuste visual reversível. Evidências da verificação: `evidencias/icones-superiores/verificacao.json` e `mapa-antes.json`.

Screenshots reais: `01-antes-1672.png`, `02-icones-1672.png`, `03-icones-1440.png`, `03-icones-390.png` em `docs/05-qualidade/evidencias/icones-superiores/`.

Nenhum formulário ou requisito funcional A–H acrescentado. Nenhuma integração, contagem, autenticação, salvamento ou confirmação de servidor alterada. A cobertura e pendências TXT permanecem como nos relatórios anteriores. Sem push/deploy.
