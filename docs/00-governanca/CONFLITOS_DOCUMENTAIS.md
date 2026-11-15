# Conflitos e interpretações a preservar na revisão

Este registro não altera decisões; identifica pontos em que uma implementação ingênua produziria resultados indevidos.

**05/11/2026 — entrega de identidade (D-061):** o design system externo descreve “uma pergunta por tela”, recomenda staging e mantém a escolha tipográfica em aberto. O pedido atual aprova a aparência entregue e sua publicação real. Integração aplica as fontes e as duas fases visuais do pacote, preservando formulários por assunto de D-057, D-059/D-060 e permissões. O anexo não aprova mudanças de perguntas/fluxo nem cria nova exigência de autorização. Câmera física segue pendente de homologação, sem impedir a publicação visual explicitamente solicitada.

| Ref | Situação | Regra segura |
| --- | --- | --- |
| C-01 | Base §4.C item C.5 exige número de links, opções 1/2/3+, enquanto §4.C permite escola sem internet. | Registrar pendência de opção `0` / `não se aplica`; não forçar link inexistente. |
| C-02 | PNG mobile mostra `passo 1 de 4` e traço de progresso; Base §3.3 não autoriza porcentagem geral. | Tratar imagem como estética. Wizard pode ter progresso de etapa; estados gerais ficam somente nos cartões. |
| C-03 | PNG mobile inclui distância `1,2 km` e ordenação por proximidade. | GPS é opcional (Base §4.B), não habilitar distâncias sem dados e permissão adequados. |
| C-04 | PNG mobile foca cadastrar novo item; Base §§1 e 9 exigem inventário contínuo. | Também oferecer conferência de item já cadastrado, sem obrigar nova ficha e sem duplicação. |
| C-05 | PNG de sucesso do item usa `salvo`. | Não confundir item salvo com vistoria oficialmente concluída e liberada ao painel. |
| C-06 | Base §4.G tem cartão Audiovisual, porém categorias compartilhadas com §4.F. | Um bem, um registro; não duplicar dados na navegação. |
| C-07 | Fotos opcionais de equipamento vs obrigatoriedade condicional de foto de falha visível em infraestrutura. | Aplicar conforme objeto do registro; nunca impor foto de equipamento pela regra de infraestrutura. |
| C-08 | Escala vermelha no heatmap do desktop pode ser interpretada como criticidade. | Heatmap representa quantidade se assim rotulado; risco exige critério oficial, não inferência. |
| C-09 | Mockups desktop contêm escolas, zonas, coordenadas, métricas e nomes fictícios. | Nunca publicar esses dados como oficiais; só catálogo importado e geolocalização verificada. |
| C-10 | Uma escola terá vistorias sucessivas e pode ter coletores simultâneos. | Não somar bens repetidos nem sobrepor versões; histórico e concorrência são essenciais. |
| C-11 | Base §8 descreve offline criptografado e desbloqueio seguro em Chrome/Safari. | Requer prova em dispositivos reais; não prometer proteção/continuidade em todos os cenários até validação. |
| C-12 | Base §7.10 permite concluir com fotos **opcionais** pendentes, mas não com fotos de infraestrutura **obrigatórias** pendentes. | Estados de conclusão independem da fila opcional; não emitir mensagem falsa de total sincronização. |

Revisar este arquivo quando houver teste técnico ou aprovação explícita que elimine algum conflito.

## C-13 — resolvido por decisão posterior D-023, 27/10/2026

O pedido explícito mais recente solicita fidelidade ao painel geral reenviado, com cinco indicadores. A regra visual anterior de remover essa faixa fica superada nesta fase. Mapa, matriz, alertas, unidade e fotografias continuam presentes. Documentos antigos conservam contexto histórico; consultar DECISOES.md para precedência atual.

## C-14 — perfis: precedência posterior D-028

A instrução explícita de 27/10/2026 define root, admin, operador e visualizador. Supera a quantidade de dois perfis da Base §8.1 e de documentos anteriores para o novo planejamento. Permissões ainda pendentes; nenhuma autorização foi implementada no frontend.

## D-035 — atualização de precedência

