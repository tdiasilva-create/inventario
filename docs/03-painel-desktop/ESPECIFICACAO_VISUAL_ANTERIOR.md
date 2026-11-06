# Especificação visual aprovada — Desktop SEMED

**Versão:** 1.0  
**Tela-alvo de revisão:** 1672 × 941 px (16:9 aproximado)  
**Nome do conceito:** Centro de Inteligência Tecnológica — tema escuro.

## 1. Referências em ordem de autoridade

| Imagem | Regra |
| --- | --- |
| `referencias/00_painel_geral_APROVADO.png` | **Referência primária**: identidade visual global e composição do Panorama |
| `referencias/01_mapa_da_rede.png` | Ampliação da tela de Mapa da Rede, com filtros e resumo regional |
| `referencias/02_matriz_equipamentos_por_unidade.png` | Ampliação da matriz e área comparativa |
| `referencias/03_perfil_unidade_selecionada.png` | Página de detalhe da unidade selecionada |
| `referencias/04_estudo_indicadores_integrados.png` | Inspiração aprovada para substituir *grandes boxes genéricos* por apresentação de métricas mais integrada |

Se houver conflito visual, preservar **00** como linguagem comum e aplicar a tela especializada correspondente em seu setor. Os mockups não substituem regras de negócio.

## 2. Direção de arte

- **Aparência:** gabinete de inteligência / central de monitoramento tecnológica municipal; sofisticada e coerente, não sci-fi excessivo.
- **Fundo dominante:** azul petróleo quase preto, usado em sidebar, cabeçalho e área de conteúdo.
- **Hierarquia:** títulos brancos, auxiliares em cinza-azulado, ações primárias em azul elétrico.
- **Acentos funcionais:** verde para OK/confirmado; laranja para atenção; vermelho para alertas; roxo/ciano para distinguir categorias, nunca como única codificação de informação.
- **Gráficos e tabelas:** densidade informativa alta mas ordenada; divisórias discretas, bordas finas e controles compactos.
- **Tipografia:** sans-serif de produto digital, de excelente legibilidade, com pesos 400/500/600/700. Evitar estilos exagerados e títulos decorativos.
- **Ícones:** família única de traço uniforme, dimensões consistentes.

### Tokens de partida para calibração (não são extração exata)

```css
:root {
  --semed-app-bg: #041a2a;
  --semed-sidebar: #041726;
  --semed-header: #061d30;
  --semed-panel: #082338;
  --semed-panel-soft: #0b2a42;
  --semed-border: #1a435a;
  --semed-text: #f4f8ff;
  --semed-muted: #a6bfd0;
  --semed-blue: #1677ff;
  --semed-cyan: #20c0e7;
  --semed-green: #2bd885;
  --semed-yellow: #ffca49;
  --semed-orange: #ff8a31;
  --semed-red: #ef4356;
  --semed-violet: #9454f8;
}
```

Esses tokens servem para iniciar; ajustar visualmente a partir dos PNGs e verificar contraste. Não tratar valores como um design system matematicamente exato.

## 3. Estrutura geral das telas

**Coluna esquerda:** sidebar fixa de ~220–240 px na tela de referência, logo/identidade no topo, itens com ícones e rótulos: Mapa da Rede, Panorama, Unidades, Ambientes, Equipamentos, Ocorrências, Relatórios; seção secundária: Planejamento, Exportar dados, Configurações. Item ativo destacado por faixa azul com contraste alto. Rodapé decorativo opcional.

**Cabeçalho:** título `Inventário Tecnológico SEMED`, subtítulo `Centro de Inteligência Tecnológica`, campo de pesquisa global, notificações e perfil. Conteúdo de breadcrumbs e filtros conforme a tela. Manter alturas compactas.

**Painéis principais:** grids com ocupação consistente do espaço, poucos espaços vazios, modulação rígida e alinhamentos. Bordas/radius discretos, sem sombras ou gradientes gratuitos.

## 4. Panorama — referência 00

1. Linha de filtros: ano, regional, tipo de unidade, situação e controle avançado.
2. Em vez de grandes cards de KPI, usar **faixa analítica horizontal integrada** (ou composição do estudo 04): `90 Unidades` é total de unidades do cadastro; `Equipamentos`, `Ambientes`, `Coletas` e `Pendências` só são números reais depois do processamento. Nunca supor percentuais.
3. Centro-esquerda: **Mapa da Rede Municipal de Educação** com marcadores de escolas, status, filtros e interação de seleção.
4. Centro: **Matriz de Equipamentos por Unidade** em formato heatmap; linhas são unidades e colunas são categorias.
5. Direita: **Alertas e Insights** (somente alertas calculados por regra documentada) e evidências fotográficas.
6. Base: **Unidade Selecionada**, resumo por ambiente/categoria e **Galeria da Coleta** com imagens reais.

