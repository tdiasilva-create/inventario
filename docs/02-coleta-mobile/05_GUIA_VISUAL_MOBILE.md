# Guia visual do coletor

## Identidade atual — D-061, 05/11/2026

O responsável aprovou a aparência de `entrega-claude-identidade-2026-11-05.zip` para publicação real. Ela substitui a identidade anterior do coletor: superfícies brancas, ação principal preta, vermelho/laranja nos detalhes e ícones coloridos por assunto. Fontes locais Chakra Petch (títulos/rótulos), Barlow (respostas/texto) e JetBrains Mono (identificadores). Fonte visual preservada em `revisoes/identidade-claude-2026-11-05/entrega-claude-identidade-2026-11-05/`.

Implementação: `web/tokens.css`, `web/collector.css`, `web/collector-v3.css` e ícones em `collector-v3.js/schema.js`. Abertura de login com paisagem local, cantos menores, filetes laranja, estados escritos e área de toque mínima de 44px nos botões. Capturas e ajustes de integração em `docs/05-qualidade/IDENTIDADE_COLETOR_2026-11-05.md`.

Essa aprovação é visual. Continuam o questionário atual de D-057, fotos opcionais dos computadores (D-060), IDs opcionais AnyDesk/RustDesk (D-059), QR e confirmação do servidor. A descrição de “uma pergunta por tela” nos materiais anexos não reverte o formulário atual. Não alterar permissões, requisitos, estados, Drive ou dados a partir do design system. O painel mantém a identidade desktop.

## Refinamento de uso — D-062, 05/11/2026

Cabeçalho único compacto com retorno, assunto, unidade e estado. Na lista, adicionar/pesquisar precedem os equipamentos; evitar repetição do título e ícone grande. Botões mantêm área de toque mínima de 44px e campos usam fonte de pelo menos 16px. A conclusão manual tem destaque secundário. Preservar cores/fontes de D-061.

Durante digitação, recolher rodapé e oferecer Fechar teclado. Não recriar o campo ativo nas atualizações da mesma tela; preservar foco, texto e cursor. Mostrar e focar erros junto ao campo; retorno da ficha recupera a posição da lista. Capturas/testes e limite de homologação física em `../05-qualidade/UX_COLETOR_PUBLICACAO_2026-11-05.md`.

## Referência histórica inicial (superada na identidade visual)

**Imagem-mestre**: `../../design/referencias/mobile/00_coleta_mobile_APROVADA.png`.

### Linguagem visual aprovada
- **Dark-tech institucional:** fundos azul-marinho profundos, azul elétrico em ação primária, ciano luminoso discreto em contornos/ícones.
- Cartões de categoria grandes e suficientemente espaçados, podendo ter distinção cromática por assunto. Nunca transmitir estados apenas por cor.
- Tipografia sans-serif legível e organizada; títulos diretos; cabeçalho compacto contendo contexto da escola e da categoria.
- Formulários com poucos campos por etapa, controles de toque grandes, tela em retrato, sem rolagem lateral.
- Câmera integrada ao contexto do item, prévia e miniaturas, botões diretos de captura/galeria.
- Tela de confirmação simples, que distingue `item salvo` de `vistoria concluída`.

### O que **não** reproduzir literalmente
- Brasão estilizado gerado por imagem, sem arquivo oficial autorizado.
- Escolas e distâncias fictícias; filtro `mais próximas` depende de dados/geolocalização aprovada.
- Percentual geral de progresso (proibido pela Base §3.3).
- Campos de exemplo como se fossem obrigatórios, por exemplo `Marca`, que em Base §4.F.3 admite `não identificado`.
- Dashboards, KPIs, mapas e lista analítica de resultados do painel desktop.

### Estados a desenhar (não há imagem final de cada variação)
- Login/primeiro acesso; sem escolas disponíveis; cartão dependente de ambiente não cadastrado; campo não aplicável; foto impossível com justificativa; offline; item existente conferido; conflito; senha expirada; revisão final; envio ainda pendente; conclusão oficial.
- Mockups dessas variações, quando criados, devem ser nomeados `PROPOSTA` até aprovação.

### Testes de fidelidade
- Comparar capturas reais em viewport de Android e iPhone com mockup mestre.
- Verificar leitura da tela sob luz forte, teclado virtual não cobrir botões, foto com permissão negada, zoom do sistema e alvos de toque.
- Testar modos vazios e respostas negativas. Sempre preservar contraste, sem exagerar efeitos luminosos.
