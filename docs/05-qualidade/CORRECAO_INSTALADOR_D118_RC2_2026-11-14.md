# D118 — falha física do rc1 e correção rc2

14/11/2026, máquina designada pelo responsável: DESKTOP-HOJK7JH, Windows 10 x64 build 19045. Execução e acompanhamento local expressamente solicitados. Não houve mudança do servidor, migração adicional ou remoção de identidade.

## Falha confirmada

Instalação nova rc1 criou a base 0.1.8, conta virtual e dados protegidos, mas falhou antes de substituir o Core. Serviço ficou parado/desabilitado por proteção. Arquivo original, backup e DLL de preparação estavam presentes. Registro ainda era 0.1.8.0. Nenhum agente estava instalado antes dessa tentativa.

Reprodução isolada no Windows PowerShell 5.1 confirmou que `[IO.File]::Replace($staged,$currentCore,$null)` converte o terceiro argumento string em caminho vazio e lança `ArgumentException: O caminho tem um formato inválido`. O rc1 também compilava textos NSIS e script sem codificação explícita, produzindo acentos corrompidos. Os testes anteriores de protocolo/Core não cobriam a troca real de arquivo pelo instalador neste PowerShell.

## Correção e proteção

- `Replace-AgentCore` fornece caminho real e exclusivo para backup da substituição atômica. Backup anterior independente também preservado.
- Retoma a instalação interrompida somente com serviço parado/desabilitado, registro 0.1.8.0, Core original conhecido, DLL de preparação rc1 e backup original com hashes corretos. Não reativa instalação revogada nem serviços desabilitados sem essas evidências.
- NSIS recebe `/INPUTCHARSET UTF8`; script e texto são empacotados com BOM UTF-8 para Windows PowerShell 5.1.
- Transcrição persistente em `%LOCALAPPDATA%/SEMED/InstallerLogs`, com motivo e ponto da falha; sem chaves/configuração privada no log.
- Core permanece exatamente igual ao aprovado localmente em D118. Só o empacotamento/instalação foi alterado; nenhum deploy necessário.

## Evidências

- 11 regressões executadas por Windows PowerShell 5.1: reprodução do rc1, troca/restauração real em arquivos isolados, falha preserva destino e seleção conservadora de recuperação. Script: `windows/agent/tests/Installer.Tests.ps1`.
- EXE rc2 recompilado e extraído sem executar; base/Core conferidos; Install.ps1 contém BOM EF BB BF.
- SHA-256 instalador: `516186FB12A9CF82EDD996A215772BB7853DF58F973FD1D1FE483F672C5645F8`; 26.594.135 bytes, sem assinatura Authenticode.
- Core: `3FF51B57FC03010257246D676E4C72DF937931787307A115CF2555115657E26A`; mesmo hash do rc1.
- Instalador rc2 da Área de Trabalho executado com elevação pelo Windows em 14/11/2026, 18:41:43–18:41:45 Fortaleza; exit code 0. A ferramenta não operou a autorização UAC.
- Log `C:/Users/SIGAE/AppData/Local/SEMED/InstallerLogs/install-20261114-184143.log`: recuperação reconhecida, núcleo substituído e sucesso.
- Registro 0.1.9-rc2; serviço `SemedInventoryAgent` Running, conta `NT SERVICE/SemedInventoryAgent`, início automático atrasado (`DelayedAutoStart=1`). Hash instalado conferido.
- Janela real às 18:42:16: núcleo 0.1.9, `pending_pairing`, ativação `accepted`, HTTP 200, servidor alcançável, QR válido disponível e zero mensagens pendentes. CNG sob conta de serviço, chave não exportável. Conteúdo do QR não foi copiado para esta documentação.

## Ainda falta

O responsável vincular esta máquina à unidade/ambiente corretos pelo QR. Só depois conferir heartbeat/inventário aceitos, executar verificação leve e medição real limitada, cancelamento e retorno. Esta instalação confirma recuperação e cadastro automático, não homologação integral de internet nem atualização de máquina previamente vinculada. Não distribuir em massa antes desses testes.

O rc1 deve ser retirado de uso; cópias históricas preservadas. Atual: `C:/Users/SIGAE/Desktop/SemedAgente-Instalador-0.1.9-rc2.exe`, também em Downloads/SEMED_PILOTO_INTERNET_0_1_9. Não desinstalar nem executar PURGE para repetir o piloto.

## Piloto leve concluído — 14/11/2026, 18:50 Fortaleza

Depois de o responsável vincular o computador à unidade teste / Casa / Mesa e solicitar expressamente “faça o teste”, foi registrado UM pedido leve pela conta administrativa Cloudflare já autenticada, pois a automação do navegador estava indisponível. Autor técnico registrado como cloudflare-admin:piloto-autorizado, origem administrative_cli no contexto, sem impersonar sessão root. O INSERT condicionado preservou vínculo ativo, instalação não revogada, unidade ativa, capacidade declarada, intervalo de cinco minutos e limite de fila. Não foram criadas sessões nem alteradas permissões. SQL/manifesto/resultados permanecem em private-data/releases/agent-0.1.9-rc2/pilot-light/.

Pedido 0a1b2bee-3f8b-49a9-a78f-005e80973c77: agente o recebeu no heartbeat, iniciou pelas rotas assinadas e enviou resultado real. Estado completed; início 18:50:01, recebido 18:50:09 Fortaleza. Latência HTTP mediana 92.49 ms; variação 22.44 ms; duração da medição 6.702 s. IP/rede observados pelo servidor, não inventados. IP completo somente na evidência privada e no sistema. Download/upload nulos, conforme modo light; interface desconhecida. Nenhum erro retornado.

Vínculo e primeiro inventário foram confirmados também pela captura enviada pelo responsável e pela leitura real. Esta evidência valida serviço → entrega → autorização de máquina → medição externa → resultado persistido. Não valida acionamento pelo botão do navegador nem uma sessão humana/CSRF neste ensaio, e não homologa velocidade, cancelamento, queda/retorno ou atualização de máquina previamente vinculada. Não há resultado sintético inserido: apenas o pedido administrativo; resultado foi escrito pelo fluxo real autenticado do agente.
