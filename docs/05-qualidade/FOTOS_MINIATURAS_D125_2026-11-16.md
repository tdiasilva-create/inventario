# D125 — fotos e miniaturas, 16/11/2026

Status: implementação e testes locais concluídos; implantação em preparação. Publicação autorizada na continuidade das correções de coleta/fotos e da escolha do item 6 pelo responsável. Atualizar as versões ao concluir.

## Escopo e aceite

Fontes consultadas: entrada/precedência, decisões/pendências/conflitos, D072/D123/D124, modelo e diagramas, integração Drive e itens AUD043/044 da devolutiva. O trabalho anterior D124 leu integralmente a Base e referências das interfaces. Não há mudança visual nem de perguntas nesta etapa. Arquivos alterados: validação JPEG, leitores da galeria/miniaturas, migração 0036, aliases dos Workers e testes/documentação. [Contrato técnico](../04-dados-apis/FOTOS_E_MINIATURAS_D125.md).

Aceite: corpo JPEG ilegível recusado sem tocar no original; mesmos IDs/totais e autorização nas páginas; revisão invalidada após mudanças relevantes; índice de manutenção encontra hashes NULL; dados canônicos preservados; economia medida localmente sem alegar capacidade gratuita ilimitada. Retenção, revisitas e outras decisões pendentes ficam fora.

## Verificações locais

- 349 testes gerais passaram, incluindo seis novos de integridade, concorrência, invalidação e planos SQL.
- Cinco verificações no workerd usando o bundle real do Wrangler e WASM compilado: recusa de JPEG forjado, aceitação válida, recusa sem sobrescrever, leitura idêntica e acesso anônimo negado.
- Builds dos dois Workers e dry-runs aprovados. Decodificador WASM de 166.470 bytes; nenhum filesystem Node no bundle publicado.
- Navegador: geração/reparo root, original preservado, HEIC válido, imagem 12 MP e 50 miniaturas. Evidências em `evidencias/fotos-miniaturas-d125-2026-11-16/miniaturas/`; layout e ações existentes preservados. A captura de página inteira apresenta o cabeçalho fixo na posição da rolagem; não houve alteração de CSS nesta entrega.
- Transferência das 50 miniaturas: 441.137 bytes; rede local simulada 4G 1.328 ms / Fast3G 3.152 ms. Não é homologação de câmera/GPS/tela bloqueada Android.

Decodificador medido em Node/Windows: mediana 0,83 ms e p95 1,71 ms em 100 decodificações aquecidas, primeira 8,40 ms. Tempo decorrido local não equivale à cobrança de CPU Cloudflare; importação/compilação Node também não representa o carregamento do WASM pré-compilado no Worker. O teste do artefato workerd é separado.

## Consumo comparável

Ensaio workerd isolado, 5.000 fotos sintéticas/100 sem miniatura; respostas completas antes/depois idênticas e 99 tabelas canônicas sem mudanças:

| Consulta | Linhas lidas antes | Depois | Redução |
| --- | ---: | ---: | ---: |
| Primeira página, contagem fria | 20.353 | 5.740 | 71,8% |
| Página seguinte, mesma revisão | 20.212 | 537 | 97,3% |
| Manutenção de miniaturas pendentes | 5.107 | 63 | 98,8% |

São custos das consultas de domínio no workerd local, sem sessão/autenticação nessa medição. As permissões são exercitadas separadamente na suíte HTTP. Cache frio e filtros/revisões novos ainda contam as fotos; índices/triggers acrescentam custo nas escritas pertinentes. Não se trata de queda percentual de toda a conta D1.

Comparação adicional em cópia privada dos dados reais, restaurada apenas localmente: primeira página 1.625 → 1.448 linhas (10,9%); seguinte 1.497 → 924 (38,3%); manutenção sem pendências 304 → 1 (99,7%). Respostas idênticas, 100 tabelas existentes comparadas sem alteração (inclui controle de migrações, exclui sqlite internals), integridade/FKs OK. Ganhos dependem do volume e dos filtros. Agregados em `consumo-copia-real.json`; nenhum nome/ID/fotografia real exportado.

## Preservação e retorno

Backup prévio privado: 17.260.086 bytes, SHA-256 `a81e068baeffccbf5307cbd56c94d1291cb0614492e9b8b853a1dd011bc3fb98`. Restauração isolada: integridade OK, zero violações FK, 101 tabelas incluindo controles do ambiente. Dump e links de exportação ficam fora do Git.

Versões anteriores: painel `f5bd0e31-d36d-4026-b086-cae6e4dd9425`; coletor `2a7e6a3f-4b5c-4f2e-bee0-5aa2d75ead8b`. Reverter código mantendo 0036 é compatível. Não restaurar dump sobre dados recentes. Não houve limpeza, manutenção de fotos reais ou alteração de classificações durante os testes.

AUD043 residual de decodificação e AUD044(b/c) são o escopo desta entrega. Não comprova derivação visual contra o original nem revalida todo o acervo antigo. Fallback/reparo D124 preservados. A auditoria completa permanece aberta nos demais itens.
