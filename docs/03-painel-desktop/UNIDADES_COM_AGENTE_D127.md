# D127 — unidades com e sem agente vinculado

Pedido autorizado em 16/11/2026: implementar, testar e publicar no Panorama dois botões com contagem e listagem pesquisável, mantendo baixo consumo do D1.

## Comportamento

- Bloco **Agentes por unidade**, abaixo do mapa e antes das categorias, somente no Panorama.
- **Com agente vinculado**: cada unidade aparece uma vez se possui ao menos um computador com vínculo atual (link sem encerramento e dispositivo em estado `linked`). Conta mesmo offline ou sem contato recente, incluindo cadastro parcial.
- **Sem agente vinculado**: nenhuma associação válida nesse critério. Inclui unidades sem computadores cadastrados. Não afirma que não exista software instalado fisicamente: instalação não vinculada não identifica uma unidade.
- Vínculo encerrado, instalação revogada e equipamento excluído não contam. Quantidade secundária no modal é de computadores vinculados, nunca de unidades.
- Mesmos IDs e filtros do catálogo do Panorama; todos os tipos do escopo, inclusive administrativos. Unidades inativas e conveniadas ficam fora do catálogo ativo atual. Não depende de coordenadas ou conclusão da coleta.
- Cada botão abre modal com nomes ordenados, quantidade de computadores vinculados e busca local por nome, sem distinguir acentos/maiúsculas. Nome abre a ficha da unidade pelo ID.
- Lista acompanha as atualizações existentes, preservando busca/rolagem. Fechar ou Escape devolve foco ao botão. Estados vazios e falhas são distintos; erro não vira zero nem lista de ausência fictícia.

## Dados, acesso e orçamento

`GET /api/operations/units` acrescenta o inteiro `linked` em cada unidade. O servidor calcula o campo no loop existente, a partir de `device_id` e `state` já selecionados. SQL, parâmetros, índices, autorização e revalidação D110 permanecem iguais.

`web/unit-agent-overview.js` reutiliza `semed:fleet-presence`, atualização de frota de 60 segundos somente em aba visível. Sem endpoint, timer, polling ou armazenamento adicional. Abrir modal, pesquisar e filtrar não consulta o D1. Mesma política desktop: root/admin/visualizador consultam; operador/coletor não recebem a API gerencial.

Sem migração, alterações de cadastro, fotos, permissões, localização D114, alertas, plano gratuito, APK ou instalador. Publicar somente o Worker do painel. [Testes e publicação](../05-qualidade/VINCULOS_PANORAMA_D127_2026-11-16.md).
