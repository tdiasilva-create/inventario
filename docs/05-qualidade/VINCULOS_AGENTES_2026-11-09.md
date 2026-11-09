# Identificação de vínculo/cadastro — D-079, 09/11/2026

Autorização: “quero que fique mais claro no painel quais computadores estão vinculados ao agente e quais foram cadastrados manualmente, para eu identificar facilmente. publique essa melhoria no ambiente real”.

## Resultado e critérios

- Etiqueta **Agente vinculado** em preto e **Cadastro manual** em pêssego, com texto e símbolo. Pendência, encerramento e modo desconhecido têm rótulos próprios; não depender somente de cor.
- Locais: menu Computadores (grid por unidade/ambiente e diálogo), consulta de Equipamentos compartilhada com Panorama/unidade (lista e ficha), tabela de Coletas em andamento.
- Filtro Vínculo / cadastro em Computadores e na consulta publicada, aplicado no servidor antes das páginas de 60/50. Combina com os filtros existentes; nomes/host/ID preservados.
- A informação vem do vínculo real, independentemente do último heartbeat. Modo Manual somente quando explicitamente registrado e sem histórico encerrado. Sem vínculo não significa obrigatoriamente manual; nenhuma inferência de duplicidade.
- Consulta publicada conserva `published_json`; tela operacional pode mostrar preenchimento atual, marcado PARCIAL. Fotos do mesmo ID e acesso por perfil continuam preservados.

Arquivos: `server/equipment-link-state.mjs`, `server/inventory-equipment.mjs`, `server/service-desk.mjs`, `server/in-progress.mjs`; `web/equipment-link-state.js`, `web/desktop-equipment.js`, `web/desktop-inventory.js`, `web/desktop-theme.css`, `web/operations.js`, `web/operations.css`; build desktop, testes e CI. Sem SQL de migração ou escrita nova. Nenhuma modificação de protocolo EXE/QR ou interface do coletor.

## Documentos e requisitos

Consultados: `00_LEIA_ANTES_DE_TUDO.md`, `AGENTS.md`, `REGRAS_DE_PRECEDENCIA.md`, decisões D-069 a D-078, pendências/conflitos, `CENTRAL_DE_DEMANDAS.md`, `CONSULTA_EQUIPAMENTOS.md`, `MONITORAMENTO_E_NOTIFICACOES.md`, `ACEITE.md` e registros de qualidade associados. Abertos os cinco PNGs desktop do manifesto; identidade vigente D-065 preservada. Base original permanece intocada: esta entrega cobre a apresentação da identificação, origem/vínculo e histórico (§§7.3/7.4/9), sem novas perguntas, regras de foto ou conclusão/offline. Fases 4/5 permanecem pausadas.

## Testes executados

- Suíte completa: **171 testes aprovados**.
- Casos específicos: vínculo ativo prevalece sobre Manual antigo; agente sem contato continua vinculado; histórico encerrado não vira Manual; pendente/legado desconhecido; impressora não recebe rótulo de computador; filtros/paginação/combinações/perfis e nenhuma escrita durante consulta; diferença publicado/parcial.
- Navegador com Worker real e SQLite isolado: cinco etiquetas, filtros nos dois locais, ficha, hostname no hover, fotos carregadas, tabela parcial, perfil visualizador e atualização do vínculo da ficha aberta após evento de monitoramento. Registros exclusivamente sintéticos, sem envio ao ambiente real.
- Regressões de consulta oficial (1366/1440/1920 px) e Computadores/Central de demandas aprovadas. Duas expectativas de texto do roteiro antigo foram atualizadas para a descrição explícita de cadastro manual; a navegação/fotos/paginação/erro e nova tentativa passaram na execução final.
- Build desktop: 87 arquivos. Dry-run aprovado. Consulta SELECT no D1 real confirmou 11 computadores vinculados e 1 item de categoria não aplicável naquele instante; `rows_written=0`. Nenhum cadastro manual ativo foi inventado para exibir a nova etiqueta.
- Capturas reais da implementação em `docs/05-qualidade/evidencias/vinculos-agentes-2026-11-09/`: `01-computadores-vinculo-separado.png`, `02-ficha-vinculada.png`, `03-consulta-e-ficha.png`, `04-manual-foto-preservada.png`, `05-parciais.png` e `resultado.json`. Inspeção visual confirmou paleta e etiquetas sem sobreposição.

## Publicação

Pendente de execução e conferência nesta etapa do registro. Somente painel; dados, Drive, coletor e instalador serão preservados. Não declarar navegação autenticada de produção a partir dos testes isolados.
