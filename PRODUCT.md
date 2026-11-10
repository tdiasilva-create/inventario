# Inventário Tecnológico SEMED — orientação do produto

Sistema da Secretaria Municipal de Educação de Paço do Lumiar. Há duas interfaces e uma persistência compartilhada: o coletor registra visitas, ambientes, equipamentos e evidências; o painel consulta, compara, acompanha computadores e organiza demandas.

Este documento foi adaptado das orientações entregues em 10/11/2026. Não substitui a governança, não aprova perguntas novas e não transforma exemplos visuais em cadastro oficial.

## Painel atual

- Panorama, mapa e matriz preservam o cadastro oficial e os filtros. Tipos de unidade têm contagens separadas.
- Dados publicados e coletas em andamento são distintos. As consultas parciais mostram somente dados já confirmados no servidor, identificados como PARCIAL.
- Computadores por unidade/ambiente permitem acompanhar a comunicação do agente. Comunicação recente não comprova uso humano nem ausência de defeito; sem contato não comprova desligamento.
- Vínculo ativo, cadastro manual, vínculo pendente, vínculo encerrado e origem não informada têm rótulos próprios.
- Central de demandas registra pedidos e histórico. Reconexão do computador não conclui automaticamente uma demanda manual.
- Root administra cadastros e usuários. Correções de nomes e retirada de equipamento preservam ID/histórico/fotos conforme regras específicas. A interface não concede novas permissões.
- Fotografias são protegidas no provedor configurado, atualmente Google Drive; miniaturas derivadas no D1 seguem D-072.

## Mudança de apresentação D-080

Menu compacto expansível, indicadores de acompanhamento no cabeçalho, folha visual unificada e login mais legível. O resumo superior consulta a rede inteira a cada minuto com a aba visível; não herda os filtros do Panorama. Telas operacionais mantêm suas atualizações de 15 segundos. Falhas de leitura são sinalizadas, sem transformar ausência de resposta em zero.

Sem mudanças no questionário, regras de conclusão, protocolo do agente, armazenamento, permissões ou cadastros. Fases 4/5 e pontos pendentes continuam em `docs/00-governanca/PENDENCIAS.md`.

## Referências obrigatórias

`00_LEIA_ANTES_DE_TUDO.md`, `AGENTS.md`, `docs/00-governanca/REGRAS_DE_PRECEDENCIA.md`, `docs/00-governanca/DECISOES.md`, `DESIGN.md` e `docs/03-painel-desktop/MESA_DE_DADOS.md`.
