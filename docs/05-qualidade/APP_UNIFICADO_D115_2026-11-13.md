# App unificado D-115 — publicação e APK 1.0.3

Estado: publicado após autorização explícita em 13/11/2026 às 19:13:57 Fortaleza. Entrada `/app` e APK 1.0.3 disponíveis, Worker `77c27c3b-b823-4a0e-a362-0854516403d0` com 100% do tráfego. Não houve migração de banco. Homologação em Android físico permanece pendente.

## Fontes, requisitos e arquivos

Consultados: `00_LEIA_ANTES_DE_TUDO.md`, `AGENTS.md`, `docs/00-governanca/REGRAS_DE_PRECEDENCIA.md`, `DECISOES.md`, `PENDENCIAS.md`, `CONFLITOS_DOCUMENTAIS.md`; íntegra de `docs/02-coleta-mobile/BASE_DE_COLETA_V1_0_ORIGINAL.txt`; `06_ESPECIFICACAO_TELA_A_TELA.md`, `02_TELAS_E_TRANSICOES.md`, `03_CATALOGO_E_MAPEAMENTO.md`, `04_FOTOS_E_ESTADOS.md`, `05_GUIA_VISUAL_MOBILE.md`, `REVISAO_E_ACOES_D089.md`; referência mobile `design/referencias/mobile/00_coleta_mobile_APROVADA.png` aberta visualmente; cinco PNGs de arquitetura e fontes DOT/manifesto; contratos de integração/permissões; qualidade D089, código e testes atuais de fotos/QR, D113/D114. Imagem dark-tech e diagramas históricos não substituem decisões atuais de identidade, Drive e estado da implementação.

Requisitos: APK único com áreas independentes, mesma sessão, permissões por servidor, manter localização D114, preservar edição ao alternar, câmera/galeria/QR e conclusão manual. Aprovação específica conforme AGENTS recebida e publicação concluída; câmera/GPS físicos serão conferidos no aparelho do responsável. Não há dúvida de questionário a resolver nesta etapa.

Arquivos principais: `server/mobile-app.mjs`, `server/worker.mjs`, `shared/mobile-assets.mjs`; `web/mobile-app.{html,js,css}`, `web/collector-app.js` e integrações mínimas no coletor/technician; `android/technician/.../MainActivity.java`, `CollectionCamera.java`, `CaptureProvider.java`, `MobilePolicy.java` e manifesto; builds, testes e documentação. Detalhes: [contrato D115](../02-coleta-mobile/APP_UNIFICADO_D115.md).

## Testes executados

- Suíte Node completa: **301 aprovados, 0 falhas**. Inclui três testes D115: capacidades por papel/habilitação, senha obrigatória/CSRF/sessão revogada/frames de mesma origem e entrada nas áreas sem iniciar/encerrar atendimento. Os 298 anteriores permanecem aprovados.
- Android JVM: **21 verificações de TrackingPolicy + 20 de MobilePolicy**. Rotas permitidas, recusa de caminhos estranhos, nomes e limites de capturas. Não emula permissões Android, câmera ou GPS.
- `mobile-app-browser.cjs`: Worker real, SQLite isolado, cookies de navegador reais, sem chamadas de produção. Login único; aceite de demanda com ponte/GPS simulados; fotografia `ready`; navegação ao questionário V3; AnyDesk digitado e preservado em troca de área; acompanhamento nativo continua; QR com câmera negada, cancelado ao trocar; sessão vencida recuperada com mesmo usuário; confirmação de saída com pendência; conta operador sem habilitação técnica vê só coleta. Larguras 390/360 e paisagem 812.
- `collector-v3-browser.cjs`: fluxo do coletor independente, sete fotos, QR, respostas e conclusão aprovados. Navegação medida em 90 ms na máquina de testes, sem promessa de latência remota.
- `technician-tracking-browser.cjs`: fila/expiração/encerramento D114 preservados, com ponte nativa simulada.
- `technician-redesign-browser.cjs`: paginação, extras sob demanda, resposta atrasada, reenvio idempotente, Avisos e Voltar aprovados.
- `auth-flow-browser.cjs`: senha e navegação nos dois endereços independentes, oito screenshots, aprovados.
- Builds painel/coletor e APK assinados. Painel inclui módulo de coleta em montagem autenticada, sem tornar o desktop disponível ao operador.

