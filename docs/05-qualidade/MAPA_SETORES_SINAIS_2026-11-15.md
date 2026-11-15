# Indicadores de comunicação no Mapa de Setores — complemento D121

Pedido: sinal circular verde para online e vermelho para offline ao lado do nome do computador, conforme captura enviada pelo responsável em 15/11/2026. Continuidade do Mapa de Setores já autorizado/publicado; não altera protocolo do agente ou dados.

## Implementação e aceite local

- 16 px ao lado do nome em Organograma/Lista; verde para comunicando, inclusive falha de leitura de inventário; vermelho para sem comunicação recente ou suspensão/desligamento informados. Cinza para ausência de agente/informação e erro de consulta.
- Legenda, nome acessível e tooltip com motivo/último contato em Fortaleza. Resumo selecionado mostra estado por escrito. Não interpreta ausência como diagnóstico físico de computador desligado.
- `panel-status` existente fornece presença a cada 15 s em aba visível. Mesmo teto de 50 IDs por consulta, deduplicação e rotação para setores com mais computadores. Nenhum timer/API novo. Setores recolhidos fora da solicitação.
- Alteração pontual dos elementos de estado, sem reconstruir foto/ficha ou mover seleção/rolagem. Dados atrasados não substituem uma lista mais recente.
- 30 testes Node aprovados: `equipment-signal`, `unit-equipment-map`, `agent-monitoring`, `panel-blocks`, `d1-budget`, `equipment-consultation`. Incluem fronteira exata de 17 minutos, falha de inventário ainda online, suspensão, revogação, falha de consulta/retorno e cobertura de 121 IDs em lotes de 50.
- Build desktop e Wrangler dry-run aprovados.
- CUA em SQLite local DEMONSTRAÇÃO: sinal verde inicial e cinza para manuais; simulação local de uma hora sem contato mudou automaticamente para vermelho; erro HTTP 503 ficou cinza com Status desatualizado; recuperação voltou ao verde. Foto permaneceu carregada. Lista preservou estado. Nenhuma simulação em produção.
- Capturas: `evidencias/mapa-setores-2026-11-15/sinal-online-demo.jpg` e `sinal-offline-demo.jpg`.

## Publicação

Publicado em 2026-11-15T12:40:43.350759Z (UTC), versão `4e073f99-ade2-4d2d-9e7a-41875a996a51` em 100%. 51 verificações HTTP passaram. Conferência autenticada root na EM RAIO DE LUZ: DESKTOP-GQ2RO6D mostrou bolinha vermelha, Offline · suspensão informada pelo agente, último contato 13/11/2026 18:55:30 Fortaleza. Foto real carregou e seleção permaneceu. Captura: `evidencias/mapa-setores-2026-11-15/raio-de-luz-sinal-publicado.jpg`. Sem escrita em dados reais. Somente painel, sem migração, mudança do APK/coletor ou configuração de agentes. Reversão pelo Worker anterior `03139a13-361a-4a19-8035-a102d5f96520`. Artefatos operacionais privados em `private-data/mapa-setores-d121-sinais-2026-11-15/`.
