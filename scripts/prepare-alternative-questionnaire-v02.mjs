import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const source='C:/Users/SIGAE/.codex/attachments/93126e6e-fd0f-430c-ba57-a2b544a80f73/Texto colado.txt';
const raw=await readFile(source),text=raw.toString('utf8'),dir='docs/01-projeto/revisao-questionario-2026-10-28/revisao-02';
await mkdir(dir,{recursive:true});await copyFile(source,dir+'/REVISAO_RECEBIDA_ORIGINAL.txt');
const old=await readFile('docs/01-projeto/revisao-questionario-2026-10-28/REVISAO_RECEBIDA_ORIGINAL.txt','utf8');
const parse=s=>[...s.matchAll(/^((?:[A-H]|X)(?:\.[A-Za-z0-9]+)+) — ([^\r\n]+)\r?\nResposta: ([\s\S]*?)(?=^_{20,})/gm)].map(m=>({id:m[1],label:m[2],body:m[3]}));
const previous=parse(old),current=parse(text);assert.equal(current.length,222);assert.deepEqual(current,previous,'Há alterações adicionais nos 222 campos que precisam ser analisadas.');
const delta=text.slice(text.indexOf('NOVOS CAMPOS PROPOSTOS'),text.indexOf('SUA PROPOSTA GERAL PARA O MODELO ALTERNATIVO'));
for(const key of ['N1. B.lab','N2. D.wifiNetworks','N3. F.owner','N4. F.brand'])assert.ok(delta.includes(key));
let model=(await readFile('MODELO_ALTERNATIVO_COLETOR_6_CARTOES.txt','utf8')).replace(/^\uFEFF/,'').replaceAll('\r\n','\n');
const replace=(from,to)=>{assert.ok(model.includes(from),'Trecho-base ausente: '+from.slice(0,60));model=model.replace(from,to);};
replace('VERSÃO ALTERNATIVA 0.1 — CONSOLIDAÇÃO PARA REVISÃO','VERSÃO ALTERNATIVA 0.2 — LABORATÓRIO, REDES WI-FI E ORIGEM DOS EQUIPAMENTOS');
replace('Data: 28/10/2026','Data: 28/10/2026\nRevisão02: incorpora o segundo arquivo devolvido, preservando a versão0.1 para comparação.');
const field=(id,label,response,rule,origin)=>['',id+' — '+label,'Resposta: '+response,'Regra: '+rule,'Origem da revisão: '+origin].join('\n');
const lab=field('ALT2.4','Existe laboratório de informática na escola?',
 'Sim, em uso | Sim, com uso parcial | Existe, mas está desativado ou usado para outra coisa | Não existe.',
 'Obrigatório proposto para escolas. Resposta positiva oferece abrir/selecionar o ambiente Laboratório de informática para cadastrar os equipamentos ali. Não criar ambiente só por tocar uma opção; conferir se já existe e confirmar cadastro. Preservar separadamente existência física e situação de utilização.',
 'N1 — B.lab');
