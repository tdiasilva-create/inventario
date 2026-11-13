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

### D-068 — cadastro ampliado, publicado em 06/11/2026
- [x] Três propostas confirmadas: nomes dos tipos, total/etapas de alunos e obras fora da coleta. Não perguntar novamente.
- [x] Publicação do código nos dois Workers e migração aditiva 0016 no D1 compartilhado, após autorização posterior do responsável. Backup anterior e conferência dos registros existentes; ver docs/05-qualidade/PUBLICACAO_D068_2026-11-06.md. Sem carga automática.
- [ ] Carga pelo root após publicação. Não interpretar 141 nomes de referência, arquivos de importação ou sugestões da planilha como cadastro oficial já gravado.
- [ ] Corrigir na fonte importacao_escolas_municipais.csv, linha 31: vagas disponíveis -16. Lote de 71 linhas bloqueado corretamente; quatro outros lotes passaram em SQLite isolado (8/33/6/17).
- [ ] Confirmar prioridade das fontes dos números, inativação de três escolas e reclassificações sugeridas no pacote, inclusive EC Mickey; nenhuma executada automaticamente.
- [ ] A-cadastro-01: atualização de números em lote por INEP não autorizada/implementada. Importação permanece inserção; unidades existentes são editadas pelo root, com versão.
- [ ] Homologação física das novas telas publicadas. Teste de navegador local e conferência desktop real não confirmam fluxo no celular real nem novo upload ao Drive real.

- [ ] Atualizar roteiros antigos de navegador V2/QR/fotos citados no pacote: esperam entrada, botão ou título de versão removidos por D-060. Falhas e substituição pelo aceite do fluxo atual registradas em docs/05-qualidade/CADASTRO_UNIDADES_2026-11-06.md; não reintroduzir comportamento antigo.

### D-069 — consulta desktop publicada em 08/11/2026
- [x] Consulta embutida, filtros/paginação no servidor, cópia e fotos por equipamento; publicação do painel autorizada e executada.
- [x] Conferência visual autenticada real concluída em 08/11/2026 após entrada do responsável: unidade/categoria, ficha técnica e fotografia ampliada da EM RAIO DE LUZ, sem escrita. Evidências em CONSULTA_EQUIPAMENTOS_2026-11-08.md.
- [ ] Melhoria futura: derivados menores de imagens no servidor; hoje o carregamento é por visibilidade e usa o arquivo otimizado do coletor. Sem nova regra de fotos.
- [ ] Histórico completo/paginado do agente, se solicitado futuramente; o contrato atual entrega até 10 eventos e a interface declara esse limite.


### D-070 — monitoramento, 08/11/2026
- A antiga pendência de notificações no painel é atendida pelo monitor automático D-070; não confundir com homologação física do instalador.
- [ ] Aceite físico com perda/retorno de rede e manutenção autorizada de peça em PC real, aguardando inventário do agente. Testes locais não substituem esse aceite.
- [ ] Troca de peças idênticas sem série confiável, periféricos/fonte/bateria e coleta remota imediata não estão cobertos pela telemetria comparável atual. Não inferir implementação.

- [x] D-070 publicado no painel real, migração 0017 e cron de minuto confirmados em duas rodadas consecutivas (08/11/2026, 19:22/19:23 Fortaleza). Dados/Drive preservados. Pendente somente o aceite físico descrito acima, sem impedir o monitor de operar com a telemetria recebida.


### D-071 — 08/11/2026
- [x] Central de demandas e computadores por unidade/laboratorio publicados no painel; migracao 0018; historico, reenvio, perfis e volume testados. Ver docs/05-qualidade/CENTRAL_DEMANDAS_2026-11-08.md.
- [ ] Responsavel classificar laboratorios reais existentes e confirmar ausencia de computadores somente quando conhecida. Nao inferir por nomes ou falta de inventario.
- [ ] Homologacao operacional de um atendimento real e de um laboratorio fisico pelo responsavel. Nenhum exemplo foi gravado em producao.

## Atualização da auditoria — Fase 2, 09/11/2026

