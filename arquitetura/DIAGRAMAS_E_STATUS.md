# Diagramas do sistema SEMED — visualizações técnicas

**ATENÇÃO:** estes desenhos foram produzidos para explicitar a arquitetura e os fluxos a partir das decisões de nossa conversa. São **sínteses derivadas**; não devem ser confundidos com screenshots de interface aprovados nem com SQL/APIs finalizados.

| Diagrama | PNG (para visualizar) | SVG (zoom nítido) | DOT (editar) | Fonte de requisitos |
|---|---|---|---|---|
| Arquitetura geral mobile ↔ Workers ↔ D1/R2 ↔ desktop | [PNG](01_ARQUITETURA_GERAL.png) | [SVG](01_ARQUITETURA_GERAL.svg) | [DOT](01_ARQUITETURA_GERAL.dot) | Base §§1,7 e conversa |
| Fluxo da coleta mobile | [PNG](02_FLUXO_COLETA_MOBILE.png) | [SVG](02_FLUXO_COLETA_MOBILE.svg) | [DOT](02_FLUXO_COLETA_MOBILE.dot) | Base §§2–5,7 |
| Modelo conceitual de dados | [PNG](03_RELACIONAMENTOS_DE_DADOS.png) | [SVG](03_RELACIONAMENTOS_DE_DADOS.svg) | [DOT](03_RELACIONAMENTOS_DE_DADOS.dot) | Base §11 |
| Salvamento e sincronização | [PNG](04_ESTADOS_DE_SINCRONIZACAO.png) | [SVG](04_ESTADOS_DE_SINCRONIZACAO.svg) | [DOT](04_ESTADOS_DE_SINCRONIZACAO.dot) | Base §§7–8 |
| Navegação desktop | [PNG](05_DESKTOP_NAVEGACAO.png) | [SVG](05_DESKTOP_NAVEGACAO.svg) | [DOT](05_DESKTOP_NAVEGACAO.dot) | Conversa e desenhos desktop |

Os arquivos `.dot` permitem modificar os diagramas com Graphviz e regenerar PNG/SVG após novas decisões. Nenhum destes substitui os desenhos oficiais em `design/referencias`.
