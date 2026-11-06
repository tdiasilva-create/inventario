## Consolidação operacional — 05/11/2026 (D-063)

Consultar [estado atual](../07-operacao/09_ESTADO_E_PENDENCIAS.md) antes de executar itens históricos abaixo. D-058 supera a exigência de lote; D-057/D-062 superam parte das pendências de navegação V2. Permanecem pendentes restauração completa, política de backup/RPO/RTO, continuidade de endpoint e homologação física do instalador/celular. Esta organização não executa migração ou deploy.

# Pendências documentais e técnicas — não inventar decisões

## UX do coletor após D-061 — correções aprovadas por D-062, 05/11/2026

- [x] Pesquisa separada de respostas; Enter/limpeza e conclusão/reabertura testados sem gravar `_query` nem invalidar a seção.
- [x] Atualização incremental preserva foco/cursor após select/upload; primeiro erro recebe foco e fica visível. Testado inclusive texto digitado durante envio de foto.
- [x] Cabeçalho único, lista e botões compactos, busca com Enter, rodapé adaptado à digitação e retorno à posição da lista. Aprovados pelo pedido explícito “publique as correcoes”; perguntas/permissões/Drive/QR preservados.
- [ ] Homologar teclado real no aparelho/navegador do responsável e registrar Android/iPhone efetivamente testados. Redução de viewport e teste de foco no desktop não equivalem ao teclado físico.

Diagnóstico histórico: `docs/06-entregas/REVISAO_UX_COLETOR_2026-11-05.txt`. Implementação aprovada, testes e registro de publicação: `docs/05-qualidade/UX_COLETOR_PUBLICACAO_2026-11-05.md`; capturas em `docs/05-qualidade/evidencias/ux-publicacao-2026-11-05/`. A proposta anterior fica superada somente neste escopo.

## Instalação em lote — diagnóstico confirmado em 05/11/2026

- [x] Diagnóstico do responsável: `awaiting_grant`, `GRANT_USED`, servidor alcançável. Consulta remota somente leitura confirmou autorização do pacote unitário em 1/1 e ausência de grant para 200 máquinas. SHA-256 do instalador único confere com D-056. Orientações: `ORIENTACOES_NOVO_INSTALADOR_LOTE_SEMED_2026-11-05.txt`.
- [x] Reproduções isoladas: grant unitário recusa segunda máquina; grant de 200 aceita 200 identidades/QRs e recusa a 201ª; perda da resposta de cadastro pode impedir novo desafio com grant esgotado. Evidências em `revisoes/diagnostico-instalador-2026-11-05/`. Sem teste físico do EXE nesta rodada.
- [ ] Preparar experiência de pacote privado de lote, ativação automática, mensagens corretas e UI sem corte; fornecer fonte exato/build verificável do novo instalador. A emissão real do lote e sua distribuição não foram executadas nesta análise.
- [ ] Corrigir recuperação da ativação após resposta perdida: diário local e repetição idempotente; para desafio já expirado, especificar recuperação autenticada no servidor pela chave existente. Não abrir cadastro anônimo nem consumir novo uso em atualização/reparo.

## Desempenho do coletor — diagnóstico de 05/11/2026

- [x] Analisados avanço/retorno informados pelo responsável, código V2, volume D1 e recursos públicos. Reproduzida espera de salvamento com Worker/SQLite isolados e captura real. Relatório: `docs/05-qualidade/ANALISE_DESEMPENHO_COLETOR_2026-11-05.txt`; evidências: `revisoes/desempenho-coletor-2026-11-05/`. Nenhuma alteração funcional ou publicação nesta análise.
- [ ] Corrigir navegação que aguarda a fila de salvamento, indicação desatualizada de “Rascunho no servidor” e ausência de prazo de espera controlado. Preservar versões, autoria, confirmação do servidor, recuperação de resultado desconhecido e contexto por assunto/vistoria.
- [ ] Propostas técnicas: reduzir leituras redundantes, consolidar abertura V2, cachear somente estáticos versionados, medir placement e otimizar carregamento privado de fotos. O primário observado foi LIS/WEUR; efeito no celular ainda não medido. Não há justificativa demonstrada para migrar banco ou framework.
- [ ] Proposta de usabilidade: agrupar campos relacionados, sem remover perguntas/obrigações aprovadas. Homologar navegação e salvamento em rede lenta nos celulares; o ensaio local não substitui esse aceite.

## Instalador de referência — D-056, 04/11/2026

- [x] Escolha de `SemedAgente-InstaladorUnico.exe` registrada com manifesto e cópia cujo hash confere com o original. Consultar `docs/04-dados-apis/INSTALADOR_OFICIAL.md` antes de novos testes/entregas do agente.
- [ ] Homologar esta cópia exata em Windows: configuração/autorização, instalação, QR, vínculo e telemetria. O arquivo é diferente do EXE anterior; mesmo número de versão não comprova equivalência.

