# Matriz de rastreabilidade — origens e destinos

## Orientações para novo instalador em lote — 05/11/2026

Origem: captura e diagnóstico sanitizado do responsável (`awaiting_grant` / `GRANT_USED`) e pedido de análise/orientação para 200 máquinas. Destinos: `ORIENTACOES_NOVO_INSTALADOR_LOTE_SEMED_2026-11-05.txt`, cópia em Downloads e pendências. Conferidos manifesto/hash D-056, fontes 0.1.6 disponíveis e servidor integrado. D1 consultado somente por SELECT sem códigos/segredos; autorização anterior de um uso esgotada. Três reproduções locais em `revisoes/diagnostico-instalador-2026-11-05/`, incluindo 200 cadastros/QRs pelo mesmo IP em memória e falha de recuperação após resposta perdida. Nenhum EXE executado/recompilado, dado oficial alterado, autorização emitida ou deploy. Proposta de pacote de lote não substitui aprovação/homologação do binário escolhido em D-056; correspondência exata entre seu fonte e binário ainda precisa de evidência.

## Diagnóstico de navegação e desempenho — 05/11/2026

Origem: pedido de análise da tecnologia/lentidão e resposta do responsável “Ao avançar ou voltar entre perguntas”. Destinos: `docs/05-qualidade/ANALISE_DESEMPENHO_COLETOR_2026-11-05.txt`, pendências técnicas propostas e `revisoes/desempenho-coletor-2026-11-05/` (ferramentas locais, medições e duas capturas). Código V2 inspecionado; reprodução com frontend/Worker reais do repositório, SQLite em memória e atraso artificial declarado. Produção consultada somente por GETs públicos, lista de deployments e SELECTs agregados, sem dados de respostas/credenciais no relatório. Confirmados bloqueio de navegação durante salvamento, status visual antigo e chamadas sucessivas ao D1. Sem modificação funcional, deploy, requisito novo aprovado ou afirmação de desempenho medido no celular real. Base original preservada.

## D-056 — referência persistente do instalador único, 04/11/2026

Origem: escolha explícita do responsável e arquivo original `C:/Users/SIGAE/Desktop/SemedAgente-InstaladorUnico.exe`. Destinos: `docs/04-dados-apis/INSTALADOR_OFICIAL.md`/`.json`, decisão D-056, AGENTS.md e guia inicial; cópia local por hash em `private-data/instalador-oficial/2026-11-04-35277f87/`. Conferência de tamanho, versão PE, assinatura e SHA-256 de original/cópia. Nenhuma execução, publicação ou homologação implícita. Entregas anteriores preservadas como histórico e superadas como recomendação padrão.

## Pacote do instalador para teste físico — 04/11/2026

Pedido do responsável: executável para outra máquina Windows. Destino: `C:/Users/SIGAE/Downloads/SEMED-AGENTE-TESTE-WINDOWS-0.1.6.zip`, EXE original conferido, configuração real e autorização de uma instalação por 24 horas. Guia e verificação em `docs/05-qualidade/ENTREGA_INSTALADOR_TESTE_WINDOWS_2026-11-04.md`. Nenhuma mudança no binário/servidor, instalação automática, senha humana distribuída ou declaração de homologação. Instalação e telemetria Windows continuam dependentes do teste físico.

## D-054/D-055 — produção V2/QR e teste solicitado, 04/11/2026

Origem: autorização explícita do responsável para publicar os dois ambientes reais e usar Drive existente; depois, pedido de QR com dados fictícios para testar no celular. Destinos: migração 0014 aplicada no D1 real, Workers coletor/painel publicados, gerenciamento root e formulário V2/QR disponíveis; registros em `docs/05-qualidade/PUBLICACAO_V2_QR_2026-11-04.md` e `QR_TESTE_SOLICITADO_2026-11-04.md`. Artefato `C:/Users/SIGAE/Downloads/QR_TESTE_SEMED_01.png`, emitido pela API real para `TESTE-QR-SEMED-01`, código temporário/uso único, sem criar escola/ficha automaticamente. Parser e decodificação jsQR conferidos; câmera/vínculo pelo usuário e EXE físico ainda não homologados. Os estados anteriores “somente local/não publicado” desta matriz são históricos, superados por D-054 apenas nos itens efetivamente publicados. Sem alterações na Base original ou regras do questionário nesta etapa.

## Fotografias via Google Drive — proposta D-047, 28/10/2026 (IMPLEMENTADO LOCALMENTE, NÃO PUBLICADO)

Origens: pedido do responsável em 28/10/2026 (configuração do Drive institucional como armazenamento privado, com restrições de segurança), `ORIENTACOES_INTEGRACAO_GOOGLE_DRIVE_SEMED.txt`, Base de Coleta v1.0 §5 (fotos), `docs/02-coleta-mobile/04_FOTOS_E_ESTADOS.md`, D-031/D-046 (perfis, exclusão com fila). Destinos: `server/photo-storage.mjs` (novo), `server/google-auth.mjs` (novo), `migrations/0013_photo_storage.sql` (nova, aditiva), `server/collector.mjs`, `server/visit-routes.mjs`, `server/unit-deletion.mjs`, `server/units.mjs`, `server/worker.mjs`, `web/desktop.js` (bloco root em Configurações), `web/visit.js` (texto), `package.json` (suíte), `tests/photo-storage.test.mjs`, `tests/google-worker.test.mjs`, `tests/helpers/fake-drive.mjs`, comentários em `wrangler.jsonc`/`wrangler.collector.jsonc`. Documentos: `docs/04-dados-apis/INTEGRACAO_GOOGLE_DRIVE.md`, `docs/05-qualidade/TESTE_FOTOS_GOOGLE_DRIVE.txt`, `docs/05-qualidade/RELATORIO_TESTES_GOOGLE_DRIVE.md`, D-047 (proposta) em DECISOES.md, bloco em PENDENCIAS.md, seção em DEVELOPMENT.md. Regras de foto, perfis e Base original preservados; R2 preservado como provedor alternativo. Nenhuma publicação, segredo, migração remota, projeto Google ou dado real foi criado ou alterado.

## Ícones superiores — D-026, 27/10/2026

Referência `design/referencias/desktop/05_icones_superiores_APROVADOS.png` aplicada somente aos cinco indicadores: `web/metric-icons.js`, `desktop-metrics.css`, import/chamada em `desktop.js` e carregamento em `index.html`. Retirados fundos individuais das caixas; mapa e arquivos compartilhados preservados por comparação SHA256 e posição/dimensão. Evidências em `docs/05-qualidade/ICONES_SUPERIORES_01.md`. Nenhuma mudança funcional TXT.

## Exemplos de locais — D-025, 27/10/2026

Fonte planilha aba 1835004469, tipo UNIDADE ADMINISTRATIVA: CME, SEADEX, SEMED e CENTRO LUMINENSE DE CONHECIMENTO. `web/data/map-examples.json` alimenta camada cartográfica de referência independente da matriz DEMO e do catálogo D1. Extração de campos permitidos em `scripts/import-map-examples.mjs`; relatório/testes/screenshots em `docs/05-qualidade/EXEMPLOS_LOCAIS_INSTITUCIONAIS.md`. Não é importação oficial nem recebimento de vistoria. Base TXT preservada.

## Implementação inicial de 27/10/2026

Status por requisito e evidências em `docs/05-qualidade/ENTREGA_FASE_01.md`. Leitura e plano prévios em `REVISAO_INICIAL_E_PLANO.md`.

| Fonte TXT | Implementação | Status |
|---|---|---|
| §§1.3,3 | `web/app.js`, `web/styles.css` | Navegação DEMO testada em Chrome desktop; A manual/reabertura; B–H incompletos sem conclusão |
| §4.A/B | `web/app.js` | A opcional e ambiente individual DEMO em memória; catálogo/contagem B faltam |
| §4.F | `web/domain.js`, `web/app.js` | Fatia desktop individual, opcionais e regras genéricas; demais fichas/conferência oficial faltam |
| §4.G | `web/app.js` | Navegação sobre mesma coleção F; nenhuma ficha audiovisual implementada |
| §5 | `web/domain.js`, `web/app.js` | Prévia/remoção e limite testados; câmera física/compressão/R2 não testados/integrados |
| §§7,8,13 | `web/app.js` | Estados honestos, login e envio não operacionais; sem armazenamento durável/offline |

Os testes desta fase não homologam segurança, persistência, autorização ou compatibilidade de aparelhos físicos. Nenhuma pendência foi promovida a decisão.

## Origens documentais

### Painel desktop após D-022/D-023 — 27/10/2026

**Atualização D-024 — mapa V33:** o componente cartográfico foi substituído pela região real fornecida no `MAPA-SEMED-V33.html`: `web/desktop-map.js`, `desktop-map.css`, `map-geography.js`, `data/map-v33.json` e Leaflet local. Aparência/contorno somente; escolas não importadas nem posicionadas por x/y. Relatório/testes/screenshots atuais: `docs/05-qualidade/ENTREGA_MAPA_V33.md`. Os registros a seguir descrevem a primeira fase visual anterior.

`web/desktop.js`, `desktop.css`, `desktop-icons.js` e `desktop-data.js`: protótipo de composição da referência desktop 00, com indicadores, mapa, matriz, unidade e fotos em componentes reais. DEMO isolada e modo sem dados. Entrada `/`; coleta preservada em `/coleta.html`.

Testes/capturas e cobertura compartilhada dos §§0–1,2.5,7.5,8,9 do TXT: `docs/05-qualidade/ENTREGA_PAINEL_DESKTOP_01.md`. Nenhuma alegação de recebimento ou persistência operacional. Mudança visual aprovada mais recente registrada em `DECISOES.md`; interações e ativos provisórios seguem PROPOSTA/DEMO.

| Área | Decisão ou conteúdo | Origem primária | Documento derivado | Imagem |
| --- | --- | --- | --- | --- |
| Escopo dos dois ambientes | Coleta ≠ painel | Conversa de concepção + Base §§0–1 | `docs/01-projeto/VISAO_E_ARQUITETURA.md` | mobile/00, desktop/00 |
| Unidades oficiais e permissões | Somente escolas cadastradas, perfil coletor vê autorizadas | Base §2.5, §8 | `docs/02-coleta-mobile/02_TELAS_E_TRANSICOES.md` | mobile/00 |
| Card wizard | Ordem sugerida, navegação livre, dependências, conclusão manual | Base §3 | `docs/02-coleta-mobile/02_TELAS_E_TRANSICOES.md` | mobile/00 |
| A–H | Conteúdo do questionário e condições | Base §4 | `docs/02-coleta-mobile/03_CATALOGO_E_MAPEAMENTO.md` | mobile/00 |
| Individual/lote | Categoria e campos opcionais | Base §4.F | `docs/02-coleta-mobile/03_CATALOGO_E_MAPEAMENTO.md` | mobile/00 |
| Mídias | Câmera/galeria, R2, 0–5 por equipamento, fotos infraestrutura condicionais | Base §5 | `docs/02-coleta-mobile/04_FOTOS_E_ESTADOS.md` | mobile/00 |
| Editor parcial | Perguntas preexistentes configuráveis e versões | Base §6 | `docs/02-coleta-mobile/03_CATALOGO_E_MAPEAMENTO.md` | — |
| Salvamento | Auto/Salvar, offline e conclusão confirmada no servidor | Base §7 | `docs/02-coleta-mobile/04_FOTOS_E_ESTADOS.md` | mobile/00 |
| Acessos | Admin, coletor, senha provisória, sessão | Base §8 | `docs/04-dados-apis/MODELO_CONCEITUAL.md` | — |
| Histórico/duplicidade | Inventário contínuo, não localizado e transferência administrativa | Base §9 | `docs/02-coleta-mobile/02_TELAS_E_TRANSICOES.md` | — |
| Backup | diário, 7 dias, teste trimestral | Base §10 | `docs/00-governanca/PENDENCIAS.md` | — |
| Panorama | mapa + matriz + seleção + imagens | Conversa de design | `docs/03-painel-desktop/02_TELAS_E_INTERACOES.md` | desktop/00 |
| Mapa | geolocalização, filtros, seleção | Conversa de design | `docs/03-painel-desktop/02_TELAS_E_INTERACOES.md` | desktop/01 |
| Matriz | heatmap quantidade/unidades | Conversa de design | `docs/03-painel-desktop/02_TELAS_E_INTERACOES.md` | desktop/02 |
| Detalhes da unidade | perfil, ambientes, galeria, equipamentos | Conversa de design | `docs/03-painel-desktop/02_TELAS_E_INTERACOES.md` | desktop/03 |
| Indicadores | sem cinco boxes genéricos | Escolha visual em conversa | `docs/03-painel-desktop/02_TELAS_E_INTERACOES.md` | desktop/04 |

