# Correção de navegação e consultas do painel — 08/11/2026

## Diagnóstico confirmado

Relato do responsável: vários blocos presos em Consultando. Reproduzido em produção, autenticado como root: abrir Panorama e clicar em Computadores muda a URL para /computadores, mas desktop.js intercepta a navegação e cai no conteúdo padrão de Configurações. Como o estado interno continua Computadores, não dispara as consultas do Drive/agentes. O mesmo ocorre com Central de demandas. Abrir o endereço diretamente funciona. Não era evidência de indisponibilidade do D1 ou do Drive.

Falha da entrega D-071: o teste anterior navegava diretamente às rotas novas e não cobria o clique a partir do documento antigo. Novo roteiro falhou antes da correção no título Computadores por unidade e passou depois. Captura real anterior: evidencias/navegacao-painel-2026-11-08/producao-antes.png.

## Correção

- panel-shell.js separa rotas renderizadas por desktop.js do catálogo completo de links. Computadores/Demandas carregam operations.html pelo Worker, mantendo filtros/URL e histórico normal do navegador.
- Consultas GET de Configurações limitadas a 15 segundos, incluindo leitura do corpo. Erro explícito de conexão, sessão expirada, permissão ou resposta inválida; nova tentativa manual.
- Estado de agentes e autorizações independentes. Falha/lentidão de autorizações antigas não impede mostrar agentes nem política automática. Respostas antigas não substituem um filtro mais recente. Não há repetição automática, alteração de credenciais ou sucesso simulado.
- POSTs administrativos, banco, fotos, permissões, cron e coletor preservados. Sem migração ou escrita de dados durante a validação real.

## Fontes e aceite

Consultados: 00_LEIA_ANTES_DE_TUDO.md, AGENTS.md, REGRAS_DE_PRECEDENCIA.md, DECISOES.md, PENDENCIAS.md, CONFLITOS_DOCUMENTAIS.md; documentação desktop de interface, telas/interações, setores e CENTRAL_DE_DEMANDAS.md; ACEITE.md, CADASTRO_AUTOMATICO_2026-11-05.md, CENTRAL_DEMANDAS_2026-11-08.md e guia 05_PUBLICACAO_E_ROLLBACK.md. Cinco PNGs do manifesto já abertos na implementação D-071; nenhuma mudança de composição/paleta nesta correção. D-058/D-065/D-071 preservadas. Base original e perguntas do coletor intocadas.

Arquivos: web/panel-shell.js, desktop.js, desktop-agents.js, desktop-request.js; scripts/build-desktop.mjs; package.json; tests/panel-navigation-browser.cjs e documentação.

Testes aprovados contra Worker real e SQLite isolado:

1. Panorama → Computadores, voltar/avançar e retorno ao Panorama.
2. Panorama → Central de demandas; Configurações → ambas as telas.
3. Autorizações sem resposta não bloqueiam agentes nem mudança de filtro.
4. Google/agentes sem resposta: timeout, fim do Consultando, nenhum formulário de lote incorreto e recuperação por Tentar novamente.
5. Sessão expirada (401) explícita em ambos os blocos.
6. Roteiro operations-browser: tooltip, laboratório, demanda, histórico, ausência confirmada, atualização automática e responsividade.
7. Regressão desktop-identity-browser: 17 rotas antigas, campos, filtros, fotografias e responsividade; nenhum erro JavaScript.

Evidências isoladas em evidencias/navegacao-painel-2026-11-08/: computadores-menu.png, demandas-menu.png, consultas-interrompidas.png. Exemplos somente na base isolada.

## Publicação

Correção dentro da autorização vigente de publicar D-071 no ambiente real. Painel publicado na versão `e4ac8db6-ea92-42e0-8977-2ea21b9514ba`, 100% do tráfego; anterior `52ccaadf-0b9d-46be-99ce-4d8ae0b8ef8f` registrada para rollback. Coletor permanece `859d0016-755f-4104-94ed-94e4780e2f8e`. Bindings/variáveis e nomes dos segredos conferidos antes/depois, sem alteração. Cron diário e por minuto preservados. Sem escrita no D1, migração, novo envio de foto, revogação ou alteração de conta.

Conferência root real: Panorama → Computadores mostra a EM RAIO DE LUZ e DESKTOP-GQ2RO6D; Panorama → Central de demandas mostra a lista vazia real; Configurações mostra Drive conectado, política automática e agentes, zero mensagens Consultando e zero erros de consulta. Capturas producao-computadores-corrigido.png, producao-demandas-corrigido.png e producao-configuracoes-corrigido.png no mesmo diretório de evidências. Metadados e bundle anterior em private-data/navegacao-painel-2026-11-08 (fora do Git). Nenhum exemplo de teste inserido na produção.

Build, verificação de documentação e dry-run aprovados. Testes de navegador executados sobre os assets de dist/painel. Uma aba já aberta pode ainda executar o JavaScript anterior até recarregar; orientar atualizar a página uma vez após a publicação.