A escolha sobre miniaturas no D1 foi resolvida pelo responsável em D-072. Implementação de miniaturas, fallback, metadados e manutenção root registrada em docs/05-qualidade/CORRECOES_PRODUCAO_FASE_2_2026-11-09.md. Permanecem pendentes a homologação física Android/iPhone (câmera, orientação HEIC, preparo de 12 MP), medições p50/p95 em rede real, e Fases 3–5. O aceite de “salvar + duas fotos sem GET inspection” pertence à Fase 4; não foi antecipado nesta fase. O histórico de pendências abaixo/acima não deve ser interpretado como ausência atual de miniaturas.

## Atualização da auditoria — Fase 3 / D-073, 09/11/2026

Implementadas consultas por blocos, mapa preservado, fachada e galeria completa, atualização de detalhes, vínculo de agente em andamento e exportações; ver docs/05-qualidade/CORRECOES_PRODUCAO_FASE_3_2026-11-09.md. Publicação real autorizada expressamente nesta etapa. Permanecem sem decisão: botão/camada de locais de referência (ERR-19), filtro Ano (LNA-09), extensão da busca global e interpretação de indicadores. Nenhum dado fictício oficial, exclusão ou alteração no coletor integra esta fase. Fases 4/5 e homologação física continuam pendentes.
## D-074 — ambientes compartilhados, 09/11/2026

- [x] Seleção dos ambientes da própria unidade, consulta ao abrir/atualizar, novo cadastro explícito, vínculo por ID validado no servidor e reutilização em concorrência. Ver `docs/05-qualidade/AMBIENTES_COMPARTILHADOS_2026-11-09.md`.
- [ ] Homologação em celulares físicos durante a coleta com vários operadores. Teste isolado usa dois navegadores/sessões; não equivale a teste de 40 máquinas reais.
- [ ] Duplicidades antigas com nomes diferentes permanecem; não há autorização para unificação ou exclusão automática.
- Fases 4 e 5 pausadas a pedido do responsável. Esta entrega atende somente ao pedido de seleção de ambientes.

## D-075 — correção de senha, 09/11/2026

- [x] Reproduzir e corrigir redirecionamento do operador, alteração voluntária, confirmação, estado restaurado e duas trocas simultâneas; 150 testes e roteiro navegador aprovados. Ver [relatório](../05-qualidade/CORRECAO_SENHAS_2026-11-09.md).
- [ ] Confirmar retorno dos usuários nos celulares reais. Nenhuma senha ou reset legítimo foi alterado durante a investigação.
- Fases 4/5 da auditoria continuam pausadas.
## D-076 — edição de ambientes, 09/11/2026

- [x] Correção do nome pelo operador em coleta aberta e pelo root no painel, com concorrência/histórico e sem romper vínculos. [Testes e publicação](../05-qualidade/EDICAO_AMBIENTES_2026-11-09.md).
- [ ] Aceite em celulares físicos pelo responsável. Testes de navegador não substituem teclado/câmera reais.
- União/exclusão de ambientes e editor de legendas de fotos não fazem parte deste pedido específico. Fases 4/5 continuam pausadas.

## D-077 — nomes de equipamentos, 09/11/2026

- [x] Editor root de nomes de computadores e impressoras pelo painel, incluindo parciais; preservação de fotos/agente/unidade, versões e histórico testados. [Registro](../05-qualidade/EDICAO_NOMES_EQUIPAMENTOS_2026-11-09.md).
- Nome exibido não altera hostname no Windows. União/exclusão/transferência de equipamentos e edição livre de legendas de fotos não fazem parte deste pedido. Fases 4/5 continuam pausadas.

## D-078 — exclusão de cadastro pelo root

- Implementada retirada administrativa com confirmação/histórico/fotos e proteção de IDs; [aceite](../05-qualidade/EXCLUSAO_EQUIPAMENTOS_2026-11-09.md).
- A escolha de qual registro duplicado manter pertence ao responsável. Não houve exclusão real durante testes.
- Repareamento testado por protocolo assinado; interação física com o EXE permanece a homologar. Sem fusão/restauração automática ou botão de exclusão para operador. Fases 4/5 continuam pausadas.

## Tour de lógica D-082 — 10/11/2026

