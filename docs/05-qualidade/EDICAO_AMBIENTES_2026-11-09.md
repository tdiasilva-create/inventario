# Correção do nome de ambientes — D-076

Pedido: corrigir legendas/nomes de itens, especificamente ambiente cadastrado com nome errado. Esta entrega trata o nome do ambiente existente; não adiciona editor livre de legendas de fotos, não unifica ambientes e não muda perguntas do questionário. Fases 4/5 permanecem pausadas.

## Fontes consultadas e regras

`00_LEIA_ANTES_DE_TUDO.md`, `AGENTS.md`, `REGRAS_DE_PRECEDENCIA.md`, `DECISOES.md`, `PENDENCIAS.md`, `CONFLITOS_DOCUMENTAIS.md`; Base original integral (1.085 linhas), `06_ESPECIFICACAO_TELA_A_TELA.md`, `02_TELAS_E_TRANSICOES.md`, `03_CATALOGO_E_MAPEAMENTO.md`, `04_FOTOS_E_ESTADOS.md`, `05_GUIA_VISUAL_MOBILE.md`; especificação/interface/telas desktop e Central de demandas; modelo conceitual/fluxo de integração, diagrama DOT de relacionamentos; ACEITE e relatório/testes D-074. Aberta a referência mobile e as cinco referências desktop, na ordem do manifesto. Identidade atual D-061/D-062/D-065 prevalece sobre a paleta histórica.

Base §§1.1, 4.B, 4.F.1, 7.3–7.4 e 9: ambiente com identidade estável, edição de informações usuais, histórico, concorrência, vínculos e autores preservados. D-046 mantém colaboração; D-074 mantém seleção por ID. Não altera confirmação manual de assunto/visita, fotos, agentes ou classificação de laboratório.

## Uso e implementação

- Coletor atual: unidade → Ambientes → **Editar nome** → Salvar nome. Reabrir o assunto concluído exige confirmação já existente. Visita concluída exige uma nova visita para nova alteração; reenvio de uma operação já confirmada apenas consulta seu recibo.
- Painel root: **Ambientes** → escolher unidade → **Editar nome**. O root vê também ambientes de coletas abertas nesse cadastro, identificados como cadastro atual. A correção administrativa não abre nem conclui visita. Demais perfis desktop continuam consultando; operador edita pela coleta autorizada.
- Limite do nome: 1–180 caracteres; espaços normalizados. Nome equivalente ao de outro ambiente da mesma unidade é recusado, inclusive legado sem chave normalizada. Não excluir/criar ambiente para renomeá-lo.
- Migração aditiva `0021_environment_names.sql`: versão do nome em `environments`, histórico/recibo em `environment_name_events`. Sem backfill de nomes e sem remoções. Histórico preservado mesmo em futura exclusão root autorizada da unidade. A prévia de exclusão considera alterações do nome.
- `POST /api/collector/environment-rename`: inspectionId, id, version, name, operationId. Perfil de coleta, unidade no escopo, visita aberta e assunto B não concluído; permissões revalidadas no servidor. `POST /api/root/environment-rename`: unitId, id, version, name, operationId; root no painel. GET root/environments lista o catálogo atual com versão.
- Transação: atualização por versão, recibo e histórico antes/depois com autor/data. Na coleta incrementa revisão e mantém assunto em andamento. Conflito preserva tentativa e versão do servidor. Repetir a mesma operação após resposta perdida não repete histórico nem desfaz correção posterior.
- Formulário compartilhado compacto em `environment-editor.js`: Cancelar/Salvar nome; texto preservado em falha; conflito mostra nome atual e exige escolha explícita de carregá-lo. Reenvio mantém UUID; abrir/cancelar não grava.
- Leituras de lista/ficha, ambiente e fotografia exibem o nome corrigido pelo mesmo ID. A consulta oficial continua usando o **ID de ambiente publicado**, nunca uma movimentação parcial. JSONs de equipamentos, snapshots de visitas e históricos originais não são reescritos. Contexto histórico de demandas conserva seu texto original.
- Vínculos de agente, fotos/objetos Drive/miniaturas, IDs, posições, versões técnicas e autoria original não são modificados. Renomear não é transferir computador ou declarar uma visita concluída.

## Aceite executado localmente

- Suíte: **156 testes aprovados**, incluindo seis novos testes de correção. Casos de perfis/sessão/CSRF, nomes inválidos, colisão normalizada, unidade estrangeira, reabertura, conflito/ABA, resposta perdida, atualização idempotente, conclusão concorrente, snapshots, fotos e vínculo de agente preservados.
- Teste de navegador com Worker real e SQLite isolado: root + operador; formulário mobile 390×844 e altura reduzida 360×400; desktop 1440×950. Cancelar, conflito com outro usuário, manutenção do texto e falha após gravação/repetição confirmada. Nenhum dado de teste gravado no D1 oficial.
- Capturas em `evidencias/editar-ambientes-2026-11-09/`: `01-correcao-mobile.png`, `02-altura-reduzida.png`, `03-conflito-preservado.png`, `04-painel-corrigido.png`. Capturas abertas visualmente: identidade e ações compactas preservadas. Redução de viewport não equivale a homologação de teclado físico Android/iPhone.
- Builds: painel 84 arquivos; coletor 54. Não é necessária atualização do instalador.

## Limites

Somente o nome do ambiente foi acrescentado como edição. Outros rótulos seguem os formulários atuais. Não implementa fusão/exclusão de ambientes, editor de legendas fotográficas, offline durável nem as Fases 4/5. Abas já abertas recebem a interface ao serem recarregadas após salvar o trabalho; catálogo do coletor pode ser atualizado pelo botão existente.

## Publicação

Registro de execução será acrescentado após conferência das versões reais. Migração deve preceder os dois Workers, pois compartilham D1. Retorno de código pode manter a migração aditiva; não restaurar o banco sobre coletas posteriores.
