# Auditoria atual — 15/11/2026, até D122

O pedido atual é a auditoria integral pelo Claude. Use a branch `codex/auditoria-completa-2026-11-15` e o commit registrado no manifesto do pacote. A preparação consolida código recente e documentação; não é auditoria independente concluída nem implantação nova.

1. [Pedido completo ao Claude em TXT](2026-11-15/00_PEDIDO_AO_CLAUDE.txt).
2. [Estado vigente, versões e limitações](../07-operacao/13_ESTADO_ATUAL_D122.md).
3. [Matriz de 40 áreas e contraprovas](2026-11-15/01_ESCOPO_E_CRITERIOS.md).
4. [Execução e cenários](2026-11-15/02_EXECUCAO_E_CENARIOS.md).
5. [Modelo da devolutiva](2026-11-15/03_MODELO_DEVOLUTIVA.md).
6. [Verificações da preparação](2026-11-15/04_VERIFICACAO_DA_PREPARACAO.md).

O pacote reproduz código/documentação versionados do commit, com hashes e omissões explícitas das capturas/logs operacionais históricos. Fonte Windows disponível é o Core reconstruído mais instalador/testes, não o projeto original completo. Segredos, dados operacionais, binários privados e assinaturas não acompanham o material.

## Registro histórico da preparação de 08/11/2026

O conteúdo a seguir permanece para rastreabilidade; suas contagens e versões não descrevem o estado atual.

# Preparação para auditoria do Inventário Tecnológico SEMED

Referência: 08/11/2026, America/Fortaleza. Pedido do responsável: atualizar o repositório para auditar funcionamento e lógicas. Esta entrega organiza fontes, amplia a verificação automática e envia os commits locais ao repositório existente. Não é um parecer de auditoria independente nem uma nova implantação em produção.

## Começar por aqui

1. Ler [00_LEIA_ANTES_DE_TUDO.md](../../00_LEIA_ANTES_DE_TUDO.md), [AGENTS.md](../../AGENTS.md), [precedência](../00-governanca/REGRAS_DE_PRECEDENCIA.md), [decisões](../00-governanca/DECISOES.md), [pendências](../00-governanca/PENDENCIAS.md) e [conflitos documentais](../00-governanca/CONFLITOS_DOCUMENTAIS.md).
2. Usar a [matriz de regras, código e testes](MATRIZ_DE_LOGICAS.md) para localizar a implementação e construir contraprovas. A Base original permanece preservada; decisões posteriores prevalecem somente no escopo explicitamente aprovado.
3. Executar o [roteiro completo em TXT](ROTEIRO_AUDITORIA.txt). O [manual operacional](../07-operacao/README.md) explica instalação isolada, contratos, segredos por nome, backup e migração.
4. Comparar seus resultados com a [verificação desta entrega](VERIFICACAO_2026-11-08.md). Registrar defeitos reproduzíveis separadamente de limitações conhecidas, propostas e dúvidas funcionais.

Repositório público: https://github.com/tdiasilva-create/inventario

Painel desktop: https://painel-semed-paco.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev/login

Coletor: https://inventario-semed-lumiar.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev/login

## Escopo técnico e versões

| Componente | Situação documentada |
|---|---|
| Aplicação | HTML, CSS e JavaScript em módulos; frontend em `web/`; Worker/API em `server/` |
| Hospedagem | Dois Workers, mesmos dados D1; interfaces e permissões distintas |
| Fotos | Drive privado institucional como provedor configurado; adaptador R2 também existe. Não exigir migração de provedor para auditar |
| Banco versionado | 18 migrações; 64 tabelas, 40 índices explícitos, uma view e 10 triggers no SQLite de referência |
| Telemetria | Agente Windows externo; cadastro técnico, assinatura, QR, vínculo humano, presença e inventários |
| Monitoramento | Cron no painel a cada minuto; consulta da interface a cada 15 segundos quando visível |
| Atendimento | Demandas manuais por unidade/equipamento, situação e histórico; separadas dos incidentes automáticos |
| Código de aplicação antes desta organização | Commit `a5b5af6`; correção de navegação já publicada. A entrega documental acrescenta testes/documentação sem alterar o runtime |

O catálogo físico é [gerado das migrações](../07-operacao/gerado/DICIONARIO_DADOS.md); o [JSON](../07-operacao/gerado/schema.json) inclui SQL e hashes. Tabelas internas do serviço D1 não fazem parte dessa contagem.

