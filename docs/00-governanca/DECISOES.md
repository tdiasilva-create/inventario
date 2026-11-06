# Registro de decisões aprovadas — D-001 a D-021

**Fonte:** decisões expressas na conversa e no TXT consolidado v1.0 de 27/10/2026. Em caso de divergência, prevalece o TXT mais recente para requisitos mobile. Aqui há um índice, não um substituto ao TXT.

| ID | Decisão aprovada | Fonte |
|---|---|---|
| D-001 | Duas interfaces especializadas: coleta mobile e painel desktop | Conversa |
| D-002 | D1 para dados, R2 para fotografias; Workers como API/backend | Conversa e base §1 |
| D-003 | 90 unidades oficiais fornecidas e gerenciadas por administrador | Conversa e base §2.5 |
| D-004 | Coletor não cria/edita unidades; só atua nas autorizadas | Base §2.5, §8 |
| D-005 | Inventário permanente, conferência/atualização sem reconstrução da base a cada visita | Base §1.1, §2.1 |
| D-006 | Mobile-First Task-Oriented Wizard + Card-Based Navigation + Guided Data Entry | Base §1.3, §3 |
| D-007 | Ordem sugerida de cartões, navegação livre e dependências bloqueantes | Base §3.2 |
| D-008 | Cartões exibem estados: Pendente, Em andamento, Concluído; conclusão manual e confirmação ao reabrir | Base §3.3 |
| D-009 | Não ter progresso percentual geral na coleta mobile | Base §3.3 |
| D-010 | Mobile dark-tech da imagem 00 aprovado; app de coleta, NÃO dashboard | Escolha visual posterior |
| D-011 | Desktop dark-tech com mapa, matriz equipamentos e unidade selecionada | Escolhas visuais anteriores |
| D-012 | Rejeitar grandes cards repetitivos de KPI no desktop | Escolhas visuais anteriores |
| D-013 | Questionário em grupos A-H; G como agrupamento visual sem duplicar fichas de F | Base §4 |
| D-014 | Cadastro individual/híbrido por categoria conforme tabela detalhada | Base §4.F.2 |
| D-015 | Fotos câmera/galeria, até 5 por equipamento, opcionais, salvo regras específicas de infraestrutura | Base §5 |
| D-016 | Vistoria passa ao painel somente após conclusão oficial e confirmação servidor | Base §7.5 |
| D-017 | Autosalvar + Salvar; suporte offline com proteção local e sincronização | Base §7 |
| D-018 | Exatamente 2 perfis iniciais: Administrador e Coletor | Base §8.1 |
| D-019 | Login com usuário/senha; cadastro e reset pela administração | Base §8 |
| D-020 | Histórico, concorrência, duplicatas e transferências respeitam autoridade administrativa | Base §§7,9 |
| D-021 | Backups diários, retenção 7 dias, teste trimestral | Base §10 |

## Regra de integridade
Números fictícios de equipamentos, porcentagens, mapa e nomes inventados nos PNGs NÃO são decisões de produto. `90 unidades` é o número real informado pelo responsável, mas os nomes oficiais ainda devem ser importados.

## Decisão explícita posterior — 27/10/2026

**D-022 — Prioridade de execução: painel desktop.** O responsável corrigiu a prioridade: “quero iniciar os trabalhos com o painel de recebimento das informações”. A coleta já criada permanece acessível em `/coleta.html`; a entrada `/` passa ao painel.

**D-023 — Referência principal desta fase: imagem reenviada `Imagem do ChatGPT 27 de out. de 2026, 06_47_01.png`, equivalente a `design/referencias/desktop/00_painel_geral_APROVADO.png`.** Pedido: “criação desse modelo com muita fidelidade”. Aplicar sua composição completa, inclusive a faixa de cinco indicadores. Esta escolha visual mais recente prevalece, para este protótipo, sobre a rejeição anterior dessa faixa em D-012, AGENTS.md e especificações derivadas. Preservar mapa, matriz, alertas, unidade e galeria como áreas principais. Não extrapolar a escolha visual para fórmulas ou requisitos de negócio.

**Limites mantidos:** componentes reais; dados da referência somente em DEMO isolada e rotulada; sem localizações oficiais inventadas, autenticação ou recebimento simulado. Persistência futura continua D1/R2/Workers.

## D-024 — mapa V33, escopo confirmado em 27/10/2026

Responsável forneceu `MAPA-SEMED-V33.html` e esclareceu: “hoje o que pretendo pegar é a aparência do mapa e a região real que iremos trabalhar”. Aplicar somente a cartografia e a região de Paço do Lumiar ao mapa do painel. Informações das escolas ficam para etapa posterior. Preservar outras áreas do painel.

DERIVADO/IMPLEMENTADO: Leaflet 1.9.4 extraído do arquivo, ruas/satélite, escala, zoom, enquadramento e contorno com 159 vértices fornecidos no V33. A geometria fica registrada como contorno da fonte recebida, não como limite oficial homologado. As posições percentuais da amostra DEMO nunca são convertidas em latitude/longitude.

Não conectar a API da outra aplicação nem importar seus cadastros, credenciais, consultas de alunos ou servidores. Referência sanitizada/reprodutível: `scripts/extract-map-reference.mjs` e `web/data/map-v33.json`, com SHA256 da fonte. Base TXT e arquitetura D1/R2/Workers preservadas.

## D-025 — exemplos de locais institucionais da planilha, 27/10/2026

Nota de precedência visual posterior: D-026 abaixo altera somente os indicadores superiores, preservando mapa e demais áreas.

O responsável forneceu a planilha “API MAPA (SEMED)”, aba `1835004469`, e pediu detectar os locais institucionais e usá-los como exemplo. O campo `TIPO_INSTITUICAO = UNIDADE ADMINISTRATIVA` identifica CME, SEADEX, SEMED e CENTRO LUMINENSE DE CONHECIMENTO, todos com latitude/longitude preenchidas.

Usar os quatro como camada de referência “Locais”, com origem e condição de exemplo visíveis. Amplia D-024 apenas para esses exemplos; não é importação definitiva no catálogo D1, não aprova métricas da planilha nem substitui requisitos TXT. A fonte não é alterada.

DERIVADO técnico: cópia de campos permitidos em `web/data/map-examples.json`, com URL, data, hash e linha da fonte. Código repetido não unifica locais; IDs da amostra são baseados na linha da cópia, sem pretensão de ID permanente oficial.

## D-026 — ícones superiores modernos, sem caixas coloridas, 27/10/2026

Pedido explícito: “vamos usar essa referencia de icones mais modernos sem essas caixas no superior. nao mexer no mapa. estou falando somente dos icones”. Fonte recebida: `Imagem do ChatGPT 27 de out. de 2026, 19_07_39.png`, preservada em `design/referencias/desktop/05_icones_superiores_APROVADOS.png`.

Aplicação restrita: os cinco indicadores superiores passam a usar ícones SVG de traço moderno, cores nos símbolos, brilho discreto e faixa contínua sem os fundos individuais de caixas coloridas. Valores DEMO, filtros e demais setores não mudam. Esta escolha supera somente o tratamento visual anterior das caixas em D-023; não adota o layout do mapa ou outros elementos da nova imagem.

Mapa, controles, ícones compartilhados com o mapa, camadas, coordenadas, exemplos e tamanho/posição do setor preservados. Não há novo requisito de negócio ou mudança na Base TXT.

## D-027 — endereços separados e publicação do painel, 27/10/2026

O responsável autorizou iniciar a publicação gratuita do desktop e escolheu `painel-semed-paco`; para o coletor futuro, escolheu `inventario-semed-lumiar`. A autorização cobre o painel, não a publicação do coletor. Usar a conta Cloudflare institucional Secretaria Municipal de Educação de Paço do Lumiar.

Publicado somente o protótipo desktop em Workers Static Assets, sem D1, R2 ou backend nesta fase. Dados demonstrativos continuam identificados. A arquitetura definitiva D1 + R2 + Workers e os requisitos de autenticação permanecem inalterados. O nome futuro do coletor é uma escolha de projeto, ainda não uma implantação ou reserva garantida.

Endereço: https://painel-semed-paco.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev
Versão inicial: `915533e5-5aea-4643-b3d5-af3dbacab13b`.

## D-028 — login e perfis definidos pelo responsável, 27/10/2026

Pedido: criar página de login a partir das três imagens fornecidas; perfis: admin, root, operador e visualizador. Esta decisão posterior substitui a limitação anterior de dois perfis para o novo planejamento de acesso. A matriz de permissões e a relação do operador com o coletor permanecem PENDENTES, sem concessões presumidas.

Implementação desta fase: tela visual em `/login.html`, usuário/senha e orientação de reset por administração. Não existe autenticação, sessão, autorização ou offline operacional. Sem seletor de perfil: o papel deverá ser determinado pelo servidor a partir da conta. Painel DEMO preservado. As imagens fornecidas são usadas como marca e paisagem; o mockup é referência visual, não promessa funcional.

