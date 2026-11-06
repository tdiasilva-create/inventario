# Revisão do plano de homologação — 04/11/2026

R2-A/B/C permanecem aprovados localmente pela rev3. Esta rodada revisou somente a preparação e a verificação HTTP da homologação; não alterou questionário, Worker, migrações ou interface.

Fontes: `00_LEIA_ANTES_DE_TUDO.md`, `AGENTS.md`, regras de precedência, decisões D-046/D-052/proposta D-053, pendências/conflitos, plano recebido em Downloads (idêntico à cópia inicial do repositório), configurações dos dois Workers de validação, `bootstrap-auth.mjs`, `verify-panel-release.mjs`, roteamento/autenticação do Worker, handler `enrollmentChallenge` e validação de foto da fachada. Cópias recebidas preservadas em `revisoes/homologacao-v2-qr-2026-11-04/`.

## Ajustes

1. O 401 de uma rota humana sem sessão não prova que a rota exista: a autenticação ocorre antes do roteamento e também protege caminhos inexistentes. A sonda agora declara seu limite, sem afirmar migração ou versão confirmada.
2. O POST `enrollment-challenge` incrementa `agent_rate_limits` antes de recusar a falta de autorização. A sonda padrão agora faz somente seis GETs por endereço; o POST exige a opção `--probe-agent`, com efeito documentado. Nem sete respostas esperadas comprovam todas as tabelas/colunas da migração.
3. Sem armazenamento de fotos, não se conclui a primeira visita que exige fachada; também não se valida a publicação/revisita. Essa opção serve para teste parcial de QR/agente. Não alterar validação nem inserir metadado de foto fictícia para passar no ambiente publicado.
4. Bootstrap gera seed destrutivo e sobrescreve arquivos locais de credenciais. Reservado a banco vazio confirmado e material local sem uso a preservar; contas/pepper existentes devem ser preservados. Este plano não autoriza limpeza.
5. Removida atribuição obrigatória de operador, incompatível com D-046. Recibos são por comando gravado, não por clique. Uma aprovação do ambiente cobre seu escopo; não inventar aprovações repetidas por comando. Produção requer aceite/publicação próprios.

## Testes executados

`node --test tests/validation-probe.test.mjs`: 3 aprovados, 0 falhas.

- Dois endereços locais em memória: 12 GETs corretos e nenhuma mudança no banco.
- Com tabela `agent_claim_requests` removida somente da fixture em memória, sete respostas HTTP ainda passam; o resultado declara `migrationVerified:false`. Demonstra por que é necessário conferir migração/esquema e sessão autenticada separadamente.
- Sonda ativa registra uma tentativa; respostas 500 falham; URL contendo credenciais é recusada antes de qualquer acesso.

Nenhuma chamada à conta Cloudflare, implantação, criação de conta, aplicação de seed, instalação de EXE ou teste em dispositivo físico. A suíte funcional de 80 testes não foi repetida sem mudança funcional. Log: `revisoes/homologacao-v2-qr-2026-11-04/testes-verificador.txt`.

## Entrega e decisões pendentes

Plano revisado no local oficial `docs/06-entregas/claude-v2-qr-2026-11-04/PLANO_HOMOLOGACAO_V2_QR.txt`, com cópia em Downloads como `PLANO_HOMOLOGACAO_V2_QR_REVISADO.txt`. Script corrigido `scripts/verificar-ambiente-validacao.mjs`; teste `tests/validation-probe.test.mjs`; orientações atualizadas em `DEVELOPMENT.md`.

Aguardam decisão do responsável: autorizar os dois ambientes/contas/unidade de validação (D-H1/D-H4), escolher armazenamento de teste (D-H2), indicar computador e celulares (D-H3). O Codex pode conduzir os comandos no computador dentro do escopo autorizado; participação humana continua necessária nos aparelhos físicos/autenticações próprias.
