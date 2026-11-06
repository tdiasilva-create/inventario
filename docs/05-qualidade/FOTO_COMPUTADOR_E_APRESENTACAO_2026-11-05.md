# D-060 — foto opcional do computador e apresentação sem versão

## Escopo aprovado e fontes

Em 05/11/2026 o responsável pediu retirar os rótulos de versão, manter a entrada no questionário atual e publicar no ambiente real. Esclareceu a fotografia com “Adicionar foto opcional”. Guia inicial, AGENTS, precedência, decisões, pendências/conflitos e código atual consultados. Reutilizadas as leituras integrais da Base original, especificações mobile, referências visuais e documentação de dados/aceite das fases anteriores; o TXT original permanece intacto.

Aplicável da Base: identificação permanente do equipamento, 0–5 fotografias opcionais, câmera e galeria, associação ao equipamento, autoria/histórico, confirmação real do servidor e separação entre rascunho e conclusão. A adição cobre a lacuna da fotografia do computador no fluxo atual. Não altera outras perguntas nem homologa offline, EXE ou câmeras físicas.

## Implementação

- Computador: bloco “Foto do computador (opcional)” após ambiente/posição. Câmera e Galeria usam o envio automático existente e o mesmo ID da ficha. Vazio é permitido. AnyDesk/RustDesk permanecem opcionais.
- Rascunho para upload preserva Manual/Agente. Aceita ficha ainda incompleta para associar a fotografia, mas impede concluir sem terminar as respostas aplicáveis e salvar a ficha. O envio não converte cadastro manual em agente.
- Reutilizados upload autenticado, otimização, limite de cinco fotos, repetição de envio, exclusão e consulta parcial/publicada. Produção continua usando o Google Drive configurado. Sem banco fake, nova infraestrutura, migração ou alteração manual de dados reais.
- Apresentação: rótulos V2/V3 removidos das telas de coleta e da consulta no painel. Lista inicia/retoma o questionário atual. Rascunhos anteriores exigem confirmação de preservação ao iniciar o fluxo atual; cancelar permanece na lista. Versões técnicas continuam internas para histórico/compatibilidade.

Arquivos de implementação: web/collector.js, collector-v2.html/js, collector-v3.html/js, collector-v3-schema.js, desktop-inventory.js, desktop-progress.js e mensagem em server/collector-v3.mjs.

## Verificação

- 98 testes automatizados aprovados. Dois cenários adicionais com Worker real e SQLite isolado: rascunho Manual/Agente recebe foto ligada à ficha, consulta parcial e validação; computador sem foto salva, conclui assunto e publica visita.
- Edge automatizado em 390×844: câmera/galeria, envio automático manual/QR, reabertura das fotografias, preservação do motivo manual e IDs AnyDesk/RustDesk, conclusão, consulta desktop e paisagem 812×375. Sete fotos de teste no armazenamento isolado, nenhuma no Drive oficial; sem erros JavaScript. Retorno às categorias medido localmente, sem promessa sobre rede real.
- Capturas em evidencias/coletor-foto-computador-2026-11-05/. As fotos usadas nos testes são arquivos sintéticos de um pixel, sem informações de escolas reais. A comparação visual preserva o layout claro/verde do coletor aprovado posteriormente e o desktop dark-tech.
- Testes funcionais usam o Worker e banco isolado. As sondas após deploy verificam disponibilidade/proteção HTTP; não equivalem a teste autenticado no Drive real nem ao acionamento da câmera física do celular.

## Conferência no celular

1. Atualizar o coletor, selecionar a unidade e abrir Computadores → Adicionar computador ou Editar.
2. Informar ambiente e posição. Encontrar Foto do computador (opcional), Câmera e Galeria.
3. Tirar/escolher foto: envio automático, aguardando a confirmação “Fotografia recebida pelo servidor”. Salvar equipamento e reabrir para conferir a foto.
4. Também deve ser possível salvar computador sem foto. Se o armazenamento falhar, não considerar a prévia uma foto enviada; manter a aba e usar Tentar envio novamente.
5. No painel, fotos de uma coleta aberta aparecem na consulta de coletas em andamento. Após conclusão confirmada, ficam na consulta publicada.

URLs:

https://inventario-semed-lumiar.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev/

https://painel-semed-paco.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev/

## Publicação confirmada — 05/11/2026, 16h55 (America/Fortaleza)

- Coletor: 5a5e96c0-2680-401c-890b-069e87d96dd5.
- Painel: 827d6900-aa3a-450c-974d-ac13fd2ecca5.
- Builds: 31 arquivos no coletor, 46 no painel; dry-run aprovado em ambos antes do deploy.
- Sondas dos dois endereços: login 200, raiz protegida 302, API sem sessão 401. Seis verificações aprovadas em publicacao.json.
- Último teste de navegador: aprovado, sete fotos isoladas, QR confirmado, nenhum erro JavaScript e retorno às categorias em 137 ms no ambiente local. resultado.json registra estes resultados; testes.txt registra 98/98.
- Captura 02c-computador-camera-galeria-390.png inspecionada visualmente: título opcional, câmera/galeria e contexto do ambiente/posição visíveis. Capturas de página inteira foram ajustadas para começar no topo, evitando que o cabeçalho fixo encobrisse o conteúdo na imagem.
- Nenhuma migração, seed, exclusão ou cadastro fictício no D1 oficial. Preservados contas, dados, Drive, segredos e modo de cadastro automático dos agentes. A câmera física e novo envio autenticado ao Drive de produção não foram executados nesta rodada; devem ser conferidos pelo roteiro acima no celular.