Criação de usuários e gestão do cadastro mestre/atribuições são exclusivas do root. A concessão anterior de criar usuários operacionais ao admin fica superada. O admin mantém apenas as demais operações anteriormente aprovadas e disponíveis; não recebe escrita de unidades ou autorizações de visita. Cadastro individual de unidades e autorização direta por operador implementados; grupos e exceções híbridos ainda pendentes. Não confundir autorização com agenda ou coleta iniciada.

## C-15 — resolvido pela revisão posterior D-037, 28/10/2026

O cadastro de quatro campos e a retirada de atribuições/segurança (D-036) foram substituídos pela revisão integral enviada pelo responsável, preservada em `docs/01-projeto/REVISAO_DO_RESPONSAVEL_2026-10-28.txt`. Retornam campos completos, importação, Operadores × unidades e Segurança. D-035 continua regulando quem pode escrever: root, sem concessão implícita ao admin. O número 149 é referência de volume, nunca base para semear dados oficiais. A Base original permanece intacta.

## C-16 — enquadramento do mapa, resolvido por D-038

O zoom fixo/centro de D-034 deixava o contorno cortado. Pedido posterior exige centralizar no município, Ruas por padrão e limite só ao selecionar. Enquadramento agora usa extensão inteira da geometria existente, substituindo escala fixa inicial. Evidências antigas de 3 km são históricas.

## C-17 — regra de INEP administrativo, resolvida por D-039

D-037 interpretava literalmente “vazio só para núcleos”, apesar de oferecer Unidade administrativa. Correção explícita posterior dispensa INEP para núcleos e unidades administrativas; somente escolas municipais/conveniadas exigem o código. INEP preenchido segue formato/unicidade. Nenhum identificador fictício deve ser criado para contornar a validação.

## C-18 — continuidade e autoridade root, resolvido por D-046

Participação/atribuição não confere propriedade permanente sobre unidade. D-046 supera a restrição após publicação de D-042. Operadores podem continuar qualquer unidade ativa; autoria não é autorização exclusiva. Root ganha exclusão integral de unidade por ação confirmada; histórico/auditoria preservados. Não reinterpretar isso como permissão de exclusão pelo operador nem afirmar interfaces administrativas ainda ausentes.

## C-19 — autorização de instalação, resolvido por D-058 (05/11/2026)
O relatório anterior recomendava manter lote; o responsável posteriormente escolheu explicitamente A, cadastro automático sem lote. Essa escolha supera a recomendação e os trechos antigos que exigem SEMED-Install-Grant em produção. Não enfraquece assinatura individual, vínculo por usuário autenticado nem proteção de telemetria. O trecho do arquivo recebido que dizia cadastro pendente “sem dados” foi corrigido: existe resumo técnico. 0.1.8 pode tentar automaticamente; o prazo de dez minutos depende de serviço/rede ativos e não é garantia de homologação.

## Cadastro ampliado — D-068 (06/11/2026)

O pacote externo sugere D-054 e migração 0015, já ocupados por decisões/migração anteriores. Implementação usa D-068 e 0016, preservando os originais. D-037/D-039 continuam históricos quanto à escola conveniada: esse tipo agora sai do escopo, sem apagar registros. D-066 passa a usar sete categorias sem conveniadas. A faixa antiga de cinco indicadores/D-023 e o CSS azul do exemplo não substituem D-065/D-066/D-067. Referência de abreviações usa “Obra”; tipo aprovado é “Obra em andamento”, adaptado sem alterar o oráculo recebido. Quantidades de testes/builds citadas no pacote são de 04/11 e não descrevem o código atual. Critério de todos os CSVs passarem esbarra em vagas negativas na fonte: preservar erro e pendência, não adulterar o dado para obter teste verde. As propostas de tipos/etapas/obras foram confirmadas; prioridades de fontes/carga continuam pendentes.
# Seleção de ambientes — resolvido por D-074 (09/11/2026)

O pedido atual substitui a digitação livre em cada equipamento aprovada no ponto 4 de D-057 pela seleção dos ambientes cadastrados na mesma unidade. Cadastro de ambiente novo permanece explícito. Não fundir nomes parecidos ou apagar duplicidades históricas automaticamente. A compatibilidade textual para abas antigas não é a interface oferecida ao abrir a página atualizada. Fases 4/5 da auditoria permanecem pausadas.

