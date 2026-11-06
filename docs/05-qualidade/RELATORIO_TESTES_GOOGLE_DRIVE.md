# Relatório de testes — integração Google Drive (proposta D-047) — 28/10/2026

Situação em uma linha: **IMPLEMENTADO** (código local) · **TESTADO** apenas com Google simulado e Node (sem rede, sem dados reais) · **NÃO PUBLICADO** · **NÃO AUTORIZADO** no Google · **NÃO TESTADO** em celulares.

## 1. Testes automatizados executados

Ambiente: Node.js 22.23.4, `node:sqlite` em memória com todas as migrações (0001–0013), Google Drive/OAuth simulados em `tests/helpers/fake-drive.mjs`. Nenhuma chamada externa; nenhuma escrita em D1 oficial, R2 ou Drive real.

| Arquivo | Teste | Resultado |
|---|---|---|
| `tests/photo-storage.test.mjs` | Provedor: nada habilitado sem configuração; R2 segue ativo com binding; Drive exige segredos **e** autorização; upload sem autorização → 503; `capabilities` reflete provedor | aprovado |
| | Tokens AES-GCM: ida e volta; chave diferente falha; chave inválida recusada | aprovado |
| | Autorização: só root inicia (admin/operador/visualizador → 403); sem segredos → 503; callback sem estado/cookie → 400; URL do Google com `drive.file`, `offline`, `consent`, redirect exato; token cifrado no D1 (nunca em claro); pasta criada; estado consumido; replay recusado; status sem tokens; autoteste grava e remove; desconectar revoga e apaga tokens; eventos registrados | aprovado |
| | Coleta com Drive: upload 201 com `storage_ref`; `appProperties` com photoId/sha; subpasta da unidade dentro da raiz; repetição do mesmo id não duplica; retomada de upload interrompido reaproveita arquivo; mesmo id com conteúdo diferente → 409; leitura por proxy com `private, no-store` e bytes idênticos; visualizador não lê rascunho; nenhuma permissão pública criada; renovação única de token expirado; remoção própria apaga no Drive e outro operador → 403; falta de espaço → 503 com mensagem clara e linha `pending`; revogação externa → 503, `revoked_at`, `photosEnabled:false`, evento `authorization_revoked` | aprovado |
| | Exclusão de unidade pelo root: fila guarda provedor + referência; falha de limpeza preserva arquivo e informa pendência; `photo-cleanup` remove no Drive e zera a fila | aprovado |
| `tests/google-worker.test.mjs` | Worker completo: `start` sem sessão → 401; callback com estado inválido → página 400 (não 401); root → 302 ao Google com cookie `__Host-semed-oauth` Lax; callback **sem cookie de sessão** conclui (200, HTML, cookie limpo); status autenticado; POST sem CSRF → 403; com CSRF executa autoteste; rotas inexistentes no Worker do coletor (404) | aprovado |
| Suíte existente (`npm test`) | 12 arquivos anteriores, incluindo `visit.test.mjs` com R2 simulado e `root-powers.test.mjs` com fila de exclusão | aprovado (46 de 47 no contêiner de desenvolvimento; a única falha foi `map-examples.test.mjs` por ausência de `scripts/lib/csv.mjs` na cópia parcial usada, arquivo não alterado — **reexecutar `npm test` no PC do projeto**) |

Defeito encontrado e corrigido durante os testes: as rotas `/api/root/google/*` estavam registradas depois de `unitRoutes`, que responde 404 a qualquer `/api/root/*` desconhecido; o teste de Worker apontou o 404 e a ordem foi corrigida em `server/worker.mjs`.

Smoke visual do painel (Playwright, API simulada): bloco "Armazenamento de fotografias" nos três estados (não conectado / conectado / provedor não configurado), toast de retorno `?google=conectado`, botão Testar envio e diálogo de desconexão renderizam sem erros de script. Captura: `configuracoes-connected.png` (anexada à conversa de 28/10/2026; não gravada no repositório).

## 2. Testes NÃO executados (exigem ambiente real)

Todos os cenários de `TESTE_FOTOS_GOOGLE_DRIVE.txt` seções A–G em ambiente publicado: câmera e galeria em Chrome Android e Safari iPhone, persistência após novo login, leitura no painel com fotos reais, acesso sem autenticação em produção, perfis em produção, repetição sem duplicação em rede móvel, autorização revogada na conta real, falta de espaço real, exclusão de unidade com arquivos reais. Compatibilidade móvel e offline **não homologadas**.

## 3. Pré-condições para os testes reais (nenhuma concluída)

1. Projeto Google Cloud, Drive API, tela de consentimento interna e cliente OAuth Web com o URI de redirecionamento exato (`docs/04-dados-apis/INTEGRACAO_GOOGLE_DRIVE.md`, seção 8).
2. Segredos nos dois Workers e `PHOTO_STORAGE_PROVIDER=google-drive`.
3. Migração 0013 aplicada (validação primeiro).
4. Publicação autorizada pelo responsável.
5. Autorização pelo root com a conta institucional e autoteste aprovado.
6. Definição de unidade/ambiente para fotos de teste identificadas (a unidade "ESCOLA TESTE - DADOS FICTICIOS (APAGAR)" não deve ser usada nem excluída sem autorização expressa).

## 4. Endereços

- Painel: https://painel-semed-paco.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev/ (versão publicada **não** contém esta integração)
- Coletor: https://inventario-semed-lumiar.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev/ (idem)
- Validação: https://painel-semed-paco-validacao.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev/ (atividade não confirmada)

## Atualização de publicação — 03/11/2026
Projeto Google Cloud e cliente OAuth reais criados pelo fluxo acompanhado. Segredos nos dois Workers. Backup antes de aplicar migrações0012/0013. Publicações reais: painel31d75f82-ad3b-4f74-b077-8676ed1c3174 e coletor932233b0-61be-4da9-9b80-48fc231847a4. Provedor configurado google-drive, ainda sem consentimento da conta no painel. pnpm test48/48; smoke HTTP scripts/verify-collector-production.mjs PASS. O aviso inicial NÃO PUBLICADO descreve a entrega de28/10 e foi superado por esta atualização. Upload/leitura reais e aparelhos continuam NÃO EXECUTADOS. Próximo passo: login root em /configuracoes, conectar Google Drive, consentimento e autoteste. Não há sucesso de armazenamento real confirmado.
