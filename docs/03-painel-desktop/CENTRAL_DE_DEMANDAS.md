# Central de demandas e computadores por unidade — D-071

Pedido aprovado em 08/11/2026: implementar a central de demandas, computadores por unidade e laboratório, unidades sem computadores, hostname ao passar o mouse e publicar em produção. Esta entrega é desktop; não altera perguntas, câmera, QR ou instalador.

## Uso

- Menu Consulta → Computadores (`/computadores`). Todas as unidades no escopo D-068, inclusive inativas identificadas e unidades sem inventário. Busca por nome e filtros de presença de computadores.
- Selecionar unidade apresenta computadores por ambiente. Cada ícone mostra posição, hostname recebido, comunicação, indicação PARCIAL e quantidade de demandas abertas. Hover/foco mostram unidade, hostname, ambiente, posição e situação; toque/clique abre os mesmos dados e permite registrar demanda.
- Root/admin: **Organizar ambientes** identifica explicitamente laboratórios nos ambientes já cadastrados. Não infere laboratório pelo nome. Vários laboratórios são permitidos. Não cria ambientes ou equipamentos automaticamente.
- **Confirmar: unidade sem computadores** só salva quando não há computadores cadastrados. Ausência de inventário não significa ausência de computadores. Se uma coleta posterior acrescenta equipamento, o registro real prevalece; não se esconde a máquina por uma declaração anterior.
- Menu Gestão → Central de demandas (`/demandas`). O número no menu informa demandas pendentes, atualizado a cada 15s. O sino existente continua responsável pelas notificações automáticas do agente.
- Registrar demanda: unidade obrigatória, equipamento opcional (computador, impressora ou outro bem), descrição, tipo, origem, solicitante opcional, responsável opcional e data opcional de visita.
- Situações: Aberta, Em atendimento, Aguardando material, Visita agendada e Concluída. Concluir exige relato do atendimento; reabrir é possível pela mesma edição. Histórico conserva autor, data, descrição, situação e demais campos de cada alteração.
- Impressora sem toner pode receber demanda própria; unidade sem computadores pode solicitar visita. Não criar equipamento fictício para poder abrir demanda.

## Semântica e permissões

Root/admin gerenciam demandas e classificação; visualizador consulta; operador permanece no coletor. Sessão, papel, origem e CSRF verificados no Worker. Unidade e equipamento são validados juntos; não se vincula um bem de outra unidade.

Comunicação é a presença técnica D-070: três intervalos de heartbeat + 120 segundos, atualmente 17min. Atualização visual a cada 15s com aba visível; suspensa durante formulários para preservar preenchimento. Dados com falha de atualização são marcados desatualizados. Suspensão, desligamento informado, falha, nunca comunicou e sem agente são distintos; ausência não prova desligamento nem uso por pessoa.

O monitoramento mostra cadastro atual, incluindo fichas parciais identificadas. Não altera totais publicados do Panorama. Demandas manuais não são cópias automáticas dos registros do questionário nem dos eventos do agente. Uma reconexão nunca conclui uma demanda de teclado, mouse ou toner.

O vínculo da demanda preserva o contexto no momento da abertura. Mesmo que root exclua uma unidade/equipamento ou que o bem mude de local, seu histórico de atendimento permanece. O contexto original não é silenciosamente trocado. Novas demandas exigem unidade ativa.

## Implementação e limites

`server/service-desk.mjs`, migração `0018_service_desk.sql`, `web/operations.html`, `.js`, `.css`, `web/desktop-demand-count.js`, integração em `server/worker.mjs`, `web/panel-shell.js`, `web/desktop.js` e build desktop. D1 compartilhado; sem novo serviço, segredo ou assinatura. Drive, cron e coletor preservados.

Listas de equipamentos paginadas em 60; demandas em 50; limites de página não são limites de cadastro. Resumo da rede lê somente presença compacta, nunca inventários técnicos completos. Não há cache de respostas particulares no navegador. Demanda usa UUID de operação, recibo persistido, transação e versão otimista para impedir duplicação em reenvio e sobrescrita concorrente. Formulário mantém a operação ao repetir o mesmo envio após falha de rede. Recibos sobrevivem no servidor; este recurso não constitui offline durável.

Classificação usa versão e auditoria; em alteração de vários ambientes cada confirmação é independente e a interface informa eventual resultado parcial. Responsável é texto operacional, não concessão de papel ou acesso. Sem e-mail, WhatsApp ou push nesta entrega. Alertas automáticos existentes continuam no sino. Não se declara homologação física de um laboratório real a partir dos testes sintéticos.

## Fontes e cobertura

