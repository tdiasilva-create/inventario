# Locais institucionais — exemplos da planilha

27/10/2026. D-025 autoriza detectar locais e usá-los como exemplos. Fonte somente lida: [API MAPA (SEMED), aba 1835004469](https://docs.google.com/spreadsheets/d/1FTNJJwNQkJtNONheGevNgLBJypwFRzhFcfoY3PsoR6s/edit?gid=1835004469). Análise com a skill Spreadsheets em modo leitura; nenhuma planilha criada/editada.

## Detecção rastreável

A fonte apresentou 76 registros: 66 EM, 2 CMI, 4 MILITAR e **4 UNIDADE ADMINISTRATIVA**. Critério explícito: coluna `TIPO_INSTITUICAO`; não se inferiu o tipo por palavras do nome.

| Linha | Nome informado | Latitude | Longitude |
|---|---|---|---|
| 72 | CME | -2.46324955408846 | -44.137649105021964 |
| 74 | SEADEX | -2.5265482438047586 | -44.17345889180052 |
| 75 | SEMED | -2.540829 | -44.170534 |
| 76 | CENTRO LUMINENSE DE CONHECIMENTO | -2.53835 | -44.16601 |

Todos classificados como UNIDADE ADMINISTRATIVA, com coordenadas numericamente válidas; isso não equivale a verificação presencial. Vírgulas decimais convertidas sem arredondamento. Hash CSV e instante da leitura em `web/data/map-examples.json`.

SEMED e CENTRO LUMINENSE compartilham o código informado na fonte. Não foram fundidos. Os IDs `sheet-row-N` identificam a linha desta cópia, não um bem ou unidade oficial permanente; podem mudar se a fonte for reordenada.

## Implementação e limites

- Quatro marcadores próprios na camada **Locais**, inicialmente visível, com botão para ocultar/mostrar.
- Popup com nome, tipo e link à fonte; abertura por teclado e posicionamento sem sobrepor controles.
- Cópia restrita a nome, nome oficial, tipo, código, polo/bairro e coordenadas. Não inclui gestor, contrato, telefone, e-mail, alunos, servidores ou indicadores de equipamentos.
- As demais 72 linhas não foram importadas. Dados e números DEMO da matriz não foram relacionados aos quatro locais.
- Camada de referência independente dos filtros da matriz DEMO, inclusive no modo sem dados de inventário. Não simula D1 ou recebimento de coletas.
- Sem atualização automática: é cópia do instante registrado. Nova leitura explícita: `node scripts/import-map-examples.mjs`.

## Arquivos e validação

Consultados: AGENTS.md, governança/precedência lidas nas fases anteriores, componente e validação geográfica, cabeçalhos/classificações da fonte. Requisitos: coordenadas fornecidas, exemplos rotulados, preservação do restante do painel. Arquivos: `scripts/lib/csv.mjs`, `scripts/import-map-examples.mjs`, `web/data/map-examples.json`, `web/desktop-map.js`, `desktop-map.css`, ligação de botão/informação em `desktop.js`, `tests/map-examples.test.mjs`, `tests/map-browser.cjs`, `package.json`, decisão/rastreabilidade.

`node --test tests/domain.test.mjs tests/map-geography.test.mjs tests/map-examples.test.mjs`: dez testes aprovados. Conferidos CSV com vírgula decimal, quatro registros administrativos, coordenadas válidas, IDs distintos e ausência de campos pessoais/equipamentos.

O teste de navegador verifica quatro marcadores, ocultar/mostrar, abertura de SEMED por teclado, tipo e link da fonte, além dos cenários anteriores de camadas/zoom/filtro/falha de base. Screenshot real: `evidencias/mapa-v33/05-local-institucional-semed.png`; panorama: `01-painel-com-mapa-v33-1672.png`.

Nenhum formulário A–H acrescentado. Mantidas as invariantes §§1,2.5,7.5 do TXT: D1/R2/Workers, catálogo/permissões dependem de integração própria; exemplos não são vistorias concluídas ou indicadores oficiais. Pendências anteriores preservadas. Sem push/deploy ou gravação na planilha/backend.