## D-081 — apresentação do alerta, esclarecida em 10/11/2026

A entrega inicial abriu o modal automaticamente e adicionou avisos fixos. O responsável esclareceu que o aviso deve estar sobre a coordenada da unidade e o modal abrir somente ao clicar. Aplicar o adendo de D-081; o registro de qualidade inicial permanece histórico, superado nesse comportamento.

## D-082 — pacote anterior às correções do mapa e da moldura

Substituir integralmente os arquivos prontos apagaria D-081 e correções D-080 (cancelamento de consultas, validação de contagens, acessibilidade/menu, retorno do primeiro acesso). Aplicação por trechos, sem executar comandos do anexo cegamente. A consulta de equipamentos de ambiente usa o ID no published_json (D-069), superando a sugestão técnica de usar e.environment_id, que pode estar em alteração parcial. Numeração sugerida D-079/080 já ocupada. A publicação real foi explicitamente solicitada; não é necessário novo staging/consentimento. O ponto B8 sobre Ano continua pendente de regra.

## D-083 — substituição do indicativo do mapa

A composição D-067 mostrava computadores declarados funcionando, a partir de inventário concluído. A decisão posterior D-083 substitui somente esse indicativo por escolas com presença recente de agentes, dado operacional, inclusive vínculo ainda parcial. Não transforma estado de comunicação em conclusão de vistoria nem em diagnóstico de internet. D-082 usava marcador comum carvão/selecionado vermelho; agora ambos usam #7523C9, preservando precedência dos alertas D-081.

## D-084 — busca atual e consulta oficial

O cabeçalho restrito a unidades em D-082 é superado pela escolha 2 (unidades + equipamentos). A busca global usa ficha salva atual com PARCIAL explícito; a matriz e a consulta D-069 continuam no padrão publicado. Fotos abertas/pausadas só entram no escopo atual, com identificação de origem; não são promovidas aos indicadores. Demais decisões do tour continuam pendentes.

## D-085 — “Pendentes” do desenho versus três filas reais

A opção 3 aprovada em 10/11/2026 supera o indicador genérico e a pendência LOG-13. Coleta pendente, demanda aberta e hardware aguardando parecer têm fontes/estados distintos e não formam um total. A nova faixa é de toda a rede, explicitamente rotulada, enquanto os indicadores oficiais anteriores mantêm os filtros do Panorama. [Regras](../03-painel-desktop/INDICADORES_DE_PENDENCIAS.md). Não redefine outras métricas ou pendências.

## D-086 — telas sem relatório/planejamento definido

A escolha 2 resolve LOG-14 no escopo do primeiro relatório de computadores e fila por unidade. Supera os avisos de relatório indisponível/planejamento a definir. Não altera D-067 sobre coletas em andamento no Planejamento, nem decide agenda, atribuições ou prioridade. Relatório atual pode mostrar PARCIAL; matriz e indicadores oficiais mantêm escopo publicado. Contagem por ficha continua até decisão LOG-08. [Contrato](../03-painel-desktop/RELATORIOS_E_PLANEJAMENTO.md).

## D-087 — categoria versus alerta no mapa

A decisão posterior de cores por tipo supera D-083 quanto ao roxo uniforme e D-081 quanto à substituição da cor central por estado de alerta. Centro representa categoria; círculo externo representa hardware pendente/verificado com demanda aberta. Preserva animação, clique/modal, métricas e estados existentes. [Paleta e aceite](../05-qualidade/CORES_CATEGORIAS_MAPA_2026-11-10.md).

## D-088 — destino e prazo dos avisos

Decisão posterior supera D-070 quanto a gerar comunicação perdida após 17 min e mostrá-la no sino; agora mais de 48 HORAS, confirmado pelo responsável, e nova aba de log. Os 17 min permanecem só na presença recente/status. O sino usa hardware.pending, não unread; histórico e leitura individual preservados. Não aplicar o novo prazo para encerrar incidentes antigos como se houvesse retorno. A posição das escolas offline, pendente em D-083, foi definida acima de online. Cores D-087 e círculo/clique/modal D-081 preservados. [Contrato](../03-painel-desktop/NOTIFICACOES_E_LOG.md).

