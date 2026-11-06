# QR de teste solicitado pelo responsável — 04/11/2026

Escopo D-055: artefato temporário compatível com a produção, para o usuário testar pelo celular. Consultados: entrada do projeto, AGENTS, precedência, decisões, pendências/conflitos, contrato QR, cliente assinado de referência, leitor atual e teste integrado de QR. Sem alteração de formulário/servidor ou nova publicação.

- Root emitiu autorização exclusiva para um simulador, validade de uma hora, nota explícita de teste; autorização anterior do usuário preservada.
- Cadastro assinado na API real aceito. Device `cc2dedb3-3f41-4a6e-98ae-878dad464de3`, enrollment `e8a31bf9-b3b6-4c25-95f0-c849b3e9fb60`.
- `TESTE-QR-SEMED-01`, modelo fictício, CPU i5 simulada, 16 GiB, Windows 11 simulado. Sem leitura de dados deste PC, execução do EXE, heartbeat ou inventário automático.
- Emissão 04/11 às 21:32:13 Fortaleza; vencimento 21:42:13. Código visual `UNK-XF7`. O token de pareamento não é reproduzido neste documento.
- PNG: `C:/Users/SIGAE/Downloads/QR_TESTE_SEMED_01.png`; QR gerado por qrcode 1.5.4, decodificado novamente pelo jsQR do próprio coletor e aprovado por parsePairingQr.
- Primeira tentativa de cadastro foi corretamente recusada por serial_hint longo (422); corrigido para série mascarada. Apenas a segunda criou o dispositivo. A autorização limita o cadastro a um dispositivo.
- Script e chave ficam em `private-data/teste-qr-2026-11-04/`, excluídos do Git. O grant em texto foi removido após uso. O script tem operações explícitas create/status/renew, sem processo residente.

Aceite pendente do usuário: câmera física lê → prévia exibe dados e código visual → escolha de ambiente/posição → confirmação retorna sucesso no servidor, vinculado à ficha da unidade de teste. A mera existência do PNG não atesta esse aceite. Um resumo de pareamento não equivale a inventário completo, heartbeat ou alertas de hardware. Não publicar coleta fictícia como oficial.

## Resultado posterior — usuário concluiu leitura/vínculo

Responsável informou “feito a leitura do qr code”. Consulta assinada enrollment-status à API real às 21:40:15 de 04/11 (Fortaleza) retornou state=linked. Vínculo confirmado no servidor às 21:38:04, ficha `4a6cd4b9-571a-43f7-bc9b-e6d932e90795`, unidade `ESCOLA TESTE - DADOS FICTICIOS (APAGAR)`, ambiente `Biblioteca (TESTE)`, posição `Computador 01`, link `4232cea3-20c3-4ec6-95a8-b11545d0a859`. Comprova vínculo autenticado com o mesmo dispositivo de teste; não apenas decodificação local do PNG.

A leitura no aparelho foi relatada pelo usuário; navegador/modelo e câmera versus galeria não foram informados. device_confirmed_at ainda nulo, pois o simulador não executou confirmação de máquina nem enviou heartbeat/inventário completo. Salvamento completo da ficha, fotografias vinculadas, publicação da visita e EXE físico não foram conferidos por esta consulta. O processo Node apresentou assert de encerramento libuv após imprimir a resposta válida; nenhuma mutação foi repetida.
