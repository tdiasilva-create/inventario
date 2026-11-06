# Visão do produto e fronteiras de responsabilidade

## Objetivo
Centralizar o inventário tecnológico das 90 unidades da SEMED, com dados estruturados, fotografias, histórico e análise gerencial.

## Ambiente A — Coleta mobile
- Browser no smartphone, preferência vertical, Chrome Android e Safari iPhone.
- Coletor faz login, escolhe UMA unidade oficial autorizada, percorre cartões por grupo e executa fluxos curtos de cadastro/conferência.
- Captura fotos, registra falhas e necessidades, salva, revisa, finaliza e sincroniza.
- Offline planejado com limites reais dos navegadores.
- **Não contém dashboard, gráficos analíticos, rankings ou relatórios gerenciais.**

## Ambiente B — Painel desktop
- Interface distinta, dashboard gerencial de alta densidade, com mapa, heatmap, unidades e fotos.
- Consome somente dados consolidados/vigentes, aplicando permissões. Rascunhos não integram métricas oficiais.
- Mapas reais dependem de coordenadas oficiais/verificadas.

## Serviços compartilhados
- Cloudflare Workers: endpoints, autenticação e autorização, controle de versão, uploads e validações.
- Cloudflare D1: unidades, vínculos, equipamentos, vistorias, problemas, usuários, histórico, metadados R2.
- Cloudflare R2: fotos otimizadas e miniaturas; acesso restrito conforme permissões.

## Publicação
Vistoria torna-se concluída quando servidor confirma integridade dos dados e fotos obrigatórias (ou justificativa válida), após revisão explícita. Fotos opcionais podem continuar em fila. Exibir no painel imediatamente após conclusão oficial, sem recontagem indevida de itens permanentes.

## Advertência
O requisito de **inventário contínuo** exige distinguir `equipamento`, `verificação numa visita` e `vistoria`; não criar equipamento novo toda vez que for conferido.