## Situação posterior — publicação real em 04/11/2026 (D-054)

- [x] Migração 0014 e publicação dos dois Workers reais concluídas, Drive institucional preservado e autoteste real aprovado. Ver `docs/05-qualidade/PUBLICACAO_V2_QR_2026-11-04.md`.
- [x] Aprovação explícita do responsável para implantar a entrega D-053 diretamente em produção; ambiente separado não é mais pré-requisito. Registros de “somente local/aguarda aprovação” abaixo preservam o histórico anterior e são superados neste escopo por D-054.
- [ ] Homologação física Windows + celular, incluindo leitura/confirmacão QR, inventário/heartbeat e fotos na mesma ficha. QR simulado solicitado pelo responsável em D-055 é teste parcial, não homologação do EXE.
- [ ] Alertas de troca de hardware e demais lacunas funcionais permanecem pendentes.

A Base de Coleta (seção 14) é a fonte primária para pendências mobile. Os itens abaixo são uma visão executiva e devem ser resolvidos sem refazer o questionário completo.

## Mobile (da base aprovada)
- [ ] P1: regra personalizada de validação 25.10 (quando e como exibir erros).
- [ ] P2–P4: valores padrão de sessão, continuidade offline, retenção local sincronizada.
- [ ] P5–P6: parâmetros de foto e fotos por lote.
- [ ] P7: critérios objetivos da criticidade Baixa/Média/Alta/Crítica.
- [ ] P8: prototipar viabilidade do desbloqueio offline seguro em Chrome Android / Safari iPhone.
- [ ] P9: backup consistente D1/R2 e recuperação real; manter metas aprovadas.
- [ ] P11: limites do editor parcialmente configurável de questionário.

## Integrações, conteúdo e identidade
- [ ] Lista oficial das 90 unidades: identificadores, nomes, eventual endereço/regional, permissões.
- [ ] Brasão e marcas oficiais autorizados (elementos desenhados nos mockups são ilustrativos).
- [ ] Coordenadas confiáveis das unidades e provedor cartográfico para o mapa real.
- [ ] Rotas e efeitos detalhados das interações do painel e das tabelas.
- [ ] Definições matemáticas e fontes de cada indicador, taxa e alerta do painel.
- [ ] Esquema físico D1, API Worker, filas de upload R2, migrações e política de acesso às fotos.
- [ ] Especificação dos relatórios desktop e exportações, sem confundir com coleta mobile.

## Fotografias via Google Drive (D-048; situação revisada em 04/11/2026)
- [x] Proposta D-047 aprovada por D-048: camada de armazenamento e pasta privada no Meu Drive com `drive.file`.
- [x] Projeto Google Cloud, API e cliente OAuth configurados, conforme registro de 03/11 em `docs/04-dados-apis/INTEGRACAO_GOOGLE_DRIVE.md`. Esse registro não equivale a autorização operacional da conta nem foi revalidado na interface Google nesta revisão.
- [x] Nomes dos três segredos e `PHOTO_STORAGE_PROVIDER=google-drive` presentes nos dois Workers publicados; migração 0013 aplicada. Confirmado por consulta Cloudflare/D1 em 04/11. Valores dos segredos não foram lidos; funcionamento/igualdade da chave dependem do teste real.
- [x] Autorizar pelo root com a conta institucional e executar autoteste real: conexão em 04/11/2026 às 07:33:05, teste de upload/remoção aprovado às 07:34:27. Evidências em `docs/05-qualidade/DRIVE_CONECTADO_2026-11-04.md`.
- [x] Foto real enviada pelo usuário lida no proxy e na galeria parcial do painel em 04/11; correção publicada. Ver `docs/05-qualidade/FOTOS_PARCIAIS_2026-11-04.md`.
- [ ] Homologar vínculo de fotos de equipamentos em todos os fluxos, renovação do token e aparelhos do roteiro `docs/05-qualidade/TESTE_FOTOS_GOOGLE_DRIVE.txt` (Chrome Android e Safari iPhone).
- [ ] Verificar permissões administrativas da conta e políticas do Workspace para apps OAuth internos; confirmar cota efetiva do Meu Drive.
- [ ] Remoção individual de fotos pelo root com autoria, motivo, vínculo e resultado; política de retenção/recuperação antes da exclusão definitiva.
- [ ] Paginação da consulta oficial de fotos por unidade (hoje até 50).
- [ ] P9 passa a incluir backup/recuperação coerentes entre D1 e a pasta do Drive.

