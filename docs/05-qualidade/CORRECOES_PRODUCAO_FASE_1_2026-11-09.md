# Correções de desempenho — Fase 1, 09/11/2026

**IMPLEMENTADO E TESTADO LOCALMENTE. Sem publicação, migração remota, alteração de segredos ou upload real.** O título identifica o plano recebido de correções de produção; não declara que a versão esteja publicada.

## Escopo autorizado e fontes

Pedido do responsável: iniciar as correções, após a análise do pacote de auditoria. Base efetivamente corrigida: `8e59207f21a6eda130e923d12b2d2b3d1de8c7b2`; o pacote externo referencia `eddba99`, anterior a mudanças já publicadas. Seguido o escopo ajustado da Fase 1, mantendo perguntas, permissões, agentes, dados e identidade visual.

Consultados: `00_LEIA_ANTES_DE_TUDO.md`, `AGENTS.md`, `docs/00-governanca/REGRAS_DE_PRECEDENCIA.md`, `DECISOES.md`, `PENDENCIAS.md`, `CONFLITOS_DOCUMENTAIS.md`; Base de Coleta original; manifesto e cinco PNGs desktop; especificações `02_TELAS_E_INTERACOES.md`/`04_ESPECIFICACAO_SETORES.md`; fluxo de integração e `INTEGRACAO_GOOGLE_DRIVE.md`; status dos diagramas; `ACEITE.md` e `02_CASOS_DE_TESTE_PRIORITARIOS.md`; manual operacional atual. Fontes externas recebidas em Downloads: `00_LEIA_PRIMEIRO_3.md`, `01_ERROS_ENCONTRADOS.md`, `02_LOGICAS_NAO_APLICADAS.md`, `03_DESEMPENHO_FOTOS.md`, `04_ICONES_E_EXIBICAO.md`, `05_MELHORIAS_RECOMENDADAS.md`, `06_PLANO_DE_CORRECAO.md`, `07_INSTRUCAO_CODEX.txt`. Anexos originais continuam locais.

Requisitos preservados da Base: §§1.2, 5.1–5.6, 7.5–7.6, 7.11 e 8–9: fotos vinculadas/protegidas, limites, confirmação do servidor, reenvio e separação de rascunhos. D-048 mantém Drive; D-057/D-060 mantêm questionário/fotos atuais; D-065 mantém identidade. Não se implementou offline, miniaturas ou novas perguntas.

## O que mudou

| Itens da auditoria | Implementação / limite |
|---|---|
| FOTO-01, ERR-01/02 | `asset-response.mjs`: recursos estáticos com `public, no-cache`; URLs mutáveis revalidam, evitando JS/CSS antigos após publicação. HTML, APIs JSON, erros e redirecionamentos continuam `no-store`. `worker.mjs` preserva a política definida pelo handler. |
| FOTO-01, ERR-02/05 | `photo-response.mjs` nas três rotas de leitura: ETag SHA-256, `private, no-cache`, `Vary: Cookie`, 304 sem Drive **depois** de sessão, escopo, estado da foto e disponibilidade/provedor. Sem hash válido: `private, no-store`. Comprimento do objeto repassado quando disponível. |
| FOTO-03, ERR-05 | `photo-storage.mjs`: reutiliza a linha D1 já lida na requisição. Memo do token decifrado limitado a um por binding D1 e até 60 segundos; precisa de linha atual autorizada, token cifrado/contexto iguais e validade. Não é cache de sessão/permissão. Bancos, chaves, desconexão e expiração testados. |
| FOTO-04, ERR-06 | A rota passa `retry:false` somente depois de inserir a linha única pendente. Primeira tentativa não pesquisa arquivo que ainda não foi enviado. Reenvio de pendência continua pesquisando por `semedPhotoId`; foto já pronta retorna sem novo upload. A camada mantém `retry:true` por padrão para outros chamadores. |
| FOTO-08, ERR-12 | Migração **0019** com índices por vistoria/data/ID e unidade/status/data. 0016–0018 já estavam ocupadas. Nenhuma linha, coluna ou regra alterada; aplicada apenas em SQLite local. |
| FOTO-09, ERR-16 | PNG legado convertido para WebP de 223.368 bytes, original preservado. Referências/fallback e build atualizados. A imagem visível do login atual já era `paisagem-coleta.jpg` de 118.146 bytes, preservada; não atribuir ganho de carregamento atual ao PNG legado. |
| Passo 5 da Fase 1 | `desktop-results.js`: comparação por bloco antes de substituir HTML; imagens e foco preservados em atualizações idênticas. Fotos com carregamento lazy/decodificação async; abertura no viewer existente, sem nova aba de Fotografias. Dados novos continuam aparecendo. |

