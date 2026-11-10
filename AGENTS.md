# AGENTS.md — regras obrigatórias de desenvolvimento e transferência de contexto

Leia PRIMEIRO `00_LEIA_ANTES_DE_TUDO.md` e `docs/00-governanca/REGRAS_DE_PRECEDENCIA.md`. Este projeto tem **duas interfaces** com a **mesma persistência**; não confunda papéis.

**Instalador de referência do agente (D-056):** usar `SemedAgente-InstaladorUnico.exe`, selecionado pelo responsável em 04/11/2026. Antes de qualquer trabalho com instaladores, ler `docs/04-dados-apis/INSTALADOR_OFICIAL.md` e conferir `INSTALADOR_OFICIAL.json` (hash e cópia preservada). Pacotes anteriores são históricos; não reutilizá-los como padrão nem confundir escolha do arquivo com homologação de funcionamento.

## Ordem mínima de leitura antes de programar
1. `00_LEIA_ANTES_DE_TUDO.md`, `docs/00-governanca/DECISOES.md`, `docs/00-governanca/PENDENCIAS.md`, `docs/00-governanca/CONFLITOS_DOCUMENTAIS.md`.
2. Se alterar **coleta mobile**: ler **INTEGRALMENTE** `docs/02-coleta-mobile/BASE_DE_COLETA_V1_0_ORIGINAL.txt`, depois `06_ESPECIFICACAO_TELA_A_TELA.md`, `02_TELAS_E_TRANSICOES.md`, `03_CATALOGO_E_MAPEAMENTO.md`, `04_FOTOS_E_ESTADOS.md`, `05_GUIA_VISUAL_MOBILE.md` e **abrir** `design/referencias/mobile/00_coleta_mobile_APROVADA.png`.
3. Se alterar **desktop**: abrir os CINCO PNGs desktop na ordem do manifesto e ler `docs/03-painel-desktop/`.
4. Se alterar **dados**: ler `docs/04-dados-apis/`, diagramas, regras do TXT referentes a históricos, permissões, vistorias, offline e fotos.
5. Antes de concluir uma funcionalidade, localizar testes/aceite em `docs/05-qualidade/`.

