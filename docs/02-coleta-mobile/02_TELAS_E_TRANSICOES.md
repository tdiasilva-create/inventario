# Especificação de telas e transições — coleta mobile

**Estado:** tradução estruturada da Base de Coleta v1.0. Campos e obrigatoriedade prevalecem no TXT original. **Design:** `design/referencias/mobile/00_coleta_mobile_APROVADA.png`.

## A. Acesso e entrada
1. `M01 Login`: nome de usuário + senha, sessão limitada configurável (Base §8). Primeiro acesso obriga senha provisória→senha pessoal. Não pedir matrícula, CPF ou e-mail.
2. `M02 Início`: ação principal `Iniciar/Retomar coleta`; acesso objetivo a status local/sincronização. **Sem relatórios, gráficos ou painéis gerenciais.**
3. `M03 Escolher unidade`: campo de pesquisa e lista de unidades **já cadastradas/autorizadas**. Confirmação de mudança quando houver alterações locais em andamento. Não incluir `Criar escola`.
4. `M04 Categorias`: cartões A–H em ordem sugerida e navegação livre. Estados `Pendente/Em andamento/Concluído` **dentro dos cartões**; sem porcentagem global. Se um cartão depender de outro, permitir entrar no independente e bloquear somente a etapa dependente, com atalho. `Marcar como concluído` valida o cartão; `Reabrir` pede confirmação.

## B. Padrão único de wizard para cada categoria
- Cabeçalho compacto com unidade e nome da categoria. Indicador **local** de etapa permitido (ex.: `2 de 4`), não percentual geral da vistoria.
- Conteúdo principal: uma decisão por tela ou pequeno conjunto de campos coerentes; botões fixos `Voltar` e `Próximo` com zona de toque confortável.
- Controles: escolha única, múltipla, sim/não/não avaliado, número, texto curto, campo adicional opcional, captura/galeria de imagem. Só exibir campos técnicos correspondentes à categoria.
- Mudança de etapa sem perda de respostas. `Salvar` manual e autosalvamento com estado honesto (`Salvo no dispositivo`, `Sincronizado com servidor`, `Erro`).
- **Regra de validação visual detalhada (quando exibir o erro): PENDENTE**, não impor onChange nem padrões não aprovados. Bloqueios de dependência e validação na conclusão são aprovados.

## C. Fluxos A–H (o que aparece ao entrar no cartão)
| Cartão | Tela inicial do wizard | Telas seguintes | Dados reutilizados |
| --- | --- | --- | --- |
| A Identificação | Revisão de identificação automática do coletor/unidade | Responsável/cargo local opcionais, observações | Catálogo de escolas, usuário e data |
| B Ambientes | Contagem de tipos de ambiente | Ficha de ambiente relevante, nome personalizável e tipo | Lista de ambientes para vínculo em outros grupos |
| C Internet | Existência e teste de internet | Tipo, operadora, links, velocidades, estabilidade, áreas afetadas, problemas e fotos | Ambientes B; problemas H |
| D Rede e Wi-Fi | Rede cabeada e Wi-Fi | Cobertura, roteadores, APs, switches, racks, cabos/defeitos, fotos | Ambientes B; equipamentos F; problemas H |
| E Energia | Suficiência das tomadas e irregularidades visuais | Proteções, aguardando instalação, necessidade de especialista, fotos | Ambientes B; equipamentos F; problemas H |
| F Equipamentos | `Conferir existente` / `Cadastrar novo` → selecionar categoria | Identificação, status, detalhes opcionais, problemas, ação, fotos, resumo, salvar e repetir | Ambientes B; grupos D/E; problemas H |
| G Audiovisual | Atalho às categorias audiovisuais do cadastro F | Mesmo registro do grupo F, **não** ficha duplicada | F, H |
| H Problemas/necessidades | Resumo dos achados anteriores + `Adicionar problema/demanda` | Impacto/setor, falta de equipamentos, infraestrutura, prioridade, origem | C/D/E/F sem duplicar IDs |

## D. Fluxo F para novo equipamento
`Escolher categoria` → `Modo individual ou lote (quando aprovado)` → `Local/ambiente` → `Identificação` → `Estado de conservação/funcionamento/situação de uso` → `Defeitos/ações/urgência se aplicável` → `Especificações opcionais correspondentes` → `Fotografias opcionais (0–5)` → `Revisar ficha` → `Salvar item` → `Registrar outro / Voltar às categorias`.

**Importante:** esta é uma proposta de sequência de telas derivada, não uma mudança nas obrigatoriedades aprovadas. O Codex pode agrupar os passos visualmente, preservando todas as informações exigidas, com aprovação visual na fase de protótipo.

## E. Fluxo F para bem já cadastrado — essencial no inventário contínuo
`Categoria/local` → `Encontrar item existente` (patrimônio/série/filtro de categoria, se houver) → `Inspecionar ficha` → `Confirmar verificado sem alteração` **OU** `Atualizar campos` **OU** `Não localizado (justificar)` **OU** `Não verificado (opcional justificar)` → `Salvar verificação`. Registre `última verificação` separadamente de `última alteração`.

## F. Fotos (no contexto do item/ocorrência)
`Abrir câmera` **ou** `Selecionar galeria` → prévia → aceitar/excluir/substituir → vincular ao ID correto → estado de upload independente. Máximo de cinco por equipamento; problemas visíveis de infraestrutura exigem foto ou justificativa válida, quando não for seguro/possível. Sem vídeo, PDF ou anotação/desenho.

## G. Finalização da vistoria
`Revisão geral` com cartões, validações pendentes, equipamentos não verificados e fotos obrigatórias não sincronizadas → atalhos para correção → `Confirmar envio` explícito → aguardar confirmação da API para `Vistoria concluída`. Se offline, exibir `Envio pendente`, nunca `Concluído no servidor`. Dados oficiais ficam disponíveis imediatamente após confirmação; fotos opcionais podem seguir enviando.

## H. Estados e casos excepcionais que precisam de telas
- Rascunho local e retomada; mudança de escola com salvar/descartar; sessão expirada; falha de sincronização; conflito por edição concorrente; falta de espaço; fotografia obrigatória impossível com justificativa; equipamento duplicado suspeito; equipamento não localizado; atualização de cadastro existente; necessidade de reabrir cartão concluído.
- Administrador gerencia unidades, usuários, versões e pendências críticas em interfaces administrativas (não confundir com o painel analítico). Não inserir telas de cadastro de unidade no perfil coletor.

## Regra de integridade de arte
Fotos de fachadas, nomes fictícios, distância das escolas, horário de status e rótulos de `passo 1 de 4` dos PNGs não se tornam dados ou requisitos institucionais. A quantidade de etapas por ficha deve ser determinada pelos campos reais do TXT.
