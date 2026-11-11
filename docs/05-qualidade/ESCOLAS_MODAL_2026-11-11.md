# D-100 — listas de escolas online/offline, 11/11/2026

## Fontes e escopo

Pedido direto e screenshot codex-clipboard-42b4e339-3cd3-4fab-bdb7-b5a420d3a7b6.png. Consultados 00_LEIA_ANTES_DE_TUDO.md, AGENTS.md, REGRAS_DE_PRECEDENCIA.md, DECISOES.md, PENDENCIAS.md, CONFLITOS_DOCUMENTAIS.md, design/MANIFESTO_REFERENCIAS.md, MESA_DE_DADOS.md, ESCOLAS_ONLINE_2026-11-10.md, NOTIFICACOES_E_LOG.md e PANORAMA_MAPA_2026-11-10.md. Cinco referências desktop já inspecionadas nesta sessão; identidade posterior D-080 e tamanho D-091 prevalecem.

Requisitos: botões nos dois indicadores, lista somente de nomes, filtros existentes, nenhuma mudança de classificação de presença. Sem dúvida funcional pendente. Arquivos previstos/alterados: web/school-presence.js, web/desktop.js, web/painel.css, teste integrado e documentação de rastreabilidade.

Não há nova cobertura de perguntas do TXT: alteração somente de consulta desktop. Base original, questionário, fotos e demais pendências preservados. Nenhuma gravação fictícia ou mudança de cadastro em produção.

## Critérios de aceite

1. Nomes da lista correspondem aos IDs contados, sem multiplicar escola com vários computadores; ordenar por nome.
2. Respeitar filtros e tipos ativos; grupo vazio explícito.
3. Reutilizar atualização de 60 segundos, inclusive com modal aberto, sem remontar mapa nem disparar consulta extra.
4. Falha torna contadores desconhecidos/lista indisponível, com recuperação posterior; nunca zero falso.
5. Botões, teclado, Escape, retorno de foco, mapa ampliado e viewport 390 funcionam.
6. Preservar cores, alertas, câmera, navegação dos marcadores e consulta pelo visualizador.

## Verificação e publicação

Build desktop aprovado (88 arquivos, sem coletor). Dois testes puros de presença aprovados. Roteiro school-presence-browser.cjs aprovado com Worker real/SQLite isolado: uma linha por escola, filtros/vazio, atualização da lista aberta sem consulta extra, falha/recuperação, teclado, retorno de foco, mapa ampliado, visualizador, viewport 390, lista de 51 escolas com rolagem própria, paisagem 812×375, nomes com HTML exibidos como texto e limpeza ao navegar. Zero erros JavaScript. Primeira execução encontrou uma asserção de foco inadequada ao Tab do dialog nativo (que permite foco na interface do navegador); teste corrigido para verificar que o fundo não recebe foco. Nenhuma mudança no dialog para mascarar esse comportamento.

Regressão panorama-map-browser.cjs aprovada: escala .7, roda/retorno/Escape, atualização, câmera e sobreposições, Mapa da Rede preservado, viewport 390 e paisagem. Screenshots locais em docs/05-qualidade/evidencias/escolas-modal-2026-11-11 (dados sintéticos, fora do Git); inspeção visual desktop, celular e paisagem. Viewport não equivale a aparelho físico.

Publicação e conferência real pendentes.
