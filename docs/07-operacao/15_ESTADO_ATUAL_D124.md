# Estado após D124 — 16/11/2026

Complementa o [estado D123](14_ESTADO_ATUAL_D123.md). A auditoria integral não está encerrada.

Publicados ambos os Workers, 100%: painel `f5bd0e31-d36d-4026-b086-cae6e4dd9425` às 05:51:08 e coletor `2a7e6a3f-4b5c-4f2e-bee0-5aa2d75ead8b` às 05:51:45 Fortaleza. Commit funcional `61b6f3e`; branch `codex/correcoes-coleta-fotos-2026-11-16`. Nenhuma migração: permanecem 35. APK 1.0.4 e agente Windows preservados.

Coleta: conflito interrompe repetição automática do assunto e permite comparação/recuperação explícita; cópia anterior permanece somente na aba. ACK repetido não duplica registros nem confirma rascunho como ficha completa. Salvamento inalterado não cria versão redundante. Categoria encerrada, ambiente inválido e fotos em envio recebem validação no servidor.

Fotos: ID Drive reservado antes do envio; tentativas concorrentes reutilizam o mesmo arquivo. `storage_ref` preenchido em foto pending não significa ready. Renovação de token respeita revogação e concorrência. HEIC funciona sob a CSP do coletor embutido; erro de conversão devolve os controles. Miniatura ilegível tenta o original; manutenção para recriar derivadas fica nas Configurações, exclusiva do root. Não foi executada manutenção em fotos reais como teste.

343 testes gerais e 78 verificações HTTP aprovados; cenários de navegador e limites detalhados no [registro de qualidade](../05-qualidade/COLETA_FOTOS_D124_2026-11-16.md). Conferência visual pelo agente de desenvolvimento na sessão root confirmou a integração conectada e a lista da Coleta carregada; isso não representa aceite físico do responsável. GPS/tela bloqueada/câmera física não foram homologados nesta entrega.

Backup anterior validado em restauração isolada; arquivos privados ficam fora do Git. Reverter apenas código não requer restaurar banco. Atualização web recebida ao reabrir o APK após terminar os envios, sem desinstalar ou limpar dados.

Permanecem: decisões sobre retenção/órfãos, legado, revisitas e conflitos gerenciais; validação integral de miniatura no servidor, consultas globais de fotos e homologação Android. Sem mudanças de plano, frequências, alertas ou localização. Não certificar capacidade gratuita para 101–300 agentes com estes testes.
