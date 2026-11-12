# Miniaturas privadas — D-072, Fase 2 da auditoria

Decisão do responsável em 09/11/2026: **“Guardar miniaturas no D1, como propõe a Fase 2”**. Exceção restrita à proibição de binários da Base de Coleta §5.6. A Base original não foi alterada. As fotografias completas continuam no Drive privado (ou no provedor já configurado), nunca no D1.

## Persistência e limites

Migração aditiva **0020_photo_thumbnails.sql**, posterior aos índices 0019. Acrescenta a `collection_photos`: `thumb_blob`, `thumb_mime`, `thumb_width`, `thumb_height`, `thumb_sha256`, `thumb_source_sha256`, `thumb_created_at`, `thumb_created_by`. Índice parcial de fotografias recebidas sem miniatura. Nenhuma foto ou resposta antiga é reescrita pela migração.

JPEG com dimensões verificadas pelo cabeçalho: máximo 320 × 320 pixels e 65.536 bytes. O cliente visa até 30 KB, com qualidade inicial 0,7. Original preparado em JPEG, máximo 1.600 pixels no maior lado e 3 MB, qualidade inicial 0,85. Canvas remove os metadados EXIF da derivada, preservando a orientação visual. Entrada máxima de 30 MB; processamento sequencial e liberação de canvas, ImageBitmap e URLs temporárias. Fotos completas antigas não são recomprimidas no preparo de miniaturas.

## Contrato HTTP

| Rota | Uso | Controle |
|---|---|---|
| `POST /api/collector/photo-thumb` | Miniatura após confirmar a foto completa | Sessão, CSRF, Origin; root/admin/operador. Não root: foto própria em visita aberta e unidade liberada para coleta. |
| `GET /api/root/photo-thumbnails?cursor=...` | Página de até 20 fotografias elegíveis sem miniatura | Somente root, Worker do painel; cursor por data/ID. Não devolve BLOB, chaves de objeto ou tokens. |
| `POST /api/root/photo-thumbnails` | Preparo de fotografias antigas, inclusive visitas concluídas | Somente root no painel; mantém visita, revisão, autoria original e publicação. Autor/data da derivada registrados separadamente. |
| `GET /api/collector/photo?id=...&size=thumb` | Miniatura no coletor e galerias legadas | Mesmos perfis, unidade, estado e provedor da leitura integral. |
| `GET /api/inventory/photo?id=...&size=thumb` | Miniatura no painel | Perfis desktop e escopo da galeria, sem acesso de operador. |
| `GET /api/inventory/in-progress-photo?id=...&photoId=...&size=thumb` | Miniatura parcial | Visita aberta e foto recebida da mesma unidade/visita; nunca publica a coleta. |

POST binário exige `Content-Type: image/jpeg`, `X-CSRF-Token`, `X-Photo-Id`, `X-Inspection-Id`, `X-Source-SHA256`. O hash deve corresponder ao original confirmado. O upload integral passou a devolver `sha256` junto de `status: ready`, sem remover campos anteriores. Repetições de miniaturas já existentes são idempotentes; não substituem uma derivada válida. Foto removida, alterada ou ainda pendente não recebe miniatura. A gravação inclui verificação de estado no UPDATE para proteger a concorrência.

A leitura verifica autorização, unidade ativa, estado e provedor **antes** de servir miniatura ou 304. `ETag` usa o hash da miniatura, distinto do integral. `Cache-Control: private, no-cache`, `Vary: Cookie`, MIME JPEG e `nosniff`; revogação ou troca de provedor impede reaproveitamento sem autorização. Não é cache offline nem cache público. Miniatura ausente/incompatível cai na leitura integral privada. Pedir a URL sem `size=thumb` continua entregando a fotografia completa.

Uma miniatura existente usa duas consultas de domínio (foto/escopo e integração) e **zero requisições ao Drive**. O Worker faz ainda uma consulta de sessão: três consultas totais. Não confundir esse número com o total por página, que inclui listas e demais blocos. Não há alegação de duas consultas incluindo autenticação.

## Clientes e compatibilidade

Coletor atual: envia automaticamente o original e depois a miniatura, sem botão adicional. Falha na miniatura não reenvia nem desfaz o original e não conta como fotografia pendente. A interface informa que a foto foi recebida e a miniatura ficou pendente. O root pode prepará-la depois. Cliques nas fotos recebidas abrem uma janela com a fotografia completa; câmera, galeria, remoção, 0–5 fotos e vínculos permanecem.

Painel: Panorama, galeria de unidade, consulta de equipamento, ocorrências e coleta em andamento pedem miniaturas com dimensões reservadas, carregamento adiado e decodificação assíncrona. Ampliação pede o integral. Legendas resolvidas no servidor informam tipo, ambiente/posição quando existentes, data e autor. Dados publicados usam a ficha publicada e snapshots de ambientes; rascunhos não vazam para a legenda oficial. Nenhuma nova aba Fotografias.

**Configurações → Miniaturas de fotografias → Gerar miniaturas pendentes**, root: baixa somente os originais pendentes, confere SHA-256, prepara localmente e envia derivadas. Até 20 por clique, com progresso, continuidade paginada e lista de falhas. Recomeçar a consulta permite tentar falhas anteriores sem repetir as prontas. Manter a aba aberta; não é tarefa em segundo plano durável. Nenhuma foto de teste é criada por essa manutenção.

HEIC/HEIF: primeiro tenta decodificação nativa; fallback local `heic-to 1.6.7` CSP, carregado sob demanda, sem enviar arquivo a um conversor externo. Origem, licença e hash em `web/vendor/heic-to/ORIGEM.txt`. Biblioteca independente LGPL-3.0, original sem modificações, fonte correspondente indicada. Primeira conversão pode demorar mais devido ao carregamento/decodificação. APIs nativas documentadas em https://developer.mozilla.org/en-US/docs/Web/API/Window/createImageBitmap e biblioteca em https://github.com/hoppergee/heic-to. Homologação física continua necessária.

## Exclusão, backup e retorno

Derivadas estão na mesma linha da fotografia: excluir essa linha pelo fluxo autorizado remove também a miniatura, sem objeto órfão separado. Backup D1 passa a incluir BLOBs privados. Não publicar dumps no Git nem em logs. Backup dos originais continua independente no Drive/R2. Autorizações, chaves e processo de recuperação não mudaram.

Retorno de código: versões anteriores ignoram as colunas e continuam lendo o integral. Não remover as colunas nem restaurar dados antigos sobre a produção. Futuras mudanças de provedor precisam preservar metadados de origem e as verificações de acesso.

## Otimização desktop D-104 (12/11/2026)

No Worker do painel, as duas consultas de domínio agora são enviadas no mesmo batch D1. Com a consulta de sessão: três instruções SQL, duas chamadas ao binding (antes três chamadas). Perfis que exigem consultas adicionais continuam executando-as. Nenhuma autorização é reutilizada entre requisições; integração/foto são lidas novamente inclusive para 304. Pedido de original não seleciona thumb_blob. Worker do coletor permanece na versão publicada anterior. Ver [D-104](../03-painel-desktop/DESEMPENHO_D104.md).
