# Estado D129 — 17/11/2026

Complementa [D128](19_ESTADO_ATUAL_D128.md). Na página da unidade, **Registrar nova demanda** aparece junto ao nome para o root. Modal com unidade fixa, necessidade, tipo e técnico habilitado; gravação atômica, aviso no aplicativo e fechamento após confirmar. [Contrato](../03-painel-desktop/REGISTRAR_DEMANDA_UNIDADE_D129.md), [testes e publicação](../05-qualidade/DEMANDA_UNIDADE_D129_2026-11-17.md).

Publicado às 07:13:17 Fortaleza após autorização específica. Painel `0933006b-fd3a-4b90-9622-2c037d0a46fc` em 100%; commit funcional `c1c5e71`, branch `codex/registrar-demanda-unidade-d129`. Coletor `a1ff9077-58ac-4799-b733-5d88605c58da`, APK 1.0.4 e 37 migrações preservados. 372 testes gerais, quatro roteiros de navegador, empacotamento e 11 verificações HTTP aprovados. Root conferiu o modal real na EMI ALANA LUDMILA, com sete técnicos; fechou sem salvar.

Sem polling adicional nem mudança de localização/alertas. Atendimento geral pode coexistir com outras demandas e funcionar em unidade com agente. D128 conserva exclusividade da designação de coleta e seus papéis. D095 conserva destino Central para unidade com demanda aberta; atalho D129 fica na página da unidade. Nova atribuição não inicia GPS sem aceite.

Na migração física, preservar transação de demanda + histórico + atribuição + aviso + auditoria, recibos por operação/autor/conteúdo e nonce de tentativa. Propósito `unit_request` no contexto distingue atendimento geral de `collection_agent_link`. A classificação de coleta, fotos, fichas e regras de fila não são alteradas. Retorno possível ao Worker D128, mantendo as demandas já criadas na Central.
