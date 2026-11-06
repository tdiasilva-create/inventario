# D-068 — cadastro ampliado e matriz compacta

**Adendo posterior:** o responsável autorizou a publicação, executada em 06/11/2026. Ver [registro real](PUBLICACAO_D068_2026-11-06.md). O texto abaixo registra o estado da entrega local anterior e seus testes; a carga de planilhas continua pendente.

Entrega **local**, 06/11/2026. Fonte: `00_LEIA_PRIMEIRO_2.md` e `PEDIDO_CODEX_CADASTRO_UNIDADES_E_CARD_2026-11-06_1.zip`. Tipos, total/etapas e obras fora da coleta confirmados pelo responsável. Sem deploy, migração remota, carga ou reclassificação de dados reais. A produção permanece na versão D-067.

## Implementado e testado localmente

| Parte | Resultado | Evidência |
|---|---|---|
| 1 — conveniadas fora do inventário | Sem criação/importação/coleta/indicadores; root consulta e inativa legado, histórico preservado | `tests/unit-catalogue.test.mjs`, browser |
| 2 — quinze campos e sete tipos | Persistência opcional, NULL distinto de zero, INEP por tipo, avisos, auditoria/versão | `tests/units.test.mjs`, `tests/unit-catalogue.test.mjs` |
| 2 — importação/exportação | 27 colunas, 12 antigas compatíveis; CSV/XLSX, decimal inválido no Excel, aviso não bloqueia, idempotência | `tests/unit-files.test.mjs`, API e browser |
| 2 — consulta | Rede em números com filtros/cobertura, detalhe e bloco expansível, lista secundária, obras fora das somas | `tests/unit-catalogue-browser.cjs`, `tests/desktop-identity-browser.cjs` |
| 3 — matriz | 141 nomes do oráculo, título/aria completo, Total correto, oito categorias, valores destacados | `tests/unit-names.test.mjs`, browser 1440/1672/1920 |
| Migração | `0016_unidades_cadastro_ampliado.sql`, aditiva; linhas antigas preservadas; integridade OK | SQLite isolado; catálogo físico regenerado |

`0015_questionario_v3.sql` já existia; não foi renomeada nem alterada. D-054 também já existia; esta decisão é D-068. D-065 rege a paleta; D-066/D-067 regem contagens e composição, superando o exemplo antigo de cinco indicadores. A matriz mantém Notebooks por último somente no Panorama. Mapa/zoom/camadas não foram modificados.

## Comandos e resultados

- `pnpm test`: **112/112**, zero falhas. Inclui dez casos novos (dois agregam 141 abreviações e múltiplos casos de validação), além dos 102 testes existentes após inclusão dos dois novos tipos testados individualmente.
- `node tests/unit-catalogue-browser.cjs`: aprovado, Worker/SQLite isolados, formulário/salvar/reabrir/importar, legado inativado somente em fixture, filtros/somas, nomes completos, ordenação e matriz sem rolagem horizontal nas três larguras desktop. Rodada adicional com `SEMED_TEST_IMPORT_FILE` no CSV privado de núcleos tecnológicos: seis linhas validadas e importadas na fixture.
- `node tests/desktop-identity-browser.cjs`: 17 rotas, identidade, categorias, seleção de unidade, fotos contextuais, layout D-067 e 390px. Aprovado.
- `node tests/collector-v3-browser.cjs`: fluxo atual aprovado, QR/galeria/retomada; sete fotos de fixture, sem câmera física ou provedor real.
- `tests/desktop-root-agents-browser.cjs`: aprovado via Edge, sessão/Worker reais com dados isolados; autorização legada, vínculo, presença, revogação e manutenção. Chromium padrão não estava instalado; execução usou `pw.chromium.launch({...options,channel:'msedge'})` em wrapper local, sem modificar o aplicativo.
- Builds: desktop **67 arquivos**, coletor **47**. `wrangler deploy --dry-run` aprovado para os quatro arquivos `wrangler.jsonc`, `wrangler.collector.jsonc`, `wrangler.validation.jsonc`, `wrangler.validation.painel.jsonc`; não publicou. A primeira tentativa do coletor encerrou por falta de memória do processo; nova execução sequencial com limite do Node passou.
- `node scripts/document-schema.mjs`: 16 migrações locais, 56 tabelas, 34 índices explícitos, uma view, dez triggers; integrity_check OK, zero foreign_key_check.

