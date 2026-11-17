# D128 — verificação da designação de coleta

**Estado: publicado em 17/11/2026 às 06:12:28 Fortaleza, com aprovação explícita do responsável.** Escolha funcional aprovada pelo responsável (opção 1, Central de demandas). [Contrato](../03-painel-desktop/DESIGNAR_COLETA_D128.md). Nenhuma demanda, atribuição ou notificação oficial foi criada nos testes.

Consultados entrada, precedência, decisões/pendências/conflitos, manifesto e cinco PNGs desktop na ordem, Central D071, roteiro D105, localização D114, exclusão D126 e listas D127; modelo de dados, migrações existentes e critérios de qualidade. Identidade D065/D080 preservada.

## Testes executados

- Nove testes novos de servidor com Worker real/SQLite isolado: criação transacional, aviso/fila/contadores, CSRF/perfis/escopo, elegibilidade da unidade e técnico, vínculo já existente, índice por unidade, repetição/concorrência/ACK perdido, rollback integral, conclusão/reabertura/exclusão, permissões alteradas antes da escrita e continuidade/encerramento do GPS D114.
- Navegador com Worker real e dados sintéticos: formulário, busca sem acentos, responsável exibido, abertura da demanda na Central, resposta perdida depois do commit, retry sem duplicar, ausência de técnicos, indisponibilidade, visualizador, Escape, desktop e 390 × 844.
- Teste de consumo do navegador: zero chamada a collection-tasks ao entrar no Panorama; uma ao abrir Sem agente como root e uma após criar. Digitar e avançar 61 segundos não aumentaram essa contagem. Leitura explícita por lote usa índice por unidade; demais consultas de autenticação permanecem. Não é medição de linhas da conta Cloudflare nem garantia de capacidade ilimitada no gratuito.
- Regressões de navegador D127, organização de atendimentos D105, exclusão/sinalização D126 e localização D114 aprovadas.
- Suíte geral: **369/369 testes aprovados** (84 s). Build desktop aprovado: 153 arquivos, 14 bundles; 854 links documentais verificados sem erro. O navegador D128 foi repetido após liberar imediatamente o fechamento do modal no sucesso; aprovado.
- Dry-run do Worker e revisão de diff aprovados. Controle do índice Git: 1.211 arquivos verificados sem apontamentos. Branch `codex/designar-coleta-d128`, commit funcional `9b2eafa`. Essas verificações precederam a publicação; nenhuma escrita de teste em dados oficiais.

## Evidências e comparação visual

Capturas em `evidencias/designar-coleta-d128-2026-11-17/`: formulário desktop, responsável na lista, lista e formulário em 390 px. Todas mostram TESTE LOCAL e dados fictícios. Modais seguem branco/preto/laranja, com botões legíveis, busca e retorno; não cobrem as ações em viewport estreita. Não representam produção. Este ajuste é uma extensão dos modais D127, sem redesenho do mapa.

## Liberação e reversão

Publicação autorizada expressamente pela resposta “Sim, publicar no ambiente real”. Somente o Worker do painel foi publicado: `3aee0153-07d0-43d1-8998-83458594c30b`, confirmado em 100% do tráfego às 06:12:28 Fortaleza. Sem migração de banco, instalação de APK ou alteração do coletor. Base de produção D127: `a816fd06-05e1-491b-bc3d-8deed5f2745f`. Retorno a essa versão remove os atalhos D128; demandas já criadas continuam na Central com histórico e atribuições. A versão antiga não aplica a proteção especial contra reabertura duplicada; avaliar antes de reabrir designações após rollback.

## Roteiro após publicação

1. Como root, abrir Panorama → Sem agente vinculado, pesquisar unidade e abrir Designar coleta.
2. Conferir nome, técnicos e orientação; fechar sem salvar durante inspeção de produção.
3. Em uso real autorizado pelo root, confirmar uma designação e verificar responsável/atalho na lista e na Central. Nova tentativa deve abrir a mesma demanda.
4. No aplicativo do técnico, conferir aviso e fila; aceitar com localização e executar a visita. Nenhum aceite automático é feito pelo painel.
5. Vincular o agente da unidade durante o trabalho; conferir mudança de grupo, mantendo a conclusão da demanda e classificação da coleta como ações distintas.
6. Como visualizador, conferir ausência de botões de designação.

GPS físico/tela bloqueada e notificações Android continuam sujeitos aos limites de homologação já documentados; testes locais não substituem aparelho real.

## Conferência em produção

Nove verificações HTTP públicas aprovadas: login/app disponíveis; Panorama e módulos privados redirecionam ao login; APIs de designação/fila exigem autenticação. Coletor permanece `a1ff9077-58ac-4799-b733-5d88605c58da`, 100%; mesmo APK 1.0.4 e 37 migrações.

Sessão root real: lista Sem agente retornou 54 unidades naquele instante. Busca `almox` encontrou uma unidade, botão abriu o formulário e sete técnicos elegíveis foram carregados. Orientação opcional e botão Criar demanda e designar visíveis. Formulário fechado sem selecionar responsável nem salvar; foco voltou ao botão. Não houve POST de designação, aceite/GPS, notificação ou cadastro de teste em produção. A verificação de salvamento/concorrência permanece a dos testes isolados.

Captura real privada: `private-data/d128/designar-coleta-publicado.jpg`, fora do Git. Capturas públicas deste registro são sintéticas. Logs de implantação e verificações em `private-data/d128/`; não publicar dados reais junto das evidências de teste.
