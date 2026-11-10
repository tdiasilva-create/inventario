# Consulta de equipamentos por unidade — D-069

Fonte aprovada: [INSTRUCOES_MODIFICACOES_PAINEL_SEMED_CONSULTA_EQUIPAMENTOS.txt](../06-entregas/consulta-equipamentos-2026-11-08/PEDIDO_ORIGINAL.txt), recebido em 08/11/2026. O responsável posteriormente determinou “publique no ambiente real as modificacoes”.

## Inventário técnico e leituras

Consultados: `00_LEIA_ANTES_DE_TUDO.md`, `AGENTS.md`, `REGRAS_DE_PRECEDENCIA.md`, `DECISOES.md`, `PENDENCIAS.md`, `CONFLITOS_DOCUMENTAIS.md`, `INVENTARIO_DAS_FONTES_E_LACUNAS.md`; documentação desktop `ESPECIFICACAO_DE_INTERFACE.md`, `ESPECIFICACAO_VISUAL_ANTERIOR.md`, `02_TELAS_E_INTERACOES.md`, `03_INDICADORES_E_CRITERIOS.md`, `04_ESPECIFICACAO_SETORES.md`; manifesto e `design/COMO_USAR_CADA_IMAGEM.md`. Abertos visualmente os cinco PNGs desktop, na ordem do manifesto: panorama geral, mapa, matriz, unidade selecionada e indicadores integrados. A identidade atual D-065 supera a paleta dos PNGs originais.

Contratos consultados: `MODELO_CONCEITUAL.md`, `02_FLUXO_DE_INTEGRACAO.md`, `03_CONTRATOS_E_PERMISSOES_PROPOSTOS.md`, `CONTRATO_QR_E_AGENTE.md`, `INTEGRACAO_GOOGLE_DRIVE.md`; fontes DOT dos cinco diagramas e seu status de síntese técnica. Trechos da Base original sobre fotografia, publicação, histórico, permissões e rascunhos. Aceites: `ACEITE.md`, `02_CASOS_DE_TESTE_PRIORITARIOS.md`, `GALERIA_FOTOGRAFIAS_2026-11-05.md`, `ANYDESK_RUSTDESK_2026-11-05.md`, `CADASTRO_UNIDADES_2026-11-06.md` e `PUBLICACAO_D068_2026-11-06.md`.

Os três HTMLs conceituais citados no pedido (`replica-painel-semed.html`, `montagem-visual-painel.html`, `editor-paginas-painel.html`) não vieram anexados a esta solicitação. Não foram tratados como código de produção ou fonte de dados. O componente real foi conferido no repositório. Nenhuma pergunta da Base original foi alterada.

Antes: o nome selecionava a unidade; a quantidade abria uma janela com até 50 fichas sem filtrar a categoria; “Dados do agente” substituía essa janela. A resposta da lista não trazia foto individual, hostname nem último contato. A lista usava o JSON publicado, com localização parcial separada.

Depois: nome e quantidade abrem uma consulta ampla embutida. A quantidade aplica a categoria da célula, incluindo categorias vazias. A ficha aparece ao lado da lista e reúne identificação, fotografias do mesmo ID, dados técnicos, comunicação e histórico. Panorama, Equipamentos e detalhe da unidade reutilizam o componente.

## Arquivos e contratos reais

| Arquivo | Responsabilidade |
|---|---|
| `web/desktop.js` | Matriz, seleção da unidade, montagem e navegação do painel. |
| `web/desktop-equipment.js` / `.css` | Lista, filtros, paginação, cópia, ficha embutida, fotos, comunicação e inventário técnico. |
| `web/desktop-inventory.js` | Mantém tabela antiga usada em coletas parciais; exporta os rótulos da ficha publicada. |
| `web/photo-viewer.js` | Visualização protegida, navegação somente entre fotos fornecidas e datas em Brasília. |
| `server/inventory-equipment.mjs` | Consulta publicada, filtros e contagens no D1, resumo do vínculo/contato e capa da foto por equipamento. |
| `server/collector.mjs` | Encaminha apenas a rota gerencial de equipamentos ao novo módulo de leitura. Escritas da coleta preservadas. |
| `server/photo-gallery.mjs` | Acrescenta filtro por equipamento e unidade ao serviço de fotos existente. |
| `web/index.html`, `scripts/build-desktop.mjs` | Inclusão dos novos assets no pacote desktop. |

| Endpoint | Uso / resposta |
|---|---|
| `GET /api/inventory/summary` | Matriz e totais publicados, contrato inalterado. |
| `GET /api/inventory/unit?unitId=UUID` | Última visita concluída, ambientes e fotos da unidade, contrato inalterado. |
| `GET /api/inventory/equipment` | Exige `unitId`; `offset` inteiro não negativo; `category` vazio ou 0–7 na ordem canônica da matriz; `q` até 120 caracteres; `agent` vazio/linked/unlinked; `photo` vazio/yes/no. Retorna até 50 itens, `total` de fichas filtradas, `totalItems` físicos filtrados, `unitTotal` e `unitItems` sem filtro, `nextOffset`, `source=published` e hora do servidor. |
| `GET /api/inventory/photos` | Novo `equipmentId` exige `unitId` válido; combina com `scope=published`. Paginação por cursor, 48 fotos. Não entrega referências privadas do Drive. |
| `GET /api/inventory/photo?id=UUID` | Proxy autenticado existente, verificação da relação unidade/visita/alvo, sem URL pública do Drive. |
| `GET /api/inventory/agent-status?equipmentId=UUID` | Uma chamada ao abrir a ficha, sem buscar agente para cada linha. Preserva algoritmo existente de presença, inventário reportado, vínculo e até 10 eventos de localização. |

