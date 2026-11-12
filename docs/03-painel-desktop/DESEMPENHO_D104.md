# D-104 — segunda rodada de desempenho, 12/11/2026

Origem: relatório externo versão 3 (seções 0–10 históricas, seção 11 após D-103), revisão técnica e autorização do responsável “vamos seguir suas recomendações”. Executar correções de mapa, coletas em andamento, leitura de fotos e instrumentação. Smart Placement será avaliado separadamente, sem ativação nesta entrega.

## Escopo e invariantes

- `desktop-map.js`: agrupar os dois eventos da mesma leitura em um quadro de desenho; comparar conteúdo/estado/coordenada antes de alterar marcadores. Evitar `setStyle`, `setRadius` e `setLatLng` quando o valor não mudou. Cor da categoria, círculo de hardware, anel de demandas, hover, teclado, sobreposições e destino do clique continuam D-087/D-094/D-095.
- `desktop-progress.js`: anexações repetidas da mesma tela durante a consulta inicial não enfileiram outra leitura. Mudança de vistoria e atualização manual continuam consultando; respostas fora do contexto não substituem a seleção. GET usa o timeout de 15 s e mensagens de erro do helper D-103.
- `photo-read.mjs`: foto/escopo e integração Drive consultados no mesmo batch D1, novamente em cada requisição. A autenticação continua anterior e independente. Três instruções SELECT, mas duas chamadas ao D1 em vez de três. Perfis que exigem verificações adicionais continuam executando-as. R2 não recebe consulta de integração Drive.
- Pedido de original seleciona metadados explícitos sem `thumb_blob`. Pedido `size=thumb` inclui o BLOB e os hashes; fallback para original e ETags preservados. Aplicado nas três rotas de leitura de fotos do painel, inclusive a rota legada `/api/collector/photo` quando executada no Worker desktop. Worker do coletor não é publicado nesta rodada.
- O registro de autorização do Drive não é armazenado em cache entre requisições. Sua leitura vem do batch da requisição atual; registro ausente/revogado impede inclusive 304/miniatura. Memo do token decifrado continua separado e condicionado à leitura atual, com identidade estável do binding D1.

## Medições

GET de API no Worker desktop inclui `Server-Timing`, com nomes fixos e valores numéricos:

- `total`: entrada do Worker até preparar os headers; não inclui transferência completa do corpo nem transporte navegador–Cloudflare.
- `auth`: consulta/validação da sessão, incluindo seu D1.
- `d1`: soma do tempo observado aguardando chamadas `first/all/raw/run/batch`; inclui transporte interno, não apenas execução SQL. Um batch conta uma chamada.
- `drive_headers`: requisição do original ao Drive até receber headers; não inclui consumir todo o stream nem representa tempo de download completo.
- `d1_calls`: quantidade de chamadas ao binding, não quantidade de instruções SQL nem linhas.

Tempos se sobrepõem (auth inclui D1; chamadas paralelas podem se sobrepor). Não somar as colunas para obter latência. Relógio do Worker pode ter resolução limitada. Nada de SQL, parâmetros, IDs, cookies, tokens ou conteúdo de fotos nos headers. Contexto e contadores exclusivos de cada requisição; GET/erros mantêm contratos e cache. Cron, escritas e Worker coletor não recebem essa instrumentação.

## Aceite

Zero alterações de atributos dos caminhos SVG para repetições do mesmo estado; atualização real dos avisos preservada. Uma leitura inicial para anexações simultâneas da mesma tela, com atualização manual e troca de contexto funcionando. Original sem BLOB de miniatura; miniatura sem Drive; revogação/sessão/unidade/estado/perfis continuam revalidados. Sem migração, gravação fictícia na produção, alteração de layout ou intervalo de 15/60 s.

Resultados e publicação: [registro de qualidade](../05-qualidade/DESEMPENHO_D104_2026-11-12.md).
