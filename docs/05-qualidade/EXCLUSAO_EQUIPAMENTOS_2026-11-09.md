# D-078 — apagar cadastros de equipamentos pelo root, 09/11/2026

## Origem e escopo

Responsável relatou duplicidade de dois cadastros e ausência da ação de apagar. Confirmou: **“No painel desktop, como root”**. Continuação da implantação administrativa/publicação real autorizada na sessão. Não há autorização para escolher qual dos dois equipamentos reais deve ser mantido; nenhuma exclusão real integra os testes ou a publicação.

Consultados: `00_LEIA_ANTES_DE_TUDO.md`, `AGENTS.md`, `REGRAS_DE_PRECEDENCIA.md`, `DECISOES.md`, `PENDENCIAS.md`, `CONFLITOS_DOCUMENTAIS.md`, Base original §§8–11 (especialmente 9.2, 9.5, 9.11), `MODELO_CONCEITUAL.md`, `02_FLUXO_DE_INTEGRACAO.md`, `CONTRATO_QR_E_AGENTE.md`, fontes DOT de relacionamentos/estados, especificações desktop, `CONSULTA_EQUIPAMENTOS.md`, relatórios de edição de ambientes/equipamentos e testes de qualidade existentes. Composição desktop e identidade D-065 preservadas. Imagens originais não fornecem dados oficiais.

## Uso e efeito

- **Equipamentos → unidade → Ver ficha → Apagar cadastro**. `Editar nome` permanece na mesma ficha.
- **Computadores → unidade → computador → Apagar cadastro**, inclusive registros parciais.
- **Planejamento / Coletas em andamento → dados parciais → Apagar cadastro** na linha do equipamento, incluindo impressoras/outros.
- A confirmação consulta uma prévia atual com ID, unidade, ambiente, quantidade de fotos e agente ativo. Exige motivo e confirmação explícita. Cancelar não grava.
- O ID escolhido sai do catálogo ativo, listas e contagens. A cópia integral da ficha, sua publicação anterior, autoria, verificações e pendências por não localização permanece em `equipment_deletions`. Histórico de coleta, de nomes, vínculos/localização, snapshots técnicos e demandas não é apagado.
- Fotos e miniaturas permanecem nos mesmos IDs e provedor. **Cadastros apagados**, na consulta da unidade, permite ao root consultar a ficha arquivada e suas fotos. Não é aba nova de fotografias. A listagem usa estado atual dos anexos para também exibir upload que tenha terminado após a retirada.
- Se houver agente ativo, o vínculo fica encerrado com motivo `equipment_deleted`; chaves e instalação não são revogadas. O servidor passa a aguardar pareamento, invalida o QR antigo e permite renovação de QR pela instalação existente. O operador deve gerar novo QR no agente e vincular à ficha correta. O efeito é explicitado antes de confirmar. A chave não é transferida automaticamente a outro equipamento.
- A exclusão não une cadastros, não transfere fotos/demandas para outro ID, não encerra demandas manuais e não faz baixa patrimonial. O item que deve permanecer é escolhido pelo root.
- Em visita aberta, o assunto correspondente volta a Em andamento e a revisão aumenta; visita concluída não vira rascunho nem é republicada. Não se declara uma unidade “sem computadores” por dedução.
- Demais perfis não recebem permissão de exclusão. O coletor não ganha botão administrativo. Fases 4/5 continuam pausadas.

## Implementação

