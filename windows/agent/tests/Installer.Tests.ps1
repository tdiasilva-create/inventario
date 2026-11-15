# Windows PowerShell 5.1 regression: real filesystem operations in an isolated folder.
$ErrorActionPreference='Stop'
$repo=Split-Path (Split-Path (Split-Path $PSScriptRoot -Parent) -Parent) -Parent
$scriptPath=Join-Path $repo 'windows/agent/installer/Install.ps1'
$tokens=$null;$errors=$null
$ast=[Management.Automation.Language.Parser]::ParseFile($scriptPath,[ref]$tokens,[ref]$errors)
if($errors.Count){throw ($errors | Out-String)}
foreach($name in @('Replace-AgentCore','Test-InterruptedRc1')) {
 $fn=$ast.Find({param($n) $n -is [Management.Automation.Language.FunctionDefinitionAst] -and $n.Name -eq $name},$true)
 if(-not $fn){throw "Missing production function $name"}
 . ([scriptblock]::Create($fn.Extent.Text))
}
$dir=Join-Path $repo ('private-data/agent-build-tools/installer-regression-'+[guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $dir | Out-Null
$checks=0
function Check([bool]$Condition,[string]$Description){if(-not $Condition){throw $Description};$script:checks++;Write-Output ('PASS: '+$Description)}
$source=Join-Path $dir 'staged.dll';$current=Join-Path $dir 'current.dll';$backup=Join-Path $dir 'original.dll'
[IO.File]::WriteAllText($source,'new');[IO.File]::WriteAllText($current,'old')
$reproduced=$false
try{[IO.File]::Replace($source,$current,$null)}catch{$reproduced=$true}
Check $reproduced 'rc1 failure reproduced under Windows PowerShell 5.1'
Replace-AgentCore $source $current $backup
Check ([IO.File]::ReadAllText($current) -eq 'new' -and [IO.File]::ReadAllText($backup) -eq 'old') 'atomic replacement keeps exact previous bytes'
Check (-not (Test-Path -LiteralPath $source)) 'successful replacement consumes staged file'
$failed=$false
try{Replace-AgentCore $source $current (Join-Path $dir 'unused-backup.dll')}catch{$failed=$true}
Check ($failed -and [IO.File]::ReadAllText($current) -eq 'new') 'missing staged file preserves current core'
Replace-AgentCore $backup $current (Join-Path $dir 'rollback-new.dll')
Check ([IO.File]::ReadAllText($current) -eq 'old') 'rollback can restore original bytes'
$fixture=Join-Path $dir 'installation';New-Item -ItemType Directory -Path $fixture | Out-Null
$original='old';$new='new';$core=Join-Path $fixture 'Semed.Agent.Core.dll'
[IO.File]::WriteAllText($core,$original)
$stage=Join-Path $fixture 'core-stage-test.dll';[IO.File]::WriteAllText($stage,$new)
$backupDir=Join-Path $fixture 'backup-0.1.9-test';New-Item -ItemType Directory -Path $backupDir | Out-Null
$backupCore=Join-Path $backupDir 'Semed.Agent.Core.dll';[IO.File]::WriteAllText($backupCore,$original)
$manifest=[pscustomobject]@{original_core_sha256=(Get-FileHash $core).Hash;rc1_core_sha256=(Get-FileHash $stage).Hash}
$svc=[pscustomobject]@{State='Stopped';StartMode='Disabled'}
Check (Test-InterruptedRc1 $fixture $svc '0.1.8.0' $manifest.original_core_sha256 $manifest) 'known interrupted fresh rc1 recognized'
$svc.State='Running'
Check (-not (Test-InterruptedRc1 $fixture $svc '0.1.8.0' $manifest.original_core_sha256 $manifest)) 'running service not treated as failed install'
$svc.State='Stopped';$svc.StartMode='Manual'
Check (-not (Test-InterruptedRc1 $fixture $svc '0.1.8.0' $manifest.original_core_sha256 $manifest)) 'manually stopped service preserved'
$svc.StartMode='Disabled'
Check (-not (Test-InterruptedRc1 $fixture $svc '0.1.9-rc1' $manifest.original_core_sha256 $manifest)) 'different registered version not recovered implicitly'
[IO.File]::WriteAllText($backupCore,'corrupted')
Check (-not (Test-InterruptedRc1 $fixture $svc '0.1.8.0' $manifest.original_core_sha256 $manifest)) 'unrecognized backup blocks automatic recovery'
[IO.File]::WriteAllText($backupCore,$original);[IO.File]::WriteAllText($stage,'other')
Check (-not (Test-InterruptedRc1 $fixture $svc '0.1.8.0' $manifest.original_core_sha256 $manifest)) 'disabled service without exact rc1 staged core is preserved'
Write-Output ('PASSED '+$checks+' installer checks; no service, identity or system setting changed.')
