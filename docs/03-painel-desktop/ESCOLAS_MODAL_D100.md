# Escolas online e offline: listas no mapa — D-100

Pedido direto do responsável em 11/11/2026: transformar os dois indicadores do mapa em botões que abrem modal somente com a listagem das escolas. Não foi solicitado relatório, impressão ou dados dos computadores.

## Comportamento

- Panorama e Mapa da Rede: clicar em Escolas online ou Escolas offline abre uma janela com o título correspondente e apenas os nomes das escolas, em ordem alfabética pt-BR. Fechar ou Escape retorna ao botão de origem.
- Lista e contador derivam exatamente do mesmo conjunto: catálogo filtrado, escolas ativas dos tipos escolares D-083/D-088, uma vez por ID. Unidades administrativas, núcleos, obras, conveniadas fora do escopo e unidades inativas não são incluídos.
- Online continua sendo ao menos um agente em comunicação recente, segundo a regra existente. Offline continua incluindo escolas sem agente comunicando; não representa diagnóstico de falha da internet. Esta alteração não redefine presença ou o prazo de 48 horas do log.
- Reutiliza a consulta de frota do pulso (60 segundos em aba visível). Abrir/fechar a lista não cria consultas, gravações, filtros extras ou downloads. Atualizações recebidas alteram também a lista aberta, preservando foco e rolagem.
- Grupo vazio abre mensagem explícita. Consulta indisponível desabilita abertura e mantém contagem desconhecida. Se a lista já estiver aberta, mostra indisponibilidade até a recuperação; nunca transforma falha em lista vazia/offline.
- Modal nativo mantém foco, impede interação com o mapa ao fundo e fica acima do mapa ampliado. Escape fecha primeiro o modal, preservando ampliação/câmera. Saída da página remove a janela.
- Nomes inseridos por textContent, sem interpretar HTML. Mesma leitura para root/admin/visualizador. Sem mudança de autenticação, servidor, banco, coletor, agente, Drive ou Base de Coleta.

Arquivos: web/school-presence.js, web/desktop.js e web/painel.css. Teste integrado existente ampliado em tests/school-presence-browser.cjs; regras puras e regressão do mapa ampliado preservadas.

[Aceite e publicação](../05-qualidade/ESCOLAS_MODAL_2026-11-11.md).
