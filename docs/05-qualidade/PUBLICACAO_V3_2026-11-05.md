# Questionário V3 — publicação de 05/11/2026

Publicado nos dois ambientes reais, conforme autorização explícita do responsável e D-057.

- Coletor: https://inventario-semed-lumiar.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev/
- Painel: https://painel-semed-paco.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev/
- Worker coletor: `8abc4518-28e1-41e6-b354-46d225fc00a9`.
- Worker painel: `c5021bba-395c-4bfe-aaea-1991c0998e95`.
- Migração real: `0015_questionario_v3.sql`, 13 comandos, confirmada no D1.
- Backup anterior: `backups/pre-v3-2026-11-05.sql`, 563220 bytes, fora do repositório e dos assets.
- D1 antes/depois: 71 unidades, 7 usuários, 8 visitas, 8 equipamentos e 6 fotos; sem diferenças nessas contagens. Nova tabela de diversos vazia. Nenhum teste fictício inserido em produção.
- Drive institucional, segredos e contas preservados; nenhuma autorização OAuth refeita.

## Escopo e fontes consultadas

`00_LEIA_ANTES_DE_TUDO.md`, `AGENTS.md`, `docs/00-governanca/REGRAS_DE_PRECEDENCIA.md`, `DECISOES.md`, `PENDENCIAS.md`, `CONFLITOS_DOCUMENTAIS.md`; Base `docs/02-coleta-mobile/BASE_DE_COLETA_V1_0_ORIGINAL.txt` integral; `02_TELAS_E_TRANSICOES.md`, `03_CATALOGO_E_MAPEAMENTO.md`, `04_FOTOS_E_ESTADOS.md`, `05_GUIA_VISUAL_MOBILE.md`, `06_ESPECIFICACAO_TELA_A_TELA.md`; manifesto e imagens aprovadas mobile/desktop; guia visual de coleta de 28/10; documentação de dados/APIs, contrato QR, integração Drive e diagramas DOT de dados/permissões; aceite e testes prioritários de qualidade. Fonte nova: `Coletor-SEMED-mudancas-questionario-V3.docx` integral, com as nove decisões explícitas registradas em D-057. Documento preservado e texto extraído em `revisoes/questionario-v3-2026-11-05/`.

Cobertura da Base original: escolha da unidade oficial; continuidade entre operadores; ID permanente; histórico/autoria; acesso livre entre assuntos; conclusão e reabertura manuais; distinção entre rascunho recebido e publicação oficial; fotografias vinculadas; permissões no servidor e prevenção de sobrescrita concorrente. D-057 supera perguntas/ordem e seleção obrigatória de ambiente no novo roteiro, sem reescrever a Base. D-045 mantém dados parciais no desktop. As perguntas retiradas permanecem nos registros históricos, sem serem exigidas novamente na V3.

Arquivos principais: `web/collector-v3.html/js/css`, `collector-v3-schema.js`, `collector-drafts.js`, `collector.js`, `desktop-inventory.js`, `desktop-progress.js`, `desktop-results.js`; `server/collector-v3.mjs`, `collector.mjs`, `in-progress.mjs`, `in-progress-photos.mjs`, `inventory-results.mjs`, `unit-deletion.mjs`, `worker.mjs`, `agentes/catalogo.mjs`, `agentes/nucleo/worker.mjs`; migração 0015; scripts de build; testes V3 e configuração de testes.

## Verificações executadas

- Suíte de 87 testes: todos passaram. Inclui legado, V2, V3, autenticação, permissões, fotos, QR, exclusão root, consulta parcial/oficial e importação/INEP.
- Sete testes V3: decisões aprovadas, assinatura/recibos/travas QR, ambiente simultâneo normalizado, edição de diversos legados, diverso novo sem ambiente, fotografias e contagem parcial, conclusão/revisita, fila e perda de resposta.
- Navegador Edge headless contra Worker real e SQLite isolado: seleção → fachada → assuntos → QR assinado simulado → fotos nos cinco contextos → conclusão → apresentação desktop. Sem erros JavaScript. Teste usa armazenamento de imagem isolado, não o Drive real.
- Retorno às categorias com salvamento artificialmente atrasado 2400 ms: 232 ms na execução final; resposta preservada no assunto correto. É medida local, não promessa de latência no celular real.
- Viewports 390×844 e 812×375; sem transbordamento horizontal no cenário testado. Capturas reais em `evidencias/coleta-v3-2026-11-05/01-assuntos-390.png` até `07-painel-v3.png`. Imagens brancas nas fichas são o PNG minúsculo de teste. `falha.png` é captura histórica de uma tentativa anterior de configuração do teste, não resultado final.
- Builds: coletor 31 arquivos, painel 46; dry-run Wrangler aprovado para ambos. Publicação dos dois Workers concluída; logs em `revisoes/questionario-v3-2026-11-05/`.
- Verificação HTTP online: logins 200, páginas protegidas redirecionam ao login, API sem sessão retorna 401. Isso verifica disponibilidade/proteção; isoladamente não comprova questionário ou migração. A migração foi verificada separadamente no D1 e o deploy pelos IDs acima.
- A sessão do navegador existente não pôde ser automatizada nesta entrega (`browser.user is unavailable`); nenhuma senha/sessão foi criada para contornar isso. Teste autenticado real, câmera física e novo envio ao Drive devem ser conferidos pelo usuário no roteiro TXT.

## Limites e próximos testes

Não há offline durável: respostas pendentes e prévias são da memória da aba. O usuário recebe aviso ao fechar e estado de recebimento somente depois da confirmação. Câmera/galeria físicas e permissão em Chrome Android/Safari iPhone ainda exigem teste; QR de teste no navegador não homologa o EXE. A falha de instalação GRANT_USED não foi alterada por este trabalho. Sem mudanças em heartbeat, alertas de hardware ou distribuição assinada. Teste manual: `TESTE_COLETOR_V3_2026-11-05.txt`.

Visitas antigas não são convertidas automaticamente. Voltar à lista e selecionar uma unidade inicia/retoma V3; se existir rascunho anterior, a interface pede confirmação para preservá-lo e iniciar V3. Cancelar continua a versão original. Não confundir URL antiga de V2 com versão publicada nova.
