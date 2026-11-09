# 04 · Ícones e forma de exibição

Pedido: "ícones que não funcionam". A revisão separou três situações: (A) ícones que aparecem errados ou não aparecem; (B) ícones/botões que o usuário toca e nada útil acontece; (C) problemas de exibição ligados às fotografias e galerias. Cada item indica se é defeito ou decisão a confirmar.

## A. Ícones que aparecem errados ou não aparecem

### ICO-01 · Nome de ícone inexistente vira "monitor" silenciosamente (defeito latente)
`web/desktop-icons.js:33`: `paths[name]||paths.monitor`. Qualquer erro de digitação ou nome novo desenha um monitor sem aviso — por exemplo `app.js:25,27,43` chama `icon('arrow')` e `icon('save')`, inexistentes (o arquivo não entra nos builds, mas o padrão se repete a cada tela nova). Correção em ERR-13: fallback neutro + teste automatizado dos nomes usados em `web/*.js` publicados contra o mapa `paths`.

### ICO-02 · Símbolos dos assuntos no coletor são renderizados e depois escondidos por CSS (confirmar)
`web/collector-v3.js:19,41,43,51` inserem `<span class="simbolo tile-…">` (D-061) antes do título de cada etapa; `web/collector-v3.css:17` esconde `.content>.simbolo` em todas as telas exceto `cards` e `review`, e a linha 18 esconde também o `h2`. É a compactação D-062 — o cabeçalho já mostra o título — mas o símbolo colorido que identifica o assunto (laranja/preto/vermelho/grafite/pêssego) deixou de existir nas telas de preenchimento, enquanto o código continua gerando o HTML. **DECISÃO:** (a) manter oculto e remover a geração do HTML (evita DOM inútil), ou (b) mover o símbolo para dentro do cabeçalho ao lado do título (16–20 px), preservando a identidade sem gastar altura.

### ICO-03 · Mesmo desenho para "Computadores" e "TVs" na matriz
`web/desktop-data.js` (`categories`): `['TVs','TVs','monitor']` usa o mesmo glifo de `Computadores`. Acrescentar `tv` em `desktop-icons.js` (tela com base) e usar nas duas tabelas.

### ICO-04 · Menu lateral usa o ícone de "sliders" como hambúrguer
`web/panel-shell.js` (`menu-toggle` → `icon('sliders')`); o mesmo glifo aparece em "Filtros avançados" e em "Planejamento". Em telas estreitas o usuário vê o mesmo símbolo com três funções. Acrescentar `menu` (três linhas) ao mapa de ícones.

### ICO-05 · Ícones de categoria do coletor dependem de `tile-*` definidos só em `collector.css`
`collector-v3.html` carrega `tokens.css`, `collector.css` e `collector-v3.css`; as classes `tile-laranja|preto|vermelho|grafite|pessego` existem em `collector.css`. Está correto hoje, mas `collector-v3.css` sobrepõe tamanhos (`.category-icon{width:36px}`) sem redefinir o `.ico` interno; conferir visualmente que o glifo não fica cortado em 36 px com `stroke-width:2.2` (o `.simbolo .ico` usa 36 px em tile de 64 px). Se cortar, `.category-icon .ico{width:20px;height:20px}`.

### ICO-06 · Dois temas completos carregados no painel
`web/index.html` carrega `desktop.css` (dark-tech, 32 KB) e depois `desktop-theme.css` (identidade D-065, 18 KB) que o sobrescreve, mais `panel-refinement.css` e `panorama-layout.css`. Ícones e cores dependem da ordem de cascata (`.ico` definido em `desktop.css:1`, cor via `color:var(--accent)` em regras antigas como `.environment-tile .ico`). Qualquer regra nova em `desktop.css` pode reaparecer na identidade atual. Ver MEL-09 (consolidar em um tema).

## B. Ícones e botões que não fazem o esperado

