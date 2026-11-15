# Validação e publicação — Mapa de Setores e Equipamentos, D121

**Estado: publicado em 15/11/2026 às 09:26 Fortaleza, após autorização explícita. Conferência autenticada concluída às 09:30 Fortaleza.**

## Evidências

1. `node --test --test-concurrency=1 tests/*.test.mjs`: **323 aprovados, zero falhas**, incluindo quatro testes novos do organograma e as regressões de equipamentos, agentes, localização, D1 e coleta. Log: `private-data/mapa-setores-d121-2026-11-15/node-tests.txt`.
2. Rodada focada: 18 testes de mapa, consulta de equipamentos e testes de internet aprovados. Cobertura nova: 60 cadastros/67 itens, três ambientes (um vazio), grupo sem setor, IDs com mesmo rótulo em locais diferentes, FK de outra unidade, nome textual sem vínculo, lote de oito itens, partial atual versus localização publicada, páginas 50/6, filtro exato, ausência de escrita e perfis/GET.
3. SQLite EXPLAIN confirma buscas por `unit_id` nas duas tabelas da view, com índices existentes. Nova estrutura faz três instruções SQL, sem fotos/blobs/snapshots. Não foi medido consumo remoto em produção nesta etapa; nenhum resultado local deve ser interpretado como capacidade ilimitada do plano gratuito.
4. Build desktop passou. `wrangler deploy --dry-run` passou, sem upload/deploy/migração. Log em `private-data/mapa-setores-d121-2026-11-15/worker-dry-run.txt`.
5. Navegação CUA no build servido pelo Worker real com SQLite em memória e nomes **DEMONSTRAÇÃO/TESTE**: expandir Secretaria/Laboratório, seleção por teclado, item exato, fotografia e ampliação com metadados históricos; ficha completa; retorno ao organograma; alternar Lista; segunda página e lote; ambiente vazio; itens sem setor.
6. Atalho root abriu o computador exato e modo `speed`; trocar para `light` e clicar Atualizar preservou a escolha. Histórico permaneceu vazio: nenhuma medição foi disparada. Perfil visualizador abriu o mesmo mapa/ficha, com **zero** botões de editar/apagar/velocidade.
7. Layout compacto conferido em iframe local de 390 × 844 px: área de conteúdo de 375 px (barra do navegador inclusa no frame), seção de 349 px sem exceder a largura, botão de ficha 297 px; Lista e seleção/fotografia legíveis. Trata-se de navegador desktop em área estreita, **não homologação de Android físico**. O APK e suas permissões permanecem intactos.

## Capturas locais

`docs/05-qualidade/evidencias/mapa-setores-2026-11-15/organograma.jpg` e `lista-compacta.jpg`. Fotografia é uma ilustração de teste identificada pelo contexto DEMONSTRAÇÃO; nenhuma foto fictícia foi gravada no Drive/D1 oficial. Capturas e dados de execução seguem o ignore do projeto.

## Correspondência com o pedido

| Critério | Evidência local |
|---|---|
| Unidade no topo / setores conectados | Organograma navegável, captura real |
| Ambientes da unidade / sem mistura de nomes | JOIN por ID e unidade, testes com ambiente estrangeiro e nome repetido |
| Contagem real / lotes | 60 fichas/67 itens, lote de oito itens sem expandir IDs |
| Ambiente vazio / setor não informado | Ambos visíveis e navegados |
| Seleção e resumo / foto | Destaque, ID, tipo e foto do selecionado; erro/ausência distintos |
| Ficha exata | `equipmentId` validado no servidor e ficha conferida pelo ID |
| Organograma / Lista | Mesmos dados, alternância sem escrita ou recarregar a API |
| Muitos itens / área estreita | Paginação 50/6 e frame 390 × 844 |
| Permissões | Root/admin/visualizador na consulta; teste de velocidade só root |
| Demais áreas preservadas | Cadastro, estatísticas, galeria, ambientes e resultados continuam no detalhe |

## Publicação e limitações

Responsável autorizou expressamente: **“Sim, publicar no ambiente real”**, em resposta ao pedido de publicação D121. Publicado somente o Worker do painel em 15/11/2026 às 12:26:18 UTC (09:26:18 Fortaleza), versão `03139a13-361a-4a19-8035-a102d5f96520` em 100%. Versão anterior preservada: `e7eecdd2-0139-4686-864d-4c2a1d767f27`.

O coletor independente permanece em `e1ddf5ca-3b70-4f86-9377-cd667ac7c9dc`, confirmado nas listagens antes/depois. Nenhuma migração foi executada; mesmos nomes de segredos do painel, cron e configuração. APK 1.0.4 preservado. Logs e metadados da implantação estão em `private-data/mapa-setores-d121-2026-11-15/`.

Após publicação, **51 verificações HTTP de acesso passaram**, mais **cinco verificações específicas**: APIs de estrutura, equipamentos e filtro exato de testes retornam 401 sem sessão; módulo JavaScript e detalhe da unidade redirecionam para login. Rodada final de nove testes locais focados passou após ajuste de exclusividade entre fichas atual/publicada.

A sessão estava expirada ao recarregar; o responsável entrou como root e a conferência CUA foi concluída na **BIBLIOTECA MUNICIPAL DE PAÇO DO LUMIAR** (`b72258e8-117a-4054-991a-14eca4717d5c`):

- Estrutura carregou um ambiente, um cadastro e um item. Setor Biblioteca expandiu o computador PC-01.
- Seleção mostrou a fotografia real (miniatura carregada, 240 × 320), ambiente/posição, ID `8a7bbb63-bf49-49e9-b631-531464295208` e etiqueta Agente vinculado.
- Ver dados abriu exatamente o mesmo ID, com ficha, fotos, vínculo e inventário técnico existentes. O agente real é 0.1.8; o novo resumo informou corretamente que precisa de atualização para Teste de velocidade. O fluxo de computador compatível foi validado localmente; não foi solicitada medição real durante esta conferência.
- Alternância Organograma/Lista preservou setor aberto, seleção e fotografia; retorno da ficha funcionou. Nenhum erro de console foi registrado.
- Captura: `docs/05-qualidade/evidencias/mapa-setores-2026-11-15/producao-biblioteca.jpg`. A aba foi deixada no organograma para o responsável.

O APK remoto foi conferido por SHA-256 e permanece `f258f5f8a483a52d092d9a0d4d8bceba89654256524dae24a28b369c397a82a5` (1.0.4). Nenhum registro oficial foi criado/editado/removido e nenhum comando foi enviado a agentes na verificação D121.

Não houve importação, alteração de registros oficiais, coleta, plano Cloudflare, cron, alertas, rastreamento, câmera ou APK. A imagem específica do novo organograma citada no TXT não foi anexada; fidelidade avaliada contra os requisitos textuais e a identidade vigente. Testes locais não comprovam latência de produção, conectividade física dos agentes nem Android físico.


Complemento posterior: [indicadores de comunicação publicados](MAPA_SETORES_SINAIS_2026-11-15.md), com verde/vermelho/cinza no computador. A versão D121 inicial acima permanece como histórico.
