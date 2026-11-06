# Conectividade independente — D-043, 28/10/2026

Problema: ao informar locais sem conectividade, o seletor obrigatório dependia de ambientes B, impedindo concluir C. Responsável corrigiu explicitamente essa dependência.

Fontes: Base original §§3.2 e 4.C, decisões/precedência, especificação de telas/transições, catálogo e fotos/estados, aceite; Base preservada. Arquivos alterados: `web/collector-schema.js`, `web/collector.js`; mesma regra de campos importada por `server/collector.mjs`; testes `collector-schema.test.mjs`, `collector-list.test.mjs` e `scripts/verify-connectivity-flow.mjs`. Ajustada também uma comparação SQL de revisão para parâmetro vinculado, compatível com SQLite estrito e D1.

Regra: identificar locais sem conectividade por descrição **ou** seleção de ambientes existentes. Sem catálogo, não apresentar seletor impossível de preencher. Ocorrências continuam exigindo descrição e demais respostas aplicáveis; foto ou justificativa segue necessária nas falhas visíveis. Não criar ambientes fictícios. Descrição gravada no D1 e exibida no questionário recebido pelo desktop. Adicionar ambientes posteriormente não invalida a descrição nem reabre automaticamente C.

## Aceite

- 31 testes Node aprovados.
- Validação compartilhada aceita descrição com catálogo vazio ou preenchido; aceita referências anteriores; exige identificar os locais quando aplicável.
- Rotas reais com SQLite isolado: C concluído com zero ambientes e B Pendente; cadastro posterior de ambiente preserva a resposta e a revisão não acusa erro em C.
- Chrome real: entrar em C, informar ausência de internet/locais sem conectividade, descrever locais, registrar ocorrência e concluir C sem abrir B. Captura confirma C Concluído e B Pendente.
- Evidências: `evidencias/listagem-unidades/03-conectividade-sem-ambientes.png` e `04-conectividade-concluida-b-pendente.png`. Dados de teste isolados, sem gravar vistoria oficial.

Cobertura adicional: independência de C e identificação de locais sem catálogo B. Não declara remoção de todas as dependências de D/E/F/H; vínculo de equipamento permanece conforme Base. Fotos R2, offline e outras lacunas de `COLETOR_ONLINE_01.md` continuam pendentes.

Publicado: coletor `948be78d-2449-47fc-91a5-22f22db09a82`; desktop/backend `49204723-e994-4dd8-b874-954585dd3a28`. HTTP externo e proteção de APIs aprovados após implantação; nenhuma alteração de registros oficiais. Endereço: https://inventario-semed-lumiar.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev/
