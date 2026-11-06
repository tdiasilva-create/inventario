# Painel desktop — identidade e composição aprovadas

**Imagens de referência:** 00 painel geral; 01 mapa; 02 matriz; 03 perfil de unidade; 04 estudo de indicadores. Consulte [manifesto visual](../../design/MANIFESTO_REFERENCIAS.md).

## Aspecto
- Dark-tech sofisticado, fundo azul petróleo quase preto, azul elétrico, ciano e acentos semânticos verde/laranja/vermelho/roxo.
- Sidebar esquerda persistente, cabeçalho com nome, pesquisa e contexto, área principal informativa e organizada.
- Evitar identidade SaaS genérica, especialmente fileira de cinco grandes cards KPI iguais.
- Indicadores são integrados às análises, faixa horizontal compacta ou outros padrões da imagem 04, sem desviar atenção do mapa/matriz.

## Setores centrais aprovados
| Setor | Fonte visual | Apresentação |
|---|---|---|
| Panorama | `desktop/00` | Mapa + matriz por unidade + alertas + unidade selecionada + fotos |
| Mapa da Rede | `desktop/01` | Mapa dominante e painéis contextuais de filtro/regiões/unidades |
| Equipamentos por Unidade | `desktop/02` | Matriz heatmap por categoria, contagens, escala explícita e seleções |
| Unidade Selecionada | `desktop/03` | Ficha da escola, ambientes, equipamento por ambiente, galeria e histórico |
| Indicadores alternativos | `desktop/04` | Substituir/qualificar cards genéricos; estudar integração visual |

## Comportamento ainda a detalhar
Rotas exatas dos menus, clique em marcador/célula, propagação de filtros, ranking, relatórios e algoritmos de alertas devem ser especificados por funcionalidade antes de serem considerados completos. Não usar números artificiais como métricas reais.

## Observações de integridade
- Mapa e regiões fictícios nos mockups: usar coordenadas oficiais; caso ausentes, exibir ausência de dados, não inventar localizações.
- Quantidade baixa de equipamentos não equivale automaticamente a criticidade alta.
- `Coletas concluídas` e `Equipamentos existentes` são entidades com regras distintas; inventário contínuo impede somar o mesmo item em várias vistorias.
- Fotografias exigem vínculo D1/R2 e autorização de leitura.

Para diretrizes de densidade, sidebar, paleta inicial e advertências adicionais, veja `ESPECIFICACAO_VISUAL_ANTERIOR.md`; qualquer trecho dessa versão anterior que afirme que cadastro individual/lote estava indefinido está SUPERADO pela Base v1.0.
