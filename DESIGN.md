# Identidade e composição do painel SEMED

Referência vigente: D-080, entrega “Mesa de dados” e login de 10/11/2026, sobre a identidade D-061/D-065. Este guia descreve a implementação; decisões funcionais continuam em `docs/00-governanca/DECISOES.md`.

- Paleta e fontes compartilhadas em `web/tokens.css`: branco, preto/grafite, vermelho, laranja e pêssego; Barlow para leitura e Chakra Petch para títulos/rótulos. Cor de status não substitui texto.
- Painel: `web/painel.css` é a folha principal, após tokens e Leaflet. Não reintroduzir as 13 folhas antigas no build nem injetá-las por JavaScript. Elas permanecem no repositório como histórico.
- Menu lateral: 64 px recolhido, 232 px aberto por mouse, foco de teclado ou fixação. Fixação reserva espaço no conteúdo. Em telas abaixo de 900 px, botão de menu e Escape; preferência local guarda apenas apresentação.
- Cabeçalho compacto e faixa de situação da rede. Atalho `/` foca a busca apenas quando visível, fora de campos e diálogos. Nomes acessíveis e foco visível obrigatórios.
- Controles compactos no desktop; alvos de toque ampliados em dispositivos com ponteiro impreciso. Responsividade não significa transformar o painel em coletor.
- Panorama mantém a composição D-067, mapa real, filtros, matriz e blocos recebidos. D-066: contar tipos separadamente. Nenhum número das capturas é dado oficial.
- Vínculo D-079: etiqueta preta para Agente vinculado, pêssego para Cadastro manual, estados próprios para pendente/encerrado/desconhecido. Comunicação é informação separada. Não apagar ou fundir registros por aparência semelhante.
- Login independente em `web/login.css`, sem depender do CSS do painel. Paisagem e logo institucional existentes, formulário branco, rótulos explícitos, senha revelável, erro/sucesso/espera e ajuda administrativa. Respeitar movimento reduzido.
- Fotografias permanecem contextuais: fichas, ambientes, coletas e visor autenticado. Não criar seção Fotografias nem modificar o vínculo da imagem para acomodar o desenho.

Validação: `tests/panel-mesa-browser.cjs`, regressões desktop e capturas reais em `docs/05-qualidade/evidencias/mesa-dados-2026-11-10/`. As capturas usam dados de teste em SQLite isolado.
