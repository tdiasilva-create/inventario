# D-107 — Imagens dos técnicos no mapa

Decisão do responsável em 12/11/2026: cada técnico poderá ter uma imagem no marcador da sua localização; **quem anexa é o administrador root**. Implementação sob autorização contínua do projeto. A imagem recebida como exemplo não identifica uma conta e não deve ser atribuída automaticamente a ninguém.

## Operação

Central de demandas → Organizar atendimentos → Técnicos → Anexar imagem / Trocar imagem. Somente root acessa essa gestão e a leitura das posições/imagens no painel. Selecionar PNG, JPEG ou WebP de até 10 MB, conferir a prévia e clicar em Salvar imagem. Remover imagem exige confirmação própria e volta às iniciais. Nenhum técnico precisa reinstalar APK ou anexar sua própria imagem.

O navegador reduz a imagem, mantendo sua proporção, para PNG de até 128 × 128 px e 64 KB, sem metadados da origem. A foto original não é enviada. O servidor valida assinatura, dimensões, tipos de chunks e CRC, limite de bytes, sessão, origem, CSRF e papel root. SVG/animação não são aceitos. Uma falha não substitui a imagem anterior nem declara sucesso.

## Mapa

Marcador circular de 48 px, imagem ou iniciais, um pouco acima da coordenada com haste fina. Evita cobrir o centro da unidade. Nome, demanda, unidade, hora e precisão continuam no tooltip. Localização continua sujeita ao aceite do técnico, sessão válida e frescor de 180 segundos. Imagem não ativa GPS nem muda a ordem/atribuição de atendimentos. D-106 mantém ruas, tracejado e todos os técnicos recentes; não restaurar o quadro superior esquerdo retirado pelo responsável.

A referência da imagem vem na consulta de posições já existente (15 s). O DOM da imagem é reaproveitado enquanto seu ID não muda. Trocar a imagem atualiza o marcador na próxima leitura; remover volta às iniciais. Falha ao carregar mostra iniciais. Cores/anéis das unidades preservados.

## Persistência e API

Migração aditiva `0029_technician_avatars.sql`: `technician_profiles`, `technician_avatar_uploads`, `technician_avatar_events`. D1 contém somente metadados, referências, versão e auditoria. Nenhum binário de avatar é armazenado no D1: a exceção D-072 continua exclusiva das miniaturas de fotografias de coleta.

Arquivos no provedor privado atual, Google Drive, subpasta **Avatares dos técnicos** dentro da pasta da aplicação. Usa autorização existente `drive.file`, sem compartilhamento público. A camada R2 permanece compatível quando configurada. Não criar unidade, vistoria ou fotografia fictícia para representar avatar. No Drive, arquivo tem ID da operação, tipo `technician-avatar` e ID do usuário; não leva nomes/IDs de unidade ou vistoria inexistentes.

- `GET /api/dispatch/avatar-info?userId=ID`: perfil e versão, root.
- `POST /api/dispatch/avatar`: PNG binário; headers `X-User-Id`, `X-Avatar-Version`, `X-Operation-Id`, CSRF. Root no painel somente.
- `GET /api/dispatch/avatar?userId=ID&imageId=ID`: somente imagem atual, sessão root revalidada inclusive para 304. Cache privado com revalidação. Sem URL pública do Drive.
- `POST /api/dispatch/avatar-remove`: JSON `userId`, `version`, `operationId`, CSRF.

Gravação usa comparação de versão e operação única. Duas abas não sobrescrevem silenciosamente. Upload tem lease de 120 s contra tentativas simultâneas da mesma operação; retry procura arquivo já recebido no Drive. ACK perdido pode ser confirmado repetindo a mesma operação. Interrupção pode deixar arquivo privado sem aplicação ao perfil; não é mostrado como ativo. Remover/trocar preserva arquivo anterior e evento com autor/data para recuperação administrativa; não há expurgo automático aprovado. O arquivo privado não continua acessível pela API atual após troca/remoção.

## Manutenção / migração de servidor

Preservar as três tabelas e arquivos da subpasta junto com o restante da integração Drive. Chaves OAuth/cifra seguem o procedimento privado existente. Não executar seeds, apagar demanda, alterar sessão técnica ou reatribuir usuários para testar imagens. Rollback do Worker anterior pode manter as novas tabelas aditivas; não restaurar banco inteiro e perder coletas concorrentes. Bookmark pré-migração é recurso de recuperação, não autorização para restauração.

Critérios e evidências em [AVATARES_TECNICOS_2026-11-12.md](../05-qualidade/AVATARES_TECNICOS_2026-11-12.md).