`docs/02-coleta-mobile/BASE_DE_COLETA_V1_0_ORIGINAL.txt` é preservado como texto original. Nunca interpretar este quadro como substituto do texto fonte.

## Publicação separada — D-027

`wrangler.jsonc`, `scripts/build-desktop.mjs`, `scripts/verify-panel-release.mjs` e `web/runtime-config.js`: distribuição exclusiva do desktop, com lista permitida de arquivos e coletor desabilitado no pacote público. Autorização e nomes escolhidos pelo responsável em 27/10/2026. Evidências e limites em `docs/05-qualidade/PUBLICACAO_PAINEL_01.md`. Base TXT preservada; nenhum novo formulário A–H ou backend implementado nesta fase.

## Login — D-028

`web/login.html`, `web/login.css`, `web/login.js`: referência visual Login Tecnológico SEMED com Paisagem Amazônica.png e imagens de marca/paisagem fornecidas pelo responsável. Base §8: formulário usuário/senha, reset orientado ao administrador; autenticação e permissões ainda não implementadas. Quatro perfis por instrução posterior D-028. Evidência: `docs/05-qualidade/LOGIN_01.md`.

D-029: refinamento visual do login a partir da referência reenviada; novo ativo `paisagem-login-v2.png`, decoração `login-network.svg`, marca original em camadas CSS sem fundo branco. Evidências atualizadas em `docs/05-qualidade/LOGIN_01.md`. Sem alteração de dados, autenticação ou mapa operacional.

D-030: login visual publicado por autorização explícita, evidências públicas em `docs/05-qualidade/evidencias/login-publicado/`; estado da criação de contas e versão em `LOGIN_01.md`. Integração de autenticação continua pendente; nenhuma alteração de cobertura funcional do TXT.

## D-031 — acesso real publicado

`server/worker.mjs`, `server/security.mjs`, `migrations/0001_auth.sql`, `0002_credential_version.sql`, `web/account.html`, `account.js`, `account.css` e integração login/perfil: Base §8/T20, com matriz de quatro perfis por decisão posterior. Sessões de 1 hora, provisórias de 24 horas e contas iniciais para testes sob responsabilidade do solicitante. Worker autoriza os arquivos e APIs; D1 persiste usuários/sessões/auditoria. Relatório e limites: `docs/05-qualidade/AUTENTICACAO_01.md`; instruções: `docs/01-projeto/GUIA_DE_ACESSO_PUBLICADO.md`. Credenciais somente no diretório privado local, excluído do Git e da distribuição. Integração do inventário, unidades/fotos/offline não coberta por essa autenticação.

D-032: limpeza do inventário desktop. `web/desktop-data.js` com arrays vazios, `desktop.js` com estados vazios e sem restauração DEMO, `account.html`/`account.js` sem indicação de dados demonstrativos disponíveis; pacote exclui a antiga imagem de referência usada nas galerias. Mapa V33 e quatro locais reais preservados. Relatório: `docs/05-qualidade/INVENTARIO_LIMPO_01.md`.

D-033: removidos todos os locais institucionais do mapa. `web/data/map-examples.json` vazio, `desktop-map.js` informa nenhuma unidade cadastrada, `desktop.js` sem camada Locais. Testes de geografia/exemplos: 5 aprovados; navegador: zero marcadores e navegação sem erros. Referências e evidências anteriores são históricas, não registros da aplicação.

D-034: `web/desktop-map.js`, enquadramento inicial e botão de retorno com centro preexistente/zoom 12. Teste real Chrome em larguras 1672, 1280 e 390 px confirmou escala 3 km no início e após zoom/reset. Evidências: `docs/05-qualidade/evidencias/mapa-3km/resultado.json` e `painel.png`; reprodução: `node scripts/verify-map-default.mjs` com servidor local 4184. Sem nova cobertura TXT, alteração de cadastros ou de acesso.

D-035: cadastro mestre, contas individuais, perfis e unidades por operador implementados. Fonte §2.5/§8.2–8.3 + decisão posterior exclusiva root. Migração `0003_units_assignments.sql`, servidor `server/units.mjs`, UI `web/admin-units.js` e ambiente `/administracao`. Relatório com testes, capturas e lacunas: `docs/05-qualidade/ADMINISTRACAO_ROOT_01.md`. Nenhuma unidade de exemplo na produção.

D-036: formulário restrito a nome da unidade, gestor, latitude e longitude. Novas páginas `/cadastro-unidades` e `/usuarios`; removidas seções de atribuições e segurança da UI. Migração `0004_unit_manager.sql`, validação e persistência em `server/units.mjs`; interface `web/account.html`, `admin-units.js`, `account.js`, navegação `desktop.js`. Testes/capturas: `docs/05-qualidade/CADASTRO_SIMPLIFICADO_01.md`.

D-037: revisão do responsável preservada integralmente em `docs/01-projeto/REVISAO_DO_RESPONSAVEL_2026-10-28.txt`. Rotas/shell: `web/panel-shell.js`, `account-shell.js`, `desktop.js`, `panel-refinement.css`. Cadastro/importação: `unit-schema.js`, `spreadsheet-io.js`, `admin-units.js`, `server/import-units.mjs`, `server/units.mjs`, migração `0005_review_catalogue.sql`. Usuários/sessões: `account.js`, `server/worker.mjs`. Cobertura parcial Base §2.5 e §8: catálogo pré-cadastrado, acesso por unidades autorizadas e gestão de contas, com perfis posteriores D-031/D-035. Nenhuma cobertura adicional dos cartões A–H, históricos de equipamentos, vistorias, câmera, fotos R2 ou offline. Testes/capturas e limites: `docs/05-qualidade/REVISAO_PAINEL_2026-10-28.md`.

D-038: `web/desktop-map.js` (base Ruas, contorno oculto, fitBounds do município no início/reset), `web/desktop.js` (botões coerentes antes de carregar). Corrige centro antigo próximo à borda sul e supera o zoom fixo D-034 por decisão explícita posterior. `scripts/verify-map-framing.mjs` aprovado em 1672/870/390 px: contorno inteiro e centralizado quando selecionado, oculto inicialmente, reset e ausência de erros JS. Capturas/resultado em `docs/05-qualidade/evidencias/mapa-ruas-centralizado/`. Nenhuma alteração de cobertura do TXT mobile, dados D1, usuários ou geometria oficial/referência.

Publicação D-038 concluída: versão a6b491a6-0ff6-4077-91bd-f659fce093fa. Teste real Chrome local: Ruas inicial; contorno oculto e ativável; município inteiro centralizado; reset correto. Larguras 1672/870: zoom 12; 390: zoom 11 para caber toda a região. Sem alteração de dados nem nova cobertura do TXT mobile. Capturas e resultado: docs/05-qualidade/evidencias/mapa-ruas-centralizado/.

D-039: `web/unit-schema.js` concentra requiresInep, validação e ordenação com vazios no fim; `server/unit-validation.mjs` reexporta a mesma função para cadastro e prévia/confirmar importação. `web/admin-units.js` atualiza ajuda/asterisco/required ao trocar tipo, editar e limpar. `tests/units.test.mjs` e `scripts/verify-inep.mjs`: cinco tipos, formatos inválidos, duplicidade, NULL, asterisco, edição/reset, ordenação, CSV/XLSX e marcadores. Relatório `docs/05-qualidade/INEP_OPCIONAL_01.md`. Cadastro SEMED solicitado usa a mesma rota/validação `server/units.mjs` por CLI Cloudflare autorizado, com histórico/auditoria, sem criação de sessão ou alteração de senha. Nenhuma cobertura adicional do TXT mobile além do cadastro mestre já registrado; wizard/equipamentos/fotos/offline continuam pendentes.

D-040: pacote `coleta-escolar-aparencia.zip` inspecionado: GUIA-VISUAL.md lido e 12 PNGs abertos. Guia/capturas preservados em `design/referencias/coleta-aparencia-2026-10-28/`. Aprovação exclusivamente visual; conteúdo e regras continuam rastreados à Base e decisões posteriores. Nenhuma cobertura funcional nova, alteração em D1 ou publicação.

D-041: primeira fase online A–H implementada em `web/collector.js`, `collector-schema.js`, `collector.css` e login/conta próprios; persistência/validação/autorização/histórico e publicação em `server/collector.mjs` + `worker.mjs`, migrações 0006–0009. Mesmo catálogo e usuários D1, Workers separados. Integração de leitura em `desktop-inventory.js` e `desktop.js`, sem alterar cartografia. Sem teto de equipamentos no aplicativo; paginação 50 e teste real de 1.006 registros isolados. Cobertura detalhada por seção da Base, capturas, testes e lacunas em `docs/05-qualidade/COLETOR_ONLINE_01.md`. R2 não habilitado: sem upload operacional; offline protegido e administração avançada de inventário ainda faltam. Publicação coletor a58f937f-57b2-475a-966a-943c34d0973d; desktop 851b9e1a-34e6-4d2d-a97e-65d9d69cf179. Produção preservou 1 unidade, 5 contas existentes, zero equipamentos/vistorias/fotos após implantação.

D-042: Base §§2.4–2.5, 3.1 e continuidade §9 com autorização posterior para todas as unidades ativas pendentes. `server/collector-access.mjs` compartilha a política em `units.mjs` e `collector.mjs`; listagem inicial sem atribuição individual, validação de início/retomada no servidor, inativas bloqueadas, continuidade por atribuição/participação após publicação. `web/collector-unit-list.js`, `collector.js` e CSS: cartões visíveis com busca vazia, pendentes/em preenchimento, filtro opcional e inventários recebidos separados. `tests/collector-list.test.mjs`, `scripts/verify-collector-unit-list.mjs`: testes SQLite isolados e Chrome real 360/390/430. Relatório `docs/05-qualidade/LISTAGEM_UNIDADES_01.md`. Sem nova cobertura de questionário/fotos/offline; lacunas D-041 permanecem.