## D-029 — refinamento visual do login, 27/10/2026

Responsável pede refazer login com maior fidelidade ao PNG, gerar fundo similar e usar marca original sem fundo branco. Implementado fundo ilustrativo novo, marca original com tipografia branca via composição CSS e símbolo colorido preservado, proporções revistas e ícones SVG. Esta aprovação visual não altera permissões nem aprova autenticação/offline. Evidências: `docs/05-qualidade/LOGIN_01.md`, revisão 02.

## D-030 — publicação do login e solicitação de contas, 27/10/2026

Responsável autorizou publicar e criar usuários. Tela publicada no mesmo Worker, rota `/login.html`, versão `34738de1-1145-4a96-a326-8dfbd4d05ebd`. Criação real de contas pendente de nomes individuais e definição dos poderes dos quatro perfis; pergunta encaminhada ao responsável. Nenhuma conta fictícia criada, nenhum backend de sucesso simulado. Proposta de atribuições explicitamente não aprovada: `docs/04-dados-apis/PROPOSTA_ACESSO_INICIAL.md`.

## D-031 — acesso real, contas iniciais e autonomia da etapa, 27/10/2026

Responsável confirmou a matriz root/admin/operador/visualizador, os nomes iniciais iguais aos perfis e, após proposta explícita do escopo, autorizou “inicie sem precisar interagir comigo”. Autorização cobre implementar/testar/publicar autenticação, administração e permissões no servidor; contas iniciais sob responsabilidade do solicitante para testes. Sessões de 1 hora e senhas provisórias de 24 horas, troca obrigatória no primeiro acesso. A autorização não converte DEMO em inventário oficial e não autoriza inventar unidades ou regras de negócio.

Root: segurança e administração completa; admin: usuários operacionais e administração do inventário; operador: coleta/atualização em unidades autorizadas; visualizador: consulta sem alteração. Operador não ganha acesso gerencial por ser usuário autenticado. As funções de inventário e atribuição de unidades aguardam integração futura; nesta etapa são aplicadas as permissões às operações de contas existentes.

Parâmetros iniciais ficam persistidos no D1 e ajustáveis pelo root para novas emissões. Limites técnicos reversíveis da interface: sessão entre 15 minutos e 24 horas; senha provisória entre 1 e 48 horas. Esses limites são escolhas de implementação, não alteração da Base original.

## D-032 — remover dados fictícios do inventário, 28/10/2026

Pedido explícito do responsável: apagar os dados fictícios para deixar o sistema limpo. Removidas escolas de exemplo, métricas, taxas, alertas, ambientes, datas, notificações e fotografias fictícias da aplicação desktop e do pacote público. Removida a opção de restaurar a demonstração. Preservar contas, sessões, auditoria, identidade visual e referências documentais originais. Manter o mapa real e os quatro locais institucionais extraídos da planilha, que não são dados inventados nem indicadores de inventário.

Indicadores sem integração mostram traço e “Sem dados recebidos”, sem afirmar que toda a rede tem zero equipamentos. D1 permanece dedicado a acesso e segurança; consulta confirmou ausência de tabelas de inventário. Nenhum DELETE no banco foi necessário. Versão publicada: `2860cff0-2b6e-43b8-8813-e9a03b7677bd`.

## D-033 — remover também todos os locais do mapa, 28/10/2026

Responsável esclareceu que as unidades de referência do mapa também devem ser removidas. Esta decisão supera a preservação desses quatro locais em D-032. `web/data/map-examples.json` agora tem registros vazios, sem nomes, códigos ou coordenadas de instituições; botão Locais removido e descrição do mapa atualizada. Cartografia/contorno permanecem. Contas de acesso e auditoria preservadas. Não houve alteração no D1, que não tinha tabelas de inventário.

## D-034 — escala inicial de 3 km no mapa, 28/10/2026

Responsável pediu mapa iniciando com zoom de 3 km. Usar centro de Paço do Lumiar já documentado e nível Leaflet 12, que produz escala de 3 km com régua métrica de 100 px nessa latitude. Substituído enquadramento automático inicial por centro/zoom fixos, evitando variação conforme tamanho do painel. Enquadrar mapa retorna ao mesmo padrão; navegação interna preserva ajustes manuais da sessão. Sem alteração de contorno, camadas ou unidades.

## D-035 — ambiente de administração root e distribuição das visitas, 28/10/2026

Responsável esclareceu que root cadastra unidades oficiais, cria usuários individuais, define operador/visualizador e decide as unidades que cada operador visitará. Implementar administração explícita no painel e acesso `/administracao`, com cadastro/edição/inativação de unidades, gestão individual de usuários e atribuições diretas de unidades a operadores. O operador consulta somente unidades ativas autorizadas pelo root; não cria escolas. Não é calendário de visitas nem implementação do coletor completo.

Esta decisão posterior restringe criação de usuários ao root, superando a concessão anterior dessa operação ao admin. Reset/desativação/revogação administrativos mantêm os limites anteriores. Root pode alterar perfil de outro usuário, com invalidação de sessões e remoção de atribuições quando deixa de ser operador. Unidade é cadastro mestre; cadastrar não é receber coleta nem concluir vistoria.

Campos mínimos desta fatia: nome obrigatório; código/INEP, endereço, bairro e par latitude/longitude opcionais. Ausência de coordenadas não gera marcador. IDs imutáveis gerados no servidor, verificação de duplicidade por nome normalizado/código e versão para edição concorrente. Atribuição direta por operador; grupos e exceções do modelo híbrido permanecem etapa futura. Não importar nem gerar exemplos no banco oficial.

## D-036 — simplificação e separação dos cadastros, 28/10/2026

Responsável rejeitou a organização anterior e definiu somente quatro campos para o cadastro root: nome da unidade, nome do gestor, latitude e longitude. Trocar Administração por Cadastro de unidades; Usuários em outra aba/página. Retirar da interface Unidades por operador e Segurança.

Implementado em `/cadastro-unidades` e `/usuarios`. Redirecionamento compatível de `/administracao`. Migração aditiva `0004_unit_manager.sql` preserva registros e acrescenta gestor; edição simplificada preserva campos antigos não exibidos. Autenticação, permissões, sessões e auditoria permanecem no servidor. A remoção da tela de atribuições não autoriza ampliar acesso de operadores a todas as unidades: essa política não foi alterada automaticamente. Campos de latitude/longitude continuam opcionais como antes, em par quando preenchidos; não inventar novas exigências.

## D-037 — revisão detalhada do painel e cadastro completo, 28/10/2026

Fonte mais recente: `docs/01-projeto/REVISAO_DO_RESPONSAVEL_2026-10-28.txt`, cópia integral do arquivo enviado “INVENTÁRIO TECNOLÓGICO SEMED · PAINEL Revisão de erros, organização da página e…”. Supera D-036 quanto aos quatro campos e à retirada de atribuições/segurança. Retorna o formulário completo com tipo, INEP (oito dígitos; dispensado somente para núcleos), polo, bairro, endereço, gestor, telefone, e-mail, coordenadas e situação. Faixa geográfica solicitada: latitude -2,62 a -2,45; longitude -44,20 a -44,02. Não corresponde à validação de polígono oficial.

Restaurar Operadores × unidades e Segurança e auditoria dentro do shell do painel; agrupar Consulta/Gestão/Administração; rotas reais, histórico, avatar único, mini-mapa, tabela e importação CSV/XLSX com prévia e confirmação. Cadastro e atribuições continuam exclusivos do root (D-035); exibir grupo administrativo ao admin não amplia suas permissões no servidor. INEP requerido também para Unidade administrativa conforme texto literal da revisão; nenhuma dispensa adicional foi presumida.

Os 149 locais mencionados são referência de volume, não registros nem indicadores oficiais. Não preencher catálogo com exemplos. Indicadores não integrados mostram zero e “Aguardando coletas”, conforme revisão, sem afirmar inventário físico zero. Somente Unidades representa a contagem real do cadastro mestre. Coleta mobile, fotos R2 e sincronização continuam sem integração operacional.

Escolhas técnicas reversíveis: máximo de 200 linhas/2 MB por arquivo; prévia vinculada ao root, expira em 30 minutos, confirmação atômica e repetição sem duplicação. XLSX local via ExcelJS 4.4.0, sem serviço externo. Migração aditiva 0005 preserva usuários, senhas e cadastros existentes. Autonomia de publicação já concedida em D-031 permanece aplicável.

## D-038 — mapa centralizado no município, Ruas e limite opcional, 28/10/2026

