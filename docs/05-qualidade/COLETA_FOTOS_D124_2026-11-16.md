# D124 — integridade da coleta e fotografias, 16/11/2026

Status: publicado nos dois Workers em 16/11/2026, após autorização explícita; verificações locais, HTTP e conferência autenticada concluídas. Limites e itens residuais permanecem registrados abaixo.

## Escopo, fontes e aceite

Lidos: 00_LEIA_ANTES_DE_TUDO, precedência, decisões, pendências e conflitos; Base de Coleta integral e seus cinco documentos de telas/transições/catálogo/fotos/visual; referência mobile; cinco referências desktop, consulta de equipamentos e Mesa de Dados; modelo/diagramas, Drive, miniaturas D072, D089, D114–D116, D120 e D123. A identidade posterior branca/preta/vermelha/laranja permanece. A Base original não é alterada.

Pedido: corrigir coleta/fotos, testar e publicar preservando dados, permissões e localização. Arquivos: rotas collector/v2/v3, igualdade de respostas, armazenamento Drive/miniaturas, CSP do coletor embutido, fila/formulário/preparo de fotos, apresentação de respostas e miniaturas desktop. Sem migração, novo segredo, mudança de plano, APK ou EXE.

Aceite: resposta perdida não duplica equipamento/foto; conflito real mantém texto e exige recuperação explícita; foto pending impede conclusão no servidor; HEIC válido funciona sob CSP de /app/coleta/v3; miniatura ilegível usa original; permissões e GPS D114/D115 permanecem; nenhuma exclusão/classificação/envio fictício em produção.

## Comportamentos corrigidos

| Auditoria | Entrega e limite |
| --- | --- |
| AUD-010 | Respostas de links ocultas por Internet = Não não geram achados novos nem aparecem como respostas atuais no painel. Valores armazenados permanecem para consulta após mudar novamente para Sim. Sem reescrever achados históricos. |
| AUD-011 | Conflito suspende autosave desse assunto; recuperação compara a versão local e a recebida. Recarregar é explícito, com cópia do texto anterior consultável nesta aba. Não é armazenamento offline durável. |
| AUD-012 | Corpo do rascunho iniciado pela foto fica congelado até o ACK; repetição/reconciliação recupera o ID sem perder a edição feita durante o envio. |
| AUD-014 | Drive 401 invalida apenas a credencial rejeitada, renova e repete uma vez. Não repete indefinidamente nem recupera uma autorização revogada. |
| AUD-015 | Revisão lista envios pending e o UPDATE de conclusão também os impede atomicamente no V3. Fotos opcionais continuam opcionais quando nenhum envio foi iniciado. Política de envio legado em visita já concluída não foi redefinida. |
| AUD-016 | CSP permite o Worker blob local do conversor HEIC; falha vira mensagem legível e devolve câmera/galeria. Sem ampliar geolocalização do iframe da coleta. |
| AUD-037 | Salvar sem mudança na mesma visita não aumenta versão nem histórico. Conferência equivalente em outra visita é registrada como verificação sem alteração, mantendo autoria. Mudança real de posição mantém seu evento próprio. |
| AUD-038 | ACK legítimo repetido de assunto/equipamento é reconhecido por versão imediatamente seguinte, autor, visita e conteúdo equivalente. Rascunho não confirma ficha completa. Comparação gerencial de conflitos pelo root continua decisão separada. |
| AUD-039 | Categoria de origem concluída também bloqueia troca; validação antecipada e guarda transacional preservam o cartão encerrado. |
| AUD-040 | Nome de ambiente que não é texto é recusado. Regra para criar ambiente com B concluído permanece pendente, sem reinterpretar D043/D044/D074. |
| AUD-041 | ID do arquivo Drive reservado e persistido antes do upload; tentativas simultâneas usam o mesmo ID. HTTP 409 recupera apenas arquivo com photoId/hash correspondente. Um arquivo, uma evidência. |
| AUD-042 | Renovações simultâneas são compartilhadas no mesmo isolate; gravação condicional impede resposta atrasada de sobrescrever credencial vencedora ou restaurar revogação. Não é cache de autorização. |
| AUD-043 | Fallback único para original no coletor e galeria parcial; root pode recriar derivadas em lotes de 20 nas Configurações. JPEG com cabeçalho aceitável mas corpo indecodificável ainda requer validação integral no servidor; esta entrega evita bloqueio permanente da visualização, sem afirmar que valida a derivação da imagem. |
| AUD-044(a) | Original no coletor deixa de selecionar thumb_blob. Otimização da galeria global e do índice de manutenção (b/c) fica na frente de orçamento D1, não encerrada aqui. |

