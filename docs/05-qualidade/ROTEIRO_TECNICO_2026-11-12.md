# D105 — implementação, testes e publicação

Autorização explícita para implementar, testar e publicar organização desktop e APK técnico. Últimas decisões: um atendimento ativo por técnico; capacidade nas contas atuais pelo root; mapas externos no app e acompanhamento apenas no desktop.

## Escopo e fontes

Governança/precedência/decisões/pendências, documentos desktop/dados/qualidade, cinco PNGs desktop e contratos de demandas consultados. Alterados: migração 0027, server/technical-dispatch.mjs e worker, web/dispatch*, web/technician*, integração desktop/mapa/Central, android/technician, build/testes. Base de Coleta e questionários preservados.

## Evidências locais

- 223 testes existentes aprovados e 7 novos de servidor D105 aprovados: 230 no conjunto.
- Navegação isolada: arraste persistido/recarregar; dois técnicos; GPS negado impede aceite, GPS simulado aceita; interface exclusiva; observação/impedimento; Maps; tracejado root; conclusão retira posição; histórico; 390px sem transbordamento.
- Regressões navegadas demand-save-browser, map-demands-browser, panorama-map-browser, panel-performance-round2-browser aprovadas.
- Builds painel e coletor aprovados; coletor construído para compatibilidade, não publicado nesta entrega.
- APK compilado, apksigner v2/v3 verificado; manifesto privado guarda hash/certificado. Nenhum aparelho físico homologado.
- Screenshots locais isoladas: evidencias/roteiro-tecnico-2026-11-12/01-organizacao-root.png a 05-concluido.png. Dados sintéticos rotulados, nunca gravados no oficial. Captura estabilizada sem animação de menu sobre o conteúdo.

Casos de servidor: root exclusivo; capacidade individual; operador sem gerência; até dois distintos; GPS ausente/antigo/inválido; uma ativa; revisão/concorrência; recibo após ACK perdido; colega conclui; remoção/desabilitação/logout/conclusão desktop removem posição; sessão diferente, mensagens antigas e expiração; falha de auditoria reverte transação; CSRF e coletor recusam operações.

## Publicação e retorno

Detalhes remotos serão registrados após execução. Base anterior painel b2f9ae76-0ddc-4080-bbf1-8f74a1191cb2. Coletor a preservar 2dac8571-2671-4eec-8ab0-7492753a0255. Migração aditiva, sem seeds nem atribuições/posições de teste em produção.

Rollback: retornar código mantendo tabelas/histórico 0027. Não restaurar dump por cima de novas escritas. Com código anterior, app técnico fica indisponível e serviço para após falhas; não mostrar acompanhamento fictício. Retomar somente versão compatível, sessão/atribuição conferidas.

## Limites

Última posição durante atendimento, sem trilha permanente. Tracejado é sequência, não vias. Avisos Android em segundo plano periódicos, não instantâneos. Teste físico GPS/tela bloqueada/bateria ainda necessário. Roteiro: docs/06-entregas/ROTEIRO_TESTES_TECNICO_D105.txt.

## Resultado remoto confirmado — 12/11/2026

- Backup D1 anterior em pasta privada, SHA256 `ee97634620d6aed64f24070ba58804daa95aebb27cfedf04eb0e73c155f7fa4a`. Reimportação SQLite em memória: integrity_check ok, zero violações FK, 19 demandas e 92 fotos. É backup do banco, não cópia completa do Drive; não interrompemos agentes/coleta para fingir snapshot global.
- Migração 0027 aplicada: 27 comandos, 8,26ms reportados. Nenhuma migração restante. Preservados 19 demandas (10 pendentes), 15 usuários e 76 unidades; ordem criada para 19 demandas. Zero contas habilitadas, atribuições ou posições iniciais.
- Publicação inicial `b6d8796c-c329-4d82-8eb1-144c906dc5ec`; ajuste final CSS respeitando hidden no login técnico na versão **2013b4f8-9440-4279-946e-6e80fb3068a1**, 100% do tráfego, às **08:52:44 Fortaleza** (11:52:44 UTC). Crons minuto/diário preservados. Sem segredos novos de servidor.
- Coletor permanece `2dac8571-2671-4eec-8ab0-7492753a0255`; não publicado nesta entrega.
- 51 verificações públicas do painel aprovadas e 10 específicas D105 aprovadas, incluindo proteção das APIs/rota root, CSP e hash do APK baixado. Script reproduzível `scripts/verify-technical-release.mjs`.
- APK 1.0.0: 20.961 bytes, SHA256 `6fdabb65acba9f530d407a8da1d03df35f4432a4a5df84e168d1b99bac59fd11`. Disponível por HTTPS, cópia em Downloads; certificado conforme README Android.
- Sessão root renovada pelo login já preenchido no navegador. Conferência oficial às 08:52–08:54: Central → Organizar atendimentos abriu 10 demandas existentes; seletor de técnicos mostrou 15 contas, inativa desabilitada, nenhuma habilitada automaticamente. Não reordenamos, atribuímos ou concluímos demandas reais no teste.
- Panorama mostrou controle de acompanhamento com zero técnicos ativos, coerente com o banco. Aplicativo recusou acesso técnico da conta ainda não habilitada, como esperado. Captura local privada `evidencias/roteiro-tecnico-2026-11-12/06-fila-producao.jpg`.

Próximo uso: root seleciona as contas no botão Técnicos, atribui demandas e instala o APK no aparelho escolhido; seguir roteiro de campo. Publicação e proteção de acesso confirmadas; GPS nativo com tela bloqueada e notificações do fabricante ainda não homologados.
