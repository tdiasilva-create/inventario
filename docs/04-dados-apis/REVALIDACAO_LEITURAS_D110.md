# D-110 — revalidação de resultados e cadastro estável das unidades
Data: 12/11/2026. Pedido explícito: reduzir leituras, testar, comparar e publicar; manter gratuito, localização e alertas.

## Implementação
- /api/inventory/results: autenticação/perfil a cada requisição, seguida de leitura indexada de uma revisão. ETag inclui usuário, perfil, unidade consultada e versão da representação. Resposta 304 não repete as quatro consultas de negócio.
- Navegador conserva a última resposta apenas na memória da página. Cada uso exige revalidação no servidor. Sem localStorage, cache HTTP público, service worker ou offline. 401/403 invalidam os validadores; erro de leitura não vira sucesso/zero. 200 sem ETag descarta o valor anterior.
- /api/operations/units: revisão consultada em cada chamada; catálogo e vínculos estáveis ficam em memória por binding D1 e isolate Worker, limitados a dois milhões de caracteres na serialização. Não é cache global garantido nem limite exato da memória do objeto. Reinício ou mudança de revisão refaz leitura transacional.
- Presença dos agentes e demandas são consultadas novamente em TODAS as chamadas. A passagem do prazo de 17 minutos é calculada com o relógio atual, mesmo sem novo heartbeat. Revogação, suspensão, vínculo encerrado e cadastro sem agente mantêm suas regras.
- Sem alteração dos intervalos 15/60 segundos, das rotas GPS, do monitor de hardware, do cron, das fotos ou do plano.

## Invalidação e concorrência
Migração aditiva 0031_panel_read_revisions.sql: duas linhas em panel_read_versions e 33 triggers transacionais. Os dois Workers antigos/novos atualizam as revisões pelas mesmas escritas SQL.
Resultados: unidades (nome, tipo, elegibilidade), conclusão/remoção/seleção da visita publicada, respostas e seções publicadas, published_json de equipamentos e diversos. Rascunho não é promovido.
Catálogo: unidades, conclusão de visitas, categoria/unidade/identidade dos equipamentos, vínculos de agentes, estado da instalação e declaração explícita de computadores.
Sem triggers de revisão em heartbeat, GPS, sessão ou fotografias. Uma edição relevante incrementa uma ou duas revisões; há pequeno custo adicional de escrita nessas edições.
Rollback da transação desfaz a revisão junto com a alteração. Resposta de resultados relê a revisão ao terminar; se houve concorrência, retorna sem ETag para não conservar um agregado potencialmente misto. Primeiro catálogo usa batch transacional; concorrência invalida a entrada, sem reutilizar uma versão antiga como nova.
Falha de versão/catálogo/presença é explícita. Não cachear autorização, cookies, GPS ou presença. Novos campos usados por essas consultas devem ser adicionados à matriz de triggers e testados.

## Aceite e operação
Testes em tests/panel-read-cache.test.mjs e tests/panel-read-cache-browser.cjs. Medição workerd com exportação privada: scripts/measure-panel-read-cache.mjs. Exportação não deve ser versionada nem enviada a terceiros.
Aplicar 0031 antes do novo Worker. Coletor não precisa de nova publicação: triggers capturam as escritas da versão atual.
Rollback: restaurar o Worker anterior mantendo a migração aditiva e suas revisões, que são ignoradas pela versão antiga. Não remover tabelas/dados nem restaurar dump sobre gravações posteriores. Após rollback do painel, o build antigo deixa de emitir validadores.
Limite: a redução depende de dados estáveis e reuso do isolate; primeiro carregamento e alterações são mais caros. Medir dias UTC completos com agentes, cron, coletas e técnicos; não prometer que cinco usuários jamais atingirão a cota. Medidor D-109 permanece disponível.