Responsável corrigiu o enquadramento: centralizar na marcação do município, abrir com Ruas em vez de Satélite e ocultar a marcação até seleção. Supera D-034 quanto ao centro/zoom fixos. Enquadramento inicial e botão Enquadrar usam os bounds do contorno existente, com margem para os controles e zoom adaptado ao espaço disponível (máximo 12). Não altera nem homologa a geometria, não cadastra marcadores. Limite do município inicia desativado e aparece somente ao clicar; escolha de camada/limite e câmera são mantidas durante navegação da sessão. Novo carregamento restaura Ruas/limite oculto.

Aceite: mapa em Ruas, contorno ausente inicialmente, contorno inteiro centralizado ao ativar, reset restaura enquadramento. Chrome em 1672, 870 e 390 px: aprovado. Evidências em `docs/05-qualidade/evidencias/mapa-ruas-centralizado/`.

## D-039 — INEP obrigatório apenas para escolas, 28/10/2026

Responsável reportou bloqueio da SEMED administrativa e definiu a regra corrigida: Escola municipal e Escola conveniada exigem INEP; Núcleo Educa Paço, Núcleo tecnológico e Unidade administrativa aceitam vazio, persistido como NULL sem gerar código. Todo INEP preenchido continua sujeito a oito dígitos numéricos e unicidade. Esta decisão supera a exigência para unidades administrativas registrada em D-037.

Texto: “Código INEP (8 dígitos · obrigatório para escolas)”; asterisco/required mudam imediatamente conforme tipo. Erro de ausência: “Escolas municipais e conveniadas precisam do INEP de 8 dígitos.” Regra compartilhada por navegador, Worker e importação CSV/XLSX. Tabela exibe — e ordena códigos vazios depois dos preenchidos.

Responsável forneceu e pediu validar o cadastro oficial de SECRETARIA MUNICIPAL DE EDUCAÇÃO - SEMED, Unidade administrativa, gestor FABIO HENRIQUE, telefone (98) 2222-0395, e-mail gabsaaf@pacodolumiar.edu.ma.gov.br, latitude -2.540829, longitude -44.170534, ativa, INEP/polo/bairro/endereço vazios. Registrar exclusivamente essa unidade, sem códigos inventados. Os demais locais citados como exemplos não foram autorizados como registros e não serão criados automaticamente.

Implementação/testes/evidências: `docs/05-qualidade/INEP_OPCIONAL_01.md`. Sem mudanças de acesso, senhas, geometria, equipamentos ou coletas.

## D-040 — nova referência exclusivamente visual do coletor, 28/10/2026

Responsável enviou `C:/Users/SIGAE/Desktop/coleta-escolar-aparencia.zip` e explicitou: define somente aparência, não perguntas. Lidos GUIA-VISUAL.md e abertas visualmente as 12 capturas (seleção, categorias, FAB, opções/wizard, bottom sheet, erros, condicional, fotos/confirmação, novo formulário e troca de escola). Capturas e guia preservados em `design/referencias/coleta-aparencia-2026-10-28/`. Guia do pacote é fonte visual subordinada ao escopo explícito do responsável.

Referência: fundo claro, superfícies brancas, primária petróleo, Figtree, cartões arredondados/ícones em duas colunas, campos e opções grandes para toque, cabeçalho/rodapé fixos, navegação de etapas, seleção em painel inferior e aparência da câmera/prévia. Esta referência atualiza a aparência anterior da coleta mobile. Painel desktop permanece como está.

Categorias, perguntas, opções, obrigatoriedades, número de etapas, exemplos de escolas e comportamentos de persistência presentes no pacote NÃO são novos requisitos. Permanecem Base original, grupos A–H e decisões posteriores aplicáveis. Indicadores Salvo/Offline dependerão de estados reais e testados; progresso de etapas não vira percentual geral. Código do ZIP não foi executado nem integrado. Nesta entrega houve somente inspeção/registro documental, sem implementação ou publicação do coletor e sem mudanças de dados.

## D-041 — implementar ambiente 2 e adições sem teto fixo, 28/10/2026

Responsável autorizou criar o ambiente de coleta com os questionários aprovados e esclareceu que haverá prédio com grande quantidade de equipamentos: cadastro deve permitir sucessivas adições sem limite artificial por unidade. A ausência de teto da aplicação não elimina quotas físicas/comerciais da hospedagem. Sem nova regra de quantidade máxima de bens.

Implementada primeira fase online com aparência D-040 e cartões A–H da Base, login e unidades autorizadas, ambientes, fichas individuais/lotes por categoria, conferência, versões/histórico, revisão/conclusão explícita e consulta desktop oficial. Workers separados compartilham D1; não duplicam equipamentos em revisitas. Migrações aditivas 0006–0009; contas e catálogo existentes preservados. Autorização de publicação D-031 mantida.

Teste isolado real: 1.006 registros, 21 páginas, idempotência, publicação após confirmação, rascunhos fora dos indicadores, retomada F5. Produção sem fixtures. Fonte/evidências/limites: `docs/05-qualidade/COLETOR_ONLINE_01.md`.

Responsável respondeu “Vou habilitar o R2”; serviço continua retornando 10042 até esta entrega. Não confundir resposta com habilitação: fotos mostram indisponibilidade e não fingem upload. O fluxo de integração R2 só será considerado operacional após teste real. Offline criptografado, resolução administrativa completa de duplicidades/conflitos, transferências/cancelamento, backups e pendências da Base continuam sem homologação. Esta fase não declara cobertura integral da Base.

## D-042 — listagem inicial de unidades pendentes para operador, 28/10/2026

Responsável corrigiu o comportamento: ao acessar, operador precisa ver todas as unidades que ainda não receberam cadastro de equipamentos, em lista de cartões como `01-selecionar-escola.png`, sem depender de busca. Esta decisão supera a exigência de atribuição individual prévia de D-035 **para unidades oficiais ativas com inventário de equipamentos pendente**. Não concede cadastro de unidade nem acesso ao painel gerencial.

Listar imediatamente “Pendentes”, incluindo não iniciadas e em preenchimento; busca apenas filtra a lista já visível. Não remover a unidade após salvar o primeiro item: o inventário em rascunho ainda pode precisar de muitos registros e deve ser retomável. Critério técnico derivado: pendente enquanto não há equipamentos publicados por vistoria confirmada. “Com inventário” fica separado, respeitando acesso já atribuído ou participação do operador, preservando continuidade da Base. Não confundir equipamento rascunho com inventário oficialmente recebido.

Mesma política aplicada em listagem, início/retomada, leitura e escrita vinculadas à vistoria. Unidades inativas permanecem bloqueadas. Cadastro mestre continua exclusivo root; exemplos da imagem não viram unidades oficiais. Sem alteração de dados, perguntas, mapa ou regras de conclusão/fotos/offline. Testes e capturas: `docs/05-qualidade/LISTAGEM_UNIDADES_01.md`.

## D-043 — conectividade independente do cadastro de ambientes, 28/10/2026

Responsável rejeitou o bloqueio de conectividade quando ambientes ainda não foram cadastrados. Cartão C deve poder ser concluído independentemente do cartão B. Quando houver locais sem conectividade, aceitar sua descrição sem exigir vínculo ao catálogo de ambientes; se existirem ambientes, permitir selecionar os já cadastrados ou descrever. A descrição é uma representação do local observado, não criação automática de ambiente nem equipamento.

Preservar referências e respostas anteriores; cadastrar ambientes depois não invalida C concluído por descrição. Ocorrências C não mostram seletor opcional vazio nem chamada que sugira obrigação de abrir B. Demais respostas aplicáveis e foto/justificativa de falhas visíveis permanecem. Não retirar validações de equipamento nem ampliar a mudança automaticamente para todos os grupos. Testes e capturas em `docs/05-qualidade/CONECTIVIDADE_INDEPENDENTE_01.md`.

## D-044 — corrigir relatos de navegação e preparar novo teste, 28/10/2026

Responsável enviou dois relatos e 11 capturas, perguntou pela ausência de fotos e autorizou iniciar as modificações, solicitando novo prompt de testes ao final. Os dois relatos têm conteúdo idêntico (SHA-256 A642E9348039316069BB638508CFCB00690AF446BD1A226A9597F72929A9D7E9) e foram preservados, junto às imagens, em `docs/01-projeto/relatos-navegacao-2026-10-28/`. São evidência de teste; sugestões dos documentos não são automaticamente novos requisitos.

Correções: estender a identificação por descrição aos locais de infraestrutura/rede/energia/necessidades D/E/H, preservando seleção de ambientes existentes e sem inventar cadastros; equipamentos F/G continuam vinculados a ambientes reais. Agrupar perguntas relacionadas (D até oito etapas), títulos específicos de roteadores/APs/switches/racks, revisão com registro/campo e atalho direto à pendência, retorno à revisão, histórico do navegador e restauração de unidade/etapa por URL. Navegação sem alterar respostas não grava nem muda estado, inclusive na API. Não apagar histórico nem redefinir cartões antigos que já ficaram Em andamento.

