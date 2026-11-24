# D130 — Criar rota pelo mapa ampliado

24/11/2026. **Implementação local; publicação ainda depende da aprovação específica.**

## Fonte e escopo aprovado

O responsável pediu Panorama → ampliar mapa → Criar rota → clicar nas unidades → descrever a atividade em cada uma → selecionar técnico. Confirmou uso **somente root**, entrada **antes das pendências, preservando o atendimento iniciado**, e escolheu **proposta 1: painel lateral** entre as três imagens entregues.

As referências desktop originais foram abertas na ordem do manifesto. Composição/identidade atuais D080/D065 e a proposta lateral prevalecem sobre cores históricas. Foram consultados entrada, precedência, decisões, pendências, conflitos, rastreabilidade, modelo conceitual, diagramas e contratos/aceites D105, D106, D114, D122, D126, D128 e D129. Nenhuma decisão pendente da auditoria é resolvida por esta funcionalidade.

## Fluxo

1. Root amplia o mapa do Panorama e aciona **Criar rota**. O mesmo mapa e a busca permanecem disponíveis, com o formulário à direita.
2. Cliques nos marcadores selecionam unidades por ID. Clicar novamente não duplica nem remove a atividade preenchida. A seleção também funciona no teclado e no seletor de unidades sobrepostas.
3. Números indicam a sequência. Ajuste por arraste ou setas; remover uma parada com descrição exige confirmação. A cor da categoria e os alertas existentes continuam visíveis.
4. Preencher **O que fazer nesta unidade?** em cada cartão. Tipo inicial **Visita técnica**, ajustável no detalhe Tipo. Descrição de 1–2000 caracteres após retirar espaços das extremidades.
5. **Ver trajeto entre unidades** consulta ruas somente por ação explícita. Prévia entre unidades, sem inventar posição do técnico; não inclui suas demandas antigas. Usa OSRM/FOSSGIS já autorizado, envia apenas coordenadas e compartilha o limitador do acompanhamento. Falha não gera linha reta substituta e não bloqueia a criação.
6. Escolher um técnico ativo/habilitado. A interface informa o atendimento preservado, quando existir, e a precedência sobre as pendências.
7. **Criar rota e atribuir** cria uma demanda por unidade, atribuições, histórico, avisos e ordem em uma transação. Confirma no mapa; não abre formulários de demanda automaticamente.

Em telas estreitas, formulário fica abaixo do mapa; o fluxo é exclusivo do painel root. Não adiciona administração ao aplicativo.

## Ordem e histórico

- Mesma fila global D105, sem otimizador geográfico: a ordem final dos cartões é a ordem de visita.
- Na primeira posição ocupada pelo técnico na fila, inserir atendimento iniciado (se houver), seguido do novo bloco; as pendências anteriores vêm depois. Se ele não tiver atribuições, inserir no final global.
- Aceite operacional vem de `dispatch_service_activity` (D126), não da validade do cookie nem da idade do GPS. Um aceite anterior fora de ordem é preservado à frente do bloco. Outras pendências mantêm sua ordem relativa.
- Se o atendimento preservado for compartilhado com outro técnico, continua sendo a mesma demanda/atribuição; a fila global é comum. Avisos de sequência incluem os envolvidos nesse deslocamento. Não encerrar atendimento, trocar responsáveis nem apagar posições.
- Nova demanda geral usa `purpose: map_route`, `route_id` e `route_stop` no contexto histórico. Não substitui nem deduplica automaticamente outras necessidades D128/D129 da unidade.
- Máximo de 99 demandas abertas por técnico após adicionar o bloco, compatível com o limite D106 do cálculo de ruas. Não truncar destinos silenciosamente.
- As tarefas aparecem no APK atual pelos mesmos endpoints/avisos. Atribuição não inicia GPS. Após aceite, o acompanhamento já existente parte da posição do técnico e respeita a fila; D114 permanece intacto.

## API e consistência

| Método / endpoint | Finalidade |
| --- | --- |
| GET `/api/dispatch/map-route-options?technicianId=UUID` | Técnicos, revisão da fila e aceite/quantidade do selecionado. Parâmetro opcional. |
| POST `/api/dispatch/map-route-preview` | `stops: [{unitId}]`, ao menos duas unidades válidas. Prévia por ruas na ordem enviada. |
| POST `/api/dispatch/map-route-create` | `operationId`, `revision`, `technicianId`, `stops: [{unitId,description,kind}]`. |

Servidor exige sessão atual, root, CSRF nos POSTs e origem do painel. Não existe permissão nova para admin/operador/visualizador. Unidades precisam estar ativas, com coordenadas válidas, dentro do escopo atual; conveniadas recusadas. Obras podem receber atendimento geral, sem liberar coleta.

Recibo por operação+autor+hash normalizado, comparação da revisão e nonce de tentativa. Todos os efeitos são condicionados ao mesmo nonce e ao sucesso da transação. Técnico, root e cadastro/posição de cada unidade são revalidados na escrita. Concorrência devolve 409; descrição/seleção ficam preservadas para atualização explícita da fila. Perda do ACK conserva o mesmo payload e bloqueia edição/cancelamento até conferir o envio pelo botão, evitando nova operação duplicada. Replay de demanda posteriormente excluída não a recria.

Tamanho de corpo ampliado somente para o POST de criação: 1 MiB, necessário para 99 descrições UTF-8. Demais endpoints mantêm limites anteriores. Eventos de ficha guardam apenas o próprio conteúdo, sem repetir todo o lote em cada demanda.

## Consumo e arquivos

- Seleção, descrição, arraste e busca existentes: nenhum SQL/HTTP adicional por interação.
- Opções: leitura explícita ao abrir, trocar técnico ou atualizar; atribuições filtradas pelo índice do usuário. Sem polling novo.
- Criação: uma leitura consistente da fila global e um lote fixo de 11 comandos de escrita; linhas/escritas crescem conforme demandas, histórico e triggers. Não é operação sem custo, nem garantia de capacidade ilimitada do gratuito.
- Prévia explícita compartilha o gate durável OSRM e respeita timeout, limite de resposta, redirecionamento recusado e validação da geometria. Não altera GPS/cache dos roteiros operacionais.
- Sem migração; permanecem 37 migrações. Sem APK, coletor, agente Windows, credenciais, plano ou serviço novo.

Implementação: `server/map-route-planner.mjs`, integração em `technical-dispatch.mjs` e limite de corpo em `worker.mjs`; prévia em `dispatch-road-routing.mjs`; `web/map-route-planner.js`, `desktop-map.js`, `desktop.js`, `painel.css`; build e testes. [Evidências e estado](../05-qualidade/CRIAR_ROTA_D130_2026-11-24.md).
