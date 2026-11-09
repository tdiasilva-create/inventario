# Ativos do protótipo desktop

- `referencia-visual.png`: cópia integral, sem alteração de bytes, de `design/referencias/desktop/00_painel_geral_APROVADO.png`, fornecida pelo responsável. O aplicativo exibe apenas recortes de áreas fotográficas como conteúdo ilustrativo, usando SVG viewBox. Não é fundo da interface ou substituto de controles. Nenhum brasão ou perfil pessoal é extraído. Essas imagens não comprovam evidência de vistoria real.
- `mapa-demo.png`: textura raster fictícia criada com a skill imagegen e ferramenta integrada em 27/10/2026; origem `C:/Users/SIGAE/.codex/generated_images/01a17f00-2449-7071-a4f2-21be176aa9e5/exec-c95af90d-80f8-4e50-9bb9-28c40295046c.png`. Prompt: cidade brasileira tropical fictícia, vista de satélite sem texto, marcadores, regiões ou interface. Apenas o terreno é imagem. Regiões, pontos e controles são componentes em código, com posições percentuais ilustrativas, não latitude/longitude.

O símbolo institucional provisório é SVG em código, sem pretensão de brasão oficial. A identificação do perfil é DEMO, sem pessoa inventada apresentada como usuária real.

## Otimização de distribuição — 09/11/2026

`paisagem-login-v2.webp` é uma conversão do `paisagem-login-v2.png` já existente, sem recorte, redesenho ou mudança de dimensões (1586 × 992). Codificação WebP pelo canvas do Chromium/Edge, qualidade 0,75: 223.368 bytes, contra 2.638.818 bytes do PNG (91,54% menor). Original preservado. Build desktop e fallback de `login.css` usam WebP; nenhuma biblioteca de processamento foi adicionada ao aplicativo.

Desde D-065, a paisagem efetivamente visível do login é `paisagem-coleta.jpg` (118.146 bytes), aplicada por `desktop-theme.css`. Ela permanece intacta. Não atribuir a conversão do PNG à redução do download do login atual: o ganho direto é no pacote distribuído e no fallback legado. Ambas as imagens foram inspecionadas; captura do login atual e medição de revalidação estão no relatório da Fase 1 de 09/11.
