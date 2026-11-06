# Instalador Windows de referência — D-056

**Arquivo definido pelo responsável em 04/11/2026: `SemedAgente-InstaladorUnico.exe`.** É a referência obrigatória para próximos trabalhos de compatibilidade, teste, distribuição e adaptação entre agente, coletor e painel. Não voltar a recomendar ou empacotar as versões anteriores como padrão.

## Identificação da cópia selecionada

- Original: `C:/Users/SIGAE/Desktop/SemedAgente-InstaladorUnico.exe`.
- Cópia preservada: `private-data/instalador-oficial/2026-11-04-35277f87/SemedAgente-InstaladorUnico.exe`, relativa à raiz do repositório.
- Versão informada nos recursos PE: arquivo/produto `0.1.6.0`.
- Tamanho: 26.133.504 bytes.
- SHA-256: `35277F87E0FD06CBA098A3608DE13EF516E76F188ECE597144D0CE3FB342F375`.
- Assinatura Authenticode: `NotSigned`.
- Manifesto para ferramentas: [INSTALADOR_OFICIAL.json](INSTALADOR_OFICIAL.json).

O hash do original e o da cópia foram conferidos. O binário permanece em armazenamento local excluído do Git e dos assets publicados. O registro documental/manifesto fica no repositório. Se a cópia não estiver disponível em outra estação, localizar o arquivo com o hash acima; não substituí-lo silenciosamente pelo instalador antigo de mesmo número de versão.

## Uso nas próximas etapas

1. Antes de preparar teste/distribuição ou adaptar o sistema ao agente, consultar este documento e conferir o hash do arquivo utilizado.
2. Preservar o original recebido. Se uma futura alteração for necessária, produzir nova versão identificada e registrar a substituição aprovada, mantendo o histórico.
3. A seleção deste instalador supera os pacotes anteriores somente como padrão de distribuição. Não apagar registros, agentes instalados, autorizações ou resultados de testes anteriores.
4. O contrato autenticado existente, ID permanente, vínculo à escola/ambiente/posição e permissões continuam vigentes. Não aceitar qualquer binário apenas pelo nome ou relaxar validações do servidor para fazê-lo funcionar.
5. Não transferir automaticamente as instruções de arquivos auxiliares do antigo instalador para este “InstaladorUnico”: a forma de configuração/autorização deste arquivo precisa ser conferida em seu próprio teste ou fonte correspondente.

## Escopo comprovado

Esta entrega registra a escolha do responsável e verifica identificação/integridade da cópia. Não executa o arquivo, não recompila, não publica um download e não altera a API. O nome “InstaladorUnico” não é evidência de quais componentes/configurações estão embutidos. O teste do QR simulado e a revisão do EXE anterior não homologam automaticamente este binário diferente.

Pendente para esta cópia exata: execução no Windows escolhido, configuração/autorização, geração do QR, vínculo e recebimento real de inventário/heartbeat. Nenhuma foto/dado oficial foi modificado nesta etapa.

## Atualização D-058 — teste do cadastro automático (05/11/2026)
O responsável escolheu remover a autorização de lote e testar o EXE recebido SemedAgente-Instalador-0.1.8.exe (SHA-256 CB486E517CDE0F58E1B209F4056249BA8FB276F429ABCE94163EF8065B6C02A7). Servidor adaptado ao cadastro anônimo assinado; vínculo humano continua autenticado. A declaração acima de referência histórica 0.1.6 não comprova suporte ao fluxo automático nessa versão antiga. Para este teste use o arquivo 0.1.8 analisado, sem autorizacao.txt. Não substituir binários silenciosamente nem declarar homologação do EXE sem teste físico. Instruções: CADASTRO_AUTOMATICO_AGENTE_SEMED_2026-11-05.txt; decisão D-058.
