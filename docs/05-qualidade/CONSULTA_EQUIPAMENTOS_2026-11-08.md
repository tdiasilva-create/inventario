# Entrega e publicação — consulta de equipamentos, 08/11/2026

**Publicado no painel real**, após a autorização “publique no ambiente real as modificacoes”.

Endereço: https://painel-semed-paco.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev/panorama

Versão ativa em 100%: `e81e7d9d-4263-468a-9316-ce4f4ec0c2c8`. Versão anterior preservada: `8f38585c-a65e-417a-a499-04d406209149`. O coletor permanece na versão `859d0016-755f-4104-94ed-94e4780e2f8e`.

## Resultado

- O nome da unidade abre sua lista de equipamentos; cada quantidade abre a categoria correspondente, inclusive quando vazia.
- Consulta embutida no Panorama, na página Equipamentos e no detalhe da unidade. Seleção da linha, ordenação, filtros gerais e retorno à matriz preservados. Trocar de unidade não mantém a ficha da unidade anterior.
- Lista com fotografia do próprio bem, ID permanente, categoria, ambiente/posição, funcionamento, vínculo, último contato e AnyDesk/RustDesk copiáveis. Dados não informados aparecem como ausentes.
- Ficha lateral com campos publicados, fotos do mesmo ID, situação de comunicação conforme o serviço existente, resumo de CPU/RAM/discos/sistema operacional, seções técnicas completas e histórico disponibilizado pelo agente.
- Paginação e filtros no servidor; contagem de fichas distinta da quantidade física dos lotes. Nenhum limite novo de cadastro ou alteração no coletor.

Arquivos, contratos, regras de origem e leituras: [CONSULTA_EQUIPAMENTOS.md](../03-painel-desktop/CONSULTA_EQUIPAMENTOS.md). Pedido original preservado em [PEDIDO_ORIGINAL.txt](../06-entregas/consulta-equipamentos-2026-11-08/PEDIDO_ORIGINAL.txt).

## Testes e evidências

1. `pnpm test`: **115 testes aprovados**, nenhuma falha. Inclui consultas, fotos, perfis, agentes, rascunhos, cadastro, importação e regras do coletor.
2. `tests/equipment-consultation.test.mjs`: 58 fichas/65 itens físicos; páginas de 50 e 8; filtros de todas as categorias, busca em item da segunda página, filtro de agente/foto, ausência de escrita, zeros iniciais, exclusão do rascunho, rejeição de parâmetros e perfis indevidos. Galeria com 51 fotos em páginas de 48 e 3, sem mistura de unidade/alvo.
3. `tests/equipment-consultation-browser.cjs`: nome acionado por Enter, seleção da linha, categoria correta, categoria vazia, cópia dos dois IDs, ficha técnica, imagem protegida, ampliação, manual sem agente, ausência de foto, paginação, busca, erro de rede e nova tentativa, três rotas e troca de unidade. Nenhuma chamada de agent-status por linha da lista.
4. `tests/desktop-identity-browser.cjs`: 17 rotas, filtros, identidade, formulários e contexto das fotos aprovados.
5. `tests/unit-catalogue-browser.cjs`: matriz/ordenação/totais, cadastro, importação, contagens da rede e legado preservados, com banco isolado.
6. Navegador de teste: Chrome, 1366×768, 1440×900 e 1920×900. Capturas reais do DOM implementado em `docs/05-qualidade/evidencias/consulta-equipamentos-2026-11-08/`: `lista-1366.png`, `agente-1366.png`, `agente-1440.png`, `agente-1920.png`, `manual-com-foto.png`, `manual-sem-foto.png`, `outra-unidade-manual.png`, `erro-repetir.png`. A unidade com agente e a segunda unidade manual são exemplos explicitamente isolados. Imagem de teste é uma ilustração rotulada; não foi gravada no D1/Drive real.

O Edge de testes não iniciou neste computador com pouca memória disponível; a execução foi concluída no Chrome instalado, com processos separados do navegador do usuário. Não se declara homologação do Edge, celulares ou instalador físico nesta entrega. O teste inicial teve um erro de criação de aba no próprio roteiro, corrigido antes da execução completa.

## Publicação e conferência

- Backup D1 antes do deploy: **987.023 bytes**, SHA-256 `c35bbced00ccb650b6d3946fec841ffabcfda0392c2158c464f5a267348b44fc`. Restaurado somente em SQLite em memória: integridade OK, nenhuma violação de chave estrangeira. A nova consulta foi ensaiada sobre esse backup sem modificar registros.
- Build desktop: 69 arquivos. Publicado somente `painel-semed-paco`; seis assets novos/alterados enviados. Nenhuma migração, seed, carga de planilha ou operação destrutiva.
- Cloudflare confirmou a versão em 100%. Bindings, variáveis e nomes de segredos comparados antes/depois e preservados. Provedor Google Drive e agendamento do painel preservados; nenhuma reautorização, foto de teste real ou exclusão no armazenamento.
- Verificação às **18:37:27 de Fortaleza/Brasília (21:37:27 UTC)**: tabelas `units`, `inspections`, `equipments`, `miscellaneous_equipments`, `collection_photos` e `agent_equipment_links` iguais ao backup. No checkpoint: 76 unidades, 8 usuários, 7 vistorias, 1 equipamento, 3 fotos e 5 registros históricos de vínculo. Não são contagens fictícias fixadas na interface.
- O serviço de leitura foi executado contra o D1 remoto com as novas consultas SQL, somente leitura: uma unidade com uma ficha publicada retornou corretamente. Esse teste comprova compatibilidade do SQL com o D1 real; não substitui a navegação autenticada do usuário.
- **52 verificações HTTP** de produção: 46 do verificador de release e 6 específicas. Páginas/assets privados redirecionam ao login; APIs de equipamentos, fotos e agentes exigem sessão (401 sem credenciais).
- A sessão do navegador real expirou; foi solicitada nova entrada ao responsável para conferir visualmente a consulta autenticada. A publicação e os testes acima foram concluídos independentemente. Não declarar captura autenticada real enquanto essa entrada não ocorrer.

Backups, snapshots e logs ficam em `private-data/publicacao-d069-2026-11-08/`, fora do Git. Evidências PNG também seguem o ignore do projeto. Nenhuma credencial foi adicionada ao código ou à documentação.

## Limites e preservação

A Base de Coleta original permanece intocada. Foram cobertas a **exibição** da identificação/localização/funcionamento dos bens e das fotografias já coletadas, com histórico e separação oficial/parcial. Nenhuma pergunta ou obrigatoriedade foi alterada, nem se concluiu trabalho pendente do coletor, offline, QR, instalador ou alerta de troca de peça.

Miniaturas usam arquivos já otimizados pelo coletor, baixados apenas quando visíveis; não há derivado reduzido no servidor. Histórico do agente continua limitado aos 10 registros disponibilizados. Atualização do detalhe é manual ou por reabertura; não se infere máquina desligada a partir de ausência de heartbeat. Dados técnicos e fotos ausentes no banco não são gerados pela interface.

Rollback possível para o Worker anterior, com aprovação e conferência do destino; não restaurar o SQL sobre produção automaticamente, pois isso apagaria escritas posteriores. Não há migração a desfazer nesta entrega.