D-043: Base §§3.2/4.C (independência e identificação dos locais), com decisão posterior que remove B como pré-requisito de C. `collector-schema.js`: descrição alternativa `affectedDescription` ou referências existentes; regra compartilhada browser/Worker, compatível com respostas antigas. `collector.js`: oculta vínculo opcional sem catálogo em ocorrências C. Testes de esquema e API confirmam C concluído com zero ambientes/B pendente e manutenção da validade após cadastro B. Chrome real confirmou o fluxo; capturas e cobertura em `CONECTIVIDADE_INDEPENDENTE_01.md`. Fotos/offline e demais lacunas da Base permanecem.

D-044: Base §§2.4, 3.2–3.4, 4.C–H, 7.1, 13: `collector-schema.js` (descrição alternativa D/E/H, agrupamento, validação, ramos condicionais); `collector-navigation.js` (URL/histórico, sem dados de resposta); `collector-errors.js` (contexto e etapa da pendência); `collector.js` (retomada, retorno à revisão, não gravar sem mudanças, layout/loading/filtro); `server/collector.mjs` (no-op sem alteração, detalhes de revisão, mesma validação). Build/Worker incluem novos módulos e favicon. Testes: 36 Node, fluxos Chrome isolados e capturas em `evidencias/revisao-navegacao-02/`. Relatório `REVISAO_NAVEGACAO_02.md` e prompt TXT revisão 2. Sem upload R2 real/sem offline protegido; demais lacunas anteriores continuam. Relatos originais preservados em `docs/01-projeto/relatos-navegacao-2026-10-28/`.

D-045: Base §§0/7/13 diferencia rascunhos de oficiais; pedido posterior autoriza acompanhamento separado. `server/in-progress.mjs`, integração `collector.mjs`, migração `0010_in_progress.sql`; `web/desktop-progress.js`, `desktop-inventory.js`, integração `desktop.js`/`panel-shell.js`, CSS/build/rota Worker. Consulta paginada, totais incrementais, respostas/ambientes/equipamentos/atividades, atualização automática 15s. Operador bloqueado na API gerencial; root/admin/visualizador consultam. Testes `in-progress.test.mjs` e `verify-in-progress.mjs`: gravação aparece antes da conclusão sem mudar indicadores oficiais, paginação/lote, encerramento, revisita e interface. Capturas e limites em `COLETAS_EM_ANDAMENTO_01.md`. Fotos parciais/offline continuam pendentes.

D-046: Base §§1.1,2.2–2.6,7.3–7.4,8 e9 com decisão posterior de autoridade root/continuidade. server/collector-access.mjs libera unidades ativas sem proprietário permanente; testes de segundo operador preservam autores e conflito de versões. server/unit-deletion.mjs, units.mjs, Worker e migração0011 implementam prévia/exclusão root transacional, recibo/auditoria, limpeza dos vínculos e fila de remoção R2. web/admin-units.js/account.css: confirmação, motivo e atalho ao inventário existente; account.html esclarece atribuições sem exclusividade. Testes root-powers.test.mjs, collector-list.test.mjs e verify-root-powers.mjs; capturas em evidencias/root-poderes/. Cobertura: catálogo §2.5, continuidade e autoria; sem novas perguntas/fotos/offline. Exclusão administrativa individual de equipamentos/ambientes/vistorias e transferências ainda não concluídas.

Revisão alternativa do questionário — 28/10/2026 (PROPOSTA DOCUMENTAL, não publicada): arquivo recebido preservado integralmente em docs/01-projeto/revisao-questionario-2026-10-28/REVISAO_RECEBIDA_ORIGINAL.txt, SHA2563416a9d7b1ef05bed94420fe9a28f41c52ff7c8f728fa8da4718837fb500bb9d. Conferidos222 códigos e respectivas marcações (90 retirar,34 unir,43 simplificar,46 manter,9 tornar opcionais). Consolidação em MODELO_ALTERNATIVO_COLETOR_6_CARTOES.txt e COMPARATIVO_REVISAO_COLETOR.txt, gerador scripts/prepare-alternative-questionnaire.mjs. Seis cartões, preservação dos dados antigos e pontos ambíguos identificados. Nenhuma alteração da Base original, do coletor ou do backend. Corrigido apenas erro de documentação em scripts/export-collector-questionnaire.mjs: regra fotográfica de justification aplica-se a ocorrências, não a H.needs.justification. Reexportação corrigida; regra real do sistema não estava errada. Verificados57 itens principais alternativos, sem comparar diretamente com os222 itens da revisão.

Revisão02 da proposta alternativa — 28/10/2026 (DOCUMENTAL, não publicada): nova fonte preservada em docs/01-projeto/revisao-questionario-2026-10-28/revisao-02/REVISAO_RECEBIDA_ORIGINAL.txt, SHA2564d39efe846454b7d8bd865cf5a5c7e036fbba05cb9a65fa2eddb6cddbe132084. Conferidos222 blocos originais sem alteração; adições N1 laboratório, N2 redes Wi-Fi (cinco subcampos), N3 origem/propriedade e N4 marca em cinco categorias. Consolidação em MODELO_ALTERNATIVO_COLETOR_6_CARTOES_REVISAO_02.txt e ALTERACOES_MODELO_ALTERNATIVO_REVISAO_02.txt; gerador scripts/prepare-alternative-questionnaire-v02.mjs.64 entradas principais alternativas, sem equivalência com222 itens de revisão. Armazenamento/consulta de senha Wi-Fi, propriedade versus origem, aplicabilidade de laboratório e obrigatoriedades ambíguas continuam identificados para definição. Não há nova versão de questionário aprovada/publicada, migração, alteração de permissão ou dado oficial. Versão0.1 preservada.

Avaliação da coleta fictícia — 28/10/2026 (RELATO + PROPOSTA, sem nova regra publicada): fonte íntegra em docs/01-projeto/avaliacao-coleta-ficticia-2026-10-28/AVALIACAO_RECEBIDA_ORIGINAL.txt. MODELO_ALTERNATIVO_COLETOR_VISITA_COM_FOTOS_REVISAO_03.txt consolida fachada inicial, perguntas objetivas por administrativos/laboratório/impressoras e evidências junto às respostas, resumos diretos por unidade e panorama. Inspeção confirmou placeholders de Ocorrências e Alertas em web/desktop.js; não são correções implementadas. Campos/obrigatoriedade de fotos e definição de ativos ainda requerem especificação; fonte não foi convertida automaticamente em alteração da Base. Nenhuma escrita/remoção em D1, publicação ou ativação R2. Unidade e equipamentos descritos na avaliação são fictícios, não base oficial.

03/11/2026 — D-048: configuração e publicação Drive autorizadas. collection_photos e fila ganham referência de provedor; Workers controlam upload/leitura. Versões: painel31d75f82-ad3b-4f74-b077-8676ed1c3174/coletor932233b0-61be-4da9-9b80-48fc231847a4. 48 testes isolados e smoke HTTP oficial aprovados. Aceite ponta a ponta, consentimento Drive e celulares pendentes; não declarar fotos operacionais. Seleção de unidade preserva questionário A–H.

03/11/2026 — D-049: Base §fichas, etapa identificação, superada por pedido explícito quanto à obrigatoriedade de patrimônio/série/marca/modelo. Quatro campos opcionais, sem preenchimento fictício; proteção de duplicidade se preenchidos e regra de lote preservadas. Esquema compartilhado navegador/Worker;49 testes aprovados. Sem migração ou alteração de respostas existentes.

### D-050 — evidências durante a coleta, 03/11/2026
Base §§2.6, 4.A–H, 5.1–5.6, 7.1/7.5/7.10 e pedido posterior: web/collector.js + collector-navigation.js (fachada/acompanhante/evidências); server/collector.mjs (vínculo autorizado, retomada, autoria, limite por visita); tests/photo-storage.test.mjs e tests/collector-evidence-browser.cjs. Fotos não são um cartão genérico. Critérios/evidências/limites em docs/05-qualidade/COLETA_EVIDENCIAS_01.md. Base original intacta.

### D-051 — retorno prático
Base §§2.4/3.2/7.1: botão visível para categorias; salvamento das respostas ao sair e retomada de ficha incompleta/prévias na mesma aba. web/collector.js e collector.css. Teste browser isolado: fachada→categorias, identificação preenchida→outro cartão→identificação preservada, equipamento com prévia→H→retomada da mesma ficha/etapa/prévia. Capturas 06/07 em docs/05-qualidade/evidencias/coleta-evidencias-2026-11-03/.

### D-052 — V2 do responsável, primeira fase local, 04/11/2026
Fontes integrais: SEMED_Questionario_Reformulado_V2.txt/.docx; revisão em docs/02-coleta-mobile/REVISAO_QUESTIONARIO_V2_2026-11-03.md. Fluxo/perguntas/validações: web/collector-v2-schema.js e collector-v2.js/html; persistência/versionamento/revisão: server/collector-v2.mjs e collector.mjs; assets autenticados e build: worker.mjs/build-collector.mjs; ocorrências recebidas: inventory-results.mjs. Legacy A–H e visita-2 preservados. Critérios de aceite, cobertura por item e lacunas: docs/05-qualidade/QUESTIONARIO_V2_FASE_01.md; tests/collector-v2.test.mjs e collector-v2-browser.cjs. Cobertura não significa publicação nem integração real de câmera/Drive em celulares. Quatro perfis preservados por resposta explícita do responsável. Sem migração ou dados fictícios no D1 oficial.

### Revisão do pacote do agente 0.1.6 — 04/11/2026, sem implementação/publicação
Pedido do responsável: examinar o pacote e aproveitar o que se adapta ao objetivo de vincular informações dos computadores às unidades, sem impor seus layouts. Fonte preservada em `revisoes/agente-0.1.6-recebido/`; fonte interna em `revisoes/agente-0.1.6-fonte/`. SHA-256 do ZIP: `0F5A010BE2F6D47368FD041ECD1F6D80CE717B5CD31B9765907733418EE86291`. Manifesto: 97 arquivos conferidos; EXE sem assinatura Authenticode. Documentos e quatro PNGs examinados; testes isolados: 84 aprovados/1 ignorado em memória, 85 aprovados em D1 emulado, 11 aprovados do módulo. Cinco defeitos adicionais reproduzidos: QR revogado ainda cria vínculo, recibo não atômico, regressão concorrente da presença, limite por IP incompatível com lote e consultas sem paginação/N+1. Relatório e plano: `REVISAO_PACOTE_AGENTE_SEMED_0_1_6.txt`; evidências/script em `revisoes/agente-0.1.6-analise/`. Relação com D-052/V2 §8.1: integração futura na ficha existente, preservando IDs, quatro perfis, ambiente, autoria e estados parciais/oficiais. Nenhuma nova cobertura operacional do TXT; agente/QR/eventos ainda não integrados. Não executados instalador, migração, coleta do computador, mudanças de credencial ou deploy. Propostas técnicas do relatório não aprovam regras funcionais pendentes do pacote.

