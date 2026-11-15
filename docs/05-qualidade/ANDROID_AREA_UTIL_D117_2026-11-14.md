# D-117 — botão da coleta encoberto pela navegação do Android

## Evidência e causa

O responsável enviou `codex-clipboard-793bb041-c176-433a-bf0f-50420fe1120e.png`: na fachada da Biblioteca, o botão Continuar aparece sob a barra de três botões do Android. Aparelho informado: Samsung Galaxy M54; versão Android não informada. Pediu compatibilidade além desse modelo.

No APK 1.0.3, `MainActivity` usava a própria WebView como conteúdo da Activity sem tratamento explícito de insets. O manifesto usa target 35. Android 15+ impõe edge-to-edge para esse target; o CSS da coleta usa safe-area, mas a janela nativa e seus iframes não tinham garantia de área útil. O sintoma é compatível com essa lacuna; não foi deduzida a versão do Android do aparelho pela imagem.

Documentação oficial consultada: [edge-to-edge nas Views](https://developer.android.com/develop/ui/views/layout/edge-to-edge), [insets na WebView](https://developer.android.com/develop/ui/views/layout/webapps/understand-window-insets), [WindowInsets](https://developer.android.com/reference/android/view/WindowInsets). O suporte CSS varia por versão da WebView; o tratamento nativo evita depender dele para delimitar os controles.

Consultados no repositório: 00_LEIA_ANTES_DE_TUDO, AGENTS, regras de precedência, decisões/pendências/conflitos; contrato APP_UNIFICADO_D115, qualidade D115/D116 e android/technician/README. As fontes originais e as decisões de coleta já lidas na integração D116 permanecem inalteradas. Escopo: janela Android; nenhuma nova pergunta ou regra de inventário.

## Alteração

- `SafeWebViewport.java`: FrameLayout envolve a WebView e reduz sua área real, incluindo todos os iframes.
- Android 11+ usa `setDecorFitsSystemWindows(false)` e `WindowInsets` de barras do sistema, recortes e teclado. A união usa o máximo por borda, sem somar teclado e barra. Novos insets substituem o padding anterior (sem acumulação ao girar/abrir teclado).
- Os insets já tratados são zerados antes de chegar à WebView. Não retorna CONSUMED, permitindo a atualização quando o teclado fecha e evitando espaço duplicado por CSS/viewport.
- Android 8–10 conserva o ajuste padrão do sistema e `adjustResize`. Compatibilidade mínima permanece Android 8; não significa homologação física de todos os aparelhos/fabricantes.
- `MainActivity` usa esse contêiner, preservando navegação, câmera, cookies, pontes e serviços.
- Manifesto: APK **1.0.4 / versionCode 5**. Mesmos pacote e certificado; todas as permissões e serviços anteriores preservados.
- Verificador remoto passou a ler versão/tamanho do manifesto e JSON de release, removendo constantes da versão antiga.

Nenhuma alteração em questionário, frontend entregue D116, Worker/API, banco, migração, plano, cron, Drive ou duração da localização. O deploy do painel apenas distribui o novo APK junto dos assets existentes. Coletor independente não exige deploy.

## Validação e limites

- Build com SDK 35 e assinatura v2/v3 verificada. Certificado SHA-256 `74458344d426bf1b00b82d9f5b2f106e0600497e2d788a54245721a37a9b3850`, igual ao APK anterior.
- `test-technician-android.mjs`: 21 verificações TrackingPolicy + 20 MobilePolicy, JVM. Não são execução de lifecycle/GPS Android.
- `mobile-app-browser.cjs` e `technician-tracking-browser.cjs`: aprovados com Worker/SQLite reais isolados e ponte/GPS simulados. Não acessam dados oficiais.
- Novo `mobile-safe-viewport-browser.cjs`: primeiro reproduz o rodapé coberto com viewport sem reserva; depois verifica a UI real dentro de uma área nativa simulada. Seis dimensões/modos (360×800 botões; 412×915 gestos; 320×640; paisagem 800×360 com barra à direita/esquerda; tablet 800×1280), mais abertura/fechamento de teclado. Verifica hit-testing do botão, limites horizontais/verticais, campo e Salvar compacto visíveis, restauração do rodapé e preservação de texto. Sete cenários aprovados.
- O wrapper do teste permite enquadrar `/app` **somente no servidor isolado** para modelar a WebView. CSP/X-Frame-Options de produção não foram alterados.
- Não há emulador Android configurado nem aparelho conectado nesta execução; imagens são simulações de layout em navegador e estão identificadas como tal. Falta conferir o novo APK no M54: barras, rotação, teclado, câmera/galeria, retorno ao app e manutenção do GPS durante fila ativa. Não declarar esses testes físicos aprovados.

Registros e screenshots: `private-data/release-app-insets-104/`. Nenhum equipamento, resposta, demanda ou foto de teste foi gravado em produção.

## Distribuição

APK local: `private-data/releases/SEMED-Tecnico-1.0.4.apk` (33.246 bytes), SHA-256 `f258f5f8a483a52d092d9a0d4d8bceba89654256524dae24a28b369c397a82a5`.

Instalar como atualização sobre a versão existente. Antes, terminar salvamentos/envios de fotos; não desinstalar, não limpar dados, não forçar parada durante atendimento. Reabrir depois da atualização; Android pode interromper o processo durante troca do APK, por isso conferir que a notificação/localização voltaram se houver fila ativa. Nenhum novo aceite, permissões adicionais ou novo login é imposto por esta correção; expiração normal de sessão continua valendo.

Download: https://painel-semed-paco.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev/tecnico/SEMED-Tecnico.apk?v=1.0.4

O APK 1.0.3 continua preservado para diagnóstico. Não recomendar downgrade/desinstalação como rollback: qualquer correção Android posterior deve incrementar o versionCode mantendo assinatura. Estado final do deploy e hash remoto serão registrados abaixo.

### Publicação confirmada

Publicado em 14/11/2026 às 13:12:44 Fortaleza (16:12:44 UTC), painel `5f5227b9-fc7c-45e8-abf9-1998baa7ae49`, 100% do tráfego. Coletor independente mantido em `e90229c7-e2cf-44ec-adb6-598fe1557113`. Trinta e duas verificações remotas aprovadas: 14 do app, 11 técnicas, sete das barreiras de tracking. Hash remoto e tamanho do APK iguais aos locais registrados acima. Download público confirmado como versão 1.0.4; nenhum dado oficial de teste criado. Registros `deploy-panel.log`, `versions-after.log` e `producao/` na pasta privada de evidências. Limites físicos permanecem os descritos acima.
