# D-093 — TP-18, TP-08 e TP-19

Pedido direto do responsável em 11/11/2026: corrigir estes três pontos, testar e publicar no painel real. Pontos que dependem de decisão permanecem para depois. TP-20 esclarecido pelo responsável: EM RAIO DE LUZ, neste escopo, é a municipal; conveniada fora do escopo. Nenhum cadastro foi reclassificado ou importado.

## Fontes e limites

Consultados: `00_LEIA_ANTES_DE_TUDO.md`, `AGENTS.md`, `REGRAS_DE_PRECEDENCIA.md`, `DECISOES.md`, `PENDENCIAS.md`, `CONFLITOS_DOCUMENTAIS.md`, `RASTREABILIDADE.md`, `MESA_DE_DADOS.md`, `NOTIFICACOES_E_LOG.md`, `NOTIFICACOES_48H_2026-11-10.md`, `PAINEL_NAVEGACAO_2026-11-11.md` e os relatos `AVERIGUACAO_TOUR_PAINEL_2026-11-11.txt`, `AVERIGUACAO_INDEPENDENTE_PAINEL_2026-11-11.txt`, `TESTE_NAVEGADO_PAINEL_REAL_2026-11-11.txt`. Referências visuais desktop já examinadas na fase anterior; identidade vigente D-065/D-080 preservada.

Não muda questionário, presença, prazo de 48 horas, métricas, mapa, permissões, fotos, QR, instalador ou banco. Somente o painel é publicado; sem migração, secrets ou escrita cadastral. Não há nova cobertura nem remoção de requisitos da Base de Coleta TXT original.

## Mudanças e critérios de aceite

| Ponto | Implementação | Aceite |
| --- | --- | --- |
| TP-18 | `web/desktop-notifications.js` distingue pausa por aba oculta, encerramento e timeout. Preserva última leitura durante a pausa; retoma ao voltar; impede resposta de uma instância encerrada | Ocultar entre consultas ou durante uma requisição não gera `!` ou erro no mapa. Retorno rápido não perde a atualização. HTTP 401/503 e timeout reais continuam explícitos; ocultar a aba não limpa erro real anterior |
| TP-08 | `web/painel.css` permite quebra da faixa superior em linhas, mantendo cores, rótulos e destinos | Sete indicadores inteiros em 1366, 1200, 809 e 390 px, sem faixa horizontal escondida; ação de hardware acessível por teclado; menu fixo continua funcionando |
| TP-19 | `web/desktop.js` abre imediatamente o modal de dados do agente. `web/desktop-request.js` aceita cancelamento externo, mantendo limite de 15 segundos | Carregamento anunciado; clique repetido não duplica consulta. Fechar/Esc cancela e devolve foco; resposta atrasada não reabre janela. Falha explícita e Tentar novamente. Mesma ficha e mesma separação oficial/PARCIAL nas Configurações e Coletas em andamento |

O cancelamento intencional não é falha do servidor. Erro real não é substituído por zero nem por sucesso fictício. Dados técnicos e históricos continuam vindo do endpoint já existente.

## Testes

Worker real com SQLite em memória e Edge/Chromium. Dados exclusivamente sintéticos, identificados nas capturas. Falhas, demora e visibilidade controladas somente no navegador isolado; não são injetadas na produção.

- `pnpm build:desktop`.
- `pnpm test:panel-async:browser`: regressão nova dos três pontos, incluindo Configurações e coletas parciais. Integrada à CI. Zero requisições de escrita e zero erros JavaScript esperados.
- Regressões: `agent-monitoring-browser.cjs`, `panel-usability-browser.cjs`, `panel-mesa-browser.cjs`, `panel-navigation-browser.cjs`.
- `node --test tests/agent-monitoring.test.mjs tests/pending-indicators.test.mjs`: 14 testes aprovados; hardware, presença, prazo de 48 horas, indicadores, concorrência e permissões preservados.
- Revisão visual das capturas e verificações de documentação/repositório antes do deploy.

Evidências reproduzíveis, ignoradas no Git: `docs/05-qualidade/evidencias/painel-assincrono-2026-11-11/`, com indicadores por largura, agente carregando/recebido/timeout e `resultado.json`. Capturas reais após publicação em `private-data/evidencias-painel-d093/`.

## Publicação

Autorizada explicitamente pelo responsável. Resultado da publicação e conferência real será registrado após o deploy. Versão anterior para rollback de código: `d8bb3245-094b-4675-a128-adec00c4a3ae`. Coletor anterior: `91ba6200-d080-4026-8e92-7042bd67f86e`.

## Fora deste lote

TP-09 (células zero), TP-17 (retornos), reorganizações opcionais e Fases 4/5 continuam pendentes. TP-01 e TP-14 exigem reprodução adicional. Outros itens do relatório não são declarados corrigidos por esta entrega. TP-20 foi esclarecido pelo responsável, não por inferência de nome ou conciliação automática de planilhas.