### Revisão de prontidão real — 04/11/2026
Consulta somente de leitura aos Workers e D1 oficial: provedor Google Drive configurado nos dois, nomes dos segredos presentes e migração 0013 aplicada; zero autorizações OAuth persistidas, zero eventos de integração e zero fotos. Banco possui 71 unidades, cinco ambientes, quatro registros de equipamentos e seis vistorias versão 1.0 (cinco abertas e uma concluída); isso não homologa a qualidade dos registros. Últimos deployments: coletor 4ce66d17-5545-4ff2-883e-d59d18a43c8d e painel c49b5260-5a00-48ef-b3e6-1a7a8091b39c. V2 continua local; agente sem tabelas no D1 oficial. Relatório: docs/05-qualidade/REVISAO_PRONTIDAO_IMPLANTACAO_2026-11-04.md; evidências agregadas em docs/05-qualidade/evidencias/prontidao-2026-11-04.json. Atualizados os estados históricos de INTEGRACAO_GOOGLE_DRIVE.md e PENDENCIAS.md para evitar repetir configuração já feita. Sem alteração de dados, segredos, código funcional ou deploy.

### D-048 — conexão operacional do Drive, 04/11/2026

**Complemento de D-045/D-048, 04/11 às 08:18:** fotografia real enviada pelo usuário confirmada e aberta via proxy privado. Corrigida a ausência de galeria nas coletas em andamento: miniaturas, ampliação, vínculo/autoria/data, recebidas versus pendentes, paginação e proteção por perfil/vistoria/unidade. Fonte: Base §§7.1/7.5/7.6 e §8, D-045/D-050. Relatório `docs/05-qualidade/FOTOS_PARCIAIS_2026-11-04.md`; testes `tests/in-progress-photos.test.mjs` e regressões; capturas em `evidencias/fotos-parciais-2026-11-04/`. Worker desktop `c990dc1b-bb8e-4ca8-9471-6cc6f2bdb7ff`, correção isolada sobre produção, mantendo V2 local sem publicação. Nenhuma migração, alteração de inventário ou conclusão de vistoria. Coletor não republicado; teste integral de câmera e de vínculo a equipamentos em celulares continua pendente. O parágrafo abaixo descreve o estado anterior à foto enviada pelo usuário.

Responsável pediu resolver o acesso e entrou como root no painel. Autorização institucional concluída às 07:33:05 (Fortaleza), escopo drive.file, pasta privada criada/vinculada. Autoteste real de upload/remoção aprovado às 07:34:27; eventos authorization_connected/self_test_ok e estado confirmados no D1 sem ler tokens. Evidência: docs/05-qualidade/DRIVE_CONECTADO_2026-11-04.md e captura em evidencias/drive-2026-11-04/conectado-teste-ok.png. Sem deploy, mudança de segredo, política Workspace, cadastro ou fotografia associada ao inventário. Recebimento habilitado, mas teste de foto vinculada no coletor/painel, renovação e celulares ainda pendentes. Primeira tentativa teve estado de autorização ausente; causa não concluída, segunda tentativa completou sem alteração de código.

### Proposta D-053 — V2 consolidada + vínculo por QR com o agente 0.1.6, 04/11/2026 (local, não publicado)

**Revisão independente posterior, 04/11:** pacote `ENTREGA_CLAUDE_V2_QR_2026-11-04_1.zip` conferido; 60 hashes declarados corretos, código já idêntico na pasta atual. Reexecutados 67 testes da suíte e 2 de fotos parciais, todos aprovados; builds concluídos. Sete falhas adicionais reproduzidas em memória impedem considerar a entrega pronta: exclusão sem revogar agente, rota de localização contornando validações/alterando modo, claim ignorando trava/revisão, localização antiga confirmada após mudança, QR condicionado ao formulário completo, foto indevida na revisita de impressora e câmera aberta depois do cancelamento. Relatório `docs/05-qualidade/REVISAO_INDEPENDENTE_CLAUDE_V2_QR_2026-11-04.md`; devolutiva `DEVOLUTIVA_CLAUDE_V2_QR_CORRECOES_2026-11-04.txt`; reproduções em `revisoes/claude-v2-qr-2026-11-04-analise/`. Não houve correção funcional, publicação, migração remota ou instalação do EXE nesta revisão. D-053 continua proposta, com falhas pendentes.

Pedido: `PEDIDO_IMPLEMENTACAO_CLAUDE_V2_QR_2026-11-04.txt` (§§3–17; Anexo A). Conferência inicial e divergências: `docs/05-qualidade/CONFERENCIA_V2_QR_2026-11-04.md`, `docs/05-qualidade/MATRIZ_COBERTURA_V2.md`, `docs/04-dados-apis/DIGEST_AGENTE_0_1_6.md`. Contrato integrado: `docs/04-dados-apis/CONTRATO_QR_E_AGENTE.md`. Anexo A 4.2/4.M1/4.7/2.L11/7.C1/5.1/7.1/§7/§14 → `web/collector-v2-schema.js`, `web/collector-v2.js`, `web/collector-schema.js`, `server/collector-v2.mjs`, `server/collector.mjs`, `server/in-progress.mjs`. Pedido §8–§10 (API do agente, vínculo, R1–R5) → `migrations/0014_agentes.sql`, `server/agent-crypto.mjs`, `server/agentes/{index,catalogo}.mjs`, `server/agentes/nucleo/*.mjs`, `server/worker.mjs`. Pedido §11 (QR no coletor) → `web/collector-qr.js`, `web/vendor/jsqr/`, `web/collector.css`, `scripts/build-collector.mjs`. Pedido §12 (painel) → `web/desktop-inventory.js`, `web/desktop-progress.js`, `web/desktop-results.js`, `web/desktop.js`, `web/desktop.css`, `scripts/build-desktop.mjs`. Testes: `tests/agentes.test.mjs`, `tests/v2-fase2.test.mjs`, `tests/helpers/agent-client.mjs`, `tests/collector-v2-qr-browser.cjs`, `tests/desktop-v2-agent-browser.cjs`, `tests/collector-v2-browser.cjs` (ajustado); evidências em `docs/05-qualidade/evidencias/coleta-v2-qr-2026-11-04/` e `painel-v2-agente-2026-11-04/`. Relatórios da entrega (§18 do pedido): `docs/06-entregas/claude-v2-qr-2026-11-04/`. Estado inicial usado: pasta de trabalho às 10h20 de 04/11 (mtimes no manifesto); nenhum arquivo removido.

### Correções da revisão independente (REV-01 a REV-07) — 04/11/2026 à tarde (local, não publicado)

**Auditoria independente da rev2, posterior ao recebimento:** 50 hashes do manifesto conferidos; 75 testes da suíte + 2 de fotos parciais reexecutados e aprovados, builds 26/45 arquivos. Três cenários adicionais reproduziram falhas: recuperação de claim após resposta perdida (R2-A), vínculo em assunto concluído sem reabertura (R2-B) e mistura/perda de publicação da localização na revisita (R2-C). Evidências em `revisoes/claude-v2-qr-rev2-2026-11-04-analise/`; relatório `docs/05-qualidade/REVISAO_INDEPENDENTE_CLAUDE_V2_QR_REV2_2026-11-04.md`; devolutiva `DEVOLUTIVA_CLAUDE_V2_QR_REV2_2026-11-04.txt`. As correções originais foram reconhecidas nos cenários testados; ainda não há aceite para publicação. Nenhum código funcional, produção, credencial ou EXE alterado nesta revisão.

Fonte: `DEVOLUTIVA_CLAUDE_V2_QR_CORRECOES_2026-11-04.txt` e `revisoes/claude-v2-qr-2026-11-04-analise/` (não alterados). REV-01 → `server/unit-deletion.mjs` (revogação atômica, impacto `agentLinks`), `server/agentes/nucleo/worker.mjs` (`requireLiveLink`), `nucleo/d1-store.mjs`/`store.mjs` (`endOrphanLink`). REV-02/REV-03 → `server/agentes/catalogo.mjs` (`policyGuards`, `checkPolicy`, `touchInspection`, `markAgent`), `nucleo/d1-store.mjs` (`claimAtomic`/`updateLocationAtomic` com política, recibo e revisão no batch), `nucleo/worker.mjs` (`lock_token`, `inspection_id`, `POLICY_ERRORS`), `server/agentes/index.mjs` (`requireLock:true`), `web/collector-v2.js` (`lock_token`, `claimOnce`, `reloadFromServer`). REV-04 → `server/collector.mjs` (reset de posição ao mudar ambiente), `web/collector-v2.js` (`confirmPosition`). REV-05 → `web/collector-v2-schema.js` (`validateV2Draft`, `pendingDrafts`), `server/collector.mjs` (`draft:true`), `server/collector-v2.mjs` (`pendingDraftCount`, revisão), `web/collector-v2.js` (sequência direta, `saveDraft`). REV-06 → `server/collector-v2.mjs` (`physicalChanged` por visita). REV-07 → `web/collector-qr.js`. Lacunas 2–4 e 8 → `web/desktop-agents.js` (novo), `web/desktop.js`, `web/desktop.css`, `scripts/build-desktop.mjs`, `server/agentes/index.mjs` (`/api/root/agent-devices`, `/api/root/agent-maintenance`), `server/worker.mjs` (`scheduled`), `wrangler.jsonc` (cron), `wrangler.validation.jsonc`, `wrangler.validation.painel.jsonc` (novo), `pnpm-lock.yaml` (qrcode). Testes: `tests/revisao-independente.test.mjs` (novo, 8), `tests/desktop-root-agents-browser.cjs` (novo), `tests/collector-v2-qr-browser.cjs` (reescrito para REV-05), `tests/helpers/agent-client.mjs` (`lockFor`), demais testes ajustados para a trava. Evidências: `docs/05-qualidade/evidencias/painel-root-agentes-2026-11-04/`, `coleta-v2-qr-2026-11-04/` (regeradas). Relatórios: `docs/06-entregas/claude-v2-qr-2026-11-04/RELATORIO_CORRECOES_REVISAO.txt`, roteiro revisão 2, contrato, matriz §6, PENDENCIAS_E_DECISOES (C17–C24, D11–D13), MIGRACOES_E_PUBLICACAO (§1.4, §3.2).

### Correções da revisão 2 (R2-A, R2-B, R2-C) — 04/11/2026 à noite (local, não publicado)
Fonte: `DEVOLUTIVA_CLAUDE_V2_QR_REV2_2026-11-04.txt` e `revisoes/claude-v2-qr-rev2-2026-11-04-analise/` (intocados). R2-A → `web/collector-v2.js` (comando congelado `pairing.command`/`positionCommand`, `sendCommand`, `lookupReceipt`, `api()` com `unknown`), `server/agentes/index.mjs` (`claim-status`, `equipment-location-status`). R2-B → `server/agentes/catalogo.mjs` (`SECAO_CONCLUIDA` em `policyGuards`/`checkPolicy`), `nucleo/worker.mjs` (`SECTION_COMPLETED`). R2-C → `catalogo.updateEquipmentLocation` (inspection_id + localização no data_json), `catalogo.eq` (`published_location`, `partial_location`), `nucleo/d1-store.mjs`, `nucleo/worker.mjs` (`agentStatus` oficial × `draft_location`), `server/collector.mjs` (`equipment-save` JSON coerente; `/api/inventory/equipment` com `partial`), `web/desktop-inventory.js`, `web/desktop.js`, `web/desktop.css`. Seção 5 da devolutiva → `web/admin-units.js` (agentes na prévia de exclusão), `server/agentes/index.mjs` + `web/desktop-agents.js` (último vínculo histórico), roteiro revisão 3, C23 (03:23 UTC). Testes: `tests/revisao-independente.test.mjs` (R2-A/B/C), `tests/collector-v2-qr-lost-response-browser.cjs` (novo), `tests/desktop-v2-agent-browser.cjs` (ampliado), `tests/agentes.test.mjs` (oficial × rascunho). Evidências: `docs/05-qualidade/evidencias/coleta-v2-qr-resposta-perdida-2026-11-04/`, `painel-v2-agente-2026-11-04/04-parcial-revisita.png`.

