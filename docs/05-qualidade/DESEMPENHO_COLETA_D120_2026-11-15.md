# D-120 — resposta dos botões e fotografias da coleta

Pedido de 15/11/2026: corrigir, testar, comparar com o diagnóstico e publicar no ambiente real, preservando permissões e localização. O problema foi relatado no APK, tanto ao abrir fotos existentes quanto ao selecionar novas imagens. Não há migração nem novo APK nesta entrega.

## Implementação

- Entrada da unidade: o retorno de `v3-start` já identifica o questionário; a página de seleção encaminha diretamente para V3, sem buscar e descartar a visita completa antes do redirecionamento.
- `GET /api/collector/inspection`: sessão e escopo continuam frescos. Leituras independentes de assuntos, ambientes, totais, unidade e fotos são agrupadas por `DB.batch`; totais são lidos uma vez. Nenhum cache de autorização ou de respostas foi adicionado.
- `review=1`, opcional e compatível: devolve também a mesma revisão do endpoint antigo, reutilizando os dados lidos. O endpoint antigo permanece disponível. Concluir continua uma operação manual, com nova validação no servidor, revisão/versão e histórico.
- Inicialização V3: capacidades das fotos e visita são consultadas em paralelo após autenticar.
- Computadores, impressoras, ambientes e problemas mostram estado de carregamento imediatamente. O retorno às categorias durante essa leitura é permitido; respostas atrasadas não substituem a tela seguinte. Gravações mantêm suas proteções.
- API V3 tem prazo de 30 segundos abrangendo cabeçalhos e corpo. Falha não apaga o preenchimento e não repete automaticamente uma gravação de resultado desconhecido.
- Fotos: preparação sequencial e envio podem avançar juntos; a primeira foto é enviada enquanto a seguinte é preparada. Alvo/visita são capturados na seleção. Falha permanece para reenvio ou descarte explícito; conclusão e saída da unidade conservam a barreira D116.
- Miniatura da foto recém-enviada é reaproveitada em memória somente após ACK `ready`. Limite de 32 miniaturas derivadas desta própria aba, até 30 KiB cada; URLs revogadas na remoção/evicção/saída. Não é armazenamento offline e não contém fotos baixadas de outros usuários.
- Ampliação abre com a miniatura disponível, busca a foto completa e oferece tentativa explícita se falhar. Fechar libera a tentativa. Originais permanecem privados no Drive; miniaturas autenticadas D072 no D1.
- JS da lista e V3 são empacotados com esbuild, em URLs com hash. CSS mantém os tokens e a cascata aprovados em um arquivo por entrada. HEIC e QR continuam sob demanda. Código versionado usa cache privado; HTML/APIs/fotos mantêm suas próprias regras. Ambos os Workers validam o acesso aos bundles.

## Comparação reproduzível

Mesma sessão artificial, Worker completo, SQLite em memória e Drive simulado. Atraso de **100 ms por chamada ao binding D1**, igual ao diagnóstico. São medidas locais de sensibilidade, não latência do celular nem promessa de desempenho da internet real.

| Caminho | Antes | Depois | Observação |
|---|---:|---:|---|
| Visita com cinco fotos | 10 chamadas / 1.107 ms | 4 chamadas / 447,3 ms | 60% menos chamadas; SQL agrupado, não removido indiscriminadamente |
| Leitura da revisão pela interface | 20 chamadas / 2.213,1 ms | 4 chamadas / 447,6 ms | visita + revisão substituídas por um snapshot; cerca de 80% menor |
| Clique Computadores → título/feedback | 348 ms | 4–5 ms | lista ainda vem do servidor; não fingir dados já carregados |
| Clique Revisar → revisão exibida | 2.235 ms | 454–484 ms | ensaio navegado com o mesmo atraso |
| Miniatura, leitura autenticada | 2 chamadas / 222,2 ms | 2 chamadas / 223,5 ms | sem ganho artificial: autenticação preservada |
| Original, leitura autenticada | 2 chamadas / 222,7 ms | 2 chamadas / 222,1 ms | Drive simulado; não mede latência real do Drive |
| JS inicial V3 | 14 módulos / 164.861 bytes | 1 bundle / 116.472 bytes | bytes sem compressão de transporte; dependências opcionais fora da carga inicial |

Otimização não equivale a reduzir todas as instruções SQL em 60%: `batch` agrupa instruções numa chamada. Na visita com fotos são oito instruções, antes dez. Revisão conjunta executa onze, antes vinte nas duas leituras. Fotografias completas continuam dependendo da conexão e do Drive. No ensaio de duas fotos JPEG sintéticas de 2400×1800 houve tarefas de preparação de aproximadamente 90 ms no navegador do computador; câmera/CPU/WebView do Android físico não foram medidos.

