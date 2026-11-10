# Cores das categorias no mapa — D-087

## Decisão e escopo

Responsável aprovou cores próprias para as sete categorias, ajustando a proposta: escola militar vermelha, Núcleo Educa Paço laranja e unidade administrativa amarela. Aplicação no painel real no contexto da autorização contínua da sessão. A classificação usa o tipo cadastrado, nunca o nome da unidade, contagem de bens ou comunicação dos agentes.

| Tipo | Cor |
| --- | --- |
| Escola municipal | Roxo `#7523C9` |
| Escola municipal militar | Vermelho `#DC2626` |
| Creche municipal | Rosa `#DB2777` |
| Núcleo Educa Paço | Laranja `#EA580C` |
| Núcleo tecnológico | Turquesa `#0891B2` |
| Unidade administrativa | Amarelo `#EAB308` |
| Obra em andamento | Cinza `#64748B` |

O preenchimento do marcador conserva a categoria inclusive quando selecionado ou com alerta. A seleção amplia o ponto; alertas D-081 usam o círculo externo vermelho/âmbar, pulsante com redução de movimento respeitada. Modal continua somente após clique/teclado. Cores não significam funcionamento, internet ou gravidade. Tipo ausente/desconhecido recebe cinza escuro neutro e texto explícito, sem classificação inferida.

Legenda expansível **Tipos de unidade** no Panorama e Mapa da Rede. Hover/rótulo acessível identificam nome, tipo e eventual alerta. Prévia do cadastro usa a mesma paleta e reage à seleção do tipo. Mapa de ruas, satélite, centro, zoom, coordenadas, filtros e indicador Escolas onlines mantêm seus critérios. Sem mudanças no coletor, dados, APIs, Drive ou instalador.

## Fontes e arquivos

Consultados `00_LEIA_ANTES_DE_TUDO.md`, `AGENTS.md`, regras de precedência, decisões, pendências, conflitos e documentos de `docs/03-painel-desktop/`; aceites D-080/D-081/D-083 e procedimento de publicação. Abertos os cinco PNGs desktop na ordem do manifesto: `00_painel_geral_APROVADO.png`, `01_mapa_da_rede_APROVADO.png`, `02_matriz_equipamentos_APROVADA.png`, `03_unidade_selecionada_APROVADA.png`, `04_indicadores_integrados_ESTUDO_APROVADO.png`. Paleta atual aprovada supera as cores ilustrativas dessas imagens e o roxo uniforme de D-083; métricas e regras de alerta permanecem.

Implementação: `web/unit-map-palette.js`, `web/desktop-map.js`, `web/desktop.js`, `web/admin-units.js`, `web/painel.css`, build desktop. A expectativa cromática do teste existente `tests/school-presence-browser.cjs` foi atualizada para categorias distintas. Nenhum servidor/migração modificado.

## Verificação

- Build desktop: 84 arquivos declarados; dry-run Wrangler aprovado com D1, Drive e configuração existentes.
- `school-presence-browser.cjs`: escolas únicas, filtros, perda/retorno, consulta compartilhada, erro/recuperação, visualizador e tela estreita aprovados. Cor agora depende da categoria.
- `hardware-review-browser.cjs`: clique/teclado, modal, posição sobre a coordenada, círculo de 16 px, redução de movimento, parecer, demanda e repetição idempotente aprovados.
- Conferência adicional em Worker real com SQLite isolado: sete tipos/cores, filtros, legenda, tooltip, alerta mantendo centro amarelo, ruas/satélite, largura 390 px sem overflow e mudança da cor na prévia administrativa. Dados sintéticos somente em memória local.
- Capturas da implementação em `evidencias/cores-categorias-2026-11-10/`: Panorama, Ruas, Satélite, 390 px e amarelo com alerta vermelho. Conferidas visualmente. São evidências locais, não imagens de dados oficiais.

Nenhuma nova pergunta/requisito do TXT de coleta implementado nesta mudança. Base original preservada. Apresentação de escolas offline e demais decisões pendentes continuam abertas.

## Publicação

Publicado em 10/11/2026 às 19:20:34 (America/Fortaleza), commit `866d8b4`. Painel ativo `78ca889a-b71b-4c7f-bb20-5f5a09164086`, **100% do tráfego**. Cinco assets novos/modificados enviados; crons, bindings e provedor Drive preservados. Sete verificações HTTP pós-publicação aprovadas: login público, páginas/módulos privados redirecionando e API recusando acesso anônimo. Inspeção visual autenticada foi realizada localmente com dados isolados; não se declara nova sessão visual autenticada em produção nesta entrega.

Versão anterior do painel: `cf11b18f-1bff-47eb-a504-15f549de6f32`. Coletor reconferido inalterado: `274ecd9b-002e-4f79-a4b9-325fc26fece1`, 100%. Sem migração/escrita oficial de teste; rollback somente de código para a versão anterior.

Endereço: https://painel-semed-paco.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev/mapa
