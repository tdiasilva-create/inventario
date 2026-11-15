# Formato esperado da devolutiva do Claude

## Identificação

- Commit completo, branch, manifesto do pacote, data/fuso.
- Sistemas/ferramentas, testes executados, dependências ausentes.
- Escopo contratado versus efetivamente examinado, sem usar “tudo auditado” se houver partes sem leitura/execução.

## Resumo executivo

Priorizar perda/corrupção de dados, acesso indevido, localização persistente fora da autorização, indisponibilidade/cota D1, duplicação e confirmação falsa. Explicar impacto em linguagem do usuário antes dos detalhes técnicos. Não transformar quantidade de arquivos ou testes em nota de qualidade.

## Cobertura

| ID A01–A40 | Status | Fontes examinadas | Testes/contraprovas executados | Resultado | Limites / próximo passo |
|---|---|---|---|---|---|
| Axx | completa neste recorte / parcial / não examinada | caminhos | comandos e evidências | resumo | o que falta |

## Ficha de achado

```text
ID: AUD-001
Título:
Severidade: P0 / P1 / P2 / P3
Classificação: defeito reproduzido / defeito estático demonstrável /
               suspeita / limitação conhecida / divergência documental /
               proposta / decisão pendente
Confiança: alta / média / baixa (justificar)
Área(s) e perfis afetados:
Regra aprovada: D-xxx, trecho e fonte (ou indicar falta de definição)
Arquivo: caminho:linha (do commit auditado)
Pré-condições e volume:
Passos para reproduzir:
Resultado esperado:
Resultado observado:
Evidência: teste, resposta, estado antes/depois, captura sintética
Causa e cadeia de efeitos:
Impacto em dados, segurança, consumo e usuário:
Correção proposta e alternativas:
Compatibilidade com agentes/APK/clientes antigos:
Necessita migração? Retroativa? Backup? Rollback? Risco de concorrência?
Teste independente de regressão:
Critério objetivo de aceite:
Depende do responsável? Qual decisão exata e por quê?
Limitação da conclusão:
```

P0: falha crítica comprovada, perda de dados ou exposição relevante com urgência. P1: quebra importante de fluxo/permissão/consumo com impacto real. P2: comportamento incorreto limitado ou degradação recuperável. P3: clareza, robustez e manutenção sem impacto imediato demonstrado. A urgência depende da evidência, não do tamanho do arquivo.

Agrupar duplicatas da mesma causa e apontar todas as telas afetadas. Não esconder suspeitas junto a reproduções. Se um teste já existente falhar, investigar se o seletor/fixture é legado antes de atribuir ao produto; registrar os dois fatos.

## Plano de correção

| Ordem | Achados | Mudança mínima proposta | Dependências | Testes | Publicação/migração | Risco/rollback | Decisão necessária |
|---|---|---|---|---|---|---|---|

Dividir por fases pequenas verificáveis. Preservar o plano gratuito, GPS, alertas, identidade visual, permissões, fotos, históricos e IDs. Não fundir banco/cadastros, reescrever todo o aplicativo nem trocar stack sem decisão explícita. Melhorias opcionais ficam separadas de defeitos.

## Perguntas ao responsável

Somente ambiguidades que mudam comportamento, política ou custo. Apresentar opções com efeito concreto e recomendação. Não perguntar novamente decisões já respondidas nos documentos mais recentes. Limitação de acesso é distinta de dúvida funcional.

## Arquivos a devolver

- `01_RESUMO_EXECUTIVO.txt`
- `02_ACHADOS_DETALHADOS.md`
- `03_MATRIZ_DE_COBERTURA.csv`
- `04_PLANO_DE_CORRECAO.md`
- `05_DECISOES_PARA_O_RESPONSAVEL.txt`
- `06_TESTES_E_LIMITACOES.md`
- `REPRODUCOES/` se houver, sem dados oficiais, com README e hashes.

Essa lista organiza a revisão; não exige implementar as correções nesta etapa. Se sugerir um patch mínimo para demonstrar uma causa, mantê-lo separado, não afirmar que foi integrado ou publicado e não substituir automaticamente arquivos do projeto entregue.
