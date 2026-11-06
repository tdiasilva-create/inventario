# Guia de acesso — revisão D-037, 28/10/2026

Endereço externo:
https://painel-semed-paco.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev/login

Entre com sua conta individual. Senhas provisórias exigem alteração no primeiro acesso; não compartilhe credenciais. Minha conta e Sair ficam no avatar do cabeçalho. No celular, abra o menu pelo botão no canto superior esquerdo.

## Root

- Cadastro: https://painel-semed-paco.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev/cadastro-unidades
- Usuários: https://painel-semed-paco.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev/usuarios
- Autorizações: https://painel-semed-paco.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev/operadores-unidades
- Segurança: https://painel-semed-paco.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev/seguranca

Informe nome, tipo e INEP de oito dígitos. INEP é opcional para núcleos e unidades administrativas; vazio é gravado como NULL, sem gerar código. Se preenchido, deve ter oito dígitos e ser único. O asterisco aparece somente para escolas municipais e conveniadas. Preencha os demais campos disponíveis. Coordenadas são opcionais, em par, dentro da faixa indicada; aceitam vírgula/ponto. Clique no mini-mapa para preencher. Uma unidade sem coordenadas não gera marcador. Editar e Inativar ficam na tabela; inativação preserva o registro e impede o acesso do operador.

Para importar, abra Importar planilha, baixe o modelo CSV/XLSX e preencha até 200 linhas (arquivo de até 2 MB). Preserve o cabeçalho e o INEP como texto, inclusive zeros iniciais. Situação: Ativa ou Inativa. Se houver erro, nenhuma linha é importada. Confira a prévia e confirme. A prévia expira em 30 minutos. Exemplos de contagem da revisão não foram cadastrados automaticamente.

Em Usuários, informe a pessoa, login e perfil. Entregue a senha provisória por canal privado e feche a página após a entrega. As ações ficam no menu ⋯ e pedem confirmação. Root não altera o próprio perfil nem desativa a própria conta por esse menu. Admin gerencia usuários operacionais nos limites autorizados; somente root cria usuários, cadastra unidades e autoriza visitas.

Em Operadores × unidades, selecione um operador ativo, marque as unidades e salve. A seleção substitui a autorização anterior. Isso não agenda nem inicia uma coleta. Em Segurança, ajuste os prazos de novas emissões e consulte as últimas 100 ações. Alterações de prazo não mudam sessões já emitidas; use revogação para encerrá-las.

## Consulta

Cada seção tem endereço próprio e preserva F5/Voltar/Avançar. O mapa abre em Ruas, centralizado no município; o zoom se adapta para enquadrar a área completa. O limite municipal aparece somente ao selecionar Limite do município (D-038). Cadastro mestre não equivale a inventário coletado. Equipamentos, ambientes, coletas e pendências mostram 0/Aguardando coletas enquanto a integração não existe. O cadastro de unidades pode ser exportado em CSV/XLSX na página Exportar dados; os demais conjuntos permanecem indisponíveis.

O cadastro oficial inclui a SEMED informada pelo responsável (D-039); isso não equivale a uma coleta recebida. Contas e autenticação são reais. Coletor, equipamentos, fotos R2, vistorias, offline/sincronização e relatórios completos continuam pendentes; não há dados DEMO no painel publicado.

## Recuperação técnica

Se uma provisória expirar, root redefine a conta de outra pessoa. Para recuperação emergencial do próprio root, o responsável técnico com acesso Cloudflare e ao segredo privado pode usar `node scripts/recover-root.mjs --confirm-root-recovery`. Invalida senha/sessões e gera `private-data/RECUPERACAO_ROOT.txt`. Essa rotina não foi executada nesta revisão. Preserve o segredo privado e nunca publique ou envie pelo chat `private-data/`.


