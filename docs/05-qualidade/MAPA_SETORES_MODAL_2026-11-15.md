# Ficha direta em modal no mapa de setores — D121

## Pedido e implementação

15/11/2026: após aprovar o organograma horizontal, responsável pediu que clicar no equipamento abrisse um cartão modal já na ficha, com informações e opções como teste de velocidade, editar nome e apagar cadastro. Ajuste da funcionalidade cuja publicação foi autorizada na conversa.

- Clique/Enter no cartão abre ficha completa do ID exato, com unidade, ambiente, identificação, cadastro parcial/publicado, fotos, vínculo, comunicação, conexão e inventário técnico existentes. Antigo resumo inferior removido.
- Modal nativo, cabeçalho fixo com Atualizar/Fechar, conteúdo rolável e adaptação a tela estreita. Sem alteração de URL/unidade para consultar a ficha. Escape/Fechar restaura foco no cartão e conserva rolagem, setores abertos, página e modo do organograma.
- Reutiliza `createEquipmentConsultation`, opção presentation=modal; telas antigas continuam com consulta embutida. Teste de velocidade é atalho exclusivo do root para agentes compatíveis, sem disparo automático. Root pode editar nome/apagar pelas confirmações já existentes. Servidor continua revalidando permissões/CSRF/versão/ID/unidade.
- Após renomear, cartão atualizado pelo ACK. Após apagar, recarrega somente a página do setor afetado para corrigir quantidade/paginação. Sem união de cadastros, transferência de vínculos ou edição de hardware observado.
- Sem timer novo: ficha usa monitoramento existente; suspende atualização do inventário técnico enquanto outra janela estiver acima ou edição estiver em curso. Fechamento cancela requisições pendentes. Modal fica fora da região reconstruída pelas atualizações da página.
- Arquivos: web/desktop-equipment.js, web/unit-equipment-map.js, web/desktop.js, web/painel.css. Sem migração, APK, coletor, instalador ou alteração das APIs/GPS/alertas.

## Validação

24 testes Node passaram: unit-equipment-map, equipment-signal, equipment-consultation, panel-blocks, equipment-rename e equipment-deletion. Build desktop concluído.

CUA em SQLite isolado, localhost, dados DEMONSTRAÇÃO:

- Clique abriu diretamente ficha com foto, agente e link de teste no ID exato; nenhuma medição disparada.
- Renomear salvou DEMONSTRAÇÃO · PC RENOMEADO; ficha e cartão atualizaram mantendo hostname, foto e vínculo.
- Foto ampliada acima da ficha: Escape fechou somente a foto, mantendo o modal principal.
- Escape no modal principal: zero diálogos remanescentes, foco no cartão renomeado; scrollY permaneceu 218 antes/depois. Enter reabriu a ficha. Atualizar conservou o mesmo ID.
- Tela 390 × 844: modal coube na área útil e não teve transbordamento horizontal; cabeçalho/fechar acessíveis, conteúdo rolável. 1440 × 1000: foto, edição e dados presentes. Simulação de viewport não homologa aparelho físico.
- Exclusão cancelada manteve a ficha. Exclusão confirmada somente do cadastro fictício Mesa 3 fechou o modal, retirou o item e atualizou laboratório 56→55, total 60→59 fichas, sem criar dados reais. Prévia local exige --allow-edits e aceita POST exclusivamente em duas rotas, sem qualquer serviço de produção.
- Visualizador abriu a mesma ficha com fotos; não recebeu Editar nome, Apagar cadastro ou Teste de velocidade.
- Capturas locais em evidencias/mapa-setores-2026-11-15/modal-local-1440.jpg e modal-local-390.jpg.

## Publicação

Publicado em 15/11/2026 às 10:09:04 Fortaleza (13:09:04 UTC), painel `6bd1bc73-c1e0-49bd-89c4-bc1b00d4a42e`, 100%. As 51 verificações HTTP pós-publicação passaram. Reversão: Worker `ad54b444-bae1-4024-84db-fc7f0d6e70cd`. Artefatos privados em private-data/mapa-setores-modal-2026-11-15/.

Conferência CUA autenticada root na Bandeira Tribuzzi: clique no GEST-BAND abriu diretamente modal do ID `18d93a33-810a-4f82-aef6-68fe2af1eb91`, com foto real 320 px, vínculo ativo, comunicação e dados técnicos. Editar nome abriu sobre a ficha e foi cancelado sem gravar. Fechar retornou ao cartão e manteve scrollY=305; reabrir funcionou. Agente 0.1.8 mostra atualização necessária para velocidade, conforme regra já existente. Nenhuma edição/exclusão ou teste de internet foi executado em produção. Captura: evidencias/mapa-setores-2026-11-15/modal-bandeira-publicado.jpg. Somente painel publicado; viewport de teste restaurado, sem nova distribuição de APK ou migração.
