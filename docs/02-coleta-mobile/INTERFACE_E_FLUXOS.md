# Coleta mobile — tradução das decisões em telas

**Fontes de referência:** Base original v1.0 (prevalece para funcionalidade) e `design/referencias/mobile/00_coleta_mobile_APROVADA.png` (prevalece para estética).

## Aparência aprovada
- Interface de campo **dark-tech**, azul-marinho quase preto, azul vivo/ciano nas ações, bordas discretas, cantos arredondados, cartões grandes, ícones consistentes e alto contraste.
- Experiência *mobile-first* com aparência de app nativo, acessada por navegador, foco em toque e rolagem vertical.
- Evitar formulários grandes numa única página, texturas decorativas que prejudiquem leitura e elementos de consulta gerencial.
- A imagem é COMPOSIÇÃO ILUSTRATIVA: títulos/nomes, distância de unidades, valores e barra de passos dos mockups não anulam a Base v1.0.

## Inventário de telas/fluxos
| Tela / fluxo | Função | Fonte de comportamento |
|---|---|---|
| Login | Usuário+senha; troca de senha provisória no primeiro acesso | Base §8 |
| Entrada | Iniciar/retomar coleta; indicar autenticação e estado local | Base §§2,3,7 |
| Seleção da unidade | Procurar e escolher somente unidade autorizada, confirmando troca se houver alterações | Base §§2.4–2.6 |
| Cartões A–H | Ordenados por sugestão; livre acesso quando independentes; estado pendente/em andamento/concluído | Base §3; §4 |
| Identificação | Resumo automático, observações opcionais, responsável presente opcional | Base §4.A |
| Ambientes | Tipos/contagens e fichas para ambientes relevantes com vínculo de equipamentos | Base §4.B |
| Internet | Perguntas C.1–C.11 e ramificações | Base §4.C |
| Rede interna | Perguntas D.1–D.11 e fotos de falhas visíveis | Base §4.D |
| Energia elétrica | Perguntas E.1–E.7, observação segura | Base §4.E |
| Equipamentos | Escolher categoria, conferir item existente ou cadastrar, ficha por categoria/individual-lote | Base §4.F; §9 |
| Audiovisual | Cartão de acesso às categorias F, sem duplicar bem | Base §4.G |
| Problemas/necessidades | Consolidar achados automáticos + registro manual sem contagem dupla | Base §4.H |
| Fotografia | Câmera/galeria, prévia, remover/trocar, regras de foto por contexto | Base §5 |
| Resumo do item | Revisar ficha e Salvar item, com próximo cadastro rápido | Base §§4.F,7 |
| Revisão final | Mostrar cartões e pendências; saltar para correção; confirmar envio | Base §7.5 |
| Fila/erro de envio | Indicar salvo local, sincronizando, sincronizado, conflitos e fotos pendentes | Base §§7.1–7.11 |
| Retomada/conferência | Reconhecer inventário permanente, verificar sem alterações e reabrir cadastro autorizado | Base §§2,9 |

## Comportamentos obrigatórios
- **Cartões:** progresso somente nos próprios cartões; não adicionar porcentagem global.
- **Conclusão:** coletor marca manualmente `Concluído`; reabertura pede confirmação.
- **Wizard:** Voltar/Próximo; dependências bloqueiam apenas passos que delas dependem, com atalho de resolução.
- **Formulários:** usar escolhas rápidas/predefinidas onde existirem; especificações técnicas opcionais jamais virar obrigatórias por conveniência.
- **Fotos:** 0–5 por equipamento (opcionais), salvo condicionais de falha visível de infraestrutura; não anexar vídeos/documentos.
- **Salvamento:** auto + Salvar, distinguir local de servidor; envio oficial apenas com condições aprovadas.
- **Offline:** versões em conflito preservadas e resolvidas conforme permissão; não apagar dados pendentes.

## Não extrair regras da arte
A arte mostra rótulos como `Passo 1 de 4`, `Mais próximas` e foto de fachada; isso NÃO obriga que o aplicativo conheça GPS, distâncias ou limite fixo de 4 etapas. A Base define GPS opcional e progresso sem barra percentual geral. O mockup de sucesso `Equipamento salvo` NÃO deve disparar a publicação da vistoria no painel.

## Aceite visual futuro
Registrar screenshots do código rodando em larguras usuais de celular e comparar com a referência. São exigidos legibilidade e área de toque; não copiar erros tipográficos/valores fictícios do mockup.
