# Real NTFS operations, isolated fixtures only. No service/registry/production/CNG changes.
$ErrorActionPreference='Stop'
$repo=Split-Path (Split-Path (Split-Path $PSScriptRoot -Parent) -Parent) -Parent
. (Join-Path $repo 'windows/agent/installer/Recovery.ps1')
$root=Join-Path ([IO.Path]::GetTempPath()) ('semed-recovery-'+[guid]::NewGuid().ToString('N').Substring(0,8))
[IO.Directory]::CreateDirectory($root) | Out-Null
$checks=0
function Check([bool]$Condition,[string]$Message){if(-not $Condition){throw $Message};$script:checks++;Write-Output ('PASS '+$Message)}
function Throws([scriptblock]$Action,[string]$Message){$failed=$false;try{& $Action | Out-Null}catch{$failed=$true};Check $failed $Message}
$acl=New-Object Security.AccessControl.DirectorySecurity
$acl.SetAccessRuleProtection($true,$false)
$identity=[Security.Principal.WindowsIdentity]::GetCurrent().User
$acl.AddAccessRule((New-Object Security.AccessControl.FileSystemAccessRule($identity,'FullControl','ContainerInherit,ObjectInherit','None','Allow')))
function Fixture([string]$Phase='revoked'){
 $parent=Join-Path $root ([guid]::NewGuid().ToString('N'));$data=Join-Path $parent 'Agent'
 [IO.Directory]::CreateDirectory((Join-Path $data 'queue/rejected')) | Out-Null
 [IO.Directory]::CreateDirectory((Join-Path $data 'logs')) | Out-Null
 Set-Acl -LiteralPath $data -AclObject $acl
 $id=[guid]::NewGuid().ToString('D')
 Write-RecoveryJson (Join-Path $data 'state.json') @{schema_version=2;installation_id=$id;key_name=('SEMED-Agent-'+$id);device_id=[guid]::NewGuid().ToString('D');phase=$Phase;link=@{equipment_id='historical-equipment';unit_id='deleted-unit'}}
 Write-RecoveryJson (Join-Path $data 'config.json') @{api_base_url='https://inventario-semed-lumiar.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev';key_scope='service_account'}
 [IO.File]::WriteAllBytes((Join-Path $data 'queue/old.msg.json'),[byte[]](0,255,31,67,9,4))
 [IO.File]::WriteAllText((Join-Path $data 'logs/agent.log'),'old historical log')
 [IO.File]::WriteAllText((Join-Path $data 'pairing.json'),'old QR secret - fixture')
 [IO.File]::WriteAllText((Join-Path $data 'install-grant.txt'),'old grant - fixture')
 [IO.File]::WriteAllText((Join-Path $data 'network-test.json'),'old pending network result')
 return $data
}
foreach($phase in @('linked','pending_pairing','awaiting_grant','identity_conflict')){
 $d=Fixture $phase;$before=@(Get-RecoveryFileManifest $d)
 Throws {Prepare-AgentRecovery $d $acl} ('reject '+$phase)
 Assert-RecoverySnapshot $d $before
 Check (-not (Test-Path -LiteralPath (Get-RecoveryContext $d).Root)) ('no changes for '+$phase)
}
$d=Fixture;$before=@(Get-RecoveryFileManifest $d);$old=Read-RevokedState $d
Prepare-AgentRecovery $d $acl
Assert-RecoverySnapshot $d $before
Check $true 'backup preparation leaves source byte-for-byte intact'
$result=Resume-AgentRecovery $d
$state=Get-Content -LiteralPath (Join-Path $d 'state.json') -Raw | ConvertFrom-Json
Check ($state.installation_id -ne $old.installation_id -and $state.key_name -ne $old.key_name) 'new installation and key name'
Check ($state.phase -eq 'awaiting_grant' -and -not $state.device_id -and -not $state.link) 'new enrollment only; no inherited school/device'
Check (@(Get-ChildItem -LiteralPath $d).Count -eq 2 -and -not (Test-Path (Join-Path $d 'queue'))) 'old queue, tickets, grant and network result excluded'
Assert-RecoverySnapshot (Join-Path $result.Directory 'snapshot') $before
Assert-RecoverySnapshot (Join-Path $result.Directory 'original') $before
Check $true 'both historical copies preserve every byte'
$again=Resume-AgentRecovery $d
Check ($again.NewInstallationId -eq $result.NewInstallationId) 'repeat before finish preserves new identity'
Complete-AgentRecovery $d $result
Throws {Prepare-AgentRecovery $d $acl} 'finished recovery cannot reset new identity'
Check (Test-Path -LiteralPath (Join-Path $result.Directory 'completed-pointer.json')) 'completion receipt preserved'
# The C# integration test consumes this exact PowerShell-produced state.
Write-RecoveryJson (Join-Path $root 'integration.json') @{data=$d;archive=$result.Directory;old_id=$old.installation_id;old_key=$old.key_name;new_id=$state.installation_id}
foreach($point in @('before-archive','after-archive','after-activate')){
 $d=Fixture;Prepare-AgentRecovery $d $acl
 $checkpoint={param($name,$directory) if($name -eq $point){throw 'SIMULATED POWER FAILURE'}}.GetNewClosure()
 Throws {Resume-AgentRecovery $d $checkpoint} ('interrupt at '+$point)
 $r=Resume-AgentRecovery $d
 Check ((Get-Content (Join-Path $d 'state.json') -Raw | ConvertFrom-Json).installation_id -eq $r.NewInstallationId) ('resume same transaction after '+$point)
 Complete-AgentRecovery $d $r
}
$d=Fixture;Prepare-AgentRecovery $d $acl;$c=Get-RecoveryContext $d
$p=Get-Content $c.Pending -Raw | ConvertFrom-Json;$tx=Join-Path $c.Root $p.transaction
[IO.File]::WriteAllText((Join-Path $tx 'snapshot/queue/old.msg.json'),'corrupted')
Throws {Resume-AgentRecovery $d} 'corrupted backup blocks before original move'
Check ((Read-RevokedState $d).phase -eq 'revoked') 'old state survives corrupted backup'
$d=Fixture;Prepare-AgentRecovery $d $acl;$c=Get-RecoveryContext $d
$p=Get-Content $c.Pending -Raw | ConvertFrom-Json;$tx=Join-Path $c.Root $p.transaction
[IO.File]::WriteAllText((Join-Path $tx 'new-agent/unexpected.msg.json'),'must not replay')
Throws {Resume-AgentRecovery $d} 'unexpected staged files never become live'
Check (Test-Path -LiteralPath (Join-Path $tx 'original/state.json')) 'original still preserved after staged refusal'
$d=Fixture;Prepare-AgentRecovery $d $acl;$c=Get-RecoveryContext $d
$p=Get-Content $c.Pending -Raw | ConvertFrom-Json;$tx=Join-Path $c.Root $p.transaction
[IO.File]::AppendAllText((Join-Path $tx 'manifest.json'),' ')
Throws {Resume-AgentRecovery $d} 'changed manifest refuses resume'
Check (Test-Path -LiteralPath (Join-Path $d 'state.json')) 'changed manifest leaves live identity intact'
$d=Fixture;$outside=Join-Path $root 'outside';[IO.Directory]::CreateDirectory($outside)|Out-Null
New-Item -ItemType Junction -Path (Join-Path $d 'linked-folder') -Target $outside | Out-Null
Throws {Prepare-AgentRecovery $d $acl} 'junction rejected before backup/move'
Check (-not (Test-Path -LiteralPath (Get-RecoveryContext $d).Root)) 'junction refusal has no write outside data'
$d=Fixture;[IO.File]::WriteAllText((Join-Path $d 'state.json'),'broken')
Throws {Prepare-AgentRecovery $d $acl} 'corrupt state never guessed as revoked'
$d=Fixture;Prepare-AgentRecovery $d $acl;$r=Resume-AgentRecovery $d
# Simulate interruption after the completion receipt but before the pointer rename.
Write-RecoveryJson (Join-Path $r.Directory 'completed.json') @{new_installation_id=$r.NewInstallationId}
Complete-AgentRecovery $d $r
Check (Test-Path -LiteralPath (Join-Path $r.Directory 'completed-pointer.json')) 'completion itself resumes after interruption'
$prodAcl=Get-RecoveryAdminAcl
$sids=@($prodAcl.GetAccessRules($true,$true,[Security.Principal.SecurityIdentifier]) | ForEach-Object {$_.IdentityReference.Value})
Check ($prodAcl.AreAccessRulesProtected -and $sids.Count -eq 2 -and 'S-1-5-18' -in $sids -and 'S-1-5-32-544' -in $sids) 'production archive ACL restricted to SYSTEM and Administrators'
foreach($file in @('Install.ps1','Recovery.ps1')){
 $t=$null;$e=$null;[void][Management.Automation.Language.Parser]::ParseFile((Join-Path $repo ('windows/agent/installer/'+$file)),[ref]$t,[ref]$e)
 Check ($e.Count -eq 0) ('PowerShell 5.1 parses '+$file)
}
Write-Output ('PASSED '+$checks+' recovery checks; no real service or data changed.')
Write-Output ('INTEGRATION_FIXTURE='+ (Join-Path $root 'integration.json'))