Implementar/publicar correções descritas no [aceite D-082](../05-qualidade/TOUR_LOGICA_2026-11-10.md). Permanecem sem nova decisão: LOG-08 (fichas vs quantidade física de lotes), LOG-10/LNA-12 (busca global de equipamentos), LOG-13 (critério de Pendentes), LOG-14 (Relatórios/Planejamento), LNA-09 (Ano) e N-02 (mudar clique da matriz). Comportamentos existentes preservados. A contagem de computadores nesta tela continua por ficha; não equiparar a soma física publicada da matriz. Fases 4/5 continuam pausadas.

## D-083 — escolas online no mapa

- [ ] Responsável definir local/apresentação das escolas offline. Regra de classificação aprovada; não inventar nova aba ou listagem.
- A mudança do indicativo do mapa não decide LOG-08 sobre quantidade física/fichas na tela Computadores. Demais decisões D-082 e Fases 4/5 preservadas.

## D-084 — extensão da busca global

- [x] Escolha LOG-10/LNA-12 resolvida: opção 2, cabeçalho unificado de unidades e equipamentos; implementação e testes em [BUSCA_GLOBAL_2026-11-10.md](../05-qualidade/BUSCA_GLOBAL_2026-11-10.md). Supera as anotações anteriores de busca pendente apenas nesse escopo.
- [ ] Aceite operacional pelo responsável após publicação. Dados inativos/excluídos e históricos não fazem parte desta busca.
- LOG-08, LOG-13, LOG-14, LNA-09, N-02, local das escolas offline e Fases 4/5 continuam pendentes.

## D-085 — LOG-13 resolvido: pendências separadas

- [x] Opção 3 aprovada: coletas pendentes, demandas abertas, hardware aguardando parecer. Implementados contador compartilhado, lista de unidades pendentes e modal filtrado; [critérios/aceite](../05-qualidade/INDICADORES_PENDENCIAS_2026-11-10.md). Supera a pendência de critério genérico nos registros anteriores.
- [ ] Aceite operacional pelo responsável após publicação.
- Permanecem sem nova decisão: LOG-08 (fichas/quantidade física), LOG-14 (Relatórios/Planejamento), LNA-09 (Ano), N-02 (destino da matriz), apresentação das escolas offline e Fases 4/5.

## D-086 — LOG-14: primeira versão aprovada

- [x] Opção 2: relatório de computadores com filtros/exportação/impressão e fila por unidade no Planejamento. Supera os textos de indisponibilidade desses setores nesse escopo. [Aceite](../05-qualidade/RELATORIOS_PLANEJAMENTO_2026-11-10.md).
- [ ] Aceite operacional do responsável após publicação.
- [ ] Outros relatórios, agenda, atribuição de técnicos e critérios automáticos de prioridade dependem de nova definição. Nenhum foi presumido.
- LOG-08 (fichas/quantidade física), LNA-09 (Ano), N-02 (destino da matriz), apresentação das escolas offline e Fases 4/5 permanecem pendentes.

## D-088 — notificações e apresentação offline

- [x] Responsável definiu a posição das escolas offline: acima das online no mapa. Supera somente esta pendência nas anotações D-083–D-086 anteriores.
- [x] Confirmadas 48 HORAS para perda inesperada em log próprio; hardware no sino/mapa. Implementação e aceite em NOTIFICACOES_48H_2026-11-10.md.
- [ ] Aceite operacional com dados/máquina reais pelo responsável após publicação. Troca física depende do envio do inventário pelo agente; não foi simulada na produção.
- LOG-08, LNA-09, N-02 e Fases 4/5 permanecem pendentes.

## D-089 — refinamento do coletor em 10/11/2026

- [x] CL-01–07: causas específicas, retorno à revisão, rascunho explícito, renovação de trava pelo mesmo usuário, leitura de assunto concluído, sessão expirada e foto de impressora na conclusão do assunto.
- [x] CL-08: responsável escolheu manter busca limitada e explicar seu alcance; expansão não aprovada.
- [x] CL-09–12: páginas acumuladas, retorno/filtro/rolagem, Salvar compacto, diálogos próprios e remoção dos controles V2 sem interface atual.
- [x] CL-13: manter D-057 Editar somente, retirar contador não conferido; sem apagar verificações históricas.
- [x] CL-14–16: aviso sobre links ocultos preservados; aviso do histórico de questionário antigo já existente; separar testes históricos dos atuais e usar dependência local do Playwright.
- [ ] Confirmar teclado/câmera reais no celular do responsável. Testes em Chromium/Edge e viewport reduzido não comprovam experiência física Android/iPhone.
- [ ] Offline durável, autosave completo da ficha, declaração explícita de ausência de equipamentos, exclusão pelo operador, ações em lote e revisão das perguntas continuam fora desta entrega; dependem de decisão/planejamento próprios.

