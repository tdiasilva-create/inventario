# Relatórios e Planejamento — aceite D-086

## Escopo e fontes

Escolha explícita da opção 2 pelo responsável, no contexto da autorização contínua para publicação real. Consultados AGENTS, 00_LEIA_ANTES_DE_TUDO, precedência, decisões, pendências, conflitos, manifesto e cinco PNGs desktop, documentos de interface/setores, Central de demandas, monitoramento e critérios de aceite. Identidade D-065/D-080 preservada. [Contrato detalhado](../03-painel-desktop/RELATORIOS_E_PLANEJAMENTO.md).

Arquivos: `server/management-views.mjs`, integração em worker, compartilhamento de critérios em service-desk/pending-indicators; `web/desktop-management.js`, desktop/desktop-blocks/painel.css; build, package, CI e testes. Nenhuma pergunta/requisito novo do TXT foi implementado; Base original e coletor preservados.

## Testes executados

- `pnpm test`: **195 testes aprovados**, incluindo seis novos testes de servidor. Filtros combinados, permissões, lotes, parcial/publicado, comunicação, paginação de 142 fichas e exportação integral; fila com 72 unidades homônimas sem mesclagem; demandas de unidades removidas/inativas; transições de parecer, conclusão/revisita e falha sem falso zero.
- `management-views-browser.cjs`: Worker real + SQLite isolado, 65 fichas. Páginas 60/5; CSV/Excel com todas as 65 linhas; prévia/impressão/PDF integral; caracteres HTML/fórmulas; exportação incompleta recusada sem download; filtros não aplicados; falha/recuperação; navegação interna, voltar, filtros e atalhos de Planejamento; atualização de 15 s após parecer; visualizador e largura 390 px.
- Regressões de navegador aprovadas: `desktop-identity-browser.cjs` (17 rotas), `tour-logic-browser.cjs`, `panel-blocks-browser.cjs`, `pending-indicators-browser.cjs`. Preservam mapa, busca, fotos, exportações existentes, identidade, coletas parciais e indicadores separados.
- Evidências locais em `docs/05-qualidade/evidencias/relatorios-planejamento-2026-11-10/`: `relatorio-computadores.png`, `planejamento-fila.png`, `impressao-preparada.png`, `planejamento-apos-parecer.png`, `planejamento-390.png`, `relatorios-390.png` e `relatorio-teste.pdf`. Capturas reais da aplicação com TESTE LOCAL/Dados sintéticos; não são dados oficiais. Ignoradas pelo Git conforme política do projeto.

Não houve gravação de demanda, coleta, parecer, equipamento ou imagem na produção para testar. Testes físicos de EXE/celulares não fazem parte desta alteração desktop. Relatório consulta o estado atual; comunicação não prova máquina ligada/desligada. Contagem por ficha preservada.

## Publicação

Em preparação: registrar versão ativa, commit, verificações e manutenção da versão do coletor após publicação.
