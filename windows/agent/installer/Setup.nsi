Unicode true
RequestExecutionLevel admin
ManifestDPIAware true
SetCompressor /SOLID lzma
!include "MUI2.nsh"
!include "x64.nsh"
!include "LogicLib.nsh"
!include "nsDialogs.nsh"
Var Mode
Var UpdateRadio
Var RecoveryRadio
Var ModeDialog
Name "Agente SEMED 0.1.9 · piloto"
OutFile "${OUTFILE}"
VIProductVersion "0.1.9.0"
VIAddVersionKey "ProductName" "Agente SEMED · medição de internet"
VIAddVersionKey "FileDescription" "Instalador piloto ${VERSION}"
VIAddVersionKey "FileVersion" "0.1.9.0"
VIAddVersionKey "ProductVersion" "${VERSION}"
!define MUI_WELCOMEPAGE_TEXT "Instala ou atualiza o agente institucional. Inclui testes de internet solicitados pelo root.$\r$\n$\r$\nSe esta máquina mostra Instalação revogada, escolha o modo de recuperação na próxima etapa. Ele faz backup verificado e prepara uma nova identidade.$\r$\n$\r$\nA unidade correta será escolhida no coletor ao ler o novo QR."
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_LICENSE "${PAYLOAD}\LEIA-ME.txt"
Page custom ModePage ModeLeave
!insertmacro MUI_PAGE_INSTFILES
!define MUI_FINISHPAGE_TEXT "Abra Agente de Inventário SEMED pelo menu Iniciar.$\r$\n$\r$\nSe escolheu recuperação, aguarde o cadastro no servidor e o novo QR. No celular, entre na unidade correta e leia o QR na ficha do computador.$\r$\n$\r$\nBackup: C:\ProgramData\SEMED\AgentRecovery.$\r$\nOs dados pendentes antigos ficam arquivados, sem reenvio automático. Não apague o backup."
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_LANGUAGE "PortugueseBR"
Function .onInit
 StrCpy $Mode "update"
FunctionEnd
Function ModePage
 !insertmacro MUI_HEADER_TEXT "Escolha a operação" "Atualização normal ou recuperação de instalação revogada"
 nsDialogs::Create 1018
 Pop $ModeDialog
 ${If} $ModeDialog == error
  Abort
 ${EndIf}
 ${NSD_CreateRadioButton} 0 4u 100% 18u "Instalar / atualizar, mantendo a identidade atual"
 Pop $UpdateRadio
 ${NSD_CreateLabel} 12u 24u 95% 28u "Use em máquina nova ou com cadastro válido. Preserva o vínculo, a fila pendente e a chave."
 Pop $0
 ${NSD_CreateRadioButton} 0 60u 100% 18u "Recuperar instalação revogada (backup + novo QR)"
 Pop $RecoveryRadio
 ${NSD_CreateLabel} 12u 82u 95% 65u "Somente para máquina que mostra Instalação revogada. Guarda cópia verificada e originais, separa a fila antiga e prepara uma identidade nova. Não apaga histórico nem escolhe a unidade por você. Repetir após interrupção retoma a mesma recuperação."
 Pop $0
 ${If} $Mode == "recover"
  ${NSD_Check} $RecoveryRadio
 ${Else}
  ${NSD_Check} $UpdateRadio
 ${EndIf}
 nsDialogs::Show
FunctionEnd
Function ModeLeave
 ${NSD_GetState} $RecoveryRadio $0
 ${If} $0 == ${BST_CHECKED}
  MessageBox MB_ICONQUESTION|MB_YESNO|MB_DEFBUTTON2 "Recuperar a instalação revogada deste computador?$\r$\n$\r$\nOs arquivos antigos serão preservados. As mensagens pendentes ficarão no backup e não serão reenviadas para a nova unidade.$\r$\n$\r$\nDepois será necessário ler outro QR no coletor." IDYES confirmed
  Abort
  confirmed:
  StrCpy $Mode "recover"
 ${Else}
  StrCpy $Mode "update"
 ${EndIf}
FunctionEnd
Section
 ${IfNot} ${RunningX64}
  MessageBox MB_ICONSTOP "Este pacote requer Windows x64." /SD IDOK
  SetErrorLevel 1
  Abort
 ${EndIf}
 InitPluginsDir
 SetOutPath "$PLUGINSDIR\payload"
 File /r "${PAYLOAD}\*.*"
 ${DisableX64FSRedirection}
 nsExec::ExecToLog '"$SYSDIR\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "$PLUGINSDIR\payload\Install.ps1" -Payload "$PLUGINSDIR\payload" -Mode "$Mode"'
 Pop $0
 ${EnableX64FSRedirection}
 ${If} $0 != 0
  SetErrorLevel 1
  MessageBox MB_ICONSTOP "Operação não concluída. Consulte os detalhes. Preserve os backups. Se houve interrupção na recuperação, execute novamente este instalador e escolha Recuperar instalação revogada. Não use PURGE." /SD IDOK
  Abort
 ${EndIf}
SectionEnd
