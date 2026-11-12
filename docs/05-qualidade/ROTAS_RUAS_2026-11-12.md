# Rotas pelas ruas — D-106 — 12/11/2026

## Escopo e fontes

Lidos: `00_LEIA_ANTES_DE_TUDO.md`, `AGENTS.md`, `REGRAS_DE_PRECEDENCIA.md`, `DECISOES.md`, `PENDENCIAS.md`, `CONFLITOS_DOCUMENTAIS.md`, `ROTEIRO_TECNICO_D105.md`, registro de entrega D105, guias de publicação/rollback e backup, manifesto/status dos diagramas. Referências visuais desktop já examinadas nesta sequência de trabalho; mapa/identidade preservados, conforme D065/D080/D087/D094. Política e API oficiais do OSRM verificadas em 12/11.

## Evidências executadas

- 238 testes completos de servidor aprovados (incluem oito D106 e sete D105).
- D106 cobre origem GPS/ordem exata mesmo com aceite fora de ordem; cache compartilhado; reordenação/coordenadas; gate durável; resposta atrasada após conclusão ou reordenação; falha/429/NoRoute/geometria inválida; parada sem coordenadas; perfil/coletor; posição expirada; deslocamento; expiração/cache; logout.
- Navegador D106: geometria de 24 pontos de rota pública real, Panorama ampliado, mensagem de coordenadas ausentes, indisponibilidade sem linha reta e conclusão retirando o percurso. Fixture geográfica registrada; demandas/usuários/posições sintéticos isolados.
- Regressão D105 navegada: arrastar/recarregar, dois técnicos, bloqueio sem GPS, aceite simulado, tela exclusiva, Maps externo, root/mapa e conclusão com remoção de posição. Sem erros de JavaScript.
- Regressões `map-demands-browser.cjs` e `panorama-map-browser.cjs` aprovadas: cores/anéis, clique/hover/demandas, sobreposições, redução de movimento, fullscreen/volta/Escape/filtros e mobile.
- Builds desktop e coletor aprovados; dry-run painel aprovado. Coletor construído somente para verificar compatibilidade, não publicado.
- Provedor real, dois pontos públicos em Paço do Lumiar: HTTP 200, código Ok, 24 pontos, 1.183,5 m, 1.177 ms nesta consulta. Não é promessa de tempo futuro; não foram enviados nomes ou localização de usuário nesse ensaio.

Capturas locais: `evidencias/rotas-ruas-2026-11-12/01-trajeto-ruas-local.png`, `02-coordenada-ausente.png`, `03-falha-provedor.png`. Rótulo de teste explícito. A geometria vem de resposta pública salva em `tests/fixtures/public-road-paco-d106.json`; os demais testes usam provedor simulado isolado para induzir falhas/races.

## Produção

Preparação inicial concluída; autorização do provedor e publicação realizadas conforme resultado abaixo. Versão anterior painel: `2013b4f8-9440-4279-946e-6e80fb3068a1`; coletor a preservar: `2dac8571-2671-4eec-8ab0-7492753a0255`. Migração 0028 aditiva, sem seeds, contas ou demandas de teste oficiais.

## Limites

GPS depende do aparelho/rede. Rota usa aproximação à via (até 500 m), não comprova deslocamento real nem entrada exata do prédio. Sem trânsito em tempo real. Serviço comunitário com disponibilidade variável; falha não gera rota inventada. Mais de 99 paradas ou unidade sem coordenadas exigem ajuste explícito do roteiro/cadastro. O APK existente é preservado; testes Android físicos de segundo plano continuam separados.


Preparação remota: backup D1 privado verificado por reimportação SQLite em memória, integridade ok e zero violações FK. SHA256 764a73476fde56e2003dc9bed7e7812a6e25f21e712a664afad30e7dc77332fc. 19 demandas, 15 usuários, 76 unidades. Migração 0028 ensaiada sobre essa cópia com integridade preservada. Nenhuma mudança em registros oficiais nesse ensaio. Lista remota confirmou apenas 0028 pendente.


## Resultado real confirmado — 12/11/2026

- Responsável confirmou explicitamente o uso do OSRM/FOSSGIS e envio das coordenadas, ciente dos logs do provedor.
- Migração 0028 aplicada no D1 oficial: sete comandos, 1,66 ms informados pelo D1. Lista posterior sem migrações pendentes. Sem seeds ou alterações de demandas/atribuições para testar.
- Painel publicado em **2240f2ce-9eaa-4852-8f01-9902909a1997**, 100% do tráfego, **10:21:12 Fortaleza / 13:21:12 UTC**. Minuto e cron diário preservados.
- Coletor preservado em **2dac8571-2671-4eec-8ab0-7492753a0255**. APK permanece com SHA256 **6fdabb65acba9f530d407a8da1d03df35f4432a4a5df84e168d1b99bac59fd11**, verificado por download HTTPS; não exige reinstalação.
- 51 verificações públicas do painel + 10 do módulo técnico aprovadas. Endpoint novo /api/dispatch/road-route sem sessão retorna 401. Não foram extraídos tokens/cookies nem usadas credenciais de teste na produção.
- Leitura após publicação: 19 demandas, 15 usuários, 76 unidades; nenhuma rota em cache naquele instante.
- Responsável renovou a sessão root. Painel autenticado e mapa ampliado conferidos: controle de técnicos, atribuição OSRM/OSM, link Corrigir mapa, marcadores e anéis presentes. Exibia **zero técnicos com posição recente**; portanto nenhum tracejado foi fabricado.
- A conferência real confirmou carregamento, autenticação, estado sem GPS e versão publicada. O trajeto com GPS real ficará visível quando um técnico aceitar/retomar atendimento e enviar posição. O cálculo pelas ruas foi verificado nos ensaios locais e com a consulta pública real já descrita; não declarar uma rota de técnico real observada nesta conferência.

Fonte da implementação: commit 01e68e8. Documentação de ativação registrada em commit posterior. Retorno disponível para versão 2013b4f8-9440-4279-946e-6e80fb3068a1 sem apagar tabelas ou restaurar dados por cima da operação atual.