### Revisão independente rev3 — correções R2-A/B/C, 04/11/2026 (local)

Pacote CORRECOES_REV2_CLAUDE_V2_QR_2026-11-04.zip conferido: 47 arquivos já idênticos ao projeto; 45 hashes declarados corretos. Revisor executou 78 testes da suíte + 2 de fotos parciais, seis cenários independentes e builds (coletor 26/painel 45). R2-A: recuperação de vínculo e posição antes/depois da perda de resposta, sem duplicação; R2-B: assunto concluído recusado sem consumir QR; R2-C: localização parcial separada da oficial e publicação coerente na revisita. Evidências em revisoes/claude-v2-qr-rev3-2026-11-04-analise/; relatório docs/05-qualidade/REVISAO_INDEPENDENTE_CLAUDE_V2_QR_REV3_2026-11-04.md; devolutiva DEVOLUTIVA_CLAUDE_V2_QR_REV3_2026-11-04.txt.

Quatro capturas do autor inspecionadas; sem nova execução dos testes de navegador ou teste físico pelo revisor. Nenhum código funcional alterado nesta auditoria, nenhuma migração remota, deploy, credencial ou dado oficial modificado. Não reabrir os três casos corrigidos como pendentes locais; próxima etapa é homologação isolada do EXE/celulares/fotos. D-053 permanece proposta; alertas de hardware, histórico entre instalações e demais lacunas continuam documentados. Fonte V2 original e Base de Coleta preservadas.

### Preparação da homologação (resposta à rev3) — 04/11/2026 à noite (local, nada executado na conta)
`docs/06-entregas/claude-v2-qr-2026-11-04/PLANO_HOMOLOGACAO_V2_QR.txt` (decisões D-H1–D-H4, inventário somente leitura, preparação do ambiente de validação, roteiro com equipamentos reais, critério para produção, modelo de registro). Ferramenta de apoio nova: `scripts/verificar-ambiente-validacao.mjs` (verificação HTTP sem credenciais da presença do módulo/migração; testada contra o Worker real em memória: 7/7 por endereço). Contas e pepper de validação continuam pelo fluxo já existente `scripts/bootstrap-auth.mjs --local` + `scripts/verify-panel-release.mjs` (nenhuma ferramenta paralela criada). DECISOES.md adendo 3 de D-053; PENDENCIAS.md item de homologação.

### Revisão do plano de homologação — 04/11/2026

R2-A/B/C permanecem aprovados localmente. Revisados PLANO_HOMOLOGACAO_V2_QR.txt e scripts de verificação/preparo: 401 não comprova rota/migração; POST enrollment-challenge grava contador; fotos desabilitadas bloqueiam conclusão/revisita; bootstrap destrutivo apenas em banco vazio confirmado; atribuição não obrigatória por D-046. scripts/verificar-ambiente-validacao.mjs faz seis GETs por padrão e só POST com --probe-agent, declarando o limite. tests/validation-probe.test.mjs: 3/3, Worker/SQLite em memória; nenhuma rede externa. Plano oficial e DEVELOPMENT.md atualizados; original preservado em revisoes/homologacao-v2-qr-2026-11-04/. Relatório: docs/05-qualidade/REVISAO_PLANO_HOMOLOGACAO_QR_2026-11-04.md. D-H1/H4, D-H2 e D-H3 pendentes do responsável; nenhum comando na conta Cloudflare, credencial, seed, migração remota ou EXE executado.

### D-057 — V3 publicada em 05/11/2026
Fonte: Coletor-SEMED-mudancas-questionario-V3.docx + decisões individuais do responsável. Oito assuntos, perguntas reduzidas, acompanhante opcional, ambiente livre, QR sem confirmação visual, mudança sem motivo, sem número de patrimônio, manual com motivo, revisita só Editar, impressoras em lista direta e fotos automáticas. Implementação: web/collector-v3.*, collector-drafts.js, entrada collector.js; server/collector-v3.mjs, collector.mjs, agentes; migração aditiva 0015; desktop por versão. Testes: 87 automatizados + fluxo browser isolado e capturas. Produção: dois Workers publicados, D1/Drive preservados. Evidência e limites: docs/05-qualidade/PUBLICACAO_V3_2026-11-05.md. Roteiro: TESTE_COLETOR_V3_2026-11-05.txt. Base original preservada; perguntas históricas não apagadas; pendências físicas/offline continuam.

### Análise do instalador 0.1.8 — 05/11/2026
Responsável pediu compatibilidade do EXE SemedAgente-Instalador-0.1.8.exe. Hash CB486E517CDE0F58E1B209F4056249BA8FB276F429ABCE94163EF8065B6C02A7; extração NSIS e descompilação dos DLLs, sem executar/instalar. Endereço real presente; rotas/QR/assinaturas/ACK compatíveis por inspeção e reprodução local do contrato. Bloqueio: versão tenta desafio anônimo quando não há autorização válida; servidor real retorna 401 INVALID_GRANT (sonda única, sem criar dispositivo). Com autorização de lote: duas identidades, QR, claim V3, confirmação, heartbeat/inventário e ACK duplicado passaram em SQLite isolado. Recuperação curta melhorada; retomada após expiração do desafio com grant esgotado ainda bloqueia. Não houve publicação, emissão de grant nem substituição de D-056. Relatório ANALISE_INSTALADOR_0_1_8_2026-11-05.txt; evidências revisoes/instalador-0.1.8-2026-11-05/. Homologação do EXE real permanece pendente.

## D-058 — cadastro automático do agente (05/11/2026)
- Fonte: opção A confirmada pelo responsável; DUVIDAS_RECEBIDAS_2026-11-05.txt preservado na revisão 0.1.8.
- Implementação: server/agentes/index.mjs, nucleo/worker.mjs, nucleo/d1-store.mjs, nucleo/store.mjs, nucleo/enrollment-policy.mjs; web/desktop-agents.js; wrangler.jsonc e wrangler.collector.jsonc.
- Critérios: sem autorização no cadastro; assinatura mantida; pendente sem telemetria; claim com login/CSRF/vistoria/trava; ID recuperável; 200 máquinas; limite por IP; revogação; expiração somente de nunca vinculados após 30 dias.
- Aceite local: 94 testes aprovados e painel real em Edge com SQLite isolado. Screenshot e browser.json em docs/05-qualidade/evidencias/cadastro-automatico-2026-11-05/.
- Não alterados: Base TXT/questionário V3, respostas, fotos/Drive, usuários e permissões do coletor. Não requer migração SQL. Não há execução de EXE ou homologação física presumida.
- Relatório de publicação: docs/05-qualidade/CADASTRO_AUTOMATICO_2026-11-05.md. Instruções atualizadas: CADASTRO_AUTOMATICO_AGENTE_SEMED_2026-11-05.txt.

## D-059 — identificadores opcionais AnyDesk/RustDesk (05/11/2026)
- Fonte: pedido explícito do responsável neste chat; adição posterior à Base original, que permanece intacta.
- Campos: anydesk, rustdesk. Computadores manual/QR, desktop/notebook/tipo ainda não informado. Obrigatoriedade: nenhuma. Resposta: dígitos 0–9, preservados como texto.
- Código: web/collector-schema.js, collector-v2-schema.js, collector-v3-schema.js; renderizadores collector.js, collector-v2.js, collector-v3.js, visit.js; server/collector.mjs. A consulta desktop reutiliza o catálogo compartilhado existente.
- Persistência: JSON e histórico da ficha, sem migração; preservar campo omitido por cliente anterior, permitir limpar por vazio explícito.
- Aceite: tests/remote-access-fields.test.mjs e tests/collector-v3-browser.cjs (salvar/reabrir, vazio, dígitos, zeros, rascunho QR, letras recusadas, exibição desktop, exclusão em impressora).
- Evidências: docs/05-qualidade/evidencias/anydesk-rustdesk-2026-11-05/. Fotos/Drive, telemetria e demais perguntas não alterados; teste físico de câmeras e offline durável continuam pendentes das fases anteriores.
- Publicação D-059 confirmada: coletor 1879b1a4-a1b2-4625-b4bc-cbaf6a793f6a; painel 60bb52a0-3108-429b-934a-3d3073655564. 96 testes aprovados e navegador com salvamento/reabertura/publicação/consulta desktop. HTTP após deploy confirmado.

## D-060 — apresentação do coletor sem número de versão (05/11/2026)
- Fonte: pedido explícito do responsável, publicação real autorizada nesta mensagem.
- Interface: web/collector.js, collector-v3.html/js, collector-v2.html/js; desktop-inventory.js e desktop-progress.js. Servidor: mensagem de preservação de rascunho em server/collector-v3.mjs.
- Entrada única pelo questionário atual; seletor de versão removido. Dados/históricos e identificação técnica interna preservados.
- Teste: tests/collector-v3-browser.cjs, executado com SEMED_TEST_EVIDENCE_DIR=docs/05-qualidade/evidencias/coletor-apresentacao-2026-11-05. Salvar, QR, fotos existentes, conclusão e consulta desktop aprovados.
- Foto de computador: resposta expressa “Adicionar foto opcional”. web/collector-v3.js oferece câmera/galeria e preserva modo Manual no rascunho; web/collector-v3-schema.js aceita rascunho mínimo Manual ou Agente, com validação completa mantida no Worker. Sem migração.
- tests/collector-v3.test.mjs cobre associação/consulta parcial, rascunho, validação e publicação sem foto. tests/collector-v3-browser.cjs cobre envio automático manual/QR, reabertura, câmeras/galeria e consulta desktop. Evidências em docs/05-qualidade/evidencias/coletor-foto-computador-2026-11-05/; relatório FOTO_COMPUTADOR_E_APRESENTACAO_2026-11-05.md.

## Compilado de referência para melhoria do frontend — 05/11/2026
- Pedido do responsável: pacote detalhado de aparência, funcionalidades e lógica do coletor atual para preparar novo layout. Sem mudança funcional/deploy.
- Entrega: entregas/COMPILADO_FRONTEND_COLETOR_SEMED_2026-11-05.zip; 235 arquivos, guia TXT de 1.438 linhas, 23 capturas, código e prévia local isolada. Catálogo derivado de collector-v3-schema.js, incluindo D-059/D-060; Base original preservada.
- Versões ativas conferidas por consulta somente leitura; login público real e telas internas do Worker com dados sintéticos distinguidos. Nenhuma credencial/banco oficial exportado.
- Cópia empacotada: 98 testes aprovados, fluxo de navegador expandido e galeria conferidos; ZIP e hashes validados. Relatório em docs/06-entregas/COMPILADO_FRONTEND_COLETOR_2026-11-05.txt.

## D-061 — identidade “Contraste técnico” no coletor, 05/11/2026

