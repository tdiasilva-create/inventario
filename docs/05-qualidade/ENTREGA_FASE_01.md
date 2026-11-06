# Entrega fase 01 — fatia inicial da coleta mobile

Data: 27/10/2026. Classificação: protótipo DEMO executável, sem integração. Levantamento anterior ao código: `docs/00-governanca/REVISAO_INICIAL_E_PLANO.md` (índice nominal, decisões, telas, conflitos e plano).

## Cobertura observada do TXT

| Fonte original | Cobertura nesta fase | Ainda falta |
|---|---|---|
| §§1.3, 3.1–3.4 | Componentes dark-tech mobile; seleção DEMO existente; cartões A–H; wizard Próximo/Voltar; sem percentual geral; retrato/rotação sem bloqueio | Homologação em aparelhos reais |
| §2.4–2.6 | Unidade pré-cadastrada DEMO, sem criar escola; aviso na troca; contexto de unidade | Catálogo oficial, permissões servidor, vistorias multidia/multicoletor |
| §3.2 | Etapa de localização bloqueada até ambiente B, com atalho; demais cartões acessíveis; respostas mantidas entre etapas | Todas as demais dependências do questionário |
| §3.3 | A com conclusão manual DEMO; reabrir exige confirmação; cancelar preserva concluído | B–H só concluirão após implementação/validação integral |
| §4.A | Resumo de contexto DEMO, responsável/cargo/observações opcionais | Metadados oficiais automáticos de autenticação e vistoria |
| §4.B | Identificação de ambiente relevante com nome e ID de rascunho; disponível em F | Contagem por tipos; catálogo institucional e demais integrações |
| §4.F.1–3 | Computador desktop individual; ID interno; patrimônio texto; alternativas de identificação por texto/atalhos; conservação, funcionamento, uso; problema/ação/prioridade; revisão/edição do mesmo item no rascunho | Demais categorias, lotes, lista de problemas por categoria, duplicidades e persistência histórica |
| §4.F.4 | CPU, RAM, armazenamento e SO opcionais para desktop | Fichas técnicas das outras categorias |
| §4.G | Cartão consulta o mesmo conjunto de F filtrado para audiovisual; nenhum segundo cadastro | Categorias audiovisuais executáveis; filtro permanece vazio nesta fatia |
| §5.1–2, 5.4–5 | Galeria, input nativo de câmera, prévia decodificada, remoção, nova seleção; limite cinco, rejeição de vídeo/documento; zero fotos permite ficha no rascunho | Câmera física/negativa de permissão; compressão; fotos de infraestrutura/justificativas; R2 |
| §§7.1, 13 | Botão Salvar com aviso honesto de memória; item/cartão/vistoria separados; revisão com envio indisponível | Autosave durável, estados reais de sync, confirmação do servidor |
| §8.4 | Tela usuário/senha; submissão informa integração ausente; DEMO tem entrada própria | Autenticação completa, perfis, reset, sessões e autorização |
| §§4.C/D/E/H, 6–10 | Requisitos preservados em documentos, sem falso funcionamento | Formulários completos, configuração/versionamento, offline criptografado, concorrência, conferências, histórico, backups e restauração |

Não há `Salvo no dispositivo`, `Sincronizado` ou `Vistoria concluída` fictícios. O rascunho se perde ao recarregar/fechar a aba. Navegador pede confirmação de saída quando possível. Nenhum dado DEMO é gravado em D1/R2.

## Testes e evidências

- `node --test tests/domain.test.mjs`: 5 testes aprovados (opcionais, falha condicional, identificação/ambiente, limites/mídias, cartões incompletos).
- `node --check web/app.js`: sintaxe aprovada.
- `node tests/browser.cjs`: fluxo de navegador Chrome desktop via Playwright/Chromium; resultados em `evidencias/fase-01/resultado-browser.json`. Busca/vazio, ausência de criar escola, conclusão/reabertura/cancelamento, preservação de respostas, dependência F→B, bloqueio de conclusão B, patrimônio com zeros, CPU opcional, atributo capture, galeria/prévia/remoção, item com zero fotos, edição, revisão sem envio, quatro larguras sem overflow e ausência de erros JavaScript.
- WebKit não executado: binário ausente. Chrome Android e Safari iPhone físicos não testados. Largura mobile em Chrome desktop não substitui homologação mobile.
- SHA256 confirmou que `BASE_DE_COLETA_V1_0_ORIGINAL.txt` e `06_ESPECIFICACAO_TELA_A_TELA.md` avulsos são idênticos aos equivalentes do pacote.

Capturas reais:

| Tela | Arquivo |
|---|---|
| Login | `evidencias/fase-01/01-login-390.png` |
| Início | `evidencias/fase-01/02-inicio-390.png` |
| A–H | `evidencias/fase-01/03-cartoes-390.png` |
| Identificação de desktop | `evidencias/fase-01/04-identificacao-390.png` |
| Foto de teste sintética (pixel), prévia e remover | `evidencias/fase-01/05-fotos-390.png` |
| Revisão | `evidencias/fase-01/06-revisao-390.png` |
| Responsividade | `evidencias/fase-01/07-revisao-430.png`, `07-revisao-844.png`, `07-revisao-1440.png` |

## Comparação visual com referência aprovada

Comparadas visualmente capturas reais de cartões, identificação e fotos com `design/referencias/mobile/00_coleta_mobile_APROVADA.png`: preservados fundo azul-marinho, azul elétrico, ciano, formulários escuros, ícones de traço e cartões cromáticos. Não se usou PNG como background. Sem brasão/fachada/escolas/distâncias fictícias. Cartões seguem A–H em vez das categorias ilustrativas. Indicador do wizard é local ao item; não existe percentual geral.

Variações ainda PROPOSTAS: identidade tipográfica, símbolo genérico de edifício sem brasão, aviso DEMO, login e casos vazios. Botões do wizard foram colocados no fluxo da página após inspeção detectar sobreposição com campos na versão sticky. Nenhum layout é declarado reprodução pixel a pixel.

## Arquivos alterados/criados

Pacote documental extraído integralmente, originais preservados; `docs/00-governanca/REVISAO_INICIAL_E_PLANO.md`, `docs/00-governanca/RASTREABILIDADE.md`, este relatório e evidências; `web/index.html`, `web/styles.css`, `web/app.js`, `web/domain.js`, `scripts/serve.mjs`, `tests/domain.test.mjs`, `tests/browser.cjs`, `package.json`, `DEVELOPMENT.md`.

Sem push, deploy, credenciais ou migrações. Próxima fatia recomendada: completar contagens/tipos B e catálogo de fichas F com rastreio campo a campo, antes de permitir conclusão desses cartões; depois conectar administração/Workers/D1/R2 conforme plano.
