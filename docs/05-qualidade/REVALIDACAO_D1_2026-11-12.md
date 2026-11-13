# D-110 — consultas repetidas de resultados e unidades

Publicado em 12/11/2026, 22:43 Fortaleza (13/11 01:43 UTC).

## Pedido e escopo
Reduzir consumo de resultados/unidades mantendo plano gratuito, localização e alertas. Não altera aparência, perguntas, campos, regras de publicação, prazos de presença ou frequências. [Contrato e rollback](../04-dados-apis/REVALIDACAO_LEITURAS_D110.md).

Fontes consultadas: AGENTS.md, 00_LEIA_ANTES_DE_TUDO.md, REGRAS_DE_PRECEDENCIA.md, DECISOES.md, PENDENCIAS.md, CONFLITOS_DOCUMENTAIS.md, documentação D-103/D-104/D-108/D-109, modelo de dados e cinco fontes DOT; cinco referências desktop abertas conforme manifesto. Conferência independente CONFERENCIA_REDUCAO_D1_2026-11-12.txt confrontada com SQL e implementação. Base de Coleta original e questionário não foram modificados.

## Consumo comparado
Mesmas consultas e dados, versão anterior b573704 versus D-110. Medição local em workerd usando exportação privada do banco real, seguida de medição SQL somente leitura no D1 real via API oficial. Os números abaixo são linhas de NEGÓCIO, sem as aproximadamente duas linhas de autenticação por requisição; não são latência de navegador nem total diário da conta.

| Consulta | Antes, D1 real | Primeiro carregamento D-110 | Atualização sem alteração D-110 | Redução na atualização |
|---|---:|---:|---:|---:|
| Resultados | 445 | 447 | 1 | 99,8% |
| Unidades/comunicação | 463 | 605 | 217 | 53,1% |

Resultados 304 evitam as quatro agregações. Unidades reutilizam apenas catálogo/vínculos estáveis; presença e demandas continuam frescas. Nenhuma escrita nas consultas de medição. Respostas antes/depois equivalentes. O primeiro acesso de unidades ficou 142 linhas mais caro; o custo adicional é recuperado já na próxima consulta se o catálogo continuar reutilizável.

No workerd local: resultados 445/447/1; unidades 464/606/218. Projeção da mesma cadência do relatório, com autenticação e demais consultas constantes: 2.798 → 776 linhas/minuto por painel, redução 72,3%. Cinco painéis por oito horas: aproximadamente 1,86 milhão de leituras nesse cenário estável. NÃO inclui agentes, cron, coletor, outras telas, reabertura, edições, cold starts ou distribuição entre isolates. Não equivale a garantir franquia diária. O limite gratuito e o medidor D-109 permanecem; medir dias UTC completos com uso real continua necessário.

## Integridade e testes
- Backup privado antes da alteração: SHA-256 29718d4304c1d0a33b2cfe3a0fdba59970d48eddc50bcc28402775f05b8a24c2, 11.726.487 bytes.
- Ensaio local da migração preservou conteúdo/hash das 88 tabelas anteriores; integrity_check ok e zero problemas de chaves estrangeiras.
- Suíte final: 268/268 testes; runtime workerd de rotas aprovado; cinco testes de desempenho adicionais aprovados.
- Nove cenários D-110: revalidação com autorização fresca, usuário/unidade distintos, rascunho versus publicação, seções/visitas/equipamentos diversos, rollback, concorrência sem ETag, declaração/transferência/vínculos, passagem de prazo/heartbeat/suspensão/revogação, erro explícito/repetição e demandas abertas/concluídas sobre catálogo aquecido.
- Navegador local real: 200 inicial, 304 repetidos, 200 após publicação, 304 posterior, mapa preservado, 503 explícito, 401 invalida cache e retorno autorizado exige 200. Nenhum erro de página.
- Build desktop e Wrangler dry-run aprovados. Coletor/EXE/APK não republicados. Não foram criadas demandas, unidades ou contas fictícias em produção.

## Publicação e conferência
- Migração 0031 aplicada: duas linhas de revisão, 33 triggers; nenhuma conversão dos registros de negócio.
- Painel: abcfcb97-c87a-4988-b9a1-c051534c31bf, 100%.
- Coletor permaneceu c678978a-9e71-4cab-a2dc-9744ec6d6e1c, 100%.
- 51 verificações públicas de login/ativos/rotas privadas aprovadas.
- Navegação root real após recarga: Panorama, mapa com 76 unidades com coordenadas, resultados e medidor; Computadores com 78 cadastrados e 3 comunicando, 6 demandas abertas. Console consultado sem erros. Identidade visual preservada.
- Na conferência havia zero técnicos com posição recente e zero alterações de hardware aguardando parecer. Regressões dessas funções passaram; não se declara homologação de GPS em deslocamento/tela bloqueada nem simulação real de troca de peça nesta entrega.

Evidências agregadas locais em evidencias/d1-read-cache-2026-11-12: local-costs.json, remote-costs.json, browser.json e screenshots local-panorama.png, producao-panorama.jpg, producao-computadores.jpg. Exportação/logs de deploy ficam em private-data/d110-release, fora do Git. Não publicar dados privados ou credenciais.

Endereço: https://painel-semed-paco.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev/panorama
