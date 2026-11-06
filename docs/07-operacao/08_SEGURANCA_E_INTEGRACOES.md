# Segurança e integrações

## Contas SEMED

Quatro perfis preservados: root, admin, operador, visualizador. Root gerencia usuários/unidades e operações privilegiadas. Admin possui somente as permissões efetivas do servidor (inclusive reset de operador/visualizador conforme `canManage`); não confundir o nome com root. Operador coleta em unidades oficiais ativas, sem propriedade permanente. Visualizador consulta sem escrita. Ver D-031/D-035/D-046 e verificações em `server/`.

A autorização está no Worker, não no botão. Mudanças de host/proxy precisam preservar cookies `__Host-semed`, Secure/HttpOnly, proteção de origem e token CSRF nas mutações humanas. As sessões dos dois hosts são separadas mesmo compartilhando usuários.

Hash de senha atual: PBKDF2/SHA-512, 100.000 iterações, salt individual e `AUTH_PEPPER` adicional. Alterar o pepper sem migração apropriada impede validar senhas existentes. Não restaurar senhas em texto nem resetar todos os usuários silenciosamente durante transferência.

Verificação de novas senhas consulta Pwned Passwords por prefixo de hash. Se o destino bloquear essa saída HTTPS, cadastro/reset/troca podem falhar; registrar essa dependência.

## Google Drive

Configuração root no painel; callback `/api/root/google/callback`. Escopo `https://www.googleapis.com/auth/drive.file`. Arquivos acessados pelo Worker e vinculados no D1. Não expor refresh/access tokens, client secret ou chave de criptografia no frontend.

`GOOGLE_TOKEN_KEY` protege os tokens com AES-GCM; chaves de 32 bytes em base64, formato cifrado versionado no código. Manter chave e tokens correspondentes. A cópia de segurança da chave fica separada do dump, com acesso de recuperação. Se trocar a chave, precisa recriptografia/reautorização controlada; não basta editar variável.

Dois Workers compartilham integração, DB e segredos necessários. Uma foto pode falhar só no coletor se ele tiver segredo/configuração diferente do painel.

Estados a conferir: cliente configurado, conta autorizada, pasta acessível, renovação do token, upload recebido, registro ready, leitura autenticada. Uma captura antiga de “Conectado” ou uma fixture não comprova estado real atual.

Diagnóstico: conferir código de erro sanitizado, evento da integração, horário e request/target ID. Não copiar URL de autorização com tokens nem payload de segredo para chamados públicos. Correção OAuth não exige tornar a pasta pública.

## Agente Windows e QR

- Módulo servidor atual: `0.1.8-semed.2`.
- Produção aceita cadastro automático sem autorização de lote (D-058); vínculo continua humano autenticado.
- Assinatura ECDSA P-256/SHA-256 no formato P1363, chave pública JWK, timestamp/nonce e hash de corpo. Chave privada individual fica no Windows protegido.
- QR temporário, uso único, expiração e recibos precisam sobreviver a reenvio/resposta perdida. Código QR não equivale a senha root nem autoriza acesso gerencial.
- Preservar instalação, dispositivo, chave pública, equipamento e histórico de localização. Relógio do servidor/proxy deve estar correto.
- Ausência de heartbeat não prova que computador está desligado; pode haver falha de rede/serviço.
- Não coletar segredos pessoais ou transformar o agente em controle remoto. AnyDesk/RustDesk no formulário são identificadores opcionais, não senhas ou comando de acesso.

[Instalador registrado](../04-dados-apis/INSTALADOR_OFICIAL.md): `SemedAgente-InstaladorUnico.exe` é referência histórica D-056; D-058 registra candidato `SemedAgente-Instalador-0.1.8.exe` para cadastro automático, com hash. Nenhuma dessas notas equivale a homologação física completa ou substituição silenciosa de binário. Fontes/build/assinatura do EXE precisam integrar a transferência privada.

A manutenção diária expira cadastros automáticos nunca vinculados após 30 dias e aplica retenção. Não ligá-la num banco restaurado de ensaio antes de definir finalidade, datas e cópia segura.

## Repositório público

Sem dados operacionais, dumps, credenciais, executáveis ou capturas privadas. `.gitignore` e scanner reduzem risco; revisão humana continua necessária. Se um segredo for publicado, removê-lo do arquivo não o revoga: revogar/rotacionar e tratar histórico por procedimento específico, preservando recuperação das chaves de criptografia.

Não colocar licença geral nova, alterar políticas institucionais ou permitir acesso público às fotos como parte desta documentação.
