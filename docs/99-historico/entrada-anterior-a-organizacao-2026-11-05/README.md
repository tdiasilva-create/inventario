# Inventário Tecnológico SEMED — repositório documental + implementação

Este repositório descreve **todo o projeto discutido**: coleta mobile em campo (apenas preenchimento) e painel desktop analítico, compartilhando Cloudflare D1 e R2 via Workers. A primeira implementação será conduzida por Codex.

**[COMECE AQUI — guia central](00_LEIA_ANTES_DE_TUDO.md)** · **[Arquivo original do questionário](docs/02-coleta-mobile/BASE_DE_COLETA_V1_0_ORIGINAL.txt)** · **[Referências visuais com PNGs](design/COMO_USAR_CADA_IMAGEM.md)** · **[Diagramas de arquitetura](arquitetura/DIAGRAMAS_E_STATUS.md)** · **[Prompt inicial Codex](prompts/00_PRIMEIRA_MENSAGEM_CODEX.txt)**.

### Separação essencial
- `docs/02-coleta-mobile/`: catálogo de unidades **pré-cadastradas**; questionário extenso A–H; wizard/card navigation; fotos; revisão; offline; histórico; segurança e autorizações.
- `docs/03-painel-desktop/`: Centro de Inteligência Tecnológica dark-tech; mapa, matriz de equipamentos, detalhe de escola; indicadores contextuais, não cards genéricos.
- `docs/04-dados-apis/`: entidades e invariantes, vínculo D1/R2, contratos propostos de Workers.
- `docs/00-governanca/`: decisões, precedência, conflitos, fontes, pendências, rastreabilidade.
- `arquitetura/`: cinco diagramas editáveis SVG/DOT e PNG.
- `design/referencias/`: **SEIS imagens aprovadas originais**.
- `docs/05-qualidade/`: testes e aceitação.

Nenhum dado DEMO dos PNGs é inventário oficial. Para iniciar, verifique `MANIFESTO_DE_CONFERENCIA.json` e leia `AGENTS.md`.
# Atualização operacional — 28/10/2026, coletor online

Ambiente 2 publicado: https://inventario-semed-lumiar.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev/login . Mesmo catálogo/contas/D1 do painel, Worker e interface próprios. Primeira fase online A–H, sem teto artificial de equipamentos por unidade; volume validado com 1.006 registros isolados. R2 ainda não habilitado e offline protegido ainda não implementado: não anunciar fotos/offline operacionais. Ver `docs/05-qualidade/COLETOR_ONLINE_01.md` e decisão D-041 para cobertura, capturas, testes e pendências. Atualizações abaixo anteriores a D-041 devem ser lidas como histórico.