- Fonte aprovada: entrega-claude-identidade-2026-11-05.zip; SHA-256 44e40d6f8019814523e02d96573364dac36af9ac9f3519950fc4dd55013570af. Pedido explícito de adoção/publicação real nesta conversa. Originais preservados em revisoes/identidade-claude-2026-11-05/.
- Implementação visual: web/tokens.css, collector.css, collector-v3.css, HTMLs do coletor, favicon, paisagem, fontes locais e símbolos/cores em collector-v3.js/schema.js. Build e allowlists estáticas do Worker atualizados. Nenhuma validação funcional ou migração alterada.
- Aceite: 98 testes; tests/collector-v3-browser.cjs (fichas, QR, 7 fotos isoladas, AnyDesk/RustDesk, conclusão/painel); tests/collector-identity-browser.cjs (fontes, login, conta, cartões, QR paisagem, proteção HTTP). Evidências: docs/05-qualidade/evidencias/identidade-2026-11-05/.
- Preservados requisitos atuais D-057/D-059/D-060. Material externo sobre “uma pergunta por tela” não restabelece fluxo anterior. Desktop e Base TXT mantidos.
- Publicação e limitações: docs/05-qualidade/IDENTIDADE_COLETOR_2026-11-05.md. Câmera física e novo upload autenticado ao Drive real não exercitados nesta rodada.
- Publicado coletor a96b3047-19d1-48b8-975b-6ddd0b36505e; 14 sondas públicas de produção aprovadas, hashes de oito assets iguais ao build, login real capturado. Painel permanece 827d6900-aa3a-450c-974d-ac13fd2ecca5. Sem migração, seed ou alteração de dados oficiais.

## Diagnóstico de UX após D-061 — 05/11/2026 (proposta, sem deploy)

- Pedido: navegar e propor melhorias de tamanho dos controles e teclado, mantendo a identidade aprovada. Usuário confirmou campo encoberto, fechamento/pulos e dificuldade de avançar/fechar teclado.
- Reproduzido com Worker e SQLite isolado: primeiro equipamento em y≈542px numa área 390×660; header 121px e footer 77px; Enter não executa busca; render após select/upload remove foco; erro do ambiente fica sob footer. Falha funcional adicional: change do filtro inclui `_query` nas respostas e faz section-save retornar 400 ao concluir.
- Artefatos: tests/collector-ux-audit.cjs; docs/05-qualidade/evidencias/ux-coletor-2026-11-05/diagnostico.json e capturas. Emulação de altura reduzida não é teclado físico. Aba autenticada inacessível à ferramenta; não alegar navegação autenticada real nesta rodada.
- Proposta interativa isolada: docs/06-entregas/PROPOSTA_UX_COLETOR_2026-11-05.html; diagnóstico, prioridades e aceite: REVISAO_UX_COLETOR_2026-11-05.txt na mesma pasta. Primeiro equipamento da proposta em y=226px; exemplos explícitos, sem backend/persistência.
- Nenhuma mudança em web/server nem publicação. Corrigir estado da busca, foco incremental e visibilidade de erros antes de homologar teclado real; compactação/rodapé adaptativo continuam proposta para a próxima implementação.

## D-062 — publicação das correções de UX, 05/11/2026

- Pedido explícito “publique as correcoes” aprova a implementação da proposta anterior. Identidade D-061, questionário D-057 e fotos/IDs D-059/D-060 preservados.
- Arquivos: web/collector-v3.js/css, novo web/collector-ui.js, scripts/build-collector.mjs e allowlist autenticada de server/worker.mjs. Sem migração, seed ou alteração de credenciais.
- Cobertura: pesquisa fora das respostas, Enter/limpeza, atualização da mesma tela conservando foco/cursor, upload sem sobrescrever digitação, erro focalizado, rodapé recolhido ao digitar, retorno à posição da lista e reabertura sem revisão local obsoleta.
- Aceite: 98 testes gerais, fluxo funcional com sete fotos sintéticas/QR/consulta desktop, identidade responsiva e regressão UX. Relatório: docs/05-qualidade/UX_COLETOR_PUBLICACAO_2026-11-05.md. Primeiro item em y=208px versus ~542px antes.
- Evidências: docs/05-qualidade/evidencias/ux-publicacao-2026-11-05/. Teclado físico e upload autenticado ao Drive real não exercitados nesta rodada; capturas internas são do Worker isolado, capturas públicas são identificadas como produção.
- Publicação concluída em 05/11/2026 às 21:23 (Fortaleza): coletor 5cf137cd-9c34-4e41-806b-d19cf0887bb6, 100% do tráfego; 16 sondas públicas aprovadas. Sem deploy do painel ou escrita de dados de teste na produção.

## D-063 · documentação, reprodução e transferência — 05/11/2026

- Solicitação: documentação completa e repositório organizado para possível mudança de servidor.
- Implementação documental: README e entradas atuais; docs/07-operacao/01–09; dicionário físico/SQL/hashes; checklist TXT; histórico dos guias anteriores em docs/99-historico.
- Ferramentas: scripts/document-schema.mjs, export-operation-manual.mjs, check-doc-links.mjs e check-repository.mjs; exemplos locais; Playwright do projeto nos três testes atuais; CI sem deploy/segredos.
- Aceite: instalação com lockfile, testes e builds, migrações em memória, links locais, revisão dos arquivos do índice antes do push. Resultados efetivos em docs/07-operacao/10_REGISTRO_DA_ORGANIZACAO.md.
- Limites: nenhum deploy, SQL remoto, upload/exclusão de fotos ou migração real nesta organização; nenhuma alteração de formulário. Backup/restauração e EXE/celulares continuam exigindo ensaio próprio.

## D-064 · identidade e disponibilidade das fotografias — 05/11/2026

- Pedido: padronizar a visualização de imagens com a paleta do coletor e conferir fotos recebidas.
- Entrega: `/fotografias`, filtros/paginação, viewer compartilhado, tema local e leitura protegida. Visitas pausadas consultáveis como histórico PARCIAL, sem mudar seu estado ou indicadores.
- Base §§7.1/7.5/7.6/7.10/8; D-045/D-048/D-061/D-062 preservados. Nenhuma pergunta, migração, upload ou exclusão real.
- Evidências e arquivos: [relatório da galeria](../05-qualidade/GALERIA_FOTOGRAFIAS_2026-11-05.md). Dez arquivos reais lidos e hashes conferidos; testes de UI usam dados isolados. Câmera física e novas capturas não homologadas nesta rodada.

## D-065 · identidade de TODO o painel e retirada da aba de fotos — 06/11/2026

- Correção explícita do responsável e publicação real autorizada. Supera o escopo restrito de D-064; composição desktop mantida, paleta antiga substituída pelos tokens D-061/D-062.
- `web/desktop-theme.css`, HTMLs desktop/login/conta, navegação e integração do viewer existente; build de fontes/assets e allowlist estática. `/fotografias` redireciona ao Panorama; nenhum dado/fotografia excluído. Coletor intocado.
- 100 testes, build de 63 arquivos e `tests/desktop-identity-browser.cjs` com 17 rotas, login, formulários, filtros, foto contextual e larguras móveis aprovados. CI atualizada.
- [Relatório, evidências, publicação e limites](../05-qualidade/IDENTIDADE_PAINEL_2026-11-06.md). Nenhum requisito novo da Base TXT, migração ou escrita de exemplo no banco oficial. Futuras posições das fotos serão definidas separadamente.

## D-066 · unidades por categoria no Panorama — 06/11/2026

- Pedido explícito: não somar escolas e prédios administrativos num indicador geral. Tipos do cadastro atual em `web/unit-schema.js`; origem autenticada `/api/units`.
- `web/desktop.js`: contagens por `unit_type` e filtros existentes; estados zero/indisponível/sem classificação. `web/desktop-theme.css`: faixa compacta por categoria e quatro indicadores de inventário preservados.
- Teste integrado em `tests/desktop-identity-browser.cjs`: acrescentar unidade administrativa não muda escolas; consulta de ativos, filtros, busca vazia, tipo ausente e falha HTTP. Sem escrita real, migração ou alteração da Base/coletores.
- [Relatório e publicação](../05-qualidade/CONTAGENS_CATEGORIAS_2026-11-06.md).
- Estado desta entrega: implementação/build e teste de 17 rotas aprovados; publicação ainda pendente após três recusas HTTP 503 da API de gerenciamento Cloudflare. O ambiente real mantém D-065; não confundir código enviado ao Git com release publicado.

## D-067 · composição do Panorama e Planejamento — 06/11/2026

- TXT/JSON de 06:55 e duas respostas explícitas do responsável: manter nomes na matriz e manter blocos nas telas de origem. Aprovação expressa de publicação real; 15 lacunas sem decisão continuam pendentes.
- `web/desktop.js`: onze blocos no Panorama, matriz reordenada, questionário/resultado da unidade e galeria; acompanhamento no Planejamento. `web/desktop-results.js`: indicador funcionando no mapa, demais números preservados. `web/panorama-layout.css`, `web/index.html`, `scripts/build-desktop.mjs`: grade responsiva e distribuição do CSS.
- `tests/desktop-identity-browser.cjs`: ordem/geometria, valores por categoria, troca de duas unidades, vínculo de fotos/respostas, funcionamento, fontes preservadas, Planejamento e regressão D-066. Dados fictícios somente em SQLite isolado.
- [Relatório, evidências e publicação](../05-qualidade/LAYOUT_PANORAMA_2026-11-06.md). Nenhuma pergunta da Base TXT alterada ou nova; nenhum requisito funcional pendente declarado concluído. Coletor, schema e dados oficiais preservados.
- D-066 e D-067 publicadas juntas em `97d33dfb-8147-4591-9724-f44d8d7bb9ba`, 100% do painel. Resolve a pendência de deploy D-066 por 503, sem apagar seu histórico. 46 sondas públicas aprovadas e 13 assets conferidos; coletor continua `5cf137cd-9c34-4e41-806b-d19cf0887bb6`.

## D-068 — cadastro ampliado e matriz, 06/11/2026

| Requisito | Implementação | Verificação |
|---|---|---|
| Fora do escopo e obras fora da coleta | web/unit-schema.js; server/unit-scope.mjs; units.mjs; collector.mjs; in-progress*.mjs; inventory-results.mjs; photo-gallery.mjs; agentes/catalogo.mjs | tests/unit-catalogue.test.mjs; regressão de perfis/coleta/QR |
| 15 campos, sete tipos, 27 colunas | migrations/0016_unidades_cadastro_ampliado.sql; web/admin-units.js; web/spreadsheet-io.js; server/units.mjs; import-units.mjs; worker.mjs | tests/units.test.mjs; unit-catalogue.test.mjs; unit-files.test.mjs; unit-catalogue-browser.cjs |
| Rede em números/detalhe | web/unit-figures.js; desktop.js; unit-catalogue.css | totais, ausência/zero, filtros e capturas |
| Abreviação, cabeçalhos e total | web/unit-names.js; desktop-data.js; desktop.js; unit-catalogue.css | tests/unit-names.test.mjs (141 casos); navegador 1440/1672/1920 |
| Publicação/carga | Dois Workers publicados e migração 0016 aplicada por autorização posterior; carga não executada | PUBLICACAO_D068_2026-11-06.md, backup privado e pendências D-068 |

