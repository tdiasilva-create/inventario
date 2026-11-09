# Edição de nomes de computadores e impressoras — D-077

Pedido explícito do responsável: editar nomes pelo painel sem perder fotos/vínculos de agente/unidade e publicar no ambiente real. Esta entrega não modifica perguntas, nome de rede do Windows, protocolo do agente ou localização. Fases 4/5 continuam pausadas.

## Fontes e requisitos

Consultados `00_LEIA_ANTES_DE_TUDO.md`, `AGENTS.md`, precedência, decisões D-046/D-057/D-065–D-077, pendências e conflitos; manifesto e cinco PNGs desktop abertos em ordem; especificação de interface/setores, telas, indicadores e consulta de equipamentos; modelo conceitual, fluxo de integração, relacionamentos DOT e Base original §§7–9/11/12; ACEITE, D-074/D-076 e manual de publicação. Imagens históricas orientam composição; identidade atual branca/preta/vermelha/laranja segue D-065. Não há novo mockup ou mudança de composição.

Requisitos cobertos da Base: ID permanente, correções comuns com histórico, integridade de fotografias, versões/conflito e distinção de rascunho/publicação. Autorização mais recente permite a correção administrativa pelo painel. Dados fictícios exclusivamente nos testes SQLite em memória, nunca no D1 oficial.

## Uso

- Root: **Equipamentos → unidade → Ver ficha → Editar nome → Salvar nome**. Mesma ficha disponível pelo Panorama e detalhe da unidade.
- Root: **Computadores → unidade → computador → Editar nome**; nome, hostname e unidade aparecem no tooltip.
- Root: **Coletas em andamento → Ver dados parciais → equipamento → Editar nome**, inclusive impressoras ainda não publicadas.
- Admin e visualizador continuam consultando; operador permanece na coleta. Não houve concessão implícita de nova escrita a esses perfis.
- O nome é uma identificação de exibição, separada do hostname reportado pelo agente, da marca/modelo e da posição física. Alterar o nome não renomeia o Windows nem transfere um equipamento. Não é necessário reinstalar ou ler outro QR.
- Sem nome personalizado, mantém-se o título anterior. Para definir/corrigir, usar 1–180 caracteres. Nomes podem repetir; quem identifica o bem é o ID permanente. Não há união de cadastros.
- Histórico mostra até 20 alterações recentes, antes/depois, autor e data. Todas as alterações permanecem no banco.

## Implementação e arquivos

- Migração aditiva `0022_equipment_names.sql`: `equipment_names` por ID/unidade, versão própria; `equipment_name_events` com recibo/autor/data/antes/depois. Sem preencher nomes, apagar ou reescrever cadastros reais. FK em equipments permite limpeza somente quando houver uma exclusão autorizada do equipamento; histórico não é apagado junto.
- `server/equipment-names.mjs`, registrado em `worker.mjs`: GET/POST `/api/root/equipment-name`; root no Worker painel, sessão e CSRF existentes, ID/unidade/categoria verificados. POST aceita exclusivamente id, unitId, name, version e operationId.
- GET retorna nome/version atual e histórico; POST é atômico por versão e recibo. Conflito 409 preserva tentativa no registro de conflitos e retorna estado atual. Reenvio da mesma operação já confirmada não duplica histórico nem desfaz uma alteração posterior. A interface mantém o texto e exige carregar explicitamente a versão atual.
- A versão administrativa não modifica versão/locks de coleta, respostas, snapshots, autoria original, verificação, estado de cartão/visita, localização, agente, IDs/fotos/miniaturas/Drive. Assim o coletor antigo e novo continuam gravando sem apagar o nome administrativo. Rascunho permanece PARCIAL.
- `inventory-equipment.mjs`, `in-progress.mjs`, `service-desk.mjs`, `photo-labels.mjs` devolvem o nome atual pelo mesmo ID. Busca oficial/operacional inclui o nome. Legendas contextuais de fotos passam a mostrá-lo. A localização oficial continua a publicada.
- `unit-deletion.mjs`: alteração de nome invalida prévia antiga da exclusão. Nenhuma exclusão real foi realizada.
- `web/equipment-name-editor.js`: formulário compacto reutilizado por `desktop-equipment.js`, `operations.js` e `desktop-progress.js`/`desktop-inventory.js`; GET fresco antes de abrir, Cancelar sem escrita, limite de tempo de rede e UUID mantido durante repetição na mesma janela. Não é offline durável.
- Exportação de equipamentos acrescenta duas colunas finais: Nome definido no painel e Hostname do agente. Mantidas as colunas e JSON publicado anteriores.
- Novas demandas registram o nome no contexto do atendimento. Demandas/histórico anteriores conservam o texto original; não reescrever eventos antigos.
- Build desktop inclui o novo editor. Coletor não precisa de nova versão para continuar gravando: tabela de nomes separada e migração compatível. Não alterar os segredos ou crons.

