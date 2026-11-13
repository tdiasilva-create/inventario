# Estado e pendências — referência atual D-110, 12/11/2026

**Leitura atual:** [estado técnico D-110](11_ESTADO_ATUAL_D110.md). Existem 31 migrações, miniaturas D-072, histórico semanal de provedores D-099, APK/atendimentos D-105, ruas D-106, avatares D-107, redução de consumo D-108/D-110 e medidor D-109. As seções datadas abaixo são histórico, incluindo anotações de antes de uma publicação. Para migração física continuam faltando adaptador de runtime/persistência, estratégia de endpoints, recuperação ensaiada e homologação no destino. Nenhuma proposta de servidor físico está implantada por esta atualização documental.

## Estado mais recente e auditoria

O [guia de auditoria](../08-auditoria/README.md) reúne fontes, regras, testes e limites. O esquema atual possui 20 migrações, incluindo monitoramento (0017), demandas (0018), índices (0019) e miniaturas (0020). Resultados da organização de 08/11 estão no [registro de verificação](../08-auditoria/VERIFICACAO_2026-11-08.md); resultados de entregas anteriores abaixo continuam históricos.

- D-069: consulta embutida por unidade/categoria, ficha técnica, fotos por equipamento, paginação e identificadores remotos. [Aceite e conferência real](../05-qualidade/CONSULTA_EQUIPAMENTOS_2026-11-08.md).
- D-070: presença/notificações automáticas implementadas e publicadas, cron de minuto conferido. A antiga ausência de notificações não é pendência atual. Aceite físico de perda/retorno e manutenção de peça continua pendente. [Contrato e limites](../04-dados-apis/MONITORAMENTO_E_NOTIFICACOES.md).
- D-071: computadores por unidade/laboratório e central de demandas, incluindo contexto de unidade sem inventário. Classificação dos laboratórios e ausência confirmada são ações humanas; atendimento real ainda requer homologação operacional. [Aceite](../05-qualidade/CENTRAL_DEMANDAS_2026-11-08.md).
- Correção posterior: menus Computadores/Demandas e consultas de Configurações com tempo limite. Painel `e4ac8db6-ea92-42e0-8977-2ea21b9514ba`; coletor preservado. [Registro de produção](../05-qualidade/NAVEGACAO_PAINEL_2026-11-08.md).

## O que existe

- Dois Workers reais, um D1 compartilhado, usuários/perfis e interfaces distintas.
- Coletor atual por assuntos, fotos vinculadas às respostas/equipamentos, envio automático e campos AnyDesk/RustDesk opcionais.
- Computador manual com motivo e computador com agente/QR; ambiente/posição informados na coleta.
- Drive como provedor configurado; integração e upload têm código e testes. O uso real já teve registros de verificação em entregas anteriores, mas esta documentação não realiza novo upload nem nova autorização.
- Consulta desktop parcial separada da publicação oficial; histórico, IDs e permissões no servidor.
- Cadastro automático do agente sem lote conforme D-058 e preservação de assinaturas/vínculo autenticado.
- Identidade visual/UX do coletor publicadas conforme D-061/D-062. Não alteradas nesta organização.

## Verificação histórica da organização inicial