[Contrato e limites](../02-coleta-mobile/REVISAO_E_ACOES_D089.md). Esta decisão não reabre as Fases 4/5 pausadas nem transforma rascunho em inventário publicado.

## D-090 — ampliação escolar

- [x] Cadastro escolar ampliado com campos opcionais e fontes mapeadas; CONTRATO excluído pelo responsável. Militares como subconjunto das municipais.
- [ ] Aceite operacional do formulário pelo responsável após publicação.
- [ ] Importação/preenchimento dos novos campos: não executados; diferenças entre fontes e células com erro precisam de conferência própria.
- [ ] Outros tipos de unidade, indicadores pedagógicos e histórico por ano seguem fora do escopo. Fases 4/5 não retomadas.

[Contrato e limites](../04-dados-apis/CADASTRO_ESCOLAS_D090.md).

## D-091 — decisões do Panorama

PAN-02 esclarecido: ampliar e habilitar roda; PAN-05 esclarecido: manter matriz. Não há decisão funcional pendente neste lote. Aceite visual do responsável após publicação ainda a conferir. As demais decisões e fases não foram antecipadas.


## D-093 — continuação da averiguação do painel

- [x] TP-18/08/19: correções autorizadas, implementadas e cobertas por regressão isolada; publicação registrada no aceite.
- [x] TP-20: responsável confirmou EM RAIO DE LUZ municipal no escopo atual; conveniadas excluídas. Sem mudança cadastral automática.
- [ ] Aceite visual do responsável após publicação.
- [ ] TP-09 e TP-17 continuam dependendo de decisão. TP-10, descoberta dos menus/TP-04 e títulos/TP-13 não fazem parte deste lote. TP-01/TP-14 dependem de reprodução adicional.

[Aceite, limites e evidências](../05-qualidade/PAINEL_ASSINCRONO_2026-11-11.md). Fases 4/5 continuam pausadas.


## D-094 — demandas no mapa

- [x] Todas as demandas abertas, não apenas hardware, sinalizadas por unidade em #006D77. Critérios de abertura/conclusão já definidos por D-071/D-085.
- [x] Aceite visual do responsável após publicação do anel de 48 px/ciclo 3 s: confirmou que acessou e está funcionando em 11/11/2026.

[Aceite](../05-qualidade/DEMANDAS_MAPA_2026-11-11.md). Nenhuma decisão anterior pendente foi antecipada.

## D-095 — consulta da unidade no mapa

- [x] Hover com alunos/vagas do cadastro e destino por unidade/demanda implementados e testados.
- [ ] Aceite visual do responsável após publicação. Dados não preenchidos permanecem Não informado, sem criar pendência artificial ou importar números.

[Aceite](../05-qualidade/CONSULTA_UNIDADE_MAPA_2026-11-11.md). Demais pendências preservadas.

## D-096 — senhas e criação de usuários

- [x] Três decisões explícitas implementadas e testadas: provisória escolhida pelo root, mínimo seis, sem consulta externa.
- [ ] Aceite operacional pelo responsável após publicação. Não há decisão funcional pendente neste lote. Reset administrativo permanece como já implementado; não faz parte da alteração pedida.

[Aceite/publicação](../05-qualidade/SENHAS_SIMPLIFICADAS_2026-11-11.md). Demais pendências e Fases 4/5 preservadas.


## D-097 — conexão dos agentes

- [x] IP público, organização da rede e último contato implementados/testados; IP interno separado. Sem decisão funcional pendente neste lote.
- [x] Dois Workers publicados em 11/11/2026; recebimento real confirmado em seis agentes pela consulta agregada de 17:31, sem reinstalação.
- [x] Aceite visual do responsável em 11/11/2026: aprovou a ficha após navegação autenticada no painel real. Endereços internos continuam dependentes da política já existente do agente.