Últimas versões de produção **conferidas nos relatórios anteriores**, não consultadas novamente nesta organização:

- Painel: `e4ac8db6-ea92-42e0-8977-2ea21b9514ba`, 100% do tráfego, [correção de navegação](../05-qualidade/NAVEGACAO_PAINEL_2026-11-08.md).
- Coletor: `859d0016-755f-4104-94ed-94e4780e2f8e`, 100%, preservado durante as últimas entregas desktop; [D-068](../05-qualidade/PUBLICACAO_D068_2026-11-06.md).
- Migrações remotas até 0018: [D-070](../05-qualidade/MONITORAMENTO_2026-11-08.md) e [D-071](../05-qualidade/CENTRAL_DEMANDAS_2026-11-08.md).

Versão do Worker não é hash Git. O coletor não foi republicado a cada alteração do painel; não presumir que os dois bundles remotos sejam idênticos ao HEAD atual. Uma auditoria de implantação deve conferir versões, configuração e artefatos de cada Worker separadamente, por acesso institucional autorizado.

## O que foi organizado

- Repositório antes do envio: sete commits locais de D-068, consulta, monitoramento, demandas e correção de menus ainda ausentes em `origin/main`.
- Manual atualizado para as 18 migrações e módulos atuais. Os relatórios antigos conservam suas datas e contagens históricas.
- CI passa a executar nove roteiros de navegador, além de domínio/API, builds, links, esquema e reprodução do manual TXT. CI não publica Workers nem utiliza segredos institucionais.
- Roteiro integrado do coletor atualizado para conferir AnyDesk/RustDesk na consulta embutida atual, substituindo somente o seletor da janela antiga. O fluxo completo continua sendo verificado.
- Pacotes de pedidos recebidos passam a constar expressamente da exclusão Git e do verificador de caminhos privados. Não foram removidos do computador.

## Limites e materiais privados

O repositório público não contém dumps, contas de teste reais, senhas, OAuth JSON, tokens, arquivos originais do Drive, instaladores ou capturas com dados operacionais. Estes materiais precisam de transferência institucional privada quando forem necessários à auditoria. Testes usam fixtures identificadas e persistência isolada.

As capturas locais geradas pelos testes ficam em `docs/05-qualidade/evidencias/`, ignorado pelo Git. Os relatórios públicos descrevem os testes; menções a caminhos privados não prometem que as imagens estejam disponíveis no clone. Reexecutar os roteiros para produzir evidência nova com dados sintéticos.

O rascunho local não versionado `docs/04-dados-apis/MAPA_DADOS_E_ACOES_SISTEMA_2026-11-06.md` não foi incorporado como fonte vigente: contém conclusões anteriores à implementação de monitoramento/demandas. Foi preservado para revisão, sem sobrepor as decisões registradas.

Pendências relevantes: offline durável; homologação física do EXE exato e câmera/teclado no celular; recuperação completa de banco, fotos e chaves; política institucional de backup/retenção; partes de relatórios e planejamento; carga de planilhas e divergências das fontes. Consultar [estado atual](../07-operacao/09_ESTADO_E_PENDENCIAS.md). Testes verdes não eliminam essas pendências.

## Correções locais posteriores à fotografia desta auditoria

Em 09/11/2026, a [Fase 1 de desempenho](../05-qualidade/CORRECOES_PRODUCAO_FASE_1_2026-11-09.md) acrescentou cache revalidado, otimizações de fotos e migração aditiva 0019. Código local: 19 migrações/42 índices; ambiente publicado continua com 18/40. A seção acima mantém a referência de 08/11. Testes locais: 134 e dez roteiros de navegador, sem deploy nem escrita em serviços reais.

**Atualização posterior no mesmo dia:** publicação real autorizada e concluída nos dois Workers; migração 0019 aplicada, com backup anterior e cadastros preservados. A referência vigente passa a 19 migrações e dois índices adicionais também em produção. Ver [publicação da Fase 1](../05-qualidade/PUBLICACAO_FASE_1_2026-11-09.md). Testes HTTP de acesso/cache aprovados; novo teste autenticado de fotos não realizado, pois a sessão expirou. As demais fases da auditoria não foram publicadas nesta entrega.
