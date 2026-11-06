# INEP opcional para núcleos e unidades administrativas — D-039

Publicado em 28/10/2026, versão `e408e4a3-9d69-481a-8f41-ea65851d67b5`.
https://painel-semed-paco.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev/cadastro-unidades

## Pedido e regra aprovada

Fonte: correção explícita do responsável sobre o bloqueio da SEMED administrativa, com os dados completos da unidade. Substitui a parte de D-037 que dispensava INEP apenas para núcleos. Consultados os pontos de entrada, regras de precedência, decisões/pendências/conflitos, contratos de dados/permissões e aceite; fontes visuais/arquitetura das etapas anteriores preservadas. A Base de Coleta não foi alterada.

| Tipo | INEP vazio |
|---|---|
| Escola municipal | Recusado |
| Escola conveniada | Recusado |
| Núcleo Educa Paço | NULL |
| Núcleo tecnológico | NULL |
| Unidade administrativa | NULL |

Todo código informado exige oito dígitos numéricos e permanece único. Nenhum código provisório é gerado. Ajuda: “Código INEP (8 dígitos · obrigatório para escolas)”. Erro: “Escolas municipais e conveniadas precisam do INEP de 8 dígitos.” Asterisco e required mudam ao selecionar tipo, inclusive na edição e ao limpar. Tabela mostra — e ordena vazios por último.

## Implementação

- `web/unit-schema.js`: regra única `requiresInep`, validação e comparação para ordenação.
- `server/unit-validation.mjs` reexporta a mesma validação, utilizada pelo cadastro e pela prévia/confirmação da importação em `server/units.mjs` e `server/import-units.mjs`.
- `web/admin-units.js`: texto/asterisco/required dinâmicos e ordenação com códigos vazios no fim.
- Sem migração: D1 já aceitava NULL e mantém o índice único de códigos preenchidos. Permissões, autenticação e senhas preservadas.

## Testes

22 testes Node aprovados, incluindo todos os cinco tipos sem INEP, códigos de sete dígitos/com letras em qualquer tipo, preservação de zeros iniciais e ordenação de vazios.

`scripts/verify-inep.mjs` passou no Worker/D1 isolado: validação no servidor, duplicidade com mensagem por unidade, asterisco ao trocar tipo, formulário administrativo sem INEP, edição/reset, ordem e — na lista, prévia e confirmação CSV/XLSX de administrativo/núcleo sem código, persistência NULL e marcadores com coordenadas. Nenhum erro JS.

`scripts/register-requested-semed.mjs` validado primeiro no banco isolado e depois executado na produção: utiliza a mesma função de cadastro `server/units.mjs`, com acesso técnico autenticado do Cloudflare CLI, validação, consulta de duplicidade, histórico e auditoria. Não gera sessão de aplicação nem altera senhas. Só registra a SEMED especificada no pedido; não cria outros locais citados como exemplos. Protege contra repetição e não sobrescreve registro existente.

Produção confirmada por leitura: id `879f2e1a-682b-4fed-ab56-bff57c009660`, nome SECRETARIA MUNICIPAL DE EDUCAÇÃO - SEMED, tipo Unidade administrativa, INEP NULL, ativa, latitude -2.540829/longitude -44.170534. Gestor/telefone/e-mail conferidos contra o pedido. Histórico presente, quatro usuários preservados. Geolocalização do registro validada para alimentar o mapa. 46 verificações públicas/de proteção passaram após publicação.

Evidências: `evidencias/inep-opcional/resultado.json`, `lista-sem-inep.png`, `previa-csv.png`, `previa-xlsx.png`, `mapa-isolado.png`, `semed-producao.json`, `semed-validacao.json`. As capturas de navegador são do ambiente isolado; a confirmação oficial é a leitura do registro no D1 de produção. Não alegar que houve login automatizado root no painel oficial.

## Cobertura e limites

Correção do cadastro mestre e de importação, relacionada à seleção de unidades pré-cadastradas da Base §2.5 e à gestão de acesso §8, com decisões posteriores de perfis. Nenhuma implementação adicional de wizard A–H, equipamentos, vistorias, fotos/R2 ou offline. SEMED é um cadastro oficial informado pelo responsável; não é coleta concluída ou inventário de equipamentos. Permissões e cartografia não mudaram.

Conferência visual adicional: `scripts/verify-semed-display.mjs` passou no ambiente isolado com os mesmos dados fornecidos: edição sem INEP, coluna — e marcador único ao filtrar SEMED. Capturas `semed-formulario-isolado.png` e `semed-mapa-isolado.png`. Worker e D1 isolados removidos após preservar as evidências; produção mantida.
