# Coleta Escolar — Guia visual para recriação idêntica

App mobile-first (largura de referência 390px, máximo 430px centralizado). Textos em português brasileiro.
As capturas em `telas/` estão em 2x (780×1688). Recrie exatamente essa aparência.

## Cores (oklch → hex aproximado)
| Papel | oklch | Hex |
|---|---|---|
| Fundo da página | 0.975 0.004 200 | #F3F6F7 |
| Superfície (cards, cabeçalho, rodapé) | 1 0 0 | #FFFFFF |
| Texto principal | 0.22 0.02 220 | #1A2328 |
| Texto secundário | 0.5 0.015 220 | #5F6B71 |
| Primária (petróleo) | 0.48 0.1 195 | #00706F |
| Primária suave (fundo de ícones / selecionado) | 0.95 0.03 195 | #DDF3F2 |
| Borda | 0.91 0.006 200 | #E2E7E9 |
| Borda de campo | 0.88 0.008 200 | #D6DDE0 |
| Sucesso / fundo | 0.55 0.13 150 / 0.95 0.04 150 | #2E8B57 / #E2F5E8 |
| Aviso / fundo | 0.6 0.13 70 / 0.96 0.05 85 | #A8741A / #FBF0D5 |
| Erro | 0.56 0.2 27 | #D0342C |

## Tipografia
- Fonte: **Figtree** (Google Fonts), pesos 400/500/600/700.
- Título de tela (cabeçalho): 18px bold. Nome da escola abaixo: 12px, cinza.
- Pergunta do wizard: 24px bold, entrelinha justa.
- Rótulo de campo: 14px semibold cinza, asterisco vermelho se obrigatório.
- Texto de opção/campo: 16–17px.

## Formas e medidas
- Raio base 16px. Cards de categoria 28px; opções e campos 16px; botão FAB circular 64px.
- Área mínima de toque 48×48. Botões principais altura 52px. Opções de escolha altura mínima 56px.
- Sombras quase nulas (1px suave). Apenas o FAB tem sombra petróleo difusa.
- Padding lateral das telas: 16–20px. Espaço entre opções: 10px.

## Componentes
- **Cabeçalho fixo** branco, borda inferior, seta voltar (48px) à esquerda, título + escola, à direita "✓ Salvo" (ou selo "Offline" amarelo) e ação contextual.
- **Barra de progresso**: "Etapa X de Y" (12px) + segmentos de 4px, preenchidos em petróleo.
- **Card de categoria** (grade 2 colunas, gap 12px, altura ≥144px): ícone Lucide em quadrado 48px fundo primária suave, chevron no canto, nome bold 16px, selo de status (cinza "Não iniciado", amarelo "Em andamento", verde "N cadastrados/Preenchido").
- **Opção de escolha única**: botão largo, borda 2px; selecionada = borda petróleo + fundo primária suave + círculo cheio com check.
- **Campo de lista**: botão "Toque para escolher" com chevron; abre **bottom sheet** com alça, título, busca "Pesquisar ou adicionar" e opções de 56px; item escolhido destacado; "+ Adicionar “texto”" tracejado.
- **Foto**: área 4:3 tracejada petróleo com ícone câmera e "Fotografar"; botão secundário "Escolher da galeria"; depois mostra prévia com "Refazer" e "Usar foto".
- **Rodapé fixo** branco: [← Voltar] (secundário) + [Próximo →] (primário). Na última etapa: "+ Salvar e adicionar outro" (primário, largura total) e "Salvar e voltar às categorias".
- **FAB** "+" petróleo no canto inferior direito; abre pílulas brancas empilhadas (ícone + texto) com fundo escurecido.
- **Diálogo central** só para confirmações (trocar escola, descartar).
- Avisos tipo toast no topo ("Computador salvo", "Verifique os campos destacados").

## Fluxo das telas (ver `telas/`)
01 seleção de escola → 02 categorias → 03 menu do FAB → 04–05 wizard escolha única → 06 bottom sheet → 07 erro de obrigatório → 08 campo condicional "Outro" → 09–10 foto e confirmação → 11 salvo, novo formulário vazio → 12 lista de escolas.

## Código de referência
`codigo-referencia/` contém o CSS de tokens (`styles.css`, Tailwind v4) e os componentes React usados nas telas (ícones: lucide-react; bottom sheet: vaul).