[Aceite e publicação](../05-qualidade/CONEXAO_AGENTES_2026-11-11.md). Demais pendências e Fases 4/5 preservadas.


## D-098 — emissão semanal por clique

- [x] Botão, consulta completa, Excel/CSV/PDF e testes implementados.
- [x] Quinta coluna Último contato expressamente confirmada pelo responsável.
- [x] Publicado e conferido com sessão root no ambiente real; relatório completo exibido.
- [ ] Aceite operacional do responsável após publicação.

Sem agenda automática ou histórico de variações solicitado/implantado neste lote. [Aceite](../05-qualidade/RELATORIO_PROVEDORES_2026-11-11.md). Demais pendências preservadas.

## D-099 — arquivo semanal de provedores

- [x] Quatro colunas e uma linha por unidade solicitadas expressamente; seleção rastreável e dados ausentes explícitos implementados.
- [x] Horário confirmado pelo responsável: segunda-feira às 08h, Fortaleza.
- [x] Registro inicial, agenda durável, arquivo imutável, consultas e exportações testados localmente.
- [x] Migração 0026 aplicada e painel publicado em 11/11/2026 às 18:16:35 Fortaleza; primeiro registro automático às 18:16:43, aberto e conferido como root.
- [ ] Conferir execução da primeira segunda-feira em produção na data prevista, distinta dos testes com relógio controlado.
- [ ] Aceite operacional final pelo responsável.

Supera a ausência de agenda/histórico de D-098, sem resolver outras pendências ou retomar Fases 4/5. [Aceite](../05-qualidade/PROVEDORES_SEMANAIS_2026-11-11.md).

## D-100 — escolas online/offline em modal

- [x] Pedido definido: somente nomes do grupo, mesmos filtros, sem informação adicional.
- [x] Implementação e testes locais de lista, acessibilidade, atualização/falha e mapa ampliado concluídos.
- [x] Painel publicado em 11/11/2026 às 19:38:49 Fortaleza, versão e1b208a6-7813-4901-9bed-7b1c34522d4a (100%).
- [x] Conferência autenticada real como root em 11/11/2026 às 19:56–19:57 Fortaleza: 1 escola online (EM RAIO DE LUZ), 68 offline, listas somente de nomes correspondentes aos indicadores.
- [x] Responsável confirmou: “assim está bom por enquanto”, em 11/11/2026.

Sem decisões funcionais adicionais. Demais pendências e Fases 4/5 preservadas. [Aceite](../05-qualidade/ESCOLAS_MODAL_2026-11-11.md).

## D-101 — busca por nome de unidade nas demandas

- [x] Escopo definido pelo pedido; filtro e formulário implementados e testados em banco isolado.
- [x] Publicação real em 11/11/2026 às 20:14:10 Fortaleza, versão 9544bdfb-2a9d-4873-bedb-7f1ea58ca80a (100%). Conferência root de “raio” no filtro/pré-seleção e “pirâmide” no cadastro, sem salvar demanda de teste.
- [ ] Aceite operacional do responsável.

Sem novas decisões pendentes. [Aceite](../05-qualidade/DEMANDAS_BUSCA_UNIDADE_2026-11-11.md). Demais pendências preservadas.

## D-102 — salvar sem reabrir demanda

- [x] Causa identificada e correção testada: fechamento, confirmação, consulta manual e falhas/idempotência.
- [x] Publicação real em 11/11/2026 às 20:29:17 Fortaleza, versão a905bd00-0115-43ae-aa99-96058b9eac5b (100%). 51 checks HTTP e conferência root somente de leitura; nenhuma demanda fictícia criada.
- [ ] Aceite operacional do responsável.

Sem decisões adicionais. [Aceite](../05-qualidade/DEMANDA_SALVAR_SEM_REABRIR_2026-11-11.md).


### Desempenho do painel — D-103 (12/11/2026)

