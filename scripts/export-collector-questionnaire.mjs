import {writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {groups,sections,equipmentFields,categories,audiovisual} from '../web/collector-schema.js';
const out=[],ids=[];const add=(...lines)=>out.push(...lines);
const conditional={
 'C.works':'Se existe internet = Sim.', 'C.linkCount':'Se existe internet = Sim.', 'C.links':'Se existe internet = Sim; repetir para cada link.',
 'C.links.download':'Se Teste de velocidade = Realizado, neste link.', 'C.links.upload':'Se Teste de velocidade = Realizado, neste link.',
 'C.stability':'Se existe internet = Sim.', 'C.stabilityOrigin':'Se existe internet = Sim.',
 'C.affected':'Se existem ambientes sem conectividade = Sim e há ambientes cadastrados; pode selecionar OU descrever.',
 'C.affectedDescription':'Se existem ambientes sem conectividade = Sim; pode descrever OU selecionar ambientes.',
 'D.coverage':'Se existe Wi-Fi = Sim; seleção aparece quando há ambientes cadastrados.',
 'D.coverageDescription':'Se existe Wi-Fi = Sim; pode descrever OU selecionar ambientes.',
 'D.coverageUnknown':'Se existe Wi-Fi = Sim.', 'D.quality':'Se existe Wi-Fi = Sim.',
 'D.routersDetails':'Se Há roteadores? = Sim.', 'D.apsDetails':'Se Há Access Points (APs)? = Sim.',
 'D.switchesDetails':'Se Há switches? = Sim.', 'D.racksDetails':'Se Há racks? = Sim.',
 'D.damagedDetails':'Se existem cabos, tomadas ou portas de rede danificados = Sim.',
 'E.affected':'Se tomadas suficientes = Parcialmente ou Não; seleção aparece quando há ambientes cadastrados.',
 'E.affectedDescription':'Se tomadas suficientes = Parcialmente ou Não; pode descrever OU selecionar ambientes.',
 'E.irregularDetails':'Se existem extensões, adaptadores ou irregularidades aparentes = Sim.',
 'E.protections':'Se existem proteções de energia = Sim ou Parcialmente.',
 'E.waitingDetails':'Se existem equipamentos aguardando instalação = Sim.',
 'E.specialist':'Se existem irregularidades elétricas OU tomadas suficientes = Parcialmente ou Não.',
 'E.specialistDetails':'Se é necessária avaliação por especialista elétrico = Sim.',
 'H.impact':'Se há problemas identificados em C/D/E ou nas fichas de equipamentos.',
 'H.affected':'Se impacto = Impede funcionamento ou Prejudica parcialmente; seleção aparece quando há ambientes cadastrados.',
 'H.affectedDescription':'Se impacto = Impede funcionamento ou Prejudica parcialmente; pode descrever OU selecionar ambientes.',
 'H.needs':'Se faltam equipamentos em algum setor = Sim.',
 'F.customCategory':'Se categoria = Outros equipamentos.', 'F.quantity':'Se forma de cadastro = Lote.',
 'F.mode':'Somente nas categorias que aceitam Individual ou Lote; nas demais, Individual é definido automaticamente.',
 'F.action':'Se há descrição de problemas OU funcionamento = Funciona parcialmente ou Não funciona.',
 'F.otherAction':'Se ação recomendada = Outra ação (especificar).',
 'F.priority':'Se há descrição de problemas OU funcionamento = Funciona parcialmente ou Não funciona.'
};
const formats={text:'Texto livre',textarea:'Texto descritivo',select:'Seleção de uma opção',environments:'Seleção de um ou mais ambientes cadastrados',environment:'Seleção de um ambiente cadastrado',number:'Número inteiro',decimal:'Número decimal',checkbox:'Marcar ou desmarcar',rows:'Lista repetível; adicionar os registros aplicáveis',occurrences:'Lista repetível de ocorrências'};
function condition(f,path){
 if(conditional[path])return conditional[path];
 if(!f.when)return 'Disponível no respectivo cartão/registro; pode herdar a condição do bloco acima.';
 if(path.endsWith('Description'))return 'Alternativa textual ao local/ambiente do mesmo registro; herda a condição do bloco. Não cria ambiente automaticamente.';
 if(['environment','environments'].includes(f.type))return 'Seleção aparece se há ambientes cadastrados e o bloco é aplicável. Pode informar a descrição alternativa do local.';
 throw Error('Condição sem descrição: '+path);
}
function obligation(f,path){
 if(path.includes('.occurrences.')&&path.endsWith('.justification'))return 'Condicional: se falha visível = Sim e não há fotografia confirmada, é necessária justificativa de impossibilidade ou insegurança.';
 if(path.endsWith('.occurrences'))return 'Condicional: registrar ocorrências quando o sistema identifica problemas de C/D/E; pode adicionar mais registros.';
 if(path==='F.problems')return 'Obrigatório se funcionamento = Funciona parcialmente ou Não funciona; opcional nos demais casos.';
 if(typeof f.required==='function'){
  if(path.includes('.occurrences.environments')||path.startsWith('H.improvements.environments'))return 'Opcional; seleção e descrição são alternativas opcionais para identificar o local deste registro.';
  if(path==='C.affected')return 'Seleção OU descrição do local obrigatória quando há ambientes sem conectividade.';
  if(path==='C.affectedDescription')return 'Obrigatória se há ambientes sem conectividade e não foram selecionados ambientes.';
  if(path.startsWith('D.coverage'))return 'Seleção OU descrição quando Wi-Fi = Sim; pode marcar Não foi possível verificar os ambientes cobertos.';
  return 'Local obrigatório quando aplicável: preencher a seleção OU a descrição alternativa, não as duas simultaneamente.';
 }
 return f.required?'Obrigatório quando exibido e aplicável; nos blocos repetíveis, em cada registro adicionado.':'Opcional (salvo regra complementar descrita neste documento).';
}
function item(path,label,format,required,when,options=[]){
 ids.push(path);add('',path+' — '+label,'Resposta: '+format,'Obrigatoriedade atual: '+required,'Quando aparece: '+when);
 if(options.length)add('Opções: '+options.join(' | '));
 add('Sua decisão: [ ] MANTER  [ ] SIMPLIFICAR  [ ] RETIRAR  [ ] TORNAR OPCIONAL  [ ] UNIR A OUTRA','Novo texto / novas opções / observações:','________________________________________________________________________');
}
function fields(list,prefix){for(const f of list){const path=prefix+'.'+f.key;const options=f.key==='category'?categories.map(c=>c[1]):f.options||[];item(path,f.label,formats[f.type]||'Data e hora',obligation(f,path),condition(f,path),options);if(f.children){add('CAMPOS DE CADA REGISTRO DO BLOCO '+path+':');fields(f.children,path);add('FIM DO BLOCO '+path+'.');}}}
add('SEMED — TODAS AS PERGUNTAS E CAMPOS DO COLETOR ATUAL','ARQUIVO DE REVISÃO PARA PREPARAR UM MODELO ALTERNATIVO','Data da extração: 28/10/2026','',
 'Este arquivo descreve o coletor implementado atualmente, inclusive perguntas condicionais, campos repetíveis e detalhes técnicos opcionais. Não é um novo questionário aprovado.',
 'Edite este TXT e devolva-o. As suas alterações servirão de base para um modelo alternativo; esta entrega não modifica o coletor, os dados nem as perguntas atuais.',
 '', 'COMO REVISAR',
 '1. Marque a decisão abaixo de cada item ou escreva sua orientação livremente.',
 '2. Pode alterar o texto, reduzir opções, trocar a obrigatoriedade, unir perguntas ou retirar blocos.',
 '3. Se unir perguntas, indique os códigos que deseja reunir. Preserve os códigos para facilitar a comparação.',
 '4. Um bloco repetível não é uma pergunta única: os campos abaixo dele se repetem a cada link, ocorrência, demanda ou equipamento.',
 '5. Nem todos os campos aparecem na mesma visita. Dependem das respostas e do equipamento escolhido.',
 '6. As especificações técnicas são opcionais. G compartilha as fichas de F; não é um segundo cadastro do mesmo bem.',
 '7. Escreva suas escolhas. Não precisa responder ao inventário neste arquivo; ele é para revisar o formulário.',
 '', 'ÍNDICE', ...groups.map(([g,n])=>g+' — '+n),
 'F.TEC — Detalhes técnicos por categoria', 'X — Conferência, fotografias, confirmações e acesso',
 '', 'LEITURA DAS REGRAS',
 'A obrigatoriedade refere-se à conclusão do cartão/ficha, não a dizer que rascunhos precisam estar completos.',
 'Em C/D/E/H, identificar locais pode ser feito por descrição sem cadastrar B. Equipamentos F/G exigem ambiente cadastrado.',
 'Seleção e descrição do mesmo local são alternativas, não duas respostas obrigatórias simultâneas.',
 'Para campos opcionais dentro de blocos condicionais, a condição do bloco também se aplica.');
for(const [g,name]of groups){
 add('','========================================================================',g+' — '+name.toUpperCase(),'========================================================================');
 if(g==='A')add('Dados mostrados automaticamente, sem redigitação: nome da unidade selecionada, operador autenticado, data/hora de início e versão do questionário. O catálogo mestre e a escolha da unidade não são perguntas de A.');
 if(g==='B'){
  item('B.ambiente.name','Nome do ambiente','Texto livre','Obrigatório para cadastrar cada ambiente identificado.','No formulário Cadastrar ambiente do cartão B.');
  item('B.ambiente.type','Tipo do ambiente','Texto livre (valor inicial atual: Outro ambiente)','Obrigatório para cadastrar cada ambiente identificado.','No formulário Cadastrar ambiente do cartão B.');
  add('A identificação de ambientes acima é separada da contagem por tipo abaixo. Pode cadastrar vários ambientes.');
 }
 if(g==='F'){
  add('Ficha repetida a cada equipamento individual ou lote homogêneo. Seis etapas atuais: categoria; localização; identificação; condições/problemas; detalhes técnicos; fotografias.',
  'Categorias e forma de cadastro:',...categories.map(c=>'  - '+c[1]+': '+(c[2]==='individual'?'somente Individual':'Individual ou Lote')),
  'Categorias individuais têm quantidade física 1 e não perguntam a forma de cadastro no wizard.',
  'Em lote, patrimônio e série não podem identificar vários itens diferentes com um mesmo número. Use as alternativas Sem patrimônio / Sem número de série / Não identificado ou fichas individuais.');
  fields(equipmentFields,'F');
  item('F.fotos','Fotografias do equipamento','Câmera ou galeria','Opcionais; de zero a cinco por equipamento individual.','Etapa final da ficha. O envio real permanece indisponível sem habilitação do R2.');
  continue;
 }
 if(g==='G'){
  add('NÃO POSSUI QUESTIONÁRIO OU FICHA SEPARADA. Reutiliza integralmente os campos F e F.TEC, filtrando:',...categories.filter(c=>audiovisual.includes(c[0])).map(c=>'  - '+c[1]),
  'Inclui as mesmas perguntas de categoria, localização, identificação, condições, problemas, detalhes técnicos e fotos da ficha F. Não recadastrar o mesmo bem por aparecer nos dois cartões.');
  continue;
 }
 fields(sections[g],g);
 if(['C','D','E'].includes(g))add('', 'REGRAS COMPLEMENTARES DESTE SETOR:',
 'Cada ocorrência pergunta descrição, locais afetados, se há falha visível e justificativa quando não for seguro ou possível fotografar.',
 'Cada ocorrência também possui área de fotografia (câmera/galeria, até cinco). Falha visível = Sim exige foto confirmada OU justificativa. Sem falha visível, a foto é opcional.',
 'As fotografias estão previstas na interface, mas o envio real permanece bloqueado enquanto o armazenamento R2 não estiver habilitado.');
 if(g==='C')add('Quando há internet, a quantidade de fichas deve corresponder a 1 ou 2 links; 3 ou mais exige ao menos três fichas.',
 'Velocidade contratada: informar número em Mbps OU Não soube informar. Download/upload somente quando o teste foi realizado.',
 'Os problemas que disparam ocorrência incluem internet funcionando parcialmente/não funcionando, estabilidade instável/indisponível, ambientes sem conectividade ou descrição de problemas preenchida.');
 if(g==='D')add('As quantidades de roteadores/APs/switches descritas aqui não são novos bens somados novamente às fichas F.',
 'Os problemas que disparam ocorrência incluem cobertura Wi-Fi parcial/insuficiente, cabos que requerem correção ou danos identificados.');
 if(g==='E')add('Os problemas que disparam ocorrência incluem tomadas insuficientes/parcialmente suficientes ou irregularidades elétricas aparentes. Registros de equipamentos aqui não duplicam o patrimônio de F.');
}
add('','========================================================================','F.TEC — DETALHES TÉCNICOS OPCIONAIS POR CATEGORIA','========================================================================',
 'Somente os campos da categoria escolhida aparecem. Todos abaixo são opcionais e atualmente usam texto livre; sugestões entre parênteses não são listas fechadas.');
for(const c of categories){add('',c[1].toUpperCase());if(!c[3].length)add('Nenhuma especificação técnica adicional nesta categoria.');c[3].forEach((label,i)=>item('F.TEC.'+c[0]+'.'+String(i+1).padStart(2,'0'),label,'Texto livre','Opcional.','Somente na categoria '+c[1]+'.'));}
add('','========================================================================','X — OUTRAS PERGUNTAS, CONFIRMAÇÕES E CAMPOS DE APOIO','========================================================================',
 'Estes itens não são perguntas técnicas do inventário. Foram incluídos para você ter a visão completa do que o operador encontra.');
for(const [id,label,required,when,opts]of [
 ['X.unidade','Selecione a unidade','Obrigatório para iniciar/continuar a coleta.','Lista de unidades oficiais ativas; busca opcional.',[]],
 ['X.busca','Nome da unidade ou INEP','Opcional; apenas filtro, não resposta do inventário.','Lista inicial.',[]],
 ['X.conferencia','Resultado da conferência do equipamento','Escolha de ação de conferência.','Ficha existente na lista de equipamentos.',['Conferir sem alterar','Não localizado','Não verificado']],
 ['X.naoLocalizado','Justificativa para não localização','Obrigatória ao marcar Não localizado.','Após a ação Não localizado.',[]],
 ['X.naoVerificado','Justificativa de não verificação','Opcional.','Após a ação Não verificado.',[]],
 ['X.duplicidade','Por que este é outro equipamento?','Necessária para insistir em novo cadastro após alerta de duplicidade.','Somente se houver possível duplicidade; permanece em análise administrativa.',[]],
 ['X.reabrir','Reabrir cartão / Reabrir equipamentos?','Confirmação antes de editar cartão concluído.','Cartão já concluído.',['Cancelar','Confirmar']],
 ['X.descartar','Descartar ficha ainda não salva?','Confirmação quando se troca a ficha em edição.','Há ficha tocada e ainda não salva.',['Cancelar','Confirmar']],
 ['X.trocar','Trocar de unidade?','Confirmação de descarte quando há ficha de equipamento não salva.','Troca de unidade nessas condições.',['Cancelar','Confirmar']],
 ['X.removerRegistro','Remover registro do rascunho?','Confirmação.','Ao remover linha repetível.',['Cancelar','Confirmar']],
 ['X.removerFoto','Remover foto do rascunho?','Confirmação.','Ao remover foto enviada de rascunho; depende do armazenamento habilitado.',['Cancelar','Confirmar']],
 ['X.finalizar','Concluir vistoria?','Revisão e confirmação explícitas, com requisitos validados pelo servidor.','Após revisar cartões.',['Cancelar','Confirmar']],
 ['X.sair','Sair da coleta?','Confirmação.','Menu da conta.',['Cancelar','Confirmar']],
 ['X.login.usuario','Nome de usuário','Obrigatório.','Login.',[]],['X.login.senha','Senha','Obrigatória.','Login.',[]],
 ['X.conta.atual','Senha atual','Obrigatória ao alterar senha.','Minha conta.',[]],['X.conta.nova','Nova senha (mínimo 12 caracteres)','Obrigatória ao alterar senha.','Minha conta.',[]],['X.conta.confirmar','Confirme a nova senha','Obrigatória ao alterar senha.','Minha conta.',[]]
])item(id,label,opts.length?'Escolha/ação':'Texto ou campo conforme descrição',required,when,opts);
add('', 'Outros filtros sem valor de resposta do inventário: busca de equipamento por patrimônio/série/marca/modelo; categoria; conferência (Todos os registros / Não conferidos ou não verificados / Não localizados); pesquisa de opções nos seletores.',
 '', '========================================================================','SUA PROPOSTA GERAL PARA O MODELO ALTERNATIVO','========================================================================',
 'Setores que considera longos demais:','', 'Perguntas que podem ser unidas:','', 'Perguntas que devem ser retiradas:','',
 'Perguntas que devem ser opcionais:','', 'Informações que não podem faltar:','', 'Sugestão de nova organização dos setores:','',
 'Outras observações:','', '========================================================================','ORIGEM E CONFERÊNCIA DA EXTRAÇÃO','========================================================================',
 'Fontes: web/collector-schema.js (esquema final após ajustes C/D/E/H); web/collector.js (formulários, botões e conferência); server/collector.mjs (regras adicionais de conclusão); web/collector-login.html e web/collector-account.html.',
 'Base documental preservada: docs/02-coleta-mobile/BASE_DE_COLETA_V1_0_ORIGINAL.txt. Havendo diferença entre fonte documental e comportamento atual, este TXT retrata a implementação para revisão; não altera a Base.',
 'Os códigos identificam campos/blocos de revisão, não quantidade de perguntas obrigatórias em uma visita. Não some títulos de blocos, alternativas de localização e campos por categoria como se todos aparecessem juntos.');
if(new Set(ids).size!==ids.length)throw Error('Códigos repetidos');
const schema=await readFile('web/collector-schema.js');add('SHA-256 do esquema extraído: '+createHash('sha256').update(schema).digest('hex'),'Total de entradas de revisão (inclui blocos, alternativas, campos técnicos e apoio): '+ids.length,'FIM DO ARQUIVO');
const path='QUESTIONARIO_COMPLETO_COLETOR_PARA_REVISAO.txt';await writeFile(path,'\uFEFF'+out.join('\r\n')+'\r\n','utf8');
console.log(JSON.stringify({path,entries:ids.length,lines:out.length,groups:groups.map(g=>g[0])}));
