# D-103 — correção de desempenho do painel — 12/11/2026

## Escopo e autorização

O responsável autorizou corrigir consultas repetidas/carregamento, testar, comparar com as medições anteriores e publicar no ambiente real. Coletor, EXE, cron, Drive, dados, perguntas, regras de negócio e identidade visual preservados. Sem migração ou operações de teste que alterem dados oficiais.

Documentos consultados: `00_LEIA_ANTES_DE_TUDO.md`, `AGENTS.md`, `REGRAS_DE_PRECEDENCIA.md`, `DECISOES.md`, `PENDENCIAS.md`, `CONFLITOS_DOCUMENTAIS.md`, `MESA_DE_DADOS.md`, especificações de telas/setores desktop, manifesto e cinco referências desktop, testes de qualidade existentes, `RELATORIO_DESEMPENHO_PAINEL_2026-11-12.txt` fornecido pelo responsável e [medição anterior](MEDICOES_DESEMPENHO_PAINEL_2026-11-12.txt).

Implementação e limites: [DESEMPENHO_D103.md](../03-painel-desktop/DESEMPENHO_D103.md). Roteiro de conferência: [TXT](../06-entregas/ROTEIRO_TESTES_DESEMPENHO_PAINEL_2026-11-12.txt).

## Comparação controlada local

Mesmo navegador isolado, mesma base fictícia de teste, cinco recargas, atraso artificial de 60 ms por requisição. Build anterior extraído do commit `dcbf75e`; build novo a partir desta alteração. Dados fictícios somente locais e identificados. Não são tempos de produção nem TTFB/LCP.

| Medida | Antes | Depois |
|---|---:|---:|
| Mediana até conteúdo pronto | 1.317 ms | 535 ms |
| Amostras ordenadas (ms) | 1142, 1238, 1317, 1321, 1365 | 530, 531, 535, 631, 662 |
| Arquivos JavaScript carregados no Panorama, incluindo Leaflet | 41 | 2 |
| Bytes JavaScript sem compressão | 464.962 | 386.074 |
| Consultas de leitura em cinco minutos simulados | 80 | 60 |
| SQL para pendências + monitoramento com equipamentos, incluindo autenticação | 11 | 7 |

O cenário de repouso avançou o relógio em vinte passos de 15 s. O controlador novo realizou 20 leituras de `panel-status`, sem `pending-summary`/`monitoring` periódicos antigos. Resultados: 20; resumo/frota/detalhe/ambientes: 5 cada. Uma execução anterior com testes de navegador concorrentes apresentou mediana pior; foi preservada em `local-comparison-concurrent.json` e não foi usada para concluir ganho. A execução acima foi isolada. Não extrapolar a redução de 59% local para todos os usuários/rede.

## Testes

- Suíte existente: 223/223 aprovados.
- Três testes novos de desempenho: equivalência do endpoint, redução SQL sem escrita, autenticação/perfis/primeiro acesso, política de cache e composição dos bundles.
- Navegador: blocos do painel; demandas sem reabertura; indicadores; pausa/retomada/timeout; escolas online/offline; Mesa de dados/menu; anéis/demandas no mapa; fluxo de senha/perfis; navegação; comparação controlada. Aprovados.
- Primeira troca de senha mantém acesso ao bundle da conta; APIs gerenciais continuam protegidas. Cache de código não inclui dados privados, API ou fotos.
- `wrangler deploy --dry-run` aprovado. Build e testes de documentação verificados antes da publicação.

## Produção

Painel publicado em 12/11/2026 às 06:41:01 (Fortaleza), versão `48d75e7d-b4bb-4f7d-ae56-35adf1ce461f`, 100% do tráfego, deployment `51759175-b171-499c-b987-534e76579bca`. Versão anterior: `a905bd00-0115-43ae-aa99-96058b9eac5b`. Coletor verificado por listagem de deployments: continua `2dac8571-2671-4eec-8ab0-7492753a0255`, sem nova publicação nesta fase. Nenhuma migração aplicada.