Correção de carregamento/consultas autorizada e testada; publicação e comparação real registradas em `docs/05-qualidade/DESEMPENHO_PAINEL_2026-11-12.md`. Mantidos para avaliação futura, sem aprovação implícita: mudança de região/arquitetura do banco, aumento dos intervalos de atualização, cache de dados privados e alterações funcionais fora do pedido. Conferência na rede/dispositivo do responsável pelo roteiro TXT; tempos locais não são garantia de latência de produção.


## D-104 — rodada seguinte de desempenho

Correções de marcador/coletas/fotos e instrumentação aprovadas em 12/11/2026. [Resultados e publicação](../05-qualidade/DESEMPENHO_D104_2026-11-12.md). Smart Placement permanece para experimento separado; cache de autorização da integração não foi adotado. Aceite na rede do responsável pelo roteiro D104. Demais decisões pendentes preservadas.

D-104: publicação concluída na versão b2f9ae76-0ddc-4080-bbf1-8f74a1191cb2. Sessão root renovada e conferência autenticada concluída em 12/11 às 07:32–07:36: navegação, coletas e fotos verificadas; medições registradas. Nenhum bloqueio de login permanece. Aceite na rede/dispositivo do responsável e experimento separado de Smart Placement continuam futuros.

## D-105 — organização de atendimentos e aplicativo técnico

Definição funcional iniciada em 12/11/2026 e posteriormente implementada/publicada na mesma data. Resolvidos: lista única por arraste, até dois técnicos, conclusão por qualquer um com autoria, localização no aceite e retirada ao concluir; **bloquear aceite/início sem localização disponível**, confirmado pelo responsável.

Atualização após autorização: capacidade nas contas existentes e uma ativa por técnico confirmadas pelo responsável. Implementados pausa/retirada, conclusão simples, root exclusivo nas posições, expiração e última posição sem trilha, APK assinado e avisos periódicos. Tracejado liga sequência; Maps externo calcula ruas. Ver [contrato](../03-painel-desktop/ROTEIRO_TECNICO_D105.md) e [entrega](../05-qualidade/ROTEIRO_TECNICO_2026-11-12.md). Restam homologação Android físico (GPS, tela bloqueada, bateria e avisos), seleção/habilitação das contas pelo root e cópia institucional externa da chave de assinatura. Push instantâneo/FCM e desenho por ruas no painel não foram implantados; são evoluções separadas, não declaradas prontas. Demais pendências preservadas.


## D-106 — ativação do roteamento por ruas

Implementação local pronta, 238 testes de servidor e regressões de navegador aprovados. Backup verificado e migração 0028 ensaiada. Publicação solicitada pelo responsável, mas aguarda confirmação específica de envio de coordenadas do técnico/unidades ao OSRM/FOSSGIS, que registra consultas em logs. Nenhuma migração ou deploy D106 executados enquanto essa resposta não chega. Ver docs/05-qualidade/ROTAS_RUAS_2026-11-12.md.


D-106 — autorização recebida em 12/11/2026: responsável respondeu “Sim, usar OSRM/FOSSGIS” à pergunta que especificava envio apenas de posição do técnico/coordenadas das unidades e retenção das consultas nos logs do provedor. Impedimento de autorização resolvido; publicação real autorizada.


D-106 — resolvido: autorização do OSRM/FOSSGIS, migração 0028 e publicação real concluídas em 12/11/2026. Sem bloqueio de implantação. Conferência em campo com técnico ativo permanece como aceite de uso: no momento da checagem root havia zero posições recentes. Demais pendências Android/FCM e fases anteriores preservadas.

## D-108 — consumo diário e recuperação após cota D1, 12/11/2026

Plano gratuito mantido por decisão explícita. Pendentes: confirmar recuperação após reset, implementar/testar otimizações, medir linhas lidas/escritas por dia UTC e capacidade com cinco usuários e crescimento de agentes; conferir orçamento após publicação durante dias completos. [Plano e metas propostas](../06-entregas/PLANO_REDUCAO_CONSUMO_D1_GRATUITO_2026-11-12.txt). Limiares/avisos são propostas, não recursos ativos. Não houve deploy, migração, cobrança nem alteração de intervalos nesta entrega documental.

