# D1 / R2 / Workers — contratos de integração e permissões (PROPOSTA TÉCNICA)

Este documento organiza endpoints e eventos para que o Codex possa planejar a implementação. **Os nomes concretos das rotas são sugestões de engenharia e NÃO foram aprovados durante o questionário.** As invariantes funcionais estão no TXT original, §§1, 2, 7–11.

## Limites de confiança
- Frontend navegador (mobile e desktop) NÃO terá acesso a segredos/bindings D1/R2. Requisições autenticadas a Workers.
- Worker valida perfil, escola autorizada, versão do cadastro, estado da vistoria, tamanho/tipo da foto, idempotência, auditoria e vinculação R2.
- D1: identidades estáveis, relacionamentos, permissões, estados, metadados, trilhas de alteração.
- R2: objetos de foto, miniaturas. Preferir buckets privados e emissão controlada de acesso.
- Offline: persistência criptografada com chave efetiva protegida, fila de operações com IDs idempotentes, processamento na reabertura do navegador quando necessário.

## Contratos candidatos (sem congelar nomes)
| Op | Método/rota exemplo | Permissão | Garantias necessárias |
|---|---|---|---|
| Login | `POST /api/auth/login` | usuário | sessão revogável; política de senha |
| Listar unidades | `GET /api/units` | autenticado | coletor somente autorizadas |
| Preparar unidade offline | `GET /api/units/{id}/snapshot` | coletor autorizado | versão/checkpoint para conflitos |
| Carregar categorias/questionário | `GET /api/questionnaires/active` | autenticado | versão publicada e fixa por vistoria |
| Iniciar/retomar vistoria | `POST /api/inspections` | coletor autorizado | ID persistente; controle concorrente |
| Salvar seção | `PUT /api/inspections/{id}/sections/{s}` | coletor autorizado | `version`, idempotência, dependências |
| Consultar bens da escola | `GET /api/units/{id}/equipments` | coletor autorizado | paginação e histórico adequado |
| Criar/atualizar bem | `POST/PUT /api/equipments` | coletor autorizado | evitar duplicidade, mesmo ID após edição |
| Confirmar verificação | `POST /api/equipments/{id}/verify` | coletor autorizado | diferenciar última verificação/alteração |
| Registrar metadados da foto | `POST /api/photos` | coletor autorizado | upload seguro e ID da foto / R2 |
| Concluir vistoria | `POST /api/inspections/{id}/complete` | coletor autorizado | atomicidade lógica; verificar obrigatórios |
| Consultar painel | `GET /api/analytics/...` | admin/autorizado | somente dados oficiais, definição de indicador |
| Administrar escolas | `POST /api/admin/units/import` | admin | duplicidade + auditoria |

## Fluxo de fotos: invariantes
1. Criar identificador único de upload e vincular no D1 como `pendente`.
2. Transferir arquivo para R2 com autenticação, limite e idempotência.
3. Confirmar persistência real; vincular ID do equipamento/ocorrência e metadados.
4. Só considerar foto obrigatória atendida quando o registro vinculado e o objeto estiverem confirmados, ou justificar impossibilidade válida.
5. Em erro no passo 2/3, manter fila local e permitir retentar; não apagar foto pendente automaticamente.

## Restrições técnicas a validar
Browsers mobile podem limitar armazenamento persistente, câmera, detecção Wi-Fi, WebAuthn offline, background sync e execução após fechamento. Não vender recursos como garantidos: testes em dispositivos são critério de aceite.
