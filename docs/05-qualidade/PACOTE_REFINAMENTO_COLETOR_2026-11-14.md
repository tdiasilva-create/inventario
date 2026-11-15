# Pacote de refinamento do coletor — 14/11/2026

## Pedido e escopo

O responsável considera que o APK unificado apenas deu acesso à coleta existente, sem o refinamento de experiência obtido no aplicativo técnico. Solicitou um compilado de fontes, funcionamento, regras, erros e orientações para o Claude produzir uma revisão implementável.

Esta entrega não modifica o produto, não publica Worker, não aplica migração e não gera novo APK. Base funcional `3c602eb`, registro de publicação/base documental `09442d0d24de214694c0236018837335b3b83068`. As versões reais citadas no pacote vêm do registro D-115, não de nova consulta autenticada de produção nesta tarefa.

## Conteúdo entregue

- Onze guias em `docs/06-entregas/coletor-refino-2026-11-14/`, com prompt, arquitetura, fluxos, estados, APIs, inventário de campos extraído do schema atual, regras, prioridades, execução e revisão.
- 550 arquivos de referência em `FONTES/`, preservando estrutura relativa: frontend, servidor, testes, migrações, Android, configurações sem segredos, documentos e referências visuais.
- 22 capturas isoladas, galeria HTML e evidências de regressão. Nenhuma cópia de contas, escolas, fotografias ou banco oficiais.
- Prévia navegável em memória: `scripts/preview-collector-refinement.cjs`. Captura: `scripts/capture-collector-refinement.cjs`. Empacotamento: `scripts/package-collector-refinement.mjs`.
- TXT consolidado de 52.549 bytes e prompt separado, além do ZIP de 616 entradas.

## Achados documentados

1. Durante envio de foto com resposta retida, o retorno às categorias continua habilitado, mas o clique é ignorado. A correção futura precisa preservar a associação da foto e o controle de envio, tornando a ação/espera compreensível.
2. A estrutura unificada ocupa 111 px em uma janela de 390 × 844; a coleta ainda possui seu próprio cabeçalho e rodapé. O pacote registra as duas camadas e a necessidade de reduzir competição por espaço.
3. A revisão pode apresentar um bloco longo de campos faltantes em Internet. Preservar as pendências por ficha e melhorar a apresentação das ações necessárias.
4. Os estados do rascunho da visita e da ficha ainda não enviada têm escopos diferentes; a interface pode confundi-los. Não foi constatada perda de dados por essa diferença de textos.

O pacote distingue esses achados, reclamações do responsável e hipóteses que precisam de reprodução. Testes existentes aprovados não são considerados prova de boa experiência.

## Verificação

- Suíte Node na origem: 301 aprovados, zero falhas.
- Suíte Node na cópia FONTES: 301 aprovados, zero falhas. Duas dependências ausentes na primeira montagem foram incluídas antes da repetição completa.
- Builds desktop e coletor aprovados dentro de FONTES: 138 e 56 arquivos, respectivamente. APK privado não integra esse recorte.
- Roteiros V3, refinamento D089 e aplicativo unificado aprovados. Prévia `--smoke` aprovada na cópia.
- Captura de 22 telas sem exceções JavaScript; envio atrasado e câmera negada simulados em fixture isolada.
- Cada entrada do ZIP foi reaberta e comparada com seu SHA-256; contagem e hashes conferidos.

Dependências já instaladas nesta máquina foram utilizadas; não houve instalação do zero em outro computador. Não foram testados Android físico, teclado real, câmera OEM, GPS em segundo plano nem latência/consumo do D1 oficial. Redução de viewport não equivale a teste de teclado Android.

## Artefatos finais

Em `C:\Users\SIGAE\Downloads\`:

- `PACOTE_CLAUDE_REFINAMENTO_COLETOR_2026-11-14.zip` — 12.756.816 bytes.
- `COMPILADO_REFINAMENTO_COLETOR_2026-11-14.txt`.
- `PROMPT_CLAUDE_REFINAMENTO_COLETOR_2026-11-14.txt`.

SHA-256 do ZIP: `f684f98ebb3b17e2760a02b536f11a736615de791a826e848f7cf2180582fd36`.

O registro de fechamento permanece no repositório; o ZIP contém os guias e manifestos anteriores a este fechamento. O redesenho devolvido ainda deverá ser revisado, testado e integrado antes de qualquer publicação ou novo APK.
