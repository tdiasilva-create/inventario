# Revisão independente da entrega Claude V2 + QR — 04/11/2026

**Estado: não pronta para publicação; sete falhas reproduzidas.** Nenhuma mudança funcional, migração remota, instalação de EXE ou publicação nesta revisão. A proposta D-053 continua proposta.

Recebidos `ENTREGA_CLAUDE_V2_QR_2026-11-04_1.zip` e `ROTEIRO_TESTE_USUARIO_V2_QRCODE_1.txt`. ZIP SHA-256: `65735ce1d7018d188efa20002dfcc64afb6c07355de519f993a8b8e92cea13d8`. Extração separada em `revisoes/claude-v2-qr-2026-11-04-recebido/`. Os 60 hashes declarados no manifesto conferem. Antes desta revisão, 53 dos 63 arquivos coincidiam com a pasta atual; somente dez PNGs diferiam. Nenhum arquivo da entrega foi copiado sobre o código funcional.

## Verificação executada aqui

- Node 24.19.0, Windows: suíte de `package.json`, 67/67; `tests/in-progress-photos.test.mjs`, 2/2. Total: 69 testes existentes aprovados.
- `node scripts/build-collector.mjs`: 26 arquivos; `node scripts/build-desktop.mjs`: 44 arquivos.
- Sete cenários adicionais em SQLite em memória, chamando os handlers reais, com rede externa proibida.
- Duas capturas fornecidas por Claude abertas visualmente: prévia QR e ficha do agente no desktop. Não são novas capturas produzidas por esta auditoria.
- EXE, Android/iPhone, câmera física, navegador e produção **não testados nesta revisão**.

## Resultados adicionais

| ID | Severidade | Observação reproduzida |
|---|---|---|
| REV-01 | Alta | Exclusão de unidade mantém agente `linked`; heartbeat e inventário posteriores retornam 200. |
| REV-02 | Alta | Operador muda localização em unidade inativa/visita fechada; ficha Manual passa a Agente sem vínculo. |
| REV-03 | Alta | Claim retorna 201 durante trava de outro usuário e não incrementa revisão da visita. |
| REV-04 | Alta | Mudança de ambiente mantém posição/confirmador anteriores e `confirmada_em_visita`. |
| REV-05 | Alta | Botão QR na primeira etapa salva ficha antes de abrir leitor; validação exige ambiente, patrimônio e condições posteriores. |
| REV-06 | Média | Impressora com alteração na visita anterior exige nova foto na revisita marcada sem alterações. |
| REV-07 | Média | Cancelar antes de `getUserMedia` resolver deixa stream sem encerrar; reprodução com DOM controlado. |

As falhas são do estado recebido; sua introdução não foi atribuída individualmente ao Claude sem comparação histórica. Não foram corrigidas nesta revisão. Alertas de alteração de hardware, telas root para autorização/revogação, manutenção agendada e homologação integrada permanecem necessários; ver devolutiva.

## Artefatos

- Relatório e prompt detalhado: `DEVOLUTIVA_CLAUDE_V2_QR_CORRECOES_2026-11-04.txt`, na raiz, com cópia em Downloads.
- Reproduções: `revisoes/claude-v2-qr-2026-11-04-analise/reproducoes.mjs`.
- Resultado: `revisoes/claude-v2-qr-2026-11-04-analise/resultado-reproducoes.json`.
- Conferência de hashes: `conferir-manifesto.mjs` / `conferencia-manifesto.json`, no mesmo diretório.

Comando de diagnóstico: `node revisoes/claude-v2-qr-2026-11-04-analise/reproducoes.mjs`. **Não é teste de aceite:** `defeito:true` significa falha reproduzida, mesmo com exit code 0. A próxima implementação deve adicionar testes que exijam o comportamento correto, preservar os 69 testes e executar homologação física em ambiente isolado.
