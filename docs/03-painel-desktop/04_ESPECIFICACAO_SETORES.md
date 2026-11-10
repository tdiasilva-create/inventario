# Painel Desktop — setores e intenções aprovadas

**Status:** VISUAL aprovado para os cinco PNGs; comportamentos devem respeitar itens funcionais explicitamente aprovados. O painel NÃO executa o fluxo do coletor mobile. **Detalhes de regras ainda não presentes NÃO devem ser proclamados definitivos.**

| Tela/setor | Referência visual | O que mostrar | Navegação/interatividade esperada |
|---|---|---|---|
| P01 Panorama | `design/referencias/desktop/00_painel_geral_APROVADO.png` + 04 indicadores | Visão da rede com mapa, matriz por escola, unidade selecionada, fotos e alertas documentados | Filtros regionais, seleção de unidade que reflita no mapa/matriz/painel (padrão aprovado de apresentação; detalhar em protótipo) |
| P02 Mapa da Rede | `01_mapa_da_rede_APROVADO.png` | Localização das escolas cadastradas; legenda, agrupamento e status verificados | Selecionar ponto → unidade; filtros regionais; coordenadas reais exigidas |
| P03 Matriz de Equipamentos | `02_matriz_equipamentos_APROVADA.png` | Linhas=unidades, colunas=categorias, quantidades reais, cores comparativas | Filtro categoria/região, ordenar, clicar célula/linha, exportar caso especificado |
| P04 Unidade selecionada | `03_unidade_selecionada_APROVADA.png` | Foto real autorizada da escola, informações, ambientes, equipamentos, ocorrências e fotos | Abas de detalhe vinculadas à unidade oficial |
| P05 Indicadores integrados | `04_indicadores_integrados_ESTUDO_APROVADO.png` | Métricas contextuais integradas, e não cinco caixas KPI genéricas | Percentuais com denominadores reais e origem auditável |
| P06 Ambientes | Linguagem visual de P04; não há mockup setorial isolado aprovado | Ambientes do cadastro e equipamentos relacionados | A especificar interação detalhada antes de aprovar |
| P07 Ocorrências/Pendências | Linguagem visual da interface aprovada | Necessidades e problemas provenientes da coleta | Separar ocorrência de bem, demanda de compra e não localizado |
| P08 Relatórios / Planejamento / Exportação | Há rótulos no menu, NÃO desenho funcional completo | Só dados oficiais sincronizados; sem inventar indicadores | Deve ser especificado detalhadamente em etapa separada |
| P09 Administração | Menu inclui Configurações, mas não há telas aprovadas | Usuários, escolas, questionários e autorizações | Gestão por ADMIN, não habilitar ao coletor |

## Matriz: observação crítica
A gradação cromática pode representar quantidade maior/menor, mas **NÃO** qualidade da escola, necessidade ou risco. Uma escola menor não precisa ter a mesma quantidade de computadores de uma maior. Os critérios de adequação ainda precisam de regra explícita.

## Mapa: observação crítica
Mockups são ilustrativos e não comprovam satélite, fronteiras, geolocalização ou nome das escolas. Não inventar coordenadas. Caso a lista oficial ainda não tenha latitude/longitude, mapa exibe aviso e permite completar os dados pelo fluxo administrativo futuro.

## Fontes para números
Contagens oficiais referenciam inventário de bens existente e vistorias concluídas (sem duplicar IDs, lotes ou grupos G/F); rascunhos ficam fora do painel. Cada filtro precisa produzir contagens rastreáveis e permitir explicar de onde veio o número.

## D-068 — cadastro mestre e matriz compacta (publicados em 06/11/2026)

Root: bloco Números da unidade (opcional), 11 inteiros + prédio/observações/fonte/data; avisos não impedem salvar. Lista traz números em linha secundária e Fora do escopo para legado, acessível ao root. Importação/exportação 27 colunas, arquivos antigos 12 aceitos. Detalhe da unidade mostra números preenchidos e metadados; Unidade selecionada oferece o mesmo cadastro em bloco expansível. Página Unidades mostra alunos/turmas quando informados.

Panorama: Rede em números (cadastro), abaixo dos indicadores existentes D-066/D-067, respeita filtros e distingue dado ausente de zero. Obras fora das somas educacionais, presentes na categoria própria e mapa. Matriz: primeiro/último nome conforme regra/oráculo, title/aria completo, colunas compactas/ícones em card estreito, valores >=12px em negrito, Total oito categorias; nomes completos secundários em Equipamentos. Ordenação/exportação continuam pelo cadastro completo. Identidade D-065, mapa e demais blocos D-067 preservados.

## Atualização D-086 — 10/11/2026

Relatórios agora apresenta computadores por unidade/ambiente, filtros, CSV/Excel e impressão integral. Planejamento apresenta fila de coletas pendentes/demandas abertas/hardware sem parecer, com atalhos e atualização de 15 s; mantém o bloco de Coletas em andamento. A decisão supera descrições anteriores de placeholder/indisponibilidade somente nesse escopo. [Contrato atual](RELATORIOS_E_PLANEJAMENTO.md).
