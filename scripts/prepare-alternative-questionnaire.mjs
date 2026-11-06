import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const source='C:/Users/SIGAE/.codex/attachments/acd59b16-58b2-4063-96a7-a32cfdaef25a/Texto colado.txt';
const raw=await readFile(source),text=raw.toString('utf8'),archive='docs/01-projeto/revisao-questionario-2026-10-28';
await mkdir(archive,{recursive:true});await copyFile(source,archive+'/REVISAO_RECEBIDA_ORIGINAL.txt');
const blocks=[...text.matchAll(/^((?:[A-H]|X)(?:\.[A-Za-z0-9]+)+) — ([^\r\n]+)\r?\nResposta: ([\s\S]*?)(?=^_{20,})/gm)].map(m=>({id:m[1],label:m[2],decision:[...(m[3].match(/Sua decisão: ([^\r\n]*)/)?.[1]||'').matchAll(/\[X\]\s*([^\[]+)/g)].map(x=>x[1].trim()),notes:m[3].split(/\r?\n/).filter(s=>s.startsWith('>>')).map(s=>s.replace(/^>> SUGESTÃO:\s*/,''))}));
if(blocks.length!==222||new Set(blocks.map(b=>b.id)).size!==222||blocks.some(b=>b.decision.length!==1))throw Error('Revisão incompleta ou marcações ambíguas');
const counts={};for(const b of blocks)counts[b.decision[0]]=(counts[b.decision[0]]||0)+1;
await writeFile(archive+'/CONFERENCIA_DAS_MARCACOES.json',JSON.stringify({sha256:createHash('sha256').update(raw).digest('hex'),entries:blocks.length,counts,blocks},null,2));
const comparison=['SEMED — COMPARATIVO DAS MARCAÇÕES RECEBIDAS','28/10/2026 — referência de revisão; sem alteração da produção','',
 'As marcações abaixo foram extraídas do arquivo devolvido, sem transformá-las automaticamente em regras publicadas.',
 'Contagens: '+Object.entries(counts).map(([k,v])=>k+': '+v).join(' | '),
 'A contagem confirma as 90 marcações RETIRAR e 34 UNIR A OUTRA citadas na revisão. São itens de revisão, não perguntas exibidas simultaneamente.',
 '',...blocks.flatMap(b=>[b.id+' — '+b.label,'Marcação: '+b.decision[0],...b.notes.map(n=>'Nota recebida: '+n),''])];
await writeFile('COMPARATIVO_REVISAO_COLETOR.txt','\uFEFF'+comparison.join('\r\n')+'\r\n');
const out=[];const add=(...s)=>out.push(...s);
add('SEMED — MODELO ALTERNATIVO DO COLETOR','VERSÃO ALTERNATIVA 0.1 — CONSOLIDAÇÃO PARA REVISÃO','Data: 28/10/2026','',
 'Este modelo foi preparado a partir das suas marcações e sugestões. Não substitui o sistema publicado, não altera respostas existentes e não modifica a Base de Coleta original.',
 'O objetivo é reduzir perguntas repetidas e deslocar detalhes para onde são necessários. As decisões ainda ambíguas estão identificadas no final, sem impor novas regras ao ambiente real.',
 '', 'ESTRUTURA PROPOSTA — SEIS CARTÕES',
 '1. Identificação','2. Ambientes','3. Conectividade','4. Energia','5. Equipamentos','6. Problemas e demandas','',
 'REGRAS COMUNS',
 '- Unidade, usuário autenticado e registro de data/hora vêm do sistema. Operador escolhe unidade oficial; não cadastra unidade mestre.',
 '- Cartões acessíveis em ordem livre; concluir continua sendo uma ação manual. Sem porcentagem geral.',
 '- Um campo Local substitui seleção + descrição simultâneas: ambientes existentes e opção Outro local (descrever). Sem ambientes cadastrados, a descrição continua disponível em infraestrutura/demandas.',
 '- Equipamentos continuam exigindo ambiente cadastrado, conforme marcação F.environment. Não gerar um ambiente fictício para contornar isso.',
 '- Um mesmo equipamento não é recadastrado em rede/energia/audiovisual. O cartão5 guarda suas fichas e quantidades.',
 '- Problema de equipamento tem um registro de origem na ficha. O cartão6 o apresenta por referência; não cria outra ocorrência do mesmo defeito.',
 '- Campos vazios opcionais significam Não informado. Não significam automaticamente ausência do problema, teste não realizado ou equipamento desconhecido.',
 '- Dados antigos, inclusive campos retirados do formulário novo, permanecem históricos; não preencher novas respostas por inferência.',
 '- Sem respostas fictícias, sucesso simulado, mudança de persistência D1/R2/Workers ou promessa de offline.');
let n=0;function q(id,label,options,rule,origin){n++;add('',id+' — '+label,'Resposta: '+options,'Regra: '+rule,'Origem da revisão: '+origin);}
function heading(title){add('','========================================================================',title,'========================================================================');}
heading('1 — IDENTIFICAÇÃO');
add('Resumo automático: unidade, usuário responsável por cada ação, início da vistoria e versão do questionário.');
q('ALT1.1','Responsável presente — nome','Texto livre.','Opcional, no mesmo bloco visual do cargo.','A.responsible + A.role');
q('ALT1.2','Responsável presente — cargo','Diretor(a) | Vice-diretor(a) | Coordenador(a) | Secretário(a) escolar | Outro.','Opcional.','A.role');
q('ALT1.3','Observações da vistoria','Texto livre.','Opcional.','A.notes');
heading('2 — AMBIENTES');
q('ALT2.1','Tipo de ambiente','Sala de aula | Laboratório de informática | Secretaria | Diretoria | Coordenação | Sala dos professores | Biblioteca/sala de leitura | Auditório/sala multiuso | Sala de AEE | Outro.','Obrigatório para cadastrar ambiente.','B.ambiente.type');
q('ALT2.2','Quantidade de ambientes deste tipo a cadastrar','Número inteiro positivo.','Gera ambientes individuais numerados, sem repetir manualmente o cadastro N vezes. Valor inicial proposto:1, editável; não é contagem total de ambientes já existentes.','B.counts.quantity + B.ambiente');
q('ALT2.3','Nome do ambiente','Texto livre; sugestão automática por tipo e numeração.','Opcional. Nomes gerados são editáveis. Não duplicar ambientes existentes ao repetir a gravação.','B.ambiente.name');
add('Retirado o bloco separado B.counts. A contagem exibida deriva dos ambientes cadastrados.',
 'Atenção: quantidade cadastrada não comprova que todos os ambientes físicos da unidade foram levantados. O painel deve dizer Ambientes cadastrados, sem inventar um total físico.',
 'Sugestão técnica reversível: ao gerar vários ambientes, mostrar prévia dos nomes antes de confirmar, preservando IDs existentes.');
heading('3 — CONECTIVIDADE (C + D)');
q('ALT3.1','Internet na unidade','Funciona | Funciona com falhas | Não funciona | Não existe | Não foi possível verificar.','Obrigatória. Se Não existe, ocultar os campos de link/estabilidade. Se Não foi possível verificar, não exigir dados de links.','C.exists + C.works');
add('LINKS: quando há internet identificada, mostrar uma ficha vazia editável e Adicionar outro link. A ficha visual vazia não é automaticamente um link cadastrado. Quantidade derivada das fichas efetivamente salvas.');
q('ALT3.2','Tipo de conexão do link','Fibra | Rádio | Cabo | 4G-5G | Satélite | Não identificado.','Obrigatório em cada ficha de link adicionada.','C.links.type');
q('ALT3.3','Provedor/operadora','Texto livre.','Opcional por link; vazio = Não informado.','C.links.provider');
q('ALT3.4','Velocidade contratada (Mbps)','Número decimal, sem valores negativos.','Opcional por link.','C.links.contracted');
q('ALT3.5','Download medido (Mbps)','Número decimal, sem valores negativos.','Opcional por link. Não preencher automaticamente com zero.','C.links.download');
q('ALT3.6','Upload medido (Mbps)','Número decimal, sem valores negativos.','Opcional por link; pode haver somente uma medida informada.','C.links.upload');
add('Removidos Quantidade de links, Teste realizado? e Momento do teste como perguntas.',
 'Exibir Medição informada quando houver download e/ou upload; caso contrário, Medição não informada. Isso não afirma que ninguém realizou teste.',
 'O horário automático registra quando a medição foi informada/salva no sistema, não necessariamente o instante em que o teste ocorreu.');
q('ALT3.7','Estabilidade da conexão','Boa | Instável | Não avaliada.','Quando há internet. Manter exigência aplicável atual; o texto recebido não a tornou opcional.','C.stability');
q('ALT3.8','Existe rede cabeada?','Sim | Não | Parcialmente | Não avaliada.','Obrigatória.','D.wired');
q('ALT3.9','Existe Wi-Fi?','Sim | Não | Não avaliado.','Obrigatória.','D.wifi');
q('ALT3.10','Qualidade da cobertura Wi-Fi','Adequada | Parcial | Insuficiente | Não avaliada.','Obrigatória se Wi-Fi = Sim.','D.quality');
q('ALT3.11','Existem locais sem conectividade?','Sim | Não | Não avaliado.','Uma única pergunta no novo cartão. O significado exato da união com cobertura Wi-Fi precisa da definição P1 abaixo.','C.uncovered + D.coverage');
q('ALT3.12','Locais sem conectividade','Local: ambientes cadastrados ou Outro local (descrever).','Se ALT3.11 = Sim, informar os locais. Pode escolher vários locais; sem depender de B.','C.affected/C.affectedDescription + D.coverage/D.coverageDescription');
q('ALT3.13','Equipamentos de rede presentes','Múltipla escolha: Roteador | Access Point | Switch | Rack | Nenhum | Não avaliado.','Obrigatória. Nenhum e Não avaliado são exclusivos das escolhas de equipamentos. Presença não gera ficha patrimonial nem quantidade presumida.','D.routers + D.aps + D.switches + D.racks');
q('ALT3.14','Cabeamento de rede','Adequado | Desorganizado | Com danos (cabos, tomadas ou portas) | Não avaliado.','Obrigatória; ao informar danos, atalho para problema de Rede/Wi-Fi no cartão6, sem repetir descrição. Ver P2 para danos e desorganização simultâneos.','D.cables + D.damaged');
add('Retiradas as quatro listas de detalhes de roteadores/APs/switches/racks e a lista de danos de rede. Quantidades de bens ficam nas fichas; danos e seus locais ficam no registro único de problema.');
heading('4 — ENERGIA');
q('ALT4.1','As tomadas são suficientes?','Sim | Parcialmente | Não | Não avaliado.','Obrigatória.','E.outlets');
q('ALT4.2','Locais com tomadas insuficientes','Local: ambientes cadastrados ou Outro local (descrever).','Se ALT4.1 = Parcialmente ou Não. Esse mesmo local pode ser aproveitado no problema correspondente, sem redigitar.','E.affected + E.affectedDescription');
q('ALT4.3','Existem extensões, adaptadores ou irregularidades elétricas aparentes?','Sim | Não | Não avaliado.','Obrigatória. Se Sim, oferecer problema de Energia no cartão6. Apenas avaliação visual.','E.irregular');
q('ALT4.4','Quais proteções de energia existem?','Múltipla escolha: Nobreak | Estabilizador | Filtro de linha | Nenhuma | Não avaliado.','Obrigatória. Nenhuma e Não avaliado são exclusivos das escolhas de proteção.','E.protected');
q('ALT4.5','É necessária avaliação por especialista elétrico?','Sim | Não | Não foi possível determinar.','Quando existem irregularidades ou tomadas insuficientes/parcialmente suficientes, conforme regra atual mantida.','E.specialist');
q('ALT4.6','O que precisa ser avaliado?','Texto livre.','Opcional se ALT4.5 = Sim. O local fica no problema de Energia, sem nova pergunta de ambiente.','E.specialistDetails');
add('Retiradas as listas repetidas de irregularidades e proteções; detalhes de problema ficam no cartão6.',
 'Retiradas as perguntas sobre equipamentos aguardando instalação deste cartão. Essa situação passa à ficha do equipamento.');
heading('5 — EQUIPAMENTOS (F; AUDIOVISUAIS COMO FILTRO)');
add('Categorias mantidas: Computador desktop; Notebook; Tablet; Monitor de computador; Impressora/multifuncional; Scanner independente; Projetor/datashow; Televisão/painel interativo; Roteador; Access Point; Switch; Nobreak/UPS; Webcam; Microfone; Caixa de som; Servidor físico/NAS; Outros equipamentos.',
 'Rack e Estabilizador aparecem como possibilidade na revisão, não como inclusão definitiva. Neste modelo, Rack pode constar na presença de rede e Estabilizador na presença de proteção; veja P3.',
 'Audiovisuais vira filtro da mesma lista: projetor, TV/painel, webcam, microfone e caixa de som. Não há cartão G separado nem fichas duplicadas.',
 'Continuar permitindo adições sucessivas de fichas sem teto artificial por unidade; limites de infraestrutura continuam existindo.');
q('ALT5.1','Categoria','Lista das categorias acima.','Obrigatória.','F.category');
q('ALT5.2','Descrição de outro equipamento','Texto livre.','Obrigatória se categoria = Outros equipamentos.','F.customCategory');
q('ALT5.3','Forma de cadastro','Individual | Lote.','Individual automático nas categorias individuais atuais; nas demais, escolher Individual ou Lote.','F.mode');
q('ALT5.4','Quantidade do lote','Número inteiro positivo.','Obrigatória somente para lote homogêneo.','F.quantity');
q('ALT5.5','Ambiente','Selecionar ambiente cadastrado na unidade.','Obrigatório. A marcação específica de F.environment foi mantida; a descrição livre geral não substitui o ambiente do bem.','F.environment');
q('ALT5.6','Patrimônio','Texto; alternativas Sem patrimônio e Não identificado.','Obrigatório. Preservar zeros à esquerda e ID interno independente.','F.asset');
q('ALT5.7','Número de série','Texto; alternativas Sem número de série e Não identificado.','Opcional quando houver patrimônio real informado. Sem patrimônio identificável, manter a exigência de resposta atual com as alternativas permitidas.','F.serial');
q('ALT5.8','Marca','Lista por categoria + Outra marca + Não identificado.','Manter obrigatoriedade com alternativa Não identificado. A lista concreta de marcas não foi fornecida e não será inventada como catálogo oficial.','F.brand');
q('ALT5.9','Modelo','Texto livre.','Opcional.','F.model');
q('ALT5.10','Conservação física','Bom | Regular | Ruim | Não avaliado.','Obrigatória.','F.condition');
q('ALT5.11','Funcionamento','Funcionando | Funciona parcialmente | Não funciona | Não testado.','Obrigatório; uma ausência de resposta não equivale a Não testado.','F.operation');
q('ALT5.12','Situação de uso','Em uso | Fora de uso | Reserva | Aguardando instalação | Desconhecido.','Obrigatória. Terminologia de incerteza preservada até resolver P7.','F.use + E.waiting');
q('ALT5.13','Problemas identificados','Lista de problemas por categoria + Outro; preservar alternativa Problema não identificado.','Obrigatório se funcionamento = Funciona parcialmente ou Não funciona; pode informar defeito mesmo quando está funcionando. Lista completa de opções por categoria ainda não definida.','F.problems');
q('ALT5.14','Ação recomendada','Manutenção | Substituição | Instalação | Avaliação técnica.','Obrigatória quando houver problemas. Outra ação (especificar) sai; explicações adicionais podem ir em Observações.','F.action + retirada de F.otherAction');
q('ALT5.15','Prioridade','Baixa | Média | Alta.','Mantida a condição atual de obrigatoriedade quando há problemas. A frase Pode ser opcional não define uma regra final; ver P4.','F.priority');
q('ALT5.16','Observações do equipamento','Texto livre.','Opcional.','F.notes');
q('ALT5.17','Fotografias do equipamento','Câmera ou galeria.','Opcionais; manter até cinco por equipamento individual. Limite de lote continua pendente; envio real depende do R2.','F.fotos');
add('REGRAS MANTIDAS: patrimônio/série não identificam vários itens diferentes de um lote; ID interno e histórico preservados; conferência sem alterações, não localizado e não verificado continuam distintos.');
heading('5.T — DETALHES TÉCNICOS REDUZIDOS');
add('Todos os detalhes abaixo continuam OPCIONAIS. São apresentados somente para a categoria escolhida, em um bloco recolhível proposto. Não obrigar acesso a esse bloco para preencher o que é essencial.');
const tech={
 'Computador desktop':[['CPU','Intel Core i3/i5/i7 | AMD Ryzen3/5/7 | Celeron/Pentium | Outro | Não identificado'],['Memória RAM','Até4GB | 8GB | 16GB ou mais | Não identificado'],['Armazenamento — bloco único','Tipo HD/SSD + capacidade Até256GB | 500GB | 1TB ou mais'],['Sistema operacional','Windows10 | Windows11 | Linux | Outro | Não identificado']],
 'Notebook':[['CPU','Mesmas opções do desktop'],['Memória RAM','Mesmas opções do desktop'],['Armazenamento — bloco único','Mesmas opções do desktop'],['Sistema operacional','Mesmas opções do desktop'],['Condição da bateria','Boa | Fraca | Não segura carga | Não avaliada']],
 'Tablet':[['Armazenamento interno','32GB | 64GB | 128GB ou mais | Não identificado'],['Sistema operacional','Android | iPadOS | Outro | Não identificado'],['Condição da bateria','Boa | Fraca | Não segura carga | Não avaliada']],
 'Monitor de computador':[['Tamanho da tela','Número em polegadas'],['Computador relacionado','Vínculo opcional a computador existente; não criar novo computador']],
 'Impressora/multifuncional':[['Tecnologia','Laser | Jato de tinta/tanque | Outro'],['Impressão','Colorida | Preto e branco'],['Conectividade','Múltipla escolha USB | Rede cabeada | Wi-Fi']],
 'Scanner independente':[['Tipo','Mesa | Com alimentador (ADF) | Portátil']],
 'Projetor/datashow':[['Conexões','Múltipla escolha HDMI | VGA | USB | Sem fio'],['Instalação','Fixo | Móvel']],
 'Televisão/painel interativo':[['Tipo','TV comum | SmartTV | Painel interativo'],['Tamanho','Número em polegadas'],['Instalação','Parede | Suporte móvel | Mesa']],
 'Roteador':[], 'Access Point':[['Uso','Interno | Externo']],
 'Switch':[['Gerenciamento','Gerenciável | Não gerenciável | Não identificado'],['Quantidade de portas','8 | 16 | 24 | 48']],
 'Nobreak/UPS':[['Capacidade','Número em VA'],['Estado da bateria','Boa | Fraca | Não segura carga | Não avaliada']],
 'Webcam':[], 'Microfone':[], 'Caixa de som':[],
 'Servidor físico/NAS':[['Tipo','Servidor | NAS'],['Capacidade de discos','Valor com unidade GB/TB'],['Finalidade','Texto livre']], 'Outros equipamentos':[]};
for(const [cat,fs]of Object.entries(tech)){add('',cat.toUpperCase());if(!fs.length)add('Sem perguntas técnicas adicionais.');for(const [label,options]of fs)add('  - '+label+': '+options+'. Opcional.');}
add('', 'Listas acima reproduzem a simplificação recebida; não presumem que outras configurações não existem. Antes de transformá-las em listas fechadas, resolver P8. A frase recebida todo roteador atual é Wi-Fi não é adotada como regra: retirar a pergunta não transforma essa afirmação em dado do equipamento.');
heading('6 — PROBLEMAS E DEMANDAS');
add('Uma única lista reúne ocorrências de C/D/E e H.improvements. Cada registro tem ID único. Os atalhos dos cartões3/4 abrem essa mesma lista com a área sugerida; o operador confirma e complementa. Não criar duplicata se o registro de origem já existe.');
q('ALT6.1','Área do problema/demanda','Internet | Rede/Wi-Fi | Energia | Equipamentos | Estrutura | Outro.','Obrigatória para novo registro; área pode vir pré-selecionada pelo atalho de origem.','União C/D/E.occurrences + H.improvements');
q('ALT6.2','Local afetado','Ambientes cadastrados ou Outro local (descrever); pode selecionar vários locais.','Manter opcional nos problemas gerais, como nos blocos originais. Quando um local é exigido pela pergunta de origem, reutilizar esse mesmo local.','C/D/E.occurrences.environments + H.improvements.environments');
q('ALT6.3','Descrição do problema ou demanda','Texto livre.','Obrigatória para cada registro manual.','C/D/E.occurrences.description + H.improvements.description');
q('ALT6.4','Impacto','Impede funcionamento | Prejudica parcialmente | Não prejudica | Não foi possível avaliar.','Obrigatório em cada problema/demanda manual, em vez de perguntar impacto geral da unidade.','H.improvements.impact; retirada de H.impact/H.affected');
q('ALT6.5','Prioridade','Baixa | Média | Alta.','Obrigatória em cada problema/demanda manual. Não define automaticamente prioridade da unidade inteira.','H.improvements.priority');
q('ALT6.6','Informado pela unidade','Marcador opcional.','Marcado significa relatado pela unidade. Desmarcado não prova constatação direta; origem pode continuar Não informada.','H.improvements.origin');
q('ALT6.7','Fotografias do problema/demanda','Câmera ou galeria.','No modelo alternativo solicitado: sempre opcionais, até cinco por ocorrência. Sem perguntas Falha visível? e Justificativa de fotografia. Isso altera a regra original de foto de infraestrutura; não aplicar ao modelo publicado nesta entrega.','Retirada C/D/E.occurrences.visible/justification');
add('A indisponibilidade atual do R2 é uma limitação técnica, não é por si só uma decisão de negócio. A proposta de foto sempre opcional é mantida aqui como mudança pedida na revisão, separada do coletor atual.');
add('', 'NECESSIDADES DE NOVOS EQUIPAMENTOS — SUBLISTA DO MESMO CARTÃO');
q('ALT6.8','Faltam equipamentos em algum setor?','Sim | Não | Não avaliado.','Obrigatória. Se Sim, abrir fichas de necessidades.','H.lack');
q('ALT6.9','Local da necessidade','Ambiente cadastrado ou Outro local (descrever).','Obrigatório por necessidade; não depende de B.','H.needs.environment + H.needs.environmentDescription');
q('ALT6.10','Tipo de equipamento necessário','Mesma lista de categorias do cartão5; Outro com descrição.','Obrigatório por necessidade.','H.needs.type');
q('ALT6.11','Quantidade estimada','Número inteiro positivo.','Obrigatória por necessidade. Não adiciona bens ao inventário existente.','H.needs.quantity');
q('ALT6.12','Justificativa da necessidade','Texto livre.','Opcional no modelo alternativo. Não tem relação com justificativa de fotografia.','H.needs.justification');
q('ALT6.13','Prioridade da necessidade','Baixa | Média | Alta.','Obrigatória por necessidade.','H.needs.priority');
q('ALT6.14','Informado pela unidade','Marcador opcional.','Mesma regra de origem de ALT6.6; desmarcado não significa automaticamente constatação pelo operador.','H.needs.origin');
heading('ACESSO, REVISÃO E CONFIRMAÇÕES');
add('Mantidos: login com usuário/senha; alteração de senha; unidades oficiais em lista; busca opcional; conferir equipamento sem alterar; não localizado com justificativa obrigatória; não verificado com justificativa opcional; alerta de duplicidade e motivo; confirmação de reabertura de cartão; confirmação de remover registro/foto; revisão final; confirmação de conclusão; confirmação ao sair.',
 'Unificada a confirmação de descarte/troca: Há alterações não salvas. Descartar? — Cancelar / Confirmar. Isso não autoriza abandonar respostas sem aviso.',
 'Modelo alternativo também deve exibir dados salvos parciais no desktop sem publicá-los como vistoria concluída.');
heading('PONTOS A DEFINIR ANTES DE IMPLEMENTAR EM PRODUÇÃO');
add('P1 — Sem conectividade não é igual a sem Wi-Fi. Um local pode não ter Wi-Fi e ter internet por cabo. A revisão pede ambas as expressões. Definir se a única pergunta localizará falta de qualquer acesso ou apenas de Wi-Fi. Alternativa técnica para avaliação: um único registro de local com indicação do tipo de falta, sem dois questionários repetidos.',
 'P2 — Cabeamento pode estar desorganizado E danificado. A lista de escolha única sugerida perde essa combinação. Definir se aceita múltipla seleção de condições ou se Com danos prevalece com descrição complementar.',
 'P3 — Rack e Estabilizador foram sugeridos com se quiser. Não incluir novas categorias patrimoniais automaticamente. Podem permanecer só nas listas de presença.',
 'P4 — Prioridade de equipamento: Pode ser opcional não é regra conclusiva. Neste modelo manteve-se obrigatória quando há problema. Já demandas/ocorrências mantêm prioridade obrigatória.',
 'P5 — Fotos sempre opcionais substituem uma exigência anterior para falhas visíveis de infraestrutura. Esta versão é alternativa documental; regra atual do servidor não foi removida.',
 'P6 — Timestamp de medição: registrar quando foi informada, não inventar o horário real do teste. Vazio continua Não informado, sem deduzir Teste não realizado.',
 'P7 — Padronizar não sei sem confundir estados. Não identificado (identidade), Não avaliado (avaliação), Não testado (funcionamento) e Não existe (ausência verificada) têm significados diferentes. Preservados aqui até definir uma padronização que não destrua informação.',
 'P8 — Algumas listas técnicas recebidas não cobrem valores intermediários, como RAM6GB/12GB, SSD512GB, armazenamento384GB ou switch de outra quantidade de portas. PROPOSTA de complemento: Outro valor / Não identificado onde necessário. Sem forçar arredondamento ou respostas falsas. CPU também deve separar modelos da mesma família caso essa distinção seja desejada.',
 'P9 — As listas completas de marcas e problemas por categoria não vieram definidas. Não inventar catálogo oficial. A versão executável deverá manter alternativa Outra/Não identificado.',
 'P10 — Regras de campos antigos: não converter automaticamente prioridade Crítica em Alta, cobertura COM Wi-Fi em SEM Wi-Fi, falta de resposta em Não avaliado ou série ausente em Sem número de série. Manter versão/histórico e mapeamentos explícitos.');
heading('CORREÇÃO DO ARQUIVO QUE ENVIEI ANTERIORMENTE');
add('H.needs.justification é Justificativa da necessidade de novo equipamento. No coletor atual, é um texto obrigatório por necessidade adicionada.',
 'O TXT exportado associou indevidamente a esse campo a regra de falha visível/fotografia porque verificava apenas o nome justification. Esse era um erro da exportação, não dessa regra no collector-schema.js.',
 'O gerador do TXT foi corrigido. Sua marcação de torná-la opcional é preservada neste modelo alternativo. A fonte revisada recebida foi arquivada intacta.');
heading('RASTREABILIDADE E STATUS');
add('Itens de revisão recebidos:222. Contagem exata das marcações: '+Object.entries(counts).map(([k,v])=>k+'='+v).join('; ')+'.',
 'Esses números incluem títulos de blocos, alternativas de local, detalhes por categoria e acesso; não representam perguntas obrigatórias de uma visita. As90 marcações RETIRAR e34 UNIR A OUTRA foram confirmadas; não são uma medida direta da redução de perguntas por visita.',
 'O modelo acima tem '+n+' entradas principais de preenchimento, incluindo subcampos e condicionais, além dos detalhes técnicos opcionais por categoria. Não é correto comparar diretamente esse total aos222 itens do inventário de revisão.',
 'Arquivos: MODELO_ALTERNATIVO_COLETOR_6_CARTOES.txt; COMPARATIVO_REVISAO_COLETOR.txt; fonte íntegra em '+archive+'/REVISAO_RECEBIDA_ORIGINAL.txt.',
 'A implementação/publicação desta versão ainda não foi executada. Nenhum dado oficial, credencial ou resposta existente foi alterado.',
 '', 'SUAS OBSERVAÇÕES SOBRE ESTE MODELO:','', '________________________________________________________________________','FIM DO MODELO ALTERNATIVO');
await writeFile('MODELO_ALTERNATIVO_COLETOR_6_CARTOES.txt','\uFEFF'+out.join('\r\n')+'\r\n');
console.log(JSON.stringify({entries:blocks.length,counts,alternativeEntries:n,files:['MODELO_ALTERNATIVO_COLETOR_6_CARTOES.txt','COMPARATIVO_REVISAO_COLETOR.txt'],sourceHash:createHash('sha256').update(raw).digest('hex')}));