A [CI do commit bcf2ebab](https://github.com/tdiasilva-create/inventario/actions/runs/42146235419) passou em Linux/Chromium, incluindo 98 testes, três testes de navegador, builds e reprodução dos documentos. O ensaio de instalação local a partir dos arquivos Git também passou. Isso comprova reprodução do código/testes, não restauração de produção ou homologação física.

## O que não deve ser anunciado como concluído

| Pendência | Implicação / próximo passo |
|---|---|
| Restore completo ensaiado | Executar em destino privado isolado, incluindo Drive/chaves/IDs |
| Política de backup, RPO/RTO e retenção | Responsável deve defini-la e testar recuperação; não há garantia automática |
| Migração para outro runtime/banco | Exige adaptadores e homologação; não há Docker/VPS pronto |
| Continuidade de endpoint Windows | Conferir agente real e estratégia de atualização/ponte |
| Homologação do EXE exato | Instalar em Windows designado, QR no celular, reinício, sincronização e falhas |
| Offline durável | Fila atual vive na memória da aba; fechar aba pode perder pendências |
| Teclado/câmera físicos | Testes em navegador desktop não substituem aparelhos reais |
| Observabilidade operacional | D-070 já monitora agentes; definir observabilidade de disponibilidade do serviço, integrações, logs privados e responsáveis |
| Separação de material privado | Cofre institucional, fontes/instaladores e backup precisam de responsável |

## Lacunas de apresentação desktop já identificadas

O [mapeamento de respostas de 05/11](../06-entregas/MAPEAMENTO_COLETOR_PARA_PAINEL_DESKTOP_2026-11-05.txt) é uma fotografia histórica, anterior a D-069/D-070/D-071. A consulta atual já entrega lista paginada, ficha técnica, fotos do equipamento e notificações. Não reutilizar a lista antiga de ausências como diagnóstico atual sem reproduzir. Derivados menores de imagens e histórico completo/paginado do agente seguem como limitações do [contrato de consulta](../03-painel-desktop/CONSULTA_EQUIPAMENTOS.md); relatórios/exportações e planejamento não representam todo o escopo. A auditoria deve conferir os demais destinos campo a campo.

## Atualização posterior: fotografias D-064

D-064 criou uma página de fotografias e verificou a leitura de dez arquivos reais no Drive. **O escopo visual e a página foram superados por D-065**: o responsável deseja a identidade do coletor em todo o painel e não deseja uma aba de fotos. A página foi retirada e seu endereço redireciona ao Panorama. Fotos, leitura protegida e viewer contextual permanecem; fotos de coletas pausadas são histórico PARCIAL. A distribuição futura das fotografias nas telas ainda será definida. Ver [histórico D-064](../05-qualidade/GALERIA_FOTOGRAFIAS_2026-11-05.md) e [identidade geral D-065](../05-qualidade/IDENTIDADE_PAINEL_2026-11-06.md). Outras lacunas desktop acima permanecem.

## Como ler pendências antigas

### Atualização posterior: composição D-067 e categorias D-066

Publicado o layout aprovado no TXT/JSON de 06/11: mapa e matriz lado a lado, indicadores/filtros sob o mapa, questionário e resultados da unidade no Panorama, galeria contextual única e coletas em andamento no Planejamento. Nomes permanecem na matriz; blocos permanecem também nas telas de origem. D-066 separa contagens de escolas, núcleos e unidades administrativas. Versão desktop `97d33dfb-8147-4591-9724-f44d8d7bb9ba`, 100%; resolve o bloqueio temporário de publicação por 503. Coletor, dados e configurações preservados.

As 15 lacunas marcadas não decididas pelo responsável continuam pendentes. Não confundir a distribuição dos blocos com conclusão de relatórios, histórico, paginação, telemetria ou uniformização dos filtros. Ver [relatório D-067](../05-qualidade/LAYOUT_PANORAMA_2026-11-06.md).

### Precedência das decisões

Listas anteriores de R2 bloqueado, autorização de lote, ausência de fotografia de computador ou navegação V2 podem estar superadas pelas decisões D-048/D-057/D-058/D-060/D-062. Preservar histórico e consultar a decisão posterior antes de reimplementar a solução antiga. O manual atual não apaga lacunas de homologação.

## Escopo da organização inicial (05/11)

Documentação, organização Git, exemplos locais, catálogo físico e portabilidade dos três testes de navegador atuais. Nenhuma nova pergunta, regra, tela, migração SQL, credencial ou deploy de produção. Base original preservada. Resultados efetivamente executados ficam no [registro da organização](10_REGISTRO_DA_ORGANIZACAO.md).

## Publicação D-068 — 06/11/2026

O responsável autorizou a publicação após a entrega local. Migração 0016 aplicada ao D1 compartilhado, com backup anterior; painel 8f38585c-a65e-417a-a499-04d406209149 e coletor 859d0016-755f-4104-94ed-94e4780e2f8e ativos em 100%. Configurações e integração Drive preservadas. As 69 unidades existentes foram conferidas sem alteração de seus campos anteriores. Código de cadastro ampliado e escopo/matriz disponível no ambiente real. Ver [publicação D-068](../05-qualidade/PUBLICACAO_D068_2026-11-06.md).

Sem importação automática. A planilha de escolas tem vagas -16 na linha 31; campos e tipos aprovados não autorizam corrigir a fonte, reclassificar registros ou carregar dados. A carga, prioridade das fontes e atualização em lote por INEP permanecem pendentes. A cópia do D1 e o ensaio em SQLite não equivalem a restauração completa com arquivos do Drive. Ver também [testes locais](../05-qualidade/CADASTRO_UNIDADES_2026-11-06.md).


## Alterações locais posteriores — 09/11/2026
A [Fase 1 de desempenho](../05-qualidade/CORRECOES_PRODUCAO_FASE_1_2026-11-09.md) está implementada e testada localmente, **sem deploy**. Migração 0019 adiciona dois índices e ainda não foi aplicada no D1 remoto. O catálogo físico gerado passou a descrever 19 migrações/42 índices; produção permanece com 18 migrações/40 índices. Cache privado de fotos exige revalidação, mantendo sessão/permissões; não há retenção fresca de 24 h. Miniaturas, concorrência distribuída de upload, demais fases e homologação física permanecem pendentes.

### Publicação posterior — 09/11/2026

O responsável autorizou o deploy real após a entrega local acima. Fase 1 publicada nos dois Workers, ambos ativos em 100%; migração 0019 aplicada no D1 compartilhado, após backup validado. Produção passa a 19 migrações e dois índices adicionais. Cadastros, integração Drive e agendamento do monitor preservados. Ver [registro da publicação](../05-qualidade/PUBLICACAO_FASE_1_2026-11-09.md) para versões, rollback, verificações HTTP e limites. A sessão do painel expirou; novo teste autenticado de fotos pós-deploy não foi realizado. Demais fases continuam pendentes.

## Auditoria: miniaturas (Fase 2)

D-072 autoriza miniaturas pequenas no D1; originais continuam no Drive. Fase 2 publicada nos dois Workers em 09/11, ambos em 100%, com migração aditiva 0020 aplicada (20 no total). Root dispõe de preparo paginado das fotos antigas em Configurações; as três existentes foram preparadas em produção, totalizando 24.438 bytes, e a leitura da miniatura e ampliação integral foi conferida com sessão real. [Publicação/backup/versões](../05-qualidade/PUBLICACAO_FASE_2_2026-11-09.md), [contrato](../04-dados-apis/MINIATURAS_D072.md) e [aceite/limites](../05-qualidade/CORRECOES_PRODUCAO_FASE_2_2026-11-09.md). Não inferir que todas as fases da auditoria foram concluídas. Fases 3–5 e testes físicos seguem pendentes.


## Publicação mais recente — Fase 3 / D-073, 09/11/2026

Painel por blocos publicado em 100%, versão `104e92dc-7b74-4509-9ad9-24c215f7dbc1`; coletor mantido na Fase 2. Busca preserva mapa/DOM, fachada e galeria completa, detalhe com atualização, agente na consulta parcial e exportações CSV/XLSX. Sem migração ou alteração de cadastros. 141 testes e 12 roteiros de navegador; 46 verificações HTTP mais sete negações de acesso; conferência real root e três fotos existentes. [Publicação/limites/retorno](../05-qualidade/PUBLICACAO_FASE_3_2026-11-09.md). Fases 4/5 e decisões de locais/Ano continuam pendentes. As anotações de Fases 1/2 acima preservam o histórico.
## Coletor: ambientes compartilhados — D-074, 09/11/2026

Seleção por ID dos ambientes da unidade, com consulta atual ao abrir/atualizar e cadastro novo explícito, publicada somente no coletor (`c23eb70f-4541-4007-a125-5cba581ab87f`, 100%). Painel preservado na Fase 3, sem migração/dados de teste. 144 testes e três roteiros de navegador; nove verificações HTTP reais. Sessão do coletor expirada no navegador: aceite autenticado físico permanece pendente. [Relatório e retorno](../05-qualidade/AMBIENTES_COMPARTILHADOS_2026-11-09.md). Fases 4/5 pausadas a pedido do responsável; esta melhoria não as inicia.

## Correção de senha e reentrada — D-075, 09/11/2026

Publicada nos dois Workers: painel `5d92c1e6-99dd-4e74-a11b-164233cc6a76`, coletor `8d5d03f2-6bcd-4df2-bd6e-3fb8b3a078e6`, ambos em 100%. Operador que entra pelo painel é encaminhado ao login do coletor, com a mesma credencial e cookie separado. Minha conta distingue troca obrigatória de alteração voluntária. Troca concorrente vencida não revoga sessão nova nem audita sucesso. 150 testes, roteiro navegador e 56 sondas HTTP; sem migração, reset ou alteração de senhas oficiais. [Diagnóstico e limites](../05-qualidade/CORRECAO_SENHAS_2026-11-09.md). Retorno dos usuários em aparelhos físicos pendente; Fases 4/5 permanecem pausadas.