`verify-panel-release.mjs`: 51/51 verificações HTTP aprovadas. Navegação root autenticada confirmou `/bundles/desktop-GPMHWDMR.js`, matriz/categorias/indicadores, frota da SEMED com as mesmas 27 fichas e Central de demandas sem pendências. Atualização de código/CSS preservou a composição.

| Tela real — mediana de cinco recargas | Antes | Depois | Variação nesta amostra |
|---|---:|---:|---:|
| Panorama | 3.081 ms | 2.167 ms | −29,7% |
| Computadores, mesma unidade com 27 fichas | 3.395 ms | 1.761 ms | −48,1% |
| Demandas, filtro pendentes vazio | 3.188 ms | 1.617 ms | −49,3% |

Amostras posteriores: Panorama `[2017,2167,2175,1942,2197]`; Computadores `[1777,1754,1739,1963,1761]`; Demandas `[1623,1477,1617,1622,1581]`. Mesma ferramenta/navegador integrado e sessão; medições sequenciais, cache aquecido e sem simulação de rede. Incluem overhead da ferramenta, não são LCP/TTFB, não isolam servidor/rede, não medem p95 e não garantem o mesmo ganho em outra conexão. O volume de equipamentos da unidade foi conferido; telemetria em tempo real pode variar naturalmente.

Referência anterior em produção: mediana de recarga + espera de conteúdo via ferramenta de navegação (inclui seu overhead): Panorama 3.081 ms, Computadores 3.395 ms, Demandas 3.188 ms. Janela anterior de cinco minutos: 73 leituras observadas no Worker. O filtro de IP pode incluir clientes que compartilham a conexão; não é HAR exclusivo da aba. SQL remoto medido anteriormente foi rápido; não há evidência para atribuir toda a lentidão ao D1.

Evidências locais e produção: `docs/05-qualidade/evidencias/desempenho-correcao-2026-11-12/`, ignoradas pelo Git por conterem telas/dados da instituição. Nenhuma credencial foi incluída no relatório.


### Consultas em repouso após publicar

Janela real 06:43:29–06:48:29 (Fortaleza), Panorama aberto sem cliques. Tail limitado a GET/IP da estação, mesmas limitações da referência: **54 consultas**, todas 200 e nenhuma exceção observada. Antes: 73, redução observada de 26,0%.

| Rota | Antes | Depois |
|---|---:|---:|
| results | 20 | 20 |
| pending-summary | 20 | 0 |
| monitoring | 19 | 0 |
| panel-status (compartilhada) | 0 | 20 |
| summary | 5 | 5 |
| operations/units | 5 | 5 |
| inventory/unit | 2 | 2 |
| root/environments | 2 | 2 |

O log é amostrado pelo serviço, não HAR exclusivo da aba. A janela local controlada confirma a mesma redução estrutural, independentemente da variação 19/20 da chamada antiga. Métricas continuam nos intervalos aprovados.

### Conferência visual final

Foto de computador da EMI ALANA LUDMILA abriu integralmente (1600 × 1205), com vínculo/unidade corretos. Não foi alterado nem reivindicado ganho específico no transporte de fotos. Configurações terminou as leituras (50 agentes na página, sem mensagem de carregamento pendente); Cadastro de unidades exibiu as 76 unidades e o bundle `account-entry-TVQKKIGN.js`. Nenhum erro de console observado nessas conferências. Não houve cadastro, exclusão, aceite de alerta ou edição oficial durante os testes.

Screenshots preservados nas evidências: `01-panorama-publicado.png` e `02-fotografia-real.jpg`. O painel permaneceu no Panorama para conferência do responsável.

Três verificações adicionais em produção sem sessão: novo endpoint retorna 401, bundles desktop/conta redirecionam ao login (302), todos com `no-store`. Isso complementa as 51 verificações HTTP, sem usar/expor cookies.
