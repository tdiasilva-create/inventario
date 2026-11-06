# Linha do tempo das decisões — reconstrução objetiva, não transcrição literal

**Fonte:** conversas do projeto e documento consolidado aprovado de 27/10/2026. Não inventar citação literal de perguntas antigas.

1. **Necessidade central:** substituir a organização atual em Google Planilhas/APIs/HTML por uma solução própria com dados estruturados, fotografias, relatórios e APIs futuras.
2. **Stack escolhida:** Cloudflare D1 para dados, R2 para fotos, Workers/API como camada de segurança e comunicação.
3. **Duas interfaces independentes:** etapa de campo no celular para registrar/atualizar; painel desktop para consultar/analisar; mesmas entidades D1/R2.
4. **Unidades fornecidas pelo administrador:** aproximadamente 90; o coletor somente escolhe uma pré-cadastrada/autorizada.
5. **Documento `base de coleta`:** o usuário responderia/editaría o TXT; recebeu depois uma especificação consolidada extensa com regras funcionais aprovadas, sem reabrir o questionário.
6. **Visual desktop aprovado:** tema dark-tech chamado Centro de Inteligência Tecnológica, com mapa da rede, matriz colorida de equipamentos e unidade selecionada, recusando cards KPI comuns. Desenhos setoriais foram aprovados.
7. **Estilo mobile aprovado:** modelo dark-tech azul profundo das seis telas de coleta, e método *Mobile-First Task-Oriented Wizard + Card-Based Navigation + Guided Data Entry*. Coletor não é dashboard.
8. **Regras importantes posteriores do documento consolidado:** inventário contínuo, conferência de bens, histórico, simultaneidade autorizada, cartões de acesso livre com dependências bloqueantes, estados somente nos cartões, conclusão manual, login/senha e perfil admin/coletor, offline, fotos e revisão/envio.
9. **Decisão documental:** utilizar repositório GitHub `tdiasilva-create/inventario` como fonte única da documentação para o Codex. A conexão anteriormente verificada era apenas leitura e o envio não estava confirmado.
10. **Pacotes anteriores insuficientemente comunicados:** arquivos setoriais eram úteis, mas só este conjunto completo combina TXT original, imagens, diagramas, especificações, decisões e pendências em uma árvore consultável.

## Documentos de autoridade
- `docs/02-coleta-mobile/BASE_DE_COLETA_V1_0_ORIGINAL.txt` — requisitos mobile aprovados.
- `design/referencias/` — estética escolhida.
- `docs/00-governanca/DECISOES.md` e `docs/00-governanca/PENDENCIAS.md` — índice de consulta, jamais substituem as fontes.
