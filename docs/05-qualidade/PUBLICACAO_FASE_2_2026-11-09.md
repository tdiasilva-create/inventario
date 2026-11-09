# Publicação real — auditoria Fase 2 / D-072

Data: 09/11/2026. Código publicado: `2a43299`. Escopo: miniaturas privadas no D1, originais no Drive, preparo das fotos antigas, galerias e ampliação contextual. O responsável autorizou expressamente miniaturas no D1 e a continuidade das correções/publicações reais. Não encerra as Fases 3–5 da auditoria.

## Ambientes e versões

| Ambiente | Versão ativa (100%) | Publicado em Brasília |
|---|---|---|
| Painel | `c6a440fb-ae93-4bd2-879c-eaba507e2fbc` | 09/11/2026 07:05:31 |
| Coletor | `ef33d619-52da-4726-989c-6a49b551a899` | 09/11/2026 07:05:54 |

- Painel: https://painel-semed-paco.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev/
- Coletor: https://inventario-semed-lumiar.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev/
- Manutenção root: https://painel-semed-paco.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev/configuracoes

Versões e distribuição confirmadas por `wrangler deployments list` após os dois deploys. Preservados D1 compartilhado, provedor `google-drive`, cadastro automático dos agentes e os dois agendamentos do painel (monitor a cada minuto e manutenção diária). Sem criação de conta, alteração de senha ou publicação de segredos.

## Banco e preservação

Aplicada somente a migração aditiva `0020_photo_thumbnails.sql`, única pendente antes da publicação. Produção passa de 19 para 20 migrações. Backup anterior exportado e importado em SQLite em memória: integridade OK, zero erros de chaves estrangeiras, 995.328 bytes; SHA-256 `f4db7bcf01cc4a5fecf40bc99b3edd2702e565de42722997c3af2855cdfa4096`.

Backup, logs e consultas ficam exclusivamente em `private-data/release-fase2-2026-11-09/`, ignorado pelo Git. O log de exportação pode conter URL temporária assinada; não publicá-lo. O ensaio verifica o SQL, não equivale à restauração completa de Drive/chaves/infraestrutura.

| Contagem | Antes | Depois |
|---|---:|---:|
| Usuários | 8 | 8 |
| Unidades | 76 | 76 |
| Vistorias | 7 | 7 |
| Fotografias originais | 3 | 3 |
| Miniaturas | 0 | 3 |

Nenhuma inserção de exemplos, exclusão de original ou modificação de resposta foi feita durante a conferência. A ação root preparou derivadas das três fotografias existentes pelo fluxo da aplicação, conferindo o SHA do original. Total de BLOBs: **24.438 bytes**, maior largura 144 px e maior altura 320 px nesta amostra. Limite do contrato continua 320 × 320 / 64 KB por derivada.

## Verificações

- Antes de publicar: **139 testes de domínio/API e 11 roteiros de navegador**, dois builds e dois dry-runs aprovados. Resultados/limites no [aceite da Fase 2](CORRECOES_PRODUCAO_FASE_2_2026-11-09.md).
- Depois de publicar: **46 verificações HTTP públicas do painel** aprovadas; mais **10 respostas 401** das novas rotas e três rotas de imagem nos dois endereços, mesmo com `If-None-Match: *`. Sem sessão não há imagem, lista privada ou 304.
- Sessão real root: Configurações carregou Drive conectado, recebimento habilitado e três originais. “Gerar miniaturas pendentes” concluiu **3 de 3**.
- Navegação real: Ocorrências → evidência de equipamento da EM RAIO DE LUZ. DOM confirmou miniatura `size=thumb` decodificada em **144 × 320**; clique abriu integral em **720 × 1.600**, sem `size=thumb`, com unidade, autor, data e ambiente/posição. Não foi usado mock no ambiente real.
- Contagens e tamanho das derivadas conferidos por SELECT somente leitura no D1 depois do preparo.

Capturas reais em `docs/05-qualidade/evidencias/miniaturas-fase2-2026-11-09/` (privadas, fora do Git público): `06-producao-miniaturas.png` e `07-producao-foto-integral.png`. As cinco anteriores e `resultado.json` são ensaios locais identificados, não prova de rede/câmera física.

## Limites e próximos passos

Não foi criada nova foto ou vistoria fictícia no ambiente real. O fluxo de novo upload, recuperação de falha da derivada, permissões e HEIC passou nos testes controlados; ainda requer homologação em Android Chrome/iPhone Safari com câmera e rede reais. A redução de ~91% e os tempos 4G/3G pertencem à amostra simulada, não são medição de campo. Offline durável e Fases 3–5 permanecem pendentes. Perguntas, obrigatoriedade e limite de fotos por equipamento foram preservados.

Base coberta: §§5.3–5.5 (preparo, miniaturas, evidências, ampliação), exceção aprovada D-072 ao §5.6, §§7.5–7.6/7.11 (confirmação, estados e permissões). Contrato: [MINIATURAS_D072.md](../04-dados-apis/MINIATURAS_D072.md).

## Retorno de código

Se necessário, voltar os dois Workers às versões anteriores: painel `e7261a18-7138-4877-b5cb-fbd5a41fbc5f` e coletor `9de19a35-cf5d-4172-a894-450995f218ad`. As colunas aditivas podem permanecer; o cliente antigo lê o integral. Não apagar miniaturas, restaurar banco ou desfazer cadastros como parte de um simples rollback de código. Validar bindings/agendamentos e leitura privada após qualquer retorno. Nenhum rollback foi executado nesta publicação.
