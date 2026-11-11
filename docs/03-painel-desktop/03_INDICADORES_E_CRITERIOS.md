# Glossário mínimo de indicadores — evitar análises enganosas

**Regras aprovadas:** rejeição de grandes KPI cards genéricos, uso de mapa e matriz, não transformar mockups em dados; inventário contínuo.

| Indicador sugerido no desenho | Fonte candidata | Regra e cautela |
| --- | --- | --- |
| Unidades por categoria (D-066) | Cadastro real `units.unit_type`, consulta autenticada de ativos | Contagens independentes para escolas municipais, conveniadas, núcleos Educa Paço, núcleos tecnológicos e unidades administrativas; respeitar filtros. Sem total geral no indicador do Panorama. Tipo ausente/desconhecido fica em “Sem classificação”; falha de leitura não é zero. |
| Equipamentos da rede | Itens ativos e lotes físicos sem duplicidade | Contar cada bem real uma vez; visitas repetidas não multiplicam inventário. |
| Ambientes | Fichas de ambiente por unidade | Não confundir contagem por tipo de sala com ambientes individualizados. |
| Vistorias concluídas | Inspeções confirmadas API | Definir período; não contar rascunhos/locais. |
| Pendências | Ocorrências e necessidades abertas | Não somar apontamento de Grupo H novamente ao de origem. |
| Não localizados | Casos/pendências de §9 | Não equivalem a bens não verificados durante visita. |
| Equipamentos por unidade/categoria | Equipamentos e lotes corrigidos | Heatmap escala quantidade, não automaticamente gravidade. |
| Cobertura de inventário | Definição institucional pendente | O que equivale a escola coberta? pelo menos uma vistoria? última vistoria? percentual não aprovado. |
| Risco/criticidade | Prioridades registradas e política futura | Não inferir risco por baixa quantidade; nível Baixa/Média/Alta/Crítica ainda sem critérios institucionais completos. |

**Não implementar percentuais nem séries históricas fictícias.** Na primeira etapa desktop, usar contratos tipados e dados de demonstração apenas quando rotulados, até SQL e indicadores serem validados.

## D-068 — números do cadastro, separados dos resultados de vistoria

Rede em números soma students_total, classes_total, seats_available e staff_total das unidades ativas filtradas, excluindo conveniadas e obras. Cada métrica informa cobertura; N de M geral conta unidades com ao menos um desses quatro campos. Nenhum valor informado: —, inclusive conjunto vazio; zero informado: 0. Fontes/datas podem variar e ficam no detalhe. Falha da API: indisponível, não zero. A contagem por categoria mantém sete tipos; não criar total genérico de unidades. Total da matriz soma as oito categorias físicas já publicadas, sem incorporar rascunhos.

## D-085 — substituição do indicador genérico de pendências

Em 10/11/2026 foram aprovados três indicadores separados, de toda a rede: coletas pendentes (unidades), demandas abertas (atendimentos) e hardware aguardando parecer (eventos). Não somar os três nem confundir leitura de notificação com decisão administrativa. Cada um abre a consulta correspondente, com atualização compartilhada de 15 s. [Critérios, exceções e contratos](INDICADORES_DE_PENDENCIAS.md). Esta decisão supera as referências anteriores a “Pendentes” sem critério.

## D-090 — municipais e subconjunto militar

Escolas municipais inclui Escola municipal + Escola municipal militar. Das quais militares conta somente o segundo tipo. É um subconjunto informativo, não categoria para somar novamente. Aplicar ao conjunto ativo filtrado; creches e demais tipos permanecem separados, sem total geral. Preservar classificação real e cores. Nenhum valor histórico fixado no código. [Cadastro escolar e critérios](../04-dados-apis/CADASTRO_ESCOLAS_D090.md).
