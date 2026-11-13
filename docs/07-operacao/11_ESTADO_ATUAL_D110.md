# Estado técnico para transferência — D-110

Referência: 12/11/2026. Código funcional-base `5cb844b`; alterações posteriores desta entrega são documentação/ferramentas de documentação. Fonte: código, Wrangler, migrações, decisões até D-110 e registros de qualidade. Não é inspeção contínua da produção.

## Publicações e interfaces

| Componente | Estado registrado / função |
|---|---|
| Painel | Worker `painel-semed-paco`, versão `abcfcb97-c87a-4988-b9a1-c051534c31bf`, 100%, 12/11 22:43 Fortaleza |
| Coletor | Worker `inventario-semed-lumiar`, versão preservada `c678978a-9e71-4cab-a2dc-9744ec6d6e1c`, 100% |
| Técnico | `/tecnico` e APIs no Worker do painel; APK Android Java/WebView com localização nativa |
| Windows | Agentes chamam o host do coletor; identidade assinada independente da sessão humana |
| Banco | D1 compartilhado; 31 migrações, 88 tabelas de aplicação, 58 índices explícitos, duas views, 68 triggers |
| Fotografias | Drive privado; referência/estado no D1, miniaturas derivadas limitadas no D1 |
| Avatares | Drive privado; D1 conserva metadados/eventos, não o PNG |
| Medidor | Analytics oficial, cache KV; somente root, atualização de cinco minutos |

[Registro da última publicação](../05-qualidade/REVALIDACAO_D1_2026-11-12.md). `d1_migrations` e outros objetos internos não entram na contagem das tabelas de aplicação. Uma restauração precisa considerar os metadados de migração separadamente.

## O que o clone permite e o que não permite

Permite reconstruir frontend, executar regras e testes isolados, reproduzir esquema e inspecionar o backend completo versionado. **Não existe servidor Node autônomo pronto**: `server/worker.mjs` depende de bindings Cloudflare e não abre uma porta HTTP. `pnpm start` é apenas prévia estática. Adaptadores de testes não são servidor de produção.

O clone não traz banco real, arquivos privados do Drive, segredos, sessões, EXEs privados nem chave de assinatura Android. O build desktop pode concluir sem incluir APK quando o binário privado não existe; isso não comprova que o download Android esteja entregue. Receber esses materiais por canal privado e registrar hashes de recuperação fora do Git.

## Regras que a migração precisa manter

- Root/admin/operador/visualizador continuam com permissões verificadas no servidor. Habilitação de técnico é uma capacidade individual, não substitui os quatro perfis.
- Sessões dos dois hosts são independentes; usuários e hashes compartilhados. Preservar `AUTH_PEPPER` e chave de tokens Google; não gerar novos valores sobre um banco importado.
- IDs de unidades, ambientes, equipamentos, instalações e fotos não mudam. Fotos e vínculos permanecem quando o nome é corrigido; exclusão administrativa de equipamento é arquivamento com histórico.
- Rascunho recebido, assunto concluído e visita publicada são estados diferentes. Painel apresenta PARCIAL explicitamente, sem promover rascunhos durante importação.
- Atualização de máquina por agente não substitui localização humana. Vínculo ao cadastro exige usuário autenticado, mesmo no cadastro automático sem autorização de lote.
- Coleta pode ser continuada por outro operador. Concorrência, versões, trava por ficha e recibos idempotentes permanecem.
- Demandas têm até dois técnicos, ordem do root e uma ativa por técnico. Qualquer integrante conclui para a equipe, com autoria. Localização só durante atendimento autorizado e é removida ao encerramento/revogação.

## Relógios, frequências e agendamentos

| Fluxo | Comportamento atual a preservar |
|---|---|
| Painel operacional | Atualizações de 15 s quando visível; leituras compartilhadas e pausa em aba oculta |
| Pulso de rede / escolas | 60 s; falha não vira zero/offline artificial |
| Heartbeat | Padrão 300 s, configurável no servidor; presença recente padrão 17 min |
| Perda de comunicação | Incidente após mais de 48 h; log separado, fora do sino |
| Hardware | Alteração confiável, deduplicada; sino/parecer/demanda e sinais do mapa |
| Cron de minuto | Monitor de agentes, emissão semanal quando devida, limpeza de posições; medidor respeita janela de 5 min |
| Cron diário | `23 3 * * *` UTC, 00:23 Fortaleza; retenção de agentes |
| Relatório de provedores | Segunda 08:00 Fortaleza (11:00 UTC), snapshot semanal imutável, uma linha por unidade |
| APK | Solicita GPS por intervalo/distância; avisos periódicos Android não equivalem a push imediato |

Horários técnicos persistidos seguem os contratos de cada campo (época/unidade/formato no código). Não converter indiscriminadamente milissegundos em segundos. Sincronizar relógio do host, pois afeta assinaturas, expiração, GPS, sessões e cron.

## Consumo e limites documentados

D-108 usa projeções e índices para reduzir varreduras, mantendo monitoramento incremental. D-110 revalida resultados por revisão/ETag e reutiliza catálogo estável; autorização, presença e demandas são lidas novamente. A migração 0031 contém 33 triggers e duas revisões; não apagar essas estruturas como limpeza.

Na comparação D-110 com o mesmo conjunto de dados, atualizações sem alteração passaram de 445 para 1 linha de negócio em resultados e de 463 para 217 em unidades. Primeiro carregamento é mais caro. Não transformar essa medição em garantia de capacidade, quota diária ou dimensionamento de servidor. [Medição, limites e testes](../05-qualidade/REVALIDACAO_D1_2026-11-12.md).

## Entrega privada necessária

| Material | Finalidade / cuidados |
|---|---|
| Exportação consistente D1 + hashes + versão de esquema | Restauração isolada; inclui dados sensíveis e tokens cifrados |
| Inventário Drive + cópia recuperável + manifestos ID/arquivo | Fotos completas e avatares; não basta exportar SQL |
| Segredos correspondentes | `AUTH_PEPPER`, cliente/segredo OAuth, `GOOGLE_TOKEN_KEY`; cofre separado do backup |
| Credenciais de operação | Cloudflare/Google e novo servidor, acesso delegado; não no README |
| APK publicado + keystore/configuração de assinatura | Atualizar o aplicativo existente sem outra identidade de assinatura |
| EXE distribuído + fonte/build/configuração exatos | Confirmar atualização do endpoint e compatibilidade das máquinas instaladas |
| Evidências privadas e inventário de endpoints instalados | Homologar versões reais; não presumir versão única de EXE |

Instalador escolhido e candidatos posteriores: [registro oficial](../04-dados-apis/INSTALADOR_OFICIAL.md). Não usar a escolha histórica como prova de homologação. Preparar restauração sem executar `/PURGE`, revogar agentes ou recriar chaves nas máquinas.

## Decisões futuras

Servidor/SO, banco no destino, domínio/DNS, manutenção ou retirada da borda Cloudflare, continuidade dos endpoints do EXE/APK, RPO/RTO, cópia externa e janela de corte ainda precisam ser definidos. A análise na branch de migração é proposta técnica; a produção permanece Cloudflare/Drive até uma implantação específica aprovada e validada.
