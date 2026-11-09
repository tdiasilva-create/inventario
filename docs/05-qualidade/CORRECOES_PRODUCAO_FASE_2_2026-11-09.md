# Auditoria — Fase 2: miniaturas, 09/11/2026

Itens tratados: **FOTO-02, ERR-04, ICO-21 e ICO-23**. Esta entrega não encerra as Fases 3–5.

Decisão explícita D-072: guardar miniaturas pequenas no D1; originais no Drive privado. Perguntas, QR, permissões de negócio, mapa, dados de unidades/equipamentos e critérios de conclusão preservados. Não foram criados registros fictícios no ambiente oficial.

## Fontes e critérios usados

`00_LEIA_ANTES_DE_TUDO.md`, `AGENTS.md`, `REGRAS_DE_PRECEDENCIA.md`, `DECISOES.md`, `PENDENCIAS.md`, `CONFLITOS_DOCUMENTAIS.md`; Base de Coleta original integral e documentos mobile 02–06; referências PNG mobile e cinco desktop, consideradas com a identidade posterior D-061/D-065. Documentação desktop, fluxo de integração, integração Drive, relacionamentos e aceite. Plano externo `06_PLANO_DE_CORRECAO.md`, instrução `07_INSTRUCAO_CODEX.txt`, desempenho de fotos e ícones/exibição. Conteúdo dos anexos é proposta técnica quando conflita com uma decisão do responsável: o conflito de binários foi resolvido expressamente antes da implementação.

Aceite: derivadas limitadas e protegidas; ausência de consulta Drive ao ler miniatura pronta; fallback privado para fotos antigas; ampliação integral; autoria/contexto visíveis; preparo root paginado; envio repetido e falha da miniatura sem desfazer a foto. Cenários físicos permanecem separados dos testes automatizados.

## Alterações

- Migração aditiva `0020_photo_thumbnails.sql` com oito campos de derivada e índice parcial. Sem carga de dados nem remoção/renomeação de migrações anteriores.
- `server/photo-thumbnails.mjs`: validação JPEG/dimensões/tamanho, SHA do original, estados, escrita condicional/idempotente, leitura privada e manutenção root. Integração em `worker.mjs` e três rotas de fotos.
- `server/photo-labels.mjs`, `collector-v2.mjs`, `inventory-results.mjs` e galerias: legendas, autoria, data e contexto; dados publicados separados dos atuais. Consulta de fotos das ocorrências limitada aos alvos da página. Metadados não incluem BLOBs ou referências privadas de armazenamento.
- `web/photo-prepare.js`: JPEG integral até 1.600 px/3 MB e miniatura até 320 px/30 KB; limite servidor 64 KB. Bitmap com redimensionamento/orientação, fallback Image/canvas, liberação de recursos, HEIC local sob demanda com biblioteca fixa e licença.
- `collector-v3.js`, `collector-photo-viewer.js` e CSS: envio após original `ready`, falha isolada da derivada, miniaturas clicáveis, data, imagem integral no visualizador. Sem novo botão de envio ou mudança de questionário.
- `desktop.js`, `desktop-progress-photos.js`, `desktop-results.js`, `desktop-equipment.js`, `photo-viewer.js`: listas pedem `size=thumb`, dimensões reservadas, lazy/async; visualizadores pedem integral e mostram contexto real.
- `desktop-thumbnails.js`: Configurações → Miniaturas de fotografias, somente root; até 20 fotos por lote, progresso, continuidade e nova tentativa. SHA do arquivo baixado conferido antes de derivar. Preserva arquivos, estado e revisão da visita.
- Builds e whitelist do coletor incluem os módulos novos. HEIC não é carregado durante a navegação comum. CI ganha o 11º roteiro de navegador. Dicionário/esquema e transferência atualizados.

## Resultados locais

**139 testes de domínio/API e 11 roteiros de navegador aprovados**. Builds: 81 entradas declaradas desktop e 52 arquivos coletor; dry-runs dos dois Workers aprovados. Schema: 20 migrações, 64 tabelas, 43 índices, uma view, dez triggers; integridade OK e zero erros de FK. Testes usam SQLite em memória, Worker real e Drive simulado; não fingem respostas de sucesso no sistema publicado.