D108 — avanço posterior: implementação local e 250 testes aprovados; rota,
GPS, alertas e indicadores conferidos em navegador isolado. Migração/publicação
autorizadas após reset; aguardando horário. Consumo da rede atual em produção
e dia UTC completo continuam pendentes. Ensaio de crescimento não garante
franquia para 200 agentes: cinco painéis por oito horas mais cron já projetam
5,33 milhões de leituras, sem demais tráfegos. Não reduzir frequências nem
contratar plano sem decisão posterior. Ver registro de qualidade D108.

D108 — resolvidos em 12/11 após 21h Fortaleza: recuperação, backup, migração 0030,
publicação dos dois Workers, conferência root, cron e primeira medição remota.
1.521→162 leituras no conjunto de duas consultas; 250 testes locais e 65 checks
públicos aprovados. Permanecem: consumo de dias UTC completos com uso efetivo,
margem de crescimento e GPS Android em campo/tela bloqueada. Não havia técnico
com posição recente na conferência noturna; função não foi desligada.

## D-110 — redução das leituras repetidas

Correção autorizada de resultados/unidades, com comparação na mesma cópia do banco e regressões de publicação, revogação, comunicação e demandas. Acompanhar estado de publicação no [registro D110](../05-qualidade/REVALIDACAO_D1_2026-11-12.md). Permanecem pendentes os dias UTC completos com tráfego real e a margem para crescimento; ensaio de consultas não é consumo diário. Homologação GPS Android físico/tela bloqueada permanece distinta, sem desativar localização ou alertas.

D-110 — resolvidos nesta entrega: correção, migração 0031, publicação do painel, regressões e conferência root real. Pendência de volume diário/crescimento permanece; localização/alertas continuam habilitados e não se declarou teste físico noturno sem técnicos ativos.

## D-111 — Controle das coletas, 13/11/2026
Implementação, testes, migração e publicação concluídos; [registro de qualidade](../05-qualidade/CONTROLE_COLETAS_2026-11-13.md). Classificações de completa serão feitas pelo root após sua conferência real; não foram herdadas das visitas concluídas. Pendência operacional: login root para conferir a nova tela em produção (sessão expirou). Demais pendências, inclusive homologação GPS Android e evolução visual do APK, permanecem fora desta entrega.

D-111 — pendência operacional resolvida em 13/11/2026 às 08:39 Fortaleza: responsável renovou o login root; menu, listagem, filtros, busca por Alana Ludmila, diálogo de classificação e histórico conferidos em produção. Nenhuma classificação real foi modificada durante os testes. Capturas e limites no registro de qualidade.

## D-113 — integração do redesenho técnico, 13/11/2026
Resolvidas por resposta explícita: preservar páginas extras com atualização sob demanda; abrir demanda permitida pelos Avisos mesmo fora da página atual/concluída. Pendentes de implementação: integração visual, tratamento de texto editado após envio incerto, respostas atrasadas entre abas e paginação; medir consumo com folha aberta. Homologação Android física permanece pendente. Revisão local não publicou nem gerou APK. Ver [revisão](../05-qualidade/REVISAO_REDESENHO_APP_TECNICO_2026-11-13.txt).

D-113 — atualização posterior: integração e correções locais concluídas; APK 1.0.1 compilado/assinado, 286 testes e dois roteiros de navegador aprovados. Polling não consulta fila enquanto a folha está aberta; extras não são relidos periodicamente. Restam publicação autorizada/conferência real e homologação no Android físico (atualização, teclado, GPS, tela bloqueada, bateria e avisos). [Qualidade](../05-qualidade/APP_TECNICO_D113_2026-11-13.md), [roteiro de instalação e testes](../06-entregas/SEMED_TECNICO_1_0_1_INSTALACAO_E_TESTES.txt). Localização entre demandas segue adiada.

D-113 — publicação resolvida por autorização explícita em 13/11 às 17:07 Fortaleza: versão `f9329df4-d5d7-4d24-953c-f9ce056a5914`, APK 1.0.1 disponível, 62 checks públicos aprovados. Login visual e impedimento de root não habilitado como técnico conferidos no navegador. Restam conferência autenticada com técnico real e homologação Android física; não se alterou capacidade de conta para testar. A localização entre demandas continua adiada.
