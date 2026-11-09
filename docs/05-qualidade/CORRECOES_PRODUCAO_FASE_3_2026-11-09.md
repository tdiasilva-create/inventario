# Auditoria — Fase 3: painel por blocos

Autorização expressa do responsável em 09/11/2026: iniciar Fase 3, preservar identidade e adiar pontos que dependem de decisão; publicar no ambiente real. Destino: somente Worker do painel. Sem migração de banco, alteração de questionário, EXE, QR, contas ou provedor Drive.

## Fontes consultadas e escopo

`00_LEIA_ANTES_DE_TUDO.md`, `AGENTS.md`, `REGRAS_DE_PRECEDENCIA.md`, `DECISOES.md`, `PENDENCIAS.md`, `CONFLITOS_DOCUMENTAIS.md`; documentos de `docs/03-painel-desktop/`, modelo/fluxo/contratos de dados, cinco fontes DOT e aceite de qualidade. Base original §§5–9 (fotos, publicação, permissões, histórico e offline) preservada. Cinco PNGs desktop abertos na ordem do manifesto; sua composição é complementada por D-067 e a paleta é superada por D-065. Pacote externo: `06_PLANO_DE_CORRECAO.md`, `07_INSTRUCAO_CODEX.txt`, `01_ERROS_ENCONTRADOS.md`, `02_LOGICAS_NAO_APLICADAS.md`, `03_DESEMPENHO_FOTOS.md`, `04_ICONES_E_EXIBICAO.md`, `05_MELHORIAS_RECOMENDADAS.md`.

Aplicáveis: FOTO-07, ERR-03/07/08/18, LNA-08/09/11/13 e MEL-06, no escopo de consultas desktop. ERR-19/locais de referência e filtro Ano dependem de decisão e não foram implementados. D-065/D-066/D-067/D-068/D-069 continuam regendo identidade, tipos, contagem, layout e filtros por categoria. Propostas dos anexos não substituem essas decisões.

Arquivos: `web/desktop.js`, novos `desktop-blocks.js` e `desktop-exports.js`, `desktop-map.js`, `desktop-inventory.js`, `desktop-results.js`, `desktop-progress.js`, `photo-viewer.js`/CSS; `server/collector.mjs` e `in-progress.mjs`; build, testes, CI e documentação. Todos os ajustes no servidor nesta fase são leituras; nenhuma escrita de migração/cadastro é necessária.

## Implementação

- O documento e a instância Leaflet são mantidos nas atualizações da mesma página. O reconciliador preserva os blocos por chave, imagens sem mudança de URL, foco e detalhes abertos. Widgets com estado próprio continuam responsáveis por seu conteúdo. Mudança de página pode remontar seu mapa; digitação/seleção/filtro na mesma página não o faz.
- Busca com intervalo de 250 ms, marcadores atualizados sem recriar o mapa, máximos da matriz calculados uma vez por renderização. Geometria, ruas/satélite, enquadramento e política de limites mantidos.
- Fachada oficial no detalhe e preferida na evidência; consulta inclui a fachada mais recente mesmo quando anterior às últimas 50 fotos. Total real exibido em “Ver todas”; visualizador carrega páginas de 48 pela rota protegida existente, com recuperação de erro. Rascunhos e imagens de outra unidade não compõem a galeria oficial.
- Cache de detalhe em memória por 60 s, Atualizar manual, consulta automática do resumo em 60 s quando a página está visível, invalidação pelo carimbo de publicação. Não é offline nem armazenamento durável. Falha mantém o último dado recebido e mostra aviso; nova tentativa é explícita. GETs de detalhe/resumo têm prazo de 15 s.
- Resultado atrasado de um filtro não substitui o filtro atual. Consulta parcial recebe `agent_linked` real e acesso aos dados do agente, preservando rótulo PARCIAL.
- Exportação da matriz conectada ao botão. Exportar dados oferece unidades, matriz, fichas publicadas e ocorrências recebidas em CSV/XLSX; percorre todas as páginas/unidades do recorte. Uma consulta com falha não gera arquivo parcial. Fichas usam `published_json`; não incluem alterações de rascunho. Células textuais com prefixos de fórmula são escapadas. Exportação não equivale a backup transacional nem inclui binários de fotografias.
- Tipo de unidade disponível nos filtros avançados. Categoria ao clicar na matriz já estava implementada por D-069: preservada e testada, sem substituir a consulta existente.

