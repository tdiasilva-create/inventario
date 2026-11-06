# Ambiente 2 — coleta online, 28/10/2026

## Escopo autorizado e fontes

Pedido do responsável: criar o segundo ambiente com os questionários aprovados e permitir sucessivas adições de equipamentos, sem teto fixo por prédio. D-040 define somente aparência; D-031 autoriza publicação autônoma. Esta entrega é uma fase **online**, não a homologação do offline completo.

Consultados: `00_LEIA_ANTES_DE_TUDO.md`, `AGENTS.md`, `docs/00-governanca/REGRAS_DE_PRECEDENCIA.md`, `DECISOES.md`, `PENDENCIAS.md`, `CONFLITOS_DOCUMENTAIS.md`, `INVENTARIO_DAS_FONTES_E_LACUNAS.md`; Base de Coleta original integral (1.084 linhas), `02_TELAS_E_TRANSICOES.md`, `03_CATALOGO_E_MAPEAMENTO.md`, `CATALOGO_DE_CAMPOS_EXTRAIDO.csv`, `04_FOTOS_E_ESTADOS.md`, `05_GUIA_VISUAL_MOBILE.md`, `06_ESPECIFICACAO_TELA_A_TELA.md`; documentos de dados/APIs e qualidade. Base original preservada.

Visuais: `coleta-escolar-aparencia.zip`, seu `GUIA-VISUAL.md` e 12 PNGs preservados em `design/referencias/coleta-aparencia-2026-10-28/`; referência mobile histórica `00_coleta_mobile_APROVADA.png`; desktop `00_painel_geral_APROVADO.png`, `01_mapa_da_rede_APROVADO.png`, `02_matriz_equipamentos_APROVADA.png`, `03_unidade_selecionada_APROVADA.png`, `04_indicadores_integrados_ESTUDO_APROVADO.png`. Diagramas e fontes DOT tratados como sínteses, sem criar requisitos.

## Cobertura da Base

| Fonte | Implementado nesta fase | Ainda falta / limite |
|---|---|---|
| §2 e §8 acesso | Login real; contas existentes; root/admin/operador coletam; visualizador somente consulta; operador só acessa unidades autorizadas no servidor | Autorização por grupos/exceções futura; sem cadastro de unidade pelo coletor |
| §3 e §6 | Oito cartões A–H; acesso livre; wizard; conclusão manual; confirmação de reabertura; revisão e envio explícito; sem porcentagem geral | Refinamento contínuo de usabilidade em aparelhos reais |
| §4.A | Unidade/usuário/data automáticos e responsável/cargo/observações opcionais | Nenhum dado institucional inventado |
| §4.B | Contagens por tipo e ambientes nomeados persistidos, usados nas fichas | GPS opcional não implementado |
| §4.C | Existência/funcionamento da internet; links, tipo, operadora, velocidades/teste e cobertura; ocorrências | Teste de velocidade é informado pelo coletor, não medição automática |
| §4.D | Rede/Wi-Fi, cobertura, roteadores/AP/switch/rack, quantidades/conservação, cabos e danos | Cadastro D contextual não cria automaticamente bens F, evitando dupla contagem |
| §4.E | Tomadas, irregularidades, proteção, espera de instalação e avaliação especializada | Fotos R2 ainda indisponíveis; justificativa explícita quando aplicável |
| §4.F e §5 | 17 categorias; identificação/alternativas; conservação, funcionamento, uso; problemas, ação e prioridade condicionais; técnicos opcionais; individual/lote conforme categoria | Regras objetivas de criticidade continuam pendentes P7; parâmetro de fotos por lote P6 não definido |
| §4.G | Atalho audiovisual sobre os mesmos bens F, sem copiar registros | Não constitui segundo inventário |
| §4.H | Impacto dos problemas existentes, necessidades, quantidade, justificativa, prioridade e origem | Tratamento administrativo de demandas em etapa futura |
| §7 | Rascunho confirmado no D1 distinto de cartão concluído e vistoria concluída; painel só recebe após confirmação transacional | Fotos: fluxo implementado, **upload R2 real NÃO testado/operacional** enquanto conta não habilita; otimização provisória 1600px/JPEG85/3MB é técnica reversível P5 |
| §8 offline | Avisos honestos de conexão; respostas em erro preservadas na aba; rascunhos já enviados retomáveis | Sem armazenamento local criptografado, desbloqueio offline, fila persistente ou homologação Android/iPhone; não fechar aba com trabalho não enviado |
| §9 continuidade | ID permanente, conferência rápida, última verificação separada da alteração, não verificado/não localizado, justificativa e caso automático; versões/locks e histórico; duplicidade sinalizada | Transferências, cancelamento e resolução/unificação de duplicados ainda faltam; conflito preservado exige revisão, sem resolução administrativa completa |
| §10–11 | Duas publicações com mesma persistência D1 e acesso Worker; consulta oficial/matriz/detalhe/questionário/ambientes e equipamentos paginados | R2, miniaturas, backup/recuperação e editor de questionário ainda não homologados |

