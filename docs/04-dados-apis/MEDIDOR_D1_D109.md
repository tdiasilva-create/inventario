# Medidor da franquia D1 — D-109

Solicitado em 12/11/2026: root vê o medidor ao lado de **Hardware aguardando
parecer**, avisos em 70%, 85% e 95%, atualização de cinco minutos. Implementar,
testar e publicar no ambiente real, mantendo gratuito, localização e alertas.

## Fonte e interpretação

Cloudflare GraphQL Analytics, conjunto `d1AnalyticsAdaptiveGroups`, soma de
`rowsRead` e `rowsWritten`, filtro somente pela conta institucional. Abrange
TODOS os bancos D1 dessa conta, incluindo requisições de agentes, coletor,
painel e tarefas agendadas. Contagem de chamadas não equivale a linhas lidas.
Não faz varredura de tabelas nem grava telemetria por requisição.

Franquias do Workers Free verificadas na documentação oficial: 5.000.000 linhas
lidas/dia, 100.000 gravadas/dia. Dia UTC: de 21h às 21h em Fortaleza. O medidor
representa a maior porcentagem entre leituras e gravações; detalhes mostram
ambas. Limites >=70/85/95/100 geram estados atenção/elevado/crítico/atingido.
Não modifica plano nem cria bloqueio preventivo ou altera frequência de GPS,
hardware, agentes ou telas operacionais. Não monitora outros limites, como
armazenamento total ou requisições Workers.

Leitura da última hora permite estimativa linear de esgotamento, apenas após
15 minutos do período e quando houver consumo positivo. É estimativa, não
garantia de horário: analytics pode atrasar e a carga pode mudar. Falha nunca
vira zero. Dados do período anterior não aparecem como consumo atual após 21h.
Histórico recente contém até sete períodos, obtidos do provedor, incluindo o
atual incompleto. Dias sem linha retornada não são inventados.

## Infraestrutura e segurança

- `server/d1-usage.mjs`: consulta, validação, cálculo e rota.
- `/api/root/d1-usage`: GET no painel, sessão fresca validada no D1, somente
  root com senha definitiva. Coletor responde 404; demais perfis 403.
- `USAGE_ACCOUNT_ID`: identificador público da conta; não vem do navegador.
- `CLOUDFLARE_ANALYTICS_TOKEN`: segredo do Worker do painel. Token exclusivo
  com **Account Analytics: Read**, restrito à Secretaria. Criação confirmada
  expressamente pelo responsável; sem permissões D1 de escrita, Workers ou
  faturamento. Nunca usar o OAuth amplo do Wrangler como segredo da aplicação.
- `USAGE_CACHE`: namespace Workers KV `semed-system-usage`, gratuito, painel
  somente. Chave `d1-usage:v1` contém apenas totais/instantes/último erro
  sanitizado, última leitura válida e histórico agregado. TTL sete dias.
- Cron de minuto existente: consulta métricas apenas nos minutos divisíveis
  por cinco. No máximo uma tentativa normal por janela; sem retry automático.
  Uma gravação KV por janela (~288/dia), não por usuário/heartbeat. Free KV:
  1.000 gravações/dia e 100.000 leituras/dia (limites da conta, não exclusivos).
  Consistência eventual pode acrescentar atraso à atualização.
- Timeout externo 10s. Erros do provedor não expõem token/corpo; mantêm a última
  leitura. API GET somente lê KV, nunca chama Analytics nem dispara escrita.
- A atualização KV termina mesmo se o monitor D1 falhar por franquia; o erro
  original do monitor continua observável. Autenticação NÃO é contornada:
  durante bloqueio D1, a interface conserva o último valor recebido e avisa a
  falha, mas uma nova sessão pode ficar impossibilitada de consultar o medidor.

## Interface

`web/panel-usage.js`, integrado a `panel-pulse.js`, e estilos em `painel.css`.
Somente root inicia o polling de cinco minutos. Pausa em aba oculta, retoma
quando vencido; cancelamento no descarte. Contadores existentes preservados.
Botão compacto com porcentagem, cor e descrição acessível do nível. Clique
abre modal com saldo, progresso, previsão, horário Fortaleza, última leitura
e histórico. Sem modal automático, som ou alteração do sino de hardware.
Falha/desatualização indicada por `!` e texto no modal, sem apagar último dado.
Esc/Fechar devolve foco; histórico e foco são preservados durante atualização.

## Instalação, transferência e rollback

1. Criar namespace KV gratuito e registrar seu ID no binding `USAGE_CACHE` do
   `wrangler.jsonc` do painel. Não adicionar ao coletor.
2. Criar token restrito acima na conta correta e inserir com
   `wrangler secret put CLOUDFLARE_ANALYTICS_TOKEN` por entrada padrão segura.
   Não versionar token nem incluir em comando/URL/log/artefato público.
3. Configurar `USAGE_ACCOUNT_ID`, executar testes/build e publicar painel.
4. Aguardar próximo minuto múltiplo de cinco (ou inicializar uma única leitura
   real administrativa no KV). Conferir atualização pelo cron e acesso root.
5. Nenhuma migração ou restauração de D1 é necessária. Coletor, APK e EXE não
   precisam de publicação. Em rollback, voltar à versão anterior do painel;
   KV/segredo podem permanecer sem uso. Não apagar ou restaurar dados oficiais.

Ver [testes e publicação](../05-qualidade/MEDIDOR_D1_2026-11-12.md).

Fontes oficiais consultadas: [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/),
[Analytics](https://developers.cloudflare.com/d1/observability/metrics-analytics/),
[permissão do token](https://developers.cloudflare.com/analytics/graphql-api/getting-started/authentication/api-token-auth/),
[limites KV](https://developers.cloudflare.com/kv/platform/limits/).
