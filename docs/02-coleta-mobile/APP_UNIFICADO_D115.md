# D-115 — um APK para Atendimento técnico e Coleta

Decisão do responsável em 13/11/2026: usar o mesmo aplicativo, alternar sem sair da conta, manter permissões e localização durante as demandas; implementar, testar e gerar o APK. Esta decisão supera apenas a exclusividade do APK técnico de D-105 e a restrição histórica a navegador da Base §3.5. Não altera o questionário, os perfis nem a duração da localização D-114.

## Interface e autenticação

- Entrada `/app` no mesmo Worker/origem do painel. Duas áreas: Atendimento técnico e Coleta. Sem painel gerencial dentro do APK.
- Uma sessão `__Host-semed`, HttpOnly, Secure, SameSite=Strict. Não transferir senha/cookie/token pelo endereço ou para o hostname do coletor. O coletor independente continua no endereço anterior e com sua própria sessão de navegador.
- `POST /api/auth/login` aceita `application: mobile`: permite papel de coleta ou habilitação técnica. Mantém senha, tentativas, expiração e troca obrigatória. Não autentica por conta Google/Drive.
- `GET /api/mobile/me` lê sessão atual e habilitação técnica. Devolve identidade/CSRF/mustChange e duas capacidades, sem conceder permissões. Não tem polling próprio; é consultado na entrada e troca explícita de área.
- Coleta: root/admin/operador. Técnico: conta individual habilitada pelo root, independentemente do papel. Visualizador habilitado como técnico continua impedido de coletar. Root sem habilitação técnica tem Coleta, mas não Atendimento técnico.
- API original revalida autorização em todas as operações. Esconder botões não é a barreira de segurança.
- `GET /api/mobile/units` reutiliza o catálogo com escopo de coleta (unidades oficiais ativas elegíveis; obras/conveniadas fora), inclusive para root. Sem criar unidades, copiar cadastros ou inferir permissões.

## Composição e preservação do preenchimento

O shell mantém dois documentos internos da mesma origem, criados somente ao abrir cada área. `/tecnico?app=1` reutiliza a interface aprovada. `/app/coleta` abre a listagem; `/app/coleta/v3` abre o questionário atual. Montagens V2/visita são compatibilidade histórica. `shared/mobile-assets.mjs` fecha a lista de arquivos incluídos/servidos. Headers permitem incorporação somente na mesma origem para esses documentos, sem liberar o painel inteiro a frames externos.

Trocar de área esconde o documento, não recarrega ou conclui fichas/assuntos. Campos, prévias, recibos de operações incertas e posição da tela ficam na memória da sessão. Ao esconder a coleta, o leitor de QR encerra a câmera. O timer de consulta das demandas não lê fila na área escondida; o serviço de localização nativo é independente. O coletor não inicia um segundo serviço de GPS.

Ao expirar o login, os documentos ficam preservados e o shell pede o mesmo usuário. Recuperação atualiza CSRF e, quando necessário, renova a trava da ficha V3, conferindo a versão. Conflito continua explícito. Nenhuma troca automática para outro usuário com dados locais abertos. Sair da conta exige confirmação, informa quando há operação/preenchimento pendente, encerra localização e elimina documentos da sessão. Fechar pela navegação Voltar é bloqueado quando há conteúdo não enviado.

**Não é offline durável.** Respostas não enviadas e prévias ainda dependem da memória do processo. Encerrar/forçar parada, recarregar ou o Android matar o processo pode perdê-las. Antes de atualizar o APK, salvar e conferir confirmação do servidor. A rotação de tela é tratada sem reconstruir a Activity/WebView, mas não equivale a persistência após encerramento.

## Android, câmera e QR

APK 1.0.3, versionCode 4, mesmo package `br.gov.ma.pacodolumiar.semed.tecnico` e certificado. Nome exibido: SEMED. Android mínimo 8, target 35. Não desinstalar o APK anterior para atualizar.