Ajustes visuais e de clareza: espaço próprio para botão +, quantidade exibida após filtro, carregamento, título G, favicon; instalação PWA continua fora do requisito obrigatório. URL armazena somente identificadores/posição; não é implementação de offline ou persistência local de respostas/fotos. Sem alteração do catálogo/perfis/conclusão oficial, sem fixtures em produção.

R2 continua retornando 10042 (não habilitado). Não criar armazenamento alternativo nem afirmar upload operacional. Fotos e homologação em Android/iPhone físicos continuam pendentes. Detalhamento e evidências em `docs/05-qualidade/REVISAO_NAVEGACAO_02.md`; novo roteiro `TESTE_DE_NAVEGACAO_COLETOR_SEMED_REVISAO_2.txt`.

## D-045 — acompanhamento das coletas em andamento no desktop, 28/10/2026

Responsável autorizou acrescentar “Coletas em andamento”, pois precisa acompanhar o que acontece durante o preenchimento e ver informações salvas antes de concluir a vistoria. Decisão posterior permite exibir rascunhos confirmados no servidor em área própria, identificada como PARCIAL. Não transforma rascunho em resultado oficial e não altera a confirmação final da vistoria.

Área de consulta no desktop para seus perfis de leitura (root/admin/visualizador), sem acesso gerencial para operador. Menu e resumo no Panorama, lista paginada das visitas abertas, unidade, quem iniciou, última atividade, estados A–H, fichas novas/alteradas e quantidades de lotes, respostas salvas, ambientes, fichas detalhadas e últimas atividades com autor. Não mostrar digitação sem confirmação do servidor nem fotos somente na memória do aparelho.

Escolha técnica reversível: consulta automática a cada 15 segundos enquanto a página está visível, botão Atualizar agora e horário da consulta; não é websocket nem promessa de atualização instantânea antes do salvamento. Migração aditiva 0010 mantém totais incrementais e índices para não varrer todos os equipamentos em cada consulta. Área é somente leitura; correções continuam no coletor. Visita concluída sai da lista de andamento e pode ser consultada oficialmente, preservando IDs/contagens.

Testes, capturas, limites e publicação em `docs/05-qualidade/COLETAS_EM_ANDAMENTO_01.md`. R2 e offline permanecem pendentes; essa entrega não afirma upload nem visualização operacional de fotos parciais.

## D-046 — autoridade do root e continuidade entre operadores, 28/10/2026

Responsável esclareceu que root deve poder editar e excluir conteúdos e que a participação do operador na unidade é momentânea, sem propriedade exclusiva; outro operador pode continuar a qualquer momento. Supera D-042 na restrição de unidades já publicadas a atribuições/participantes anteriores. Todos os operadores autenticados podem consultar e iniciar/retomar qualquer unidade oficial ativa, inclusive com inventário recebido. Inativas continuam fora da coleta; operador não cria/edita/exclui catálogo mestre nem acessa o painel gerencial. Autoria e controle de versões/bloqueio de equipamento permanecem.

Primeira fatia implementada: root mantém edição/ativação e ganha exclusão efetiva do cadastro de unidade e seus dados operacionais vinculados, com prévia de impacto, nome exato e motivo. Histórico de mudanças, conflitos e recibo de exclusão permanecem para rastreabilidade. A exclusão integral da unidade é ação explícita posterior; não altera automaticamente a política de descarte de equipamento pelo operador (§9). Exclusão disponível também para unidade com dados recebidos, não apenas vazia. Nenhuma unidade real é excluída durante implantação.

Cadastro mostra atalho Editar inventário para o coletor, com a vistoria aberta quando existente; autenticação do outro endereço é própria, sem transferir credenciais pela URL. Root já possui escrita nos questionários/fichas pelo coletor. Ainda não afirmar administração completa de todas as entidades: exclusão individual de equipamento/ambiente/vistoria e transferência patrimonial continuam sem interface administrativa nesta fatia. Novos tipos de pergunta/configuração também não surgem apenas por conceder perfil root.

Migração 0011 é aditiva; exclusão ocorre somente ao comando confirmado do root. Arquivos R2 entram em fila durável, com tentativa de remoção e repetição autenticada (até 50 por chamada). Sem binding ou em falha, a interface informa pendência; não confundir exclusão do catálogo com limpeza de arquivos concluída. Fotos reais continuam bloqueadas pela falta de habilitação R2.

D-046 publicada: desktop8d17a921-88b2-483d-992e-5c6407728a43; coletor da1f5e01-9ad0-4e16-b0e1-7319e37759fa. Relatório ROOT_PODERES_01.md, roteiro TESTE_ROOT_E_CONTINUIDADE.txt. Produção consultada sem escrita:1 unidade/7 usuários/1 vistoria/0 equipamentos/0 exclusões.

## D-047 — PROPOSTA técnica (aguardando aprovação do responsável): armazenamento de fotografias com provedor configurável e pasta privada no Google Drive, 28/10/2026

Contexto: o R2 continua bloqueado (erro 10042) e nenhuma fotografia real foi recebida até hoje. O responsável pediu, em 28/10/2026, configurar o Google Drive institucional (admin@pacodolumiar.edu.ma.gov.br) como armazenamento privado, com autorização própria do servidor (OAuth, escopo `drive.file`, acesso offline), sem conta de serviço, sem links públicos e sem alterar arquivos institucionais existentes. Escolha registrada com o responsável: pasta privada criada pela aplicação no Meu Drive (Drive compartilhado exigiria o escopo amplo `drive`).

Proposta: introduzir a camada `server/photo-storage.mjs` com provedores `r2` (implementação original preservada) e `google-drive`, selecionados por `PHOTO_STORAGE_PROVIDER`. D1 continua a fonte dos metadados (`collection_photos` ganha `storage_provider` e `storage_ref`); Workers continuam controlando acesso e escrita; o painel lê fotos somente pelo proxy autenticado. Tokens ficam cifrados (AES-GCM) no D1 com chave em segredo do Worker; autorização apenas pelo root em Configurações, na tela oficial do Google. Migração 0013 aditiva. Nenhuma regra da Base de Coleta v1.0 (0–5 fotos, obrigatoriedade só em falhas visíveis, câmera e galeria, sem vídeos) é alterada; a remoção individual permanece restrita a foto própria em rascunho; a lacuna de remoção irrestrita pelo root segue em PENDENCIAS.

Estado: implementado localmente e testado com simulação (`docs/05-qualidade/RELATORIO_TESTES_GOOGLE_DRIVE.md`); não publicado; projeto Google, segredos, migração e autorização não executados; celulares não testados. Esta entrada vira decisão somente após aprovação explícita, publicação autorizada e testes reais registrados. Detalhes: `docs/04-dados-apis/INTEGRACAO_GOOGLE_DRIVE.md`.


## D-048 — publicação autorizada da integração Drive, 03/11/2026

Após configurar Google Cloud/OAuth e fornecer o arquivo local de credenciais, o responsável solicitou explicitamente publicar e testar: “faça”. Aprova uso de pasta privada no Meu Drive com drive.file, preservando D1/Workers e alternativa R2; efetiva a proposta D-047 nesse escopo. Não altera obrigatoriedade de fotos da Base nem autoriza dados fictícios no banco oficial.

Backup local pré-migração: backups/pre-drive-2026-11-03.sql (ignorado pelo Git). Migrações aditivas 0012/0013 aplicadas, sem remover cadastros. Provedor google-drive configurado nos dois Workers; segredos previamente criados preservados, incluindo AUTH_PEPPER. Publicações: painel 31d75f82-ad3b-4f74-b077-8676ed1c3174; coletor 932233b0-61be-4da9-9b80-48fc231847a4.

A seleção normal de unidade continua abrindo os cartões A–H via /api/collector/start; não redireciona novas visitas automaticamente para /visita. Arquivos/rotas do roteiro alternativo local estão presentes no pacote compartilhado, mas não foram homologados nem passam a substituir o questionário vigente. O pacote também inclui as consultas locais de resultados; seu aceite visual completo permanece pendente.

Verificações: 48/48 testes Node aprovados e dry-run do Worker aprovado. Smoke HTTP oficial aprovado nos dois endereços: login200, páginas privadas redirecionam, APIs sem sessão401. Autorização institucional do Drive, teste real de upload/leitura e homologação em celulares ainda PENDENTES. Sessão root necessária no navegador; nenhuma senha redefinida e nenhuma fotografia ou unidade de teste inserida em produção.

## D-049 — identificação do equipamento opcional, 03/11/2026

