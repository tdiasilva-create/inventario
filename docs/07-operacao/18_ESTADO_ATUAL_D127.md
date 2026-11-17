# Estado D127 — 16/11/2026

Complementa [D126](17_ESTADO_ATUAL_D126.md). Panorama apresenta unidades com e sem agente vinculado, contagens e listas pesquisáveis. [Contrato](../03-painel-desktop/UNIDADES_COM_AGENTE_D127.md) e [testes/publicação](../05-qualidade/VINCULOS_PANORAMA_D127_2026-11-16.md).

Publicado às 22:51:02 Fortaleza; painel `a816fd06-05e1-491b-bc3d-8deed5f2745f`, 100%. Conferência root real concluída, sem alteração de cadastros. Coletor `a1ff9077-58ac-4799-b733-5d88605c58da` e APK 1.0.4 preservados. Suíte 360/360 e quatro cenários de navegador aprovados.

Mesmo catálogo filtrado, vínculo atual independente de comunicação e dados parciais incluídos. O atributo aditivo `linked` da API de frota usa os registros existentes; nenhum SQL/polling adicional. Sem novas migrações (continuam 37), APK, agente, alteração do coletor ou gravação de dados oficiais.

Na migração física, manter os mesmos critérios de link não encerrado, dispositivo `linked`, equipamento ativo e filtro do catálogo. Preservar revalidação transacional D110; não substituir ausência de resposta por zero. Demais decisões da auditoria permanecem pendentes.