Não adotados automaticamente: fotos frescas por 24 h, static assets mutáveis frescos por 24 h/uma semana, miniaturas binárias em D1 e cache de autorização. A alternativa `no-cache` exige revalidação em cada reutilização HTTP; não equivale a apagar todos os bytes já recebidos no dispositivo. Retenção/limpeza de caches em computadores compartilhados segue pendente (MEL-17). Fontes técnicas: [RFC 9111](https://www.rfc-editor.org/rfc/rfc9111.html).

## Medição antes/depois

Mesmo script/fixture executado contra os módulos do commit base, extraídos com `git archive` para diretório privado, e contra a implementação atual. SQLite em memória, Google simulado, PNG sintético de 68 bytes. Contagem de comandos SQL executados (`first/all/run`); os três comandos dentro do batch contam uma vez cada. A consulta de sessão do Worker fica fora desta tabela; no HTTP completo há mais essa consulta. Não são milissegundos nem faturamento de D1.

| Operação | SQL antes → depois | Google antes → depois | Corpo binário depois |
|---|---:|---:|---:|
| Primeiro upload, pasta ainda inexistente | 11 → 10 | 4 → 3 | n/a |
| Novo upload, pasta existente | 10 → 9 | 2 → 1 | n/a |
| Leitura no coletor | 4 → 3 | 1 → 1 | 68 bytes |
| Leitura desktop da foto | 3 → 2 | 1 → 1 | 68 bytes |
| Nova leitura sem condição | 4 → 3 | 1 → 1 | 68 bytes |
| Revalidação no coletor com ETag igual | 4 → 3 | 1 → 0 | 0 bytes, HTTP 304 |
| Revalidação desktop com ETag igual | 3 → 2 | 1 → 0 | 0 bytes, HTTP 304 |

Integração D1: duas leituras por operação passaram a uma. Reenvio `ready`: nenhuma chamada Google. Retomada `pending` com arquivo já existente: uma busca, nenhum novo upload. Os números diferentes da tabela externa decorrem do método/base; não se afirmou reproduzir tempos/custos que não foram fornecidos. Reproduzir: `pnpm measure:photos`.

Pacote desktop: 76 arquivos, 2.130.284 bytes na lista principal do build, sem incluir coletor. O PNG legado caiu de 2.638.818 para 223.368 bytes (91,54%); a paisagem visível JPEG não mudou. Teste de navegador confirmou HTTP 304 sem corpo para o JPEG atual, WebP de fallback, CSS/fontes e foto já recebida. A segunda carga da tela de ocorrências no fixture transferiu aproximadamente 13 KB de corpos de resposta (incluindo a sonda posterior de sessão encerrada), abaixo de 100 KB nesse cenário. Isso não homologa o Panorama completo com dados reais. Não medidos p50/p95 em produção ou rede móvel; nenhum compromisso de tempo absoluto é declarado.

## Testes e evidências

- `pnpm test`: **134/134** aprovados, incluindo cinco novos testes com múltiplos cenários de cache, permissões, custo, token e índices.
- Builds desktop/coletor: **76/47** arquivos.
- Nove roteiros anteriores de navegador: V3, UX, identidade coletor, identidade painel, cadastro, consulta de equipamentos, monitoramento, demandas e navegação.
- Novo `pnpm test:photo-performance:browser`: Worker real local + SQLite + objetos locais. Poll de 15 s preserva o mesmo nó de imagem e foco; alteração no banco aparece; viewer funciona; reload/reabertura não relê o objeto; sessão revogada recusa cache; JPEG atual e fallback WebP revalidam. Adicionado à CI.
- Falhas iniciais do novo roteiro corrigidas: relógio virtual precisava ser instalado antes do carregamento; imagem atual era JPEG de D-065, não o PNG do relatório antigo. Não se mudou a identidade para satisfazer a hipótese antiga.
- Revisão do índice Git com `pnpm check:repository`: sem caminhos privados ou assinaturas conhecidas de segredos; não substitui revisão humana.
- `pnpm docs:schema`: 19 migrações, 64 tabelas, 42 índices, uma view, 10 triggers, integridade OK e zero falhas de chaves estrangeiras. `pnpm docs:txt` e `pnpm check:docs` aprovados.
- `EXPLAIN QUERY PLAN` confirma uso dos dois índices em consultas correspondentes.
- Capturas reais locais inspecionadas em `docs/05-qualidade/evidencias/desempenho-fase1-2026-11-09/`: `ocorrencias-atualizacao.png`, `foto-ampliada.png`, `login-identidade-preservada.png`; `requests.json` contém contagens/respostas. Dados de teste rotulados TESTE ISOLADO; imagem ilustrativa não corresponde a uma coleta oficial. Diretório de evidências ignorado pelo Git.

## Limites e próxima etapa

- Nada desta fase foi publicado nos Workers; produção permanece na versão anterior. Migração 0019 está pendente no D1 remoto.
- Não há miniaturas: a primeira consulta continua recebendo o arquivo completo. Fase 2 requer respeitar a regra de não guardar fotos binárias em D1.
- A recuperação por busca no Drive continua sendo o mecanismo existente. Não é trava distribuída nem garantia de upload exatamente uma vez sob tentativas simultâneas do mesmo ID entre Workers, ou timeout ambíguo antes de o Drive tornar a busca consistente. Uma evolução com IDs previamente gerados/persistidos e conflito 409 do Drive deve ser tratada/testada como mudança própria, sem anunciar que esta otimização resolveu concorrência distribuída. Referência: [uploads com IDs previamente gerados](https://developers.google.com/workspace/drive/api/guides/manage-uploads).
- Não foi feito batch adicional de leituras de unidades: preservar validações atuais teve prioridade sobre reduzir arbitrariamente a contagem. O memo não elimina a checagem de integração no D1.
- Sem teste físico novo de câmera, teclado, QR/EXE ou rede móvel; testes locais não homologam esses dispositivos.
- Fases 2–5, mudanças de comportamento e decisões marcadas pendentes na auditoria permanecem separadas. Não reintroduzir Conferir/Não localizado contra D-057.
- Rollback: reverter código da fase e reconstruir os dois artefatos. Os índices aditivos podem permanecer. O PNG original está preservado no repositório. Nenhuma restauração de dados é necessária por esta fase local.