Responsável solicitou retirar obrigatoriedade da etapa Identificação do equipamento. Patrimônio, número de série, marca e modelo passam a opcionais no formulário e na validação compartilhada do servidor. Valores ausentes são persistidos vazios, sem inventar identificação; dados já preenchidos são preservados. Lotes podem ter identificação vazia, mantendo recusa de patrimônio/série individual informados para todo o lote. Permanecem validações de tipo/tamanho e duplicidade para identificadores preenchidos. Categoria, ambiente e condições não integram esta alteração da etapa de identificação. Supera a obrigatoriedade original somente nesses quatro campos. Base original preservada.

Arquivos: web/collector-schema.js, server/collector.mjs e tests/collector-schema.test.mjs. Suíte49/49 aprovada, builds desktop/coletor concluídos. Publicação e resultados finais registrados na entrega em chat.

## D-050 — fachada e evidências no contexto da coleta, 03/11/2026

Responsável definiu a sequência seleção da unidade → fotografar fachada → identificar acompanhante → coletar internet/rede/ambientes/energia/equipamentos, com fotos como evidência das respostas e registros, e autorizou implementar. Atualiza a sequência visual anterior, preservando cartões A–H, respostas existentes, identidade dos equipamentos, permissões e estados. Não substitui questionários antigos pelo roteiro experimental visita-2.

Implementação: nova tela fachada retomável por URL; acompanhante usa campos A já existentes; concluir A abre C. C/D/E/H permitem evidência junto da pergunta ou ficha repetida, B junto do ambiente, F/G junto da ficha enquanto se preenchem identificação/condições/detalhes. Fotos possuem ID do registro; registros repetidos recebem ID estável na primeira alteração explícita, sem mutação por simples navegação. Mapa _photoEvidence nas respostas preserva os vínculos e versões; fotos continuam na collection_photos, protegidas por Workers/D1 e provedor D-048. Nenhuma migração ou exclusão de respostas.

A obrigatoriedade adicional por ponto permanece pendente: não transformar a expressão “a maioria” em exigência universal. Mantidas 0–5 opcionais por equipamento e foto/justificativa para falhas visíveis. Nesta fase, teto técnico provisório de cinco por resposta/ambiente/fachada por visita, sem impedir fotos de visitas futuras; equipamentos mantêm limite próprio. Senhas e faixa de IP não foram acrescentadas ao catálogo nesta alteração: a implementação de credenciais de rede protegidas e sua política de consulta ficam explicitamente pendentes; não gravar senhas em observações/fotos.

Sem armazenamento habilitado, câmera/galeria permitem preparar prévias identificadas como somente nesta aba; envio fica desabilitado, sem simular confirmação. Offline protegido não implementado. Testes e capturas: docs/05-qualidade/COLETA_EVIDENCIAS_01.md.

## D-051 — retorno explícito às categorias durante a coleta, 03/11/2026
Responsável reportou dificuldade para sair de um quesito e responder outro. Implementado botão textual Voltar às categorias no cabeçalho fixo da fachada, questionários, inventário, ficha de equipamento e revisão. Não confundir retorno às categorias da mesma unidade com trocar de unidade ou concluir cartão. Respostas de questionário são salvas antes da saída; falha impede retorno silencioso. Ficha incompleta permanece na memória da aba, com Retomar ficha em preenchimento nos cartões; prévias continuam nos respectivos vínculos. Bloqueio de edição é liberado e readquirido ao retomar; mudança de versão gera conflito sem sobrescrever a ficha de outra sessão. Não afirmar persistência de ficha incompleta ou prévia ao fechar/recarregar a aba.
Arquivos: web/collector.js, web/collector.css, tests/collector-evidence-browser.cjs. Requisito Base §3.2 (acesso livre) preservado, conclusão continua manual. Sem mudança de banco, perguntas, obrigatoriedades ou dados oficiais.

## D-052 — questionário reformulado V2, 04/11/2026

O responsável forneceu SEMED_Questionario_Reformulado_V2.txt e .docx em 03/11 e autorizou em 04/11: “inicie as Alteração do formulário e servidor”. Esclareceu expressamente manter root, admin, operador e visualizador. O item 14 da proposta não reduz os perfis nem revoga D-035/D-046 implicitamente.

A V2 substitui A–H somente nas visitas de versão coleta-2.0: acompanhante; internet; redes Wi-Fi; desktops/notebooks; impressoras; problemas/necessidades. Ambientes são transversais, tipo/foto opcionais, sem contagem obrigatória. Sem quantidade mínima de bens. Impressoras somente inventário; computadores manuais exigem motivo, situação do patrimônio, localização e condições, sem ação/prioridade obrigatórias. Coincidências de identificadores geram evento/sinalização, sem bloquear nem excluir bens dos totais como duplicidade confirmada. Fotos iniciais de fachada/impressora obrigatórias, demais opcionais; atualizações relevantes exigem nova foto, conservando anteriores. Em nova visita V2, assuntos previamente recebidos são reaproveitados, reabrindo somente os alterados; acompanhante e alteração de fachada são dados da nova visita.

A versão fica fixa na vistoria. Rascunho antigo só é pausado por confirmação explícita para iniciar V2; respostas, equipamentos, IDs, autoria e fotos permanecem. Início normal oferece V2 e opção do questionário anterior. Reabertura e conclusão são manuais; servidor mantém validação, conflitos, bloqueio de edição e publicação oficial separada. Teto técnico de cinco fotos por registro por visita na V2 preserva histórico de atualizações. Nenhuma alteração da Base original.

Entrega local inicial: web/collector-v2-schema.js, collector-v2.html/js; server/collector-v2.mjs e adaptações de collector.mjs/worker.mjs; adaptação da API de resultados. Sem migração, deploy, segredos ou escrita em produção. Integrações de agente/QR, segredos Wi-Fi/impressora, teste integrado e offline protegido NÃO estão operacionais nesta fase. Campos expressamente pendentes da especificação continuam sem obrigação inventada. Unificação e reversão administrativa continuam fora desta primeira fatia.

Rastreio e limites em docs/05-qualidade/QUESTIONARIO_V2_FASE_01.md; testes isolados e capturas em evidencias/coleta-v2-2026-11-04/. Próxima fase deve adaptar integralmente a apresentação desktop à nova versão antes da publicação conjunta.

## Proposta D-053 — coletor V2 consolidado e vínculo de computadores por QR Code com o agente Windows 0.1.6, 04/11/2026 (PROPOSTA; aguarda aprovação do responsável; nada publicado)

Origem: `PEDIDO_IMPLEMENTACAO_CLAUDE_V2_QR_2026-11-04.txt` (responsável, 04/11 10h11), com Anexo A = `SEMED_Questionario_Reformulado_V2.txt` (SHA-256 conferido) e o pacote `revisoes/agente-0.1.6-fonte/`. Mantidos root, admin, operador e visualizador; internet sem ambientes; D-046; D-048 e a galeria de fotos parciais intocadas. Nenhum deploy, segredo, migração remota ou dado oficial foi tocado; nenhum dado fictício entrou no D1 oficial.

Escolhas técnicas desta proposta (todas reversíveis, descritas em `docs/06-entregas/claude-v2-qr-2026-11-04/PENDENCIAS_E_DECISOES.txt`):
1. O núcleo do pacote 0.1.6 foi copiado para `server/agentes/nucleo/` (hashes de origem no cabeçalho) e adaptado por patches marcados `[SEMED]`; o catálogo real (`units/environments/inspections/equipments`) entra por `server/agentes/catalogo.mjs`. Não existe catálogo paralelo, seed ou migração de EXEMPLO.
2. A ficha do coletor continua a fonte de verdade de ID permanente, unidade, ambiente e posição. O vínculo por QR usa sempre ficha existente (`mode:'existing'`); ficha nova pelo vínculo fica desligada. O claim grava, na mesma transação D1, vínculo + ficha (versão+1, `registration='Agente'`, ambiente/posição/`location_state`) + histórico (`collection_history`) + recibo idempotente.
3. Modo de cadastro do computador (4.2): "Agente Windows + QR Code" ou "Cadastro manual simplificado" (motivo obrigatório só no manual). Concluir o assunto Computadores exige vínculo confirmado pelo servidor para toda ficha em modo Agente; o celular nunca declara vínculo sozinho.
4. Correções R1–R5 do pacote aplicadas e cobertas por testes: QR de agente revogado recusado antes e durante a transação; recibo atômico; presença monotônica (`boot_id`, `sequence`, `collected_at`); limite por IP 600/h (NAT de escola) mantendo o limite por autorização; catálogo/prévia paginados sem N+1.
5. Rotas de máquina (assinatura ECDSA, sem cookie/Origin/CSRF) ficam em lista explícita antes do filtro de Origin do Worker; o filtro global de Origin das rotas humanas não foi alterado. Autorizações de instalação e revogação são exclusivas do root (D-031/D-035); operador/admin fazem prévia/claim; visualizador só consulta.
6. Leitor de QR local no coletor: `BarcodeDetector` ou jsQR 1.4.0 vendorizado (Apache-2.0), com imagem da galeria como alternativa; conferência humana do código visual obrigatória; a imagem nunca sai do aparelho.
7. Demais ajustes do Anexo A entregues: 2.L11 opcional no resultado externo; 7.C1 (situação da categoria) nas seções F/G; rótulos 4.7; aviso de ambiente com nome parecido (confirmação explícita); telefone do acompanhante oculto ao visualizador; `physicalChanged` não reaparece em visita nova; resumo da visita na revisão (7.1); painel por versão de questionário com estado do agente, "Não localizado" e janela "Dados do agente" separada da ficha oficial.