A reserva de IDs segue o contrato oficial do [Google Drive](https://developers.google.com/workspace/drive/api/guides/manage-uploads#use_a_pre-generated_id_to_upload_files). Fotos completas continuam privadas; somente derivadas D072 no D1. Nenhum token entra no cliente.

## Testes e limites

Banco SQLite isolado com todas as migrações, Worker real e Drive simulado. Suite geral e relatórios de navegador registrados nesta entrega; ver resultados finais abaixo. Regressões cobrem permissões, sessão, CSRF, localização contínua, alertas, campos, QR e publicação de visitas. Não houve ensaio destrutivo com dados reais.

Navegador Edge em 390×844 e 1440×1000: resposta perdida durante foto, edição posterior preservada, conflito de assunto/cópia legível, HEIC inválido recuperável e válido sob CSP do app, fallback de miniatura, manutenção root, foto 12 MP e 50 miniaturas. Câmera/GPS/tela bloqueada de Android físico não são homologados por estes testes.

Comparação com composição aprovada: estados e botões mantidos; diálogo de conflito usa a identidade atual e não mostra campos de código. A fachada continua com ação no rodapé; área útil nativa D117 intacta. Evidências sintéticas: `evidencias/coleta-fotos-d124-2026-11-16/`.

## Consumo por operação

Leitura de original: 2 consultas de domínio + 1 chamada Drive; ETag válido: nenhuma chamada Drive. Miniatura válida: 2 consultas e zero Drive, preservados. Primeiro upload com pasta existente: passa de 9 para 12 instruções SQL e de 1 para 2 chamadas Drive, pois reserva um ID estável antes de enviar. Esse pequeno custo de escrita evita arquivos duplicados; não se apresenta como redução global do D1. Repetição de foto já ready: zero chamadas Drive. Doze renovações simultâneas no ensaio: uma chamada OAuth, uma atualização vencedora. Contagens SQL não equivalem a linhas faturadas pelo D1.

Ensaio de 50 miniaturas: 441.137 bytes, sem consulta Drive após aquecimento; rede simulada 4G 1.193 ms / Fast3G 3.095 ms. Tempos do ambiente local, sem promessa de tempo para todos os celulares.

## Preservação e reversão

Backup prévio privado: 17.184.370 bytes, SHA-256 `a776c3c51d10f13ddcd4959f1a3767322ed65789fd08b90c473acefe856561fc`. Restore isolado: integridade OK, zero violações FK, 101 tabelas. Não versionar dump/links de exportação.

Código anterior: painel `18d3d61f-95a5-4d2e-be68-91d5cc9db168`; coletor `d6c93492-67d6-4c3c-9981-ca36e40412dc`. Rollback de código não exige restauração de dados. Não sobrescrever contribuições novas com backup. Storage_ref agora pode conter um ID reservado em uma foto pending; isso não a torna ready.

## Pendências preservadas

Retenção e limpeza de pendentes/órfãos; envio tardio em visita legada concluída; leitura gerencial de conflitos; fluxo de criação com B concluído; revisitas; validação integral de miniatura no servidor; otimizações globais AUD-044(b/c); auditoria de outras áreas e homologação física. Não apagar fotos, purgar históricos ou mudar classificação de coleta como parte desta publicação.

## Publicação e resultado final

Commit funcional: `61b6f3e`, branch `codex/correcoes-coleta-fotos-2026-11-16`.

| Destino | Versão ativa (100%) | Horário Fortaleza, 16/11/2026 |
| --- | --- | --- |
| Painel | `f5bd0e31-d36d-4026-b086-cae6e4dd9425` | 05:51:08 |
| Coletor | `2a7e6a3f-4b5c-4f2e-bee0-5aa2d75ead8b` | 05:51:45 |

343/343 testes gerais aprovados; 22 cenários de concorrência, quatro cenários novos de navegador e regressões de coleta V3, miniaturas e app unificado aprovados. Build e dry-run dos dois Workers aprovados. Após publicação: 78 verificações HTTP aprovadas (51 painel, sete limites de localização, 14 app/APK, seis coletor), sem gravar registros oficiais. A primeira gravação local do resultado do coletor encontrou a pasta de evidências ainda não criada; repetição concluída com seis aprovações. Não foi falha do serviço publicado.

Conferência autenticada como root: Configurações mostrou Drive conectado e os controles de gerar/recriar miniaturas; /app abriu a Coleta e carregou a lista de unidades. A conta root observada oferece Coleta conforme sua habilitação, sem conceder capacidade técnica nova. Nenhuma visita foi iniciada, resposta alterada ou miniatura real recriada durante esta conferência. Os cenários de escrita, concorrência, falha e recuperação foram exercitados no ambiente isolado. Homologação física no celular continua distinta dessa verificação.

Sem migração; 35 migrações existentes preservadas. APK 1.0.4 mantido, SHA-256 remoto `f258f5f8a483a52d092d9a0d4d8bceba89654256524dae24a28b369c397a82a5`. Para receber o código web atualizado, terminar os envios em andamento e reabrir o aplicativo; não desinstalar ou limpar seus dados. Permissões, localização D114/D115, alertas e plano gratuito mantidos.

Evidências: [resultados locais](../../evidencias/coleta-fotos-d124-2026-11-16/testes.json), [HTTP painel](../../evidencias/coleta-fotos-d124-2026-11-16/producao/release.json), [limites de localização](../../evidencias/coleta-fotos-d124-2026-11-16/producao/tracking-boundaries.json), [app/APK](../../evidencias/coleta-fotos-d124-2026-11-16/producao/mobile-release.json), [coletor](../../evidencias/coleta-fotos-d124-2026-11-16/producao/collector.json).