Bloqueio inicial de OAuth ausente resolvido em 04/11/2026: autorização e pasta registradas em produção, com `self_test_ok`. A integração está habilitada; permanecem os testes de foto vinculada no coletor/painel e de celulares. A consulta anterior sem tokens/fotos está preservada como histórico em `docs/05-qualidade/REVISAO_PRONTIDAO_IMPLANTACAO_2026-11-04.md`. Não reiniciar projeto/segredos/migração como se ainda não existissem.

## Não são lacunas de decisão
Os grupos A–H, fichas individuais/híbridas, regras de foto foram decididos na Base v1.0. Os perfis foram atualizados por decisão posterior D-031. Não reabrir isso ao começar um projeto novo.

- [x] D-028/D-031: matriz root/admin/operador/visualizador aprovada e aplicada às operações de contas. Sessões de 1 hora e senhas provisórias de 24 horas aprovadas. Autorizações e operações de inventário por escola continuam pendentes de integração.


## V2 reformulada — 04/11/2026 (situação revisada em 04/11 após a entrega local V2 + QR; proposta D-053)
- [x] R2-A, R2-B e R2-C corrigidos e revalidados LOCALMENTE na revisão independente rev3: 78 testes + 2 de fotos, seis cenários adicionais e builds aprovados. Ver `docs/05-qualidade/REVISAO_INDEPENDENTE_CLAUDE_V2_QR_REV3_2026-11-04.md` e `DEVOLUTIVA_CLAUDE_V2_QR_REV3_2026-11-04.txt`. Próxima etapa é homologação integrada isolada; não representa produção publicada ou homologação do EXE/celulares. Histórico: a rev2 reproduziu retomada defeituosa do claim, ausência de reabertura manual e localização atual/publicada incoerente. Evidências antigas preservadas nos relatórios rev2.
    - 04/11 (noite) — R2-A, R2-B e R2-C corrigidos LOCALMENTE com testes do comportamento correto (suíte 78/78 + 2; 6 testes de navegador, incluindo resposta perdida real e prévia de exclusão com agentes). Ver `docs/06-entregas/claude-v2-qr-2026-11-04/RELATORIO_CORRECOES_REV2.txt`. Aguarda nova revisão independente; sem publicação. Continuam pendentes: homologação física (EXE/celulares), validação publicada, alertas de hardware, histórico técnico completo por ficha (A12), armazenamento de fotos de homologação (D13).
    - Revisão independente rev3 concluída posteriormente em 04/11: os três casos passaram; quatro capturas recebidas foram inspecionadas. Não foram reexecutados pelo revisor os testes de navegador do autor. Recuperação de comando pendente requer manter a aba aberta. D-053, homologação física e demais lacunas continuam com o escopo documentado.
