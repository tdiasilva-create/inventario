# Aceite D-070 — notificações e presença automática, 08/11/2026

## Escopo autorizado e fontes

Pedido do responsável: implementar alertas de troca de peças e perda de comunicação, com atualização automática, e publicar no ambiente real. Fontes: `00_LEIA_ANTES_DE_TUDO.md`, `AGENTS.md`, `REGRAS_DE_PRECEDENCIA.md`, `DECISOES.md`, `PENDENCIAS.md`, `CONFLITOS_DOCUMENTAIS.md`, `CONTRATO_QR_E_AGENTE.md`, `DIGEST_AGENTE_0_1_6.md`, aceite de D-069 e contrato implementado em `server/agentes/`.

Preservados D-031/D-046 (perfis e acesso), D-045 (parcial separado de publicado), D-054/D-058 (produção e protocolo), D-065–D-069 (identidade, composição e consulta). Base de Coleta original não alterada: esta entrega acrescenta monitoramento técnico posterior ao questionário; não cobre novas perguntas, offline ou nova homologação da câmera/instalador.

## Arquivos

Novos: `server/agent-monitoring.mjs`, `server/agentes/presence.mjs`, `migrations/0017_agent_monitoring.sql`, `web/desktop-notifications.js`, `web/desktop-notifications.css`, `tests/agent-monitoring.test.mjs`, `tests/agent-monitoring-browser.cjs`.

Integrações: Worker/cron, presença da API existente, consulta de equipamentos, shell/bell e links do Panorama, build desktop, suíte de testes, governança e contrato. Sem novo provedor de fotos, segredo, biblioteca ou executável.

## Evidências locais

Oito testes novos: referência inicial e retorno de peça; qualidade/ordem/deduplicação; prazo/retorno/suspensão/revogação; rollback e retomada; concorrência e heartbeat durante a gravação; componentes/USB/driver; volume com 200 computadores; autenticação, CSRF, perfis, paginação e estados atuais.

Navegador Chrome com Worker e SQLite isolados: notificação de perda, leitura, recuperação, mudança de hardware antes/depois, atualização da ficha, preservação do filtro/cursor e detalhes abertos, erro/repetição, sino nas telas administrativas e link à ficha. Teste de consulta D-069 aprovado nas larguras 1366, 1440 e 1920. Dados fictícios usados somente em memória nos testes.

Screenshots em `evidencias/monitoramento-2026-11-08/`: `perda-comunicacao.png`, `comunicacao-retomada.png`, `mudanca-hardware.png`, `falha-atualizacao.png`. Conferência visual: identidade branca/vermelha/laranja preservada, números de memória legíveis em GiB, diálogo com teclado/fechamento e comparação antes/depois. Composição do Panorama e mapa preservados.

## Publicação

Publicado: painel versão `6e92bf0e-a31a-4bf6-9a13-dfdccf010725`, 100% do tráfego. Migração 0017 aplicada no D1 real, cron de minuto e cron diário registrados. Coletor permaneceu na versão anterior, pois a análise lê a persistência compartilhada. Backup privado em `private-data/publicacao-d070-2026-11-08/`, 987149 bytes, SHA256 `2fbdb31f6efc1b5f74732142a90b7bc9ed633a5ee30d3398c90a1cea4a891d59`. Restauração em SQLite, migração 0017, integridade e chaves estrangeiras verificadas. Antes: 76 unidades, 8 usuários, 7 visitas, 1 equipamento, 3 fotos, 5 vínculos históricos. Versão anterior do painel `e81e7d9d-4263-468a-9316-ce4f4ec0c2c8`; coletor `859d0016-755f-4104-94ed-94e4780e2f8e`.

Pós-publicação: 46 verificações de acesso do roteiro do painel + 10 verificações das rotas/assets específicos, todas aprovadas. Comparação integral de units, inspections, equipments, miscellaneous_equipments, collection_photos e agent_equipment_links com o backup: preservadas. Bindings e nomes/tipos de segredos preservados; sem carga fictícia em produção. Sessão root conferida: sino abre as notificações. Primeira execução do cron em conferência.

Suíte completa: 123 testes aprovados. Oito cenários novos + roteiros de navegador de monitoramento, consulta D-069 e identidade em 17 rotas aprovados.

## Limites e roteiro físico

A suíte simula telemetria assinada/persistida; não realiza troca física em computador de escola. Para aceite operacional: manter um PC vinculado ligado e conectado; conferir estado no painel; interromper somente a rede por mais de 17 minutos; verificar alerta e último contato; reconectar e conferir resolução; em manutenção autorizada, alterar uma peça e aguardar o próximo inventário do agente. Não cortar energia nem retirar peça para testes durante uso. Suspensão informada deve aparecer como suspensão, sem gerar alerta de falha de comunicação.

Troca entre componentes indistinguíveis e leituras insuficientes não podem ser detectadas com certeza. Agente precisa enviar novo inventário; não há comando de coleta remota imediata nesta entrega. Cobertura e operação em `docs/04-dados-apis/MONITORAMENTO_E_NOTIFICACOES.md`.