### Roteiros antigos que não constituem aceite verde

Executados e falharam: `collector-v2-browser.cjs`, `collector-v2-qr-browser.cjs`, `collector-v2-qr-lost-response-browser.cjs` esperam entrada/heading V2, mas a entrada atual abre V3; `desktop-v2-agent-browser.cjs` exige texto “Questionário V2 (coleta-2.0)” removido pela D-060. `collector-evidence-browser.cjs` não foi executado nesta rodada: inspeção mostrou dependência do botão “Usar questionário anterior”, igualmente retirado. Não se declara que esses cinco roteiros passaram. Atualização dos roteiros legados fica documentada como dívida de testes; não restaurar opções/versões que o responsável rejeitou. O protocolo, inclusive falhas antes/depois de envio e idempotência, está coberto na suíte de 112 e o fluxo visual atual no browser V3. Não houve teste físico do EXE.

## Conferência dos cinco CSVs recebidos

Parser do aplicativo e endpoints reais de prévia/confirmação executados sobre SQLite em memória, uma fixture por arquivo, sem nomes/telefones/e-mails de gestores. Arquivos recebidos permanecem privados.

| Arquivo | Linhas | Resultado |
|---|---:|---|
| importacao_escolas_municipais.csv | 71 | Bloqueado: linha 31, vagas -16. Nenhuma linha importada. |
| importacao_locais_institucionais.csv | 8 | Prévia e gravação isolada aprovadas |
| importacao_nucleos_educa_paco.csv | 33 | Prévia e gravação isolada aprovadas |
| importacao_nucleos_tecnologicos.csv | 6 | API e navegador aprovados |
| importacao_obras.csv | 17 | Prévia e gravação isolada aprovadas |

O critério do pacote “todos os CSVs sem erros” permanece **pendente de correção na fonte**. Não converter -16 em zero, não apagar o valor e não aceitar negativo silenciosamente. Atualização em lote por INEP e prioridades das fontes não foram aprovadas; unidades existentes usam edição individual pelo root.

## Capturas e comparação visual

Pasta local ignorada pelo Git: `docs/05-qualidade/evidencias/cadastro-unidades-ampliado-2026-11-06/`. Capturas `card-1440.png`, `card-1672.png`, `expandida-1440.png`, `expandida-1672.png`, `formulario-numeros.png`, `previa-importacao.png`, `previa-nucleos-tecnologicos.png`, `rede-numeros-filtrada.png`, `detalhe-unidade.png`, `lista-fora-escopo.png`; dados demonstrativos sinalizados. Captura anterior D-067 copiada para `antes-panorama-D067.png` para comparação.

Diferenças intencionais frente aos PNGs originais: identidade branco/preto/vermelho/laranja D-065; composição D-067; categorias D-066 atualizadas; novo bloco do cadastro e matriz compacta. Foram corrigidas as larguras fixas antigas que comprimiam nomes e escondiam colunas. Não se reproduzem números, escolas ou mapa fictício dos mockups como dados oficiais.

## Base original, limites e próxima publicação

Cobertura relacionada ao TXT: cadastro oficial e importação administrativos (§8/§12, com quatro perfis/root definidos depois), autorização validada no servidor, preservação de histórico (§9/§10), separação entre rascunho e publicado (§7/§13). A entrega não acrescenta perguntas aos grupos A–H, não altera a Base e não conclui pendências de offline, compressão, backup ou políticas ainda abertas. Drive, autenticação Google, fluxo de foto e núcleo do protocolo de agente permanecem; apenas adaptador de catálogo verifica o novo escopo.

Ainda falta: autorização própria de publicação conforme o pacote, backup/conferência remota, migração aditiva 0016 no D1 compartilhado, deploy de ambos os Workers, verificação autenticada real e carga pelo root após revisão da fonte. Câmera física, Android/Safari, instalador Windows e envio ao Drive real **não testados nesta rodada**. Não tratar esta entrega local como publicação ou homologação física.
