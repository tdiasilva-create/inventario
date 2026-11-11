# D-092 — cinco correções de navegação do painel

Pedido explícito em 11/11/2026: corrigir os cinco problemas confirmados na navegação, testar e publicar no ambiente real. Escopo restrito à interface desktop. Sem migração, alteração de dados, regras do questionário, fotos, QR, agente ou publicação do coletor.

## Correções e critérios de aceite

| Problema confirmado | Correção | Aceite |
| --- | --- | --- |
| Marcador selecionado da SEMED intercepta o clique em ALANA | Pontos cujas áreas se sobrepõem oferecem uma lista com nomes e tipos, nas coordenadas originais | Escolher qualquer unidade próxima; ponto isolado e teclado selecionam diretamente; alertas continuam abrindo o modal da unidade escolhida |
| Voltar do detalhe parcial pula a lista | Lista e detalhe têm entradas distintas no histórico, com o ID da vistoria na URL | Voltar, Avançar, recarga e Voltar à lista preservam o percurso |
| Ambientes perde a unidade ao recarregar | Seleção é registrada no parâmetro `id`, e lida na entrada/recarga/histórico | Unidade escolhida permanece após recarga; Voltar/Avançar restauram a seleção |
| Menus de ações de usuários acumulam | Apenas um menu aberto; fechamento por clique fora, saída do foco e Esc | Alternar dois menus sem deslocar o alvo durante o clique; Esc devolve o foco ao resumo |
| Esc não fecha o perfil | Fechamento e `aria-expanded` sincronizados | Esc fecha Minha conta/Sair e devolve foco ao botão; clique fora também fecha |

A seleção de unidade acompanha também a navegação entre Panorama, Mapa, Ambientes, Equipamentos e detalhe. URL guarda somente identificadores de contexto. Cores, coordenadas, composição, permissões e separação entre rascunho e inventário oficial preservadas. No mapa ampliado, Esc fecha primeiro a escolha de unidade e depois a ampliação; modal de hardware mantém sua prioridade.

## Verificação local

Worker real e SQLite em memória, dados identificados como TESTE ISOLADO. Navegador Edge/Chromium; tela principal 1672×1050, menus também em 390×844. Nenhuma escrita remota. O novo roteiro registra zero requisições de escrita e zero erros JavaScript.

- `node tests/panel-usability-browser.cjs`: os cinco casos, coordenadas/cores, teclado, URL direta, recarga e histórico.
- `node tests/panorama-map-browser.cjs`: ampliação/retorno, roda, atualização de 61 segundos, modal de hardware e tamanhos menores.
- `node tests/hardware-review-browser.cjs`: alertas por clique, parecer, demanda, idempotência e visualizador somente leitura, exclusivamente no banco isolado.
- `node tests/tour-logic-browser.cjs`: busca, ambientes, navegação cruzada, cancelamento administrativo e senha provisória isolada. Roteiro atualizado para reabrir o menu após sair dele para uma confirmação.
- `node tests/panel-navigation-browser.cjs`: rotas distintas, histórico, consultas independentes, timeout, retomada e sessão expirada.
- `node --test tests/in-progress.test.mjs tests/map-geography.test.mjs tests/map-examples.test.mjs`: 7 testes aprovados.
- Build desktop e dry-run aprovados. Servidor compartilhado e configurações de destino sem alterações.

Evidências locais em `docs/05-qualidade/evidencias/painel-navegacao-2026-11-11/`: escolha-unidades-proximas.png, ambientes-contexto-preservado.png, coleta-voltar-avancar.png, menus-fechados.png e resultado.json. Artefatos ignorados pelo Git; roteiro reproduzível incluído na CI.

## Publicação e conferência real

Em preparação. Versão anterior do painel: 376572e4-184b-4fd8-8d4a-2057c5b81cd8. Coletor a preservar: 91ba6200-d080-4026-8e92-7042bd67f86e. Atualizar esta seção com versão, testes HTTP e observações autenticadas depois do deploy.

## Roteiro para o responsável

1. Recarregar o Panorama e clicar no ponto onde ALANA e SEMED se sobrepõem; escolher a unidade pelo nome.
2. Em Coletas em andamento, abrir uma coleta, usar Voltar e Avançar do navegador.
3. Em Ambientes, escolher outra unidade e recarregar: o nome deve permanecer.
4. Em Usuários, abrir duas ações sucessivamente: apenas a última permanece. Clicar fora ou usar Esc.
5. Abrir o menu root no cabeçalho e usar Esc: ele fecha e o foco retorna ao botão.

Não é necessário salvar, concluir, apagar cadastros ou alterar senhas nesses testes.