## D-089 — propostas do pacote do coletor versus decisões existentes

O pacote externo é fonte de diagnóstico, não aprovação automática. CL-08 resolvido pela busca limitada com rótulo explicativo; CL-10 pelo Salvar compacto. CL-13 não reintroduz conferência obrigatória, pois D-057 já decidiu Editar somente; somente o contador sem ação foi retirado. Fotos obrigatórias de impressora/fachada continuam pelas decisões atuais; foto de computador permanece opcional D-060. Relatório externo de testes antigos não substitui os testes executados nesta entrega. Base original permanece íntegra; [contrato](../02-coleta-mobile/REVISAO_E_ACOES_D089.md).

## D-090 — contagem sobreposta intencional e dados escolares

D-066/D-068 preservam os tipos distintos no cadastro, mas D-090 manda contar militares dentro de Escolas municipais e explicitar Das quais militares. Não somar os dois cartões nem alterar o tipo real; creches continuam separadas. Números históricos no relatório externo não são constantes oficiais do sistema. A planilha contém dados de múltiplas fontes e setores: somente cadastro escolar foi aprovado, sem importação ou conciliação automática. CONTRATO não entra no esquema; quantidade de servidores contratados é conceito distinto. Campos antigos e fonte/data são reaproveitados; fotografias, equipamentos e internet continuam no inventário, sem cadastros duplicados.

## D-091 — ambiguidade resolvida no pedido do Panorama

PAN-02 foi confirmado como ampliar o mapa e habilitar a roda, não somente ativar zoom. PAN-05 estava marcado A sem descrição: responsável confirmou manter como está. PAN-03 interpretado e comunicado como 30% menor (70% do tamanho anterior). Nenhum item desmarcado é removido ou transferido.


## D-093 — TP-20: municipal e conveniada homônimas

O responsável informou que EM RAIO DE LUZ existe como municipal e conveniada e definiu somente a municipal no escopo atual. O nome isolado não justifica reclassificação, união ou remoção de unidades. A conferência cadastral do relatório não autoriza importar conveniadas. Nenhum dado oficial foi alterado por esta decisão.


## D-094 — âmbar de hardware encaminhado superado

A sinalização âmbar D-081/D-087/D-088 para demanda oriunda de hardware foi substituída por anel verde-petróleo #006D77 para qualquer demanda aberta, por pedido posterior do responsável. O vermelho de hardware sem parecer permanece no círculo interno, com seu modal e sino próprios. Demanda não é alerta sem parecer; o número do sino não aumenta por criar atendimento manual.

## D-095 — destino do clique, decisão posterior

O pedido mais recente determina Unidades já na escola escolhida, com exceção somente para demanda aberta, que vai à Central. Isso supera a abertura de modal de hardware pelo centro do marcador em D-081/D-088/D-094. O círculo vermelho continua informativo; parecer e comparativo permanecem no sino. Não confundir essa mudança de navegação com remoção da detecção, dos eventos ou da exigência de parecer. Tooltip reaproveita números oficiais do cadastro, sem converter nulo em zero.

## D-096 — regras de senha posteriores às propostas originais

A decisão expressa de 11/11/2026 supera mínimo 12, verificação externa de vazamentos e geração automática de senha no formulário de criação presentes nas propostas/autenticação anteriores. Agora seis a 256 caracteres, composição livre, provisória escolhida pelo root e nenhuma dependência Pwned Passwords. Primeiro acesso obrigatório, prazos, hashing e D-075 continuam vigentes. A remoção da geração automática se restringe à criação; reset administrativo não foi alterado. Documentos históricos e Base original são preservados como fontes anteriores. [Aceite](../05-qualidade/SENHAS_SIMPLIFICADAS_2026-11-11.md).


## D-097 — IP público não substitui endereço local nem localização oficial

