# SEMED Técnico — Android 1.0.1

Pacote `br.gov.ma.pacodolumiar.semed.tecnico`, Android 8+ (API 26), target 35. WebView da interface própria `/tecnico`, LocationService para acompanhamento ativo e NoticeJob para avisos periódicos. Não inclui navegação do painel nem coletor.

## Build e assinatura

`pnpm build:technician:android`: JDK 21, plataforma Android 35 e Build Tools 35.0.0 em `private-data/android-toolchain/`. Estrutura: `jdk/<jdk>/bin`, `platform/<android>/android.jar`, `tools/<build-tools>/aapt2.exe`. Usa javac, D8, aapt2, zipalign e apksigner oficiais; sem Gradle ou bibliotecas Android externas.

Ferramentas utilizadas e SHA256:

- Temurin 21.0.13+9 Windows x64 (Adoptium oficial): a4dbaa05fca4bd89d84584e58c459bd732efebb1722af80ab13c6516832004f9.
- Google platform-35_r02.zip: 0988cacad01b38a18a47bac14a0695f246bc76c1b06c0eeb8eb0dc825ab0c8e0.
- Google build-tools_r35_windows.zip: 5753c679a1b90bcf6fbc9945a2ce39dfb9e74f1df0831a1e1866ae5b594326f0.

Saída: `private-data/releases/SEMED-Tecnico-1.0.1.apk` e JSON com hash/certificado/instante. O nome deriva do manifesto (versionCode 2). `build:desktop` copia essa versão para `/tecnico/SEMED-Tecnico.apk`; conferir presença antes do deploy. Alterar Java exige novo APK; frontend/API atualizam no servidor. A versão 1.0.1 encaminha o botão Voltar primeiro à interface: fecha folha ociosa ou retorna de Avisos/Concluídos para Fila antes de sair. Uma operação em envio permanece protegida. Não adiciona permissões, rastreamento entre demandas ou push.

Assinatura RSA 3072, APK v2/v3. Certificado SHA256 `74458344d426bf1b00b82d9f5b2f106e0600497e2d788a54245721a37a9b3850`.

**Guardar em cofre privado** `private-data/android-signing/semed-tecnico.keystore` e `config.json`. Não versionar ou enviar no chat. O script agora interrompe se faltar a chave/configuração e confere o certificado antes de liberar a saída: para atualizar APK distribuído, restaurar a MESMA chave; não gerar outra. Pasta privada local não substitui backup institucional externo. Perder a chave impede atualização com a assinatura anterior.

## Segurança e limites

HTTPS fixo do painel, WebView restrito à interface técnica; Maps abre app externo. Sem file/content access, conteúdo misto, senha ou segredo embutido. Cookie HttpOnly privado do WebView, CSRF e permissões no Worker. Não compartilhar credenciais do aplicativo com o Google Maps.

Aceite com permissão Android e posição atual inicia foreground service location com notificação visível. Sem permissão permanente de localização em segundo plano; sem iniciar localização no boot. Não guardar coordenadas em arquivo/fila offline. Encerramento/revogação/sessão vencida impedem novos envios.

JobScheduler de avisos: periódico de 15min com rede, podendo ser adiado pelo Android. Não é FCM/push imediato. App aberto consulta a cada 15s. Android 13+ pede permissão de notificações.

Fontes oficiais: [localização](https://developer.android.com/develop/sensors-and-location/location/permissions), [restrições foreground](https://developer.android.com/develop/background-work/services/fgs/restrictions-bg-start), [permissões](https://developer.android.com/training/permissions/requesting).

## Homologação física pendente

Instalação, GPS real, tela bloqueada, fabricante/economia de bateria e avisos Android precisam ser conferidos em aparelho. Compilação e navegador com GPS simulado não homologam esses itens. Seguir `docs/06-entregas/ROTEIRO_TESTES_TECNICO_D105.txt`.

Redesenho D113: fila compacta com Próxima parada/Agora, folhas de ação com confirmação do servidor, abas Fila/Concluídos/Avisos. Páginas extras permanecem com aviso e atualização explícita; avisos consultam demanda autorizada no clique. Uma intenção incerta conserva texto e operationId até confirmação, somente na memória da página. Não é offline durável. Registro: `docs/05-qualidade/APP_TECNICO_D113_2026-11-13.md`.