Fora desta proposta (continuam pendentes, sem regra inventada): credenciais Wi-Fi/impressora, teste de velocidade integrado, offline protegido, unificação com segundo aprovador, intervalos/retenção/custos do agente, distribuição assinada do instalador, homologação em celulares físicos e com o EXE real. H copiada como "Concluído" na revisita (D-052) permanece como está, assinalada para confirmação.

Testes: `npm test` 67/67; browser isolado `tests/collector-v2-qr-browser.cjs` e `tests/desktop-v2-agent-browser.cjs` aprovados; builds e `wrangler deploy --dry-run` dos dois Workers aprovados. Relatórios em `docs/06-entregas/claude-v2-qr-2026-11-04/` e contrato em `docs/04-dados-apis/CONTRATO_QR_E_AGENTE.md`. Publicação depende de aprovação explícita desta proposta e da migração `0014_agentes.sql` (aditiva) conforme `MIGRACOES_E_PUBLICACAO.txt`.

**Adendo à proposta D-053 — correções da revisão independente, 04/11/2026 (tarde; continua PROPOSTA, nada publicado).** Os sete defeitos reproduzidos pelo revisor (REV-01 a REV-07) foram corrigidos localmente com testes do comportamento correto: exclusão de unidade revoga agentes e encerra vínculos na mesma transação e a telemetria de vínculo órfão é recusada; claim e mudança de localização seguem a política do coletor (unidade ativa, visita aberta, trava de edição própria) verificada dentro do batch, com recibo e revisão da visita na mesma transação, e a mudança de localização nunca altera o modo de cadastro; mudar de ambiente pelo formulário invalida a posição confirmada; o QR é lido antes de qualquer gravação e o vínculo cria um rascunho mínimo que só deixa de bloquear a conclusão após a conferência completa; alteração física de impressora conta por visita; o leitor encerra a câmera em qualquer cancelamento. Acrescentados: tela do root em Configurações (autorizações, agentes/vínculos, revogação, manutenção), `scheduled` com cron proposto no Worker do painel, configuração do painel de validação e lockfile pnpm atualizado. Escolhas reversíveis C17–C24 e dúvidas D11–D13 em `docs/06-entregas/claude-v2-qr-2026-11-04/PENDENCIAS_E_DECISOES.txt`. Pendentes: homologação com EXE e celulares reais em validação (Fase 4 da devolutiva), alertas de hardware, credenciais, offline, unificação.

**Adendo 2 à proposta D-053 — revisão independente 2, 04/11/2026 (noite; continua PROPOSTA, nada publicado).** Corrigidos localmente com testes: recuperação do vínculo após resposta perdida (comando congelado + recibo por request_id; nenhum sucesso sem confirmação do servidor); vínculo e mudança de localização passam a respeitar o estado do assunto Computadores (reabertura manual obrigatória, verificada dentro da transação); a mutação humana de localização entra no ciclo da visita e só vira oficial na conclusão — consultas oficiais leem a publicação e mostram a alteração aberta como PARCIAL; prévia de exclusão exibe os agentes a revogar; listagem do root mantém o último vínculo histórico. Pendências inalteradas (hardware, homologação física, validação publicada, histórico técnico completo por ficha, armazenamento de fotos de homologação). Permissões do admin não ampliadas. Escolhas reversíveis C25–C28 em PENDENCIAS_E_DECISOES.txt.

**Adendo 3 à proposta D-053 — revisão independente rev3, 04/11/2026 (noite).** O revisor declarou APROVAÇÃO TÉCNICA LOCAL de R2-A/R2-B/R2-C (78 testes + 2, seis cenários próprios, builds) e não pede nova rodada desses itens. Isso NÃO é publicação, NÃO é homologação do EXE/celulares e NÃO conclui o escopo; D-053 continua PROPOSTA. Próxima etapa definida: homologação integrada em ambiente de validação isolado (dois Workers, um D1 de validação, contas e unidade de teste só ali, fotos separadas sem impor R2), com o roteiro revisão 3 em Windows designado e celulares reais — plano em `docs/06-entregas/claude-v2-qr-2026-11-04/PLANO_HOMOLOGACAO_V2_QR.txt`, que exige aprovação explícita (D-H1) e decisões D-H2–D-H4 do responsável antes de qualquer comando na conta Cloudflare. Nada foi executado.

## D-054 — implantação direta da V2/QR no ambiente real com Drive existente, 04/11/2026

O responsável respondeu às decisões D-H1–D-H4: "quero que publique no ambiente real ... faça todas as modificacoes no ambiente real . implante o que for necessario"; fotos: "use o drive real"; computadores Windows com agente instalado e celular pelo navegador para leitura do QR. Autoriza backup, migração aditiva 0014, publicação dos dois Workers reais e verificações necessárias, preservando usuários/cadastros/fotos. A entrega implementada de D-053 e correções REV-01–07/R2-A–C passam de proposta aguardando autorização para implantação autorizada.

Esta decisão posterior substitui a exigência de publicar primeiro ambientes separados e usar armazenamento de teste. Reutilizar D1 semed-inventario-auth, a autorização/pasta institucional do Drive e os segredos existentes; não resetar contas, aplicar seed destrutivo ou refazer OAuth. Os 100 TB foram informados pelo responsável, não verificados tecnicamente nesta decisão. Não contratar serviço adicional. A autorização cobre os passos necessários da publicação, sem confirmação repetida por comando.

Homologação física com EXE e celulares continua pendente de execução: não declarar concluída pela autorização. Windows foi indicado como plataforma; nenhum computador específico foi autorizado para instalação automática nesta estação. Alertas de hardware, histórico técnico completo entre instalações, segredos Wi-Fi/impressora, velocidade integrada, offline e unificação continuam com as lacunas documentadas, sem promessa implícita de entrega nesta publicação.

**Execução de D-054:** publicada em 04/11/2026; migração 0014 aplicada, Workers reais atualizados e Drive preservado/testado. Evidências e limites em `docs/05-qualidade/PUBLICACAO_V2_QR_2026-11-04.md`. Os registros anteriores de aprovação somente local são históricos.

## D-055 — QR temporário de computador simulado solicitado para teste real, 04/11/2026

Responsável, já cadastrando um equipamento pelo celular, pediu: “gere um qr code teste com infromacoes ... quero testar se funciona”. Autorizado um registro fictício claramente identificado `TESTE-QR-SEMED-01`, exclusivamente para testar leitura/prévia/vínculo na unidade de teste existente. Emitida autorização root de uma instalação por uma hora; cadastro pela API pública de máquina com assinatura ECDSA, sem inserir diretamente registros no banco ou enfraquecer validações. QR expira em dez minutos. O operador escolhe ambiente/posição e confirma o vínculo pelo coletor; o simulador não cria unidades, visitas ou fichas. Chave privada gerada permanece em private-data, fora do repositório; nenhuma senha humana entra no agente.

Resumo simulado: Intel Core i5-10400, 12 processadores lógicos, 16 GiB, Windows 11 Pro; fabricante/modelo/hostname explicitamente fictícios. Nenhum programa instalado, telemetria contínua ou estado de máquina ligada foi simulado. Esta exceção de teste expressamente solicitada não autoriza semear unidades oficiais nem representa homologação do EXE. Evidência: `docs/05-qualidade/QR_TESTE_SOLICITADO_2026-11-04.md`.

## D-056 — instalador único escolhido pelo responsável, 04/11/2026

Responsável forneceu `C:/Users/SIGAE/Desktop/SemedAgente-InstaladorUnico.exe` e determinou: “esse sera o instalador que sera executado no computadores, grave essa infromacao para que o sistema sempre trabalhe com esse arquivo”. Selecionado como referência obrigatória para próximas integrações, testes e entregas do agente Windows. Supera `SemedInventoryAgentSetup-0.1.6.0-completo.exe` e os ZIPs anteriores como padrão de distribuição, preservando-os como histórico.

Identidade: 26.133.504 bytes; versão de arquivo/produto 0.1.6.0; SHA-256 `35277F87E0FD06CBA098A3608DE13EF516E76F188ECE597144D0CE3FB342F375`. Cópia preservada com hash conferido em `private-data/instalador-oficial/2026-11-04-35277f87/SemedAgente-InstaladorUnico.exe`. Manifesto e orientação em `docs/04-dados-apis/INSTALADOR_OFICIAL.json` e `.md`; decisão apontada no guia inicial e AGENTS.md para transferência de contexto.

