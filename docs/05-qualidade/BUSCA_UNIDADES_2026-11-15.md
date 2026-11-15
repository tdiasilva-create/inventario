# Busca de unidades no cabeçalho e mapa ampliado — 15/11/2026

## Estado

Publicado em 15/11/2026 às 11:42:38 Fortaleza, versão final `582b5ec9-993b-45fe-87b6-d88d9f516440`, 100% do tráfego. Responsável confirmou “Localizar no mapa e manter a tela atual” e autorizou “Sim, publicar no ambiente real”. Sem migração, alterações em cadastros reais ou instalação de APK/agente. Conferência autenticada FINAL aprovada após renovação do login root; nenhuma pendência de publicação ou inspeção visual desta entrega.

## Fontes e requisitos

Consultados: `00_LEIA_ANTES_DE_TUDO.md`, precedência, decisões, pendências e conflitos; referências desktop 00–04 abertas na ordem do manifesto; identidade D065/D080, `BUSCA_GLOBAL.md`, telas/interações, especificação da interface e aceite `PANORAMA_MAPA_2026-11-10.md`. O pedido atual supera a busca por equipamentos do cabeçalho D084. Banco gratuito, presença, localização e alertas preservados.

## Testes realizados

- Build desktop aprovado, bundles/CSS versionados, módulo novo incluído nas cópias e bundles.
- 30 testes Node distintos aprovados (busca legada, autenticação, segurança, desempenho D103/D104 e revalidação D110).
- `panel-unit-search-browser.cjs`: Worker real com SQLite isolado e dados DEMONSTRAÇÃO. Busca incremental sem Enter, nome sem acentos, seleção exata por ID, teclado, ausência de unidade inativa/equipamento, Limpar, campo único preservado ao ampliar/retornar, atalho `/`, dois níveis de Escape, ausência de coordenadas, seleção sem sair do mapa, falha/repetição e resposta atrasada. Páginas independentes abrem a ficha exata.
- Medição de requisições: toda a sequência de buscas do Panorama reutilizou UMA leitura inicial de `/api/units`, com ZERO chamadas de `/api/inventory/search`. Sem consulta por tecla ou timer adicional. Em página independente, falha simulada exigiu uma segunda tentativa explícita; digitação durante essa tentativa reaproveitou a mesma requisição.
- `panorama-map-browser.cjs`: expansão, zoom pela roda, restauração da câmera, Escape, atualização sem reconstruir mapa, sobreposição de unidades e mapa independente aprovados.
- `panel-search-browser.cjs`: regressão da consulta legada por URL, paginação, histórico, fotos, fichas parciais, permissões e erro recuperável aprovada. O teste foi atualizado para abrir a URL legada diretamente, pois o cabeçalho já não pesquisa equipamentos.
- Viewports 1672×1050, 390×844 e 812×375. Campo e opções visíveis/clicáveis, sem transbordamento horizontal. Capturas revisadas; removido o X nativo duplicado, mantendo um único botão Limpar acessível. Não equivale a homologação de aparelho físico.

## Evidências

Capturas locais da implementação real com dados sintéticos: `docs/05-qualidade/evidencias/busca-unidades-2026-11-15/01-sugestoes-panorama.png`, `02-busca-mapa-ampliado.png`, `03-ampliado-390.png`, `03-ampliado-812.png` e `resultado.json`. Não apresentam dados oficiais nem provam publicação.

## Conferência após publicação

1. Recarregar `/panorama` como root/admin/visualizador e digitar parte do nome de uma unidade.
2. Confirmar sugestões sem Enter, nenhuma busca de equipamento e nenhum POST.
3. Selecionar a unidade, conferir nome/marcador/posição; ampliar mapa e repetir a busca.
4. Conferir Limpar, setas, Enter, Escape, Voltar ao Panorama e texto preservado.
5. Confirmar mapas/alertas/localização e consulta de fotos/fichas existentes. Não editar registros durante essa conferência.

## Publicação e conferência real

- Versão inicial publicada: `868fa418-7417-4920-8d59-d165ed5abf7e`. Na sessão root real, `alana` apresentou EMI ALANA LUDMILA sem Enter; seleção focalizou o marcador e manteve `/panorama?id=3f2293a8-6368-4269-bdd7-7b800d72baee`. Mapa ampliado manteve campo e texto. `raio` apresentou EM RAIO DE LUZ; selecionar manteve o mapa ampliado e focalizou o ID `408b92c6-3027-423b-b453-1b76b9fe7cc3`. Escape fechou sugestões e Voltar ao Panorama restaurou o campo ao cabeçalho. Nenhum cadastro editado.
- A conferência detectou que um tooltip de unidade selecionada anteriormente podia ficar aberto. `focusUnit` passou a fechar os rótulos anteriores. O roteiro de busca agora verifica uma única etiqueta após a transição do Leaflet; busca e mapa ampliado foram repetidos e passaram.
- Versão final `582b5ec9-993b-45fe-87b6-d88d9f516440` confirmada em 100% em 15/11/2026 14:42:38 UTC (11:42:38 Fortaleza). As 51 verificações HTTP passaram novamente. Reversão pré-entrega: `6bd1bc73-c1e0-49bd-89c4-bc1b00d4a42e`.
- Coletor independente permaneceu em `e1ddf5ca-3b70-4f86-9377-cd667ac7c9dc`. Nenhum comando de migração, alteração de plano, edição de sessão ou geração de APK/agente executado. GPS/alertas preservados.
- Ao recarregar a versão final, o painel retornou ao login; solicitado acesso root ao responsável para finalizar a inspeção autenticada. Não confundir essa pendência visual com publicação pendente. A captura `mapa-ampliado-publicado.jpg` documenta a primeira versão, anterior à correção do tooltip.
- Manifesto, Worker compilado, versão de reversão e verificações HTTP preservados em `private-data/busca-unidades-d122-2026-11-15/`.

## Encerramento da conferência autenticada final

Em 15/11/2026, responsável renovou o login root. Na versão final, `alana` apresentou EMI ALANA LUDMILA ao digitar; seleção manteve o Panorama e focalizou a unidade. Em tela cheia, `raio` apresentou EM RAIO DE LUZ; seleção manteve o mapa ampliado, mudou o ID selecionado e fechou o tooltip anterior após a transição do Leaflet. Apenas o rótulo de EM RAIO DE LUZ permaneceu. Escape fechou sugestões e Voltar ao Panorama devolveu o campo ao cabeçalho, preservando o texto e a visibilidade.

Captura final real: `evidencias/busca-unidades-2026-11-15/mapa-ampliado-final-publicado.jpg`. A aba foi deixada no Panorama para o responsável. Nenhum cadastro, foto, vínculo, demanda ou classificação foi alterado durante a navegação; sem nova publicação nesta conferência.