## Testes e evidências

Testes adicionados: `tests/collector-performance.test.mjs` e `tests/collector-photo-pipeline.test.mjs`. Cobrem equivalência da revisão, histórico sem escrita por GET, foto histórica, mudanças concorrentes visíveis, unidade inativa, perfil de consulta, sessão revogada, timeout do corpo, ausência de repetição de POST, limite/liberação de miniaturas, autorização dos bundles, início do envio antes de terminar o lote, vínculo de fotos durante navegação, falha e reenvio.

Navegação real em base **isolada**: resposta imediata de Computadores; ida rápida Computadores → categorias → Internet durante leitura atrasada; resposta antiga sem mudança de tela; revisão com pendências corretas; envio de dois JPEGs; três fotos confirmadas na fachada (uma inicial + duas novas); ampliação com 320 px já visíveis durante espera e substituição por original de 1600 px; falha simulada com prévia retida e conclusão bloqueada; reenvio explícito. Navegação e capturas no navegador desktop. A ferramenta aceitou a solicitação de viewport 390 × 844, mas as imagens retornaram largura de 1280 px (1265 px nas capturas integrais); portanto esse ensaio NÃO homologa a largura móvel. Nenhuma foto fictícia é gravada em produção.

Evidências privadas: `private-data/release-coleta-performance-2026-11-15/`, incluindo baseline copiada antes das alterações, resultados JSON, logs HTTP sem credenciais, testes e deploys. Script: `scripts/audit-collector-performance.mjs`; variáveis opcionais `SEMED_AUDIT_DIR` e `SEMED_AUDIT_ASSETS`, uso somente local. Controles de falha/atraso existem apenas nesse servidor de ensaio, nunca nos Workers.

## Publicação e retorno

Publicação concluída em 15/11/2026, com 100% do tráfego em ambos os Workers:

- Coletor: `e1ddf5ca-3b70-4f86-9377-cd667ac7c9dc`; `created_on` informado pela Cloudflare: `2026-11-15T10:30:59.008268Z`.
- Painel/app: `e7eecdd2-0139-4686-864d-4c2a1d767f27`; `created_on` informado pela Cloudflare: `2026-11-15T10:31:24.024082Z`.
- 319 testes Node passaram; 41 verificações JVM de localização/navegação passaram; teste de rotas no workerd passou. Dry-run de ambos os Workers aprovado.
- 14 verificações HTTP do app/APK e 12 verificações anônimas das novas rotas/bundles passaram. APK 1.0.4 remoto igual ao manifesto, SHA-256 `f258f5f8a483a52d092d9a0d4d8bceba89654256524dae24a28b369c397a82a5`.
- HTML autenticado real do iframe confirmou `/collector-bundles/collector-v3-3RSITCFK.js` e `/collector-bundles/collector-v3-04ca9ab8e78e5e6f.css`.
- Nenhuma migração executada. Nenhuma permissão, serviço Android ou dado de coleta foi modificado nos testes de produção.
- Conferência autenticada no app real, como root: retomada da visita existente de CMCB 02 DE JULHO UNIDADE LXI - BANDEIRA TRIBUZZI, fachada/miniatura e original de 900 × 1600 recebidos; navegação às categorias e carregamento imediato de Computadores. Nenhuma ficha foi travada/editada e nenhuma foto/resposta fictícia foi enviada.

Rollback de código para versões anteriores: painel/app `3a576dde-3df4-4728-aa39-36a5210a2d5d`; coletor `6146632e-8ad0-4998-afb8-89d1a5542c4a`. Sem reversão de banco ou exclusão de dados. Não desinstalar o aplicativo.

APK permanece 1.0.4/versionCode 5, com a assinatura e o serviço D114 existentes. Esta entrega não altera o código Android, a navegação entre áreas, a aceitação de demandas, o GPS, os alertas, o cron, o plano gratuito ou as perguntas da coleta. Testes JVM não homologam GPS físico/tela bloqueada. Conferência no aparelho do responsável continua necessária para medir a melhoria na rede e no celular utilizados.


Conferência final em produção: lista apresentou 22 computadores da visita existente; revisão retornou cinco pendências reais e manteve confirmação bloqueada. Console sem erros/avisos. Capturas da interface publicada (1280 × 720) em `docs/05-qualidade/evidencias/D120/computadores-producao.jpg` e `revisao-producao.jpg`. Teste de reenvio isolado terminou com quatro fotos recebidas, sem prévia perdida ou duplicação.