## Aceite local executado

- **162 testes aprovados**, seis novos testes de domínio: computador/impressora com fotos e agente, ACL/session/CSRF/unidade/categoria, nomes inválidos, conflito entre duas sessões e durante o batch, idempotência/resposta perdida, novo hostname sem sobrescrever nome, rascunho sem promoção oficial, prévia de exclusão inválida e auditoria preservada após exclusão isolada.
- Browser com Worker real/SQLite em memória: cancelar, salvar/recarregar/buscar, foto real servida pelo proxy de teste e decodificada, histórico/conflito, resposta deliberadamente perdida **depois do commit**, reenvio, grid de computadores/tooltip, impressora parcial e visualizador sem botão de edição.
- Regressões de navegador da consulta (1366/1440/1920 px) e operações aprovadas. Não foi instalado agente nem usado RustDesk.
- Capturas reais da implementação com dados TESTE ISOLADO: `evidencias/editar-equipamentos-2026-11-09/01-editar-computador.png`, `02-computador-fotos-vinculo.png`, `03-conflito.png`, `04-impressora-com-foto.png`, `05-computadores-por-unidade.png`, `06-coleta-em-andamento.png`. Capturas abertas visualmente; composição e identidade preservadas.

## Publicação

Publicação executada em **09/11/2026, 12:22 (Fortaleza)**, commit **335ba4b**.

- Painel ativo em **100%**: **9f591a5f-201c-4c45-bffb-dd58d2d25a81**. Cron de minuto e diário preservados.
- Coletor permanece na versão **18ee2dd6-7f07-48b0-bbc9-2a2bdf763024**, confirmada antes/depois, sem novo deploy. Sua coleta e o protocolo do agente continuam compatíveis.
- Migração **0022_equipment_names.sql** aplicada ao D1 compartilhado após exportação privada de segurança (1.383.451 bytes, hash conferido). Nenhuma migração adicional pendente entrou no lote.
- Contagens antes/depois idênticas: 76 unidades, 5 ambientes, 6 equipamentos, 8 fotos e 13 usuários. Tabelas novas vazias após publicação: nenhum nome de exemplo gravado em produção. Nenhum arquivo real do Drive foi reenviado ou removido.
- Dez verificações HTTP públicas aprovadas: login, páginas protegidas, CSS, APIs recusando acesso sem sessão, e disponibilidade do coletor. Versões ativas conferidas por CLI. A edição autenticada foi exercitada no Worker com SQLite isolado; não foi realizada uma alteração de teste nos dados reais.
- Builds dos dois pacotes e dry-runs dos dois Workers aprovados, schema com integridade/FKs corretos, links documentais e índice Git (535 arquivos) conferidos. Coletor foi somente empacotado para verificar compatibilidade.
- Logs, backup e manifesto privados em private-data/release-editar-equipamentos-2026-11-09/, fora do Git.

Endereços completos:

https://painel-semed-paco.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev/equipamentos

https://painel-semed-paco.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev/computadores

https://painel-semed-paco.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev/coletas-em-andamento

Se houver necessidade de retorno do código: painel anterior ef797235-6c1a-40bd-8d0d-f64f86799116, mantendo a migração aditiva. Não restaurar banco antigo sobre coletas posteriores. Nenhum rollback foi executado.
