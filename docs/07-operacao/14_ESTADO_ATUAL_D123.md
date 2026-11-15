# Estado após D123 — 15/11/2026

Complementa o [estado D122](13_ESTADO_ATUAL_D122.md). Não substitui a base original nem encerra as demais propostas da auditoria.

Publicados ambos os Workers: painel `18d3d61f-95a5-4d2e-be68-91d5cc9db168`, coletor `d6c93492-67d6-4c3c-9981-ca36e40412dc`, 100%, 16:40/16:41 Fortaleza. Banco com **35 migrações**; 0035 adiciona projeções e índices de consultas recorrentes. APK 1.0.4/instalador Windows preservados.

Revogação explícita encerra GPS remanescente após expiração; expiração natural continua permitida. Visualizador não acessa pareamento. Menos consultas após 401 e menos histórico redundante de heartbeat; snapshots, recibos e nonces intactos. Consultas de hardware/demandas usam projeções transacionais, sempre com autorização fresca.

331 testes gerais e 78 verificações HTTP passaram; comparação remota com respostas idênticas e menor consumo. A capacidade pretendida de 101–300 agentes no gratuito permanece não certificada, principalmente por escritas. Nenhum intervalo ou retenção de segurança foi alterado. O medidor continua em cinco minutos.

Contrato: [D123](../04-dados-apis/PERMISSOES_E_ORCAMENTO_D123.md). Evidências, métricas e rollback: [qualidade](../05-qualidade/PERMISSOES_D1_D123_2026-11-15.md). Não reverter migração ou restaurar backup sobre contribuições recentes para reverter apenas código.
