# Revisão do painel — 28/10/2026

Publicado: versão `2a3f8c95-b4f8-4805-8a52-9f4822d76c67`.
https://painel-semed-paco.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev/login

## Fonte e precedência

Pedido integral preservado: `docs/01-projeto/REVISAO_DO_RESPONSAVEL_2026-10-28.txt`. D-037 supera D-036 (quatro campos e remoção de atribuições/segurança). Mantida D-035, com escrita e criação de contas exclusivas do root. Documentos consultados nesta fase e continuidade: `00_LEIA_ANTES_DE_TUDO.md`, `AGENTS.md`, `REGRAS_DE_PRECEDENCIA.md`, `DECISOES.md`, `PENDENCIAS.md`, `CONFLITOS_DOCUMENTAIS.md`, `RASTREABILIDADE.md`, `ACEITE.md`, `02_CASOS_DE_TESTE_PRIORITARIOS.md`, `GUIA_DE_ACESSO_PUBLICADO.md`, `ADMINISTRACAO_ROOT_01.md` e `CADASTRO_SIMPLIFICADO_01.md`. A Base original e as referências visuais já examinadas nas fases anteriores permanecem preservadas; esta revisão não reimplementa a coleta mobile.

## Entrega por item

| Revisão | Resultado |
|---|---|
| 1.1–1.6 | Rotas reais, histórico, reload, shell comum, trilha/voltar, avatar único, menu agrupado com Panorama primeiro. |
| 2.1–2.2 | Campos completos, tipo/INEP, duplicidade, faixa e vírgula/ponto, mini-mapa clicável, erro por campo no navegador e servidor. |
| 2.3 | Modelos CSV/XLSX, prévia sem escrita, erros por linha, confirmação atômica e repetição idempotente. |
| 2.4–2.6 | Tabela, busca, tipo/polo, ordenação, paginação, editar/inativar; páginas de atribuições e segurança; botões alinhados. |
| 3.1–3.5 | Nomes humanos dos perfis, tabela de contas/último acesso, ações com confirmação, autoproteção root, sessões com navegador/dispositivo. |
| 4.1–4.6 | Zero/aguardando, estado cinza, unidade/galeria alinhadas, matriz rolável e legível, margens e altura responsiva. |
| 5.1–5.3 | Referências técnicas só no Sobre root, versão/data, título único do mapa, camadas no alto, escala inicial 3 km preservada. |
| 5.4–5.8 | Unidade por nome/INEP em Ambientes, exportação CSV/XLSX do cadastro, indisponibilidade explícita dos outros conjuntos, estados vazios orientados, Ano oculto e busca curta. |
| 6.1–6.3 | Administração no painel escuro, foto só no login, tabelas com rolagem própria, formulário de uma coluna/menu recolhível no celular. |

Não houve medição automatizada de todos os contrastes WCAG AA; legibilidade e tons de texto foram revisados visualmente, sem alegar certificação de acessibilidade. Navegador/dispositivo vem do User-Agent e é informativo; sessões antigas sem esse dado mostram Dispositivo não informado. Último acesso anterior à migração não é inferido.

## Testes e capturas

- 11 testes Node aprovados: validação, coordenadas, geografia sem exemplos, hashes/permissões e política de senha.
- `scripts/verify-review.mjs`: 15 rotas, F5/Voltar/Avançar, APIs/permissões, edição/reload, duplicidade, paginação, modelos/downloads, importação CSV/XLSX, prévia sem escrita, confirmação/repetição, atribuições e proteção root. PASS.
- `scripts/verify-review-account.mjs`: confirmações com nome e cancelamento, menu, logout real e primeiro acesso/troca obrigatória. PASS.
- `scripts/verify-review-visual.mjs`: 870×1372, 1672×941, 390×844, sem overflow global/erros JS; avatar, menu, mini-mapa clicável e erros nos campos. PASS. Capturas finais com catálogo vazio, em `evidencias/revisao-28/`.
- `scripts/verify-review-bulk.mjs`: 149 unidades exclusivamente de teste importadas e autorizadas em uma requisição, auditoria confirmada. PASS. Não são escolas oficiais nem foram enviadas à produção.
- Produção: `scripts/verify-panel-release.mjs`, 46 verificações públicas e de proteção de páginas/APIs. PASS.
- Consultas agregadas antes/depois: 4 usuários, 0 unidades, 0 atribuições. Após publicação: 0 lotes de importação. Senhas existentes preservadas.

Evidências principais: `evidencias/revisao-28/resultado.json`, `visual.json`, `lote149.json`, `cadastro-unidades-870.png`, `usuarios-870.png`, `menu-870.png`, `panorama-1672.png`, `erros-e-mini-mapa.png`; verificação pública em `evidencias/auth/release.json`. Capturas são reais do Worker/D1 isolados com o mesmo código da publicação, não login autenticado no banco principal. O ambiente isolado é removido após a validação.

## Dados e implementação

Migração aditiva `0005_review_catalogue.sql`: metadados de unidade, último acesso, User-Agent e lotes de prévia. Workers valida/escreve D1; nenhuma nova persistência falsa. Prévia vinculada ao root, 30 min, até 200 linhas/2 MB, sem fórmulas XLSX; CSV/XLSX processados localmente pelo navegador, ExcelJS 4.4.0 vendorizado/licença incluída. A confirmação revalida duplicidades e usa transação. Coordenadas verificam a caixa solicitada, não um limite municipal homologado. A cartografia original não foi substituída.

## Cobertura da Base de Coleta e lacunas

Cobertura parcial da Base §2.5 e §8.2–8.3: unidades previamente cadastradas, autorizações por operador e gestão de acesso. Perfis detalhados decorrem das decisões posteriores D-031/D-035. O cadastro mestre alimenta mapa e consulta, mas não conclui vistoria nem inventa métricas.

Continuam faltando integração operacional dos cartões A–H/wizard, cadastro/conferência de equipamentos com ID e histórico, estados de rascunho/sincronização/vistoria, fotos/câmera/R2, offline com conflitos e idempotência de coletas, testes Chrome Android/Safari iPhone, relatórios e planejamento completos. Os zeros desta entrega seguem o texto da revisão e significam ausência de coletas recebidas no sistema; não inventário físico zero. O número 149 informado serve apenas ao teste de volume isolado.

Limpeza concluída: Worker painel-semed-paco-validacao e D1 isolado 0bda5ec7-096b-4f0c-9ced-1f7e4c7dac9a removidos após preservar as evidências. A suíte padrão inclui agora tests/units.test.mjs: 16 testes Node aprovados no total. Ajuste final da matriz verificado em Chrome local por scripts/verify-matrix-spacing.mjs (mínimo 82 px por coluna e rolagem própria).

