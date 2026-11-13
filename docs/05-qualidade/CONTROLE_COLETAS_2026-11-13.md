# Controle das coletas — testes e publicação D-111

## Fontes e requisitos
Lidos: 00_LEIA_ANTES_DE_TUDO.md, AGENTS.md, REGRAS_DE_PRECEDENCIA.md, decisões/pendências/conflitos aplicáveis (D-045, D-065, D-080, D-085/086, D-108/110), MESA_DE_DADOS.md, RELATORIOS_E_PLANEJAMENTO.md, MODELO_CONCEITUAL.md, 02_FLUXO_DE_INTEGRACAO.md, 03_CONTRATOS_E_PERMISSOES_PROPOSTOS.md, Base original §§7–10 e COLETAS_EM_ANDAMENTO_01.md. Cinco fontes DOT examinadas; cinco PNGs desktop abertos na ordem do manifesto: 00_painel_geral_APROVADO.png, 01_mapa_da_rede_APROVADO.png, 02_matriz_equipamentos_APROVADA.png, 03_unidade_selecionada_APROVADA.png, 04_indicadores_integrados_ESTUDO_APROVADO.png. Cores atuais D-065/D-080 prevalecem sobre imagens históricas; nenhuma escola fictícia copiada.

Contrato: [D-111](../03-painel-desktop/CONTROLE_COLETAS_D111.md). Base original/questionário preservados. Cobertura adicional de §§7.6 e 9: acompanhamento e decisão administrativa auditada; não implementa offline ou novas perguntas. Classificação não substitui conclusão técnica (§7.5).

## Verificações locais
- 283 testes aprovados na suíte completa, incluindo sete cenários novos de servidor: vazio/zero/false, conclusão persistente, fontes de contribuição/fotos ready, versão/idempotência, perfis/CSRF/sessão, filtros/paginação/escopo, migração/rollback/índice.
- Navegador Edge local: lista, confirmação root, nova contribuição mantendo completa, histórico, busca, 390px sem overflow global, falha de leitura conservando resultados e visualizador sem edição; zero erros JS.
- Capturas locais de dados TESTE ISOLADO: evidencias/controle-coletas-2026-11-13/01-lista-desktop.png, 02-decisao-root.png, 03-historico.png e 04-mobile.png; browser.json resume verificações. Tabela estreita usa rolagem horizontal; painel desktop permanece interface principal.
- Build desktop 111 arquivos, nove bundles. Wrangler dry-run aprovado.
- Backup prévio privado: 11.556.628 bytes; SHA256 `3c06dbbeb79350e6dce72716c6a1e6a75e2aee9061d35f53de3b21376d019f68`. Ensaio da migração preservou hashes das 89 tabelas existentes; integrity_check ok e zero inconsistências de FK. Projeção inicial: 34 ambientes, 86 equipamentos, dois outros equipamentos, 107 fotos ready e 39 seções com informação. Isso não representa número de unidades nem classificação completa.

## Roteiro de conferência root
1. Abrir Controle das coletas no menu. Filtrar Sem dados e conferir uma unidade que só tem cadastro administrativo.
2. Abrir Coleta parcial; usar Ver unidade/Ver visita aberta para conferir os dados.
3. Somente depois da conferência real, Classificar → Coleta completa → Salvar classificação. Conferir autor/data em Histórico.
4. Após uma contribuição posterior, clicar Atualizar: a classificação deve continuar completa.
5. Para devolver à lista parcial, Classificar → Coleta parcial. Histórico conserva a decisão anterior.
6. Admin/visualizador devem conseguir consultar sem botão Classificar; operador permanece no coletor.

Não foram feitas classificações ou exclusões de unidades reais para simular teste. Publicação e conferência remota registradas abaixo após execução.

## Publicação real — 13/11/2026, 08:16 Fortaleza
- Migração 0032 aplicada: 33 comandos, sucesso; nenhuma outra migração pendente.
- Painel publicado em 100%: `8de55b71-dd1e-4fad-b3b7-12267b0d7fad`. Coletor/EXE/APK e plano gratuito preservados; crons, localização e alertas permanecem.
- 51 verificações públicas gerais e seis verificações específicas de rotas protegidas aprovadas (sem sessão: página/código 302 e APIs 401).
- Consulta de conferência somente leitura no D1 real: 65 unidades sem dados, 11 parciais, nenhuma completa e nenhuma classificação manual. Totais da consulta no momento da publicação, não valores fixos. Nenhuma unidade real foi classificada para teste.
- Agregação remota: 163 linhas lidas e zero escritas, sem varrer respostas/fotos; consulta manual, não adicionada ao polling. Não equivale a consumo diário nem garantia de capacidade ilimitada.
- Sessão disponível no navegador expirou. Solicitado login root para conferência visual autenticada; permanece pendente até o usuário entrar. Screenshot local não é evidência de navegação autenticada em produção.
- Logs/backup/rehearsal/checagens privadas em `private-data/d111-release/`, excluídos do repositório.

Endereço: https://painel-semed-paco.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev/controle-coletas

Revisão final às 08:19 Fortaleza: `d3441775-76df-4436-b72a-5e4117ce8eef` (100%), com proteção contra resposta atrasada do histórico sobrescrever um diálogo novo. Teste de navegador repetido e aprovado. Versão anterior desta entrega: `8de55b71-dd1e-4fad-b3b7-12267b0d7fad`.

## Conferência autenticada em produção — 13/11/2026, 08:38–08:39 Fortaleza

Após o responsável informar login concluído como root, a navegação pelo menu abriu Controle das coletas no endereço publicado. Foram observados 76 registros elegíveis: 65 Sem dados, 11 Coleta parcial e zero Coleta completa. São números deste instante, não constantes do sistema.

- Filtro Coleta parcial retornou 11 unidades; busca por `alana` reduziu a lista a EMI ALANA LUDMILA, com indicação Coleta parcial e sem decisão registrada.
- Classificar abriu o diálogo correto para essa unidade, oferecendo parcial/completa e explicando a permanência de completa até alteração pelo root. O diálogo foi cancelado, sem salvar.
- Histórico consultou o servidor e mostrou ausência de classificação manual, sem erro ou espera permanente.
- Filtro Coleta completa mostrou zero resultados e mensagem explícita. Limpar restaurou 76 unidades e os três totais.
- Nenhuma classificação, exclusão ou dado fictício foi gravado nesta verificação. Escrita, histórico e permanência após contribuição já foram exercitados nos testes locais; não foi simulada uma decisão administrativa em unidade real.
- Capturas reais: `evidencias/controle-coletas-2026-11-13/05-producao-lista.jpg` e `06-producao-dialogo.jpg`. A janela disponível estava estreita; a tabela conserva rolagem horizontal. Conferência visual autenticada encerrada; aba entregue aberta ao responsável.

A pendência de login citada na publicação foi resolvida nesta conferência. Não houve nova publicação ou alteração do código nesta etapa.
