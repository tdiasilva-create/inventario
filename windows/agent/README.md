# Agente Windows 0.1.9-rc3 — recuperação assistida

API compatível publicada nos dois Workers em 14/11/2026 (D118). Rc1 apresentou erro de File.Replace no PowerShell 5.1 e não deve ser distribuído. Rc2 corrigiu instalação e passou pelo piloto físico de cadastro/QR/vínculo/inventário/medição; acionamento pelo painel também conferido. Rc3 acrescenta recuperação explícita D119 com backup de pendências, nova identidade e preservação do histórico. Atualização normal não reinicia identidades; o modo Recuperar recusa cadastros válidos. [Funcionamento, testes e limite físico](../../docs/05-qualidade/RECUPERACAO_AGENTE_D119_2026-11-14.md).

O responsável indicou a pasta `agente`. Ela contém o instalador **0.1.8**, não o projeto-fonte. O núcleo aqui é uma reconstrução da análise desse binário, com extensão de testes de internet. Não apresentar como código original recebido nem substituir silenciosamente a referência histórica D-056.

## Proveniência

- Instalador original 0.1.8: SHA-256 `CB486E517CDE0F58E1B209F4056249BA8FB276F429ABCE94163EF8065B6C02A7`.
- Core original extraído: `6757C2613130BDA7E6FC63F70BA6286E783C7B47F117BADF7E48601569ACE0F5`.
- Origem local da reconstrução: `private-data/analise-instalador-0.1.8/decompilado/core-resolvido` (ILSpy). Cópia em `src/Core`; retirados dois atributos GeneratedRegex que duplicavam código já expandido. Fluxos de inventário, QR, instalação, chave, fila e IPC mantidos; extensão isolada em `AgentEngine.Network.cs` e `NetworkMeasurement.cs`.
- Nova DLL mantém AssemblyVersion 0.1.8.0 para vínculo binário com o serviço/UI originais; FileVersion 0.1.9.0 e núcleo reportam 0.1.9. Comparação automatizada de todas as assinaturas públicas do Core antigo passou.
- Serviço, UI, biblioteca Windows, runtime e desinstalador originais vêm do EXE 0.1.8 preservado. Algumas etiquetas fixas de UI continuam 0.1.8; a versão reportada pelo núcleo é 0.1.9. Não confundir esse pacote híbrido com reconstrução integral do projeto original.
- Testes legados vieram da fonte histórica 0.1.6 e validam regressões do Core reconstruído. Ajuste de caminho e globalização em `tests/Legacy` documentado; não usado para substituir a implementação atual pela antiga.

## Compilar

Windows x64, .NET SDK 10 e NSIS 3.11. SDK portátil usado: 10.0.404, obtido de builds.dotnet.microsoft.com e conferido por SHA-512 do manifesto Microsoft. NSIS ZIP 3.11 conferido por SHA-256 `c7d27f780ddb6cffb4730138cd1591e841f4b7edb155856901cdf5f214394fa1`; mirror MacPorts usado após os links SourceForge devolverem HTML. Ferramentas/binários ficam em private-data, fora do Git.

```powershell
./scripts/build-windows-agent.ps1 -Dotnet '<dotnet.exe>' -Makensis '<makensis.exe>' -Bootstrap '<instalador 0.1.8>' -OriginalCore '<Core original extraído>'
```

Saída: `private-data/releases/agent-0.1.9-rc3/`, EXE + release.json + payload. Scripts de build não instalam serviço nem publicam. O instalador é NSIS com elevação administrativa; bootstrap original só em instalação nova, com `/NOSTART`; atualização existente aceita Core 0.1.8/rc1/rc2/atual por hash, com troca atômica e backup. Recusa caminho/conta/hash divergentes. Não usa `/PURGE`, não revoga nem associa máquina à escola. No modo explícito Recuperar, arquiva o diretório original em AgentRecovery e prepara outro estado/ID, mantendo configuração e ACLs. A chave antiga permanece no CNG; nova chave será criada sob a conta de serviço. Fila antiga nunca é reenviada sob nova identidade. Retomada usa manifesto durável e serviço parado/desabilitado até o fim. Normal update preserva ProgramData. Rc1 interrompido mantém reconhecimento conservador; testes Windows PowerShell 5.1 em `tests/Installer.Tests.ps1` e `tests/Recovery.Tests.ps1`.

## Testar

```powershell
dotnet run --project windows/agent/tests/Legacy -c Release
dotnet run --project windows/agent/tests/Network -c Release -- '<Core original extraído>'
# Windows PowerShell 5.1: produz diretório isolado e imprime INTEGRATION_FIXTURE
powershell.exe -NoProfile -ExecutionPolicy Bypass -File windows/agent/tests/Recovery.Tests.ps1
dotnet run --project windows/agent/tests/Recovery -c Release -- '<INTEGRATION_FIXTURE impresso>'
```

Os testes usam HTTP controlado, chave apenas de desenvolvimento em diretório temporário e banco local. Não abrem câmera, não instalam serviço nem acessam produção. O tráfego real, CNG sob conta de serviço, UAC/SmartScreen, atualização/rollback e QR em Windows físico ainda exigem homologação.

Pacote sem assinatura Authenticode. Não instalar em massa nem antes da publicação da API compatível. Contrato completo: [D118](../../docs/04-dados-apis/TESTES_INTERNET_D118.md).
