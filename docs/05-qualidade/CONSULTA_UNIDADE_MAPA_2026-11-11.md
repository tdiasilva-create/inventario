# D-095 — dados escolares no mapa e destino do clique

Pedido direto do responsável, 11/11/2026: ao passar o mouse, mostrar nome, número de alunos e vagas disponíveis; ao clicar, abrir Unidades na escola selecionada, exceto quando houver demanda aberta, que deve levar à Central filtrada pela unidade. O responsável também confirmou que o anel D-094 publicado está funcionando.

## Fontes, escopo e aceite

Consultados: 00_LEIA_ANTES_DE_TUDO.md, AGENTS.md, REGRAS_DE_PRECEDENCIA.md, DECISOES.md, PENDENCIAS.md, CONFLITOS_DOCUMENTAIS.md, MANIFESTO_REFERENCIAS.md, 04_ESPECIFICACAO_SETORES.md, NOTIFICACOES_E_LOG.md, CADASTRO_ESCOLAS_2026-11-10.md e DEMANDAS_MAPA_2026-11-11.md. Os cinco PNGs desktop já examinados nesta conversa são referências históricas de composição; a identidade D-065/D-080 e as cores D-087 permanecem.

Arquivos alterados: web/desktop-map.js, desktop.js, unit-map-palette.js, painel.css, regressões e documentação. Nenhuma mudança no servidor, esquema, API, banco, perguntas, coletor, agente, QR ou Drive. A Base de Coleta original permanece intacta. Fases 4/5 e decisões ainda pendentes não integram esta entrega.

- Nome/tipo, Alunos e Vagas disponíveis em linhas legíveis no hover dos pontos e dos anéis. Os valores vêm de students_total e seats_available do cadastro mestre já recebido em /api/units; não são inferidos de quantidade de máquinas, etapas escolares ou texto do nome.
- Zero cadastrado aparece como 0; vazio/nulo aparece como Não informado. Formatação numérica pt-BR. Texto inserido por textContent, sem interpretar nomes como HTML.
- Sem demanda aberta: abre /unidade?id=ID, detalhe existente dentro da aba Unidades, com destaque do menu, nome, dados e seleção preservados na recarga. Não abre outra escola nem apenas seleciona o bloco inferior do Panorama.
- Com demanda não concluída: abre /demandas?unidade=ID, filtro de pendentes, inclusive se há simultaneamente alerta de hardware. Usa a última leitura compartilhada de 15 segundos; erro continua explícito, sem fabricar zero.
- A mesma regra vale para ponto, centro de hardware, anel, teclado e escolha entre unidades sobrepostas, no Panorama e Mapa da Rede. D-095 supera o destino anterior de hardware no mapa; o sino mantém o modal de antes/depois e suas decisões. Anéis, cores, localização e histórico não mudam.
- Não há consulta adicional por hover, migração, escrita de teste ou cadastro fictício em produção.

## Testes e evidências

Cinco roteiros de navegador com Worker real e SQLite isolado aprovados:

1. map-demands-browser: tooltip com 1.234 alunos/0 vagas, zero/nulo, dimensões visíveis, Unidade selecionada e recarga, demanda com prioridade sobre hardware, hardware sem demanda abrindo unidade, sino funcional, anel/zoom, conclusão/reabertura, erro/retomada, visualizador e 390 px. Zero escritas HTTP e zero erros JavaScript neste roteiro.
2. panel-usability-browser: unidades sobrepostas (duas e onze), ponto isolado, teclado, Esc, URL/recarga, histórico e menus; zero escritas.
3. panorama-map-browser: ampliação, restauração, roda, sobreposição, atualizações, outra página de mapa e larguras móveis.
4. hardware-review-browser: comparativo pelo sino, decisão idempotente após perda de resposta, histórico encaminhado, Central filtrada, aceite, visualizador e tela pequena. Escritas exclusivamente na fixture SQLite de teste.
5. agent-monitoring-browser: sino, comparativo, perda de comunicação no log, retorno e histórico, decisão e perfis.

Capturas do roteiro ampliado em docs/05-qualidade/evidencias/demandas-mapa-2026-11-11/: hover-alunos-vagas.png, unidade-selecionada.png e resultado.json, rotuladas TESTE LOCAL. Hover conferido visualmente; largura explícita por conteúdo evita a compressão do tooltip numa coluna estreita. Build desktop e dry-run aprovados.

## Publicação

Publicação do painel sob autorização contínua da sessão. Versão anterior para rollback: 00c07426-6655-4240-9c68-b77ce69016d6. Coletor preservado em 91ba6200-d080-4026-8e92-7042bd67f86e. Registrar versão/horário e verificação HTTP após a implantação. Na aba disponível ao agente, o acesso ao Panorama voltou ao login; não declarar conferência visual autenticada de produção sem sessão.
