# Painel desktop — primeira entrega de fidelidade visual

27/10/2026. Pedido mais recente: iniciar pelo painel de recebimento/consulta e criar com muita fidelidade o modelo reenviado. Decisões D-022/D-023 registram a prioridade desktop e a precedência da composição do PNG 00, inclusive os cinco indicadores. Não há backend conectado.

## Documentos e referência aplicados

`AGENTS.md`, `00_LEIA_ANTES_DE_TUDO.md`, `docs/00-governanca/REGRAS_DE_PRECEDENCIA.md`, `DECISOES.md`, `PENDENCIAS.md`, `CONFLITOS_DOCUMENTAIS.md`; documentos e cinco PNGs desktop já lidos/abertos na revisão anterior (`REVISAO_INICIAL_E_PLANO.md`). Nesta fase, releitura de `ESPECIFICACAO_DE_INTERFACE.md` e `04_ESPECIFICACAO_SETORES.md`; imagem reenviada `Imagem do ChatGPT 27 de out. de 2026, 06_47_01.png` aberta novamente. Referência operacional principal: `design/referencias/desktop/00_painel_geral_APROVADO.png`. Aceite geral: `docs/05-qualidade/ACEITE.md` e `02_CASOS_DE_TESTE_PRIORITARIOS.md`.

## Resultado

| Área | Implementado e testado no navegador |
|---|---|
| Composição 1672 × 941 | Menu lateral de 230 px; cabeçalho, filtros, faixa cromática, mapa/matriz/alertas/evidência e base com unidade/ambientes/galeria |
| Navegação | Panorama, mapa, unidades, equipamentos/matriz, detalhe da unidade, ambientes, ocorrências, relatórios e configurações |
| Filtros | Ano/regional/tipo/situação; pesquisa por nome/regional; filtro avançado e limpar; recorte reflete na matriz, marcadores e unidade |
| Matriz | Tabela HTML; cores de quantidade; seleção por linha; diálogo contextual da célula; ordenação e CSV DEMO |
| Mapa | Terreno ilustrativo; regiões SVG, marcadores HTML selecionáveis; zoom/enquadramento; alternância de regiões na vista ampliada |
| Unidade | Seleção sincronizada, resumo e navegação ao detalhe e mapa |
| Fotos | SVG recorta somente imagens ilustrativas da referência; carrossel, seleção e ampliação em diálogo |
| Estado sem dados | Alternância remove amostra, indicadores mostram indisponibilidade e nenhum marcador oficial é inventado |
| Responsividade | 1672 × 941, 1440 × 900, 390 × 844 sem overflow horizontal; menu móvel e reorganização dos setores |

As interações são uma PROPOSTA técnica reversível de interface. Sua execução não aprova fórmulas institucionais, alertas, relatórios, novas regras de cadastro ou fluxos de administração.

## Fidelidade e diferenças conscientes

Comparação visual efetiva da captura `01-panorama-1672.png` com a referência: preservadas a distribuição espacial das áreas, a densidade, fundos azul-petróleo, ações azuis/ciano, cinco indicadores e matriz/legenda. Fotos ilustrativas da referência aparecem nos espaços de mídia, sem rasterizar menus/tabelas/botões. Foram usados ícones SVG uniformes e proporções calibradas, não o PNG inteiro como background.

Não se afirma identidade pixel a pixel. Diferenças: símbolo genérico no lugar do brasão não autorizado; perfil de demonstração em lugar da pessoa fictícia; terreno e fronteiras fictícios identificados; aviso persistente DEMO; números/nomes da imagem são somente amostra visual. Regiões e pontos percentuais não correspondem a geolocalizações de unidades oficiais. Pontos decorativos menores ilustram conexões; os dez marcadores selecionáveis correspondem às dez linhas da amostra.

Totais globais iniciais são a composição estática DEMO transcrita da imagem. Sob filtros, indicadores mostram a amostra filtrada; métricas sem dados por unidade ficam `—`. Nada é apresentado como cálculo oficial da rede. O módulo `desktop-data.js` é isolado e não grava no D1. Exportação contém DEMONSTRAÇÃO no nome e na primeira linha.

## Testes observados

- `node --check web/desktop.js` e `web/desktop-data.js`: aprovados.
- `node tests/desktop.cjs`: PASS, 18 verificações no Chrome desktop via Playwright. Registro em `evidencias/painel-desktop/resultado.json`.
- Verificados: cinco indicadores; dez linhas/marcadores; filtros sincronizados; unidade e célula; galeria/carrossel; limpar filtros; zoom/enquadramento/camadas; pesquisa sem resultado; páginas; ordenação; download; modo sem dados; três larguras; coleta preservada; ausência de erros JavaScript/HTTP.
- Corrigidos durante teste: overflow de indicadores em celular, alerta cortado e erro do servidor de desenvolvimento ao solicitar arquivo ausente. O servidor agora lê o arquivo antes de enviar os cabeçalhos.
- Testes não comprovam ingestão, autenticação, permissão ou persistência: esses serviços não existem nesta fase. Safari e dispositivos reais não homologados.

Capturas reais: `01-panorama-1672.png`, `02-mapa-1672.png`, `03-matriz-1672.png`, `04-unidade-1672.png`, `05-sem-dados-1672.png`, `06-panorama-1440.png`, `06-panorama-390.png` em `evidencias/painel-desktop/`.

## Cobertura da Base TXT e faltantes

O TXT é funcionalmente exclusivo da coleta (§0). Esta entrega desktop aplica somente invariantes compartilhadas: interfaces distintas e D1/R2 (§§0–1); separação de rascunhos e oficiais (§7.5); catálogo e permissões aguardando servidor (§§2.5,8); ausência de dupla ficha G/F (§4.G) e não duplicar bens por visitas (§9) permanecem exigências da futura consulta real.

Nenhum novo formulário A–H foi concluído nesta fase. A cobertura mobile anterior permanece em `ENTREGA_FASE_01.md` e sua interface em `/coleta.html`. Integração de recebimento, API Workers, esquema D1, fotos R2 privadas, catálogo oficial/permissões, histórico, idempotência, fórmulas/alertas/relatórios, autenticação e backups ainda faltam. Os pontos P1–P11 da Base não foram resolvidos implicitamente pelo desenho.

## Arquivos desta fase

`web/index.html`, `web/coleta.html`, `web/desktop.js`, `web/desktop.css`, `web/desktop-icons.js`, `web/desktop-data.js`, `web/assets/mapa-demo.png`, `referencia-visual.png`, `ORIGEM_DOS_ATIVOS.md`; `scripts/serve.mjs`, `package.json`, `tests/desktop.cjs`, rota em `tests/browser.cjs`; `DEVELOPMENT.md`, `AGENTS.md`, `DECISOES.md`, `CONFLITOS_DOCUMENTAIS.md`, `RASTREABILIDADE.md`, este relatório e evidências. Fontes originais preservadas. Nenhum push/deploy/migração/credencial.
