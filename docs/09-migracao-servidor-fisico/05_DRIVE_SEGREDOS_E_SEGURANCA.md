# 05 · Fotos, OAuth, segredos e acesso

## PROPOSTA: conservar o Drive no primeiro corte

Hoje originais são privados no Drive. D1 guarda metadados e miniaturas JPEG derivadas limitadas a 320 × 320 px / 64 KB, conforme D-072. Avatares técnicos são PNGs derivados até 128 px / 64 KB no Drive, com metadados/versões/eventos no D1. Não ampliar a exceção das miniaturas para guardar originais em SQL.

Conservar o mesmo provedor, cliente OAuth e IDs reduz a quantidade de mudanças simultâneas. Migrar o banco não exige mover arquivos Google. Entretanto é necessário provar leitura, upload, renovação e exclusão autorizada a partir do servidor novo; acesso no navegador não prova que a integração do backend esteja pronta.

## Nomes de segredos que a equipe precisa receber em cofre

| Nome atual | Uso | Efeito de perder/trocar indevidamente |
|---|---|---|
| `AUTH_PEPPER` | Componente do hash de senha | Senhas existentes deixam de validar |
| `GOOGLE_CLIENT_ID` | Cliente que autorizou o Drive | Outro cliente não é automaticamente autorizado aos mesmos arquivos |
| `GOOGLE_CLIENT_SECRET` | Fluxo OAuth/renovação | Renovação e autorização podem falhar |
| `GOOGLE_TOKEN_KEY` | AES-GCM de tokens persistidos, 32 bytes base64 | Tokens do dump não podem ser decifrados |
| `CLOUDFLARE_ANALYTICS_TOKEN` | Leitura Account Analytics do medidor D1 | Medidor indisponível; não deve impedir login/negócio |
| Chave Android + configuração privada | Assinar atualização do APK distribuído | Novo certificado não atualiza a instalação existente |
| Segredo/certificado da ponte, se escolhida | Autenticar borda → servidor | Origem/metadados podem ser forjados se mal configurados |

O último item é **novo/proposto**, não variável já implementada. Registrar responsável, finalidade e rotação, nunca o valor. `PHOTO_STORAGE_PROVIDER`, `APP_KIND`, `AGENTES_EXIGIR_AUTORIZACAO` e hosts são configurações, não substituem os segredos. Não copiar o token amplo do Wrangler para o backend.

## Google OAuth e novo endereço

Callback atual: `/api/root/google/callback` no host do painel. Cadastrar exatamente a URL HTTPS nova no cliente OAuth correto antes de iniciar reautorização. Testar state, cookie temporário, retorno ao root e renovação. Não criar automaticamente outro projeto/cliente ou tornar pasta pública para contornar falha.

O escopo atual é `https://www.googleapis.com/auth/drive.file`. Preservar conta, pasta e referências do app; autorização nova não deve ser considerada acesso irrestrito a todo Drive. [Fluxo OAuth web server e redirect URI](https://developers.google.com/identity/protocols/oauth2/web-server).

Os dois contextos da aplicação compartilham a mesma integração/chave. Se só um servidor recebe o segredo, a foto pode aparecer no painel e falhar no coletor. Provar as duas direções e permissões com perfis reais de homologação; nunca enviar foto de teste ao cadastro oficial sem autorização específica.

## Envio/consistência de arquivos

Não existe commit distribuído atômico entre Drive e banco. Preservar estados pendentes/ready, recibos, filas de exclusão e tratamento de órfãos. No corte, drenar uploads e confirmar seus metadados ou bloquear novos envios de forma explícita. Arquivo recebido sem ACK não é sucesso para o usuário.

Preparar manifesto privado: photo ID, provedor, file ID, tamanho/hash quando disponível, alvo/unidade/visita e estado; conferir amostra de leitura e cobertura de todos os IDs. Avatares entram em manifesto próprio. Miniaturas precisam manter o vínculo e fallback para original. Original jamais deve ser substituído pelo derivado no backup.

Se futuro armazenamento físico for escolhido, criar adaptador privado com leitura autenticada/streaming, nomes internos por ID, proteção de path traversal, limites de MIME/tamanho, backup e reconciliação. Não devolver caminho de disco ao navegador nem servir fotos via pasta pública. Essa mudança fica fora da primeira migração proposta.

## Autenticação SEMED a preservar

PBKDF2 SHA-512 com 100.000 iterações, salt por usuário e pepper. Criação por root com senha provisória escolhida; senha definitiva 6–256 caracteres, composição livre, sem consulta de vazamentos. Primeiro acesso/troca obrigatória seguem dados existentes, não são redefinidos pelo destino.

Cookie `__Host-semed`, Secure/HttpOnly/Path=/ e política SameSite atual; CSRF e Origin em escritas humanas; sessão/usuário/versão da credencial verificados a cada requisição. Mudança de domínio pode exigir novo login; isso não autoriza reset de senha. Definir se sessões antigas serão explicitamente encerradas no corte ou preservadas no host da ponte, com regra equivalente e autoria.

Root/admin/operador/visualizador têm capacidades diferentes. Técnico é habilitação específica. Não liberar administração porque a chamada veio da LAN nem confiar em role/userId enviado pelo frontend. Rotas de máquina assinadas não usam sessão humana e mantêm verificações próprias.

## Logs e configuração

Logar ID da requisição, família de rota, status, duração e erro sanitizado. Não registrar bodies, cookies, Authorization, QR/token, código de instalação, localização exata, senha ou tokens Google. Endereços de rota contendo parâmetros sensíveis precisam de sanitização. Métricas agregadas não devem exibir SQL.

Aplicação com usuário de serviço e acesso somente aos diretórios necessários. Cofre/arquivo de ambiente restrito, fora do checkout/release e do diretório servido. Backups cifrados e chave de recuperação separada. Somente restore isolado de prova demonstra que o conjunto banco + arquivos + chaves está recuperável.
