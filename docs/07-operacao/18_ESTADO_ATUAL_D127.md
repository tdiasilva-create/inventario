# Estado D127 — 16/11/2026

Complementa [D126](17_ESTADO_ATUAL_D126.md). Panorama apresenta unidades com e sem agente vinculado, contagens e listas pesquisáveis. [Contrato](../03-painel-desktop/UNIDADES_COM_AGENTE_D127.md) e [testes/publicação](../05-qualidade/VINCULOS_PANORAMA_D127_2026-11-16.md).

Mesmo catálogo filtrado, vínculo atual independente de comunicação e dados parciais incluídos. O atributo aditivo `linked` da API de frota usa os registros existentes; nenhum SQL/polling adicional. Sem novas migrações (continuam 37), APK, agente, alteração do coletor ou gravação de dados oficiais.

Na migração física, manter os mesmos critérios de link não encerrado, dispositivo `linked`, equipamento ativo e filtro do catálogo. Preservar revalidação transacional D110; não substituir ausência de resposta por zero. Demais decisões da auditoria permanecem pendentes.
