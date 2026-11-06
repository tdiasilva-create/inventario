import {readFile,readdir,writeFile} from 'node:fs/promises';
const dir='docs/07-operacao';
let text=`SEMED · TRANSFERÊNCIA, OPERAÇÃO E MIGRAÇÃO
Referência: 05/11/2026. Gerado dos guias mantidos em docs/07-operacao/.
Repositório: https://github.com/tdiasilva-create/inventario
Painel: https://painel-semed-paco.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev/login
Coletor: https://inventario-semed-lumiar.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev/login

CHECKLIST PARA A EQUIPE RECEPTORA
[ ] Ler regras, decisões posteriores e limites de homologação.
[ ] Clonar o commit correto e instalar com Node 24/pnpm 11.25.0/lockfile.
[ ] Executar testes, builds e conferir esquema das 15 migrações.
[ ] Obter acesso institucional aos recursos por canal privado.
[ ] Confirmar chaves/segredos correspondentes, sem publicá-los no Git.
[ ] Confirmar backup do D1, arquivos do Drive e manifesto de vínculos.
[ ] Receber fonte/build/EXE exatos do agente Windows e verificar hash.
[ ] Definir destino, endpoints, OAuth, manutenção, RPO/RTO e retorno.
[ ] Restaurar em isolamento, conferir integridade e homologar o ciclo completo.
[ ] Aprovar janela; suspender todos os escritores; copiar estado final.
[ ] Fazer corte sem duas bases independentes recebendo escrita.
[ ] Testar quatro perfis, fotos, QR, telemetria, parciais e publicação.
[ ] Registrar versões, resultados, responsáveis e pendências.
[ ] Só retirar origem após observação e confirmação dos agentes.

Este documento orienta; não comprova migração executada. Não inclui senhas,
tokens, dados operacionais ou instaladores. Não executar seeds em produção.
O diretório gerado/ contém o dicionário físico completo, separado deste TXT.

`;
for(const name of (await readdir(dir)).filter(x=>/^0[1-9]_.*\.md$/.test(x)).sort()){
 const md=await readFile(dir+'/'+name,'utf8');
 text+='='.repeat(78)+'\nFONTE: '+name+'\n'+'='.repeat(78)+'\n\n'+md.replace(/^#{1,6} /gm,'').replace(/^```[^\n]*\n?/gm,'').replace(/`/g,'').replace(/\[([^\]]+)\]\(([^)]+)\)/g,'$1 ($2)').replace(/\*\*/g,'')+'\n\n';
}
await writeFile(dir+'/TRANSFERENCIA_E_MIGRACAO.txt',text);
console.log(JSON.stringify({file:dir+'/TRANSFERENCIA_E_MIGRACAO.txt',bytes:Buffer.byteLength(text)}));
