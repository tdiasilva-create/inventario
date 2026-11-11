# Coletor — revisão e ações D-089

## Escopo aprovado

Corrigir CL-01–CL-16 do relatório externo respeitando as escolhas do responsável: busca limitada e explicada; Salvar compacto ao digitar. Manter identidade, questionário atual, vínculos, permissões e conclusão manual. Fontes: entrega-claude-coletor-p0-2026-11-10.zip e 01_RELATORIO_COLETOR.txt, decisões registradas em DECISOES.md. Os arquivos externos não autorizam mudanças adicionais de requisito.

## Fluxo de conclusão

1. Revisar visita consulta o servidor. A operação é somente leitura.
2. O bloco O que ainda falta identifica cada causa, seu assunto e, quando aplicável, o ID da ficha, ambiente/posição, campos incompletos, foto ou vínculo pendente.
3. Abrir ficha abre aquele ID e obtém sua trava. Ao salvar com sucesso, quem veio da revisão retorna à revisão atualizada. Se houver novas alterações digitadas durante o envio, a ficha permanece aberta e pede outro salvamento.
4. Campos preenchidos em um rascunho não significam ficha finalizada: o texto indica Salvar equipamento. Ficha salva não conclui o assunto.
5. Abrir e concluir leva ao assunto. A conclusão continua sendo uma ação explícita; o servidor revalida dependências. Impressora sem foto válida não conclui Impressoras.
6. Confirmar conclusão só fica disponível quando a revisão recebida permite. O servidor faz a validação final e protege versões concorrentes. Não existe percentual geral de inventário nem conclusão automática.

O número de pendências conta ações/causas, não quantidade total de equipamentos. Uma ficha pode ter mais de uma causa. A contagem de itens não conferidos foi retirada; não recria Verificado/Não localizado no fluxo atual. Registros históricos existentes continuam no banco.

## Contrato do servidor

GET /api/collector/review preserva errors/details e acrescenta pending[]. Cada entrada contém code, section, kind, id quando aplicável, label, message, action, blocking e fields quando aplicável. Códigos: RESPOSTA_PENDENTE, ASSUNTO_NAO_CONCLUIDO, CAMPO_OBRIGATORIO, FICHA_EM_RASCUNHO, VINCULO_AGENTE_PENDENTE e FOTO_OBRIGATORIA_PENDENTE. Os destinos são fachada, assunto ou ficha exata. Nenhum HTML vindo do banco é executado.

inventory-section devolve os impedimentos relevantes ao assunto; exclui apenas sua própria pendência manual de conclusão. reviewV3 valida rascunhos com o mesmo catálogo de campos do salvamento, incluindo Outros equipamentos. Fotos são somente ready e do ID/unidade corretos, conforme contrato existente. Fotos de computador são opcionais, de impressora/fachada seguem a decisão vigente.

Ao renovar equipment-lock, o mesmo usuário recebe outro token; token anterior deixa de autorizar alteração. Outro usuário com trava vigente continua protegido. A versão do equipamento ainda precisa coincidir. Retomada local ou após login obtém nova trava e recusa divergência de versão sem sobrescrever a ficha remota.

## Digitação, sessão e erro

O rodapé grande é ocultado durante digitação em tela estreita. O cabeçalho oferece Salvar de 44 px e Fechar teclado; o campo ativo fica visível. Salvar ambiente submete o formulário de ambiente; salvar equipamento não conclui assunto.

Atualizações incrementais preservam foco/cursor. Eventos de input/change provenientes da tela anterior são ignorados: o blur tardio de um campo não pode contaminar as respostas do próximo assunto. Cada envio de ficha usa uma cópia dos dados; digitação posterior à requisição fica na aba e exige salvar novamente.

401 oferece login em outra aba e Já entrei · retomar. Só o mesmo usuário pode retomar; o CSRF é atualizado, a trava renovada e a versão conferida. Não há login automático nem acesso anônimo. Respostas não enviadas ficam apenas na memória da aba. Fechá-la/recarregá-la pode perdê-las. Não declarar Salvo local durável ou offline operacional.

Erro de validação mostra campos; conflito não sobrescreve; timeout/resultado desconhecido não declara sucesso. Falha de fila permanece pendente. Nova tentativa não significa publicação automática. Assunto concluído aberto pela URL fica somente leitura e oferece Reabrir assunto com confirmação.

## Listas e busca

Mostrar mais acumula páginas do servidor (50 registros por consulta). Rótulo mostra N carregados, nunca um total inventado. Retorno da ficha conserva lista, filtro e rolagem desta aba. Atualizar lista consulta novamente a primeira página, útil quando outro operador adiciona registros.

Busca atual: marca, modelo, série, patrimônio, categoria e descrição de Outros equipamentos, dentro da unidade. Não busca ambiente, posição, hostname, AnyDesk ou RustDesk; o campo e a ajuda informam isso. A busca global desktop continua com seu contrato próprio D-084.

Internet Sim → Não preserva links existentes e mostra quantos ficaram guardados; ao retornar a Sim, reaparecem. Não cria novo link nem apaga histórico. Diálogos próprios aceitam Cancelar/Esc e devolvem foco. Controles mortos do antigo assistente V2 foram removidos da interface atual.

## Preservado e fora do escopo

D1, Drive e Workers; miniaturas D-072; IDs, autoria/histórico, fotos, QR/agente e localização D-074; perfis/permissões; rascunhos PARCIAL e inventário oficial; identidade D-061/D-062. Sem migração ou seed. Não exige recadastrar equipamentos nem reenviar fotos já válidas.

Sem offline durável, edição simultânea sem conflito, autosave completo das fichas, ações em lote, exclusão pelo operador, alteração de perguntas/ordem ou nova declaração de ausência de equipamentos. Homologação de câmera/teclado e QR físico permanece específica por Android/iPhone. Testes e versões publicadas: [registro de qualidade](../05-qualidade/COLETOR_REFINAMENTO_2026-11-10.md).
