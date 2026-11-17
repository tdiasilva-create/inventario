# Estado D128 — 17/11/2026

Complementa [D127](18_ESTADO_ATUAL_D127.md). Panorama → Sem agente vinculado oferece **Designar coleta** ao root. Cria uma demanda atribuída a técnico habilitado com permissão de coleta; mostra responsável/atalho na lista e impede duplicidade por unidade. [Contrato](../03-painel-desktop/DESIGNAR_COLETA_D128.md) e [testes/publicação](../05-qualidade/DESIGNAR_COLETA_D128_2026-11-17.md).

Publicado às 06:12:28 Fortaleza após aprovação explícita. Painel `3aee0153-07d0-43d1-8998-83458594c30b`, 100%; commit funcional `9b2eafa`, branch `codex/designar-coleta-d128`. Coletor `a1ff9077-58ac-4799-b733-5d88605c58da`, APK 1.0.4 e 37 migrações preservados. 369 testes gerais, nove testes D128, cinco cenários de navegador e nove verificações HTTP públicos aprovados. Root conferiu lista/busca/formulário/técnicos em produção; não houve criação real de teste.

Sem polling adicional: detalhes de designação só consultados em ações explícitas do root. Não inicia GPS sem aceite, não restringe acesso D046 à unidade e não conclui coleta/vínculo automaticamente. Localização durante fila D114 e alertas preservados.

Na migração física, preservar transação da criação + atribuição + recibos + avisos; predicado de unicidade lógica por unidade e propósito; idempotência e bloqueio de reabertura duplicada. Propósito em service_requests.context_json, sem tabela nova. Cadastro de responsável não é autorização exclusiva de coleta.