replace('Atenção: quantidade cadastrada não comprova',lab+'\n\nPonto de definição: o sistema inclui unidades administrativas, como a SEMED. A revisão diz escola e não fornece Não se aplica/Não foi possível verificar. Não exigir resposta falsa de uma unidade administrativa nem tratar falta de verificação como Não existe. Definir aplicabilidade e essas alternativas antes da implementação.\n\nAtenção: quantidade cadastrada não comprova');
const wifi=['','REDES WI-FI — UMA FICHA POR REDE, SEM DUPLICAR O CARTÃO',
 'Se Existe Wi-Fi? = Sim, oferecer a lista Redes Wi-Fi da unidade. Exibir a ficha em conjunto, em vez de uma etapa isolada para cada pequeno campo. A exigência mínima de quantidade de redes não veio definida; não presumir que o operador sempre consegue ver o SSID.',
field('ALT3.15','Nome da rede (SSID)','Texto livre.','Obrigatório em cada ficha adicionada. Não deduzir identidade de uma rede apenas porque o SSID coincide com outro.','N2.1'),
field('ALT3.16','Uso da rede','Administrativa | Pedagógica/alunos | Visitantes | Outra | Não identificado.','Obrigatório em cada ficha adicionada.','N2.2'),
field('ALT3.17','Senha da rede / situação da informação','Senha em campo protegido, opcional; alternativas Rede aberta e Unidade não informou.','Somente proposta documental. Há alternativa de registrar apenas Senha conhecida pela unidade: Sim/Não e manter a credencial no cofre da TI. As alternativas não foram escolhidas; não pedir dois registros da mesma senha. Campo vazio não significa rede aberta.','N2.3'),
field('ALT3.18','Local onde a rede funciona','Campo Local, com ambientes cadastrados ou Outro local (descrever).','Opcional por rede. Não exige cadastro prévio de ambientes.','N2.4'),
field('ALT3.19','A rede funciona?','Sim | Com falhas | Não.','Obrigatório em cada ficha adicionada. Falha na rede pode sugerir o mesmo registro de problema do cartão6, com área Rede/Wi-Fi. Não assumir funcionamento só porque a rede apareceu no aparelho.','N2.5'),
 '', 'PROTEÇÃO DAS CREDENCIAIS WI-FI — REQUISITO A IMPLEMENTAR SE ESSA OPÇÃO FOR ESCOLHIDA',
 '- Não inserir senhas reais neste TXT ou na conversa.',
 '- Campo oculto/máscara protege a visualização casual; isso sozinho não é criptografia nem controle de acesso.',
 '- Se houver armazenamento no sistema: credencial separada das respostas gerais, criptografada no servidor; chaves fora do frontend/D1 e autorização aplicada no Worker. A chave e sua recuperação precisam de procedimento definido.',
 '- Coletores podem registrar a informação autorizada, mas não consultar credenciais registradas por outros coletores. Não devolver o segredo nos endpoints comuns de vistoria, histórico, painel ou acompanhamento parcial.',
 '- Definir quais perfis existentes podem consultar: o texto cita TI/administração, que não é hoje um papel técnico único. Não conceder leitura de senha a todo usuário admin por suposição.',
 '- Não incluir senha em relatórios, exportações, planilhas, URLs, logs, auditoria textual ou snapshots gerais. Auditoria deve registrar a ação sem copiar o segredo.',
 '- Não preencher retrospectivamente senhas antigas nem prometer suporte offline desse segredo.',
 '- A alternativa com cofre da TI mantém somente o estado da informação no inventário. Ainda depende de escolha.',
 '- Avaliar trocar as senhas após vistoria é recomendação recebida; não autoriza troca automática da rede.'].join('\n');
replace('4 — ENERGIA\n', '4 — ENERGIA\n'); // Assert the following insertion boundary before changing it.
const boundary='\n========================================================================\n4 — ENERGIA\n';
replace(boundary,wifi+'\n'+boundary);
replace('Regra: Manter obrigatoriedade com alternativa Não identificado. A lista concreta de marcas não foi fornecida e não será inventada como catálogo oficial.',
 'Regra: Na revisão02, obrigatória para Impressora/multifuncional, Computador desktop, Notebook, Projetor/datashow e Televisão/painel interativo; alternativas Outra marca e Não identificado. Para as demais categorias, a nova revisão não define explicitamente mudança da obrigatoriedade: manter esse ponto pendente, sem concluir que virou opcional. A lista concreta de marcas por categoria ainda não foi fornecida.');
replace('Origem da revisão: F.brand','Origem da revisão: F.brand + N4');
const owner=field('ALT5.18','Origem/propriedade do equipamento',
 'Da escola/SEMED | Programa do governo federal ou estadual | Doação | Particular (professor ou funcionário) | Não identificado.',
 'Exibido em todas as fichas. A revisão propõe Da escola/SEMED como padrão, mas não define obrigatoriedade. Não registrar propriedade pública automaticamente se o operador não confirmou: um valor pré-selecionado não é prova de titularidade. Manter a definição pendente.',
 'N3 — F.owner');
replace('REGRAS MANTIDAS: patrimônio/série',owner+'\n\nPropriedade e origem de aquisição são conceitos diferentes: um bem doado ou de programa governamental pode pertencer à rede. A lista recebida mistura ambos. Reproduzida aqui para avaliação, sem impor classificação contábil.\nEquipamento Particular pode ser identificado como observado na unidade, mas não deve ser somado ao patrimônio público da SEMED. Não alterar os totais atuais antes de definir e testar essa separação no servidor. Não excluir silenciosamente sua ficha nem confundir posse/localização com propriedade.\n\nREGRAS MANTIDAS: patrimônio/série');
replace('PONTOS A DEFINIR ANTES DE IMPLEMENTAR EM PRODUÇÃO','PONTOS A DEFINIR ANTES DE IMPLEMENTAR EM PRODUÇÃO — REVISÕES01 E02');
replace('P10 — Regras de campos antigos:',
 'P11 — Laboratório: definir aplicabilidade para unidade administrativa e resposta quando não foi possível verificar. Resposta positiva oferece o ambiente, mas não comprova que todos os computadores foram inventariados.\nP12 — Wi-Fi: escolher senha no sistema protegido OU apenas estado da senha com cofre da TI; definir os perfis autorizados à leitura e fluxo de escrita sem reexposição aos outros coletores. As proteções listadas são requisitos, não recursos já operacionais.\nP13 — Origem/propriedade: definir se continua um campo único ou se propriedade e origem de aquisição serão separadas, se é obrigatório e como o operador confirma o padrão. Não inventar titularidade nem converter todos os antigos em Da escola/SEMED.\nP14 — Marca: exigência reforçada para cinco categorias; definir a regra final das demais, mantendo Não identificado como resposta possível.\n\nP10 — Regras de campos antigos:');
