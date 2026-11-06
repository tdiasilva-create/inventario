# Coleta mobile — roteiro de telas operacionais para o Codex

**Classificação:** ORGANIZAÇÃO DE IMPLEMENTAÇÃO DERIVADA da Base v1.0. As perguntas/opções/obrigatoriedade devem ser obtidas **literalmente** do original. Não é uma nova decisão funcional. **Visual aprovado:** `design/referencias/mobile/00_coleta_mobile_APROVADA.png`.

## Navegação-mãe
**M01 Login** → **M02 Início de coleta/retomada** → **M03 Selecionar unidade autorizada** → **M04 Cartões de categorias A–H** → **M05 Fluxo guiado específico de cada cartão** → **M16 Revisão global** → **M17 Envio/sincronização** → **M18 Confirmação do servidor**.

O usuário navega LIVREMENTE entre cartões A–H, com ordem sugerida; dentro de um cartão o fluxo é sequencial (wizard). Dependências bloqueiam somente perguntas que exigem dados não disponíveis. Não montar uma barra percentual geral da escola. Para marcar cartão concluído exige ação manual. Reabertura pede confirmação. O número exato de telas/etapas varia por respostas e pela versão do questionário.

| Tela | Objetivo | Entradas / decisões do usuário | Persistência / validação |
|---|---|---|---|
| M01 Login | Identificar coletor/admin | Nome de usuário, senha, primeira troca | Login no servidor, sessão limitada; §8 da Base |
| M02 Início | Iniciar ou retomar tarefa | Iniciar/retomar, situação de salvamento e conexão | Carregar rascunhos e credencial segura; §§7–8 |
| M03 Unidade | Escolher escola existente | Busca e seleção entre autorizadas | ID oficial, sem cadastrar escola; §2.5 |
| M04 Cartões A–H | Entrar em grupo | Escolher grupo livremente, estado de cada cartão | Só estados nos cartões; concluir/reabrir conforme §3 |
| M05-A Identificação | Dados da escola/vistoria | Confirmar dados pré-carregados; observações/responsável opcionais | Grupo A, §4.A |
| M05-B Ambientes | Contagem e localização de ambientes | Tipos predefinidos, nome personalizado se necessário | Grupo B; referenciar ambiente pelo ID estável |
| M05-C Internet | Entender links e conectividade | C.1–C.11 exatamente com condicionais | §4.C; sem internet não exigir operador/velocidade |
| M05-D Rede | Rede cabeada, Wi-Fi, AP, cabos | D.1–D.11, vínculos ambientes e equipamento | §4.D; totais não duplicam F |
| M05-E Energia | Observação visual elétrica | E.1–E.7, fotos/justificativa quando falhas | §4.E; não fazer testes perigosos |
| M05-F Tipos | Escolher equipamento e modo individual/lote | Categoria conforme §4.F.2 | Não alterar regime aprovado |
| M06 Equipamento novo | Identificação | Patrimônio, série, marca, modelo, ambiente | Identidade imutável; procurar duplicidade |
| M07 Detalhes | Campos técnicos opcionais por tipo | Campos §4.F.4 | Não transformar campos opcionais em exigidos |
| M08 Condições | Estado físico, funcionamento e uso | §4.F.3 — três perguntas obrigatórias | Falhas ativam problema/ação/prioridade |
| M09 Problemas | Identificar falhas e prioridades | Lista múltipla por categoria, origem/observação | §4.F.3/§4.H |
| M10 Fotos | Registrar ou pular quando opcionais | Câmera e galeria, prévia/substituição, max 5 por equipamento | Upload R2 + registro D1; §5 |
| M11 Equipamento existente | Buscar/conferir item já cadastrado | Verificado sem alterações; editar com histórico; não localizado | §9.6–9.10 |
| M12 Lotes | Registrar item agrupado nos tipos híbridos | Quantidade de grupo homogêneo, atributos compartilhados | Não inventar patrimônio/serial para lote |
| M13 Audiovisual | Atalho para tipos audiovisuais | TV, painel, projetor, webcam, microfone, caixa de som | Grupo G navegação sobre Grupo F; sem segundo registro |
| M14 Necessidades | Consolidar falhas e carências | Grupo H 19.1–19.7 | Evitar dupla contagem, registrar demandas ausentes |
| M15 Salvar/retomar | Evitar perdas em campo | Salvar manual + autosave + feedback | Separar local/remoto e estados; §7 |
| M16 Revisão | Conferir antes de enviar | Cartões, pendências, itens não verificados, fotos obrigatórias | Bloquear conclusão oficial se exigências não atendidas |
| M17 Envio | Sincronizar dados e fotos obrigatórias | Confirmar explicitamente e aguardar servidor | Idempotência, fila offline e conflitos; §7 |
| M18 Conclusão | Confirmar apenas sucesso real | Novo cadastro, retornar às categorias ou unidade | Só após confirmação do servidor: dados visíveis no painel |
| M19 Conflito | Resolver alteração concorrente | Comparar versões, resolver casos comuns ou escalar ao admin | §§7.3, 9.4 |
| M20 Sessão/offline | Acesso, bloqueio, desbloqueio local | Tela de desbloqueio e status do dispositivo | §§8.7–8.17; compatibilidade real a testar |

## Padrão de desenho de um formulário (invariantes visuais)
- Fundo predominantemente azul petróleo quase preto; títulos claros; ciano/azul para foco e chamadas; cards de categorias coloridos segundo o visual aprovado.
- Painel principal focado numa pergunta/etapa; texto orientativo curto; opções como botões tocáveis; `Voltar` e `Próximo` próximos ao alcance do polegar.
- O status de `Sincronizado`, `Salvo no dispositivo`, `Erro ao sincronizar` e `Envio pendente` deve ser legível. Não adicionar dashboard ou gráficos ao coletor.
- Foto apresentada para conferir captação e vínculo durante o preenchimento; **não** é galeria gerencial de consultas.
- Não mostrar velocidades, distâncias GPS ou modelos fictícios extraídos da imagem como se fossem dados reais.

## Pendências inalteradas
Regra de apresentação de erros §3.6/25.10, lista oficial de ambientes/marcas/provedores, parâmetros de foto, prazo offline/sessão, fotos por lote e implementação técnica exata. Consulte `docs/00-governanca/PENDENCIAS.md`. São **pendências**, não autorização para inventar.
