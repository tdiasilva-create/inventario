# Plano sugerido de execução por fases — NÃO autoriza implementar tudo de uma vez

**Modo recomendado:** FASES pequenas, cada uma revisada antes de seguir. Não enviar um prompt enorme pedindo sistema inteiro em um único PR.

| Fase | Entregável esperado | Fonte | Gate de aprovação |
| --- | --- | --- | --- |
| 00 | Inventário do repositório e plano técnico, sem criar app | `AGENTS.md`, fontes originais, lacunas | Responsável revisa plano; sem mudança de regras |
| 01 | Design system e protótipo navegável da Coleta Mobile | PNG mobile + Base v1.0, §3–5 e guia de telas | Conformidade visual e fluxo completo sem dashboard |
| 02 | Telas administrativas mínimas para catálogo de unidades e contas | Base §§2.5, 8 | Permissão/coletor corretos, sem autocadastro |
| 03 | Banco D1 e API Workers, versionamento e dados | Base §§1, 6–11 | Schema revisto, migrations e controle de acesso |
| 04 | Fotos R2, câmera/galeria, compressão e vínculos | Base §§5, 7 | Upload seguro, preview, IDs, sem perda de fotos |
| 05 | Inventário contínuo, conferência, conflitos e offline | Base §§7–9, pendências P8/P9 | Testes Chrome/Safari e conflito, fotos obrigatórias |
| 06 | Protótipo e desenvolvimento do Painel Desktop | PNG desktop + documentos desktop | Conformidade de mapa, matriz, unidade selecionada |
| 07 | Indicadores, exportações e relatórios, após regras completas | Doc indicadores + novas decisões | Fórmulas e proteção dos dados homologadas |

A ordem técnica pode ser refinada, mas a responsabilidade de cada frente e as dependências devem permanecer. É aceitável fazer protótipo visual antes de vincular dados reais, desde que demo seja explicitamente marcada.

## Entrega obrigatória em cada fase
- Lista de arquivos lidos e alterados, decisões aplicadas e pendências.
- Capturas de tela reais quando houver UI; comparação com mockup original.
- Testes executados e seus resultados observados; nada de `testado` sem rodar.
- Desvios sugeridos marcados `PROPOSTA`; não mudar fatos aprovados.
- Sem push, deploy, criação de credenciais, cobrança ou migração em produção sem autorização.