O endereço observado na chegada do heartbeat é uma observação do servidor, não novo campo obrigatório do inventário assinado. Não muda o contrato do EXE nem habilita a coleta de endereços internos que a política atual deixe desativada. Organização de ASN não equivale necessariamente ao provedor contratado; geolocalização por IP não é usada para cadastro/mapa. A ficha mantém vínculo por ID e não expõe conexão atual de instalação cujo vínculo com aquele equipamento acabou. [Contrato](../04-dados-apis/CONEXAO_AGENTES_D097.md).


## D-098 — periodicidade de emissão não altera a fonte histórica

O pedido diz emitir semanalmente ao clicar e abranger computadores que já enviaram dados. Portanto a consulta usa a última informação disponível e inclui offline antigo; não inventa histórico semanal, limita a sete dias nem agenda tarefa. O responsável confirmou Último contato no lugar da repetição de Provedor. O relatório identifica data da emissão e do contato. [Contrato](../03-painel-desktop/RELATORIO_PROVEDORES_D098.md).

## D-099 — alteração posterior do relatório D-098

Novo pedido explícito substitui linhas por computador por uma amostra por unidade e remove Hostname da apresentação/exportações, mantendo quatro colunas. Também autoriza o arquivo semanal automático que D-098 não contemplava. Horário confirmado: segunda-feira 08h Fortaleza. Não reinterpretar os documentos antigos como impedimento nem inventar dados de semanas anteriores; preservar D-098 como histórico e começar as emissões datadas na implantação D-099. IP, provedor e contato provêm do mesmo computador selecionado, sem inferir que todos os links da unidade sejam iguais. [Contrato vigente](../03-painel-desktop/RELATORIO_PROVEDORES_HISTORICO_D099.md).


## D-106 — sequência reta substituída por percurso viário

A limitação documental D105 “tracejado indica sequência, não vias” deixa de ser o comportamento desejado. Pedido de 12/11 exige ruas e ordem exata do root. Preservar regras de localização/atribuição; não interpretar a nova rota como histórico de deslocamento nem otimização de agenda. Contrato/publicação: ../03-painel-desktop/ROTAS_PELAS_RUAS_D106.md.

## D-112 — indicadores de coletas no Panorama
Pedido posterior substitui Coletas concluídas (visitas) e Coletas pendentes D-085 no Panorama pelos estados administrativos D-111. Não reclassificar visitas nem herdar conclusão técnica como completa. Scope global explícito, como Controle das coletas sem filtro. APIs e páginas técnicas antigas continuam preservadas fora desta apresentação.

## D-114 — localização deixa de depender da demanda individual
O novo pedido e a confirmação sobre expiração do login superam a limitação de acompanhamento por atendimento D105 e o adiamento registrado em D113. Só a capacidade de enviar a própria posição continua sem login vigente; consulta/escrita de demandas não recebe essa exceção. Concluir/pausar uma demanda mantém a localização enquanto houver outra atribuição aberta; sair/revogar/zerar a fila encerra. Não promover instalações/aceites antigos automaticamente. APK 1.0.2 necessário; limites do Android e teste físico explícitos em ../03-painel-desktop/LOCALIZACAO_CONTINUA_D114.md.


## D-115 — duas áreas no APK
A decisão explícita de 13/11/2026 supera a exclusividade técnica do APK em D105 e a restrição histórica a navegador da Base §3.5 somente para oferecer Coleta no mesmo APK. Não une papéis nem libera desktop ao operador; não altera perguntas, conclusão manual ou elegibilidade das unidades. D114 continua determinando duração/autorização do acompanhamento da fila, mesmo com Coleta aberta. O navegador coletor separado continua disponível. [Contrato](../02-coleta-mobile/APP_UNIFICADO_D115.md).


## D-116 — estado individual em lugar da contagem proposta, 14/11/2026

O pacote externo implementa “N de 8 assuntos concluídos” e lista algumas alterações já aplicadas como “nada implementado”. A escolha posterior do responsável exige apenas estados individuais, sem esse contador. Manter os blocos e a navegação durante fotos foi confirmado, mas não dispensa corrigir concorrência e confirmação de gravação. Essas escolhas e o estado real da entrega prevalecem sobre os rótulos de aprovação do pacote. Contratos D089/D111/D114/D115 não foram substituídos. Ver [revisão](../05-qualidade/REVISAO_REFINO_COLETA_2026-11-14.txt).