- [x] REV-01 a REV-07 corrigidos localmente em 04/11 (tarde) com testes do comportamento correto (`tests/revisao-independente.test.mjs`, 8 testes; suíte 75/75 + 2 de fotos parciais; 5 testes de navegador) — ver `docs/06-entregas/claude-v2-qr-2026-11-04/RELATORIO_CORRECOES_REVISAO.txt`. Também entregues localmente: tela do root (Configurações → Agentes Windows), manutenção agendada (`scheduled` + cron proposto no wrangler.jsonc) e `wrangler.validation.painel.jsonc`. Continuam pendentes: homologação com EXE/celulares reais, publicação dos ambientes de validação, alertas de hardware (escopo proposto em PENDENCIAS_E_DECISOES D11). Texto original da revisão: Resolver REV-01 a REV-07 da revisão independente do pacote Claude antes de homologar/publicar: revogação na exclusão, política de localização/travas/revisão, confirmação de posição, acesso inicial ao leitor QR, foto na revisita de impressora e cancelamento assíncrono da câmera. Sete falhas reproduzidas apesar dos 69 testes existentes aprovados. Ver `docs/05-qualidade/REVISAO_INDEPENDENTE_CLAUDE_V2_QR_2026-11-04.md` e a devolutiva TXT na raiz. Alertas de alteração de hardware, interface root para autorizações e execução agendada de manutenção também não estão entregues nesta versão.
- [ ] Obrigatoriedade individual de nome/função/telefone do acompanhante e campos “solicitar” das impressoras; impacto/prioridade/origem adicionais conforme §17 do V2. (Decisão do responsável; não implementado como regra.)
- [ ] Credenciais Wi-Fi/impressora cifradas, consulta autorizada e leitura/alteração auditadas; nenhum segredo no JSON de respostas/históricos. Nesta fase não existe campo de senha liberado.
- [x] Agente/QR integrado à API autenticada com o mesmo ID do computador — implementado e testado localmente (proposta D-053): módulo `server/agentes/`, migração 0014, leitor QR no coletor V2, prévia/claim com confirmação real, consulta no painel. Pendentes: aprovação da proposta, migração/publicação, homologação com o EXE 0.1.6 em Windows e celulares físicos (`docs/06-entregas/claude-v2-qr-2026-11-04/ROTEIRO_TESTE_USUARIO_V2_QRCODE.txt`).
- [ ] Intervalos de heartbeat/inventário, retenção de snapshots/heartbeats, dimensão do piloto e custos do agente (padrões técnicos provisórios em `server/agentes/index.mjs`; decisão do responsável).
- [ ] Autorização de instalação em lote e revogação: hoje exclusivas do root; admin só prévia/claim. Reversível se o responsável quiser delegar a admin.
- [ ] Reconciliação administrativa: trocar o agente de uma ficha já vinculada (revogar + novo vínculo) só pelo root; sem tela própria no painel ainda (rotas existem).
- [ ] Teste integrado pelo celular: método/provedor/consumo/associação ao link. Resultado externo manual implementado; 2.L11 agora opcional nesse modo.
- [ ] Offline protegido com fotos/dados duráveis, idempotência e conflitos em Chrome Android/Safari iPhone. Prévias em RAM não atendem retomada após fechar. Sem internet não há vínculo por QR.
- [ ] Unificação campo a campo, reversão com segundo aprovador e autorização do responsável superior.
- [x] Apresentação desktop versionada: tópicos V2 em detalhe de unidade e coletas em andamento, campos V2 na ficha, estado do agente, “Não localizado”, eventos novos, contagem “Não foi possível testar”. Pendente: tela dedicada de telemetria/histórico por unidade e paginação da consulta de agentes.
- [x] Aviso por semelhança de nome de ambiente com confirmação explícita (nomes exatamente iguais continuam reutilizados). Pendente: interface de alteração histórica de nomes.
- [ ] H copiada de visita anterior como “Concluído” (D-052): confirmar se deve reabrir automaticamente na nova visita.
- [ ] `tests/desktop.cjs` (servidor estático DEMO) falha desde que a matriz passou a vir da API; substituir por teste com Worker isolado (há exemplo em `tests/desktop-v2-agent-browser.cjs`).
- [ ] Homologação em celulares físicos (QR02/QR03, leitor com câmera real, BarcodeDetector × jsQR) e autorização/teste real do provedor de fotos antes de publicação.

- [ ] Homologação integrada da proposta D-053 (após a aprovação local rev3): decisões D-H1–D-H4 e execução do `PLANO_HOMOLOGACAO_V2_QR.txt` (ambiente de validação isolado, EXE 0.1.6 em máquina designada, celulares reais, roteiro revisão 3, registro em `docs/05-qualidade/HOMOLOGACAO_QR_AAAA-MM-DD.md`). Uma aprovação cobre os passos do escopo autorizado. Produção: aceite e autorização próprios para backup/migração/publicação. Revisão do plano em `docs/05-qualidade/REVISAO_PLANO_HOMOLOGACAO_QR_2026-11-04.md`: 401 não atesta migração; sonda POST grava contador; sem fotos a homologação é parcial; preservar contas existentes. Nenhum recurso remoto alterado.

### Atualização D-054 / D-057 — 05/11/2026
As referências acima a aprovação/publicação de V2/QR aguardando autorização são históricas: D-054 autorizou produção e foi executada; D-057 autorizou e publicou a V3 nos dois Workers reais com o Drive existente. Oito dúvidas da V3 e envio automático de fotos foram decididos pelo responsável (DECISOES.md). Não pedir essas decisões novamente. Pendentes reais: teste físico do novo roteiro no celular, câmera/galeria e QR com EXE real, funcionamento do instalador em lote (GRANT_USED), offline durável e demais limites de agente. V3 não exige confirmação por semelhança de ambientes: reaproveita apenas nome normalizado exato. Roteiro TESTE_COLETOR_V3_2026-11-05.txt; evidências PUBLICACAO_V3_2026-11-05.md.

### Atualização D-058 — 05/11/2026
O responsável escolheu explicitamente cadastro automático SEM lote. A exigência de GRANT_USED/INVALID_GRANT para novas instalações foi superada. Novos cadastros são pendentes e assinados; vínculo e telemetria continuam protegidos. Testes locais: 94 aprovados, incluindo 200 identidades no mesmo IP e reenvio tardio sem duplicação. Pendentes: homologação física do EXE 0.1.8 em dois PCs Windows, leitura pela câmera do celular, reinício/reinstalação/queda de rede. Não confundir teste de protocolo com execução do EXE. Alertas de troca de peça e QR permanente continuam fora desta entrega.
