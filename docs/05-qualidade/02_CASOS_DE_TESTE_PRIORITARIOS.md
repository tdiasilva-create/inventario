# Casos de teste de aceite — derivados da Base aprovada

| ID | Cenário | Critério verificável |
| --- | --- | --- |
| T01 | Usuário coletor seleciona unidade | Só aparece escola autorizada; não existe `criar escola`. |
| T02 | Unidade com rascunho muda de escola | Pergunta se salva/descarta; não perde respostas silenciosamente. |
| T03 | Categoria independente antes de A/B | Navegação livre funciona; só bloqueia etapa dependente concreta. |
| T04 | Card concluído tenta reabrir | Confirmação obrigatória; volta `Em andamento`. |
| T05 | Sem internet na escola | Fluxo C não exige operadora ou velocidade inexistente; C.5 pendente de ajuste sem `0`. |
| T06 | Desktop cadastrado com CPU desconhecida | CPU é opcional, não bloqueia cadastro. |
| T07 | Webcam / microfone / caixa de som | Não pedir especificações técnicas extras. |
| T08 | Monitor e desktop próximos | Registros separados e possível vínculo, nunca obrigatório. |
| T09 | Roteador Grupo F aparece no D | Contagem única e relacionamento, não duas fichas. |
| T10 | Bem individual possui zero foto | Cadastro permitido (quando nenhuma foto de infraestrutura obrigatória se aplica). |
| T11 | Falha visível de infraestrutura sem fotografia | Só conclui mediante justificativa válida quando foto for insegura/impossível. |
| T12 | Perda de conexão antes de salvar | Rascunho local preservado, estado diferenciado, sem declaração falsa de sync. |
| T13 | Foto obrigatória ainda não enviada | Não oficializar vistoria. |
| T14 | Foto opcional pendente, dados oficiais completos | Permitir conclusão, sinalizar pendência separada. |
| T15 | Dois usuários editam o mesmo equipamento | Servidor bloqueia concorrência online; versões offline conflitantes preservadas. |
| T16 | Coletor encontra equipamento antigo sem mudanças | Confirma verificação sem digitar ficha toda, atualização da data de verificação. |
| T17 | Equipamento não verificado | Não chamar `não localizado`, sem criar falta patrimonial. |
| T18 | Equipamento não localizado | Justificativa e pendência criada; vistoria pode concluir com pendência. |
| T19 | Coletor tenta transferir entre escolas | Operação oficial negada; permite apenas apontamento. |
| T20 | Login com senha provisória | Obrigação de troca de senha e sessão segura. |
| T21 | 90 escolas e datas fake do PNG desktop | Nunca contar/mostrar como reais se dados não importados. |
| T22 | Revisita à mesma escola | Não duplica o total de equipamentos. |
| T23 | Vista mobile | Layout em retrato e toque funcional em Chrome Android / Safari iPhone. |
| T24 | Visual do painel | Mapa, matriz e unidade selecionada como principais; não substituir por cinco KPI cards. |

**Testes adicionais de engenharia:** perda de espaço do dispositivo, expiração de sessão offline, sincronização idempotente, recuperação de backup diário, testes de restauração, autorização em todos os endpoints, proteção do R2 e comparação de capturas visuais.
