# Análise de migração para servidor físico — SEMED

**PROPOSTA TÉCNICA · não implantada.** Referência do sistema: D-110, código funcional `5cb844b`, 12/11/2026. Branch `codex/analise-migracao-servidor-fisico`. O pedido desta entrega é preparar a transferência e documentar o trabalho; não foi feito corte, contratação, nova instalação ou alteração de produção.

A migração é viável, mas **copiar a pasta do site para um computador não basta**. Faltam runtime HTTP, persistência compatível, operação contínua, continuidade dos endereços dos agentes/APK e ensaio de recuperação. A proposta inicial é manter o modelo SQLite e o Drive, adaptando a execução para Linux/Node. Essa escolha ainda precisa ser aprovada e medida; PostgreSQL é uma alternativa com maior trabalho de conversão.

## Leitura por objetivo

| Documento | Conteúdo |
|---|---|
| [01 · Topologia e opções](01_TOPOLOGIA_E_OPCOES.md) | Atual versus proposto; SQLite/PostgreSQL, borda Cloudflare, etapas |
| [02 · Servidor e acesso](02_SERVIDOR_REDE_E_ACESSO.md) | Dimensionamento inicial, SO, rede, DNS/TLS, SSH e responsabilidades |
| [03 · Adaptação do código](03_ADAPTACAO_DO_CODIGO.md) | Mapa de alterações, bindings, API, transações, assets e contratos |
| [04 · Banco e recuperação](04_BANCO_E_RESTAURACAO.md) | 31 migrações, 88 tabelas, exportação/importação, backup e consistência |
| [05 · Fotos e segredos](05_DRIVE_SEGREDOS_E_SEGURANCA.md) | Drive privado, miniaturas, OAuth, autenticação e cópias privadas |
| [06 · Agentes e Android](06_AGENTES_APK_E_ENDPOINTS.md) | Endpoints fixos, assinatura, QR, IP/provedor e atualização segura |
| [07 · Rotinas e desempenho](07_ROTINAS_LOCALIZACAO_E_DESEMPENHO.md) | Cron, hardware, GPS, ruas, relatórios, monitoramento e carga |
| [08 · Corte e retorno](08_CORTE_RETORNO_E_HOMOLOGACAO.md) | Ensaio, bloqueio de escrita, testes, critérios de parada e rollback |
| [09 · Backlog e decisões](09_BACKLOG_E_DECISOES.md) | Tarefas por entrega, prioridades e decisões do responsável |
| [10 · Checklist de transferência](10_CHECKLIST_TRANSFERENCIA.md) | Formulário para equipe receptora e registro de aceite |
| [TXT completo](PLANO_COMPLETO_MIGRACAO.txt) | Todos os dez capítulos reunidos para leitura/edição |
| [Validação documental](VALIDACAO_DOCUMENTAL.md) | Testes executados e limites da entrega |

## Referências factuais do código atual

- [Estado atual e versões publicadas](../07-operacao/11_ESTADO_ATUAL_D110.md).
- [Mapa funcional dos módulos](../07-operacao/12_MAPA_CODIGO_E_FLUXOS.md).
- [Índice de arquivos/API](../07-operacao/gerado/CODIGO_E_ROTAS.md) e [manifesto estático JSON](../07-operacao/gerado/codigo.json).
- [Dicionário físico](../07-operacao/gerado/DICIONARIO_DADOS.md) e [schema, índices, triggers e hashes SQL](../07-operacao/gerado/schema.json).
- [Regras aprovadas](../00-governanca/DECISOES.md) e [pendências](../00-governanca/PENDENCIAS.md).

O catálogo físico foi reproduzido sem dados reais. Os testes existentes passaram no ambiente atual, não num servidor físico novo. A documentação distingue **ATUAL**, **PROPOSTA** e **A IMPLEMENTAR**; nenhuma sugestão concede automaticamente autorização para mudar regra de negócio, encerrar coleta, apagar histórico ou recriar identidade de agente.

## Situação de prontidão

| Item | Estado nesta entrega |
|---|---|
| Código, SQL, fontes Android, testes e documentação | Versionados no Git |
| Mapa de dependências e plano de migração | Documentados nesta branch |
| Servidor, domínio e acesso de implantação | Ainda não definidos/fornecidos para este plano |
| Runtime HTTP fora de Workers | A implementar |
| Adaptador de banco para produção física | A implementar e testar |
| Continuidade dos hosts dos agentes/APK | Estratégia a aprovar; exige implementação |
| Backups reais, Drive, cofre, chave Android e EXE | Materiais privados; não acompanham clone |
| Restauração integrada e homologação no destino | Não executadas |
| Mudança de DNS/corte/desativação D1 | Não executados |

O plano gratuito e os serviços atuais permanecem enquanto a preparação é feita. Servidor próprio transfere responsabilidade de energia, internet, disco, atualizações e recuperação para a instituição; não equivale a operação sem custo nem elimina automaticamente a Cloudflare dos clientes instalados.
