# Acesso inicial — proposta para revisão (27/10/2026)

Status: PROPOSTA. Os quatro nomes de perfil foram aprovados em D-028; as atribuições abaixo ainda precisam de aprovação. Nenhuma conta criada com esta proposta.

| Perfil | Permissões propostas |
| --- | --- |
| root | Administração técnica, política de segurança, gestão de administradores e revogação de sessões. |
| admin | Gestão de usuários operacionais, unidades e autorizações; consulta do painel; operações administrativas do inventário conforme regras aprovadas. |
| operador | Coleta/atualização somente em unidades autorizadas; sem gestão de usuários. Confirmar se corresponde ao coletor mobile. |
| visualizador | Consulta aos dados e unidades autorizados; sem escrita ou administração. Exportação depende de definição específica. |

Contas devem ser individuais, com nomes informados pelo responsável; perfil não deve ser usado como conta compartilhada. Aguardando nomes, permissões e definição de expiração de sessão/senha provisória (parâmetros anteriormente pendentes), antes de ativar autenticação.

Integração prevista: Worker valida login/autorização e protege recursos; D1 armazena usuários, hashes com sal, sessões revogáveis e auditoria. Cookies HttpOnly/Secure e proteção contra CSRF; sem credenciais em código, arquivos públicos ou logs. Primeiro acesso com senha provisória de validade limitada e troca; reset administrativo; proteção progressiva contra tentativas; política mínima de 12 caracteres e rejeição de senhas comuns/comprometidas. Implementar e testar esses controles antes de liberar contas. R2 permanece destinado às fotos.

Publicar a tela visual não protege o painel DEMO existente. Quando a autenticação estiver pronta, a entrada e os arquivos/dados protegidos deverão ser autorizados no servidor, sem bloqueio apenas visual em JavaScript. A distribuição de demonstração não recebe dados oficiais.

## Estado após D-031

A proposta de perfis acima foi aprovada e implementada nas operações de contas em 27/10/2026. Root/admin/operador/visualizador e prazos iniciais estão ativos no Worker/D1. Ver `docs/05-qualidade/AUTENTICACAO_01.md` para testes e limites. As atribuições de inventário permanecem previstas, não implementadas por existirem perfis. Nenhum catálogo oficial foi importado.
