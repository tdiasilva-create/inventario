# Instalador preparado para outro PC Windows — 04/11/2026

Responsável solicitou o executável para testar uma máquina real fora desta estação. Entregue pacote local contendo o EXE original 0.1.6, configuração de produção, autorização root limitada e instruções. Nenhum instalador executado nesta estação e nenhuma modificação no binário, API, questionário ou banco de inventário.

## Fontes e critérios

Consultados: 00_LEIA_ANTES_DE_TUDO, AGENTS, precedência, decisões D-053–055, pendências/conflitos, DIGEST_AGENTE_0_1_6, roteiro de produção V2/QR, fontes `installer/semed-agent.nsi`, `installer/O_QUE_E_COLETADO.txt`, `installer/THIRD_PARTY_NOTICES.txt`, LEIA-ME_AGENTE_SEMED e interface do agente. Aceite desta preparação: integridade do binário recebido, endereço correto, autorização de uma instalação, sete arquivos íntegros no ZIP, nenhuma chave de máquina/senha humana incluída. Homologação física é o próximo teste do usuário.

## Entrega

- ZIP: `C:/Users/SIGAE/Downloads/SEMED-AGENTE-TESTE-WINDOWS-0.1.6.zip`, 26.094.466 bytes.
- Pasta extraída: `C:/Users/SIGAE/Downloads/SEMED-AGENTE-TESTE-WINDOWS-0.1.6/`.
- EXE: `SemedInventoryAgentSetup-0.1.6.0-completo.exe`, 26.124.159 bytes; SHA256 `83EA59EE81F20D48C8EBF11B88B2A1F33B2101355FFC4841BA1949107B50035F`, igual ao original recebido e ao manifesto anteriormente conferido. Assinatura Authenticode: NotSigned.
- `config-instalacao.txt`: origem HTTPS do coletor real, sem login/api/localhost.
- `autorizacao.txt`: autorização nova para UMA instalação, emitida via interface root às 21:45:56 de 04/11, válida até 21:45:56 de 05/11, Fortaleza. Observação: Teste físico autorizado — outro PC Windows — pacote 0.1.6 de 04/11/2026. Código ocultado e não reproduzido no chat/documentação/repositório.
- Demais arquivos: COMECE_AQUI.txt, O_QUE_E_COLETADO.txt, THIRD_PARTY_NOTICES.txt e SHA256SUMS.txt. ZIP contém exatamente sete arquivos, sem fontes, cookies, senha root ou chave privada do simulador.
- Autorizações anteriores preservadas; a autorização nova NÃO foi consumida para testar. Conferência de formato feita localmente sem mostrar seu conteúdo.

## Verificação e limites

ZIP reaberto com verificação da lista de entradas, hash do EXE de dentro do arquivo, endereço exato e formato da autorização. Preparação aprovada. Evidência da autorização ativa (0/1) em `evidencias/publicacao-v2-qr-2026-11-04/autorizacao-windows-teste.png`.

Fonte do instalador restringe a Windows 10/11 x64 e exige administrador local; versão completo inclui runtime. Serviço SemedInventoryAgent e UI de QR conforme pacote recebido. Não recompilado, assinado ou executado nesta entrega. Nenhuma alegação de instalação real bem-sucedida ou telemetria recebida.

O guia orienta extrair todo o ZIP, manter configuração/autorização junto ao EXE, instalar no PC escolhido, ler seu próprio QR pelo celular e usar ficha própria (não a do simulador TESTE-QR-SEMED-01). Prevê conferência de hardware/heartbeat, fotos e envio do diagnóstico sanitizado em caso de falha, sem desativar proteções. O ZIP contém autorização temporária e não deve ser publicado como download público.