| # | Onde | O que acontece ao tocar | Situação | Correção |
|---|---|---|---|---|
| ICO-07 | Painel, cabeçalho, sino (`panel-shell.js`, `desktop.js:207`) | diálogo "serviço de notificações ainda não está integrado" | tela de espera | ocultar ou marcar "em breve" (LNA-16) |
| ICO-08 | Painel, "Exportar matriz" (`desktop.js:99,206`) | vai para Exportar dados, onde a matriz não existe | lógica não ligada | chamar `exportCsv()` (LNA-08) |
| ICO-09 | Painel, célula da matriz (`desktop.js:184`) | abre todos os bens, não a categoria | defeito | ERR-08 |
| ICO-10 | Painel, "Filtros avançados" (`desktop.js:180`) | diálogo repete Regional/Situação; sem Tipo/Ano | incompleto | LNA-09 |
| ICO-11 | Painel, mapa, botão de exemplos | botão não existe; marcadores de exemplo sempre ligados | não renderizado | ERR-19 |
| ICO-12 | Painel, "Ver todas" da galeria com mais de 50 fotos | mostra só 50 | limite | ERR-18 |
| ICO-13 | Painel, "Alertas e Insights → Ver todos" (`desktop.js:201`) | navega para Ocorrências (ok), mas `alert-detail` (`:202`) só exibe toast "Nenhum alerta recebido" | resquício | remover `alert-detail`/`environment-detail` |
| ICO-14 | Painel, Relatórios / Planejamento (menu) | telas de espera | decisão | LNA-16 |
| ICO-15 | Painel, Ocorrências, miniatura da evidência (`desktop-results.js:11`) | abre a URL crua `/api/collector/photo?id=…` em nova aba (imagem solta, sem contexto) | exibição | abrir `openPhotoViewer` (ERR-02) |
| ICO-16 | Coletor, qualquer botão durante "Salvando…"/"Enviando foto…" (`collector-v3.js:154`) | toque ignorado sem aviso; só o botão clicado antes fica cinza | defeito de feedback | ERR-10 |
| ICO-17 | Coletor, "Corrigir" na revisão para fotos/rascunhos/agente (`collector-v3.js:186`) | abre o assunto G ou nada | incompleto | LNA-03 |
| ICO-18 | Coletor, "Fechar teclado" (`collector-v3.js:25`, `collector-v3.css:9-11`) | só aparece com foco em campo de texto em tela touch (`is-typing`); em alguns Android o `focusout` dispara antes do clique e o botão some sem fechar | verificar em aparelho | já há `pointerdown→preventDefault` (`collector-ui.js:74`); testar Chrome Android real |
| ICO-19 | Coletor, "Câmera" (`collector-v3.js:40`, `capture="environment"`) | em alguns navegadores Android o `capture` abre a câmera sem opção de galeria — correto; no iOS abre a câmera; HEIC da galeria falha | ERR-09 | ERR-09 |
| ICO-20 | Coletor, "Trocar unidade" com prévias pendentes (`collector-v3.js:188`) | erro "Envie ou remova as prévias" — correto, mas o botão não indica que há prévias | exibição | badge com contagem de prévias no botão/cabeçalho |

## C. Exibição das fotografias e galerias

### ICO-21 · Miniaturas sem dimensões reservadas (salto de layout)
`collector-v3.js:40` e `desktop.js:73,76` criam `<img>` sem `width/height`; no coletor o CSS tem `aspect-ratio:4/3` (`collector.css:230`), no painel `.panorama-gallery .gallery-thumb img{height:108px}` — ao carregar imagens integrais a tela "pula" e, com `no-store`, pisca a cada render. Com miniaturas de dimensões conhecidas (FOTO-02) incluir `width`/`height` e um fundo cinza (`--cinza-claro`) enquanto carrega.

### ICO-22 · Evidência da Última Coleta ocupa até 640 px de altura com a imagem inteira
`panorama-layout.css` (`.panorama-evidence>.gallery-thumb img{max-height:640px;object-fit:contain}`): a imagem integral é pedida e exibida grande no panorama, acima da dobra em notebooks 768 px de altura. Proposta: altura máxima 320 px, fachada mais recente (ERR-07), legenda "Fachada · dd/mm/aaaa · operador".

### ICO-23 · Legendas das miniaturas não identificam o alvo
Coletor: "Nesta visita"/"Histórico preservado" apenas (`collector-v3.js:40`). Painel oficial: `alt` genérico ("Fotografia de equipamento/infraestrutura") e viewer sem ambiente/posição (`photo-viewer.js:19` mostra "Vínculo: Equipamento" e o UUID). Galeria parcial já mostra ambiente/patrimônio (`desktop-progress-photos.js:5`). Proposta: a rota de lista devolve `label` resolvido no servidor (ambiente → nome; equipamento → categoria + ambiente + posição; ocorrência → categoria H; fachada → "Fachada") e todas as galerias usam o mesmo `label`.

### ICO-24 · CSS da galeria oficial (`desktop-photos.css`) injetado por JS e com classes órfãs
`photo-viewer.js:8` injeta `<link href="/desktop-photos.css">` em tempo de execução (atraso perceptível no primeiro `openPhotoViewer`: diálogo sem estilo por alguns ms); o arquivo mantém classes da página `/fotografias` removida por D-065 (`.photo-gallery`, `.photo-filters`, `.photo-pagination`, `.photo-card*`, `.photo-page-heading`, `.photo-summary`). Mover o CSS do viewer para `desktop-theme.css` (ou linkar no `index.html`) e apagar as classes da página retirada; `desktop-progress-photos.js:6` idem.

### ICO-25 · `school-photo` com placeholder fixo e tamanho de 230×160
`desktop.css` (`.school-photo{height:160px;width:230px}`) e `desktop.js:102` (`photo(4)` → sempre "Sem fotografias de vistorias concluídas"). Ver ERR-07.

### ICO-26 · Ocorrências: imagens em linha com `style` embutido
`desktop-results.js:11` (`<img style="max-width:120px;max-height:100px">`), fora do sistema de classes e sem `loading="lazy"`; a cada 15 s são recriadas (ERR-02). Usar a mesma classe de miniatura do panorama.

### ICO-27 · Fotos de prévia e fotos enviadas misturadas no mesmo grid
`collector-v3.js:40`: prévias (`blob:`) e enviadas ficam na mesma fileira, diferenciadas só pelo texto do botão. Proposta: borda tracejada laranja para prévia + rótulo "NÃO ENVIADA", e, após envio, transição para borda sólida sem recarregar a imagem (FOTO-06).
