# Busca unificada de unidades e equipamentos — D-084

O responsável escolheu a opção 2: usar a busca do cabeçalho para consultar unidades e equipamentos em toda a rede, com resultados separados. Substitui o destino restrito a Unidades de D-082 (LOG-04) e resolve a extensão LOG-10/LNA-12.

## Uso

Digite pelo menos dois caracteres no cabeçalho e pressione Enter ou a lupa. A rota `/busca?q=...` apresenta dois grupos, Unidades e Equipamentos. Funciona no Panorama, páginas operacionais e administrativas; atalho `/` preservado. O cabeçalho também oferece a busca em telas pequenas. O filtro anterior de unidades continua na seção Filtros do painel, separado da busca global.

- Unidades: nome, INEP e gestor. Abre o detalhe da unidade pelo ID.
- Equipamentos: nome corrigido no painel, hostname de agente atualmente vinculado, ID permanente, categoria, ambiente, posição, patrimônio/série existentes, marca/modelo, AnyDesk e RustDesk. Fabricante/modelo/série reportados pelo agente também são pesquisáveis. Não coleta novos campos nem inicia acesso remoto.
- Resultados mostram unidade, ambiente, nome/hostname, ID e vínculo/cadastro. Fichas alteradas ou ainda não publicadas recebem PARCIAL. ID remoto preserva zeros iniciais; espaços, pontos e hífens opcionais na consulta numérica.
- Clique abre a ficha existente, fotos protegidas do mesmo ID/unidade e dados técnicos atuais do agente. Voltar aos resultados mantém a consulta. Edição de nome e exclusão continuam exclusivas do root e usam os fluxos existentes de confirmação, histórico e versão.
- Consulta manual, sem requisição a cada tecla ou novo polling. Atualizar resultados repete a busca; página, erro recuperável e volta/avanço do navegador são tratados. A lista representa o momento da consulta, não um painel com atualização automática de resultados.

## Escopo dos dados

Apenas unidades ativas dentro do escopo D-068 e equipamentos ainda presentes no cadastro ativo. Cadastros apagados/inativos e histórico de visitas não são resultados adicionais. Uma ficha aparece uma vez por ID, mesmo com revisitas. Não funde duplicidades nem altera contagens físicas/lotes (LOG-08 continua pendente). O total da busca é explicitamente de fichas.

Usa `data_json` já confirmado no servidor. `published_json` nulo ou diferente identifica PARCIAL. Isso não publica visitas nem modifica indicadores; a matriz e suas consultas permanecem no escopo publicado por padrão. Telemetria pertence ao vínculo atual; hostname de instalação com vínculo encerrado não localiza a ficha antiga.

Na ficha aberta pela busca, fotografias `ready` de visitas abertas/pausadas são incluídas e rotuladas PARCIAL; as de visitas concluídas mantêm elegibilidade oficial. Fotos continuam autenticadas e vinculadas ao ID/unidade; nenhuma URL privada, credencial, imagem original ou arquivo é enviado na lista de resultados.

## Contratos e arquivos

| Contrato | Comportamento |
|---|---|
| `GET /api/inventory/search?q=...&unitOffset=0&equipmentOffset=0` | Root/admin/visualizador, somente painel. `q` de 2–120 caracteres; offsets inteiros não negativos. Busca literal, sem diferenciar caixa/acentos portugueses. Retorna grupos `units` (20 por página) e `equipment` (30), cada um com total/offset/pageSize/nextOffset, mais source/current e hora do servidor. |
| `GET /api/inventory/equipment?unitId=...&scope=current` | Extensão explícita para abrir fichas atuais na busca, com `record_partial`; filtros/paginação existentes. Omissão de scope continua `published`, preservando D-069. |
| `GET /api/inventory/photos?unitId=...&equipmentId=...&scope=all` | Serviço existente, chamado somente ao abrir a ficha na busca. Matriz continua `scope=published`. |

Implementação: `server/panel-search.mjs`, `server/inventory-equipment.mjs`, rota em `server/worker.mjs`, `web/panel-search.html`, `web/panel-search.js`, `web/panel-shell.js`, `web/desktop.js`, `web/desktop-equipment.js`, `web/painel.css` e build desktop. Sem migração, segredo novo, alteração de dados, coletor, protocolo de agente ou armazenamento.

Busca por trecho literal, não busca semântica/fuzzy ou palavras independentes em ordem variável. Valores não cadastrados não podem ser encontrados. Não aplica silenciosamente filtros do Panorama à rede toda. [Aceites e publicação](../05-qualidade/BUSCA_GLOBAL_2026-11-10.md).
