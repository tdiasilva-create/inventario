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
