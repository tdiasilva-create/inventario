# Escolas onlines e marcadores roxos — D-083

## Pedido e fontes

Após solicitar recebimento sem execução até dizer “terminei”, o responsável pediu: substituir o indicativo “Computadores funcionando” do mapa por “Escolas onlines”; escola online quando algum computador da unidade comunica; nenhuma máquina comunicando significa offline nessa métrica; localização da exibição de offline ainda não definida. Pediu também os marcadores das unidades na cor `#7523C9`. Autorização de execução retomada com “terminei”, no contexto da publicação real em andamento.

Consultados `00_LEIA_ANTES_DE_TUDO.md`, `AGENTS.md`, precedência, decisões, pendências e conflitos; Central de demandas, Mesa de dados, contrato de monitoramento D-070, aceites D-081/D-082. Cinco PNGs desktop abertos na ordem do manifesto; identidade posterior e capturas enviadas prevalecem para esta mudança. Arquivos originais recebidos: `codex-clipboard-1c8539ee-c60e-41cb-a6e8-2e893ca49b68.png` e `codex-clipboard-f9ece5de-dc44-40f6-988d-f0d8078b8be9.png`.

## Regra implementada

- Contar IDs distintos de escolas ativas entre os filtros do painel, usando os tipos já existentes de `schoolTypes`: Escola municipal, Escola municipal militar e Creche municipal. Não inclui unidades administrativas, núcleos, obras, conveniadas ou inativas; classificação pelo tipo, nunca pelo nome.
- Pelo menos um computador em `communicating` ou `communicating_with_failure` torna a escola online. Um ou vinte computadores comunicando contam uma escola. Usa o cálculo existente do servidor, sem conferir somente quantidade de fichas ou o funcionamento declarado no questionário.
- Zero computadores comunicando classifica offline, inclusive escola sem agente/computador cadastrado. É ausência de evidência de comunicação dos agentes, não diagnóstico de queda da internet ou energia da unidade. Nenhum incidente/demanda/notificação é criado por esta classificação.
- Mantido prazo do monitoramento: `3 × intervalo de heartbeat + 120 s`, atualmente 17 minutos; suspensão/desligamento informado não contam como comunicação ativa. A escola só passa a offline quando o último computador deixa de satisfazer esse critério.
- O indicador reaproveita a consulta do pulso `/api/operations/units`, a cada 60 segundos com aba visível e ao retornar à aba. Sem endpoint, cron, consulta periódica adicional ou migração. Uma falha de demandas/coletas não invalida a comunicação consultada com sucesso. Falha da consulta de presença apresenta traço e indisponibilidade, nunca zero/offline fictício.
- Marcadores comuns e selecionados roxos `#7523C9`, borda branca e tamanho maior ao selecionar. Alertas D-081 continuam vermelhos/âmbar com círculo e modal somente por clique. Geometria, centro, zoom e camadas preservados.

## Aceite e limites

`tests/school-presence.test.mjs`: escolas únicas, tipos, situação/filtro, ausência de agente, resposta inválida/incompleta e duplicidade. `tests/school-presence-browser.cjs`: Worker real + SQLite isolado, contagem por escola com várias máquinas, perda do primeiro/último agente, retorno, desligamento informado, atualização automática, uma única consulta compartilhada, filtros, erro/recuperação, visualizador, 390 px e cores. Sem escrita de exemplos no banco oficial.

Evidências em `docs/05-qualidade/evidencias/escolas-online-2026-11-10/`: `panorama-roxo-escolas-online.png`, `falha-consulta.png`, `panorama-390.png`. São capturas de implementação com dados sintéticos isolados, não fotografias de teste de produção.

Ainda pendente: onde e como exibir escolas offline. A escolha anterior LOG-08 (fichas vs quantidade física) NÃO foi decidida nem alterada por este pedido; tampouco os demais pontos D-082/Fases 4–5. Sem novas perguntas ou cobertura de coleta da Base original; coletor, Drive, EXE e vínculos preservados.

Regressões aprovadas: 181 testes na suíte completa; navegação do novo indicador, alertas/parecer no mapa, pulso/Menu/Login, atualização por blocos e identidade em 17 rotas. Build desktop com 78 arquivos. Capturas desktop/390 px abertas visualmente: indicador no local pedido, roxo sobre a cartografia real e composição preservada.

## Publicação

Publicado em 10/11/2026, 14:03:34 (America/Fortaleza), commit de implementação `08dbf4a`, versão do painel `11b90747-7d5a-4585-b2a5-fbe0c3af5f17` em 100% do tráfego. Endereço: https://painel-semed-paco.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev/panorama

Seis verificações HTTP pós-publicação aprovadas (login 200, páginas/módulos protegidos 302 e API de presença 401 sem sessão); versão ativa conferida na Cloudflare. Coletor preservado em `274ecd9b-002e-4f79-a4b9-325fc26fece1`, 100%. Crons existentes preservados. Navegação visual autenticada desta entrega testada no ambiente isolado, sem afirmar homologação visual autenticada da produção. Registros em `private-data/release-escolas-online-2026-11-10/`, fora do Git.

Rollback de código: versão anterior do painel `07f8adf1-d733-459d-9826-5ad690b6c21d`; não requer migração ou reversão de banco.
