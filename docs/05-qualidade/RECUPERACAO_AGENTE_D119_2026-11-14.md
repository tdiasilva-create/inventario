# D-119 — recuperação assistida de identidade revogada (14/11/2026)

Pedido explícito: implementar no instalador, preservar pendências/histórico, testar e entregar EXE para novo QR e vínculo à unidade correta. Implementado e testado localmente; NÃO executado sobre o agente válido desta estação nem sobre o computador remoto revogado. Sem publicação, migração ou alteração de dados reais.

## Causa e escopo

A máquina relatada já executava o núcleo 0.1.9, mas conservava fase `revoked` e uma mensagem pendente. Conferência anterior somente leitura mostrou revogação em 06/11/2026 por `unit_deleted`; instalar uma versão nova preservava corretamente essa identidade. Atualização e recuperação agora são escolhas separadas. A revogação antiga permanece válida, não é revertida no banco.

Consultados: `00_LEIA_ANTES_DE_TUDO.md`, `AGENTS.md`, governança (precedência/decisões/pendências/conflitos), `INSTALADOR_OFICIAL.md`/JSON, `CONTRATO_QR_E_AGENTE.md`, D118 e registros de qualidade do rc2/piloto, código Core recuperado do 0.1.8 e instalador rc2. Referência histórica D056 preservada. Nenhuma pergunta da Base de Coleta foi alterada nesta entrega; não amplia escopo mobile/desktop/APK.

## Implementação

- `windows/agent/installer/Setup.nsi`: padrão Instalar/atualizar; opção explícita Recuperar instalação revogada, com confirmação sobre arquivamento da fila.
- `Install.ps1`: exclusão mútua entre instaladores, validações de serviço/conta/caminho/hash, parada/desabilitação temporária antes de qualquer mudança de identidade; retomada controlada. Atualização normal continua preservando identidade/fila/vínculo.
- `Recovery.ps1`: estado revogado reconhecido; recusa linked/pending_pairing/awaiting_grant/identity_conflict, estado corrompido, caminhos redirecionados e servidor diferente. Backup de todos os arquivos, tamanho/SHA-256 e flush antes da troca; manifesto durável e ponteiro de transação. Caminhos calculados dentro do mesmo pai SEMED, sem exclusão recursiva.
- Guarda snapshot e diretório original em `C:\ProgramData\SEMED\AgentRecovery\<UUID>`. Snapshot herda ACL protegida de SYSTEM/Administradores. Diretório original retém ACL de origem; a conta de serviço permanece autorizada aos próprios dados. Configuração e permissões da nova área são preservadas e verificadas pelo serviço.
- Novo `installation_id` e `key_name`. A chave CNG nova será criada pelo serviço sob a conta original, sem apagar/exportar a antiga. Não copiar perfil DPAPI/CNG nem usar PURGE.
- Somente configuração e estado novo entram na área ativa. Fila, QR, grant e resultado de teste antigos permanecem arquivados, sem reenvio sob nova identidade. Os bytes pendentes não são apresentados como recebidos pelo servidor.
- Após interrupção com transação pendente, instalador mantém serviço parado/desabilitado e pede repetir o modo Recuperar. A retomada usa o mesmo ID já preparado, inclusive se o serviço chegou a cadastrar esse ID antes da falha. Conclusão do registro também é retomável.
- Nova identidade usa a API automática D058 existente; não cria escola/ficha nem assume vínculo. Operador escolhe unidade/ficha pelo coletor e lê o QR. Mensagem do Core revogado passa a orientar recuperação, substituindo a recomendação antiga de PURGE/lote.

## Testes executados

| Conjunto | Resultado | Evidência |
|---|---:|---|
| Arquivos/recuperação no Windows PowerShell 5.1 | 35 verificações | `windows/agent/tests/Recovery.Tests.ps1` |
| Core real consumindo estado produzido pelo PowerShell | 27 verificações | `windows/agent/tests/Recovery/` |
| Regressões do Core | 61 testes | `windows/agent/tests/Legacy/` |
| Rede e assinaturas públicas do Core 0.1.8 | 14 verificações | `windows/agent/tests/Network/` |
| Substituição/rollback da DLL e regressão rc1 | 11 verificações | `windows/agent/tests/Installer.Tests.ps1` |
| API local: cadastro automático, vínculos, revogação/idempotência | 23 testes | `tests/agentes.test.mjs`, `tests/revisao-independente.test.mjs`, `tests/agentes-open-enrollment.test.mjs` |

Casos relevantes: cópia idêntica da mensagem pendente e demais arquivos; recusa de cadastro válido; backup adulterado; manifesto adulterado; arquivo inesperado na preparação; junction; interrupções antes de arquivar, entre as duas renomeações e após ativar; retomada sem gerar segundo ID; preservação da configuração; ausência de fila antiga na nova execução; assinatura válida do novo cadastro; QR encodificável/compatível; reinício mantém QR; históricos imutáveis após executar Core em diretório isolado. HTTP desses testes é controlado; não cria agentes de teste na conta real. Chaves de teste não equivalem a homologação da CNG sob serviço no PC afetado.

Compilação NSIS e extração do EXE realizadas. Hashes de Core/bootstrap/Recovery.ps1 e BOM UTF-8 dos scripts/texto extraídos conferidos. Compilação final do Core sem erros; advertência NSIS somente de metadado LegalCopyright ausente. Comparação de todas as assinaturas públicas do Core antigo aprovada.

Prévia das mesmas telas compilada sem comandos de instalação e sem elevação. Janela abriu; captura automática falhou duas vezes com `window capture timed out: timed out waiting on channel`. Nenhuma captura simulada apresentada como real. Processo da prévia encerrado; serviço existente não alterado. Conferência visual final no Windows alvo permanece pendente.

Logs locais: `private-data/agent-build-tools/recovery-{files,core,legacy,network,server}.log`, `build-rc3.log`; pacote/manifesto/extração em `private-data/releases/agent-0.1.9-rc3/`. Arquivos de teste isolados no temporário; não há exclusão de dados reais.

## Executável entregue

- `SemedAgente-Instalador-0.1.9-rc3.exe`
- 26.603.528 bytes, SHA-256 `F284E9B2F030655ABD07480872E0405680B20F0B8B37583BB0891AD271C8DED7`.
- Core: `6E36E9CFC28623F2270459B9D2294ED6057DA8AF739343F37310CAA2388C8E35`; AssemblyVersion 0.1.8.0 preservada, versão do núcleo 0.1.9.
- Authenticode: NotSigned, como os pilotos anteriores. Nenhuma instrução para desativar proteções do Windows.
- Cópias entregues na Área de Trabalho e em `Downloads/SEMED_RECUPERACAO_0_1_9_RC3/`, com roteiro e manifesto.

## Aceite físico restante

No PC revogado, executar como administrador, selecionar recuperação, conferir backup/serviço e novo QR; abrir unidade correta e preferir ficha existente; confirmar inventário/último contato e teste root de internet. Conferir que a identidade antiga segue revogada e os arquivos pendentes arquivados. Se falhar, preservar log/backup e retomar, sem PURGE. Computadores válidos não precisam de recuperação. Não prometer suporte a identidades corrompidas, caminhos personalizados ou fonte original completa do serviço/UI (binários 0.1.8 preservados).