## Invariantes aprovadas — não reinterpretar
- Mobile = **coletar e atualizar**; não dashboards, relatórios ou exploração gerencial. Desktop = **consultar, analisar, comparar e relatar**.
- No mobile, escolher somente unidades oficiais pré-cadastradas e autorizadas; coletor não cadastra escola.
- D-046 supera a restrição de acesso após publicação em D-042: qualquer operador autenticado pode continuar qualquer unidade oficial ativa, sem propriedade permanente ou atribuição obrigatória. Preservar autores e versões. Root pode excluir unidade com prévia, confirmação e auditoria, sem executar exclusões reais durante testes.
- D-042 (histórico; ver D-046): operador vê e pode iniciar todas as unidades oficiais ativas com inventário de equipamentos pendente, sem atribuição individual prévia. Mostrar lista imediatamente; busca é filtro opcional. Rascunhos continuam acessíveis para retomada. Após publicação, preservar acesso por atribuição/participação conforme política compartilhada no servidor. Esta decisão posterior supera D-035 somente nesse escopo.
- D-043/D-044: C/D/E/H aceitam descrever locais sem cadastro prévio no cartão B. A descrição não cria ambiente automaticamente. F/G continuam exigindo vínculo ao ambiente cadastrado. Navegar sem alterar respostas não deve modificar estado/histórico; unidade/etapa são retomadas pela URL sem armazenar respostas ou credenciais nela.
- Inventário contínuo, ID permanente de equipamento, conferência de item existente, histórico de edições, prevenção de duplicação.
- Mobile Task-Oriented Wizard com categorias em cartões (acesso livre em ordem recomendada); dependências bloqueiam só a etapa dependente; estados dos cartões; conclusão MANUAL; confirmar reabertura. **Não mostrar porcentagem geral**, mesmo que o mockup a sugira.
- D1 guarda dados, R2 imagens, Workers/API controla acesso e escrita; nunca credenciais na interface. Permissões no servidor.
- D-072 (09/11/2026): exceção expressamente aprovada para miniaturas JPEG derivadas no D1 (até 320 × 320 px e 64 KB). Fotos completas permanecem no provedor privado atual (Drive por D-048); sem imagem original no D1. Miniatura só depois de foto `ready`, leitura autenticada e revalidada, fallback para original, manutenção de fotos antigas exclusiva do root no painel. Base original preservada; ver `docs/04-dados-apis/MINIATURAS_D072.md`.
- Fotos: 0–5 opcionais por equipamento; obrigatoriedade específica somente para certas falhas visíveis de infraestrutura, com justificativa segura; câmera e galeria; sem vídeos/documentos anexos/desenho em fotos.
- `Salvo local`, `Sincronizado`, `Cartão concluído` e `Vistoria concluída` são estados DIFERENTES. Uma vistoria só alimenta o painel oficialmente após confirmação do servidor e fotos obrigatórias (ou justificativa) tratadas.
- D-045: desktop possui “Coletas em andamento”, consulta de rascunhos já confirmados no servidor, rotulados PARCIAL e separados dos indicadores oficiais. Visível aos perfis de consulta desktop, nunca ao operador como painel gerencial. Não mostrar digitação não salva nem declarar rascunho oficialmente concluído. Atualização técnica atual: 15 segundos, com atualização manual.
- Offline e múltiplos coletores requerem conflitos explícitos, idempotência, histórico e proteção de arquivos. Não implementar comportamento idealizado sem testar Chrome Android/Safari iPhone.
- Acesso atual conforme D-031: root, admin, operador e visualizador, com matriz aprovada em DECISOES.md. A regra original de dois papéis ficou superada por decisão explícita posterior. Usuário/senha; criação de usuários e gestão de unidades/atribuições exclusivas do root por D-035; reset administrativo conforme permissões; sem login CPF ou matrícula. Operador corresponde à coleta em unidades autorizadas; não liberar painel gerencial para esse perfil.
- Desktop dark-tech; preservar mapa, matriz de equipamentos por escola, detalhe da unidade e fotos. A decisão posterior D-023 (27/10/2026) pede fidelidade ao PNG desktop 00, incluindo sua faixa de cinco indicadores, sem substituir as demais áreas.
- D-065 (06/11/2026) supera a paleta dark-tech acima: TODO o painel usa a identidade D-061/D-062 do coletor (branco/preto/vermelho/laranja/pêssego e fontes compartilhadas). Preservar composição e funções. Não criar aba Fotografias; sua futura distribuição no sistema depende de definição do responsável. Coletor preservado nesta correção desktop.
- D-066 (06/11/2026): o indicador de unidades do Panorama conta cada tipo separadamente; não somar escolas, núcleos e unidades administrativas num total geral. Usar o tipo real e os filtros, sem números fixos ou classificação inferida pelo nome.
- D-067 (06/11/2026): composição de Panorama/Planejamento segue o TXT e JSON de layout aprovados. Manter nomes na matriz, retirando somente seu título de coluna; manter questionário/resultados/galeria também nas telas de origem. Coletas em andamento ficam no Planejamento. D-066 prevalece sobre o indicador genérico do modelo; as 15 lacunas sem decisão continuam pendentes.
- Mockups contêm escolas/brasões/datas/mapas fictícios: jamais usá-los como dados oficiais.

## Tratamento de questões pendentes
Não resolver pontos pendentes como se estivessem aprovados (ver §14 do TXT e `docs/00-governanca/PENDENCIAS.md`). Uma escolha técnica reversível pode ser PROPOSTA e documentada; não altera requisito.

## Forma de execução
- No início de cada fase: listar documentos consultados, requisitos aplicáveis, dúvidas pontuais sem bloquear o resto, arquivos que pretende alterar e critérios de aceite.
- Implementar por fases pequenas e testáveis. Pode programar um protótipo com dados DEMO explicitamente identificados, sem gravar exemplos fictícios em D1 oficial.
- Não efetuar deploy, credenciais, operações destrutivas ou mudanças em ambiente oficial sem aprovação explícita.
- Capturar screenshots reais da implementação, comparar com as imagens aprovadas e documentar lacunas.
- Atualizar documentação e `docs/00-governanca/RASTREABILIDADE.md` quando houver mudança aprovada; preservar sempre a Base de Coleta original.



