# Registro de preparação da auditoria — 08/11/2026

Pedido: atualizar o repositório para auditoria de funcionamento e lógicas. Referência da aplicação: `a5b5af6`. Trabalho desta rodada: documentos, roteiro TXT, verificação Git/CI e ajuste de teste desatualizado. Nenhuma alteração de formulários, regras de servidor, credenciais, dados reais ou deploy.

## Documentos e critérios

Consultados: entrada do projeto, AGENTS.md, precedência, decisões/pendências/conflitos e rastreabilidade; guias de operação, banco, testes e estado; contratos atuais de consulta/monitoramento/demandas; relatórios D-068–D-071 e correção de navegação. Implementações e testes correspondentes foram usados para conferir nomes de rotas e arquivos. A Base original e imagens aprovadas foram preservadas, sem nova mudança funcional/visual que as altere.

Aceite: fontes organizadas; regras localizáveis; instalação/testes reproduzíveis sem segredos; resultados e limitações explícitos; esquema/manual reproduzíveis; conteúdo privado fora do Git; branch remota atualizada com histórico preservado. A CI não executa implantação.

## Resultados locais

Ambiente: Windows, Node 24.19, pnpm 11.25.0, Playwright 1.62.1, navegador Edge. Fixtures SQLite isoladas; provedores externos simulados nos testes. Logs privados em `private-data/auditoria-2026-11-08/`.

| Verificação | Resultado |
|---|---|
| `pnpm test` | 129 aprovados; zero falhas e zero ignorados |
| Build desktop | 76 arquivos; coletor não incluído |
| Build coletor | 47 arquivos |
| `pnpm docs:schema` | 18 migrações; 64 tabelas, 40 índices explícitos, uma view, 10 triggers; integridade ok, zero violações FK |
| Navegador: cadastro | Aprovado; tipos, matriz, importação e filtros |
| Navegador: equipamentos | Aprovado; paginação, IDs remotos, fotos, ficha, erros e rotas |
| Navegador: monitoramento | Aprovado; perda/retorno, peças, atualização, foco/cursor e leitura |
| Navegador: operações | Aprovado; laboratório, tooltip, demandas, histórico, ausência e responsividade |
| Navegador: navegação | Aprovado; menus, voltar/avançar, consultas independentes, timeout, retry e 401 |
| Navegador: fluxo V3 | Aprovado após atualizar seletor histórico; sete fotos sintéticas, QR, publicação e IDs remotos conferidos no painel |
| Navegador: UX | Aprovado; busca, conclusão, foco/cursor durante upload, campo inválido e retorno à rolagem |
| Navegador: identidade coletor | Aprovado; assets, login em 360–1280px, cartões e leitor em paisagem |
| Navegador: identidade painel | Aprovado; 17 rotas, contagens por tipo, formulários, filtros e contexto de fotos |
| Links | 19 documentos, 91 links locais; nenhuma referência ausente. Conferência adicional: 117 menções a caminhos de código/testes na matriz, todas existentes |
| Reprodução TXT/esquema | Regenerados sem diferença em relação ao conteúdo preparado para commit |
| Índice Git | 482 arquivos; verificador de caminhos privados/padrões conhecidos aprovado |
| Histórico a enviar | Sete commits anteriores examinados por caminhos privados e assinaturas conhecidas de segredos; nenhum achado nesses critérios |

## Falha encontrada na automação

A primeira execução de `tests/collector-v3-browser.cjs` concluiu o fluxo de coleta, mas falhou no seletor `dialog details` ao consultar os dados no desktop. D-069 já substituiu essa janela pela consulta embutida. O teste foi atualizado para localizar o computador pelos dados publicados, conferir AnyDesk/RustDesk na lista e na ficha e verificar ausência de janela modal. Não foi removida a conferência dos dados nem alterada a aplicação para satisfazer um teste antigo. Log original preservado como `v3-anterior.log`.

## Repositório e CI

Sete commits locais anteriores estavam à frente de `origin/main`, sem divergência após fetch. São as entregas de cadastro ampliado, consulta, monitoramento, demandas e correção de navegação. A atualização inclui esse histórico, sem squash, force-push ou reescrita de decisões.

CI ampliada de quatro para nove roteiros de navegador. O verificador de arquivos privados inclui o diretório local `pedidos/`; o diretório é ignorado, não apagado. O mapeamento avulso não versionado anterior às novas funções foi preservado fora da documentação vigente.

Os nove roteiros locais passaram. O resultado da CI remota é associado ao SHA no GitHub Actions. Este documento não declara aprovação remota antes de a execução terminar. Consultar a execução do commit recebido; sem credenciais e sem deploy automático.

## O que não foi executado

Nenhum upload ao Drive real, escrita D1 oficial, teste de câmera física, instalação Windows, troca de peça, migração de servidor ou restauração completa. Versões de produção são as últimas registradas nos relatórios, sem nova sondagem desta rodada. Esta preparação não é certificação de segurança nem parecer independente de toda a aplicação. O verificador de segredos cobre padrões conhecidos e caminhos, não garante ausência de todo dado sensível possível.
