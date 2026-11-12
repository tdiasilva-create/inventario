# Mapa sem quadro de atendimentos — 12/11/2026

Pedido direto: retirar o quadro Atendimentos técnicos, seletor e contagens do canto superior esquerdo do mapa, conforme captura enviada pelo responsável. Adendo visual à D-106; sem novos campos ou regras de coleta.

Fontes consultadas: 00_LEIA_ANTES_DE_TUDO.md, AGENTS.md, REGRAS_DE_PRECEDENCIA.md, DECISOES/PENDENCIAS/CONFLITOS, ROTEIRO_TECNICO_D105.md, ROTAS_PELAS_RUAS_D106.md e registro de testes D106. Referências desktop já examinadas nesta sequência; o pedido posterior restringe a mudança ao quadro indicado.

Implementação em web/dispatch-map.js e web/painel.css: removido o controle Leaflet, título, seletor e textos visíveis. Todos os técnicos com posição recente permanecem desenhados, com os mesmos trajetos e critérios. Estado acessível para leitor de tela sem ocupação visual; falhas por técnico disponíveis no tooltip do seu marcador. Zoom, marcadores de unidades, alertas, indicadores de escolas e atribuições cartográficas preservados. Sem migração, servidor, APK ou coletor.

Aceite: mapa comum e ampliado sem o quadro, rotas existentes preservadas, indisponibilidade sem linha reta inventada, conclusão remove posição/rota. Regressões adaptadas em dispatch-road-routing-browser.cjs e technical-dispatch-browser.cjs. Dados exclusivamente sintéticos nos testes; capturas em evidencias/mapa-limpo-2026-11-12. Capturas reais, se houver, permanecem em private-data por conter localização de técnicos.


## Resultado

Build desktop e duas regressões navegadas aprovados: rotas/erros/conclusão/fullscreen; organização por arraste, dois técnicos atribuídos, GPS obrigatório, app exclusivo e encerramento. Cenários isolados; nenhuma demanda real alterada para testar.

Publicado em 12/11/2026 às 11:05:17 Fortaleza, versão 0df4ab22-a0ed-4c16-a3a2-67ea509f8fb7, 100% do painel. Conferência autenticada real no Panorama ampliado: zero quadros, zero seletores de técnico e um trajeto real presente naquele instante. Captura privada private-data/routing-d106/mapa-sem-quadro-producao.png; referência local sintética preservada em evidencias/mapa-limpo-2026-11-12/01-trajeto-ruas-local.png. Coletor/APK e servidor de rotas preservados.
