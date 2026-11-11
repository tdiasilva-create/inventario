# D-096 — senha provisória escolhida pelo root e regra de seis caracteres

## Decisão e fontes

Pedido direto do responsável em 11/11/2026, após revisão das regras atuais: substituir a senha automática de criação pela senha informada pelo root, manter troca no primeiro login, aceitar senha definitiva a partir de seis caracteres sem composição obrigatória e retirar a consulta a vazamentos, inclusive o bloqueio quando o serviço externo falha. Implementação/publicação nos dois ambientes sob autorização contínua da sessão.

Consultados: 00_LEIA_ANTES_DE_TUDO.md, AGENTS.md, REGRAS_DE_PRECEDENCIA.md, DECISOES.md, PENDENCIAS.md, CONFLITOS_DOCUMENTAIS.md, PROPOSTA_ACESSO_INICIAL.md, AUTENTICACAO_01.md, CORRECAO_SENHAS_2026-11-09.md, 08_SEGURANCA_E_INTEGRACOES.md e os fluxos reais em server/security.mjs, server/worker.mjs, web/account.html/js e web/collector-account.html/js. Nenhuma pergunta, fotografia, critério de conclusão ou ordem do questionário foi alterada. Base de Coleta original preservada.

## Comportamento entregue

- Em Usuários, somente root cria contas e preenche Senha provisória, com Mostrar/Ocultar. O servidor exige temporaryPassword no POST /api/admin/create; não gera outra senha silenciosamente quando falta esse campo. O formulário antigo aberto antes da publicação precisa ser atualizado.
- Senha provisória de criação e senha definitiva: de 6 a 256 caracteres; letras, números, espaços e símbolos livres, inclusive só números ou só letras. Sem trim, requisito de maiúsculas/minúsculas, combinação obrigatória ou consulta de vazamento.
- A senha recebida do root é armazenada somente como hash com salt e pepper existentes. A resposta transitória permite copiar a senha entregue ao usuário; a exibição continua com ocultação manual/automática em 60 segundos. Não registrar o valor em auditoria, URL ou armazenamento local. O campo é limpo após criação bem-sucedida.
- O usuário entra com a provisória e define sua própria senha antes de usar o sistema. Nova senha deve ser diferente da atual e sua confirmação deve coincidir. Após sucesso, a provisória deixa de funcionar, as sessões anteriores são encerradas e uma nova entrada usa a senha definitiva.
- A regra vale no painel e no coletor, que compartilham usuários no D1 e mantêm sessões separadas. Trocar de interface ou expirar a sessão não exige uma nova definição de senha (D-075).
- Prazos atuais de 24 horas para a provisória e uma hora para sessão preservados, conforme configurações existentes. Papéis, nome de usuário, bloqueio por tentativas, CSRF, hash, auditoria, revogação e controle de concorrência preservados.
- Redefinição administrativa conserva o fluxo aleatório anterior: o pedido alterou a criação, não esse procedimento. A senha definitiva escolhida após redefinição também segue a nova regra de seis caracteres.
- Nenhuma migração, alteração de credenciais existentes, inclusão de usuário real, limpeza de dados ou troca de segredo é necessária.

## Testes e evidências

`node --test tests/security.test.mjs tests/auth-flow.test.mjs`: 12 testes aprovados. Cobrem limites 5/6/256/257, senhas numéricas/alfabéticas/com espaços/símbolos, ausência de consulta externa, hashing, perfis, CSRF, duplicidade, criação exclusiva do root, primeiro acesso em cada ambiente, senha atual recusada como nova, senha provisória invalidada após troca, reentrada sem nova troca e duas alterações concorrentes sem sucesso/auditoria falsos.

`node tests/auth-flow-browser.cjs`: aprovado com Worker real e SQLite isolado. Criação pela interface, Mostrar/Ocultar, limpeza do campo, cópia transitória, senha definitiva de seis caracteres nos dois ambientes, erro de confirmação divergente, primeiro acesso e reentrada. Zero chamadas ao serviço externo, erros JavaScript ou requisições de produção. O teste já integra a CI. Capturas após carregamento das fontes e estabilização das animações; visual conferido em 1280 x 900 e 390 x 844.

O teste não realiza coleta de fotos ou inventário: estes requisitos do TXT permanecem intactos. Não promete nova funcionalidade offline. Todas as credenciais/dados usados nos testes são sintéticos e restritos à fixture.

Evidências locais privadas: docs/05-qualidade/evidencias/senhas-root-2026-11-11/resultado.json e oito PNGs. Principais: 06-criar-usuario-senha-root.png, 07-criar-usuario-390.png e 08-conta-seis-caracteres.png. Capturas sem senha real; não são prova de cadastro de teste em produção. Permanecem fora do repositório público pelo .gitignore.

## Publicação

Preparação local concluída; builds, verificações HTTP e versões de publicação serão registrados após a implantação. Sem escrita de teste no D1 oficial. Versões anteriores para eventual rollback: painel c9ef64e6-3e05-4905-8a94-22837286a285; coletor 91ba6200-d080-4026-8e92-7042bd67f86e. Rollback precisa considerar os dois Workers para não restaurar políticas diferentes de senha entre os ambientes.
