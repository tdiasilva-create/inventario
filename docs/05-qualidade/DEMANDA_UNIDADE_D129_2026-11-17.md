# D129 — verificação local de Registrar nova demanda

Estado em 17/11/2026: **implementado e testado localmente; não publicado**. O pedido definiu o atalho e o formulário. A autorização de publicação anterior era da D128; a regra de aprovação explícita do AGENTS.md continua aplicável. [Contrato](../03-painel-desktop/REGISTRAR_DEMANDA_UNIDADE_D129.md).

## Resultados

| Verificação | Resultado |
| --- | --- |
| `pnpm test:all` | 372 testes aprovados, zero falhas; inclui três testes D129. |
| `node tests/unit-demand-browser.cjs` | Caminho pelo mapa, botão junto ao nome, unidade fixa, atribuição, resposta perdida/reenvio, fechamento sem reabrir, foco, permissões e 390 px aprovados. |
| `node tests/collection-designation-browser.cjs` | D128 aprovado: responsável na lista, tratamento de falhas, consulta explícita, permissões e nenhuma ativação de GPS. |
| `node tests/technical-dispatch-browser.cjs` | Fila por arraste, dois técnicos, GPS exigido no aceite, interface técnica, mapa e retirada da posição ao concluir aprovados. |
| `node tests/technician-tracking-browser.cjs` | Fluxo D114 aprovado no navegador de teste. |
| `pnpm build:desktop` | Bundle do painel gerado. |
| `wrangler deploy --dry-run` | Empacotamento validado, sem publicação. |
| `node scripts/check-repository.mjs` | Índice Git aprovado: sem caminhos privados ou assinaturas conhecidas de segredos. |
| `node scripts/check-doc-links.mjs` / `git diff --cached --check` | Links do escopo do verificador e formatação aprovados. |

Testes de servidor usam Worker real com SQLite isolado. Cobrem unidade com agente; duas necessidades distintas na mesma unidade; técnico habilitado com papel de consulta; isolamento da lista D128; autenticação/root/CSRF; unidade inativa/conveniada; campos inválidos; reenvio simultâneo e conflito de payload; rollback por falha de atribuição; técnico desabilitado entre leitura e transação. Nenhuma demanda ou notificação de teste foi criada no ambiente oficial.

O teste de navegador usa o mesmo servidor de aplicação com dados **TESTE**. Verifica que abrir a página não consulta opções de técnicos. A perda da resposta é provocada após o servidor gravar; repetir confirma a mesma demanda e um único aviso. Confere ausência de início de GPS e botão ausente para admin/visualizador. Integração incluída no roteiro de navegador e na CI.

## Evidências visuais sintéticas

- [Cabeçalho desktop](evidencias/demanda-unidade-d129-2026-11-17/01-cabecalho.png): botão ao lado do nome.
- [Modal preenchido](evidencias/demanda-unidade-d129-2026-11-17/02-modal.png): unidade, descrição, tipo e responsável.
- [Confirmação](evidencias/demanda-unidade-d129-2026-11-17/03-confirmada.png): modal fechado, página mantida.
- [Cabeçalho 390 px](evidencias/demanda-unidade-d129-2026-11-17/04-cabecalho-390.png) e [modal 390 px](evidencias/demanda-unidade-d129-2026-11-17/05-modal-390.png): sem corte do botão.
- [Resultado estruturado](evidencias/demanda-unidade-d129-2026-11-17/resultado.json).

Capturas abertas e comparadas visualmente com a composição atual D080: identidade, cabeçalho, fotos e organograma preservados. A primeira revisão encontrou corte do cabeçalho em 390 px; o ajuste flexível foi corrigido e a repetição passou com verificação de limites do botão. Nada nessas capturas representa unidades ou técnicos reais. GPS físico/tela bloqueada não foi homologado por estes testes; o código nativo permanece inalterado.

## Publicação e conferência futura

Somente Worker do painel, sem migração, APK ou atualização do coletor. Base real vigente: D128 `3aee0153-07d0-43d1-8998-83458594c30b`. Após autorização, publicar e conferir versão/HTTP; abrir unidade e modal com sessão root real, fechando sem criar demanda de teste. O salvamento já foi validado isoladamente. Retorno ao Worker D128 remove o atalho; demandas criadas continuam na Central com histórico e atribuições.

Roteiro manual: abrir uma unidade pelo mapa (as que já têm demanda mantêm destino Central por D095); conferir botão; abrir e fechar com Escape; abrir novamente e conferir unidade/técnicos; em uso real solicitado pelo root, informar necessidade e confirmar; conferir número, fechamento e demanda no aplicativo do responsável. Não aceitar, excluir nem atribuir a usuários reais apenas para testar.

Logs locais em `private-data/d129/`, fora do Git. Documentos e capturas desta entrega não contêm credenciais nem registros reais.