Documentos originais do pacote lidos: 00_LEIA_PRIMEIRO.md, 01_PEDIDO_E_CONTEXTO.md, 02_ESPEC_PARTE1_ESCOLAS_COMUNITARIAS_FORA_DO_INVENTARIO.md, 03_ESPEC_PARTE2_CADASTRO_UNIDADES_AMPLIADO.md, 04_ESPEC_PARTE3_CARD_EQUIPAMENTOS_POR_UNIDADE.md, 05_DICIONARIO_PLANILHA_API_MAPA.md, 06_PLANO_DE_CARGA_DADOS.md e 07_CRITERIOS_DE_ACEITE_E_TESTES.md; também 00_LEIA_PRIMEIRO_2.md externo, referência JS, CSV de 141 nomes e cinco CSVs de importação. Contatos/arquivos recebidos ficam privados. Base de Coleta e PNGs originais preservados.

## D-069 — consulta de equipamentos, 08/11/2026

| Requisito do pedido | Implementação | Aceite |
|---|---|---|
| Nome/célula abrem unidade e categoria, sem janelas encadeadas | web/desktop.js; desktop-equipment.js/.css | equipment-consultation-browser.cjs: três rotas, teclado, filtro vazio e retorno |
| Busca/paginação >50 e totais coerentes | server/inventory-equipment.mjs; collector.mjs | equipment-consultation.test.mjs: 58 fichas, 65 itens físicos, categorias, lote, busca e perfis |
| Fotos do equipamento e proxy privado | server/photo-gallery.mjs; web/photo-viewer.js | isolamento unidade/alvo, 51 fotos paginadas, galeria e ausências no navegador |
| ID, posição, funcionamento, AnyDesk/RustDesk | published_json no serviço; desktop-equipment.js | dados de rascunho não promovidos, zeros iniciais e cópia separada |
| Ficha do agente sem N+1 | agent-status existente, chamado ao abrir detalhe | hardware completo, presença sem inferência de desligamento e manual sem agente |
| Coletor/QR/cadastro preservados | mudança somente leitura desktop; sem migração | suíte do projeto e regressão de navegador |

Base original: sem perguntas alteradas; esta entrega exibe os equipamentos/fotos/estado já coletados. Limites de miniaturas e histórico documentados em docs/03-painel-desktop/CONSULTA_EQUIPAMENTOS.md. Evidências e publicação: docs/05-qualidade/CONSULTA_EQUIPAMENTOS_2026-11-08.md.

D-069: conferência autenticada real concluída após o responsável entrar como root (08/11/2026). Lista por unidade e categoria, categoria vazia, dados técnicos recebidos e foto do mesmo equipamento ampliada; evidências privadas e limites no relatório da entrega. Nenhuma alteração de registro durante a conferência.


## D-070 — 08/11/2026
Pedido direto de notificações de hardware/perda de comunicação e publicação real → server/agent-monitoring.mjs, server/agentes/presence.mjs, migração 0017, scheduled do painel, web/desktop-notifications.js/css, shell e consulta D-069. Oito testes de domínio/API/concorrência/volume + roteiro de navegador em tests/agent-monitoring-browser.cjs. Contrato: docs/04-dados-apis/MONITORAMENTO_E_NOTIFICACOES.md. Evidências/publicação: docs/05-qualidade/MONITORAMENTO_2026-11-08.md. Base de Coleta original preservada; nenhum novo campo do questionário.


## D-071 — operacao por unidade e central de demandas
Pedido explicito de 08/11/2026 -> migracao 0018_service_desk.sql; server/service-desk.mjs; web/operations.*; desktop-demand-count.js; shell/Worker/build -> tests/service-desk.test.mjs e tests/operations-browser.cjs. Documentacao: docs/03-painel-desktop/CENTRAL_DE_DEMANDAS.md, docs/04-dados-apis/CENTRAL_DEMANDAS_API.md e docs/05-qualidade/CENTRAL_DEMANDAS_2026-11-08.md. Base de Coleta original preservada; nao altera perguntas ou fotos.

Correção de 08/11: relato de Consultando permanente → navegação antiga interceptava /computadores e /demandas e mostrava Configurações. Rotas internas separadas em panel-shell.js/desktop.js; consultas GET limitadas e independentes em desktop-request.js/desktop-agents.js. Teste de menu falha antes e passa depois, incluindo voltar/avançar, timeout, filtro e 401. Registro: docs/05-qualidade/NAVEGACAO_PAINEL_2026-11-08.md. Sem alteração de perguntas ou persistência.

## Organização para auditoria — 08/11/2026

Pedido explícito de atualizar o repositório para auditar funcionamento e lógicas → docs/08-auditoria/README.md, MATRIZ_DE_LOGICAS.md, ROTEIRO_AUDITORIA.txt e VERIFICACAO_2026-11-08.md; manual operacional atualizado para 18 migrações/D-069–D-071. CI ampliada para nove roteiros de navegador, preservando suíte de 129 testes e builds. Teste integrado V3 adaptado à consulta embutida D-069, sem alterar aplicação. Documentos antigos identificados como históricos; pacotes recebidos mantidos privados. Autorização é para atualizar GitHub; esta entrega não executa deploy, escrita D1 ou mudança de questionário.


## Correções de desempenho — Fase 1 local, 09/11/2026
Pedido de iniciar correções do pacote externo → cache revalidado de assets/fotos, linha de integração reutilizada, memo de token condicionado à integração atual, primeira tentativa sem busca Drive, índices aditivos 0019, estabilidade DOM de ocorrências e WebP legado. Base §§1.2, 5, 7.5–7.6/7.11 e 8–9 preservadas; D-048/D-057/D-065 mantidas. Evidências, IDs da auditoria, contagens antes/depois e limites: [relatório da Fase 1](../05-qualidade/CORRECOES_PRODUCAO_FASE_1_2026-11-09.md). 134 testes e dez roteiros de navegador locais. Sem publicação/segredos/D1 remoto/Drive real. Política de 24 h e miniaturas no D1 não adotadas.

## Publicação da Fase 1 — 09/11/2026

Pedido posterior explícito “publique no ambiente real” → código `b96f428` publicado no painel (`e7261a18-7138-4877-b5cb-fbd5a41fbc5f`) e coletor (`9de19a35-cf5d-4172-a894-450995f218ad`), ambos em 100%; migração 0019 aplicada no D1 compartilhado após backup verificado. Cadastros, Drive, perguntas e perfis preservados. 46 verificações públicas do painel e 18 respostas adicionais nos dois endereços aprovadas, incluindo oito revalidações estáticas 304. Registro/limites/rollback: [publicação real](../05-qualidade/PUBLICACAO_FASE_1_2026-11-09.md). Sem novo upload autenticado: sessão do painel expirada. Demais fases da auditoria continuam pendentes.

## D-072 / auditoria Fase 2 — 09/11/2026

FOTO-02, ERR-04, ICO-21 e ICO-23 → decisão explícita de miniaturas no D1 → migração 0020, server/photo-thumbnails.mjs e photo-labels.mjs, rotas de fotos, web/photo-prepare.js, galerias/viewers, manutenção root → tests/photo-thumbnails.test.mjs e photo-thumbnails-browser.cjs. Base §§5.3–5.6 e 7: compressão, evidência vinculada e estados preservados; exceção binária limitada por D-072. Não modifica Base original ou demais perguntas. [Contrato](../04-dados-apis/MINIATURAS_D072.md), [aceite/limites](../05-qualidade/CORRECOES_PRODUCAO_FASE_2_2026-11-09.md).

Publicação real da Fase 2: código `2a43299`, painel `c6a440fb-ae93-4bd2-879c-eaba507e2fbc` e coletor `ef33d619-52da-4726-989c-6a49b551a899`, 100%; migração 0020 com backup validado. Root preparou as três fotos existentes pelo fluxo da aplicação (24.438 bytes de derivadas), sem alterar os originais. Miniatura e ampliação integral verificadas no painel real; 46 verificações públicas e dez negações 401 adicionais aprovadas. [Registro, contagens e limites](../05-qualidade/PUBLICACAO_FASE_2_2026-11-09.md). Fases 3–5 e homologação física permanecem pendentes.

## D-073 / auditoria Fase 3 — 09/11/2026

Pedido explícito para implementar/publicar Fase 3 preservando identidade e adiando decisões → desktop-blocks.js/desktop.js/desktop-map.js (DOM e mapa persistentes, busca 250 ms); collector.mjs (fachada e total oficial), photo-viewer.js (páginas de 48); detalhe TTL/Atualizar; in-progress.mjs (agent_linked); desktop-exports.js (matriz/fichas/ocorrências CSV/XLSX); desktop-results.js (descarta resposta de filtro antigo). Categoria da matriz D-069 preservada. Testes novos panel-blocks.test.mjs e panel-blocks-browser.cjs, CI ampliada. Base §§5, 7–9 e D-065/D-067 preservados. Locais/Ano continuam pendentes. [Aceite e limites](../05-qualidade/CORRECOES_PRODUCAO_FASE_3_2026-11-09.md).

D-073 publicada em produção: código final `1c332b8`, painel `104e92dc-7b74-4509-9ad9-24c215f7dbc1` em 100%, coletor preservado. Sem migração, dados e Drive preservados; 141 testes/12 roteiros, 46 verificações públicas e sete controles adicionais. Root conferiu galeria real de três fotos e fachada da unidade. [Registro final](../05-qualidade/PUBLICACAO_FASE_3_2026-11-09.md).
# D-074 — seleção de ambientes compartilhados (09/11/2026)

Pedido atual do responsável supera D-057 ponto 4. Base original §§1.1, 2.2–2.3, 4.B, 4.F.1 e 7.3: ambientes por unidade, vínculo de equipamento, colaboração e concorrência. Implementação em `web/collector-environments.js`, `web/collector-v3.js`, `web/collector-v3.css`, `server/collector.mjs`; asset incluído em `server/worker.mjs` e `scripts/build-collector.mjs`. Testes: `tests/collector-environments.test.mjs`, `tests/collector-environments-browser.cjs`, regressões V3/UX. [Relatório](../05-qualidade/AMBIENTES_COMPARTILHADOS_2026-11-09.md). Mantidos IDs, fotos, histórico e conclusão explícita; sem novos requisitos para outros equipamentos. Não inicia Fases 4/5 nem modifica a Base original.

## D-075 — senha e reentrada (09/11/2026)

Relato de repetição nos dois hosts → Base §8.4–8.7/8.9/8.11–8.12 e D-031 → worker.mjs (direcionamento e batch de senha), páginas Minha conta/login (ação voluntária e restauração) → auth-flow.test.mjs e auth-flow-browser.cjs. Auditoria oficial somente leitura, testes de senha exclusivamente em SQLite isolado. Sem cobertura adicional A–H/fotos/offline. [Evidências e limites](../05-qualidade/CORRECAO_SENHAS_2026-11-09.md).
## D-076 — nome de ambiente corrigível, 09/11/2026

Pedido do responsável + Base §§4.B, 4.F.1, 7.3–7.4 → `server/environments.mjs`, `server/collector.mjs`, migração `0021_environment_names.sql`, `web/environment-editor.js`, `web/collector-v3.js`, `web/desktop.js`; projeção de nomes em `inventory-equipment.mjs` e `photo-labels.mjs`. Testes: `environment-rename.test.mjs`, `environment-rename-browser.cjs`. [Relatório](../05-qualidade/EDICAO_AMBIENTES_2026-11-09.md). Não modifica a Base original ou pendências das Fases 4/5.

