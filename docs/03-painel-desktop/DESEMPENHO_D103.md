# D-103 — carregamento e leituras do painel

Autorização explícita em 12/11/2026: corrigir consultas repetidas/carregamento, testar, comparar com a medição anterior, publicar no ambiente real e entregar roteiro de testes. Não muda métricas, perguntas, permissões ou identidade.

## Implementação

- `scripts/bundle-desktop.mjs`: esbuild 0.25.12, versão fixa no lockfile, gera seis entradas ESM minificadas com hash. Uma entrada por documento; conta/administração usa uma entrada conjunta. Não há mapas de código-fonte publicados. HEIC permanece sob demanda; Excel e Leaflet preservados. Módulos legados continuam disponíveis para abas antigas.
- `scripts/build-desktop.mjs`: transforma apenas HTML do artefato `dist/painel`, referencia bundles e CSS com hash e calcula manifesto sobre os bytes finais. Fontes/paisagem/geografia não mudam. Metadados ficam fora dos assets publicados.
- Arquivos `/bundles/` de código/CSS versionados têm cache **privado** e imutável. Sessão continua exigida quando o recurso chega ao Worker. HTML/API/fotos não entram nessa política. APIs/HTML continuam `no-store`; fotos permanecem autenticadas/revalidadas por D-072. Arquivos mutáveis mantêm revalidação. Primeiro acesso libera somente bundle da conta/CSS, sem APIs gerenciais.
- Panorama inicia resumo e catálogo simultaneamente, com tratamento independente de falhas. Detalhe e ambientes root também são lidos em paralelo.
- `/api/inventory/panel-status?equipmentIds=…`: leitura autenticada exclusiva dos perfis de consulta desktop; no máximo 50 IDs válidos, sem escrita. Devolve `pending` e `monitoring`, reutilizando a contagem de hardware. Não carrega os 25 registros completos de histórico apenas para desenhar sino/mapa. Histórico/comparativo continuam em suas rotas existentes; clientes antigos conservam `/monitoring` e `/pending-summary`.
- `web/panel-status.js`: um controlador por documento compartilha essa leitura entre sino, mapa e pendências. Intervalo **15 s**; pausa em aba oculta, cancela requisição em voo, retoma ao voltar; timeout de 12 s. Atualizar/alteração confirmada pede uma nova leitura. Não sobrepõe requisições; um pedido durante leitura em curso pode agendar uma única consulta posterior.
- Falha mantém o último dado internamente e informa indisponibilidade, sem converter erro em zero. Não é cache persistente, offline ou cache de autenticação.
- `desktop-request.js`: consultas simultâneas idênticas podem compartilhar somente a promessa em voo; não reutiliza resultados concluídos. Os três módulos de administração compartilham a identidade inicial do documento, enquanto cada operação continua autorizada pelo servidor.
- Resultados recebidos têm timeout, buscam listagem/resumo em paralelo quando necessários e não repetem a consulta só porque outro bloco terminou de carregar. Filtros/IDs/paginação continuam separados, respostas atrasadas não substituem novo contexto.
- Pulso superior mantém **60 s**; preserva os nós quando a apresentação não mudou. Computadores/demandas mantêm **15 s** e compartilham leitura da frota se houver solicitação simultânea da moldura.

## Limites preservados

Sem migração, índice novo, alteração de banco, segredos, originais/miniaturas, cron, EXE, coletor ou provedor de fotos. Não foi adotada a sugestão externa de aumentar polling para 30 s nem a de tornar dados/fotos públicos. Métricas reais não são zeradas por falha. Minificação reduz downloads; não muda a localização do D1 nem elimina latência de serviços externos.

## Verificação e operação

Executar `pnpm build:desktop`, `pnpm test`, `pnpm test:panel-performance` e testes de navegador de indicadores, assíncrono, mapa, presença, navegação, conta e demandas. A comparação controlada usa `pnpm measure:panel:local` com a cópia local do build anterior em `private-data/perf-before/dist/painel` (extraída do commit dcbf75e, não versionada; nunca contém credenciais de produção).

Os resultados finais, limites de medição e versão publicada estão no [registro de qualidade](../05-qualidade/DESEMPENHO_PAINEL_2026-11-12.md). Roteiro do responsável: [TXT](../06-entregas/ROTEIRO_TESTES_DESEMPENHO_PAINEL_2026-11-12.txt).

Referência da ferramenta de build: [API oficial do esbuild](https://esbuild.github.io/api/). A política de código versionado é separada da política de dados privados; não usar o namespace de bundles para JSON, fotografias ou segredos.