## Evidências visuais conferidas

Arquivos locais em `docs/05-qualidade/evidencias/app-unificado-d115/`: `01-escolha.png`, `02-coleta-em-edicao.png`, `03-sessao-retomada.png`, `04-360.png`, `04-812.png`, `05-coleta-sem-habilitacao-tecnica.png` e `resultado.json`. Dados fictícios somente na fixture. Comparação: paleta branca/preta/vermelha/laranja e tipografia atuais preservadas; faixa superior com troca de área. Nenhuma pergunta adicionada ou retirada.

## Binário e limites

APK: `SEMED-Tecnico-1.0.3.apk`, versionCode 4, 33246 bytes. SHA-256 `6aebf056b489200456eb7f0a596d28c0f89fc6b0b68e13b29c98f9f585120a81`. Certificado SHA-256 `74458344d426bf1b00b82d9f5b2f106e0600497e2d788a54245721a37a9b3850`, igual ao anterior, assinatura APK v2/v3 validada. Material de assinatura permanece privado, fora do Git.

Pendente: atualização e ensaio no Android físico (permissão de câmera negada/concedida, galeria, QR real, teclado, rotação, localização com Coleta aberta/tela bloqueada, fila encerrada). APK por si só não corrige perda de dados quando o processo é morto; não há offline durável. Não foi usado emulador/dispositivo físico. Não houve seed, alteração de contas/demandas, exclusão ou foto de teste no D1/Drive oficial.

Base original coberta nesta entrega: login/permissões, escolha de unidade oficial, continuidade do questionário, câmera/galeria, associação de fotos a registros e estados separados. Mantidos conclusão manual, versões/travas, histórico e QR. Demais lacunas da Base, especialmente offline durável e homologação física, permanecem pendentes.

## Publicação real — 13/11/2026

D-115 — responsável autorizou expressamente “Sim, publicar e disponibilizar o APK 1.0.3”. Publicado em 13/11/2026 às 19:13:57 Fortaleza (22:13:57 UTC): painel `77c27c3b-b823-4a0e-a362-0854516403d0`, 100% do tráfego, código `3c602eb`. APK 1.0.3/código 4, hash remoto igual ao binário assinado. 83 verificações HTTP aprovadas e entrada /app conferida visualmente em 390×844, sem login real submetido. Sem migração, seed ou alteração de contas/demandas/fotos; coletor `c678978a-9e71-4cab-a2dc-9744ec6d6e1c` preservado. Regras de localização e plano gratuito mantidos. Publicação resolvida; teste de câmera/QR/GPS no Android físico permanece pendente. Ver [qualidade D115](APP_UNIFICADO_D115_2026-11-13.md).

- Worker anterior: `86bf05ea-388b-4c07-ab1c-becf9cbfe46d`; rollback de código disponível, sem esquema a reverter. Nenhuma exportação/bloqueio do D1 foi necessária nesta publicação somente de código/assets.
- Configuração `wrangler.jsonc`: D1, KV, Drive e os dois agendamentos preservados. Nenhum segredo/contratação alterado.
- `verify-mobile-release.mjs`: 14 checks; `verify-panel-release.mjs`: 51; `verify-technical-release.mjs`: 11; `verify-tracking-release.mjs`: 7. API sem sessão recusada, montagens de coleta redirecionam à entrada, assets conferidos com o build e APK 33246 bytes/SHA-256 iguais.
- Verificador técnico atualizado para a política de frame de mesma origem aprovada D115; nenhuma liberação a origens externas.
- Screenshot real: `evidencias/app-unificado-d115/producao/login-390.png`, visualmente conferido; sem overflow/erros JavaScript. Autenticação e operações foram ensaiadas localmente com Worker real e SQLite isolado, não executadas com dados oficiais nesta conferência.
- Registros privados: `private-data/d115-deploy.txt`, versões antes/depois e JSONs de evidência. Roteiro e APK copiados para Downloads/SEMED-App-1.0.3-2026-11-13.

APK público:
https://painel-semed-paco.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev/tecnico/SEMED-Tecnico.apk

Entrada:
https://painel-semed-paco.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev/app
