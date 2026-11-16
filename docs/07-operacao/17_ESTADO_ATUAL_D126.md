# Estado D126 — 16/11/2026

Complementa [D125](16_ESTADO_ATUAL_D125.md). [Contrato](../03-painel-desktop/ATENDIMENTO_E_EXCLUSAO_D126.md) e [estado efetivo de publicação](../05-qualidade/DEMANDAS_D126_2026-11-16.md).

Anel azul após aceite da demanda; exclusão exclusiva do root com arquivo imutável, motivo e autoria. Migração 0037 mantém ficha/eventos anteriores e atualiza projeções/filas atomicamente. Localização D114 continua enquanto restar atribuição aberta; a última retirada encerra acompanhamento. Sem novo polling, mudança de plano, APK, EXE ou perguntas da coleta.

Para migração física, manter a visão `service_requests_active` nas consultas operacionais, contadores e triggers de exclusão. Não apagar registros canônicos nem traduzir exclusão como conclusão. Preservar arquivo, recibos, avisos e a mesma atomicidade. Não fazer rollback para uma aplicação que desconheça demandas excluídas após uso do recurso.

As decisões gerais de retenção/arquivamento da auditoria e paginação (item 19) continuam pendentes; D126 não as altera.