- Migração aditiva `0023_equipment_deletions.sql`: arquivo durável de retiradas, índice por unidade, bloqueio de reinserção de IDs retirados e triggers de decremento dos totais de equipamentos/itens/problemas, publicação e andamento. Aplica-se às tabelas legada e de outros equipamentos. Não altera registros existentes na aplicação da migração.
- `server/equipment-deletions.mjs`: GET de prévia e POST `/api/root/equipment-delete`, GET paginado `/api/root/equipment-deleted`. Sessão/CSRF central, root e Worker painel obrigatórios. ID e unidade conferidos. Hash da prévia, guarda SQL dentro do batch, recibo de operação e evento de histórico. Atualizações concorrentes invalidam a prévia; nova consulta necessária. Reenvio de operação confirmada devolve o recibo sem repetir efeitos.
- A retirada do catálogo ativo acontece somente depois de arquivar a ficha, na mesma transação. Locks/verificações/casos de não localização que têm FK são retirados do conjunto ativo; os dados históricos estão no arquivo e na trilha de eventos. Nome administrativo fica na cópia e seus eventos permanecem.
- Repareamento reutiliza os endpoints assinados existentes. Estado do pedido é reaberto com novo prazo administrativo; QR anterior invalidado, tentativas/renovações reiniciadas. Histórico de vínculos e evento administrativo preservados. Não altera protocolo, assinatura, segredo, EXE ou cadastro automático.
- `server/collector.mjs` e tratamento de erro no Worker retornam 410 para tentativa de ressuscitar ID apagado; trigger também protege clientes/fluxos antigos. Remoção individual de foto arquivada é recusada. Exclusão integral de unidade pelo procedimento root continua distinta.
- `web/equipment-deletion.js` contém confirmação e consulta histórica; integrado nas três telas administrativas. Mesma identidade e foco acessível; timeout de 15 s, texto preservado e UUID mantido ao repetir na mesma janela. Não é fila offline durável.
- `server/photo-labels.mjs` identifica fotografias de cadastro apagado quando aparecem em contexto histórico. Não muda o objeto original.

## Aceite executado

**168 testes de domínio aprovados** (162 anteriores + seis novos), além de roteiros de navegador com Worker real e SQLite em memória. Suíte nova reexecutada após ajustes finais.

1. Impressora com foto/nome: retirada ativa, arquivo íntegro, demais equipamentos intactos, totais decrementados, ID bloqueado e recibo idempotente.
2. Root/CSRF/mesma unidade e confirmação obrigatórios; admin, visualizador e operador recusados; endpoint recusado no Worker coletor.
3. Prévia antiga e gravação concorrente dentro do batch: 409, nenhuma retirada parcial.
4. Cadastro parcial: assunto reaberto, revisão incrementada, contagens corrigidas e gravação de aba antiga retorna 410.
5. Lote de oito Outros: desconto correto de oito itens/uma ficha; demandas e eventos intactos.
6. Agente assinado em teste isolado: cadastro, claim, retirada, chaves/instalação idênticas, heartbeat recusado enquanto sem vínculo, renovação de QR, novo claim e heartbeat aceito. Vínculo anterior preservado.
7. Navegador: Cancelar; apagar impressora; simular resposta perdida após commit e repetir sem duplicar; foto arquivada realmente decodificada; aviso de agente; exclusão no grid; ficha parcial; visualizador sem ações. Regressão do editor de nomes também aprovada.

Screenshots reais da implementação em `evidencias/apagar-equipamentos-2026-11-09/`: `01-confirmacao-impressora.png`, `02-historico-foto-preservada.png`, `03-aviso-agente-vinculado.png`, `04-parcial-atualizada.png`, `resultado.json`. Dados são TESTE ISOLADO. Conferidos visualmente.

## Limites

Não houve teste destrutivo na produção nem teste físico de botão/retomada no EXE Windows. O protocolo foi exercitado com cliente de referência assinado; isso não substitui homologação física do agente instalado. Não há restauração/unificação automática no painel. Esta entrega cobre retirada administrativa e preservação da Base §§9.2/9.5/9.11; cancelamento pelo operador, baixa patrimonial e fases 4/5 permanecem fora do escopo.

## Publicação

Preparação local concluída. Registro dos recursos, backup e versões reais será preenchido após execução/verificação da publicação. Artefatos privados em `private-data/release-apagar-equipamentos-2026-11-09/`, fora do Git.
