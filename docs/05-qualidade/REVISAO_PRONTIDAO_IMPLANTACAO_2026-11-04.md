# Revisão de prontidão para implantação — 04/11/2026

> Atualização posterior nesta mesma data, 07:34 (Fortaleza): o bloqueio de autorização ausente do Drive foi resolvido. A conta está conectada e o autoteste real de upload/remoção passou. Ver `DRIVE_CONECTADO_2026-11-04.md`. Os resultados abaixo preservam a fotografia do estado anterior; as pendências de V2, agente e teste de foto vinculada continuam válidas.

Revisão solicitada pelo responsável após a análise do agente 0.1.6: identificar o que impede fotos e coleta de funcionarem no sistema real. Consulta de produção somente de leitura; nenhuma fotografia, cadastro, credencial ou implantação alterada.

## Conclusão

Há três entregas diferentes ainda incompletas: autorização e teste real do armazenamento de fotos; conclusão e publicação conjunta do questionário V2 com seu painel; integração do agente Windows. Não se resolve tudo executando apenas um deploy. O armazenamento é o primeiro bloqueio a resolver, porque a V2 exige fotos em partes da conclusão.

## Verificações realizadas no ambiente real

- Cloudflare: listagem de deployments, consulta das versões ativas e nomes dos segredos dos dois Workers. Nenhum valor de segredo consultado/exibido.
- D1 remoto: consultas SELECT sobre estado da integração, contagens, versões das vistorias, migrações e existência de tabelas do agente. Todas retornaram `rows_written: 0`.
- HTTPS: os dois endereços `/login` responderam 200. `/api/collector/capabilities` respondeu 401 sem sessão, comportamento esperado de proteção; isso não é teste autenticado da câmera/upload.
- Código local: `server/photo-storage.mjs`, `server/google-auth.mjs`, fluxo V2, configurações e relatórios de qualidade. Não foram reexecutados nesta revisão os testes locais anteriores.

Versões ativas observadas:

| Ambiente | Versão | Criação em UTC |
| --- | --- | --- |
| Coletor | `4ce66d17-5545-4ff2-883e-d59d18a43c8d` | 03/11/2026 18:24:40 |
| Painel | `c49b5260-5a00-48ef-b3e6-1a7a8091b39c` | 03/11/2026 17:04:11 |

Os dois Workers usam o mesmo D1 e `PHOTO_STORAGE_PROVIDER=google-drive`. Os nomes `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` e `GOOGLE_TOKEN_KEY` existem nos dois. Existência não confirma valor correto nem igualdade da chave; isso precisa ser comprovado no fluxo real. Não há binding R2 ativo nessas versões.

Estado consultado no D1:

| Evidência | Resultado |
| --- | --- |
| Autorizações em `integration_tokens` | Nenhuma |
| Eventos em `integration_events` | Nenhum |
| Fotografias em `collection_photos` | Nenhuma |
| Migração `0013_photo_storage.sql` | Aplicada |
| Unidades cadastradas | 71 |
| Ambientes cadastrados | 5 |
| Registros de equipamentos | 4 |
| Vistorias | 6: cinco abertas e uma concluída, todas versão `1.0` |
| Registros de seções de questionário | 48 |
| Tabelas com prefixo `agent` ou `ref_` | Nenhuma |

Contagens não validam conteúdo, autenticidade de equipamentos, completude ou qualidade dos cadastros. Não foi examinado o conteúdo das respostas. Não tratar antigos dados de teste como bens reais apenas porque estão gravados.

## 1. Fotos: falta conectar efetivamente o sistema ao Drive

O código e a estrutura de banco foram publicados; o bloqueio imediato é que não existe autorização OAuth persistida nem pasta vinculada por essa autorização. Estar conectado à conta Google no navegador não realiza essa autorização do aplicativo.

No código, `photoStore.enabled()` exige configuração, token de renovação não revogado e pasta registrada. A ausência de linha em `integration_tokens` faz a condição falhar. A câmera pode produzir prévia local, mas isso não significa arquivo armazenado.

Trabalho restante, em ordem:

1. Entrar como root no painel e iniciar **Conectar Google Drive** em Configurações.
2. Concluir a permissão na tela oficial da conta institucional. O callback deve registrar a autorização cifrada e a pasta privada.
3. Se houver erro, corrigir o erro concreto de callback/permissão/cliente retornado; não criar outro projeto ou contratar R2 sem necessidade.
4. Executar o autoteste do painel, que envia e remove um pequeno arquivo técnico na pasta.
5. No coletor, enviar uma foto vinculada a um registro de teste controlado; conferir a leitura pelo painel, autoria/vínculo e renovação do acesso depois de expirar o token curto.
6. Validar câmera/galeria e falhas em Android e iPhone. Teste simulado de upload não substitui esse aceite.

