# Execução local, contraprovas e limites

## Preparação reproduzível

Use Node 24 e pnpm 11.25.0 conforme `package.json`/lockfile. O ZIP contém `FONTES/` completo, sem `.git`, `node_modules`, segredos e dados operacionais. O manifesto registra bytes do commit, não arquivos privados da estação. Para verificações que precisam de Git, clone a branch indicada no pedido. Não execute deploy nem migrações `--remote`.

```sh
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
node scripts/test-audit.mjs
node scripts/build-desktop.mjs
node scripts/build-collector.mjs
```

Navegador: no Windows, os roteiros normalmente usam Edge. Para Chromium instalado pelo Playwright:

```powershell
$env:SEMED_TEST_BROWSER='chromium'
node scripts/test-audit-browser.mjs
```

```sh
SEMED_TEST_BROWSER=chromium node scripts/test-audit-browser.mjs
```

Os 14 roteiros do runner cobrem concorrência e saída da coleta, duas áreas do app, área útil simulada, localização, avisos, classificação de coleta, medição, busca de unidades, mapa ampliado, ficha e atribuição/roteamento. São uma amostra transversal; executar também os roteiros especializados da matriz. O runner prossegue após falha e devolve resumo por arquivo, sem esconder pendências.

`pnpm test` possui uma lista histórica explícita e não inclui todos os arquivos novos. `node scripts/test-audit.mjs` enumera **todos** os `tests/*.test.mjs`. Não usar somente o resultado de `pnpm test` para anunciar cobertura completa. Os roteiros antigos de navegador V2 documentados em `tests/README.md` não representam a interface V3 atual.

## Verificações de dados/documentação

```sh
node scripts/document-schema.mjs
node scripts/document-code-map.mjs
node scripts/check-doc-links.mjs
node scripts/export-operation-manual.mjs
```

`document-schema` aplica 34 migrações exclusivamente em SQLite vazio em memória: 96 tabelas, 66 índices explícitos, duas views e 101 triggers na verificação desta preparação. Não conta índices internos SQLite. Não é inspeção do D1 remoto nem restauração de backup real.

`document-code-map` consulta Git para enumerar fontes; usar clone ou inicializar uma cópia isolada, sem adicionar dados privados. Não comparar seu commit recém-criado ao commit original do manifesto como se fossem iguais. No ZIP já estão os resultados gerados.

`check-repository` examina o índice Git, incluindo arquivos staged; não varre arquivos ignorados nem substitui revisão de segredos. Só rodar após revisar o que foi adicionado ao índice. Não usar `git add .` em pasta com dados reais.

## Android

Políticas sem aparelho podem ser executadas com um JDK, sem chave de assinatura. Usar diretório temporário próprio como saída:

```sh
javac --release 8 -encoding UTF-8 -d /tmp/semed-audit-jvm android/technician/src/br/gov/ma/pacodolumiar/semed/tecnico/TrackingPolicy.java tests/android/TrackingPolicyTest.java android/technician/src/br/gov/ma/pacodolumiar/semed/tecnico/MobilePolicy.java tests/android/MobilePolicyTest.java
java -cp /tmp/semed-audit-jvm br.gov.ma.pacodolumiar.semed.tecnico.TrackingPolicyTest
java -cp /tmp/semed-audit-jvm br.gov.ma.pacodolumiar.semed.tecnico.MobilePolicyTest
```

No Windows substitua `/tmp/semed-audit-jvm` por pasta temporária sua. `scripts/test-technician-android.mjs` usa toolchain privado da estação do projeto; não é dependência incluída no ZIP. Compilar APK atualizado com a assinatura oficial exige material privado, não necessário à auditoria de código. Não criar chave nova para substituí-lo.

Homologação física separada: aceitar demanda, mover app para fundo, bloquear tela, trocar para Coleta, perder rede/GPS, revogar conta, concluir última atribuição, sair e verificar término. Investigar estado entre demandas, fabricante, otimização de bateria, reinício e force-stop. Não reproduzir com conta/dispositivo real sem autorização específica. Exibir limitação do Android em vez de prometer serviço impossível de interromper.

## Agente Windows