## Capacidade e implementação

Não há teto de equipamentos por unidade ou de vistorias no código. Paginação de 50 por cursor no coletor; gravações individuais e identificador idempotente; campos de patrimônio/série não reaproveitados no botão “Salvar e adicionar outro”. Lotes contabilizam quantidade física. Projeções SQL incrementais evitam recontar todos os itens a cada adição. Limites físicos/quotas Cloudflare continuam aplicáveis; “sem teto do aplicativo” não significa armazenamento infinito gratuito.

Principais arquivos: `web/collector.html`, `collector.js`, `collector-schema.js`, `collector.css`, `collector-login.*`, `collector-account.*`; `server/collector.mjs`, `server/worker.mjs`; migrações aditivas `0006_collector.sql`, `0007_collector_totals.sql`, `0008_collector_publication.sql`, `0009_published_totals.sql`; `web/desktop-inventory.js`, integração em `desktop.js`; `scripts/build-collector.mjs`, `wrangler.collector.jsonc`. Nenhum segredo nos assets. Não inserir fixtures na produção.

## Testes executados

- 27 testes Node aprovados, incluindo regras de ficha/condicionais/lotes, catálogo e segurança.
- API real em Worker/D1 **isolados**: autorização por perfil/unidade, vistoria compartilhada, persistência/idempotência, duplicidade, lock exclusivo, conflito preservado, revisão e estados manuais.
- Volume: 1.005 inserções pela API, além do registro inicial = **1.006 registros**; 21 páginas sem perda/duplicação, busca do último item e repetição idempotente. Não houve SQL de carga direta de equipamentos.
- Conclusão A–H: versão antiga recusada; repetição não duplica vistoria; 1.006 registros publicados só após confirmação; nova visita preserva IDs/respostas; não localizado não altera publicação durante rascunho.
- Chrome real headless: 360/390/430px sem overflow; oito cartões, ambiente, reabertura, ficha sem CPU obrigatória, próximo patrimônio limpo, retomada após F5; zero erros JS.
- Desktop 1672px: indicador/matriz com 1.006, questionário e ambiente recebidos, lista de 50 e próxima página; zero erros JS. Cartografia não modificada.
- R2 indisponível: upload responde 503, nunca falso sucesso; falha visível sem foto/justificativa bloqueia; justificativa explícita permite concluir cartão. Isso **não comprova upload R2**.

Evidências: `evidencias/coletor-online/api.json`, `volume.json`, `finish.json`, `ui.json`, `desktop.json`, `photos-blocked.json` e capturas `01-unidades.png` a `08-equipamentos-paginados.png`, `lista-360.png`, `lista-430.png`. Essas capturas usam dados de teste somente no banco isolado, nunca dados oficiais.

## Pendências expressas

R2 retornou Cloudflare 10042 (“habilitar no Dashboard”); responsável informou “Vou habilitar o R2”. A promessa não foi tratada como ativação concluída. Sem binding até habilitar. UI consulta capacidade e informa fotografias indisponíveis. Após habilitação: criar bucket privado institucional, vincular ambos Workers, testar upload/retentativa/leitura autorizada e obrigatoriedades em aparelhos reais.

Continuam P1–P9/P11 aplicáveis, offline completo, resolução administrativa de conflitos/duplicados, transferências/cancelamento, relatórios e critérios de pendências/alertas. O quinto indicador não inventa um total: mostra critério pendente. Não afirmar cobertura completa da Base nesta fase.

## Publicação e verificação externa

- Coletor: https://inventario-semed-lumiar.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev/login — versão `a58f937f-57b2-475a-966a-943c34d0973d`.
- Desktop: https://painel-semed-paco.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev — versão `851b9e1a-34e6-4d2d-a97e-65d9d69cf179`.
- Quatro migrações aditivas aplicadas ao D1 institucional. Consulta de produção após implantação: 1 unidade, 5 contas preexistentes, zero equipamentos, zero vistorias e zero fotos. Sem escrita de fixtures nem redefinição de senha.
- HTTP externo: login e assets públicos corretos; páginas privadas redirecionam ao login; APIs de catálogo/inventário/vistoria/fotos respondem 401 sem sessão. Evidência `production-http.json`. Escrita autenticada testada no ambiente isolado, sem criar vistoria de teste oficial.
- Login público também inspecionado visualmente em 390px, sem overflow/erros JS: `09-login-publicado.png`.
- Encerramento: Worker `painel-semed-paco-validacao` e D1 `semed-auth-validacao` (ID `90a217c8-8540-4ee2-a2a4-8e328137c5a1`), criados somente para os testes, removidos após guardar as evidências. Scripts de verificação foram preservados; exigem recriar/configurar um ambiente isolado antes de repetir. Nunca apontá-los à produção, pois criam fixtures.