O consentimento Google pode exigir interação do responsável. Programação, callback, configuração, diagnóstico e integração são trabalho técnico; não dependem de o usuário definir novamente a arquitetura.

Aceite: imagem enviada no coletor, confirmada no servidor, visível na ficha correta no painel após recarregar; arquivo privado no Drive; usuário sem permissão não obtém a foto; falha não produz falso sucesso.

## 2. Coleta manual: há persistência, mas a V2 ainda está local e incompleta

Os registros existentes comprovam que houve gravação pelo sistema. Não comprovam que o questionário reformulado esteja entregue. A documentação D-052 e o relatório `QUESTIONARIO_V2_FASE_01.md` registram expressamente entrega local não publicada. O último deployment real é de 03/11, anterior à implementação V2 de 04/11; todas as vistorias consultadas continuam em `1.0`.

Falta para a V2:

- Adaptar o desktop para apresentar todos os campos/nomes/estados da nova versão, sem interpretar a V2 como os cartões antigos.
- Completar armazenamento protegido e consulta auditada das senhas de Wi-Fi/impressora pedidas na especificação. Atualmente esses valores não são campos operacionais; inserir em observações não é substituto.
- Resolver os campos ainda pendentes e manter identificados os recursos adicionais não implementados, como medição integrada de velocidade e offline durável. Uma versão inicial online pode ser delimitada claramente, sem anunciar esses recursos.
- Validar o caminho unidade → ambiente → equipamento → foto → salvar → retomar → coletas em andamento → concluir → consulta oficial.
- Publicar coletor e painel compatíveis, preservando vistorias antigas, IDs, autores e respostas.

O cadastro manual de computador continua sendo uma alternativa independente do instalador. A chegada do agente não precisa impedir a entrega de uma coleta manual utilizável.

Aceite: dados novos e antigos reaparecem corretamente depois de fechar/reabrir, outro operador retoma sem duplicar fichas, parcial fica identificado e separado do recebido oficialmente, e foto obrigatória realmente enviada libera a conclusão.

## 3. Coleta automática: o instalador ainda não está integrado

Não há tabelas do agente no D1 oficial. O pacote entregue tem servidor de referência e adaptadores de exemplo; não está conectado ao login e catálogo reais. Trocar apenas o endereço no instalador não resolve essa ausência.

Trabalho restante:

1. Corrigir os cinco defeitos reproduzidos em `REVISAO_PACOTE_AGENTE_SEMED_0_1_6.txt`.
2. Adaptar APIs de inscrição, assinatura, QR e recebimento, com migração aditiva e sessões/permissões reais.
3. Vincular agente à ficha permanente, à escola e ao ambiente existentes; tratar reinstalação sem gerar outro bem.
4. Integrar leitor de QR no coletor e ficha técnica/última comunicação no painel.
5. Implementar histórico, comparação de hardware e revisão de alterações de identidade. Os alertas não estão implementados só por receber snapshots.
6. Complementar os dados V2 ainda ausentes no agente, especialmente SSID e bateria quando disponíveis.
7. Homologar o EXE em computador de laboratório, com reinício, falta de internet, atualização e reenvio; só então preparar a distribuição.

Aceite: instalar em máquina de teste → ler QR → confirmar unidade/ambiente → receber hardware na mesma ficha do painel → reiniciar/reenviar sem duplicação → observar mudança controlada com histórico. Falta de comunicação não é apresentada como prova de computador desligado.

## Ordem de implantação recomendada

1. **Fotos reais**: autorização, pasta, envio e leitura entre os dois ambientes.
2. **Coletor V2 + desktop compatível**: entrega online de cadastro manual com fotos, integração e publicação conjunta após testes.
3. **Agente**: servidor, vínculo QR, telemetria e painel em laboratório; depois piloto controlado.
4. **Complementos**: alertas ampliados, offline protegido, medição integrada, manutenção/backup e escala, conforme aceite de cada fase.

Não há necessidade de refazer o layout ou criar outro cadastro de unidades. O que falta é concluir as integrações, verificar o fluxo completo e publicar o código validado.

## Endereços

Configurações do painel:
https://painel-semed-paco.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev/configuracoes

Coletor:
https://inventario-semed-lumiar.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev/

## Limites desta revisão

Não houve login interativo, início de OAuth, envio de imagem, alteração de dado real, teste de equipamento instalado nem deploy. A revisão identifica bloqueios com base em código e consultas atuais. A autorização ausente do Drive é o primeiro bloqueio comprovado; não se afirma que completá-la dispensará todos os testes ou correções subsequentes.