## 5. Mapa da Rede — referência 01

- Mapa ocupa a maior parte da área de trabalho; camada geográfica / satélite apenas se serviço de mapas e geocodificação estiverem disponíveis.
- Marcadores com estados semanticamente identificados e legenda. Seleção abre mini-preview, depois detalhe completo.
- Painel lateral: filtros, visão por região e lista contextual.
- Controles: zoom, enquadramento, seleção de camada, agrupamento de marcadores próximos, filtro por status. Preservar acessibilidade de teclado para lista equivalente.
- Região deve vir de atributo existente ou polígono autorizado, não deduzida pelas cores do mockup.
- As referências ilustram regiões genéricas, e não fronteiras ou localizações reais.

## 6. Matriz de Equipamentos por Unidade — referência 02

- Cabeçalho com filtros (regional, tipo, categoria, situação), exportação e timestamp efetivo.
- Predominância visual de uma **tabela/matriz colorida**, não cartões independentes.
- Unidade em cada linha; categorias em colunas; rodapé com totais; paginação/virtualização para 90 unidades.
- Ordenação por coluna, tooltip e clique na célula para detalhes; clique na linha para unidade.
- Disponibilizar visualização tabular legível e tabela exportável. Escala cromática documentada.
- **Nota crítica:** ter 2 computadores é necessariamente menos que 28, mas NÃO significa pior situação. Se a escala da cor representar quantidade, rotular explicitamente `Menor/Maior quantidade`, sem chamar isso de risco. Comparações de adequação exigem denominador ou meta aprovada (por aluno, turma, sala etc.).

## 7. Unidade Selecionada — referência 03

- Hero superior com imagem institucional legítima (se houver), nome completo, código interno, status da vistoria, contatos e localização conforme banco.
- Abas: Visão Geral, Equipamentos, Ambientes, Ocorrências, Inspeções/Coletas, Histórico, Documentos (habilitar apenas dados/funcionalidades validados).
- Grupos de informações compactos em trilhas e tabelas com badges de status; sem replicar uma enxurrada de cards iguais.
- **Equipamentos por Ambiente** + situação operacional, **Ambientes da Unidade** + pendências, **Galeria de Fotografias**, histórico de coletas e relatórios.
- Galeria R2 com miniaturas, ampliação e metadados da coleta; evitar acesso público irrestrito.
- Botão `Nova inspeção` **não** autoriza criar escola; se implementado, depende de permissão e remete ao fluxo de coleta separado.

## 8. Indicadores alternativos — referência 04

O usuário **rejeitou** uma fileira de cinco cartões KPI genéricos. A nova proposta aprovada aceita:
- faixa compacta de indicadores junto ao cabeçalho/contexto;
- painel de camadas ou hierarquia visual;
- anéis de status onde exista percentual verdadeiro e denominador explícito;
- séries temporais apenas se houver registros de datas suficientes para sustentar histórico;
- indicadores embutidos no mapa, matriz e seção de unidade.

**Não** forçar todos os padrões na mesma tela. O Panorama precisa preservar área principal para mapa e matriz.

## 9. Estados de interface e qualidade

- Loading/skeleton, vazio sem dados, falta de permissão, erros recuperáveis e atualização bem-sucedida.
- Ações confirmadas somente após resposta do backend; não simular persistência.
- Tabelas com rolagem e largura adequadas; não esmagar colunas quando viewport for menor.
- Filtros sincronizados entre mapa, matriz e unidade selecionada quando aplicáveis.
- Visualizar sem dificuldades em desktop 1440 px; referência de comparação exata em 1672 × 941; adaptar telas menores sem desmontar a hierarquia.

## 10. Proibido na implementação

- PNG aprovado como plano de fundo mascarando interface inerte.
- Redesenho genérico com fundos brancos ou cartões SaaS padrão.
- Dados inventados como se fossem reais, inclusive mapa, datas, percentuais e nomes de unidades.
- Cópiar brasão não oficial do mockup como marca institucional.
- Abrir diretamente URLs permanentes públicas para fotos restritas; segredos do Cloudflare no browser.
- Alterar a identidade visual sem aprovação expressa.