Colunas canônicas: 0 computadores desktop/computer; 1 notebooks; 2 tablets; 3 projetores; 4 impressoras; 5 TVs; 6 router/ap/switch; 7 demais. A ordem visual particular do Panorama permanece D-067. Busca e filtros são executados no servidor sobre a ficha publicada; não se limita aos primeiros 50 itens. Ordenação de registros: criação decrescente e ID decrescente como desempate.

## Origem, segurança e limites

- Root/admin/visualizador consultam; operador não recebe consulta gerencial. A API não grava, publica, move, vincula ou exclui equipamentos. Unidade ativa e escopo D-068 continuam verificados no servidor.
- Identificação, posição, AnyDesk e RustDesk vêm de `published_json`. A localização atual divergente permanece rotulada PARCIAL. Ambientes antigos usam o nome do snapshot publicado; não se promove o nome atual de um ambiente editado a dado oficial.
- Telemetria é atual e tem proveniência “reportado pelo agente”; não significa nova vistoria publicada. Último contato não significa máquina ligada. Vínculo encerrado mantém histórico, sem atribuir telemetria atual a um equipamento anterior.
- Os identificadores de acesso remoto preservam zeros iniciais. “Copiado” só aparece após confirmação da área de transferência; falha oferece cópia manual do número selecionável. Não se inicia sessão remota.
- Fotos de capa e galeria exigem mesmo ID, unidade e visita concluída. Foto de fachada nunca é usada como foto do bem. Não há exposição pública de arquivos, nem novo upload/autoteste/exclusão no Drive nesta entrega.
- Miniaturas têm carregamento sob demanda por visibilidade. O arquivo é o já otimizado pelo coletor; ainda não existe derivado menor no servidor. Uma página com várias fotos visíveis pode transferir os arquivos correspondentes. Derivados privados menores são uma melhoria futura, não uma capacidade declarada.
- Não há atualização contínua do detalhe: “Atualizar” refaz a leitura; reabrir a ficha consulta novamente a comunicação. O Planejamento mantém seu comportamento existente para rascunhos.
- Histórico limitado aos 10 eventos disponibilizados pelo serviço. Não se declara histórico ilimitado nem se alteram protocolos do instalador, QR ou heartbeat.
- Os detalhes técnicos mostram todas as seções retornadas, incluindo módulos de RAM, discos físicos, interfaces e contas locais; dados ausentes são explicitados. Qualidade da leitura é preservada. Equipamentos sem agente não ganham informações inferidas.

## Etapas e aceite

1. Inventariar fluxo real e contratos; preservar D-065–D-068.
2. Implementar leitura paginada e filtros; testar >50 registros, lotes, alvo de fotos, perfis, GET e ausência de escrita.
3. Integrar consulta embutida, teclado, retorno, cópia, galeria e ficha técnica; testar 1366×768, 1440×900 e 1920×900.
4. Regressão do sistema; build; publicação somente do painel, sem migração/carga e com configuração/Drive/coletor preservados.
5. Conferência pública/produção e registro em [CONSULTA_EQUIPAMENTOS_2026-11-08.md](../05-qualidade/CONSULTA_EQUIPAMENTOS_2026-11-08.md).

## Atualização D-077 — edição do nome, 09/11/2026

Root pode editar nome de exibição na ficha de computador/notebook/impressora, também em Computadores e Coletas em andamento. Nome administrativo independente de hostname, marca/modelo, respostas e localização. Busca e fotos usam o mesmo ID com nome atual; exports acrescentam nome e hostname em colunas finais. Demais permissões e separação oficial/PARCIAL preservadas. Histórico/recibo atômico e conflito explícito em /api/root/equipment-name. [Contrato e aceite](../05-qualidade/EDICAO_NOMES_EQUIPAMENTOS_2026-11-09.md).

## D-078 — ação Apagar cadastro

Root: na ficha do equipamento, além de Editar nome, usar Apagar cadastro. Disponível também em Computadores e nas coletas em andamento. Prévia atual/motivo/confirmação; retirada de listas/contagens com arquivo de ficha, fotos e histórico. Consulta Cadastros apagados na unidade. Agente ativo tem vínculo encerrado e pode renovar QR; não revoga instalação. [Detalhes e testes](../05-qualidade/EXCLUSAO_EQUIPAMENTOS_2026-11-09.md).
## Atualização D-079 — vínculo / cadastro, 09/11/2026

Lista e ficha destacam **Agente vinculado**, **Cadastro manual**, **Aguardando vínculo**, **Vínculo encerrado** ou **Cadastro não informado**. Prevalece o vínculo efetivo; encerramento histórico não é cadastro manual. Comunicação continua separada: um agente sem contato recente mantém a etiqueta de vinculado. Não constitui detector automático de duplicidade.

`GET /api/inventory/equipment` acrescenta `link_state` (linked/manual/pending/ended/unknown/not_applicable) e aceita `agent=manual|pending|ended|unknown` além de linked/unlinked. Filtro antes da paginação, sobre o modo publicado e vínculo atual; unlinked conserva a compatibilidade antiga, incluindo outras categorias sem vínculo. Detalhe aberto atualiza a etiqueta com a consulta periódica de agent-status. Impressoras e demais categorias não recebem etiqueta de computador manual. [Testes e publicação](../05-qualidade/VINCULOS_AGENTES_2026-11-09.md).

## D-084 — consulta pela busca global

O cabeçalho agora abre /busca, separando unidades e equipamentos. Essa página usa o escopo explícito current na ficha, rotula PARCIAL e admite fotos recebidas de coletas abertas/pausadas. O comportamento oficial descrito acima permanece como padrão nas consultas da matriz/unidade. Ver [contrato da busca](BUSCA_GLOBAL.md).