- `MainActivity` inicia `/app`, mantém o serviço D-114 e limita navegação interna às rotas conhecidas. Navegação de ruas continua externa por ação do usuário.
- `CollectionCamera` implementa `onShowFileChooser`: Câmera usa aplicativo de captura do Android; Galeria usa seletor do sistema, apenas imagens, até cinco por seleção. Sem permissão de acesso geral a arquivos e sem microfone.
- `getUserMedia` do leitor QR só recebe VIDEO_CAPTURE, mesma origem confiável e permissão CAMERA concedida pelo usuário. Negação permite usar uma imagem do QR; não pede áudio.
- `CaptureProvider`, não exportado, concede temporariamente somente um URI aleatório no cache privado de capturas. Não expõe diretórios, chaves ou arquivos do app. Cancelamento limpa captura; arquivos concluídos antigos são limpos na próxima captura após 24 horas. Não são fila offline ou backup.
- Compressão, validação, limite de cinco fotos por registro, miniatura, upload automático, vínculo por ID e confirmação `ready` continuam no coletor e servidor existentes. Fotos completas permanecem no Drive privado em produção; não há upload direto do celular ao Drive ou credenciais do provedor no APK.
- A ponte nativa continua limitada ao domínio institucional. QR, foto e interface não alteram EXE nem protocolo de pareamento.

Referências de implementação Android: [WebChromeClient](https://developer.android.com/reference/android/webkit/WebChromeClient), [ACTION_IMAGE_CAPTURE](https://developer.android.com/reference/android/provider/MediaStore#ACTION_IMAGE_CAPTURE), [ContentProvider](https://developer.android.com/reference/android/content/ContentProvider).

## Localização e consumo

Nenhuma mudança em `LocationService`, `TrackingStore`, no protocolo de credencial restrita ou nas tabelas D-114. Primeiro aceite inicia acompanhamento, que continua ao alternar para Coleta, entre demandas e após expirar a sessão de interface, até terminar a fila ou sair/revogar conforme D-114. A credencial não autoriza consulta de demandas nem coleta. Abrir Coleta sem atendimento não liga acompanhamento.

O shell verifica que a identidade corresponde ao acompanhamento salvo. As consultas da fila pausam quando Atendimento técnico fica escondido; não foi criado timer adicional no D1. As capacidades usam duas leituras indexadas (sessão e habilitação) por requisição explícita. Carregamentos de telas/arquivos reutilizam autenticação existente. Não representa promessa de consumo total diário nem altera limites gratuitos.

## Operação e implantação

Sem migração: permanecem 33 migrações, D1/Drive/cron/Workers atuais. Publicação necessária somente do Worker do painel, que já possui backend de coleta e a integração privada. Não publicar o Worker coletor por causa desta entrega; seu navegador independente fica na versão existente. Build do coletor continua testado para compatibilidade futura dos helpers.

Comandos locais: `node --test --test-concurrency=1 tests/*.test.mjs`; `node scripts/test-technician-android.mjs`; `node scripts/build-technician-android.mjs`; `node scripts/build-desktop.mjs`; `node scripts/build-collector.mjs`; `node tests/mobile-app-browser.cjs`. O build exige a assinatura original privada e rejeita certificado diferente.

Após autorização específica, publicar painel com Wrangler e verificar `/app`, `/api/mobile/me` sem sessão, assets públicos, proteção das montagens privadas, hash remoto do APK e login real. Não alterar habilitação ou criar demanda real para testar. Rollback: versão anterior do Worker e APK 1.0.2 preservados; não há schema a reverter. Android não instala um versionCode menor como atualização comum: não recomendar desinstalar com dados pendentes; correção deve usar novo versionCode.

Estado e evidências: [qualidade D115](../05-qualidade/APP_UNIFICADO_D115_2026-11-13.md). Orientações para o celular: [roteiro TXT](../06-entregas/SEMED_APP_1_0_3_INSTALACAO_E_TESTES.txt).

Publicação autorizada concluída em 13/11/2026 às 19:13 Fortaleza: painel `77c27c3b-b823-4a0e-a362-0854516403d0` (100%), APK 1.0.3 disponível e hash verificado. Não houve migração nem publicação do Worker coletor; limites físicos no registro de qualidade acima.
