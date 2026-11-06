# Revisão independente das correções V2 + QR — rev2, 04/11/2026

**77 testes existentes aprovados; três inconsistências adicionais reproduzidas. Não pronta para publicação.** Nenhuma alteração funcional, publicação, migração remota ou execução do EXE nesta revisão.

Pacote: `CORRECOES_REVISAO_CLAUDE_V2_QR_2026-11-04.zip`, SHA-256 `5656687efdd44f61724d6d8ad7e396be5fe880f9773d5fc838e3f8c57d65a3c1`. Todos os 50 hashes declarados conferem. Dos 52 arquivos, 40 já eram idênticos na pasta atual e somente 12 PNGs diferiam. Relatório e roteiro avulsos coincidem com o pacote. Extração preservada em `revisoes/claude-v2-qr-rev2-2026-11-04-recebido/`.

## Validação reexecutada

- Windows / Node 24.19.0 / SQLite em memória: suíte de `package.json`, 75/75; fotos parciais, 2/2.
- Builds: coletor 26 arquivos; painel 45 arquivos.
- Cenários adicionais com Worker real em processo e rede externa bloqueada; R2-A executa as funções atuais do frontend com transporte controlado ao Worker.
- Os casos originais de REV-01 a REV-07 passam. A extensão da avaliação revelou lacunas de reabertura e publicação que complementam REV-03/REV-04.
- Captura fornecida `03-previa-conferencia.png` aberta visualmente. Testes de navegador de Claude, EXE, câmera física, aparelhos móveis, D1 remoto e produção não reexecutados nesta auditoria.

## Achados

| Ref. | Severidade | Evidência |
|---|---|---|
| R2-A | Alta | Após claim 201 com resposta perdida, frontend salva rascunho novamente e reutiliza request_id com expected_version diferente: 409 REQUEST_ID_CONFLICT; vínculo existe, interface continua sem confirmação. |
| R2-B | Alta | Claim com trava própria e F já concluído retorna 201 sem reabertura; F continua concluído. |
| R2-C | Alta | Mudança de localização em revisita mistura ambiente publicado antigo com posição atual antes da conclusão; depois de concluir, published_json conserva ambiente antigo porque a ficha permaneceu associada à visita anterior. |

Outros ajustes por inspeção estática: prévia visível de exclusão ainda não mostra `agentLinks`; divergência de horário na documentação do cron; revogados perdem vínculo na listagem filtrada por unidade; histórico técnico consulta só o agente ativo/último. Não são alegados como novos testes de navegador.

## Evidências e entrega

- `revisoes/claude-v2-qr-rev2-2026-11-04-analise/cenarios-adicionais.mjs` e `resultado-cenarios-adicionais.json`.
- `conferir-manifesto.mjs`, `conferencia-manifesto.json`, `testes-suite.txt`, no mesmo diretório.
- `DEVOLUTIVA_CLAUDE_V2_QR_REV2_2026-11-04.txt`, na raiz e em Downloads, com correções esperadas e aceite por item.

O diagnóstico **não é teste de aceite**: exit code 0 acompanhado de `defeito:true` significa que o defeito foi reproduzido. As próximas correções devem exigir o comportamento correto e manter os 77 testes aprovados. As três inconsistências seguem pendentes. Homologação física e armazenamento isolado continuam necessários; não reiniciar o Drive institucional nem tratar proposta de R2 de validação como decisão aprovada.