- D-068 (06/11/2026): sete tipos atuais em web/unit-schema.js; conveniadas fora do escopo, histórico preservado, somente inativação/exclusão pelo root. Obras visíveis no desktop e indisponíveis para coleta (também validação no servidor). Quinze campos opcionais do cadastro mestre, modelo 27 colunas/compatibilidade 12, matriz abreviada e Total. Decisões de nomes/etapas/obras já confirmadas. Migração 0016 aplicada em produção; nunca renomear 0015_questionario_v3.sql. Publicação real dos dois Workers autorizada e executada em 06/11/2026; carga de planilhas permanece pendente. D-065–D-067 preservadas. Ver docs/05-qualidade/PUBLICACAO_D068_2026-11-06.md.

- D-069 (08/11/2026): consulta desktop embutida por nome/célula da matriz, reutilizada em Equipamentos e unidade. Filtrar/paginar no servidor, usar published_json e fotos do mesmo ID/unidade, separar telemetria e localização parcial. Sem mudanças no coletor/QR/instalador. Painel publicado e coletor preservado; ver docs/05-qualidade/CONSULTA_EQUIPAMENTOS_2026-11-08.md.

- D-070 (08/11/2026): notificações de hardware/perda de comunicação no painel, cron de minuto + manutenção diária separada, polling visível de 15s. Prazo atual 17min; suspensão/desligamento informados não são perda inesperada. Migração aditiva 0017, referências por componente confiável, eventos deduplicados e leitura por usuário. Não alterar protocolo do EXE nem interpretar ausência como máquina desligada. Ver docs/04-dados-apis/MONITORAMENTO_E_NOTIFICACOES.md e docs/05-qualidade/MONITORAMENTO_2026-11-08.md.

- D-071 (08/11/2026): Central de demandas e Computadores por unidade/laboratorio no desktop. Root/admin gerenciam, visualizador le, operador permanece na coleta. Unidade sem inventario nao significa sem computadores; ausencia e classificacao de laboratorio explicitas. Demandas tem historico, equipamento opcional, idempotencia e versao; reconexao nunca conclui demanda manual. Migracao aditiva 0018; preservar coletor, QR, cron e Drive. Ver docs/03-painel-desktop/CENTRAL_DE_DEMANDAS.md.
- D-074 (09/11/2026): computador/impressora selecionam ambiente cadastrado da mesma unidade por ID, com lista consultada ao abrir/atualizar e cadastro novo explícito. Supera D-057 ponto 4 na interface atual; clientes antigos mantêm compatibilidade textual. Preservar autoria, histórico, QR/fotos e estados de conclusão. Não unificar nomes distintos automaticamente. Fases 4/5 continuam pausadas; ver docs/05-qualidade/AMBIENTES_COMPARTILHADOS_2026-11-09.md.

- D-078 (09/11/2026): root apaga cadastro de equipamento no painel com prévia, motivo e confirmação; arquivo preserva ficha/fotos/histórico, fora das contagens ativas. Migração 0023; ID removido nunca é reinserido. Vínculo de agente é encerrado sem revogar instalação, permitindo novo QR pelo protocolo existente. Não executar exclusões reais durante testes nem fundir duplicados automaticamente. Ver docs/05-qualidade/EXCLUSAO_EQUIPAMENTOS_2026-11-09.md.

- D-080 (10/11/2026): painel Mesa de dados e login entregues pelo responsável. Folha visual `web/painel.css`, menu compacto expansível/fixável e resumo global de rede a cada 60 s em aba visível; telas operacionais mantêm 15 s. Preservar D-065–D-079, mapa, categorias, etiquetas de vínculo, permissões e coletor. CSS antigos permanecem históricos, fora do build. Ver `docs/03-painel-desktop/MESA_DE_DADOS.md` e `DESIGN.md`.

- D-081 (10/11/2026): mudança de hardware exige decisão administrativa separada de leitura. Unidade com coordenadas pulsa discretamente no mapa; aviso ancorado acima da localização; modal SOMENTE por clique (correção posterior da mesma data), sem abertura automática nem botão flutuante; root/admin aceitam ou criam demanda idempotente vinculada. Visualizador lê. Contexto histórico, decisão/autor/data preservados; demanda aberta mantém destaque âmbar. Migração 0024; coletor/EXE/Drive e regras D-070 preservados. Ver docs/05-qualidade/HARDWARE_DECISAO_2026-11-10.md.