## Critérios e resultados

Critérios: 10 caracteres → no máximo uma montagem inicial do mapa, sem novas buscas de foto por mero render; foco/detalhes preservados; fachada fora das últimas 50; paginação completa; expiração/Atualizar/erro; categoria; exportação >50 com zeros à esquerda no XLSX e proteção contra fórmula; perfil e separação oficial/parcial; paleta e 11 blocos D-067.

Ensaios novos aprovados: `tests/panel-blocks.test.mjs` e `tests/panel-blocks-browser.cjs`, com Worker real/SQLite em memória e imagens sintéticas. 57 fotos oficiais, fachada mais antiga, 58 fichas publicadas (65 itens físicos), 58 ocorrências exportadas. Busca de 10 teclas: uma montagem do mapa, mesma imagem/DOM e zero consultas adicionais de detalhe/fotos; TTL e recuperação de falha aprovados. Dados do agente acessíveis na visita aberta sem publicação automática. Nenhum exemplo foi gravado em produção.

O teste de identidade percorreu 17 rotas, preservou os 11 blocos do Panorama e a paleta clara/vermelho/laranja. Capturas locais em `docs/05-qualidade/evidencias/painel-fase3-2026-11-09/`: `01-panorama-preservado.png`, `02-galeria-paginada.png`, `03-fachada-detalhe.png`, `04-exportacoes.png`, `05-agente-parcial.png`, `resultado.json`. São ensaios isolados, não imagens oficiais nem medição de rede real.

## Limites e Base de Coleta

Cobertos nesta fase: leitura de evidências vinculadas e ampliação (§5); separação de rascunho, publicação e permissões (§7); preservação de histórico/ID e dados oficiais (§§8–9). Não altera a Base original. Exportações trazem o estado lido durante sua execução, sem congelamento transacional entre páginas. Recebimentos concorrentes podem exigir uma nova exportação.

Permanecem decisões de lugares de referência, Ano, critérios de indicadores e busca global além do escopo aprovado. Fases 4/5, offline durável, testes físicos de câmera/teclado/Windows e medições em rede real continuam pendentes. Esta fase não declara concluída toda a auditoria.

Publicação: registrar versão, verificações e limites em `PUBLICACAO_FASE_3_2026-11-09.md` após execução. Retorno de código previsto para painel `c6a440fb-ae93-4bd2-879c-eaba507e2fbc`; coletor permanece `ef33d619-52da-4726-989c-6a49b551a899`. Não restaurar/apagar D1 ou Drive para retornar código.

## Regressão final antes da publicação

Aprovados **141 testes de domínio/API**, **12 roteiros de navegador**, builds desktop/coletor, documentação gerada e dry-run do painel. Após agrupar as leituras do detalhe em um batch D1, seis testes de detalhe/permissões/fotos/andamento foram repetidos e passaram. A regressão de monitoramento encontrou um conflito entre renderização do painel e atualização silenciosa da ficha do agente: o componente agora conserva sua montagem e os dados anteriores durante a consulta silenciosa. O roteiro de notificações e o de consulta de equipamentos passaram após a correção, incluindo memória atualizada, foco/cursor e recuperação de falha.

Os arquivos `desktop-equipment.js` e `desktop-inventory.js` também integram a correção. A prova local da galeria usa imagens sintéticas de um pixel para verificar navegação e requisições; a aparência das fotos reais é conferida separadamente após a publicação. Nenhuma credencial, foto oficial ou exportação com dados reais integra o Git público.
