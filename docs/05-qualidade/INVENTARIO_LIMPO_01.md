# Inventário limpo — 28/10/2026

Decisão D-032. Publicado no Worker existente, versão `2860cff0-2b6e-43b8-8813-e9a03b7677bd`.

Fontes consultadas: `00_LEIA_ANTES_DE_TUDO.md`, `AGENTS.md`, `REGRAS_DE_PRECEDENCIA.md`, `DECISOES.md`, implementação e relatórios existentes de desktop/autenticação. Mudança restrita ao desktop em produção e à composição de sua distribuição; coleta mobile isolada não foi publicada nem alterada.

Removidos do runtime: dez escolas fictícias, suas contagens, cinco totais de mockup e taxas, zonas ilustrativas, alertas/contagens de notificações, ambientes e datas inventadas, galeria e evidências fotográficas extraídas do mockup. Arrays de exemplos vazios; não há opção “Restaurar demonstração”. Removidas as cópias de imagens de exemplo de `web/assets/`; imagem documental original permanece em `design/` e evidências históricas permanecem em `docs/`, fora da distribuição pública. A paisagem de login aprovada continua como decoração, não evidência de inventário.

Preservados: usuários/permissões, credenciais, sessões/auditoria, identidade visual, cartografia e contorno V33 e os quatro locais institucionais reais da planilha. Esses locais continuam separados do catálogo e das métricas. Indicadores mostram “— / Sem dados recebidos”, pois não há integração oficial que comprove totais de rede.

D1: consulta somente leitura listou users, sessions, settings, attempts, audit e tabelas internas/migrações. Não há tabelas de inventário; não foi feito DELETE nem alteração de dados de acesso. Uma consulta inicialmente retornou erro 7403, mas nova consulta funcionou e a publicação concluiu normalmente.

Testes: `node scripts/verify-clean-inventory.mjs` PASS no servidor local porta 4184; arrays vazios, cinco indicadores sem valores fictícios, matriz/galeria vazias, ausência de badges e restauração, quatro locais de referência e navegação por oito áreas sem erros JavaScript. Captura real local: `evidencias/inventario-limpo/painel.png`. Resultado: `resultado.json` ao lado. Build confirmado sem ativo `assets/referencia-visual.png`. Publicação concluída; `verify-panel-release.mjs` PASS nas 23 verificações públicas de rotas/controle de acesso. Não houve nova troca de senha ou teste completo de login com credenciais do responsável nesta limpeza.

TXT: reforça §§0–1 e integridade de indicadores sem coletas oficialmente recebidas (§7.5); não implementa novos campos A–H, recebimento, fotos R2, offline, histórico de inventário ou backup. Autenticação real permanece como entregue anteriormente. Limpeza de exemplos não significa que a integração de dados oficiais já esteja pronta.

## Complemento D-033 — limpeza total dos locais, 28/10/2026

Após esclarecimento do responsável, removidos também os quatro locais institucionais anteriormente preservados. Fonte runtime `web/data/map-examples.json` contém `records: []` e não possui nomes, códigos, coordenadas ou URL de importação. Não há importação automática da planilha. A camada/botão Locais foi removida da interface; mapa mantém apenas cartografia e contorno. Atualizados testes `tests/map-examples.test.mjs` e `scripts/verify-clean-inventory.mjs`: 5 testes de geografia/arquivo aprovados, navegador confirmou zero marcadores e todas as áreas navegáveis. Captura local e resultado em `evidencias/inventario-limpo/`. Usuários/sessões/auditoria e documentos históricos preservados; não foram removidos dados de segurança. Não houve nova implementação de requisitos TXT ou integração de inventário.

Publicação complementar concluída: versão `a4842d06-edc4-4f18-b4a5-f0fe14665d91`. Verificação pública das 23 rotas/controle de acesso aprovada após publicação. Zero unidades no arquivo de locais e zero marcadores na captura/teste local da implementação.
