# Root e continuidade de coleta — D-046

Implementado e publicado em 28/10/2026.

## Documentos consultados
00_LEIA_ANTES_DE_TUDO.md, AGENTS.md, REGRAS_DE_PRECEDENCIA.md, DECISOES.md, PENDENCIAS.md, CONFLITOS_DOCUMENTAIS.md; Base de Coleta original integral; documentação docs/04-dados-apis/ e docs/03-painel-desktop/; manifesto e cinco PNGs desktop originais; cinco fontes DOT e DIAGRAMAS_E_STATUS.md; ACEITE.md e 02_CASOS_DE_TESTE_PRIORITARIOS.md.

## Mudanças
- Root: Excluir unidade em Cadastro, separado de Inativar. Prévia de vínculos, nome completo e motivo. Exclusão efetiva dos registros operacionais e seus vínculos em lote transacional D1; histórico/confllitos/auditoria e recibo independentes preservados. Também permite excluir unidade que possui vistoria publicada. Nenhuma exclusão automática.
- Prévia obsoleta ou alteração concorrente aborta antes de remover registros. Teste forçou alteração entre conferência e transação: rollback integral.
- Qualquer operador pode continuar qualquer unidade ativa, inclusive publicada e sem atribuição anterior. Compartilha a mesma vistoria aberta, sem reconstruir cadastro ou trocar a autoria inicial. Autoria de cada alteração permanece individual. Conflito de versão continua impedindo sobrescrita de respostas antigas.
- Atalho Editar inventário no cadastro abre o coletor, diretamente na vistoria aberta quando existente. Não cria sessão entre domínios; usuário pode precisar autenticar no coletor.
- Fotos removidas do inventário entram em fila durável de exclusão R2, processada em lotes de 50 quando binding existe. Falha/ausência mantém chave pendente. POST /api/root/photo-cleanup permite repetição pelo root. Sem afirmar remoção física de arquivos se há pendência.

## Testes e evidências
40 testes Node aprovados. root-powers.test.mjs cobre unidades com equipamento publicado, verificação, foto, ambiente, snapshot de ambiente, bloqueio, pendência, totais, remoção transacional, perfis negados, confirmação inválida, prévia antiga, concorrência, preservação de outra unidade e histórico. PRAGMA foreign_keys=ON e foreign_key_check vazio. Falha/repetição de exclusão de objeto testadas com adaptador isolado; não é homologação R2 real. Segundo operador continua e edita seção, preservando dois autores; tentativa antiga recebe409.

verify-root-powers.mjs: Chrome real com SQLite isolado e handlers efetivos, confirmação, cancelamento, exclusão realmente persistida e diálogo430px sem overflow, sem errosJS. Capturas: evidencias/root-poderes/01-exclusao-desktop.png e02-exclusao-mobile.png; resultado.json. Fixtures isoladas, sem envio ao banco oficial.

Produção: migração0011 aplicada; ambos logins200, páginas e APIs exigem sessão. Consulta read-only após implantação:1 unidade,7 usuários,1 vistoria,0 equipamentos,0 exclusões. Nenhuma credencial redefinida ou fixture criada. Exclusão autenticada só testada em base isolada, deliberadamente sem excluir a SEMED real.

## Cobertura e lacunas da Base
Cobertos nesta fatia: catálogo§2.5, continuidade§§1.1/2.2/2.6, autoria e conflitos§7.3, privilégio administrativo§8 e rastreabilidade§9, com extensão explícita D-046 para exclusão integral da unidade. Não modifica perguntas A–H nem regras de conclusão. Permanecem pendentes interfaces administrativas individuais para excluir equipamento/ambiente/vistoria, transferências, tratamento completo de duplicidades, configuração versionada do questionário, backup/restauração, offline protegido e upload R2 real. Root não ganha funcionalidades inexistentes só pelo perfil; não anunciar gestão completa de todas as entidades.

## Publicação
Painel:8d17a921-88b2-483d-992e-5c6407728a43
Coletor/backend:da1f5e01-9ad0-4e16-b0e1-7319e37759fa

https://painel-semed-paco.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev/cadastro-unidades
https://inventario-semed-lumiar.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev/
