[CmdletBinding()]
param(
 [string]$Dotnet='private-data/agent-build-tools/dotnet/dotnet.exe',
 [string]$Makensis='private-data/agent-build-tools/nsis/nsis-3.11/makensis.exe',
 [string]$Bootstrap='agente/SemedAgente-Instalador-0.1.8.exe',
 [string]$OriginalCore='private-data/analise-instalador-0.1.8/extraido/Semed.Agent.Core.dll',
 [ValidatePattern('^0\.1\.9-rc[0-9]+$')][string]$Version='0.1.9-rc3'
)
$ErrorActionPreference='Stop'
$repo=Split-Path $PSScriptRoot -Parent
Set-Location -LiteralPath $repo
$env:DOTNET_CLI_TELEMETRY_OPTOUT='1'
$env:DOTNET_NOLOGO='1'
$expected='CB486E517CDE0F58E1B209F4056249BA8FB276F429ABCE94163EF8065B6C02A7'
if((Get-FileHash -LiteralPath $Bootstrap -Algorithm SHA256).Hash -ne $expected){throw 'Instalador original 0.1.8 divergente.'}
& $Dotnet build windows/agent/src/Core -c Release --nologo -v:q
if($LASTEXITCODE -ne 0){throw 'Compilação falhou.'}
$out=Join-Path $repo ('private-data/releases/agent-'+$Version)
$payload=Join-Path $out 'payload'
New-Item -ItemType Directory -Path $payload -Force | Out-Null
Copy-Item -LiteralPath $Bootstrap -Destination (Join-Path $payload 'base-0.1.8.exe') -Force
Copy-Item -LiteralPath 'windows/agent/src/Core/bin/Release/net10.0/Semed.Agent.Core.dll' -Destination $payload -Force
foreach($name in @('Install.ps1','Recovery.ps1','LEIA-ME.txt')) {
 # Both Windows PowerShell 5.1 and NSIS must read accented text correctly.
 [IO.File]::WriteAllText((Join-Path $payload $name),[IO.File]::ReadAllText((Join-Path 'windows/agent/installer' $name)),[Text.UTF8Encoding]::new($true))
}
$manifest=[ordered]@{version=$Version;bootstrap_sha256=$expected;core_sha256=(Get-FileHash (Join-Path $payload 'Semed.Agent.Core.dll')).Hash;original_core_sha256=(Get-FileHash $OriginalCore).Hash;rc1_core_sha256='3FF51B57FC03010257246D676E4C72DF937931787307A115CF2555115657E26A';assembly_binding_version='0.1.8.0';status='api-publicada-piloto-fisico-pendente'}
$manifest['recovery_sha256']=(Get-FileHash (Join-Path $payload 'Recovery.ps1')).Hash
$manifest | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $payload 'manifest.json') -Encoding UTF8
$exe=Join-Path $out ('SemedAgente-Instalador-'+$Version+'.exe')
& $Makensis /V2 /INPUTCHARSET UTF8 "/DVERSION=$Version" "/DPAYLOAD=$payload" "/DOUTFILE=$exe" (Join-Path $repo 'windows/agent/installer/Setup.nsi')
if($LASTEXITCODE -ne 0){throw 'Empacotamento NSIS falhou.'}
$manifest['installer_sha256']=(Get-FileHash $exe).Hash
$manifest['installer_bytes']=(Get-Item $exe).Length
$manifest | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $out 'release.json') -Encoding UTF8
Write-Output $exe
Write-Output ($manifest | ConvertTo-Json -Compress)
