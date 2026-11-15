# D123 — permissões e consumo do D1

15/11/2026. Pedido expresso do responsável após revisão da devolutiva Claude: corrigir permissões e consumo, testar, comparar e publicar, mantendo gratuito, localização e alertas; decisões pendentes ficam para depois. Frota pretendida: 101–300 agentes.

## Escopo implementado

- AUD-005: revogação administrativa encerra explicitamente todo acompanhamento ativo do usuário, mesmo que a sessão que o iniciou tenha expirado ou sido removida pela manutenção. Posição/rota são removidas pelos gatilhos D114 na mesma transação. Revogar uma sessão própria encerra apenas o acompanhamento daquela sessão e daquele usuário. Autorização, CSRF e autoria preservados. Expiração NATURAL continua permitindo GPS nativo durante a fila.
- AUD-006: visualizador é recusado em todas as rotas humanas de pareamento, inclusive prévia e catálogo, antes de chegar ao núcleo ou consumir tentativas de QR. Root/admin/operador conservam o fluxo aprovado nos dois Workers.
- AUD-002: `AGENTES_GUARDAR_HEARTBEATS=0` nos dois Workers elimina novas cópias redundantes em `agent_heartbeats` usando a configuração já suportada. Linhas antigas ficam preservadas; presença atual, IP/provedor, snapshots, recibos, nonces e limites de frequência continuam. Nenhuma alteração de EXE ou protocolo.
- AUD-003: resumo recorrente de hardware passa a ler projeção dos eventos ainda relevantes e contadores por unidade, em vez de percorrer todo o histórico. Fichas e comparativos continuam consultando o registro canônico.
- AUD-020: totais de demandas são projeções por situação/unidade; índices atendem à página pedida em ordem de atualização. Busca textual continua contando correspondências reais; não recebe total aproximado.
- AUD-023: após 401 definitivo, o helper de leituras desktop interrompe novas chamadas até login/recarregamento do documento. Mantém erro explícito; 403 não bloqueia outras consultas. Não interfere na coleta nem na capacidade nativa D114.
- AUD-022, parte verificável nesta entrega: CI gera assets antes dos testes; cenário assíncrono atualizado para os dez indicadores atuais D112/D109 e recuperação por novo documento após 401. Isto não declara que toda a suíte legada do CI foi homologada.

## Migração 0035

`panel_hardware_source` é a consulta canônica de eventos ativos. `panel_hardware_active` materializa IDs de notificações, unidade, data e estado; `panel_hardware_counts` agrega pendentes/encaminhados por unidade. Gatilhos inserem/removem somente IDs afetados por notificação, parecer, mudança de situação da demanda, mudança de unidade do equipamento ou remoção/inserção de seu contexto. Inativação de unidade não decide alerta; ausência do equipamento exclui o destaque, preservando histórico.

`service_request_counts` agrega status no escopo global (`scope=''`) e por ID da unidade. Gatilhos transacionais atualizam em criação/exclusão/mudança de situação ou unidade. Demandas históricas de unidade removida mantêm o comportamento anterior. Linhas com total zero não aparecem nas respostas.

Quatro índices adicionais cobrem demandas pendentes/todas, na rede/por unidade. Atualizações de demandas e decisões passam a ter custo adicional de índices/projeções; a economia medida refere-se às leituras recorrentes, não a todas as operações. Nenhum novo gatilho responde a heartbeat, GPS, sessões, fotos ou atualização apenas de respostas do equipamento.

Backfill apenas deriva dados. Não apaga nem reclassifica registros. Projeções não são fonte de autorização: cada requisição continua validando sessão e papel no servidor. Falhas não são convertidas em totais zero.

## Medição reproduzível e limite de capacidade

`node scripts/measure-audit-budget.mjs CAMINHO_PRIVADO_DO_BACKUP.sql SAIDA_PRIVADA.json` restaura a cópia em SQLite e workerd locais; compara código anterior `9c00bac` e atual; exige respostas idênticas. Hashes das 97 tabelas preexistentes são comparados antes/depois da migração; chaves estrangeiras e integridade também. Não publica nem escreve no banco oficial. Saída contém apenas métricas agregadas.

Na cópia de 15/11: hardware 29 → 2 leituras, demandas abertas 74 → 15, todas 120 → 38, concluídas 101 → 52. Heartbeat sintético assinado 12 → 8 escritas e 13 → 12 leituras; recibo repetido aceito sem repetir efeito, corpo alterado recusado e nonce repetido recusado. A medição de heartbeat não inclui limpeza futura dos nonces/recibos, cron, inventário, GPS ou coleta.

O plano gratuito tem 5 milhões de linhas lidas e 100 mil escritas/dia, compartilhadas pela conta; reset 00h UTC/21h Fortaleza. Fonte consultada em 15/11/2026: [Cloudflare D1 Pricing](https://developers.cloudflare.com/d1/platform/pricing/). Índices também geram escritas. Mantém-se o medidor D109, sem contratação.

**Não é garantia para 300 agentes.** Com intervalo de 300 s e oito horas ligadas, 101 agentes × 96 envios × 8 escritas = 77.568 escritas, apenas heartbeats; 300 agentes = 230.400. São projeções ilustrativas baseadas no ensaio local, não totais observados em produção. Uma jornada de 24h multiplica esse componente por três. Não alterar frequência, retenção de segurança, provedor ou plano sem decisão específica; observar Analytics após um dia representativo.

## Publicação e retorno

Aplicar 0035 antes de publicar ambos os Workers. Código antigo tolera as tabelas novas; publicar só um Worker não uniformiza pareamento/configuração de heartbeat. Não há APK ou instalador novo.

Backup privado e versões anteriores registrados no [registro de qualidade](../05-qualidade/PERMISSOES_D1_D123_2026-11-15.md). Em rollback, voltar ambos os Workers; manter 0035. Nunca restaurar backup sobre dados novos por rotina. Se houver divergência de projeção, investigar causa e reconstruir transacionalmente dos registros canônicos, com aprovação operacional; não editar contadores manualmente.

Permanecem fora: decisões de frequência/retenção, política de trabalho sem conexão, critérios de inventário e demais itens não incluídos da auditoria. GPS físico/tela bloqueada não são homologados por testes de navegador.
