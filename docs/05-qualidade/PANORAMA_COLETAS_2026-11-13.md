# Panorama — classificação das coletas, 13/11/2026

## Fontes e aceite

Lidos nesta fase: `00_LEIA_ANTES_DE_TUDO.md`, `AGENTS.md`, `REGRAS_DE_PRECEDENCIA.md`, decisões/pendências/conflitos aplicáveis D-085/D-103–D-112; `CONTROLE_COLETAS_D111.md`, `INDICADORES_DE_PENDENCIAS.md`, registro de qualidade D-111 e manifesto visual. Cinco PNGs desktop abertos na ordem: `00_painel_geral_APROVADO.png`, `01_mapa_da_rede_APROVADO.png`, `02_matriz_equipamentos_APROVADA.png`, `03_unidade_selecionada_APROVADA.png`, `04_indicadores_integrados_ESTUDO_APROVADO.png`. Identidade atual D-065/D-080 prevalece sobre paleta histórica; composição de mapa/matriz preservada.

O pedido substitui indicadores de coletas do Panorama; não altera a Base original, perguntas ou regras da coleta. Mesma distinção D-111 entre classificação administrativa e conclusão técnica da visita.

## Testes locais

- Dois cenários novos em `tests/collection-control.test.mjs`: resumo/lista coincidentes através de decisão, nova contribuição, reclassificação e inativação; consulta compacta única sem buscar fichas; acesso por perfil/isolamento do coletor/sessão e falha sem zero fictício.
- `tests/collection-overview-browser.cjs`: Worker real com SQLite isolado; indicadores antigos removidos; três novos no cabeçalho e cartões; atalhos abrem listas correspondentes; classificação root refletida; completa permanece após contribuição; falha preserva última leitura; falha inicial mostra travessão; recuperação; visualizador sem edição; layout 390px sem overflow global.
- Teste de 61 segundos com relógio controlado: apenas uma requisição do novo resumo; atualizações periódicas existentes não a repetem. Não representa medição de tráfego diário em produção.
- Regressões do navegador: `pending-indicators-browser.cjs`, `panel-mesa-browser.cjs` e `collection-control-browser.cjs` aprovados. Teste antigo de pendências atualizado somente para novos indicadores visuais; consulta técnica antiga ainda exercitada por URL.
- Capturas locais sintéticas em `evidencias/panorama-coletas-2026-11-13/01-panorama-desktop.png` e `02-panorama-mobile.png`; `browser.json` registra verificações. Não representam dados reais.
- Build desktop: 112 arquivos base, nove bundles. Wrangler dry-run aprovado. Sem migração ou execução de decisões root em produção durante testes.

## Roteiro no ambiente real

1. Abrir Panorama e localizar Controle das coletas · toda a rede, abaixo de equipamentos/ambientes.
2. Conferir Sem dados, Coleta parcial e Coleta completa; clicar em cada indicador para abrir sua lista.
3. Voltar ao Panorama: a leitura é renovada. Conferir igualdade com Controle das coletas sem busca de nome.
4. Quando houver uma decisão administrativa real, root usa Classificar na lista. Ao retornar/atualizar Panorama, o total deve refletir a decisão.
5. Novas contribuições não retiram classificação completa; somente root pode alterá-la.
6. Verificar que demandas, sino, mapa e comunicação continuam disponíveis. Botão Atualizar classificações renova apenas estes três totais.

## Publicação e conferência real

- 285 testes de servidor/unidade aprovados, zero falhas; regressões de navegador descritas acima aprovadas. Verificação documental: 589 links sem erros. Verificação do índice Git sem assinaturas conhecidas de segredos.
- Painel publicado em 13/11/2026: versão `d7ced7c4-ee65-4b65-9bf8-41f93fe967cb`. Wrangler confirmou upload e triggers existentes. Sem migração, alteração do plano, cron, coletor, APK, EXE ou dados de classificação.
- Pós-publicação: 51 verificações públicas de release aprovadas. Novo `/api/collection-control/summary` retorna 401 sem sessão; `/controle-coletas` e `/collection-overview.js` redirecionam para login.
- Conferência autenticada como root, 09:14 Fortaleza: cabeçalho e cartões do Panorama exibem **65 Sem dados, 11 Coleta parcial, 0 Coleta completa**, iguais ao Controle das coletas. Link Coleta parcial abre `/controle-coletas?status=partial`, com 11 unidades e filtro selecionado. Botão Atualizar classificações confirmado às 09:14:39.
- Indicadores antigos de coletas ausentes do Panorama; equipamentos, ambientes, demandas e hardware mantidos. Nenhuma classificação ou outro registro real alterado durante a conferência.
- Captura real: `evidencias/panorama-coletas-2026-11-13/03-producao-panorama.jpg`. Os números são uma fotografia do momento, não valores fixados no código. Persistência de completa e troca de classificação foram exercitadas somente no banco isolado dos testes.
- Link: https://painel-semed-paco.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev/panorama