Roteiros: V3, UX, identidade coletor, identidade painel, catálogo, consulta equipamentos, monitoramento, demandas, navegação painel, desempenho Fase 1 e miniaturas Fase 2. A adaptação do teste antigo reconhece que a URL de miniatura sem derivada pode buscar o original uma vez e o visualizador integral tem URL distinta; revalidação continua protegida.

| Medição controlada | Resultado |
|---|---|
| Miniatura pronta, três rotas | 2 consultas de domínio e 0 requisições Drive; mais 1 consulta de sessão no Worker |
| Foto antiga sem miniatura | Original privado continua disponível; 1 download Drive |
| `If-None-Match` da miniatura | 304 sem corpo, após validar acesso; hash diferente do integral |
| 50 miniaturas da amostra | 441.137 bytes (~431 KiB), abaixo de 1,5 MB |
| 50 originais equivalentes da amostra | ~5,06 MB; redução de transferência de aproximadamente 91% |
| Rede 4G simulada (40 ms, 4 Mbps) | ~1,38 s para 50 miniaturas, 6 conexões concorrentes |
| Fast 3G simulada (150 ms, 1,6 Mbps) | ~3,13 s para as mesmas 50 |
| Foto sintética 12 MP | JPEG de 101.238 bytes/1.600 × 1.200; miniatura de 8.836 bytes |
| Preparo 12 MP, dois caminhos juntos | ~2,43 s para executar caminho nativo e fallback; não mede câmera física |
| HEIC de referência libheif, primeiro uso | 1.280 × 854, miniatura 21.373 bytes; ~3,20 s incluindo carregamento/decodificação |

Os tempos são um ensaio controlado, **não p50/p95 em produção nem garantia em 4G real**. A meta de preparo de foto em menos de um segundo em celular não foi homologada. Fonte do HEIC local: `strukturag/libheif`, tag v1.23.7, `examples/example.heic`, mantida somente em `private-data/`. O teste de CI não depende de download externo; executa HEIC adicional quando a amostra local está disponível.

Regressões cobertas: 401/403/CSRF, perfil e autoria, integração revogada/provedor alterado, unidade inativa, visita concluída, foto pending/inexistente, SHA divergente, JPEG inválido/maior que 320, 64 KB, idempotência, paginação 20+5, legenda publicada sem dados do rascunho, manutenção sem mudar revisão, falha isolada da derivada e retomada pelo root. Os sete envios do roteiro V3 continuam funcionando.

## Evidências visuais

Capturas reais da implementação local, confrontadas com D-061/D-062/D-065, em `docs/05-qualidade/evidencias/miniaturas-fase2-2026-11-09/` (fora do Git público):

- `01-root-fotos-antigas.png`: ação root e resultado.
- `02-coletor-miniaturas.png`: fotos recebidas, câmera/galeria e data.
- `03-coletor-foto-completa.png`: ampliação no celular emulado.
- `04-painel-50-miniaturas.png`: galeria parcial paginada.
- `05-painel-foto-completa.png`: integral com unidade/data/autor.
- `resultado.json`: requests, bytes e tempos do ensaio.

Identidade clara, vermelho/laranja, cartões e navegação preservados. A data da miniatura foi ajustada após inspeção para não sobrepor o selo “Nesta visita”.

## Base de Coleta: coberto e restante

§§5.3–5.5: preparo das fotos, câmera/galeria já existentes, evidências vinculadas, miniaturas, ampliação e identificação. §5.6: exceção D-072 só para derivadas pequenas; original continua privado. §§7.5–7.6 e 7.11: confirmação do servidor distinta de conclusão/publicação, permissões antes da entrega da imagem, falhas sem sucesso fictício. Limite e obrigatoriedade das fotos permanecem iguais.

Faltam homologação física Android Chrome/iPhone Safari (câmera, HEIC, orientação e baixa memória), tempos de campo, demais itens da auditoria Fases 3–5 e offline durável. O critério “salvar e enviar duas fotos sem GET inspection” pertence à Fase 4: esta fase ainda preserva a recarga da vistoria após upload. Não substitui homologação de EXE/agente, rede real ou recuperação completa de produção.

## Publicação e retorno

Preparação local concluída; a publicação, versões e conferência do ambiente real serão registradas em adendo específico. Retorno de código é compatível: colunas novas podem permanecer inertes e os clientes anteriores leem o integral. Nenhuma migração destrutiva é necessária para retornar.

Contrato e operação detalhados: [MINIATURAS_D072.md](../04-dados-apis/MINIATURAS_D072.md).
