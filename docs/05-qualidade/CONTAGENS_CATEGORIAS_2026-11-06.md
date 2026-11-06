# Panorama: contagens por categoria — D-066

## Pedido e fontes

Substituir o indicador geral de unidades por contagens separadas, mantendo escolas distintas de unidades administrativas. As categorias são as já presentes no cadastro; o número 69 informado pelo responsável não é gravado nem usado como constante.

Consultados `00_LEIA_ANTES_DE_TUDO.md`, `AGENTS.md`, `REGRAS_DE_PRECEDENCIA.md`, `DECISOES.md`, `PENDENCIAS.md`, `CONFLITOS_DOCUMENTAIS.md`, manifesto e referências desktop já abertas nesta conversa, documentos de `docs/03-painel-desktop/`, `ACEITE.md`, `web/unit-schema.js` e consulta existente em `server/units.mjs`. D-065 mantém a identidade atual; D-066 supera apenas o indicador total do Panorama.

## Implementação e aceite

- `web/desktop.js`: escolas municipais, escolas conveniadas, núcleos Educa Paço, núcleos tecnológicos e unidades administrativas em contagens independentes. Tipos desconhecidos/ausentes aparecem em “Sem classificação”. Nunca inferir a categoria pelo nome.
- Consulta autenticada existente `/api/units`, somente unidades ativas, com os mesmos filtros do Panorama. Zero significa categoria sem correspondências; falha de consulta usa “—” e aviso de indisponibilidade.
- `web/desktop-theme.css`: faixa compacta de categorias, adaptação para telas estreitas e quatro indicadores de inventário preservados. Mapa, equipamentos, ambientes e fotos não mudam de regra.
- `tests/desktop-identity-browser.cjs`: alteração em base SQLite isolada para provar que um novo prédio administrativo aumenta somente o contador administrativo. Também cobre escolas municipais/conveniadas separadas, exclusão de inativas na consulta, núcleos sem registros, filtros de regional/tipo, busca sem resultado, categoria ausente e erro HTTP sem falso zero.

Nenhuma alteração no Worker, migração, recadastro, pergunta do coletor, permissão ou persistência. Não foram criados dados de teste na produção. A Base de Coleta original e seus requisitos permanecem inalterados.

## Resultados e publicação

- Build desktop aprovado (63 arquivos), validação de sintaxe e links documentais aprovadas.
- Teste de navegador aprovado nas 17 rotas, incluindo todos os cenários de contagem acima, formulários, fotos contextuais e adaptação a 390 px. Zero erros JavaScript. O ensaio detectou e permitiu corrigir quebra de texto dos indicadores em tela estreita antes da publicação.
- Capturas reais da implementação isolada revisadas: `categorias-apos-administrativa.png`, `categorias-filtro-administrativa.png` e `mobile-panorama.png` em `docs/05-qualidade/evidencias/categorias-unidades-2026-11-06/`. Dados identificados como TESTE ISOLADO; evidências privadas fora do Git público.
- Consulta agregada, somente leitura, ao D1 real em 06/11/2026 confirmou **69 escolas municipais ativas** e nenhum registro nas demais categorias naquele momento. Retorno: `rows_written=0`, `changed_db=false`. Não houve export de cadastros individuais nem alteração de registros.

**Publicação pendente por indisponibilidade externa, 06/11/2026 às 06:27 (Fortaleza).** Três tentativas de `wrangler deploy --config wrangler.jsonc` falharam antes do envio: HTTP 503, `no healthy upstream`, em `GET /workers/services/painel-semed-paco`. Sondas diretas de leitura ao serviço e à lista de deployments também retornaram 503. Não modificar credenciais ou dados para contornar indisponibilidade da API.

O painel público continua acessível: 46 sondas HTTP da versão existente aprovadas durante a falha da API de gerenciamento. **Isso não comprova publicação da nova contagem.** Última versão confirmada antes das tentativas: painel `fb776adf-4b7b-4cac-8aa9-6923bd636144`; coletor preservado em `5cf137cd-9c34-4e41-806b-d19cf0887bb6`. Snapshot privado prévio preservado; nenhum upload de release ou alteração do banco ocorreu nas tentativas recusadas.

Para concluir quando a API recuperar: conferir deployments e ausência de alterações concorrentes; `pnpm build:desktop`, `wrangler deploy --config wrangler.jsonc`; conferir versão/tráfego, tema servido e proteção pública com `scripts/verify-panel-release.mjs`. Registrar o identificador real aqui e em `docs/07-operacao/02_AMBIENTES_E_CONFIGURACAO.md`. Não anunciar D-066 como disponível em produção até essa verificação.
