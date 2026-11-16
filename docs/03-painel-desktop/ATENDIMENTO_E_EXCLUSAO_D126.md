# D-126 — unidade com aceite e exclusão de demandas

16/11/2026. Autorização expressa: implementar sinalização após o aceite e botão Excluir demanda exclusivo do root, testar e publicar preservando histórico e localização.

## Comportamento aprovado

- Um aceite confirmado no aplicativo muda o anel externo da unidade para azul `#2563EB`. Significa **a caminho ou em atendimento**, sem botão de chegada, geocerca ou conclusão inferida por GPS.
- Cor central continua representando o tipo da unidade; hardware sem parecer conserva o círculo vermelho. O anel permanece com 48 px, pulso discreto de três segundos, suporte a movimento reduzido e leitura desatualizada explícita.
- A unidade aparece uma vez: dois técnicos na mesma demanda não duplicam a contagem. Outras demandas ainda pendentes continuam contadas. Sem aceite ativo, volta ao verde-petróleo; sem demandas, remove o anel.
- Aceite tem estado operacional independente da sessão/GPS. Falha de GPS ou vencimento de login não equivale a conclusão. Pausa explícita, conclusão, retirada da atribuição, exclusão ou revogação de acesso removem a sinalização correspondente. Outro aceite do mesmo técnico substitui o anterior. Na migração, somente atendimentos ainda abertos são projetados; não reconstruir aceites já encerrados.
- Clique continua abrindo a Central filtrada pela unidade (D095), inclusive teclado/sobreposições. Nenhum modal automático.

## Excluir demanda

Root encontra **Excluir demanda** na linha da listagem. Prévia exibe unidade, descrição, técnicos e efeito sobre o restante da fila. Exige motivo e confirmação. Nova atribuição/aceite/edição/ordenação durante a prévia causa conflito: reabrir a prévia antes de confirmar.

A operação cria registro imutável de exclusão e mantém a ficha original, número, contexto, eventos, autores e pareceres de hardware. Excluída não significa Concluída. A listagem normal, indicadores, planejamento, equipamentos, roteiro e atendimento técnico passam a ler apenas demandas não excluídas. Root consulta as retiradas em **Situação → Excluídas · histórico**, sem edição/reabertura. Admin e demais perfis não podem excluir nem consultar esse arquivo.

Todos os efeitos são uma transação: registro de exclusão, auditoria, evento do atendimento, avisos aos atribuídos, encerramento de aceites/atribuições, contadores e invalidação de rotas. Repetir o mesmo envio após perda do ACK não duplica efeitos. Uma falha reverte tudo.

Se houver outras demandas atribuídas, o acompanhamento contínuo D114 já iniciado é preservado, com a mesma credencial e posição; remove apenas o destino excluído. Sem atribuições abertas restantes, o acompanhamento termina e posições/rotas são removidas. Não iniciar GPS de quem ainda não aceitou nem criar trilha de deslocamentos. Clientes antigos/navegador continuam com seu ciclo D105. O aviso utiliza a infraestrutura existente, sem promessa de push instantâneo.

## Implementação e orçamento

- Migração aditiva `0037_demand_activity_archive.sql`: `service_request_deletions`, visão `service_requests_active`, projeção pequena `dispatch_service_activity` e triggers. Tabelas canônicas anteriores permanecem intactas.
- `server/demand-deletion.mjs`: GET `/api/operations/request-delete-preview?id=…`; POST `/api/operations/request-delete`. Sessão/CSRF são verificados pelo Worker, papel root novamente no módulo. Recebimento exige versão da demanda e revisão do roteiro.
- Sinalização reutiliza `/api/inventory/panel-status` e `pending-summary`, com `demands.units[].accepted`. Contagem lê projeções D123 e aceites atuais; não percorre GPS, snapshots ou eventos de atendimento. Sem novo polling, serviço pago ou alteração de frequência.
- Alterações de interface em operations, mapa, legenda e consulta histórica do alerta de hardware. APK 1.0.4 permanece; agente Windows, coleta, fotos e armazenamento não mudam.
- Publicar somente o Worker do painel depois da migração compartilhada. Coletor atual não usa estas rotas e permanece compatível.

## Operação e retorno

Backup privado antes de migrar; restaurar e conferir em isolamento. Nunca excluir demanda oficial para testar. Depois de haver exclusões reais, **não voltar a um Worker anterior sem suporte ao arquivo**, pois ele voltaria a exibir as fichas preservadas como pendências. Usar correção compatível ou retorno que preserve a filtragem; não remover a migração nem restaurar banco sobre contribuições posteriores.

Este trabalho não decide retenção da auditoria geral, paginação global, fluxo de chegada ou outras pendências do item 19. [Testes e publicação](../05-qualidade/DEMANDAS_D126_2026-11-16.md).
