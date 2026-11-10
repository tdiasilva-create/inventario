# Tour de lógica — D-082, 10/11/2026

## Pedido, fontes e precedência

O responsável enviou `entrega-claude-tour-logica-2026-11-10.zip`, `01_RELATORIO_TOUR_LOGICA.txt` e `depois_computadores_sem-comunicacao.png`, solicitando implantação imediata no ambiente real. ZIP SHA256 `9b06412b6663f7d101793c9ea838adfc6939e40bec392f1ca78e6b8e0fde307a`; 33/33 arquivos do manifesto conferidos. [Originais e instruções](../06-entregas/tour-logica-2026-11-10/ORIGEM.md).

Consultados: `00_LEIA_ANTES_DE_TUDO.md`, `AGENTS.md`, precedência, decisões, pendências e conflitos; Mesa de dados, Central de demandas, contratos de consulta/monitoramento, aceites D-069–D-081, procedimento de publicação/rollback. Referências desktop originais já examinadas nas etapas anteriores; identidade posterior D-080 e círculos D-081 prevalecem. Os cinco textos do pacote foram lidos, junto aos patches e manifesto. Evidências externas são testes sintéticos, não demonstração de produção autenticada.

## Implementação

| Item | Resultado |
| --- | --- |
| LOG-01/02 | Pulso e quatro botões de estado mostram toda a rede; quinto indicador inclui os demais estados. URL recarregável; grupos por ID da unidade, 60 fichas por página; status/hostname/unidade na ficha. |
| LOG-03 | Ver no mapa foca a unidade real em zoom 15 e abre seu nome. Sem coordenada, retorna ao enquadramento municipal. |
| LOG-04 | Busca identificada como nome/INEP/gestor; Enter funciona em consulta, operações e administração. URL conserva busca, inclusive ao recarregar. |
| LOG-05 | Links entre Computadores e Central acompanham a unidade atual, inclusive após mudar filtro. Modo de rede abre demandas globais. |
| LOG-06/07 | Hover do trilho com 220 ms; texto Próximos 50 corrigido. Teclado, menu fixo e mobile preservados. |
| LOG-09 | Formulário não envia demanda inalterada. Servidor também devolve unchanged sem incrementar versão/evento. Notas e mudanças válidas continuam auditadas. |
| LOG-11 | Ambientes abrem consulta oficial filtrada; sem Ver todos redundante na própria página. Filtro usa ambiente publicado para não antecipar localização parcial. Edição/fotos preservadas. |
| LOG-12 | Ocorrências, notificações e demandas têm destinos próprios no Panorama; removidos handlers demonstrativos mortos. |
| LOG-15 | Confirmações administrativas próprias, Cancelar/Escape sem escrita; senhas provisórias com Copiar/Ocultar e remoção em 60s/saída da página. |
| LOG-16/17/18 | Link Leaflet abre outra aba; atualização de integração retorna mensagem; cores do mapa alinhadas à identidade atual sem alterar geometria/camadas. |

Integração preserva D-080: tratamento de erro/contagens inválidas, cancelamento e ciclo único do pulso, acessibilidade e reflow do menu. Preserva D-081: círculo de 16 px sobre coordenada, vermelho pendente/âmbar encaminhado, movimento reduzido e modal somente por clique. A rota direta de uma demanda encaminhada permanece funcional.

Os testes de autenticação detectaram dependências estáticas necessárias na página de conta. `panel-confirm.js` e `hardware-attention.js` foram incluídos nas listas de assets autenticados da conta, inclusive no primeiro acesso. Não libera APIs gerenciais ao operador nem permite escrita sem perfil/CSRF.

## Aceite executado

- Suíte `pnpm test`: 179 testes aprovados, incluindo três novos de D-082 (rede/perfis/paginação, ambiente publicado e demanda inalterada).
- `operations-network-browser.cjs`: estados, agrupamento em duas unidades, números, botões, retorno, visualizador somente leitura e 390 px.
- `tour-logic-browser.cjs`: Enter em cinco telas + recarga, equipamentos por ambiente, foco do mapa, links cruzados, demanda sem escrita, cancelamento administrativo e ocultação da senha.
- Regressões: operações/demandas/laboratórios, navegação/timeouts/sessão expirada, consulta de equipamentos/fotos/quantidades, Mesa de dados/falha de rede/menu/login, monitoramento, hardware/parecer, cadastro/importação e autenticação nos dois ambientes.
- Os testes de operações/importação passaram a aguardar a atualização efetiva e confirmar o novo diálogo, respectivamente; não foram relaxadas suas verificações de negócio.
- Build desktop: 77 arquivos; build coletor: 54, conferido por compatibilidade do servidor compartilhado. Coletor não integra a publicação.
- Testes de browser usam Worker real + SQLite isolado. Nenhuma unidade, demanda, senha ou agente real foi modificado para testar. Fotografias da fixture não são integração com o Drive real.

Evidências locais em `docs/05-qualidade/evidencias/tour-logica-2026-11-10/`: `rede-sem-comunicacao.png`, `rede-comunicando.png`, `rede-mobile-visualizador.png`, `busca-unidades.png`, `equipamentos-ambiente.png`, `mapa-focado.png`, `demanda-sem-alteracao.png`, `confirmacao-administrativa.png`. Capturas de rede e ambiente abertas visualmente e comparadas com a proposta. Arquivos de evidência são ignorados pelo Git; não incluem senhas provisórias.

## Limites e decisões preservadas

LOG-08/10/13/14, Ano e destino alternativo da matriz continuam pendentes. Total atual de computadores significa fichas, como antes; não muda contagem física de lotes. Visão de rede calcula presença antes de paginar, com custo proporcional ao número de fichas; não há nova tarefa periódica. Consulta de ambiente apresenta dados publicados e identificação explícita, não promove coletas parciais.

Sem migração, mudanças de credenciais/configuração ou escrita de dados de teste em produção. Os fluxos de fotos/QR/EXE e os questionários não foram alterados. Fases 4/5 continuam pausadas.

## Publicação

Autorização explícita no pedido atual. Antes da entrega: painel `45daa7e9-fe21-4853-8ea9-f160b96017a5`, coletor `274ecd9b-002e-4f79-a4b9-325fc26fece1`, ambos em 100%. Publicação/checagem final será registrada abaixo após execução. Rollback pode voltar ao painel anterior, sem operação de banco.
