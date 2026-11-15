# Library: caller must hold the installer mutex and keep the service stopped/disabled.
# All paths are derived from the supplied, verified data directory. No deletion or key-store operation.
function Assert-RecoveryPath([string]$Path) {
 $full=[IO.Path]::GetFullPath($Path)
 $cursor=$full
 while($cursor){
  if(Test-Path -LiteralPath $cursor){
   if((Get-Item -LiteralPath $cursor -Force).Attributes -band [IO.FileAttributes]::ReparsePoint){throw 'Recuperacao recusada: caminho redirecionado.'}
  }
  $cursor=Split-Path -Path $cursor -Parent
 }
 return $full
}
function Get-RecoveryTree([string]$Directory) {
 $root=Assert-RecoveryPath $Directory
 foreach($item in Get-ChildItem -LiteralPath $root -Force){
  if($item.Attributes -band [IO.FileAttributes]::ReparsePoint){throw 'Recuperacao recusada: arquivo/pasta redirecionado.'}
  $item
  if($item.PSIsContainer){Get-RecoveryTree $item.FullName}
 }
}
function Get-RecoveryAdminAcl {
 $acl=New-Object Security.AccessControl.DirectorySecurity
 $acl.SetAccessRuleProtection($true,$false)
 foreach($sid in @('S-1-5-18','S-1-5-32-544')){
  $identity=New-Object Security.Principal.SecurityIdentifier($sid)
  $rule=New-Object Security.AccessControl.FileSystemAccessRule($identity,'FullControl','ContainerInherit,ObjectInherit','None','Allow')
  $acl.AddAccessRule($rule)
 }
 return $acl
}
function Write-RecoveryJson([string]$Path,$Value) {
 if(Test-Path -LiteralPath $Path){throw 'Registro de recuperacao ja existe; nao sera sobrescrito.'}
 $temp=$Path+'.'+[guid]::NewGuid().ToString('N')+'.tmp'
 $bytes=[Text.UTF8Encoding]::new($false).GetBytes(($Value | ConvertTo-Json -Depth 24))
 $stream=[IO.File]::Open($temp,[IO.FileMode]::CreateNew,[IO.FileAccess]::Write,[IO.FileShare]::None)
 try{$stream.Write($bytes,0,$bytes.Length);$stream.Flush($true)}finally{$stream.Dispose()}
 [IO.File]::Move($temp,$Path)
}
function Copy-RecoveryFile([string]$Source,[string]$Destination) {
 $inputFile=[IO.File]::Open($Source,[IO.FileMode]::Open,[IO.FileAccess]::Read,[IO.FileShare]::Read)
 try{
  $outputFile=[IO.File]::Open($Destination,[IO.FileMode]::CreateNew,[IO.FileAccess]::Write,[IO.FileShare]::None)
  try{$inputFile.CopyTo($outputFile);$outputFile.Flush($true)}finally{$outputFile.Dispose()}
 }finally{$inputFile.Dispose()}
}
function Get-RecoveryContext([string]$DataDir) {
 $data=Assert-RecoveryPath $DataDir
 if([IO.Path]::GetFileName($data) -ne 'Agent'){throw 'Pasta de dados inesperada.'}
 $root=Assert-RecoveryPath (Join-Path (Split-Path $data -Parent) 'AgentRecovery')
 return [pscustomobject]@{Data=$data;Root=$root;Pending=(Join-Path $root 'pending.json')}
}
function Read-RevokedState([string]$DataDir) {
 $state=Get-Content -LiteralPath (Join-Path $DataDir 'state.json') -Raw -Encoding UTF8 | ConvertFrom-Json
 $id=[guid]::Empty;$device=[guid]::Empty
 if($state.phase -ne 'revoked' -or -not [guid]::TryParse($state.installation_id,[ref]$id) -or -not [guid]::TryParse($state.device_id,[ref]$device) -or $state.key_name -ne ('SEMED-Agent-'+$state.installation_id)){
  throw 'Recuperacao permitida somente para identidade REVOGADA reconhecida. Cadastros validos, novos ou corrompidos nao serao reiniciados.'
 }
 return $state
}
function Assert-RecoveryEligibility([string]$DataDir) {
 $c=Get-RecoveryContext $DataDir
 if(Test-Path -LiteralPath $c.Pending){return}
 $null=Read-RevokedState $c.Data
}
function Get-RecoveryFileManifest([string]$Directory) {
 $prefix=[IO.Path]::GetFullPath($Directory).TrimEnd('\')+'\'
 foreach($file in @(Get-RecoveryTree $Directory | Where-Object {-not $_.PSIsContainer})){
  [pscustomobject]@{path=$file.FullName.Substring($prefix.Length);bytes=$file.Length;sha256=(Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash}
 }
}
function Assert-RecoverySnapshot([string]$Directory,$Files) {
 $actual=@(Get-RecoveryFileManifest $Directory)
 if($actual.Count -ne @($Files).Count){throw 'Backup incompleto: quantidade de arquivos divergente.'}
 $index=@{};foreach($f in $actual){$index[$f.path]=$f}
 foreach($f in $Files){
  if(-not $index.ContainsKey($f.path) -or $index[$f.path].bytes -ne $f.bytes -or $index[$f.path].sha256 -ne $f.sha256){throw 'Backup incompleto ou alterado: integridade divergente.'}
 }
}
function Prepare-AgentRecovery([string]$DataDir,$ArchiveAcl) {
 $c=Get-RecoveryContext $DataDir
 if(Test-Path -LiteralPath $c.Pending){return}
 $old=Read-RevokedState $c.Data
 $items=@(Get-RecoveryTree $c.Data) # Reject junctions/links BEFORE copying or changing anything.
 $files=@(Get-RecoveryFileManifest $c.Data)
 $bytes=($files | Measure-Object -Property bytes -Sum).Sum
 $drive=New-Object IO.DriveInfo([IO.Path]::GetPathRoot($c.Data))
 if($drive.AvailableFreeSpace -lt ($bytes+64MB)){throw 'Espaco insuficiente para backup verificado. Dados originais preservados.'}
 if(-not (Test-Path -LiteralPath $c.Root)){[IO.Directory]::CreateDirectory($c.Root) | Out-Null}
 Set-Acl -LiteralPath $c.Root -AclObject $ArchiveAcl
 $tx=[guid]::NewGuid().ToString('D');$dir=Join-Path $c.Root $tx
 [IO.Directory]::CreateDirectory($dir) | Out-Null
 $snapshot=Join-Path $dir 'snapshot';[IO.Directory]::CreateDirectory($snapshot) | Out-Null
 $prefix=$c.Data.TrimEnd('\')+'\'
 foreach($item in $items){
  $dest=Join-Path $snapshot $item.FullName.Substring($prefix.Length)
  if($item.PSIsContainer){[IO.Directory]::CreateDirectory($dest) | Out-Null}else{Copy-RecoveryFile $item.FullName $dest}
 }
 Assert-RecoverySnapshot $snapshot $files
 Assert-RecoverySnapshot $c.Data $files # No producer may have changed the source during backup.
 $config=Join-Path $c.Data 'config.json'
 $parsed=Get-Content -LiteralPath $config -Raw -Encoding UTF8 | ConvertFrom-Json
 if($parsed.api_base_url -ne 'https://inventario-semed-lumiar.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev' -and $parsed.api_base_url -ne 'https://inventario-semed-lumiar.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev/'){
  throw 'Servidor diferente do coletor institucional. Recuperacao interrompida; nenhuma identidade alterada.'
 }
 $dataAcl=Get-Acl -LiteralPath $c.Data
 $configAcl=Get-Acl -LiteralPath $config
 $newId=[guid]::NewGuid().ToString('D')
 $staged=Join-Path $dir 'new-agent';[IO.Directory]::CreateDirectory($staged) | Out-Null
 # Preserve the exact service/config ACLs, including service SID, with no inherited broad rights.
 $dataAcl.SetAccessRuleProtection($true,$true)
 Set-Acl -LiteralPath $staged -AclObject $dataAcl
 Copy-RecoveryFile $config (Join-Path $staged 'config.json')
 Set-Acl -LiteralPath (Join-Path $staged 'config.json') -AclObject $configAcl
 Write-RecoveryJson (Join-Path $staged 'state.json') ([ordered]@{
  schema_version=2;installation_id=$newId;key_name=('SEMED-Agent-'+$newId);phase='awaiting_grant';created_at=[DateTimeOffset]::UtcNow.ToString('o')
 })
 $manifest=[ordered]@{schema=1;transaction=$tx;created_at=[DateTimeOffset]::UtcNow.ToString('o');computer=$env:COMPUTERNAME;
  old_installation_id=$old.installation_id;old_device_id=$old.device_id;old_key_name=$old.key_name;old_link=$old.link;
  new_installation_id=$newId;key_preservation='Old non-exportable CNG key kept on this PC; new key created by service account';
  queue_policy='Archived only; never replay under new identity';data_acl=$dataAcl.Sddl;config_acl=$configAcl.Sddl;files=$files}
 Write-RecoveryJson (Join-Path $dir 'manifest.json') $manifest
 $manifestHash=(Get-FileHash -LiteralPath (Join-Path $dir 'manifest.json')).Hash
 Write-RecoveryJson $c.Pending ([ordered]@{transaction=$tx;manifest_sha256=$manifestHash})
}
function Resume-AgentRecovery([string]$DataDir,[scriptblock]$Checkpoint={}) {
 $c=Get-RecoveryContext $DataDir
 $pointer=Get-Content -LiteralPath $c.Pending -Raw -Encoding UTF8 | ConvertFrom-Json
 $tx=[guid]::Empty
 if(-not [guid]::TryParseExact($pointer.transaction,'D',[ref]$tx)){throw 'Registro de recuperacao invalido.'}
 $dir=Assert-RecoveryPath (Join-Path $c.Root $tx.ToString('D'))
 $manifestPath=Join-Path $dir 'manifest.json'
 if((Get-FileHash -LiteralPath $manifestPath).Hash -ne $pointer.manifest_sha256){throw 'Registro de recuperacao alterado. Nenhum dado sera substituido.'}
 $m=Get-Content -LiteralPath $manifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
 if($m.transaction -ne $tx.ToString('D')){throw 'Transacao de recuperacao divergente.'}
 $snapshot=Assert-RecoveryPath (Join-Path $dir 'snapshot')
 $original=Assert-RecoveryPath (Join-Path $dir 'original')
 $staged=Assert-RecoveryPath (Join-Path $dir 'new-agent')
 Assert-RecoverySnapshot $snapshot $m.files
 if(-not (Test-Path -LiteralPath $original)){
  $state=Read-RevokedState $c.Data
  if($state.installation_id -ne $m.old_installation_id){throw 'Identidade mudou durante a recuperacao.'}
  Assert-RecoverySnapshot $c.Data $m.files
  & $Checkpoint 'before-archive' $dir
  # Both verified absolute paths stay in the same SEMED parent. No recursive shell move/delete.
  [IO.Directory]::Move($c.Data,$original)
  & $Checkpoint 'after-archive' $dir
 }
 if(-not (Test-Path -LiteralPath $c.Data)){
  $state=Get-Content -LiteralPath (Join-Path $staged 'state.json') -Raw -Encoding UTF8 | ConvertFrom-Json
  if($state.installation_id -ne $m.new_installation_id -or $state.key_name -ne ('SEMED-Agent-'+$m.new_installation_id) -or $state.phase -ne 'awaiting_grant' -or $state.device_id -or $state.link){throw 'Nova identidade preparada divergente.'}
  $newFiles=@(Get-RecoveryFileManifest $staged)
  $expectedConfig=@($m.files | Where-Object {$_.path -eq 'config.json'})
  if($newFiles.Count -ne 2 -or $expectedConfig.Count -ne 1 -or (Get-FileHash -LiteralPath (Join-Path $staged 'config.json')).Hash -ne $expectedConfig[0].sha256){throw 'Preparacao divergente: configuracao ou arquivos nao reconhecidos.'}
  Assert-RecoverySnapshot $original $m.files
  [IO.Directory]::Move($staged,$c.Data)
  & $Checkpoint 'after-activate' $dir
 }
 $state=Get-Content -LiteralPath (Join-Path $c.Data 'state.json') -Raw -Encoding UTF8 | ConvertFrom-Json
 if($state.installation_id -ne $m.new_installation_id){throw 'Identidade atual divergente; nao sera sobrescrita.'}
 return [pscustomobject]@{Directory=$dir;NewInstallationId=$m.new_installation_id;OldInstallationId=$m.old_installation_id}
}
function Complete-AgentRecovery([string]$DataDir,$Recovery) {
 $c=Get-RecoveryContext $DataDir
 $state=Get-Content -LiteralPath (Join-Path $c.Data 'state.json') -Raw -Encoding UTF8 | ConvertFrom-Json
 if($state.installation_id -ne $Recovery.NewInstallationId){throw 'Identidade divergente ao finalizar recuperacao.'}
 $completed=Join-Path $Recovery.Directory 'completed.json'
 if(Test-Path -LiteralPath $completed){
  $record=Get-Content -LiteralPath $completed -Raw -Encoding UTF8 | ConvertFrom-Json
  if($record.new_installation_id -ne $state.installation_id){throw 'Registro de conclusao divergente.'}
 }else{Write-RecoveryJson $completed ([ordered]@{at=[DateTimeOffset]::UtcNow.ToString('o');new_installation_id=$state.installation_id;phase=$state.phase})}
 [IO.File]::Move($c.Pending,(Join-Path $Recovery.Directory 'completed-pointer.json'))
}