Consultados: `00_LEIA_ANTES_DE_TUDO.md`, `AGENTS.md`, regras de precedência, decisões, pendências, conflitos documentais; especificação de interface, telas/interações, indicadores, setores e consulta de equipamentos desktop; modelo conceitual, fluxo/contratos de integração e monitoramento; cinco fontes DOT; trechos da Base original sobre permissões, histórico, fotos, rascunhos e publicação; ACEITE e testes existentes. Abertos os cinco PNGs desktop na ordem do manifesto. Paleta vigente D-065 prevalece sobre azul original.

Base original preservada. Requisitos atendidos nesta entrega: histórico permanente de bem/contexto, separação parcial/oficial, permissões no servidor, ausência de duplicação e apresentação dos dados recebidos. Não implementa novas perguntas, offline, novas regras de fotos ou homologação EXE/celulares. Aceite e publicação: [registro de qualidade](../05-qualidade/CENTRAL_DEMANDAS_2026-11-08.md).
## Atualização D-079 — identificar computadores vinculados e manuais

Em `/computadores`, etiqueta textual independente da comunicação em cada ícone e no detalhe: Agente vinculado, Cadastro manual, Aguardando vínculo, Vínculo encerrado, Cadastro não informado. Hostname e unidade continuam no hover/foco. O filtro **Vínculo / cadastro** combina com ambiente/laboratório e funciona antes da paginação no servidor. `GET /api/operations/computers` aceita `agent` e retorna `link_state`; rascunhos usam a informação atual e continuam PARCIAL. Polling de 15s e suspensão durante diálogos mantidos. Não apaga nem reúne cadastros. [Aceite](../05-qualidade/VINCULOS_AGENTES_2026-11-09.md).

## Alterações de hardware — D-081

O modal de monitoramento permite a root/admin encaminhar uma alteração à Central. Demanda de Manutenção, origem Painel, vinculada ao mesmo computador e unidade; guarda antes/depois, hostname e localização do evento. Reenvios não criam outra demanda. A revisão administrativa fica imutável, enquanto o atendimento usa os estados/histórico normais. URL `/demandas?demanda=<id>` abre o registro diretamente. Conclusão/reabertura controla o destaque âmbar no mapa; nunca apaga a alteração nem muda a referência do agente.

## Visão de rede e navegação — D-082

A faixa superior e os quatro contadores de estado abrem /computadores?estado=comunicando|sem-comunicacao|sem-agente|outros. Lista de toda a rede, 60 fichas por página, agrupada pelo ID da unidade; nomes iguais não fundem unidades. Mostra hostname/unidade no hover e na ficha. “Ver por unidade” e seleção lateral retornam à consulta anterior; links com a Central mantêm a unidade selecionada. Quinto cartão inclui estados que antes estavam fora da soma (suspensão/desligamento/nunca comunicou/revogado). Total continua número de fichas (LOG-08 pendente), não quantidade física de lotes.

Atualização existente de 15s, sem novo ciclo. Rascunhos continuam PARCIAL; absence de comunicação não significa desligamento. Envio de demanda inalterada retorna sem alterar versão/histórico; anotação não vazia continua gerando evento. Root/admin escrevem; visualizador consulta. [Aceite](../05-qualidade/TOUR_LOGICA_2026-11-10.md).

## Buscar unidade por nome — D-101

Na Central e em Registrar demanda, digite parte do nome em **Buscar unidade por nome** e selecione um resultado. Não exige acentos nem diferencia maiúsculas. No filtro, use **Filtrar** para consultar as demandas; **Registrar demanda** já aproveita a unidade escolhida. **Limpar** remove a seleção. Setas/Enter também selecionam; Escape fecha resultados antes de fechar o modal. Homônimas são distinguidas por tipo/início do ID.

Nome digitado sem escolher resultado não vale como unidade. Ao trocar a unidade de uma demanda nova, o equipamento anterior é desvinculado do formulário; a descrição permanece. Demanda existente conserva o contexto histórico. Pesquisa usa catálogo já carregado, sem nova chamada por tecla, e atualização não apaga a digitação. [Teste/publicação](../05-qualidade/DEMANDAS_BUSCA_UNIDADE_2026-11-11.md).

## Após salvar — D-102

Salvar cadastro ou edição fecha o formulário e mostra confirmação com o número da demanda na tela atual. O registro não reabre automaticamente. Para consultá-lo, clique em **Ver demanda** no aviso ou em **Atender / histórico** na listagem. Filtros permanecem iguais. Falha de gravação conserva o preenchimento para repetir o envio sem duplicação; falha apenas da atualização da lista não desfaz a confirmação do salvamento. [Teste/publicação](../05-qualidade/DEMANDA_SALVAR_SEM_REABRIR_2026-11-11.md).
