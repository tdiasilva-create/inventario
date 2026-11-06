# Adaptação exclusiva do mapa — V33

Data: 27/10/2026. Pedido esclarecido pelo responsável: aproveitar a aparência do mapa e a região real de trabalho, deixando informações das escolas para depois. Fonte: `C:/Users/SIGAE/Desktop/MAPA-SEMED-V33.html`; decisão D-024.

## Leitura e escopo

Referências do projeto já consultadas nesta implementação: `00_LEIA_ANTES_DE_TUDO.md`, `AGENTS.md`, `REGRAS_DE_PRECEDENCIA.md`, `DECISOES.md`, `PENDENCIAS.md`, `CONFLITOS_DOCUMENTAIS.md`, os cinco PNGs e os documentos em `docs/03-painel-desktop/`, contratos em `docs/04-dados-apis/`, diagramas e `docs/05-qualidade/ACEITE.md`. Nesta alteração foi relido AGENTS.md e examinados os trechos cartográficos do HTML V33: runtime Leaflet, estilos, centro/enquadramento, contorno, inicialização/camadas/escala e origem dos dados. Dados pessoais embutidos não fazem parte do escopo de extração.

## Resultado da análise da fonte

- Leaflet 1.9.4 está embutido no HTML. Extraído como dependência local, com licença BSD preservada em `web/vendor/leaflet/LICENSE.txt`.
- Centro fornecido: latitude -2.5451, longitude -44.1646; zoom inicial 12. Região identificada no próprio documento como Paço do Lumiar.
- `DENS_DATA.ring` contém 159 vértices, incluindo fechamento. Esse contorno foi preservado sem inventar fronteiras, sob indicação de procedência V33. Não foi homologado como limite administrativo oficial.
- As escolas do aplicativo de origem são carregadas por API externa. A integração atual não consulta essa API e não procura dados de alunos/servidores para montar cadastro de escolas.
- O HTML completo não foi copiado para a raiz, para `web/` ou para o repositório. Extraiu-se somente runtime/CSS cartográfico e geometria numérica permitida, sem executar a aplicação de origem.
- SHA256 do original: `b5f8a998fbb0cd51a717e70188ac43a7c25717c0e36d172c46e7f6f46e8d8529`.

## Implementação observável

O mapa ilustrativo foi substituído por cartografia navegável. Foram mantidos os limites visuais do setor no panorama; menu, indicadores, matriz, unidade, ambientes e fotos não foram redesenhados.

| Componente | Situação |
|---|---|
| Satélite e ruas Esri | Camadas reais, com atribuição visível e sem chave privada |
| Arraste, zoom e teclado | Leaflet operacional; scroll do painel não força zoom do mapa |
| Enquadramento | Ajusta ao contorno fornecido, sem criar coordenadas |
| Contorno V33 | Alternar exibição; tooltip informa procedência e ausência de homologação oficial |
| Escala | Métrica, visível sem sobrepor as opções de camada |
| Mapa ampliado | Botão no panorama abre o setor Mapa da Rede |
| Renderizações/filtros | Preservam câmera e camada selecionada; não fabricam marcadores para linhas DEMO |
| Falha da base | Mensagem explícita; contorno permanece. Não se substitui por imagem fictícia ou sucesso falso |
| Origem dos dados | Botão informativo explica contorno e estado das escolas |

As zonas Norte/Sul/Leste/Oeste/Centro e marcadores decorativos do mapa DEMO anterior deixaram de aparecer na região real. Categorias e dados DEMO das demais áreas permanecem intactos; não são utilizados como coordenadas.

O Google Maps do arquivo de origem depende de configuração externa. Não foram copiadas chaves nem criada sessão Google. A adaptação usa as alternativas Esri já presentes no V33. A aparência da cartografia pode variar conforme a base selecionada e a conectividade.

## Arquivos

- `web/desktop-map.js`, `web/desktop-map.css`, `web/map-geography.js`: mapa e validação geográfica isolados.
- `web/data/map-v33.json`: apenas metadados de procedência, centro/zoom/contorno; escolas vazio.
- `web/vendor/leaflet/leaflet.js`, `leaflet.css`, `LICENSE.txt`: dependência extraída e licença.
- `web/index.html`, `web/desktop.js`: carregamento e ligação exclusiva do componente de mapa.
- `scripts/extract-map-reference.mjs`: extração por estrutura/regex numérica, sem eval ou execução do HTML.
- `scripts/serve.mjs`: tipo MIME JSON do recurso geográfico.
- Testes, `package.json` e documentação de decisão/rastreabilidade.

## Testes e screenshots

`node --test tests/domain.test.mjs tests/map-geography.test.mjs`: oito testes aprovados. Os três geográficos verificam que x/y de ilustração não viram coordenadas, coordenadas ausentes/inválidas são rejeitadas e o JSON contém somente os campos previstos.

`node tests/map-browser.cjs`: 16 cenários no Chrome desktop, com carregamento efetivo observado de imagens de satélite e ruas. Contorno, escala, zoom/enquadramento, teclado, alternância de camadas, tela ampliada, preservação de base, filtro, falha simulada da conexão cartográfica e largura de 390 px verificados. Nenhuma chamada à API/Google da outra aplicação; nenhum erro JavaScript observado. Registro: `evidencias/mapa-v33/resultado.json`.

Capturas reais, com bases externas carregadas:

Regressão complementar `node tests/desktop.cjs`: 18 verificações aprovadas após adaptar as expectativas à remoção dos marcadores fictícios. Matriz, filtros, seleção de unidade, galeria, navegação, exportação, modo sem dados e coleta permanecem funcionais. Nenhuma alteração de regra A–H.

- `evidencias/mapa-v33/01-painel-com-mapa-v33-1672.png`.
- `evidencias/mapa-v33/02-mapa-ampliado-v33-1672.png`.
- `evidencias/mapa-v33/03-falha-base-explicita.png` (falha de rede provocada no teste).
- `evidencias/mapa-v33/04-painel-mapa-v33-390.png`.

Comparação visual: composição geral do PNG aprovado desktop 00 mantida; apenas o setor do mapa agora mostra terreno da região real e o contorno V33, em vez da textura/regiões fictícias anteriores. Sem uso do HTML original em iframe ou background.

## Cobertura TXT e limites

Esta fase não acrescenta formulários A–H. Aplica as invariantes compartilhadas dos §§0–1 (interfaces distintas, D1/R2), §2.5 (não criar catálogo oficial fictício) e §7.5 (não alegar recebimento ou conclusão oficial). Recebimento, persistência, autenticação, fotos R2 e pontos P1–P11 continuam pendentes conforme relatórios anteriores.

Cadastro e coordenadas das escolas, integração com o catálogo autorizado e homologação do contorno ficam para próxima etapa. Não houve push, deploy ou operação em ambiente oficial.

Documentação técnica consultada: [Leaflet 1.9.4](https://leafletjs.com/reference.html), [licença oficial](https://github.com/Leaflet/Leaflet/blob/v1.9.4/LICENSE). Nenhuma regra de negócio é inferida dessas referências.
