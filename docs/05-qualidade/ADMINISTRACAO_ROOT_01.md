# Administração root — entrega 01 (28/10/2026)

Publicado: https://painel-semed-paco.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev/administracao

Versão: `7f4d8e96-830d-49c0-8050-21ff59dd9dba`. Decisão D-035. Acesso pelo menu Administração e por Configurações do painel; rota exige root com troca de senha inicial concluída.

## Documentos e critérios

Consultados `00_LEIA_ANTES_DE_TUDO.md`, `AGENTS.md`, `REGRAS_DE_PRECEDENCIA.md`, `DECISOES.md`, `PENDENCIAS.md`, `CONFLITOS_DOCUMENTAIS.md`, `MODELO_CONCEITUAL.md`, `02_FLUXO_DE_INTEGRACAO.md`, `03_CONTRATOS_E_PERMISSOES_PROPOSTOS.md`, proposta de acesso e sua aprovação D-031, Base §8.1–8.4, `docs/05-qualidade/ACEITE.md` e entregas anteriores. Diagramas DOT existentes conferidos como sínteses técnicas, sem promoção a requisitos novos.

Critérios: root cria unidade e usuário individual; perfil persistido; operador recebe somente escolas autorizadas; alteração/inativação reflete no acesso; cadastros sem coordenadas não criam posições; nenhum exemplo em produção; screenshots e chamadas reais de Worker/D1; preservar autenticação e mapa com escala inicial 3 km.

## Implementação

- `migrations/0003_units_assignments.sql`: nome da pessoa no usuário, cadastro mestre `units`, autorizações `unit_assignments`, histórico técnico `unit_changes`. Migração aditiva, sem apagar contas ou inventário.
- `server/units.mjs`: validar/salvar/editar unidades, impedir duplicação de nome normalizado ou código, versão otimista de edição; lista autorizada por operador; atribuição direta pelo root; troca de perfil com encerramento de sessões. Inativar não apaga histórico.
- `server/worker.mjs`: criação de usuários exclusiva root conforme instrução posterior, novo campo opcional nome, proteção das rotas e recursos. Primeiro acesso continua bloqueando operação administrativa até troca de senha.
- `web/account.html`, `account.js`, `account.css`, `admin-units.js`: ambiente Administração com navegação para Unidades, Usuários, Unidades por operador e Segurança. Root pode cadastrar nome oficial/código/endereço/bairro/coordenadas opcionais e situação; criar usuários individuais com perfil/senha provisória; editar perfil; atribuir/remover unidades de um operador ativo.
- `web/desktop.js`: menu Administração visível ao root; catálogo real via `/api/units`, lista e mapa das unidades ativas; somente coordenadas explícitas geram marcadores. Quantidades de equipamentos e coletas seguem indisponíveis, sem preencher zeros inventados.
- Operador em `/conta` tem lista de unidades autorizadas. A interface não afirma iniciar coleta: coletor separado ainda não publicado.

## Testes e produção

Ambiente isolado Cloudflare: Worker `painel-semed-paco-validacao` e D1 `semed-auth-validacao` novos para testes, sem compartilhamento com o banco oficial. `scripts/verify-root-administration.mjs`: PASS. Cadastro real via formulário; atribuição via formulário e persistência após reload; APIs de duplicidade, coordenada incompleta, edição desatualizada, inativação e acesso filtrado do operador; bloqueio para operador/visualizador/admin; nome pessoal e troca de perfil persistidos; proteção contra elevação de privilégio. O modo de teste desabilitou troca inicial somente nos usuários da semente isolada; contas e políticas de produção não foram alteradas.

11 testes unitários aprovados nesta entrega (unidades, segurança, geografia/exemplos). Navegador Chrome em 1440×1000 e 390×844, sem erros JavaScript ou overflow horizontal. Capturas reais do ambiente de testes, com rótulo TESTE ISOLADO nos cadastros: `evidencias/administracao-root/desktop.png`, `mobile.png`, `painel.png`. Resultado: `resultado.json`.

Produção: migração aplicada; deploy concluído; 28 verificações públicas de proteção/rotas aprovadas. Consulta somente leitura confirmou **0 unidades, 0 atribuições, 4 usuários** no momento da entrega. Não houve inserção dos cadastros de teste na base oficial. Testes autenticados de escrita foram feitos no ambiente isolado para não criar exemplos nem modificar credenciais reais. Worker e D1 de validação removidos ao final; suas imagens e resultados permanecem como evidência histórica.

## Cobertura e limites

Base §2.5 e §8.2: cadastro mestre administrativo e acesso individual por escola, com verificações no servidor na listagem; §8.3: cadastro fechado, agora exclusivo root por D-035; §8.1: quatro perfis por aprovação posterior. Atribuição aqui é autorização de unidades a visitar, não agendamento por dia, ordem de serviço ou vistoria iniciada. Modelo híbrido por grupos/exceções ainda não implementado; alterações de atribuição são substituições atômicas com histórico de antes/depois, sem resolução de edição simultânea da tela de permissões. O editor da unidade verifica versão e rejeita versão desatualizada.

A coleta A–H, uploads R2, fotos oficiais, conclusão/sincronização, histórico de equipamentos, offline, importação CSV/Excel e backup homologado continuam etapas futuras. O cadastro mestre não alimenta métricas de equipamentos ou coletas concluídas. Não altera a Base original nem reintroduz locais antigos do mapa. O teste de navegador não substitui homologação em dispositivos Android/iPhone reais.

Para repetir a suíte de escrita, recriar banco/Worker isolados e atualizar `wrangler.validation.jsonc`; jamais redirecionar o teste para produção. A configuração histórica aponta para recurso já removido. A rota pública pode ser verificada sem escrever dados: `node scripts/verify-panel-release.mjs URL`.
