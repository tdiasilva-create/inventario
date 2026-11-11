# D-097 — IP público, provedor e último contato

## Escopo e leitura

Pedido direto de implementação/publicação em 11/11/2026, sem reinstalar os agentes. Fontes consultadas: 00_LEIA_ANTES_DE_TUDO.md, AGENTS.md, REGRAS_DE_PRECEDENCIA.md, DECISOES.md, PENDENCIAS.md, CONFLITOS_DOCUMENTAIS.md, MANIFESTO_REFERENCIAS.md, cinco PNGs desktop na ordem do manifesto, CONSULTA_EQUIPAMENTOS.md, MESA_DE_DADOS.md, MODELO_CONCEITUAL.md, 02_FLUXO_DE_INTEGRACAO.md, CONTRATO_QR_E_AGENTE.md, DIGEST_AGENTE_0_1_6.md, MONITORAMENTO_E_NOTIFICACOES.md, diagramas/fontes DOT e regras aplicáveis da Base original. Consultado o aceite CONSULTA_EQUIPAMENTOS_2026-11-08.md e testes de presença/assinatura/consulta.

Implementação em server/agentes/connection.mjs e núcleo do Worker; apresentação compartilhada em web/agent-connection.js, desktop-equipment.js, desktop.js, operations.js e painel.css; inclusão do módulo no build. Sem migração ou mudança de instalador, perguntas, campos de coleta manual, fotos/Drive, cron, permissões ou dados cadastrais. Identidade D-080 mantida. [Contrato detalhado](../04-dados-apis/CONEXAO_AGENTES_D097.md).

## Aceite executado localmente

- `node --test --test-concurrency=1 tests/agentes.test.mjs tests/agent-monitoring.test.mjs tests/equipment-consultation.test.mjs tests/agent-connection.test.mjs tests/agentes-open-enrollment.test.mjs`: 31 testes aprovados, incluindo seis novos. Heartbeat assinado no protocolo existente, IP público separado do interno, IPv4/IPv6, provedor ausente, ausência de metadados confiáveis, repetição, sequência antiga, mensagem atrasada, assinatura inválida, vínculo encerrado, revogação, permissões, ausência de alertas indevidos e ACK preservado.
- `node tests/agent-connection-browser.cjs`: aprovado usando Worker real e SQLite isolado. Ficha Computadores, Equipamentos e Dados do agente; quatro screenshots; atualização automática de 15 s; pausa ao fechar; recuperação após erro mantendo dado anterior; manual/legado sem valores fictícios; HTML malicioso no provedor escapado; IP interno independente; nenhum POST pela navegação; sem overflow horizontal em 390 px. Integrado à CI.
- `node tests/equipment-consultation-browser.cjs`: aprovado, 58 fichas/65 itens físicos sintéticos, paginação, fotos isoladas, manual/agente, reutilização das rotas e recuperação de erro; larguras 1366/1440/1920.
- `node tests/operations-browser.cjs`: aprovado, navegação, tooltip, laboratório, demanda por equipamento, histórico, unidade sem computadores, atualização automática e responsividade.
- `node tests/panel-async-browser.cjs`: aprovado, preservação da leitura ao ocultar a aba, erros/timeout explícitos, sete indicadores visíveis, modal imediato, cancelamento e nova tentativa; zero escrita e erros JavaScript.

Evidências locais privadas em docs/05-qualidade/evidencias/conexao-agentes-2026-11-11/: resultado.json, 01-computador-conexao-desktop.png, 02-computador-conexao-390.png, 03-ficha-equipamento.png, 04-dados-agente.png. São capturas com dados sintéticos isolados, não registros de produção; protegidas pelo .gitignore. Capturas desktop e celular inspecionadas visualmente.

Requisitos da Base TXT: preservadas separação entre telemetria e ficha oficial, ID permanente, vínculo de unidade/ambiente, histórico, autenticação/permissões, estados de coleta e fotografias. Nenhuma pergunta ou pendência original foi reinterpretada; offline durável, equipamento físico e novos campos não fazem parte deste lote. A nova observação é decisão posterior D-097; a Base original permanece intacta.

## Publicação e verificação externa

Builds aprovados: painel com 87 entradas, coletor com 55. Dois dry-runs Wrangler aprovados, links documentais e git diff --check sem erros. Scanner do índice Git aprovado com 638 arquivos. Ambos os Workers receberam o backend, pois o agente envia ao coletor e o painel consulta a persistência compartilhada. Não houve gravação de teste em produção, reconfiguração de agente, criação de unidade ou alteração de senha.

Publicado em 11/11/2026, commit 5a8afa5, ambos com 100% do tráfego confirmado por Wrangler:

- Coletor: 2dac8571-2671-4eec-8ab0-7492753a0255, às 17:29:50 Fortaleza (20:29:50 UTC). Backend atualizado, nenhum asset de questionário alterado.
- Painel: e59b7120-4036-4ba0-b850-a400c39df18e, às 17:30:15 Fortaleza (20:30:15 UTC). Cinco assets atualizados e backend compartilhado; cron e bindings preservados.

Pós-publicação: 64 verificações HTTP aprovadas (50 no roteiro de release do painel, três de proteção da nova ficha/módulo/API e 11 no coletor). Leituras sem credenciais não expõem conexão ou ficha; aplicação e login continuam disponíveis. Evidências locais: collector-publicado.json, panel-conexao-protegida.json e evidencias/auth/release.json.

**Recebimento real confirmado:** consulta agregada somente leitura ao D1 identificou seis registros de agentes com IP público e provedor preenchidos por comunicações reais após o deploy, última observação 20:31:03 UTC / 17:31:03 Fortaleza. Não foi enviado heartbeat sintético para produção nem reinstalado qualquer agente. A consulta registrou zero linhas escritas. Evidência privada recebimento-real-agregado.json contém somente contagens e horário, sem IPs de usuários. O número é fotografia dessa consulta, não indicador fixo do sistema.

A visualização autenticada foi testada com o Worker e banco isolados; não foi reutilizada uma senha de produção nem declarada uma sessão de navegador autenticada que não estivesse disponível. Aceite visual final permanece com o responsável. Máquinas sem nova comunicação conservam ausência de informação explícita; não é necessário reinstalar para preencher os campos.

Versões anteriores para rollback: painel 831c0af8-7505-4a80-9521-d06da8e8ba44 e coletor 0efcee24-7180-4c82-89a2-4a32458859e0. O campo aditivo em JSON é tolerado pela versão anterior; não exige apagar dados nem reverter schema.
