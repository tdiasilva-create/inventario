# Solicitação repetida de senha — 09/11/2026

## Pedido e fontes

O responsável pediu examinar os logs porque usuários eram convidados a trocar a senha novamente após defini-la; confirmou ocorrência percebida no coletor e no painel. Aplicam-se Base original §8.4–8.7, §8.9 e §8.11–8.12, D-031 (primeiro acesso/reset e quatro perfis), D-035 (gestão root) e identidade D-061/D-065. Consultados ponto de entrada, AGENTS, precedência, decisões, pendências, conflitos, contratos de acesso e `AUTENTICACAO_01.md`. A autorização contínua de implementar/testar/publicar autenticação está registrada em D-031. Fases 4/5 da auditoria continuam pausadas.

## O que os logs reais permitem afirmar

Consulta somente leitura ao D1 compartilhado em 09/11, aproximadamente 09:39 (America/Fortaleza): situação das contas, versão de credencial, prazo provisório, último login e últimos 160 eventos de autenticação/reset/criação. Não foram consultados hashes, sais, senhas, cookies ou tokens. Resultado nominal restrito a `private-data/auth-diagnostico-2026-11-09/`, ignorado pelo Git.

- Sete contas ativas com troca registrada estavam com `must_change=0` e prazo provisório NULL. Não há evidência de que o login normal tenha revertido a senha dessas contas.
- Uma conta ativa teve duas trocas às 09:32:05 e 09:32:55, login às 09:33:11 e redefinição pelo root às 09:35:32. A redefinição posterior explica a obrigatoriedade atual dessa conta; não foi desfeita automaticamente.
- Contas iniciais sem uso e conta desativada com reset anterior não são prova de repetição espontânea.
- A auditoria antiga não grava qual dos dois hosts originou o acesso. Portanto não atribuir todos os relatos a uma causa única nem afirmar que houve perda de senha no banco.

## Defeitos reproduzidos e correção

1. **Operador no endereço desktop:** o servidor o redirecionava para `/conta` mesmo com senha definitiva. A tela abria imediatamente o formulário de troca. Agora login com senha definitiva e tentativa de navegação gerencial encaminham para o login do coletor. Mensagem explica que o mesmo usuário e senha devem ser utilizados. Cookies continuam separados por hostname; não há SSO, transporte de senha ou token na URL, nem acesso gerencial concedido ao operador.
2. **Formulário voluntário apresentado como próximo passo:** nos dois ambientes, `/conta` agora informa que a senha está definida e oferece Continuar/Abrir coletor. O formulário só abre quando o usuário escolhe Alterar minha senha. Primeiro acesso/reset continuam exibindo o formulário obrigatório. Após sucesso, limpar formulário e substituir a entrada do histórico por login com confirmação. Página restaurada pelo histórico reconsulta a sessão por recarregamento, evitando flag/CSRF antigos em memória. O teste exercita o handler de restauração; não homologa bfcache de aparelhos físicos.
3. **Duas trocas concorrentes:** a atualização condicional da senha podia falhar, mas o batch ainda apagava sessões e registrava `password_changed`. Reprodução isolada: a tentativa atrasada devolvia 409 e também derrubava a sessão recém-criada com a senha vencedora. Agora exclusão de sessões e auditoria dependem do hash novo realmente gravado dentro do mesmo batch atômico. A tentativa vencida não registra sucesso nem revoga a sessão nova. Não há evidência suficiente para atribuir a ocorrência real a essa concorrência.

Nenhuma senha real, flag `must_change` ou prazo foi editado por esta correção. Redefinições administrativas continuam exigindo uma troca legítima. Expiração de sessão exige entrar de novo, não redefinir senha. A política mínima, proteção contra vazamentos, CSRF, hashes, perfis e sessões revogáveis foram preservados.

## Arquivos e aceite

- Servidor: `server/worker.mjs` (destino do operador, `homeUrl` em auth/me, redirect após troca, batch condicionado).
- Interfaces: `web/account.html`, `account.js`, `account-shell.js`, `account.css`, `desktop-theme.css`, `collector-account.html`, `collector-account.js`, `collector-login.js`, `collector.css`.
- Regressão: `tests/auth-flow.test.mjs`, `tests/helpers/auth-fixture.mjs`, `tests/auth-flow-browser.cjs`, comandos em package.json/CI.
- Sem migração ou nova dependência. A origem do coletor usada para o encaminhamento está em `server/worker.mjs`; deve ser revisada em futura migração de domínio.

Aceites executados:

| Cenário | Resultado |
|---|---|
| Primeiro acesso, trocar, entrar novamente no coletor | PASS; flag removida, mesma senha aceita |
| Senha provisória antiga após troca | PASS; recusada |
| Expirar sessão e entrar com senha definitiva | PASS; não pede nova definição |
| Operador no painel com senha definitiva | PASS; encaminhado ao coletor |
| Root/admin/visualizador no painel | PASS; destino/permissões preservados |
| Reset administrativo legítimo | PASS; exige nova troca; operador não pode redefinir root |
| Senha atual incorreta / senha nova curta | PASS; sem alteração nem auditoria de sucesso |
| Duas trocas concorrentes | PASS; apenas uma aceita, sessão vencedora permanece |
| Minha conta com senha definida | PASS nos dois ambientes; alteração voluntária |
| Evento de restauração da página | PASS; recarrega estado atual, sem POST de troca |

150 testes Node aprovados, incluindo seis novos. Roteiro Edge/Playwright com Worker real e SQLite em memória, sem requisições ao ambiente oficial, passou em 390×844 e 1280×900. Cinco screenshots reais da implementação estão em `docs/05-qualidade/evidencias/senhas-2026-11-09/`; capturas 02/04/05 conferidas visualmente. Builds: painel 83 arquivos listados, coletor 53; dois dry-runs Wrangler aprovados com D1/Drive preservados.

Limites: contas e dados são isolados nos testes; não houve troca de senha de pessoas reais para homologar. Celulares físicos, teclado e histórico nativo permanecem para confirmação do responsável. Nenhuma pergunta, vínculo de equipamento, foto ou regra de vistoria foi modificada.

## Publicação

Preparada após os testes acima. A confirmação das versões e sondas HTTP será registrada após o deploy dos dois Workers.

Rollback: voltar às versões anteriores do painel `104e92dc-7b74-4509-9ad9-24c215f7dbc1` e coletor `c23eb70f-4541-4007-a125-5cba581ab87f` reintroduz os problemas descritos. Não exige reverter D1 ou credenciais, pois não há migração nem alteração de dados neste deploy.