Consultar `windows/agent/README.md`, documentação D118/D119 e manifesto histórico D056. Não confundir 0.1.6 de referência histórica com o Core reconstruído 0.1.9. Não afirmar que os binários originais privados de serviço/UI foram auditados pelo exame do Core.

```powershell
dotnet run --project windows/agent/tests/Legacy -c Release
powershell.exe -NoProfile -ExecutionPolicy Bypass -File windows/agent/tests/Installer.Tests.ps1
powershell.exe -NoProfile -ExecutionPolicy Bypass -File windows/agent/tests/Recovery.Tests.ps1
```

Ler os pré-requisitos dos scripts antes da execução. Testes Network de compatibilidade exigem o Core 0.1.8 original; testes Recovery do Core usam o caminho `INTEGRATION_FIXTURE` gerado pelo teste PowerShell. Sem esses materiais, registrar a cobertura impossível. Não executar `Install.ps1`, `Recovery.ps1` ou EXE no computador do usuário como “teste de código”. Os testes próprios usam pastas temporárias e serviços simulados; instalação física exige outro aceite.

## Contraprovas essenciais

1. **Gravação incerta:** servidor confirma, conexão cai antes do ACK; repetir o mesmo recibo e garantir apenas um equipamento/foto/evento. Trocar corpo mantendo recibo deve ser detectado.
2. **Concorrência:** duas contas, duas abas da mesma conta, trava renovada, versão antiga, mudança de ambiente/unidade durante leitura. Nenhuma resposta atrasada deve alterar tela ou alvo mais recente.
3. **Sessão:** expirar/revogar entre listar e salvar, entre miniatura e original, durante upload e aceitação técnica. Recuperação não mistura contas nem guarda senha na URL.
4. **Coleta e fotos:** navegação permitida na mesma unidade durante upload; conclusão e troca de unidade aguardam; falha exige reenvio/descarte. Rascunho concorrente não vira confirmação de ficha completa.
5. **Estados:** zero/nulo/desconhecido, manual/sem agente/revogado, parcial/publicado/completa. Cada indicador e lista devem aplicar o mesmo filtro/escopo, inclusive páginas extras.
6. **Histórico:** renomear, arquivar ficha e recuperar agente não apagam nem reassociam fotos/snapshots. ID arquivado não reaparece via cliente antigo.
7. **Atendimento:** duas pessoas aceitando/concluindo, atribuição retirada, root reordena com tarefa ativa, atribuição adicionada no instante da última conclusão. Conferir posição, capacidade e contador transacionais.
8. **Cron:** reexecutar/sobrepor monitor, manutenção e relatório semanal; não duplicar incidentes/relatórios nem pular alterações intermediárias de hardware.
9. **Rede:** timeout de headers/corpo, upload interrompido, HTTP 401/403/409/429/500, Drive indisponível, OSRM bloqueado, fila antiga de heartbeats. Não tentar de novo POST não idempotente automaticamente.
10. **Medição:** agente antigo/sem capacidade, desvinculado após pedido, cancelamento antes/durante, prazo/bytes, resultado repetido e retorno depois do vencimento. Não reiniciar tráfego já realizado porque ACK faltou.
11. **D1:** comparar leitura fria/quente, volumes sintéticos 1/50/200 unidades e computadores, 1/5/20 sessões, zero/vários técnicos. Registrar SQL/EXPLAIN e linhas quando disponíveis. Não atribuir a localização todo o consumo sem medir.
12. **UI:** 360/390 px, tablet e desktop; campos longos, teclado, foco de modal, Esc/Voltar, tela cheia e movimento reduzido. Foto lenta não deve bloquear ações independentes.

## Evidência e resultados

Registrar comandos, versões, duração, dados sintéticos e status final. Uma tela com HTTP401 não comprova migração/rota; um teste mockado não comprova rede externa; métricas locais de chamadas não são Analytics D1. `scripts/serve.mjs` e prévias visuais podem não reproduzir a API inteira: preferir fixtures Worker/SQLite dos testes e ler o harness utilizado.

Não incluir nos relatórios cookies, tokens, IPs reais, fotos de escolas, localização de pessoas ou dump. Valores sintéticos claramente identificados são suficientes para reproduções. Se uma parte exigir acesso oficial, listar o bloqueio e a evidência necessária, sem concluir que funciona ou falha.