D-116 — revisão independente da rev2, 14/11/2026: 146 hashes conferidos; 301 testes Node, onze roteiros de navegador (incluindo 14 verificações de concorrência) e 31 capturas repetidos. As escolhas D116 e os três cenários originais foram conferidos; duas sondas adicionais reproduziram R1-F (rascunho confundido com salvamento completo) e R4 (conclusão com prévia de foto cujo envio falhou). Integração/publicação ainda não recomendadas; nenhuma nova decisão funcional necessária para corrigir esses defeitos. Código de produto/Android/produção preservados. [Devolutiva rev2 e critérios](../05-qualidade/REVISAO_REFINO_COLETA_REV2_2026-11-14.txt).


D-116 — revisão independente da rev3, 14/11/2026: aprovação técnica LOCAL. 175 hashes conferidos; 301 testes Node, onze roteiros de navegador (22 verificações de concorrência no roteiro novo), quatro sondas independentes e 31 capturas repetidos. R1/R2/R3/R1-F/R4 não se reproduzem nos cenários seguros; rascunho não confirma salvamento completo e foto pendente impede conclusão até reenvio/descarte explícito. Escolhas D116 preservadas. DP19/20 do pacote não exigem nova decisão para essas correções. Restam integração, publicação e homologação Android física; nenhuma delas executada nesta revisão. Código de produto e produção preservados. [Relatório rev3 e limites](../05-qualidade/REVISAO_REFINO_COLETA_REV3_2026-11-14.txt).


### C-D118 — fonte do agente versus EXE indicado
Em 14/11/2026 a pasta `agente` indicada como fonte contém somente `SemedAgente-Instalador-0.1.8.exe`. Não reutilizada a fonte 0.1.6 como padrão. Núcleo reconstruído da análise do 0.1.8, código preservado em windows/agent e proveniência registrada. Serviço/UI binários originais permanecem; rótulos fixos 0.1.8 coexistem com núcleo 0.1.9-rc1, explicitado no piloto. Não declarar código original completo ou homologação. API/implantação pendentes.

## D-119 — atualização versus recuperação, 14/11/2026
O Core 0.1.8/0.1.9 anterior recomendava PURGE/lote ao ficar revoked. Essa mensagem não atende ao pedido atual de preservar pendências e ao cadastro automático D058. Novo rc3 oferece recuperação explícita com arquivos/histórico arquivados e identidade nova, sem reativar a revogada. D056/instaladores anteriores são referências históricas preservadas; atualização normal continua sem reset. Não tratar arquivamento como sincronização da mensagem antiga nem novo QR como vínculo já efetuado. Ver docs/05-qualidade/RECUPERACAO_AGENTE_D119_2026-11-14.md.

## D-121 — escopo atual e fotografia
O novo mapa de setores usa dados atuais salvos/parciais por decisão explícita posterior; não modifica o escopo publicado das demais áreas da unidade e da matriz D069. Item 4.2 do pedido solicita fotografia imediata, enquanto item 8 a inclui em melhorias futuras: aplicada a exigência concreta do item 4.2 no resumo selecionado. Nenhuma imagem específica do organograma foi anexada, portanto não se declara correspondência pixel a pixel com referência ausente. Lotes continuam uma ficha com quantidade, total de cadastros e total de itens separados; LOG-08 não foi decidido por inferência.

D121 — 15/11/2026: pedido posterior explícito substitui unidade no topo/colunas estreitas por organograma horizontal com equipamentos em grade. Somente composição; escopo de dados, comunicação, fotos, fichas, permissões e custo de consultas preservados. Ver docs/05-qualidade/MAPA_SETORES_HORIZONTAL_2026-11-15.md.

## D122 — superação parcial da busca global D084
O pedido de 15/11/2026 retira equipamentos da busca principal e exige sugestões durante digitação. Substitui o comportamento do cabeçalho D084; a rota antiga continua compatível com URLs salvas, sem ser chamada pelo novo campo. O mapa ampliado D091 agora inclui a busca dentro da área acessível; foco/câmera/retorno preservados. Nenhuma mudança no questionário, catálogo oficial ou dados de agentes.
