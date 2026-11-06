# Como transferir tudo ao Codex, sem perda de contexto

## Passo A — Carregar arquivos na raiz do repositório
1. Extrair o ZIP. Ele **não** contém outra pasta-raiz a ser incluída acidentalmente.
2. Na pasta extraída estão `AGENTS.md`, `00_LEIA_ANTES_DE_TUDO.md`, `docs/`, `design/`, `arquitetura/`, `prompts/`.
3. Copiar TODO esse conteúdo para a raiz do repositório GitHub `tdiasilva-create/inventario` (não carregar apenas o ZIP como anexo da Wiki).
4. Usar GitHub Desktop / Git para **commit** e push; verificar por navegador os arquivos e PNGs.
5. O código futuro ficará no mesmo repositório, separado dos docs (por exemplo, `apps/mobile`, `apps/desktop`, `worker` — **sugestões**, não estrutura definitiva).

## Passo B — Iniciar Codex no repositório certo
- Abrir `tdiasilva-create/inventario` no Codex.
- Copiar `prompts/00_PRIMEIRA_MENSAGEM_CODEX.txt` (também há complementos por fase).
- Exigir confirmação de leitura de `BASE_DE_COLETA_V1_0_ORIGINAL.txt` e de **seis** PNGs antes de construir UI.
- Cobrar evidências objetivas: tabela de arquivos lidos, decisões/pontos pendentes, planos, screenshots comparativos, testes.

## Passo C — Entregas graduais sem reinventar projeto
1. Inventariar repositório, montar matriz de rastreabilidade, mockups reais navegáveis mobile; reproduzir visual aprovado.
2. Transformar perguntas A–H em componentes e schemas versionáveis; preservar condicionais, campos opcionais e exceções.
3. Backend Workers/D1/R2 com autenticação, escolas oficiais, fotografia e validação servidor, histórico e idempotência.
4. Offline seguro, conflitos, conferência, fluxo de conclusão e testes nos dois navegadores.
5. Desktop: panorama, mapa (com coordenadas reais ou estado vazio), heatmap, unidade, galeria; indicadores somente com dados reais e regras.
6. Administração, segurança, backups, importação da lista de escolas e homologação com dados autorizados.

## Como revisar qualidade
O Codex deve referenciar a seção da Base (ex.: `§4.C, C.5`, `§3.3`, `§7.10`) ao implementar funcionalidade. Rejeitar mudanças que alterem decisões sem aprovação ou fiquem apenas "visualmente parecidas" sem estados e APIs corretas.

## Faltantes honestamente documentados
A lista oficial de nomes/códigos das 90 escolas, coordenadas reais, branding oficial e credenciais Cloudflare precisam ser fornecidos à implementação quando apropriado. O questionário consolidado tem pendências P1–P11. A engenharia pode avançar com configuração e exemplos DEMO explícitos.