## D-077 — nomes de computadores/impressoras, 09/11/2026

Pedido explícito atual → Base §§7.3/7.4/9 e ID permanente → migrations/0022_equipment_names.sql, server/equipment-names.mjs, consultas inventory-equipment/in-progress/service-desk/photo-labels e editor desktop compartilhado. Root edita identificação exibida; hostname, coleta, vínculos e fotos intactos. Testes equipment-rename.test.mjs / equipment-rename-browser.cjs; [registro de aceite/publicação](../05-qualidade/EDICAO_NOMES_EQUIPAMENTOS_2026-11-09.md).

## D-078 — exclusão de equipamentos, 09/11/2026

Pedido atual/escopo root no desktop + Base §§9.2/9.5/9.11 → migrations/0023_equipment_deletions.sql; server/equipment-deletions.mjs; web/equipment-deletion.js; consultas oficial/operacional/parcial; proteção em collector.mjs. Histórico/fotos/ID preservados fora do catálogo ativo; testes de ACL, concorrência, idempotência, contagem e repareamento. [Evidências](../05-qualidade/EXCLUSAO_EQUIPAMENTOS_2026-11-09.md). Nenhuma exclusão real de teste.
## D-079 — identificação do vínculo/cadastro, 09/11/2026

Pedido explícito atual + Base §§7.3/7.4/9, D-069/D-070/D-071 → `server/equipment-link-state.mjs`, consultas `inventory-equipment.mjs`, `service-desk.mjs`, `in-progress.mjs`; apresentação compartilhada `web/equipment-link-state.js`, listas/fichas desktop e grid operacional. Filtro antes da paginação; comunicação separada; categorias sem agente não rotuladas como computador manual. Testes `equipment-link-state.test.mjs`, `equipment-link-state-browser.cjs` e regressões. [Registro](../05-qualidade/VINCULOS_AGENTES_2026-11-09.md). Não altera perguntas, persistência, fotos, vínculos ou pendências das Fases 4/5.

## D-080 — Mesa de dados e login, 10/11/2026

Pacotes e comparações entregues pelo responsável → `web/painel.css`, `panel-shell.js`, `panel-pulse.js`, entradas HTML e login; remoção de injeções de CSS; ajustes de assets no Worker/build. Identidade D-065, composição D-067 e vínculo D-079 preservados. `tests/panel-mesa-browser.cjs` cobre resumo/API, falha/recuperação, teclado/fixação, navegação móvel e login; regressões desktop verificam mapas, filtros, permissões, fotos e operações. Base original intacta: cobertura de apresentação/consulta e acesso (§§7/8/9), sem novas perguntas A–H, offline ou regras de conclusão. [Registro](../05-qualidade/MESA_DADOS_LOGIN_2026-11-10.md).

## D-081 — atenção de hardware no mapa e decisão

Pedido de 10/11/2026 → migração 0024, server/hardware-review.mjs e agent-monitoring.mjs, web/hardware-attention.js, desktop-notifications.js, desktop-map.js, operations.js e painel.css. Base §§9.2/9.5/9.11: histórico e ID preservados; D-070: comparação confiável; D-071: demanda vinculada sem duplicação. Aceite em [HARDWARE_DECISAO_2026-11-10.md](../05-qualidade/HARDWARE_DECISAO_2026-11-10.md). testes/hardware-review.test.mjs e hardware-review-browser.cjs, mais regressões anteriores. Nenhuma cobertura nova de perguntas do TXT; coleta/EXE/fotos inalterados.

D-081, esclarecimento de 10/11/2026: aviso ancorado na unidade e modal apenas por clique → desktop-map.js, hardware-attention.js, desktop-notifications.js e painel.css; testes hardware-review-browser.cjs e agent-monitoring-browser.cjs. [Aceite corrigido](../05-qualidade/HARDWARE_MAPA_CLIQUE_2026-11-10.md). Nenhuma pergunta da Base original alterada.

D-081, refinamento visual posterior: círculo pequeno pulsante e estado após parecer → desktop-map.js/painel.css; hardware-review-browser.cjs confere diâmetro, posição, vermelho/âmbar/retorno normal, clique, teclado e idempotência. Capturas em evidencias/hardware-circulos-2026-11-10/. Questionário e Base original preservados.

## D-082 — tour de lógica do painel

Fontes originais: docs/06-entregas/tour-logica-2026-11-10/. LOG-01/02/05 → server/service-desk.mjs, web/operations.js, web/panel-pulse.js; LOG-03/18 → web/desktop-map.js; LOG-04 → web/panel-shell.js, desktop.js, account-shell.js; LOG-06 → painel.css; LOG-07 → desktop-results.js; LOG-09 → operations.js + service-desk.mjs; LOG-11 → desktop.js, desktop-equipment.js, inventory-equipment.mjs; LOG-12/17 → desktop.js, desktop-demand-count.js; LOG-15/16 → account.js, admin-units.js, panel-confirm.js. Worker libera somente os módulos estáticos exigidos na página de conta, mantendo APIs restritas. Testes novos: tour-logic.test.mjs, tour-logic-browser.cjs, operations-network-browser.cjs, integrados à suíte/CI. [Evidência](../05-qualidade/TOUR_LOGICA_2026-11-10.md). Base original e coletor preservados.

Publicação D-082 confirmada em 10/11/2026: commit `f7bb832`, painel `07f8adf1-d733-459d-9826-5ad690b6c21d` em 100%; coletor inalterado. Nove verificações HTTP pós-publicação aprovadas. Navegação interna validada em ambiente isolado; navegador de produção sem sessão autenticada. Versão anterior e limites registrados no relatório de qualidade.

## D-083 — escolas online e cor do mapa

Mensagens do responsável e liberação “terminei” → web/school-presence.js, panel-pulse.js (evento com consulta existente), desktop.js, desktop-results.js/desktop-blocks.js, desktop-map.js e build. Classificação escolar reutiliza schoolTypes; presença reutiliza API D-071/D-070, sem nova escrita. Testes school-presence.test.mjs e school-presence-browser.cjs; regressões do pulso, mapa/alertas e composição. [Registro](../05-qualidade/ESCOLAS_ONLINE_2026-11-10.md). Nenhuma alteração à Base original ou ao questionário.

Publicação D-083: `11b90747-7d5a-4585-b2a5-fbe0c3af5f17`, 100%, commit `08dbf4a`; coletor inalterado; seis verificações HTTP pós-publicação aprovadas.

## D-084 — busca global de unidades e equipamentos

Escolha explícita “2” → server/panel-search.mjs + worker.mjs; web/panel-search.html/js, panel-shell.js, desktop.js, painel.css; escopo current explícito em inventory-equipment.mjs/desktop-equipment.js. Paginação/perfis/fotos e integridade oficial testados em panel-search.test.mjs e panel-search-browser.cjs, com regressões tour/blocks/identity/equipment/mesa. Build e CI incluem assets/testes. [Contrato](../03-painel-desktop/BUSCA_GLOBAL.md) e [evidências](../05-qualidade/BUSCA_GLOBAL_2026-11-10.md). Base original e questionário preservados; não depende de histórico do chat para manutenção.

Publicação D-084 confirmada: 5d01001e-6718-44c8-8399-c9c47e412d8d, 100%, commit 38e4907; oito verificações HTTP e coletor inalterado. 185 testes locais e seis roteiros de navegador aprovados.

## D-085 — indicadores de pendências

Escolha explícita opção 3/publicação real → server/pending-indicators.mjs + worker.mjs; filtro state=pending de hardware-review.mjs; desktop-demand-count.js/panel-pulse.js compartilham consulta de 15 s; desktop.js/painel.css apresentam três indicadores; pending-collections.html/js listam unidades elegíveis; hardware-attention.js abre somente sem parecer e solicita atualização após decisão. Testes pending-indicators.test.mjs e pending-indicators-browser.cjs, regressões de identidade/pulso/mapa/hardware/blocos/busca, integrados ao build e CI. [Contrato](../03-painel-desktop/INDICADORES_DE_PENDENCIAS.md), [evidências](../05-qualidade/INDICADORES_PENDENCIAS_2026-11-10.md). Base original e questionários preservados; nenhum novo requisito do TXT é declarado implementado nesta correção desktop.

Publicação D-085 confirmada: 815dfa78-702e-456d-a632-a1da1aabbd81, 100%, commit 102d6fa; 10 verificações HTTP pós-publicação, três consultas de leitura no D1 real sem escrita e coletor inalterado. 189 testes locais e sete roteiros de navegador aprovados; limites do aceite registrados no relatório.

## D-086 — Relatórios e Planejamento

Escolha explícita 2 → server/management-views.mjs + worker.mjs; critérios compartilhados de service-desk.mjs e pending-indicators.mjs; web/desktop-management.js + desktop.js/desktop-blocks.js/painel.css; build/CI/package. Testes management-views.test.mjs e management-views-browser.cjs, regressões identity/tour/blocks/pending. [Contrato](../03-painel-desktop/RELATORIOS_E_PLANEJAMENTO.md), [aceite e publicação](../05-qualidade/RELATORIOS_PLANEJAMENTO_2026-11-10.md). Base original e questionário preservados; nenhuma nova regra de coleta inferida.

Publicação D-086 confirmada: cf11b18f-1bff-47eb-a504-15f549de6f32, 100%, commit 98b78f2; 15 verificações HTTP pós-publicação, cinco consultas de leitura no D1 sem escrita e coletor inalterado. 195 testes de servidor e cinco roteiros de navegador aprovados; limites documentados no aceite.

## D-087 — categorias coloridas no mapa

Aprovação da paleta e ajustes vermelho/laranja/amarelo do responsável → unit-map-palette.js, desktop-map.js, desktop.js, admin-units.js, painel.css e build desktop. Legenda, nome/tipo acessível, centro por categoria e halo de hardware. Regressões school-presence-browser.cjs e hardware-review-browser.cjs; conferência local das sete cores e prévia. [Evidências](../05-qualidade/CORES_CATEGORIAS_MAPA_2026-11-10.md). Nenhuma pergunta da Base original alterada.

Publicação D-087: commit 866d8b4, painel 78ca889a-b71b-4c7f-bb20-5f5a09164086 em 100%, 10/11/2026 às 19:20:34 de Fortaleza; sete verificações HTTP aprovadas. Coletor inalterado; sem migração/escrita de teste oficial.

## D-088 — avisos de hardware e log de comunicação

Pedido direto + confirmação 48 horas → server/communication-log.mjs, agent-monitoring.mjs, hardware-review.mjs, worker.mjs; desktop-notifications/hardware-attention; school-presence/desktop/desktop-blocks/panel-shell/painel.css; nova página communication-log.html/js e build. Regra de incidente separada da presença recente, sino por parecer pendente, histórico consultável, offline acima de online. [Contrato](../03-painel-desktop/NOTIFICACOES_E_LOG.md), [testes/capturas/publicação](../05-qualidade/NOTIFICACOES_48H_2026-11-10.md). Nenhuma pergunta da Base original modificada ou nova funcionalidade de coleta declarada.