Seleção aprovada não equivale a compatibilidade comprovada. Este arquivo exato não foi executado nesta etapa; não é idêntico ao EXE anterior e não possui assinatura Authenticode. Não presume autorização embutida, formato de arquivos auxiliares ou novo protocolo. Nenhum deploy, alteração de banco, credencial ou permissão, execução automática ou substituição de agentes instalados foi efetuado. Compatibilidade e homologação física permanecem pendentes de teste desta cópia.

## D-057 — questionário V3 simplificado e publicação real autorizada, 05/11/2026

Fonte: `Coletor-SEMED-mudancas-questionario-V3.docx`, fornecido pelo responsável, preservado em `revisoes/questionario-v3-2026-11-05/`. SHA-256: `df560f6ca2465bb77be854e807f834cd6742ff37f6f1f86b1b14c1fc9e86b16a`. Texto e tabelas lidos integralmente; diagrama incorporado aberto visualmente. A renderização paginada do DOCX não pôde ser executada por ausência de LibreOffice. Base original intocada.

Oito pontos foram decididos individualmente pelo responsável, superando as recomendações pendentes do documento: (1) mostrar prévia do computador e vincular sem conferir código visual; (2) registrar mudança de localização sem exigir motivo, mantendo histórico; (3) não coletar número de patrimônio; (4) nome do ambiente digitado livremente em cada equipamento; (5) acompanhante com nome/função opcionais, diretamente visíveis; (6) cadastro manual do computador permitido, motivo obrigatório; (7) revisitas oferecem somente Editar, preservando ocorrências antigas; (8) impressoras abrem diretamente na lista, com Adicionar impressora. Fotografias enviadas automaticamente após câmera/galeria, sem botão de envio inicial. Remoção e recuperação de falha permanecem.

Sequência recomendada: unidade oficial → fachada → acompanhante → internet → Wi-Fi → ambientes → computadores → impressoras → outros equipamentos → problemas → revisão. Categorias livres, conclusão/reabertura manuais e publicação oficial após confirmação do servidor. A V3 reduz perguntas conforme o DOCX; não aplicar contagens preliminares do documento como total definitivo. Fotos nos cinco contextos aprovados: fachada, ambiente, impressora, outros equipamentos, ocorrência. Não há foto de computador no novo roteiro. Fachada/impressora iniciais continuam exigidas; fotos históricas válidas dispensam repetição na revisita. Não recolher senhas em campos comuns.

Versão `coleta-3.0`, fixa na visita. Novas visitas usam V3 por padrão. Rascunho de outra versão só é pausado após confirmação explícita na interface; não apagar respostas antigas. Equipamentos e fotos mantêm IDs; campos históricos removidos da interface são preservados na edição. Digitação livre de ambiente reutiliza nome normalizado exato na mesma unidade ou cria ID estável, sem obrigar cadastro prévio em B. Não fundir nomes aproximados. Outros equipamentos novos não exigem ambiente: tabela aditiva `miscellaneous_equipments`, locks próprios e visão unificada `inventory_equipment_all`. Registros antigos continuam nas tabelas originais. Migração 0015 aditiva, sem seed, exclusões ou reinicialização de contas.

Navegação V3 não aguarda a rede para voltar às categorias. Fila de alterações por visita/assunto, versões e reconciliação de resposta perdida; salvar/concluir aguardam confirmação. A fila vive na memória da aba, com aviso ao fechar: NÃO é offline durável nem salvamento local protegido. Fotos só aparecem recebidas após confirmação do servidor. Falha conserva a prévia para tentar novamente na mesma aba.

Autorização explícita: “publique diretamente no ambiente real eme passe o link para observar”. Abrange backup, migração aditiva 0015 e publicação dos dois Workers reais com D1/Drive/segredos existentes, preservando contas e dados. Mantidos os quatro perfis, D-045 (parciais), D-046 e contrato de assinatura/recibos de QR. Não autoriza instalar o EXE nesta estação, enfraquecer autenticação ou declarar homologação física concluída. Execução e evidências em `docs/05-qualidade/PUBLICACAO_V3_2026-11-05.md`.

## D-058 — cadastro automático de agentes, sem autorização de lote, 05/11/2026

Decisão explícita do responsável: “A — Cadastro automático sem autorização de lote”, em resposta à escolha A/B. Fonte recebida preservada em revisoes/instalador-0.1.8-2026-11-05/DUVIDAS_RECEBIDAS_2026-11-05.txt. Supera a exigência de autorização root/lote para novas instalações do contrato D-053, mantendo a assinatura individual e a autenticação humana do vínculo. Publicação no ambiente real já autorizada na sessão; não requer nova confirmação. Não autoriza instalar o executável nesta estação.

Instalar → cadastro técnico automático pendente → QR temporário → operador autenticado escolhe unidade oficial/ambiente/posição e vincula → inventário/heartbeat aceitos. O cadastro inicial já contém resumo técnico; não é correto afirmar “sem dados”. Ainda não cria ficha escolar, vínculo nem indicadores oficiais. QR de uso único, expiração, assinatura ECDSA P-256/P1363, nonce, prevenção de clonagem, sessões/CSRF, versões, travas, recibos e revogação continuam obrigatórios.

Implementação: AGENTES_EXIGIR_AUTORIZACAO=nao nos dois Workers. O servidor marca o desafio e cadastro com grant_id=cadastro-aberto (não é segredo nem uma autorização fictícia). A transação não consulta/consome lote nesse modo. Novas autorizações são desnecessárias e recusadas; histórico e revogação de autorizações antigas permanecem. Tela de lotes substituída pela orientação de cadastro automático. Padrão do código sem variável permanece restritivo, útil para configurações antigas. Desafios de cadastro aberto não são aceitos se o modo for desativado.

Prazo do caminho A adotado: 30 dias desde criação do cadastro automático que NUNCA foi vinculado. Expiração revoga a identidade/chave, invalida QR e registra auditoria, sem excluir dados ou afetar fichas. Agentes vinculados, mesmo com vínculo posteriormente encerrado, e cadastros antigos por lote não são expirados por essa regra. Manutenção diária trata até 250 pendentes por rodada; acesso/renovação/pareamento também verifica expiração. Identidade expirada não é reativada silenciosamente; se necessário, o responsável deve preparar uma instalação com nova identidade e novo vínculo. QR continua com validade curta de dez minutos, independente desses 30 dias. Limite de 600 desafios e 600 inscrições por IP/hora, com Retry-After, preserva instalações compartilhando NAT.

Reenvio da instalação/chave existente recupera os mesmos IDs (inclusive após desafio anterior vencer), sem consumir lote; identidades revogadas não voltam a ser aceitas. Arquivo 0.1.8 analisado estaticamente já possui tentativa anônima e é o candidato deste teste. D-056 permanece histórico da referência 0.1.6; não afirmar homologação ou substituição silenciosa do binário. QR permanente, alertas de hardware, mudanças 0.1.9 e assinatura comercial do EXE não são implantados nesta decisão.

Evidências: tests/agentes-open-enrollment.test.mjs, tests/desktop-open-enrollment-browser.cjs e docs/05-qualidade/CADASTRO_AUTOMATICO_2026-11-05.md. Base original e questionário V3 preservados.

## D-059 — AnyDesk e RustDesk opcionais em cada computador, 05/11/2026

Pedido explícito do responsável: incluir duas perguntas, “anydesk” e “rustdesk”, com resposta apenas de números e preenchimento opcional para todos os computadores. Campos exibidos como AnyDesk (opcional) e RustDesk (opcional), para computador sem tipo definido, desktop e notebook, tanto manual quanto com agente/QR. Também disponíveis nos formulários anteriores para retomada de visitas existentes; não aparecem em impressoras/outros equipamentos.

Identificadores armazenados como texto de dígitos, preservando zeros à esquerda e sem conversão para quantidade. Campo vazio é aceito; preenchido aceita somente 0–9, com limite geral já existente de 4.000 caracteres, sem impor comprimento específico de ID. Teclado numérico no celular. Validação no Worker inclusive no rascunho do QR; informações persistidas no mesmo JSON/histórico da ficha. Edição que omite campos (cliente anterior) preserva valores; envio explícito vazio limpa. Consulta parcial e publicada do painel usa os mesmos rótulos e dados.

