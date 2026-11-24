# D131 — refino visual do filtro

24/11/2026. Responsável rejeitou a faixa do filtro e pediu botão mais discreto, como **Tipos de unidade**. Ajuste da funcionalidade D131 já autorizada e publicada: mesmo critério, agora num controle recolhível ao lado da legenda. [Contrato](../03-painel-desktop/FILTRO_AGENTE_INTERNET_D131.md), [publicação inicial](FILTRO_AGENTE_D131_2026-11-24.md).

## Mudança e aceite

`web/map-agent-filter.js` cria details/summary e checkbox nativos, acessíveis por teclado. `web/painel.css` compartilha fonte, borda, fundo e dimensão da legenda, remove largura forçada e linha extra da barra de mapas. Estado ativo indicado por ponto laranja de 6 px e nome acessível; contagem/avisos dentro do controle. Falha durante filtro ativo também informa indisponibilidade no título recolhido. Abrir um dos dois controles recolhe o outro; fechar não limpa o filtro.

Referências consultadas: entrada, AGENTS/governança, D131, D130 e estilos atuais D065/D080/D087; capturas desktop aprovadas e especificações já consultadas na implementação. Critérios: controle compacto, regra inalterada, teclado, mapa normal/ampliado, rota e 390 px sem sobreposição indevida. Servidor, SQL, intervalos, permissões, GPS, alertas, coletor e APK não mudam.

## Testes executados neste refino

- Três testes direcionados D131 aprovados (capacidade suficiente offline, validação de leitura e vínculos/SQL).
- `map-agent-filter-browser.cjs`: aprovado, atualizado para checkbox/recolhimento; largura inferior a 170 px e altura inferior a 36 px no resumo, teclado, filtro independente, capacidade offline, busca, rascunho preservado, falha/recuperação e 390 px. Sem requisição de frota extra ao filtrar e zero demandas de teste oficiais.
- `map-route-planner-browser.cjs`: aprovado.
- `map-demands-browser.cjs`: aprovado, inclusive alertas, anéis, legenda e falha de leitura.
- `panorama-map-browser.cjs`: aprovado, incluindo ampliação, roda, Escape, sobreposições e telas móveis.
- Build desktop aprovado. Suíte completa de 381 testes pertence à publicação inicial D131; não foi repetida para este ajuste restrito de apresentação.

Capturas sintéticas abertas para inspeção:

- [Controle recolhido](evidencias/filtro-agente-compacto-d131-2026-11-24/01-mapa-filtrado.png).
- [Opção aberta](evidencias/filtro-agente-compacto-d131-2026-11-24/04-opcao-aberta.png).
- [Durante criação de rota](evidencias/filtro-agente-compacto-d131-2026-11-24/02-rota-sobre-filtro.png).
- [390 px](evidencias/filtro-agente-compacto-d131-2026-11-24/03-390.png).
- [Resultado](evidencias/filtro-agente-compacto-d131-2026-11-24/resultado.json).

## Publicação

Ajuste do filtro D131 publicado em **24/11/2026 às 14:27:54 Fortaleza** (`2026-11-24T17:27:54.834Z`), painel `6c6c3da2-b60e-4ff9-b731-239a73eb7078`, 100% do tráfego, commit funcional `30bdb9a`. A autorização explícita de publicar o filtro permanece aplicável a esse refino pedido em seguida; não há funcionalidade ou recurso externo novo.

**62 verificações HTTP aprovadas**: 51 de páginas/assets/autenticação e 11 do aplicativo. APK 1.0.4 com mesmo hash e arquivos do técnico idênticos ao build. Nenhuma migração, publicação do coletor independente ou alteração de dados oficiais. Rollback visual possível para D131 inicial `de6b5594-a28f-4aeb-a438-e94c5fa4dbb1`, sem banco.

Ao recarregar o Panorama para conferência, a sessão expirou e foi solicitado novo login root. Logs em `private-data/d131/deploy-compacto.txt`, `deployments-compact-after.txt` e `compact-technical-release/`, fora do Git.

Após o responsável confirmar novo login root, a conferência real foi concluída em 24/11/2026. Controle inicialmente recolhido ao lado de Tipos de unidade; abriu a opção Sem agente 0.1.9 (45). Ativação reduziu 77 marcadores para 45; recolher manteve checkbox marcado, ponto laranja e os 45 marcadores. Ampliação preservou filtro e apresentação compacta. Camada de técnico/rota permaneceu visível; nenhuma demanda, cadastro ou atribuição alterada. Mapa deixado ampliado, filtro ativo e controle recolhido. Captura privada: `private-data/d131/panorama-controle-compacto-producao.jpg`, fora do Git. Não há pendência de conferência visual deste refino.
