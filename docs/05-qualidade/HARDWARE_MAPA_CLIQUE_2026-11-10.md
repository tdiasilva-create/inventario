# D-081 — correção da interação no mapa

Pedido posterior do responsável em 10/11/2026: o aviso deve ficar sobre a localização da unidade, com animação, abrindo o modal para escolher a providência somente ao clicar. Esta orientação supera a abertura automática e os avisos fixos da entrega inicial D-081.

## Fontes e aceite

Consultados: `00_LEIA_ANTES_DE_TUDO.md`, `AGENTS.md`, `REGRAS_DE_PRECEDENCIA.md`, decisões, pendências e conflitos; manifesto e cinco PNGs desktop originais; especificação de setores, Mesa de dados D-080 e aceite D-081. A paleta e composição atuais D-065/D-080 prevalecem sobre as cores históricas das imagens.

Arquivos alterados: `web/desktop-map.js`, `web/hardware-attention.js`, `web/desktop-notifications.js`, `web/painel.css` e dois testes de navegador. APIs, persistência, detecção de hardware, coletor, instalador e fotos preservados. Não há migração nova ou escrita de dados reais nesta correção.

- Um aviso vermelho com ícone e quantidade aparece imediatamente acima da coordenada cadastrada da unidade. O ponto pulsa discretamente; a pequena animação do aviso respeita movimento reduzido.
- Aviso é um marcador geográfico Leaflet: acompanha o ponto ao mover/ampliar o mapa. Não é um botão posicionado no canto da página. Sem coordenadas não se inventa ponto; consulta continua disponível pelo sino de notificações.
- Clique no aviso ou no ponto afetado abre **Qual providência tomar?**, com filtro da unidade selecionada, ambiente, hostname e antes/depois. Teclado Enter/Espaço também funciona.
- Nenhuma abertura por carregamento, polling ou retorno à aba. Fechar mantém a pendência e a animação. Removidos o botão flutuante global e o resumo fixo dentro do mapa.
- Aceitação e encaminhamento usam o mesmo fluxo autenticado/idempotente D-081. Demanda aberta mantém aviso âmbar estático; conclusão remove o destaque. Histórico consultável pelo sino permanece.

## Testes

- 13 testes de servidor de monitoramento/decisões aprovados, sem alterações de backend.
- Navegador: clique exclusivo, ausência de abertura após duas atualizações automáticas, filtro por unitId, ancoragem da notificação à coordenada antes/depois do zoom, teclado, redução de movimento, falha após commit sem duplicar demanda, abertura da demanda, aceitação, visualizador somente leitura e largura 390 px.
- Fluxo anterior de notificações/recuperação e atualização de hardware aprovado. Verificação adicional da navegação do painel.
- Panorama e Mapa da Rede exercitados. Capturas reais do Worker/SQLite isolado em `evidencias/hardware-mapa-clique-2026-11-10/`, incluindo `aviso-na-unidade.png`, `mapa-sinalizado.png` e `alteracao-memoria.png`. Dados sintéticos somente no teste, nunca na produção.
- Build desktop: 76 arquivos. Não muda a frequência dos inventários do agente nem promete detecção física imediata.

## Publicação

Publicado o código **03998bf** em **10/11/2026 às 12:33 de Fortaleza (15:33 UTC)**. Painel ativo em **100%: `11b7d61a-d04d-4fad-9f95-0cd0378364e8`**; anterior `1d055717-b1d6-42d1-a887-846fb78b6b28`. Coletor preservado em `274ecd9b-002e-4f79-a4b9-325fc26fece1`.

Build/dry-run aprovados, scanner de 563 arquivos e links documentais aprovados. Seis verificações HTTP externas: login 200, páginas/mapa/JS privado redirecionam para autenticação, APIs recusam acesso anônimo com 401. Testes autenticados foram realizados no Worker/SQLite isolado, não houve decisão ou demanda criada em produção. Sem mudanças de backend, banco, crons ou segredos. Logs em `private-data/release-hardware-map-click-2026-11-10/`, fora do Git.

Autorização contínua da sessão para corrigir o painel real. Retorno somente do Worker; não restaurar banco ou remover decisões. Usuários com página antiga aberta precisam recarregar para receber os novos scripts.

https://painel-semed-paco.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev/panorama