replace('O modelo acima tem 57 entradas principais de preenchimento','O modelo acima tem64 entradas principais de preenchimento');
replace('Arquivos: MODELO_ALTERNATIVO_COLETOR_6_CARTOES.txt; COMPARATIVO_REVISAO_COLETOR.txt; fonte íntegra em docs/01-projeto/revisao-questionario-2026-10-28/REVISAO_RECEBIDA_ORIGINAL.txt.',
 'Arquivos da revisão02: MODELO_ALTERNATIVO_COLETOR_6_CARTOES_REVISAO_02.txt; ALTERACOES_MODELO_ALTERNATIVO_REVISAO_02.txt. Fonte íntegra em '+dir+'/REVISAO_RECEBIDA_ORIGINAL.txt. A versão0.1 e sua fonte permanecem preservadas.');
replace('Itens de revisão recebidos:222.', 'Marcações originais:222, inalteradas em relação à revisão01. A revisão02 acrescenta quatro grupos de proposta (N1–N4), incluindo os cinco subcampos de rede Wi-Fi.');
const ids=[...model.matchAll(/^ALT\d\.\d+ —/gm)];assert.equal(ids.length,64);assert.equal(new Set(ids.map(x=>x[0])).size,64);
await writeFile('MODELO_ALTERNATIVO_COLETOR_6_CARTOES_REVISAO_02.txt','\uFEFF'+model.replaceAll('\n','\r\n'));
const summary=['SEMED — ALTERAÇÕES DO MODELO ALTERNATIVO — REVISÃO02','28/10/2026 — documento para avaliação; sem publicação','',
 'MANTIDO: modelo com seis cartões; as222 marcações da revisão01 não mudaram.',
 '', 'NOVO NO CARTÃO2 — AMBIENTES',
 'N1/ALT2.4: pergunta explícita sobre laboratório e situação de uso. Resposta positiva oferece ambiente de laboratório sem duplicar um existente.',
 '', 'NOVO NO CARTÃO3 — CONECTIVIDADE',
 'N2/ALT3.15–ALT3.19: fichas de Wi-Fi com SSID, uso, senha/situação da informação, local opcional e funcionamento.',
 'Não foram inseridas senhas reais. A escolha entre armazenamento criptografado no sistema e cofre da TI permanece pendente. Não basta ocultar um input para proteger uma credencial.',
 '', 'NOVO NO CARTÃO5 — EQUIPAMENTOS',
 'N3/ALT5.18: origem/propriedade. Equipamentos particulares não devem compor o patrimônio público. Não aplicar padrão de titularidade sem confirmação nem converter dados antigos automaticamente.',
 'N4/ALT5.8: marca obrigatória para impressora/multifuncional, desktop, notebook, projetor e TV/painel, com Outra marca e Não identificado.',
 '', 'PONTOS NOVOS PARA DEFINIR',
 '- Laboratório em unidades administrativas e situação não verificada.',
 '- Onde guardar senha Wi-Fi e quem pode consultar, sem expô-la a coletores/relatórios/logs.',
 '- Separação entre propriedade e origem do bem; obrigatoriedade e confirmação do valor padrão.',
 '- Regra de marca nas categorias não citadas em N4.',
 '', 'CONTAGEM',
 '57 entradas principais na versão0.1;64 nesta revisão02, além dos detalhes técnicos por categoria. Essa contagem inclui condicionais/subcampos e não é número de perguntas que aparecem em toda visita.',
 '', 'PRESERVADO',
 'O coletor publicado, a Base de Coleta original, respostas reais, credenciais e versão anterior não foram alterados.',
 'Fonte recebida: SHA256 '+createHash('sha256').update(raw).digest('hex'),
 'Arquivo final: MODELO_ALTERNATIVO_COLETOR_6_CARTOES_REVISAO_02.txt.'];
await writeFile('ALTERACOES_MODELO_ALTERNATIVO_REVISAO_02.txt','\uFEFF'+summary.join('\r\n')+'\r\n');
await writeFile(dir+'/CONFERENCIA.json',JSON.stringify({sha256:createHash('sha256').update(raw).digest('hex'),originalEntries:222,originalEntriesUnchanged:true,newProposalGroups:['N1','N2','N3','N4'],alternativeEntries:64,productionChanged:false},null,2));
console.log('PASS: revisão02 preservada,222 marcações iguais, quatro grupos novos incorporados e64 entradas principais alternativas.');
