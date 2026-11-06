# Desktop — mapa das telas e interação a especificar

**Estado:** aparência aprovada; parte dos comportamentos ainda depende de decisão. Este arquivo separa o que é visualmente obrigatório do que é só uma sugestão de interação.

| Setor | Referência de arte | Aprovado em aparência | Proposta/pendência funcional |
| --- | --- | --- | --- |
| Panorama | `design/referencias/desktop/00_painel_geral_APROVADO.png` | Sidebar, dark-tech, mapa + matriz + unidade selecionada + galeria | Se filtro geral afetará todas as áreas e quais estados/prazos serão exibidos |
| Mapa da rede | `01_mapa_da_rede_APROVADO.png` | Mapa dominante, regiões e lista/contexto lateral | Coordenadas e polígonos oficiais, provedor de mapa, clique e agrupamento |
| Equipamentos por unidade | `02_matriz_equipamentos_APROVADA.png` | Heatmap de escola × categoria, filtros, totais | Definição precisa da escala, origem dos dados, ordenação e pesquisa por célula |
| Unidade selecionada | `03_unidade_selecionada_APROVADA.png` | Identificação, ambientes, itens por ambiente, fotos, histórico | Abas finais, edição permitida ou só leitura, exportação e novos registros |
| Indicadores integrados | `04_indicadores_integrados_ESTUDO_APROVADO.png` | Evitar os cinco cards genéricos grandes, métricas integradas | Fórmulas e semântica de alertas, percentuais, timelines e comparativos |

### Propostas de interação a validar, não aprovadas automaticamente
- Clicar marcador → selecionar escola e exibir resumo contextual; botão separado abre detalhe.
- Clicar célula da matriz → lista filtrada de equipamentos daquela escola/categoria.
- Seleção de unidade no mapa e na matriz sincroniza `Unidade Selecionada`.
- Filtros e termos pesquisados persistem ao alternar setores somente se esse comportamento vier a ser aprovado.
- Galeria de fotos abre visualização ampliada autorizada, com data, ambiente e tipo de registro.

### Regras já aprovadas com impacto no desktop
- O cadastro mestre das escolas é exclusivo da administração; deve ser importado/atualizado antes do uso, sem escolas fictícias.
- O inventário é permanente; não duplicar totais por revisitas.
- Apenas vistorias concluídas oficialmente e confirmadas no backend alimentam indicadores de coleta; rascunhos podem ser acompanhados em área administrativa separada.
- O mesmo D1/R2 serve os dois ambientes; permissões em servidor.

### Como tratar ausência de dados
Se a planilha das 90 unidades, localizações e fotos não foi fornecida: exibir vazio explicativo ou placeholders inequivocamente marcados `DEMONSTRAÇÃO` em ambiente de protótipo. Não chamar os exemplos de dados oficiais. Nunca fabricar porcentagens, rankings e mapas.
