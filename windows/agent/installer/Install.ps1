#Requires -Version 5.1
#Requires -RunAsAdministrator
[CmdletBinding()]
param([Parameter(Mandatory=$true)][string]$Payload,[ValidateSet('update','recover')][string]$Mode='update')
$ErrorActionPreference='Stop'
$logDir=Join-Path $env:LOCALAPPDATA 'SEMED\InstallerLogs'
New-Item -ItemType Directory -Path $logDir -Force | Out-Null
$logPath=Join-Path $logDir ('install-'+[DateTime]::Now.ToString('yyyyMMdd-HHmmss')+'.log')
Start-Transcript -LiteralPath $logPath -Force | Out-Null
$serviceName='SemedInventoryAgent'
$installDir=Join-Path $env:ProgramFiles 'SEMED\Agente de Inventario'
$dataDir=Join-Path $env:ProgramData 'SEMED\Agent'
$registry='HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\SemedInventoryAgent'
$manifest=Get-Content -LiteralPath (Join-Path $Payload 'manifest.json') -Raw | ConvertFrom-Json
$newCore=Join-Path $Payload 'Semed.Agent.Core.dll'
$bootstrap=Join-Path $Payload 'base-0.1.8.exe'
$backup=$null; $replaced=$false; $wasRunning=$false; $fresh=$false; $resumeIncomplete=$false; $oldDisplayVersion=$null
$recovery=$null; $recoveryDisabled=$false; $oldStartMode=$null; $stopped=$false
$mutex=[Threading.Mutex]::new($false,'Global\SEMED-Agent-Installer-v1')
$ownsMutex=$false
function Replace-AgentCore([string]$Staged,[string]$Current,[string]$BackupFile) {
 # Windows PowerShell 5.1 coerces $null in a string argument to an empty path.
 # Supply a real, unique backup path; preserve an atomic swap and the previous bytes.
 [IO.File]::Replace($Staged,$Current,$BackupFile)
}
function Test-InterruptedRc1([string]$Directory,$Service,[string]$RegisteredVersion,[string]$CurrentHash,$Manifest) {
 if($Service.State -ne 'Stopped' -or $Service.StartMode -ne 'Disabled' -or $RegisteredVersion -ne '0.1.8.0' -or $CurrentHash -ne $Manifest.original_core_sha256){return $false}
 $stagedFound=$false; $backupFound=$false
 foreach($file in Get-ChildItem -LiteralPath $Directory -File -Filter 'core-stage-*.dll') {
  if(-not ($file.Attributes -band [IO.FileAttributes]::ReparsePoint) -and (Get-FileHash -LiteralPath $file.FullName).Hash -eq $Manifest.rc1_core_sha256){$stagedFound=$true;break}
 }
 if(-not $stagedFound){return $false}
 foreach($folder in Get-ChildItem -LiteralPath $Directory -Directory -Filter 'backup-0.1.9-*') {
  if($folder.Attributes -band [IO.FileAttributes]::ReparsePoint){continue}
  $file=Join-Path $folder.FullName 'Semed.Agent.Core.dll'
  if((Test-Path -LiteralPath $file -PathType Leaf) -and -not ((Get-Item -LiteralPath $file).Attributes -band [IO.FileAttributes]::ReparsePoint) -and (Get-FileHash -LiteralPath $file).Hash -eq $Manifest.original_core_sha256){$backupFound=$true;break}
 }
 return $backupFound
}
function Verify-Hash([string]$Path,[string]$Expected){if((Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash -ne $Expected){throw "Integridade inválida: $([IO.Path]::GetFileName($Path))"}}
function Native([string]$File,[string[]]$Arguments){& $File @Arguments | Out-Null;if($LASTEXITCODE -ne 0){throw "Falha em $File (código $LASTEXITCODE)"}}
function Stop-Agent {
 $svc=Get-Service -Name $serviceName -ErrorAction Stop
 if($svc.Status -ne 'Stopped'){Stop-Service -Name $serviceName -ErrorAction Stop;$svc.WaitForStatus('Stopped',[TimeSpan]::FromSeconds(30))}
}
try{
 try{$ownsMutex=$mutex.WaitOne(0)}catch [Threading.AbandonedMutexException]{$ownsMutex=$true}
 if(-not $ownsMutex){throw 'Outro instalador SEMED esta em execucao. Aguarde sua conclusao.'}
 if(-not [Environment]::Is64BitProcess){throw 'Execute o instalador em Windows x64.'}
 Verify-Hash $newCore $manifest.core_sha256
 Verify-Hash $bootstrap $manifest.bootstrap_sha256
 Verify-Hash (Join-Path $Payload 'Recovery.ps1') $manifest.recovery_sha256
 . (Join-Path $Payload 'Recovery.ps1')
 $recoveryContext=Get-RecoveryContext $dataDir
 if($Mode -eq 'update' -and (Test-Path -LiteralPath $recoveryContext.Pending)){throw 'Recuperacao interrompida encontrada. Selecione Recuperar instalacao revogada para retomar sem criar outra identidade.'}
 $existing=Get-CimInstance Win32_Service -Filter "Name='SemedInventoryAgent'"
 if(-not $existing){
  if($Mode -eq 'recover'){throw 'Servico nao encontrado. Recuperacao nao executada; preserve os arquivos para analise.'}
  $fresh=$true
  # Exact original 0.1.8 installs its service, private runtime, ACLs and shortcuts.
  # NOSTART deliberately prevents any enrollment until the new Core has been installed.
  $process=Start-Process -FilePath $bootstrap -ArgumentList '/S','/NOSTART','/APIURL=https://inventario-semed-lumiar.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev' -WindowStyle Hidden -Wait -PassThru
  if($process.ExitCode -ne 0){throw "Instalação base recusada (código $($process.ExitCode)). Nenhuma atualização aplicada."}
  $existing=Get-CimInstance Win32_Service -Filter "Name='SemedInventoryAgent'"
  if(-not $existing){throw 'A instalação base não criou o serviço.'}
 }
 $registered=Get-ItemProperty -LiteralPath $registry
 if([IO.Path]::GetFullPath($registered.InstallLocation).TrimEnd('\') -ne [IO.Path]::GetFullPath($installDir).TrimEnd('\')){throw 'Caminho da instalação não corresponde ao padrão verificado. Atualização interrompida.'}
 if($existing.PathName -notlike ('*'+$installDir+'\SemedInventoryAgent.dll*')){throw 'Executável do serviço difere do padrão verificado.'}
 if($existing.StartName -ne 'NT SERVICE\SemedInventoryAgent'){throw 'Conta de serviço diferente da conta original. Atualização interrompida.'}
 if((Get-Item -LiteralPath $installDir).Attributes -band [IO.FileAttributes]::ReparsePoint){throw 'Diretório de instalação redirecionado.'}
 $currentCore=Join-Path $installDir 'Semed.Agent.Core.dll'
 $currentHash=(Get-FileHash -LiteralPath $currentCore -Algorithm SHA256).Hash
 if($currentHash -notin @($manifest.original_core_sha256,$manifest.rc1_core_sha256,$manifest.core_sha256)){throw 'O nucleo instalado nao e uma versao conferida. Nao sera substituido.'}
 $oldDisplayVersion=$registered.DisplayVersion
 $resumeIncomplete=Test-InterruptedRc1 $installDir $existing $oldDisplayVersion $currentHash $manifest
 if($resumeIncomplete){Write-Output 'Instalação interrompida do rc1 reconhecida por hashes, backup e serviço. Retomando sem apagar dados.'}
 $wasRunning=$existing.State -eq 'Running'
 $oldStartMode=$existing.StartMode
 if($Mode -eq 'recover'){
  Assert-RecoveryEligibility $dataDir
  # Prevent SCM/reboot from starting the service between the two directory renames.
  Native "$env:SystemRoot\System32\sc.exe" @('config',$serviceName,'start=','disabled')
  $recoveryDisabled=$true
 }
 Stop-Agent
 $stopped=$true
 # Normal update never changes identity. Recovery is explicit and verified below.
 $backup=Join-Path $installDir ('backup-0.1.9-'+[Guid]::NewGuid().ToString('N'))
 New-Item -ItemType Directory -Path $backup | Out-Null
 Copy-Item -LiteralPath $currentCore -Destination (Join-Path $backup 'Semed.Agent.Core.dll')
 Verify-Hash (Join-Path $backup 'Semed.Agent.Core.dll') $currentHash
 $staged=Join-Path $installDir ('core-stage-'+[Guid]::NewGuid().ToString('N')+'.dll')
 Copy-Item -LiteralPath $newCore -Destination $staged
 Verify-Hash $staged $manifest.core_sha256
 Replace-AgentCore $staged $currentCore (Join-Path $backup 'Semed.Agent.Core.atomic-backup.dll')
 $replaced=$true
 Verify-Hash $currentCore $manifest.core_sha256
 $runtime=Join-Path $installDir 'runtime\dotnet.exe'
 if($Mode -eq 'recover'){
  if(-not (Test-Path -LiteralPath $recoveryContext.Pending)){
   Native $runtime @((Join-Path $installDir 'SemedInventoryAgent.dll'),'--verify-install')
  }
  Prepare-AgentRecovery $dataDir (Get-RecoveryAdminAcl)
  $recovery=Resume-AgentRecovery $dataDir
  Write-Output ('Backup verificado e originais preservados: '+$recovery.Directory)
  Write-Output 'Fila antiga arquivada; nao sera reenviada sob a nova identidade. A chave anterior permanece neste computador.'
 }
 Native $runtime @((Join-Path $installDir 'SemedInventoryAgent.dll'),'--verify-install')
 if($fresh -or $resumeIncomplete -or $recovery){Native "$env:SystemRoot\System32\sc.exe" @('config',$serviceName,'start=','delayed-auto')}
 if($fresh -or $resumeIncomplete -or $wasRunning -or $recovery){Start-Service -Name $serviceName;(Get-Service $serviceName).WaitForStatus('Running',[TimeSpan]::FromSeconds(30))}
 Set-ItemProperty -LiteralPath $registry -Name DisplayVersion -Value $manifest.version
 Copy-Item -LiteralPath (Join-Path $Payload 'LEIA-ME.txt') -Destination (Join-Path $installDir 'MEDICAO_DE_INTERNET.txt') -Force
 if($recovery){
  Complete-AgentRecovery $dataDir $recovery
  Write-Output 'Recuperacao local concluida. Abra o Agente SEMED e aguarde o novo QR. Leia-o no coletor na unidade correta. O historico anterior permanece separado; nenhum vinculo e recriado automaticamente.'
 }else{
  Write-Output ('Nucleo '+$manifest.version+' instalado. Identidade, chave, configuracao, fila e vinculos preservados. QR e internet dependem do servidor.')
 }
 Write-Output ('Registro da instalação: '+$logPath)
 exit 0
}catch{
 Write-Error -Message ($_.Exception.ToString()+[Environment]::NewLine+$_.InvocationInfo.PositionMessage) -ErrorAction Continue
 if(-not $ownsMutex){exit 1}
 $pendingRecovery=$recoveryContext -and (Test-Path -LiteralPath $recoveryContext.Pending)
 if($recovery -or $pendingRecovery){
  try{Stop-Agent;Native "$env:SystemRoot\System32\sc.exe" @('config',$serviceName,'start=','disabled')}catch{}
  Write-Output 'Recuperacao interrompida com backup preservado. Servico mantido parado. Execute este mesmo instalador no modo Recuperar para retomar; nao use PURGE nem apague as pastas.'
 }elseif($replaced -and $backup){
  try{Stop-Agent;Copy-Item -LiteralPath (Join-Path $backup 'Semed.Agent.Core.dll') -Destination (Join-Path $installDir 'Semed.Agent.Core.dll') -Force
   if($oldDisplayVersion){Set-ItemProperty -LiteralPath $registry -Name DisplayVersion -Value $oldDisplayVersion}
   Write-Output 'Núcleo anterior restaurado. Dados locais preservados.'
  }catch{Write-Error 'Não foi possível restaurar automaticamente o serviço. Preserve a pasta backup e contate o administrador.' -ErrorAction Continue}
 }
 if(-not $recovery -and -not $pendingRecovery){
  try{
   if($recoveryDisabled){
    $start=@{Auto='auto';Manual='demand';Disabled='disabled'}[$oldStartMode]
    if($start){Native "$env:SystemRoot\System32\sc.exe" @('config',$serviceName,'start=',$start)}
   }
   if($stopped -and $wasRunning){Start-Service -Name $serviceName}
  }catch{Write-Output 'Nao foi possivel restabelecer o estado anterior do servico; consulte o registro.'}
 }
 # Fresh failed installation stays stopped/disabled if possible; retain every diagnostic and identity.
 if($fresh -or $resumeIncomplete){try{Stop-Agent;Native "$env:SystemRoot\System32\sc.exe" @('config',$serviceName,'start=','disabled')}catch{}}
 Write-Output ('Registro da falha: '+$logPath)
 exit 1
}finally{
 if($ownsMutex){$mutex.ReleaseMutex()};$mutex.Dispose()
 Stop-Transcript | Out-Null
}
