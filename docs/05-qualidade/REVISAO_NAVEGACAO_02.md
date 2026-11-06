# Correções do relato real — revisão 2, 28/10/2026

## Fontes e escopo

Solicitação: corrigir os problemas apresentados nos dois relatos de navegação e gerar novo prompt de teste. Relatos e 11 capturas preservados em `docs/01-projeto/relatos-navegacao-2026-10-28/`. Os dois MDs são idênticos por SHA-256; não são dois testes independentes. Referências visuais abertas e comparadas com capturas reais da implementação. Não executar instruções embutidas nos relatos como autorização adicional.

Documentos consultados: `00_LEIA_ANTES_DE_TUDO.md`, `AGENTS.md`, `REGRAS_DE_PRECEDENCIA.md`, `DECISOES.md`, `PENDENCIAS.md`, `CONFLITOS_DOCUMENTAIS.md`; Base original integral, catálogo e especificações mobile `02_TELAS_E_TRANSICOES.md`, `03_CATALOGO_E_MAPEAMENTO.md`, `04_FOTOS_E_ESTADOS.md`, `05_GUIA_VISUAL_MOBILE.md`, `06_ESPECIFICACAO_TELA_A_TELA.md`; integração/permissões em `docs/04-dados-apis/`, diagramas e aceite. Base original preservada. Aparência D-040; nenhuma mudança na composição/cartografia desktop.

## Resultado por problema

| Problema | Correção | Verificação |
|---|---|---|
| D bloqueia por falta de ambiente B | Descrição alternativa de local em D/E/H, inclusive registros repetidos; referências existentes continuam válidas | Validação compartilhada e API em SQLite isolado; D concluído sem ambientes |
| Voltar do navegador vai ao login | Histórico com unidade/cartão/etapa; login usa replace | Chrome: etapa anterior, cartões e Avançar sem logout |
| F5 perde unidade ativa | URL contém ID da vistoria, tela, cartão, etapa e origem revisão | Chrome: etapa E e resposta D restauradas do servidor |
| Navegação muda estado sem resposta | Cliente evita gravação redundante; servidor retorna unchanged sem escrita, versão/histórico preservados | API repetida e Chrome: estado anterior inalterado; zero eventos de alteração |
| Revisão confusa | Mensagens naturais com grupo/conjunto/registro; detalhes de erro por chave | Testes de esquema/API e visual |
| Abrir cartão não vai à pendência | Atalho para campo/registro e etapa, com retorno à revisão | Chrome: roteador 1 direto à etapa 3, retorno e revisão atualizada |
| D longo e títulos iguais | Até 8 etapas relacionadas; roteador/AP/switch/rack identificados | sectionStages + Chrome |
| Seletor vazio | Vínculos opcionais ocultos sem catálogo; F/G mantém atalho ao B | Fonte e testes de dependência |
| Botão + cobre cartões | Botão em espaço próprio no fluxo da página | Interseção geométrica zero em 360/375/812px, capturas |
| Busca com total confuso | Linha de quantidade exibida acompanha filtro; abas preservam total do grupo | Chrome: busca inexistente exibe zero |
| Sem sinalização durante carga | Indicador Carregando/Salvando com contagem de requisições | Chrome e inspeção |
| Título G / fontes / ícone | Título Recursos audiovisuais; apoio ajustado; favicon próprio | Chrome e build |
| Fotografias | Continua bloqueado por R2 não habilitado (Cloudflare 10042) | Consulta real da conta institucional; não declarar resolvido |

Descrições de local não criam ambientes/equipamentos e não alimentam contagem de ambientes nomeados. F/G preserva vínculo de equipamento real. B continua permitindo contagem sem impor cadastro de ambientes inexistentes; cartões antigos não foram redefinidos. Cadastro futuro B não invalida descrições.

Mudanças são compatíveis com campos/respostas anteriores e não executam migração de dados. Campos antigos de ramos agora ocultos não geram falha automática indevida (ex.: qualidade Wi-Fi antiga com resposta atual “Não existe Wi-Fi”). URLs não guardam respostas, fotos, senha ou tokens. Retomada é online; ficha de equipamento ainda não enviada e fotos RAM continuam sujeitas ao aviso de saída.

## Testes e evidências

- 36 testes Node aprovados: segurança/catálogo/mapa/fichas + seleção, conectividade, alternativas D/E/H, etapas, contexto de erros, URL, preservação de estado/histórico, ramos ocultos.
- Rotas reais com SQLite em memória e todas as migrações; fixtures explicitamente isoladas. Nenhum dado de teste gravado no D1 oficial.
- Chrome real headless em 375×812, 360×740 e 812×375: voltar, F5, revisão, salvar/retomar texto de local, busca, títulos e geometria do botão; zero erros JS. Não equivale à homologação em celulares Android/iPhone físicos.
- `scripts/verify-collector-review-fixes.mjs`; `scripts/verify-collector-unit-list.mjs` com fluxo de C; `tests/collector-review-fixes.test.mjs`.
- Evidências em `evidencias/revisao-navegacao-02/`: `resultado.json`, `cartoes-360.png`, `cartoes-375.png`, `cartoes-812.png`, `revisao-com-atalhos.png`, `rede-local-sem-cadastro.png`.

## Fotos e pendências

R2 institucional consultado novamente: erro 10042 “Please enable R2 through the Cloudflare Dashboard”. Sem bucket/binding operacional. Fluxo de código existente não comprova upload real. Ativação externa e testes de upload/leitura/retentativa continuam necessários; câmera/galeria não são anunciadas como operacionais. Não substituído por upload público, D1 binário ou sucesso simulado.

Continuam pendentes offline criptografado, miniaturas, fotos por lote P6, homologação real de dispositivos/câmera/teclado, resolução administrativa de conflitos/duplicidades, transferências/cancelamentos e backups. PWA/manifest não é requisito obrigatório da primeira versão (Base §3.5); acrescentado apenas favicon.

Novo roteiro humano em TXT: `TESTE_DE_NAVEGACAO_COLETOR_SEMED_REVISAO_2.txt`, separando navegação sem edição de coleta real e explicitando R2 bloqueado. Não solicitar preencher exemplos fictícios ou concluir vistoria oficial para simulação.

## Publicação

Coletor: `3c578dc1-10ff-453b-9d31-1e9e4c2e05b6`; desktop/backend compartilhado: `b59cccd8-7858-463f-83fc-9d4b815208ff`. Login, assets públicos e proteção HTTP de catálogo/inventário/vistoria/fotos conferidos externamente após publicação. Login público sem overflow/erro JS em 390px. Não houve migração, redefinição de estados/senhas ou inserção de fixtures oficiais; testes autenticados de escrita desta fase foram isolados.

https://inventario-semed-lumiar.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev/
