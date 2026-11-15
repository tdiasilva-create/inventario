// Curated source + reproducible evidence for external refinement. No official DB or credentials.
import {readFileSync,writeFileSync,mkdirSync,copyFileSync,readdirSync,existsSync} from 'node:fs';
import {resolve,join,relative,sep,extname} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {topics,v3Sections,v3EquipmentFields} from '../web/collector-v3-schema.js';
const root=resolve('.'),base=resolve('private-data/entregas/coletor-refino-2026-11-14'),docs='docs/06-entregas/coletor-refino-2026-11-14';
mkdirSync(base,{recursive:true});mkdirSync(docs,{recursive:true});
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:20*1024*1024}).trim();
const commit=git('rev-parse','HEAD'),hash=b=>createHash('sha256').update(b).digest('hex');
const put=(name,body)=>{writeFileSync(join(docs,name),body.trim()+'\n');writeFileSync(join(base,name),body.trim()+'\n');};
put('00_LEIA_PRIMEIRO.txt',`
SEMED — PACOTE PARA REFINAR A COLETA NO APLICATIVO
14/11/2026 · Paço do Lumiar/MA · Referência: ${commit}

O responsável não aprovou a experiência atual da coleta. Sua reclamação é que
o APK 1.0.3 apenas criou uma entrada para Atendimento técnico e Coleta, mantendo
a interface e os problemas anteriores. Ele quer o cuidado de interação, clareza
e acabamento já obtido no app técnico, incluindo revisão de lógica e erros.

ESTA ENTREGA É UM PACOTE DE TRABALHO, NÃO UMA CORREÇÃO OU PUBLICAÇÃO.
Não basta alterar cores, fazer uma tela demonstrativa ou acrescentar outro atalho.
É necessário navegar, reproduzir falhas e refinar o coletor conectado às APIs.
O responsável enviará o resultado para revisão/integração por Codex antes de APK.

Comece por 01_PROMPT_PARA_CLAUDE.txt. Depois leia 02–08 e abra GALERIA.html.
09 contém o inventário técnico extraído do código, sem substituir sua leitura.
FONTES/ preserva a estrutura do projeto: frontend, servidor, testes, migrações,
Android, referências e documentos. MANIFESTO_FONTES.json relaciona origem/hash.
MANIFESTO_ARQUIVOS.sha256 cobre os arquivos do pacote.

EVIDÊNCIAS: 22 telas do código atual em navegador com Worker real e SQLite
isolado. Dados TESTE ISOLADO, não cópia das escolas/contas/fotos reais. GPS e
câmera física NÃO foram homologados por essas capturas. REGRESSAO/ contém
ensaios funcionais separados. Um teste aprovado não prova uma boa experiência.

FONTE ATUAL: D115 publicado em 13/11/2026, 19:13 Fortaleza, Worker painel
77c27c3b-b823-4a0e-a362-0854516403d0. APK 1.0.3/versionCode 4.
Coletor independente preservado: c678978a-9e71-4cab-a2dc-9744ec6d6e1c.
São os últimos registros conferidos, não nova consulta autenticada de produção
nesta entrega. Código funcional base 3c602eb, registro de publicação 09442d0.

URLs reais (referência, não destino de testes sintéticos):
https://painel-semed-paco.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev/app
https://inventario-semed-lumiar.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev/

Não acompanham .git, node_modules, dumps D1, credenciais, cookies, tokens,
refresh tokens Google, chaves Android, APK/EXE nem fotografias oficiais.
Fixtures contêm senhas/chaves SINTÉTICAS de testes, sem acesso à conta real.
Nenhum procedimento deste pacote exige login na Cloudflare ou Google.
Não executar scripts de deploy/bootstrap/reset/importação em ambiente oficial.
IDs de conta/recursos nos arquivos wrangler são configuração, não credenciais.
Não é preciso alterá-los para rodar os testes em memória; não usar deploy scripts.
Não tratar consentimentos históricos em documentos como ordem de publicar agora.
`);
put('01_PROMPT_PARA_CLAUDE.txt',`
PEDIDO AO CLAUDE — REFINAMENTO FUNCIONAL E VISUAL DO COLETOR SEMED

Você recebeu uma cópia verificável do sistema existente e evidências do fluxo.
Quero que você refine a área COLETA, tendo o acabamento do ATENDIMENTO TÉCNICO
como referência. O app unificado já existe: sua tarefa não é criar atalhos.
Quero código utilizável no projeto, navegação clara, formulários confortáveis,
ações previsíveis, erros explicados e correções de falhas reproduzidas.

1. Leia 00–09; depois AGENTS e precedência em FONTES. Leia a Base original na
íntegra como histórico funcional, mas aplique as decisões posteriores registradas:
V3 simplificada D057, foto opcional de computador D060, identidade D061/D062,
ambientes por ID D074, ações/revisão D089, controle administrativo D111/D112,
localização D114 e app único D115. Não restaure perguntas antigas removidas.
2. Rode os testes locais, abra as telas reais do código e documente reproduções.
Separe BUG REPRODUZIDO, RELATO A CONFIRMAR, LIMITAÇÃO CONHECIDA, PROPOSTA e
DECISÃO NECESSÁRIA. Não alegue que todos os problemas antigos continuam ativos.
3. Apresente diagnóstico por tela e uma proposta curta de navegação, hierarquia
de ações e estados. Use as decisões já aprovadas; destaque novas decisões reais.
4. Implemente melhorias de UX e correções que preservem as regras. Evite uma
reescrita de framework sem necessidade demonstrada. Pode extrair componentes
e responsabilidades para reduzir complexidade, mantendo o comportamento testado.
5. Preserve perguntas/opções/obrigatoriedade e IDs de dados nesta rodada. Se
achar necessário retirar ou acrescentar campo, concluir automaticamente,
ampliar busca, criar offline ou mudar permissões, proponha SEPARADAMENTE e
aguarde decisão; não embuta isso no visual como se já estivesse aprovado.
6. Trabalhe nos dois caminhos: coletor navegador e Coleta dentro do APK /app.
Considere cabeçalho do shell + cabeçalho da coleta + rodapé + teclado. A nova
interface não pode funcionar só numa página solta com altura maior que a real.
7. Preserve a área técnica aprovada, GPS em segundo plano e sua credencial.
Não altere LocationService/TrackingStore, package ou assinatura para melhorar CSS.
8. Reproduza resposta perdida, erro de validação, sessão expirada, concorrência,
foto em envio/erro, QR vencido e lista longa. Nenhum mock deve fingir salvamento.
9. Entregue fontes alteradas + diff contra esta base, relatório de alterações,
testes executados com resultados brutos, screenshots antes/depois e roteiro
de homologação física. Devolva dúvidas de negócio enumeradas ao responsável.
10. Não publique e não gere APK de produção. O responsável devolverá a entrega
para revisão, integração, testes e assinatura pelo mantenedor original.

RESULTADO DESEJADO
- Técnico/operador entende onde está e o que falta sem ler vários avisos.
- Controles compactos, toque confortável, campo/erro/ação visíveis com teclado.
- A ação principal de cada tela é óbvia e recebe feedback imediato.
- Nenhum botão aparenta funcionar enquanto seu clique é silenciosamente ignorado.
- Voltar, retomar, salvar e concluir não causam perda ou duplicação.
- Fotos e QR são parte da ficha e mantêm o vínculo correto.
- Conclusão manual explica cada impedimento e abre exatamente o registro faltante.
- Desempenho medido antes/depois; não criar polling ou consultas por tecla.

CRITÉRIO DE ACEITE DA DEVOLUTIVA
Não aceito somente HTML demonstrativo, screenshots, recomendações genéricas,
respostas de API falsas ou lista de testes sem execução. Uma limitação sem
solução deve ser declarada. Uma regra pendente não deve ser decidida por você.
Use arquivo TXT para o relatório e instruções de integração, além dos fontes.
`);
put('02_ARQUITETURA_E_MAPA_DE_ARQUIVOS.txt',`
ARQUITETURA REAL E RESPONSABILIDADES

Frontend atual: HTML/CSS/JavaScript em módulos ES; sem React/Vue. A V3 não é
integralmente um wizard de uma pergunta por página: renderiza formulários por
assunto e fichas. O rótulo técnico coleta-3.0 não aparece ao usuário.
Servidor: Cloudflare Workers; D1 compartilhado; Drive privado para originais;
miniaturas JPEG derivadas D1 até 320x320/64 KB por D072. Plano gratuito.

ENTRADAS
Navegador independente: /login → / → /coleta-v3?vistoria=ID&tela=...&assunto=...
App 1.0.3: /app → iframe /app/coleta → /app/coleta/v3?... na MESMA origem.
O outro iframe abre /tecnico?app=1. Só é criado quando solicitado. Troca de área
esconde o documento, não o destrói. Não trocar isso por navegação que apague
as respostas sem solução/teste. Não transferir cookie ou senha entre domínios.

ARQUIVOS A REFINAR
web/collector-v3.js: render(), header(), footer(), photos(), equipmentForm(),
inventory(), review(), listeners, saveItem/upload, QR e transições.
web/collector-v3.css + collector.css + tokens.css: estilos atuais e compartilhados.
web/collector.js + collector-unit-list.js: lista inicial e escolha da visita.
web/collector-ui.js: patch incremental, foco/cursor, visualViewport, teclado.
web/collector-dialog.js: confirmação cancelável, Escape, restauração de foco.
web/collector-environments.js e environment-editor.js: catálogo por ID e renomear.
web/collector-photo-viewer.js, photo-prepare.js: imagens, redução e miniatura.
web/collector-qr.js: scanner/vídeo, parsing, câmera negada e leitura por imagem.
web/collector-drafts.js: fila por visita/assunto, versão e confirmação da resposta.
web/collector-app.js: ponte ao shell; rotas, sessão, troca de área/Voltar.
web/mobile-app.js/html/css: shell, capacidades, login, sessão e documentos vivos.

CONTRATOS: NÃO TROCAR VALORES PERSISTIDOS POR NOVOS RÓTULOS
web/collector-v3-schema.js: catálogo/validação atual, importações selecionadas V2.
web/collector-v2-schema.js e collector-schema.js: utilitários herdados ainda usados.
server/worker.mjs: autenticação/roteamento/autorização de todo sistema.
server/mobile-app.mjs e shared/mobile-assets.mjs: montagem atual no painel.
server/collector.mjs, collector-v3.mjs, collector-v2.mjs, collector-access.mjs:
salvamento, catálogo, evidências, revisão, conclusão e continuidade entre operadores.
server/agentes/: pareamento, assinatura, recibos, vínculos e telemetria.
server/photo-storage.mjs e módulos Google/fotos: provedor privado e confirmação.
migrations/: todas as 33 migrações originais; não renomear/apagar/reaplicar como seed.

REFERÊNCIA DE QUALIDADE (NÃO SUBSTITUI O COLETOR)
web/technician.html/css/js: interface técnica já aprovada, listas compactas,
resumos claros, folha de detalhes, avisos, estados de envio e navegação.
tests/technician-redesign-browser.cjs e technician-tracking-browser.cjs:
garantias que o redesenho da coleta não deve quebrar.

ANDROID
android/technician/: manifesto + fontes Java, sem frameworks móveis adicionais.
MainActivity inicia /app e limita navegação à origem/rotas permitidas.
CollectionCamera: câmera/galeria e getUserMedia para QR; CaptureProvider privado.
MobilePolicy: regras puras de URL/arquivo; TrackingPolicy/TrackingStore/LocationService:
acompanhamento separado. CAMERA e localização autorizadas pelo Android, sem microfone.
APK atual: br.gov.ma.pacodolumiar.semed.tecnico, versionCode 4, 1.0.3, Android 8+.
Assinatura original NÃO está neste pacote. Não trocar applicationId ou certificado.

COMPATIBILIDADE
O mesmo web/collector-v3.js atende navegador e iframe, mas os builds/destinos
são distintos. Correção compartilhada futura pode exigir publicar os dois
Workers; D115 publicou apenas painel porque adicionou a montagem do app.
Build panel usa bundles esbuild em partes do desktop; coletor é módulos copiados.
Não editar dist/ como fonte. Não incluir dados privados em assets de teste.
`);
put('03_FLUXOS_ESTADOS_E_REGRAS.txt',`
FLUXOS QUE O NOVO VISUAL DEVE EXPLICAR E PRESERVAR

LOGIN E PAPÉIS
Root/admin/operador podem coletar. Visualizador não coleta. Atendimento exige
habilitação individual pelo root independentemente do perfil. Login inicial
com senha provisória exige troca. Não criar papel novo nem auto-habilitar root.
Session cookie HttpOnly/Secure/SameSite Strict, CSRF em escritas; servidor decide.
Sessão expirada exige mesmo usuário para retomar conteúdo em RAM, novo CSRF,
nova trava e confronto de versão. Outro usuário não recebe as respostas locais.

UNIDADE E VISITA
Lista imediata; busca opcional. Somente unidade oficial ativa e elegível,
obras e conveniadas fora. Nenhuma escola fictícia deve ir ao banco real.
Selecionar inicia/retoma uma visita V3; visita antiga não é convertida/apagada
silenciosamente. Operador não é proprietário permanente da unidade.
Sequência recomendada: fachada → acompanhante → internet → Wi-Fi → ambientes →
computadores → impressoras → outros → problemas → revisão. Categorias livres.

PERGUNTAS A/C/D/H
Input/change altera RAM; debounce atual 600 ms para fila de rascunho. Por assunto,
send congela payload/versão; reconcilia leitura em resposta perdida. Navegar não
deve atribuir um blur tardio ao assunto seguinte. Salvar rascunho aguarda envio.
Não confundir “em envio”, “recebido”, “falhou” e “resultado desconhecido”.
Concluir assunto valida e grava estado manualmente. Reabrir pede confirmação.
Assunto concluído acessado por URL fica somente leitura até reabrir.

AMBIENTES
Criar/renomear com ID da mesma unidade, catálogo consultado ao abrir/atualizar.
Equipamento usa environmentId, não deduz ID pelo nome. Não fundir grafias parecidas.
Dois operadores podem trabalhar na unidade; a ficha é protegida por trava/versão.
Renomear mantém fotos, equipamentos e autoria. Cadastrar ambiente não é concluir B.

EQUIPAMENTO
Uma ficha por equipamento, ID permanente e quantidade=1. Não impor limite de 20,
40 ou 100 máquinas por escola; paginar (50 por página no endpoint atual).
Computador: tipo opcional, ambiente/posição, modo Agente/Manual, motivo manual,
estado de patrimônio (sem coletar número), funcionamento e problema condicional.
AnyDesk/RustDesk opcionais: texto de dígitos, preservar zeros. Não são senhas.
Impressora entra diretamente na lista, ambiente, marca/modelo, funcionamento,
origem/aquisição/suprimentos/conexão/IP conforme catálogo atual.
Outros têm descrição opcional e foto opcional; não inventar ambiente obrigatório.
Salvar ficha ≠ concluir assunto ≠ concluir visita ≠ inventário completo da unidade.
Digitar equipamento NÃO faz autosave completo. Foto/QR podem criar rascunho mínimo.
O aviso precisa deixar claro quando ainda falta Salvar equipamento.
Voltar conserva a ficha em RAM e permite Retomar, mas não promete persistência.
Nova ficha/abrir outra pede descarte quando há alteração não enviada.
Excluir equipamento pelo operador não foi aprovado; root exclui no painel com
prévia/motivo/arquivo histórico. Não acrescentar Apagar no coletor por conveniência.

QR / AGENTE
Ler QR → validar formato/expiração → prévia do servidor → ambiente/posição →
salvar rascunho mínimo → vincular via claim com request_id → confirmação do servidor.
Prévia não cria vínculo; upload não cria vínculo; scan não conclui assunto.
Não exigir comparação de código visual (decisão D057). Não gerar QR fictício válido.
Falha depois de enviar: consultar recibo e repetir MESMO comando/request_id.
Não criar outro ID para contornar timeout. Duplicado, outro vínculo, expirado,
revogado, trava e conflito de versão precisam de mensagens e ações específicas.
Troca de localização mantém histórico; não exige motivo do operador no fluxo atual.
Revisita oferece Editar; não reintroduzir conferência de todos os equipamentos.

FOTOS
Câmera/galeria, envio automático, até cinco por registro/visita. Reenvio conserva
photoId; upload ready com SHA retornado, depois thumbnail; falha de miniatura não
transforma original recebido em foto perdida. Original privado no Drive.
Computador/ambiente/outros/ocorrência: opcionais no catálogo atual. Fachada e
impressora iniciais: obrigatórias para conclusão quando não há evidência válida.
Histórico válido dispensa repetir na revisita; conferir regras de alteração.
Foto vinculada a target_kind/target_id/inspectionId da unidade correta.
Prévia e JPEG preparado vivem na RAM; limite agregado atual 40 MiB. Sem vídeos,
documentos ou pintura em fotos. Não converter estado “prévia” em “recebida”.

REVISÃO E PAINEL
Servidor retorna pending[] por causa/ficha, fields e action. Abrir pendência leva
ao ID exato. Se veio da revisão, salvar retorna à revisão atualizada.
Erro 422/400 não pode virar só botão desabilitado sem motivo. Revisão final usa
revision contra alteração concorrente. Contagem é de ações, NÃO porcentagem.
Visita concluída pode alimentar inventário publicado; rascunhos recebidos também
aparecem no painel como parciais nos contextos definidos. D111/D112: classificação
Sem dados/Parcial/Completa é separada, Completa permanece até root mudar.

LOCALIZAÇÃO NO APP
Trocar para Coleta não encerra a localização já ativa na fila técnica. Abrir Coleta
sozinho não inicia GPS. Credencial restrita continua após expirar login, mas só
para localização; nunca autoriza coleta ou acesso gerencial. Logout/revogação/
fim de todas as atribuições encerra conforme D114. Não ampliar período rastreado.
`);
put('04_ACHADOS_ERROS_E_PRIORIDADES.txt',`
ACHADOS — NÃO CONFUNDIR RELATOS COM TESTES CONCLUÍDOS

REL-01 · RELATO DO RESPONSÁVEL · prioridade alta de experiência
Coleta ainda cansativa/confusa, botões e teclado inadequados, percepção de lentidão.
A versão 1.0.3 mudou entrada/composição, não redesenhou as telas internas. Confirmado
pelo contrato D115 e reutilização de collector-v3.js/css. Não assumir que cada bug
histórico persiste: várias correções D062/D089 existem e têm testes. Reavaliar fluxo.

OBS-01 · REPRODUZIDO LOCAL · ação aparentemente disponível é ignorada
Passos: /app → Coleta → unidade → Fachada → Galeria; reter resposta photo-upload
na fixture; clicar Voltar às categorias. Botão isEnabled=true, mas permanece Fachada.
Causa: listener data-action retorna imediatamente se photoBusy em collector-v3.js.
Captura 06 e capturas.json comprovam. Não é medição de latência real do Drive.
Melhoria: feedback imediato de preparo/envio e política clara de navegação; não
retirar guard sem garantir que callbacks continuem vinculados à foto/ficha original.
Se impedir navegar, desabilitar/explicar com acessibilidade; se liberar, testar troca
de ficha/unidade, câmera, conclusão e resposta atrasada. Nunca perder a prévia.

OBS-02 · MEDIDO/OBSERVADO LOCAL · área útil reduzida por cabeçalhos
Viewport 390×844: shell ocupa 111px antes de começar iframe, que recebe 733px;
o coletor acrescenta cabeçalho/rodapé próprios. Capturas 13,16,17,22. Uma altura
390×470 foi simulada, NÃO é teclado Android real. Propor menos repetição de títulos,
troca de área discreta e ações estáveis. Não reduzir alvo de toque indiscriminadamente.

OBS-03 · OBSERVADO VISUALMENTE · revisão com texto concatenado extenso
Captura 20: campos faltantes de Internet aparecem em uma mensagem longa, com vários
rótulos seguidos. pending[] já existe; não apagar sua precisão. Propor lista curta
de causas, contagem por ação e abertura/foco na resposta exata. Causa/ID e estado do
servidor devem permanecer como fonte. Evitar duplicar blocos de pendências/resumo.

OBS-04 · OBSERVADO VISUALMENTE · estados com escopos pouco claros
Captura 13: cabeçalho Rascunho no servidor junto de Ficha nova — ainda não enviada.
Não afirmar corrupção: são escopos diferentes. Refinar rótulos da visita/ficha,
sem prometer salvamento total. Mostrar estado perto da operação a que se refere.

LIM-01 · CONFIRMADO NO CÓDIGO · salvamento desigual
A/C/D/H possuem fila de rascunho; equipamento requer Salvar. Foto/QR salva rascunho
mínimo. Após ler QR ou receber foto ainda pode faltar salvar ficha e concluir assunto.
Preservar distinções e orientar próxima ação; autosave completo/concluir automático
seriam mudanças de regra a propor, não autorização implícita de UX.

LIM-02 · DECISÃO VIGENTE D089 · busca limitada
Pesquisa marca/modelo/série/patrimônio/categoria/descrição de Outros. Não inclui
hostname, posição, ambiente, AnyDesk ou RustDesk. Limitação aprovada anteriormente;
ampliação pode ser proposta separada, com índices/escopo/paginação e decisão.

LIM-03 · CONFIRMADO · perda possível se processo/aba for encerrado
RAM preservada ao alternar áreas não é offline durável. Não há backup do rascunho
do equipamento/foto no dispositivo após encerramento. Nenhum texto “salvo local”
deve fingir durabilidade. Offline requer projeto de proteção/sync/conflitos próprio.

LIM-04 · CONFIRMADO · URL de ficha vira inventário, sem ID de edição
route() grava tela=inventory quando screen=equipment. Recarregar não reconstrói
automaticamente a ficha não salva. Melhorar retomada por ID é proposta técnica
possível, mas nunca inserir respostas/tokens/QR na URL; avaliar política de conflito.

INV-01 · INVESTIGAR · rede/performance, sem atribuir culpa ao D1 sem medição
load() aguarda flushAll antes de reler inspeção; saveItem envolve POST, eventual
lock, load e unlock. Upload relê inspeção; navegação bloqueia por busy/photoBusy.
Medir por ação/endpoint sob atraso, não usar quantidade de linhas JavaScript como
diagnóstico. Comparar D1 chamadas/linhas com mesmo volume, cache/versão/permissão.
Não multiplicar polling, buscar remotamente por tecla ou reconsultar páginas extras.

INV-02 · INVESTIGAR · erros concorrentes/expiração/retomada
Session recovery, lock renewal, unknown receipt e input tardio já têm proteções.
Reproduzir Android/WebView + troca de área + texto digitado durante POST; não
substituir código de recuperação por recarregamento que apague a memória.

INV-03 · PENDENTE FÍSICO
Teclado, botão Voltar nativo, permissões câmera, galeria, QR, rotação, seleção de
foto seguida de processo morto, tela bloqueada e serviço GPS. Resize de navegador
e stub SemedNative não substituem ensaio em aparelho. Declarar esse limite.

ORDEM SUGERIDA DE TRABALHO (PROPOSTA)
P0: perda/duplicação/estado falso, confirmação de save/foto/QR, volta e sessão.
P1: tela de ficha, revisão explicável, teclado/rodapé/cabeçalhos e feedback de espera.
P2: modularização, desempenho medido, lista longa e refinamento de acessibilidade.
O usuário ainda não aprovou novo questionário, offline, perfis ou exclusão no coletor.
`);
put('05_DIRETRIZES_VISUAIS_E_INTERACAO.txt',`
REFINAMENTO — ORIENTAÇÕES CONCRETAS, NÃO UM NOVO LAYOUT OBRIGATÓRIO

Referência: a área Atendimento técnico foi aprovada pelo responsável em 13/11.
Use os arquivos reais technician.* e captura 03. Aproveitar hierarquia clara,
cartões concisos, ações com rótulos diretos, estados legíveis, detalhes progressivos.
Não copiar sua lista de tarefas para dentro do questionário nem unir permissões.

Identidade mantida: fundo #f3f4f5; superfícies brancas; texto/preto #16191d;
vermelho #d70825; laranja #ff4b1e; pêssego #ffad78; estados sem depender só de cor.
Fontes locais Chakra Petch (títulos), Barlow (leitura), JetBrains Mono quando útil.
Ícones SVG do sistema. Não reintroduzir tema azul escuro dos mockups históricos.

TELA A TELA
Entrada/unidades: lista imediata, pesquisa clara, estados vazios úteis, diferenciação
entre rascunho/visita e classificação administrativa, retorno à unidade atual.
Fachada: câmera/galeria evidentes, progresso de envio sem botão morto, histórico
distinto de nova prévia, próxima ação simples sem impedir categorias livres.
Categorias: estado curto por assunto; destacar retomar e revisar, sem contagem
percentual geral de escola nem alerta vermelho para toda ausência opcional.
Internet/Wi-Fi: repetir registros com identidade legível (Provedor/SSID), reduzir
“Registro 1/2/3” como única identificação; campos condicionais e erros locais claros.
Ambientes: catálogo pesquisável, seleção pelo ID, ação criar separada e renomear
sem confundir com criar novo ambiente. Nomes longos precisam continuar legíveis.
Computador: QR/manual como primeira escolha; contexto unidade/ambiente/posição,
ficha salva/rascunho, foto e dados opcionais organizados sem longos avisos repetidos.
Impressora: preservar fotografia exigida e mostrar falta antes da conclusão.
Outros: descrição e imagem com baixa fricção, sem inventar novos obrigatórios.
Revisão: próximo impedimento concreto, registro identificável, correção focalizada,
estado recebido/pendente e botão concluir com causa clara quando indisponível.

TECLADO E TAMANHOS
Alvos de toque confortáveis (referência 44px), sem transformar tudo em botão
gigante de tela inteira. Fonte de campos 16px, labels persistentes. Teclado
numérico para IDs de dígitos, sem parseInt. Enter/Próximo não deve salvar/concluir
sem intenção nem inserir quebra inválida; textarea aceita linhas.
Campo/label/erro e ação de salvar devem caber na área visível. Usar visualViewport
com cuidado dentro do iframe. Não depender exclusivamente de innerHeight do shell.
Safe areas/rodapé/teclado/landscape: conferir no app real; evitar scrolls aninhados
sem necessidade, saltos de foco, scrollTo(0,0) a cada render e overlay sobre campo.

FEEDBACK
Definir estados: editando, aguardando envio, enviando, recebido, validação pendente,
sem rede, sessão expirada, conflito e resultado desconhecido. Rótulo deve indicar
objeto: resposta/ficha/foto/visita. Loading de ação não pode paralisar tudo sem aviso.
Não abrir modais automaticamente por cada autosave. Diálogos só para decisão real.
Erros devem dizer o que aconteceu, o que foi preservado e como continuar.
Toast de sucesso após ACK não substitui estado persistente da ficha.

ACESSIBILIDADE
Foco visível, labels, aria-describedby/invalid, resumo de erros, Escape/Voltar,
retorno ao controle acionador. Contraste, nomes longos, zoom de fonte, leitor de tela,
redução de movimento. Não depender de hover no celular.

PROPONHA ANTES DE MUDAR REGRA
Remover/adicionar/reordenar conteúdo, ampliar busca, salvamento automático total,
marcar assunto automático, offline, edição de múltiplas fichas em paralelo, exclusão,
fotos obrigatórias/opcionais e novas permissões são decisões distintas do visual.
`);
put('06_APIS_DADOS_E_COMPATIBILIDADE.txt',`
CONTRATOS PARA IMPLEMENTAR E TESTAR — CÓDIGO DO WORKER É A REFERÊNCIA EXATA

Autenticação: /api/auth/login, /api/auth/me, /api/auth/logout, troca de senha atual.
App: /api/mobile/me (capacidades), /api/mobile/units (catálogo elegível).
Coletor: /api/collector/capabilities; /api/collector/v3-start com unitId e
preservePrevious; /api/collector/inspection?id=... lê unidade/seções/fotos/versões.
section-save envia inspectionId,section,version,answers; snapshot por assunto.
Concluir assunto/reabrir usa rotas existentes e versão, não mudar state no browser.
equipment-list usa unitId,inspectionId,category,q,cursor, devolve items/nextCursor.
equipment-lock recebe inspectionId,id e opcional token; retorna equipamento,
versão/vínculo e token. Unlock recebe id/token. Não guardar token em URL.
equipment-save recebe inspectionId,id,version,lockToken,environmentId,data e
draft quando aplicável. A edição antiga preserva campos históricos ausentes.
environment-save recebe inspectionId,name,type; rename inclui identidade/versão.
review recebe id da visita e devolve revisão/errors/details/pending. finish recebe
inspectionId,confirm:true,revision; sucesso só com completed confirmado.
Consultas declarativas de endpoints extraídas estão em 09_INVENTARIO_TECNICO.txt;
handlers e testes do pacote contêm formatos completos e recusas.

FOTO: POST photo-upload com bytes de imagem e headers Content-Type,
X-CSRF-Token, X-Photo-Id, X-Inspection-Id, X-Target-Kind, X-Target-Id.
Só ready significa recebida. Derivada em photo-thumb com X-Source-SHA256.
Leitura /api/collector/photo?id=ID&size=thumb autenticada. Remoção também autenticada.
Não substituir por data URL persistida no D1, link público do Drive ou envio fake.

AGENTE: pairings/preview, claim, claim-status e inventory/equipment-location/status.
Manter request_id/recibo, expected_version, lock_token, unidade/ambiente/posição.
O QR não é senha de operador nem prova de posse da unidade. Não logar pairing_code.
Servidor é responsável por validar vínculo atual, revogação, expiração, conflito.

RESPOSTAS A TRATAR
401: sessão expirada → preservar RAM, autenticar MESMO usuário e renovar CSRF.
403: sem permissão/ação vedada → não sugerir modo alternativo que contorne segurança.
400/422: campos/regras específicas → destacar campo/registro correto.
409 e códigos de versão/trava: explicar conflito; não sobrescrever silenciosamente.
429: respeitar Retry-After quando existente, sem repetir agressivamente.
Timeout/desconexão após POST: resultado desconhecido, verificar recibo/estado.
500/503/provedor: manter preenchimento/prévia e oferecer retomada com contexto.

DADOS E HISTÓRICO
Inspeção, seção, equipamento, ambiente, foto, instalação/vínculo são IDs diferentes.
Data JSON de equipamento e seção não são contrato novo inventado pelo layout.
published_json, dados correntes parciais e rastros históricos não são equivalentes.
Um novo estilo não pode exigir recadastrar equipamentos/repetir fotos antigas.
Null/vazio/zero/não informado precisam de semânticas preservadas.

CONSUMO E GRATUITO
Esta conta já atingiu o limite diário de leituras D1. Preservar D108/D110,
paginação, índices e invalidações. Não ler inventário inteiro a cada clique;
medir chamadas/rows_read por ação, abortar respostas antigas e pausar áreas ocultas.
Não criar timer de sessão/catálogo/miniaturas que consulta continuamente.
Não usar cache compartilhado de autorização; permissões revalidadas no servidor.
`);
put('07_EXECUCAO_LOCAL_TESTES_E_DEVOLUTIVA.txt',`
EXECUTAR EM AMBIENTE LOCAL ISOLADO

FONTES/ é o diretório do projeto para os comandos. Node >=24 <25 (node:sqlite),
pnpm 11.25.0 conforme package.json, dependências fixadas por pnpm-lock.yaml.
Instalar: pnpm install --frozen-lockfile
Build: node scripts/build-collector.mjs
       node scripts/build-desktop.mjs
Sem APK/chave original, build desktop avisa APK ausente; não é falha do frontend.
Não construir APK de produção nem inventar assinatura. O mantenedor fará isso.

PRÉVIA INTERATIVA: node scripts/preview-collector-refinement.cjs abre o app local
com Worker/SQLite em memória. Login de teste é mostrado no terminal; nenhuma
conta real. Fechar descarta a base. Não use npm start como teste autenticado:
scripts/serve.mjs é servidor estático antigo, sem API. A prévia exige navegador
visível; em servidor sem tela use --smoke ou os testes headless abaixo.

Navegador: testes usam playwright e Edge por padrão. Em Linux/sem Edge:
  pnpm exec playwright install chromium
  variável SEMED_TEST_BROWSER=chromium
No PowerShell: $env:SEMED_TEST_BROWSER='chromium'
No Linux: SEMED_TEST_BROWSER=chromium node tests/mobile-app-browser.cjs
Não rodar scripts verify-* remotos ou antigos com caminhos privados como testes
locais. Use os roteiros abaixo: criam SQLite em memória, objetos sintéticos e
Worker real em processo. Não precisam de Wrangler autenticado ou de internet.

BASELINE / REGRESSÃO
node --test --test-concurrency=1 tests/*.test.mjs
node tests/collector-v3-browser.cjs
node tests/collector-refinement-browser.cjs
node tests/collector-review-pending-browser.cjs
node tests/collector-environments-browser.cjs
node tests/mobile-app-browser.cjs
node tests/technician-redesign-browser.cjs
node tests/technician-tracking-browser.cjs
node scripts/test-technician-android.mjs (JDK necessário; verificações JVM, não APK)
node scripts/capture-collector-refinement.cjs (reproduz capturas desta entrega)
Não usar somente pnpm test como prova de tudo: a lista explícita de package.json
é histórica e não inclui todos os testes novos D114/D115. Use tests/*.test.mjs.

TESTES MÍNIMOS DA DEVOLUTIVA
T01 Login dos quatro perfis; sem ampliar permissões; senha obrigatória preservada.
T02 Lista automática, busca vazia/sem resultado, escola longa, obra/inativa fora.
T03 Unidade→fachada→categorias, retorno/retomada sem perda, mudança de unidade.
T04 Todos os assuntos/condições; remover linha cancela/confirma; valores históricos.
T05 Mesmo ambiente visto por dois operadores; criar/renomear mantém ID/vínculos.
T06 Computador manual, motivo obrigatório, campos opcionais, zeros em AnyDesk.
T07 QR válido/negado/vencido/revogado/duplicado/outro vínculo/recibo perdido.
T08 Foto câmera/galeria, rotação, grande/HEIC, limite 5, erro envio/miniatura;
    em andamento navegar/trocar área sem quebrar associação ou fingir recebido.
T09 Impressora sem foto impede concluir com motivo exato; computador sem foto aceita.
T10 Equipamento incompleto/rascunho, Salvar→lista→reabrir, assunto manual, revisão
    abre ID exato e volta após correção. Confirmar somente revisão atual do servidor.
T11 Digitar durante POST lento, blur tardio, resposta antiga, timeout antes/depois
    de gravação, idempotência, trava de outro usuário e conflito de versão.
T12 401 no meio da ficha/upload; mesmo usuário retoma, outro não assume RAM;
    logout avisa perda, troca de áreas conserva campos e encerra leitor QR.
T13 1000 equipamentos em fixture local; paginação, última página, filtro e retorno
    de scroll; sem carregar todos nem limitar quantidade cadastrável.
T14 360/390/412px, 812x375 paisagem, zoom fonte; teclado físico Android e navegação
    Voltar, modal + teclado, erro abaixo do campo, safe area, foco acessível.
T15 Fila técnica ativa→Coleta→foto/QR→tela bloqueada; GPS continua conforme D114.
    Sem demanda aceita, só Coleta não inicia GPS. Sair/zerar fila/revogar encerra.
T16 Navegador independente e montagem /app produzem os mesmos dados/validações.

MEDIÇÕES
Registrar ambiente/dispositivo/rede, build/commit, cenário, chamadas por endpoint,
tempo até feedback e até ACK, p50/p95 em amostra repetida (informar N), requisições
simultâneas, D1 chamadas/linhas e payload. Mesmos dados/atraso antes/depois.
Limite local não é latência do Drive/Cloudflare. Sem medir, escrever NÃO MEDIDO.

ENTREGA ESPERADA
1 ZIP com fontes completos alterados na árvore original + patch/unified diff.
2 RELATORIO_ALTERACOES.txt: por problema, causa, correção, arquivos/linhas, teste.
3 MANIFESTO.json: commit base ${commit}, SHA256 por arquivo alterado/removido.
4 TESTES_EXECUTADOS.txt + saídas brutas; separar aprovado/falhou/não executado.
5 Capturas antes/depois mesmos dados/tamanho + roteiro de teste no celular.
6 DECISOES_PENDENTES.txt enumerado; não implantar regras novas silenciosamente.
7 RISCOS_E_INTEGRACAO.txt: ambos builds, compatibilidade/migrações (se propostas),
   impactos Android, caminho de retorno e arquivos que NÃO devem ser substituídos.
8 Não enviar segredos, binários assinados por outra chave, banco real ou credenciais.
Nenhum deploy desta etapa; aprovação de publicação cabe ao responsável depois.
`);
put('08_DECISOES_E_CHECKLIST_DE_REVISAO.txt',`
PONTOS QUE JÁ TÊM DECISÃO — NÃO PERGUNTAR NOVAMENTE SEM CONFLITO NOVO
- Um app, duas áreas, mesma conta; regras de papel e localização preservadas.
- Identidade branco/preto/vermelho/laranja/pêssego, referência técnica aprovada.
- Fachada primeiro na recomendação, categorias livres; conclusão manual.
- Nome/função acompanhante opcionais; não coletar número de patrimônio computador.
- AnyDesk/RustDesk opcionais; foto de computador opcional; upload automático.
- Ambiente cadastrado selecionado por ID; criar novo explicitamente.
- Cadastro manual de computador permitido, com motivo.
- Prévia QR sem conferência de código visual; revisita só Editar.
- Impressora abre lista direta; foto inicial exigida quando não há válida.
- Root controla classificação de coleta completa; visita concluída não a determina.

DECISÕES NOVAS QUE CLAUDE PODE PROPOR, MAS NÃO ASSUMIR
1 Ampliar busca para host/ambiente/posição/AnyDesk/RustDesk (D089 hoje limita).
2 Alterar sequência obrigatória, perguntas ou obrigatoriedade. Agrupar campos
  em blocos/etapas sem mudar regras é proposta técnica de interface.
3 Autosave integral de ficha, conclusão automática ou ações em lote.
4 Offline durável, fila persistente de fotos e política de conflitos/proteção local.
5 Excluir registros pelo operador ou fundir duplicados automaticamente.
6 Mudança de stack/framework/native, novos serviços ou gasto de hospedagem.
7 Alterar comportamento da localização além de manter D114 ao trocar áreas.
Nada disso é necessário para corrigir mensagens, foco, dimensões e hierarquia.

CHECKLIST PARA REVISÃO DO MANTENEDOR QUANDO RECEBER O RETORNO
[ ] Base exata e hashes, alterações alheias preservadas.
[ ] Nenhum arquivo de dados/segredo em assets/ZIP; exemplos somente fixtures.
[ ] Perguntas, chaves/opções/IDs/estados mantidos ou decisão nova destacada.
[ ] APIs não contornadas; sem sucesso fake, senha no frontend ou código QR em URL.
[ ] Foto/QR/histórico e ambiente corretos após navegar/trocar áreas.
[ ] Sessão/trava/concorrência preservadas; ações sem ACK permanecem incertas.
[ ] Layout medido com shell, teclado, nome longo e Android real.
[ ] Consumo D1 não aumenta por polling/reconsulta/feedback de cada tecla.
[ ] Técnico/GPS/perfis continuam iguais; navegador independente também funciona.
[ ] Build/testes e screenshots reproduzidos; limites e falhas declarados.
[ ] Só então decidir publicação e novo APK com versão maior/assinatura original.
`);

