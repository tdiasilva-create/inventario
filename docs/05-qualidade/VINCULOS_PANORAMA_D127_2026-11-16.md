# D127 — verificação de vínculos no Panorama

Autorização explícita do responsável: implementar os botões, testar e publicar. [Contrato](../03-painel-desktop/UNIDADES_COM_AGENTE_D127.md).

Consultados entrada, precedência, decisões/pendências/conflitos, manifesto e cinco PNGs desktop na ordem, especificação desktop, Mesa de Dados D080, listas D100, classificação D112, orçamento D108 e revalidação D110. Identidade posterior D065/D080 preservada. Nenhum cadastro oficial utilizado para escrita de teste.

## Aceite e testes

- Suíte completa: **360/360** testes aprovados; conjunto direcionado **20/20**.
- Três testes novos verificam deduplicação por unidade, tipos/filtros, busca sem acentos, dados inválidos, vínculos offline/sem contato/parciais, encerramento/revogação e quantidade de consultas.
- Navegador com Worker real e SQLite isolado: duas listas, busca, filtros, atualização ao encerrar vínculo, falha/recuperação, navegação por ID, visualizador, Escape/foco, nomes escapados e lista longa em 390 × 844. Nenhum erro JavaScript. Escape fecha a lista mesmo com texto no campo de busca.
- Regressões de navegador aprovadas: escolas online/offline, mapa ampliado e revalidação D110.
- Capturas sintéticas em `evidencias/vinculos-panorama-d127-2026-11-16/`; identificação TESTE LOCAL visível. Comparação visual: composição e identidade mantidas, bloco compacto abaixo do mapa, modal com busca fixa e lista rolável. Não são capturas de produção.
- Build desktop aprovado: 152 arquivos, 14 bundles.

## Consumo

Nenhuma consulta SQL adicional. A resposta calcula `linked` sobre os mesmos registros já lidos; SQL/parametrização/caches permanecem iguais à base `7498a13`. A consulta aquecida continua com **três chamadas D1**, sem escrita. O teste de navegador comprovou zero nova requisição ao abrir/pesquisar/filtrar e somente uma nova leitura de frota após o intervalo existente de 60 segundos. Isso demonstra custo SQL incremental zero desta funcionalidade; não é estimativa de capacidade ilimitada do plano gratuito nem medição da conta inteira.

## Publicação

Implementação e verificações locais concluídas. Publicação e conferência autenticada serão registradas aqui após observadas. Não requer migração ou mudança de credenciais. Coletor, APK, localização e alertas preservados. Retorno possível para o painel D126 `13f871f2-d4f5-4b20-96b9-64cb73b32401`, sem rollback de banco.

## Roteiro para conferir

1. Abrir Panorama e localizar **Agentes por unidade**, abaixo do mapa.
2. Abrir Com agente vinculado; pesquisar uma unidade com vários computadores e conferir que aparece uma vez.
3. Abrir Sem agente vinculado e pesquisar por nome. Nomes ausentes mostram mensagem, sem consulta adicional.
4. Fechar/Escape; alterar filtro de tipo/regional e conferir contagem/lista correspondentes.
5. Clicar no nome para abrir a ficha da unidade. Não alterar vínculos reais como teste.