Não solicita senhas e não abre sessões de acesso remoto. Não modifica protocolo do agente, cadastro automático D-058, QR, fotos, demais perguntas ou permissões. Sem migração SQL e sem preencher exemplos no D1 oficial. Base original preservada; esta adição posterior fica rastreada aqui. Publicação nos dois Workers reais conforme autorização contínua da sessão. Aceite: salvar vazio/com dígitos, reabrir com zeros intactos, editar/limpar, rejeitar letras/sinais, exibir na ficha desktop, sem campos em impressoras. Evidências em docs/05-qualidade/ANYDESK_RUSTDESK_2026-11-05.md.

## D-060 — apresentação sem versão e somente questionário atual na entrada, 05/11/2026

Responsável pediu retirar a identificação “versão 3” do cadastro e utilizar somente o questionário atual, com publicação real explícita. Removidos título/badge/ajuda V3, seletor “Usar questionário anterior” e versões visíveis na consulta do questionário no desktop. A seleção da unidade sempre inicia/retoma o fluxo atual. Havendo rascunho anterior, confirmação preserva o rascunho e abre a coleta atual; cancelar fica na lista. Identificadores técnicos de versão e compatibilidade de históricos continuam internos; sem migração/apagamento de respostas ou alteração nas demais perguntas.

O responsável esclareceu expressamente: “Adicionar foto opcional”. A ficha atual de computador oferece Câmera e Galeria após ambiente/posição, no cadastro manual e por QR. Usa o envio automático aprovado, até cinco fotografias por equipamento por visita, associadas ao ID permanente. Foto não é condição para salvar computador, concluir o assunto ou publicar a visita. Esta decisão posterior supera somente a ausência de foto de computador da D-057; demais regras de fotografias permanecem.

Para enviar antes de finalizar a ficha, o rascunho mínimo aceita Manual ou Agente e preserva o modo escolhido. A validação completa continua exigindo motivo do cadastro manual e demais respostas aplicáveis. Enviar foto não conclui ficha/assunto/visita e não cria vínculo com agente. Reutilizados upload autenticado, confirmação do provedor, Drive, consulta parcial/publicada e histórico. Sem migração de banco ou mudança de credenciais.

Aceite de apresentação: ausência de rótulos V3 e seletor de versões na lista/categorias; fluxo atual funcional; salvar/reabrir AnyDesk/RustDesk, QR e fotos existentes preservados; consulta desktop sem rótulo de versão. Teste Edge com Worker/SQLite isolado aprovado; evidências em docs/05-qualidade/evidencias/coletor-apresentacao-2026-11-05/.

Aceite de fotos: câmera/galeria visíveis, envio automático e reabertura em modo manual e QR; consulta parcial vinculada ao equipamento; conclusão/publicação sem foto do computador; rascunho incompleto continua bloqueando conclusão. Evidências e publicação em docs/05-qualidade/FOTO_COMPUTADOR_E_APRESENTACAO_2026-11-05.md.

## D-061 — identidade visual do coletor, 05/11/2026

O responsável enviou `entrega-claude-identidade-2026-11-05.zip` e determinou: “quero que adote esssa aparecencia para publicacao no ambiente real”. A aparência “Contraste técnico” do pacote fica APROVADA para o coletor: branco/preto, vermelho/laranja/pêssego, fontes locais Chakra Petch/Barlow/JetBrains Mono, login com paisagem, ícones coloridos por assunto e símbolos nos títulos. Supera a identidade anterior D-040 e o mockup mobile original somente quanto à apresentação. Publicação direta do coletor autorizada, sem precisar de nova aprovação para o staging recomendado pelo anexo.

As fases 1 e 2 visuais são integradas mantendo D-057/D-059/D-060: formulários atuais por assunto, perguntas, QR, AnyDesk/RustDesk opcionais, foto opcional de computador, envio automático, confirmação pelo servidor, permissões e histórico. A frase “uma pergunta por tela” do design system é descrição externa desatualizada, não alteração aprovada do fluxo. Não restaurar seletor/número de versão para o operador. O painel desktop mantém sua aparência.

Ajustes técnicos de integração: cores CSS por assunto sem sobreposição, login sem colisão de marca/campos, estados legíveis em telas estreitas, fonte mono nos identificadores, área de toque do retorno e câmera, e leitor QR em paisagem. Fontes e imagem servidas pelo Worker; nenhuma credencial nova ou mudança de Drive/D1/contrato de agentes. Backup das fontes substituídas, 43 hashes do pacote conferidos, 98 testes existentes e dois roteiros de navegador aprovados. Relatório com evidências e limites: `docs/05-qualidade/IDENTIDADE_COLETOR_2026-11-05.md`.

## D-062 — interface compacta e correções de digitação/busca, 05/11/2026

Após diagnóstico e proposta de experiência de uso, o responsável determinou explicitamente: “publique as correcoes”. Aprovadas implementação e publicação direta no coletor real: cabeçalho único, botões/listas compactos, busca por Enter e limpeza, preservação do foco/cursor nas atualizações, erros visíveis, retorno à posição da lista e adaptação à digitação. Mantida identidade D-061; sem retirar ou adicionar perguntas, alterar permissões, protocolo QR, Drive ou dados oficiais.

Busca passa a ser estado separado das respostas, sem gravar `_query` no assunto. Atualizações na mesma tela reutilizam controles; upload/remoção atualizam fotografias sem sobrescrever texto novo. Durante digitação, rodapé é recolhido e cabeçalho oferece Fechar teclado; Próximo percorre os campos, enquanto observações aceitam quebra de linha. Concluir assunto permanece manual. Reabrir inventário descarta a versão local obsoleta para não conflitar com a própria conclusão anterior.

Aceite: busca/conclusão/reabertura, salvamento/QR/fotos, preservação do nó e cursor durante upload, validação focalizada, lista longa e larguras 360–812px. 98 testes gerais e três roteiros de navegador aprovados com Worker/SQLite isolados. Primeiro equipamento em 208px, antes aproximadamente 542px, no viewport 390×660. Homologação do teclado físico Android/Safari e novo upload autenticado ao Drive real continuam pendentes nesta rodada. Evidências, arquivos, publicação e limites em `docs/05-qualidade/UX_COLETOR_PUBLICACAO_2026-11-05.md`. Sem migração SQL ou alteração de segredos.

Execução: coletor publicado em 05/11/2026 às 21:23 (Fortaleza), versão `5cf137cd-9c34-4e41-806b-d19cf0887bb6`, 100% do tráfego; 16 sondas públicas pós-publicação aprovadas. Nenhum deploy do painel nem conteúdo fictício gravado em produção nesta etapa.

## D-063 — organização documental e publicação do repositório, 05/11/2026

Pedido explícito do responsável: criar documentação, alimentar o repositório de forma organizada e preparar informações para possível migração de servidor. Autoriza consolidar código, migrações, testes e documentos no repositório existente. Não determina nova hospedagem, mudança de banco, migração real, deploy ou alteração do coletor congelado nesta etapa.

Manual atual em docs/07-operacao, catálogo físico gerado das 15 migrações, checklist TXT, guias de recuperação, configuração sem segredos e CI sem deploy. Guias antigos da raiz preservados em docs/99-historico. Base original intocada. Playwright declarado no projeto e três testes de navegador atuais passam a usar importação portátil, sem alteração de comportamento da aplicação.

O repositório remoto estava público e sem commits no início da organização. Código e documentação podem ser publicados; dados operacionais, dumps, credenciais, arquivos OAuth, evidências privadas, pacotes recebidos e executáveis são excluídos. Manter transferência privada separada para esses componentes. Migração somente será considerada homologada após restauração completa e testes reais no destino. Registro: docs/07-operacao/10_REGISTRO_DA_ORGANIZACAO.md.

## D-064 — identidade do coletor nas fotografias do desktop, 05/11/2026

Pedido do responsável: aplicar as cores e características do coletor à página de visualização de imagens e conferir a disponibilidade das fotos recolhidas. A identidade D-061/D-062 passa a valer também para a galeria de fotografias e a ampliação no desktop: branco, preto, vermelho, laranja, pêssego, fontes locais e controles compactos. O restante do painel e o coletor permanecem com suas apresentações atuais.

Implementação técnica: entrada Fotografias no desktop, consulta paginada por unidade/tipo/estado, viewer compartilhado com navegação, contexto e erro recuperável. Fotos `ready` de visitas abertas são PARCIAIS; as de visitas pausadas ficam como histórico PARCIAL, identificadas separadamente; somente visitas concluídas aparecem como concluídas. A consulta de histórico pausado não reabre visitas nem as incorpora aos indicadores. Root/admin/visualizador consultam; operador continua sem acesso gerencial. Fotos privadas passam por autorização no Worker, sem links públicos do Drive ou segredos no navegador. Sem migração, mudança de perguntas, envio novo ou exclusão de dados reais.

Verificação desta entrega: testes e publicação registrados em `docs/05-qualidade/GALERIA_FOTOGRAFIAS_2026-11-05.md`. A leitura de arquivos existentes não substitui homologação de novas capturas em celulares.