put('10_TESTES_E_LIMITES_DESTA_ENTREGA.txt',`
CONFERÊNCIA EXECUTADA EM 14/11/2026 — NÃO É HOMOLOGAÇÃO DO REDESENHO FUTURO

1. Repositório de origem: 301 testes Node aprovados, zero falhas.
2. Cópia FONTES que será entregue: os mesmos 301 testes aprovados, zero falhas.
   Foram inicialmente detectadas duas dependências ausentes no empacotamento
   (scripts/lib/csv.mjs e verificar-ambiente-validacao.mjs). Incluídas, suíte
   completa repetida e aprovada. Isso era falha do pacote, não do aplicativo.
3. Builds desktop (138 arquivos, sem APK privado) e coletor (56) aprovados
   dentro de FONTES, usando dependências já instaladas nesta máquina. Não foi
   feita instalação do zero em outro sistema operacional; lockfile incluído.
4. Fluxo V3 independente: sete fotos, QR, equipamentos, validações e conclusão
   aprovados. Retorno às categorias medido em 85 ms neste ensaio local único
   com envio de resposta atrasado artificialmente; não é latência de produção.
5. Refinamento D089: paginação, salvamento compacto, retomada não salva, sessão
   do mesmo usuário, digitação durante envio, somente leitura/reabertura e links
   guardados aprovados. Esses comportamentos existentes não devem regredir.
6. App unificado dentro de FONTES: troca de área, foto ready, permissão por
   capacidade, recuperação de sessão e ponte de acompanhamento simulada aprovados.
7. Prévia interativa --smoke executada dentro da cópia: login e lista reais do
   Worker/SQLite da fixture aprovados. Nenhuma conta oficial foi consultada.
8. 22 capturas nesta entrega; OBS-01 reproduzido com resposta de foto retida,
   OBS-02 medido; nenhuma exceção JavaScript registrada no roteiro de captura.

ARQUIVOS DE EVIDÊNCIA
capturas.json: viewport, descrição, observações e endpoints/tempos locais, sem
corpos/senhas/cookies. GALERIA.html: visualização das 22 capturas.
REGRESSAO/: saídas dos testes e capturas locais selecionadas. As mensagens
“falha simulada após gravar” nos testes de agentes são cenários intencionais,
não erros de produção. O resumo final da suíte informa PASS/FAIL.
MANIFESTO_ARQUIVOS.sha256: integridade dos arquivos selecionados para o ZIP.

LIMITES
Não houve testes ou gravação em D1/Drive oficial, deploy, novo APK ou mudança
de interface nesta entrega. Não foram usados GPS/câmera físicos, Android real
ou Safari iPhone. Resize e permissão negada simulados não comprovam teclado,
GPS de segundo plano, câmera OEM, consumo diário D1 ou latência na escola.
Testes funcionais aprovados coexistem com problemas de experiência: não usar
o número de testes para negar a avaliação do usuário.
`);
const auto=[];auto.push('INVENTÁRIO EXTRAÍDO DO CÓDIGO ATUAL — NÃO DO CATÁLOGO V1 HISTÓRICO','Base '+commit,'');
const value=v=>typeof v==='function'?v.toString():JSON.stringify(v);
function fields(list,prefix){for(const f of list){auto.push(`${prefix}.${f.key} | ${f.label}`,'  tipo='+f.type+'; obrigatório='+value(f.required)+'; exibidoQuando='+value(f.when));if(f.options?.length)auto.push('  opções: '+f.options.join(' | '));if(f.children)fields(f.children,prefix+'.'+f.key+'[]');}}
for(const [id,name]of topics){auto.push('\nASSUNTO '+id+' — '+name);fields(v3Sections[id]||[],id);}
auto.push('\nFICHAS DE EQUIPAMENTO (condições por category/registration/operation)');fields(v3EquipmentFields,'equipamento');
auto.push('\nVALIDAÇÕES COMPLEMENTARES: validateV3Section/Equipment e reviewV3 nos fontes.',
'Fotos, QR, ambiente por ID, fachada, estados e bloqueios adicionais estão no servidor.',
'environmentName é renderizado como seletor apesar do tipo text legado. registration/manualReason são renderizados em agentBlock().',
'Não usar a função export-collector-questionnaire antiga para recriar perguntas V3: ela importa catálogo V1.');
auto.push('\nROTAS DECLARADAS EM LITERAIS (não inclui todas as rotas construídas dinamicamente)');
for(const file of ['web/collector.js','web/collector-v3.js','web/mobile-app.js','web/collector-environments.js','server/collector.mjs','server/collector-v3.mjs']){
 const s=readFileSync(file,'utf8');auto.push('\n'+file);s.split(/\r?\n/).forEach((line,i)=>{const paths=[...line.matchAll(/['"`]((?:\/api\/)[a-zA-Z0-9_/?=.-]+)/g)].map(m=>m[1]);if(paths.length)auto.push('L'+(i+1)+': '+[...new Set(paths)].join(', '));});
}
auto.push('\nAÇÕES DO COLETOR (handlers data-action)');
readFileSync('web/collector-v3.js','utf8').split(/\r?\n/).forEach((line,i)=>{for(const m of line.matchAll(/a==='([^']+)'/g))auto.push('L'+(i+1)+': '+m[1]);});
put('09_INVENTARIO_TECNICO.txt',auto.join('\n'));

const tracked=git('ls-files','-z').split('\0').filter(Boolean);
const rootFiles=new Set(['00_LEIA_ANTES_DE_TUDO.md','AGENTS.md','README.md','DEVELOPMENT.md','DESIGN.md','package.json','pnpm-lock.yaml','.gitignore','.dev.vars.example','wrangler.jsonc','wrangler.collector.jsonc']);
const selected=tracked.filter(f=>rootFiles.has(f)||/^(web|server|shared|tests|migrations|android\/technician|config)\//.test(f)||/^docs\/(00-governanca|02-coleta-mobile|04-dados-apis|07-operacao|08-auditoria)\//.test(f)||/^docs\/03-painel-desktop\/(ROTEIRO_TECNICO|LOCALIZACAO_CONTINUA|CONTROLE_COLETAS|PANORAMA_COLETAS)/.test(f)||/^docs\/05-qualidade\/(APP_|COLETOR_|COLETA_|UX_COLETOR|PUBLICACAO_V3|AMBIENTES_|FOTO_|ANYDESK_|LOCALIZACAO_|REVISAO_REDESENHO)/.test(f)||/^arquitetura\//.test(f)||/^design\/(COMO|MANIFESTO|GUIA|referencias\/mobile)/.test(f)||/^scripts\/(build-|bundle-|serve|test-technician-android|check-repository|check-doc-links|document-|verify-mobile-release)/.test(f));
selected.push('scripts/capture-collector-refinement.cjs','scripts/package-collector-refinement.mjs','scripts/preview-collector-refinement.cjs','scripts/lib/csv.mjs','scripts/verificar-ambiente-validacao.mjs');
const manifest=[],patterns=[/-----BEGIN (?:RSA |EC |OPENSSH |ENCRYPTED )?PRIVATE KEY-----/,/GOCSPX-[A-Za-z0-9_-]{20,}/,/1\/\/[A-Za-z0-9_-]{50,}/,/(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})/,/eyJ[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/];
for(const f of [...new Set(selected)].sort()){
 if(/(^|\/)(private-data|node_modules|\.git|evidencias)(\/|$)|\.(apk|exe|zip|db|sqlite|jks|keystore|pem|pfx|key)$/i.test(f))throw Error('Forbidden: '+f);
 if(!existsSync(f))throw Error('Missing: '+f);
 // Exclude unrelated working changes from source handoff; only RAST is pre-existing dirty tracked file.
 const bytes=f==='docs/00-governanca/RASTREABILIDADE.md'?execFileSync('git',['show','HEAD:'+f],{maxBuffer:8*1024*1024}):readFileSync(f);
 if(/\.(js|mjs|cjs|jsonc?|txt|md|sql|ya?ml|html|xml|java)$/.test(f)&&patterns.some(p=>p.test(bytes.toString('utf8'))))throw Error('Potential secret (value withheld): '+f);
 const dst=join(base,'FONTES',f);mkdirSync(resolve(dst,'..'),{recursive:true});writeFileSync(dst,bytes);
 manifest.push({source:f,copy:'FONTES/'+f,bytes:bytes.length,sha256:hash(bytes),provenance:f.startsWith('scripts/capture-collector-refinement')||f.startsWith('scripts/package-collector-refinement')||f.startsWith('scripts/preview-collector-refinement')?'handoff criado nesta entrega':'fonte da base informada'});
}
const evidence=JSON.parse(readFileSync(join(base,'capturas.json'),'utf8'));
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
writeFileSync(join(base,'GALERIA.html'),`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Coleta SEMED · estado atual</title><style>body{font:16px/1.5 system-ui;margin:24px;background:#f3f4f5;color:#16191d}header{max-width:950px}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:20px}article{background:#fff;border-top:4px solid #ff4b1e;border-radius:8px;padding:16px}h2{font-size:18px}img{max-width:100%;max-height:650px;display:block;margin:auto}small{color:#60666d}</style><header><h1>Coleta SEMED — aparência atual para refinar</h1><p>22 capturas do código atual em Worker/SQLite isolados. Dados sintéticos. Não é proposta nova nem comprovação em celular físico. Conteúdo de iframe pode continuar abaixo da dobra: consulte também os campos no TXT e o código.</p><p><a href="01_PROMPT_PARA_CLAUDE.txt">Prompt</a> · <a href="COMPILADO_REFINAMENTO_COLETOR_2026-11-14.txt">Compilado completo</a></p></header><main>${evidence.shots.map(s=>`<article><h2>${esc(s.file)}</h2><p>${esc(s.description)}</p><small>${s.viewport.width} × ${s.viewport.height}</small><a href="EVIDENCIAS/${esc(s.file)}"><img src="EVIDENCIAS/${esc(s.file)}" loading="lazy" alt="${esc(s.description)}"></a></article>`).join('')}</main></html>`);
writeFileSync(join(base,'MANIFESTO_FONTES.json'),JSON.stringify({generatedAt:new Date().toISOString(),baseCommit:commit,repository:'https://github.com/tdiasilva-create/inventario',scope:'Fontes para refino de coleta e regressão do app unificado; sem credenciais/DB/APK',sources:manifest},null,2));
const names=readdirSync(docs).filter(n=>/^\d\d_.*\.txt$/.test(n)).sort();
const compiled='\ufeff'+names.map(n=>'\n'+'='.repeat(78)+'\n'+n+'\n'+'='.repeat(78)+'\n'+readFileSync(join(docs,n),'utf8')).join('\n\n');
writeFileSync(join(base,'COMPILADO_REFINAMENTO_COLETOR_2026-11-14.txt'),compiled);
// Old failed-run screenshots are not part of the handoff. Manifest lists only approved evidence.
const walk=d=>readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(join(d,e.name)):[join(d,e.name)]);
const allowedSources=new Set(manifest.map(m=>resolve(base,m.copy)));
const files=walk(base).filter(f=>!f.startsWith(join(base,'FONTES')+sep)||allowedSources.has(resolve(f))).filter(f=>!/(?:^|[\\/])FALHA\.png$|MANIFESTO_ARQUIVOS\.sha256$/.test(f));
const lines=files.sort().map(f=>hash(readFileSync(f))+'  '+relative(base,f).split(sep).join('/'));
writeFileSync(join(base,'MANIFESTO_ARQUIVOS.sha256'),lines.join('\n')+'\n');
console.log(JSON.stringify({base,sourceFiles:manifest.length,files:files.length+1,sourceBytes:manifest.reduce((a,f)=>a+f.bytes,0),compiledBytes:Buffer.byteLength(compiled),screenshots:evidence.shots.length}));
