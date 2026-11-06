# Glossário mínimo de indicadores — evitar análises enganosas

**Regras aprovadas:** rejeição de grandes KPI cards genéricos, uso de mapa e matriz, não transformar mockups em dados; inventário contínuo.

| Indicador sugerido no desenho | Fonte candidata | Regra e cautela |
| --- | --- | --- |
| Unidades cadastradas | Cadastro oficial `school_units` | 90 unidades informadas, mas catálogo oficial ainda não enviado/importado; total definitivo é a consulta ao banco. |
| Equipamentos da rede | Itens ativos e lotes físicos sem duplicidade | Contar cada bem real uma vez; visitas repetidas não multiplicam inventário. |
| Ambientes | Fichas de ambiente por unidade | Não confundir contagem por tipo de sala com ambientes individualizados. |
| Vistorias concluídas | Inspeções confirmadas API | Definir período; não contar rascunhos/locais. |
| Pendências | Ocorrências e necessidades abertas | Não somar apontamento de Grupo H novamente ao de origem. |
| Não localizados | Casos/pendências de §9 | Não equivalem a bens não verificados durante visita. |
| Equipamentos por unidade/categoria | Equipamentos e lotes corrigidos | Heatmap escala quantidade, não automaticamente gravidade. |
| Cobertura de inventário | Definição institucional pendente | O que equivale a escola coberta? pelo menos uma vistoria? última vistoria? percentual não aprovado. |
| Risco/criticidade | Prioridades registradas e política futura | Não inferir risco por baixa quantidade; nível Baixa/Média/Alta/Crítica ainda sem critérios institucionais completos. |

**Não implementar percentuais nem séries históricas fictícias.** Na primeira etapa desktop, usar contratos tipados e dados de demonstração apenas quando rotulados, até SQL e indicadores serem validados.
