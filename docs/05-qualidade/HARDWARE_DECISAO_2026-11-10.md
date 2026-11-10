# D-081 — atenção e decisão sobre alterações de hardware

## Pedido, fontes e escopo

Responsável solicitou unidade animada no mapa e modal com o registro da mudança, permitindo ao administrador aceitar ou encaminhar à Central de demandas. Implantação sob a autorização contínua de publicação do painel real da sessão.

Consultados: `00_LEIA_ANTES_DE_TUDO.md`, `AGENTS.md`, `REGRAS_DE_PRECEDENCIA.md`, `DECISOES.md`, `PENDENCIAS.md`, regras da Base original referentes a histórico/permissões, `MODELO_CONCEITUAL.md`, `02_FLUXO_DE_INTEGRACAO.md`, diagrama de dados, `MONITORAMENTO_E_NOTIFICACOES.md`, `CENTRAL_DE_DEMANDAS.md`, aceite desktop, publicação D-080 e guias operacionais de publicação/backup. Preservar D-070, D-071, D-078–080 e a Base original. Fases 4/5 seguem pausadas.

Arquivos: migração 0024 e módulo `server/hardware-review.mjs`; monitoramento/roteamento; `web/hardware-attention.js`, notificações, mapa, Central de demandas e CSS unificado; build, testes e documentação. Nenhuma mudança no questionário, protocolo do EXE, coleta de snapshots ou provedor de fotos.

## Comportamento e critérios de aceite

- Evento de hardware sem decisão: ponto vermelho com halo discreto, resumo no mapa e botão persistente no painel. Só unidades com coordenadas válidas ganham ponto; eventos sem coordenadas continuam acessíveis no modal. Filtros/câmera/base cartográfica preservados.
- Root/admin recebem modal automaticamente na aba visível. Adia durante digitação ou outro diálogo, não empilha nem reabre o mesmo alerta a cada atualização. Fechar não decide; a atenção continua disponível e reaparece numa nova navegação enquanto pendente.
- Unidade, ambiente, nome/hostname, posição, componente, antes/depois e datas. Novo evento conserva contexto no momento da detecção; registros anteriores identificam contexto atual. Não trata telemetria como publicação da coleta.
- Aceitar reconhece administrativamente a mudança, preservando evento, referência técnica e autoria/data/observação. Não altera a máquina nem apaga histórico. Não é a marcação individual de leitura.
- Encaminhar cria uma demanda de Manutenção, origem Painel, com unidade/equipamento, contexto e diferença. A unidade fica âmbar enquanto houver demanda aberta. Concluir remove esse destaque; reabrir a demanda o restabelece. Novo evento exige nova decisão.
- Decisão global imutável, transacional, com recibo idempotente. Administradores concorrentes não sobrescrevem decisões. Visualizador consulta; operador/coletor não acessam essas rotas. Origin/CSRF e autenticação permanecem obrigatórios.
- Sem email, push, som, autorização física prévia ou alterações no intervalo do agente. Depende do próximo inventário confiável: política atual periódica de seis horas; cron de minuto e consulta visível do painel a cada 15 s. Não garante detecção de toda peça/periférico.

## Verificações

- Suíte completa final: **176 testes aprovados**. Regressão dirigida de monitoramento/demandas/decisões: 19 testes aprovados.
- Cinco casos novos de servidor: leitura versus decisão, histórico/contexto, reenvio, concorrência entre decisões e entre reenvios iguais, rollback sem órfão, conclusão/reabertura de demanda, perfis/CSRF, coletor isolado, sem coordenadas e paginação priorizando pendentes.
- Navegador com Worker real e SQLite isolado: modal automático, mapa e zoom preservados, redução de movimento, resposta perdida após commit sem duplicação, link direto da demanda, aceitação, visualizador somente leitura e 390 × 844. Fluxo anterior de notificações e Computadores/Central de demandas aprovado.
- Evidências locais: `evidencias/hardware-decisao-2026-11-10/alteracao-memoria.png`, `mapa-sinalizado.png`, `encaminhada.png`, `central-demanda.png`, `leitura-mobile.png`. Dados sintéticos somente no banco isolado; imagens conferidas visualmente. Capturas não são prova de uma alteração física em máquina real.
- Build desktop 76 arquivos; coletor 54, somente para conferir compatibilidade. Dicionário: 24 migrações, integridade ok, sem erros de FK.

## Publicação e recuperação

Versões anteriores conferidas: painel `8b102e2f-0a17-499f-8458-fe217cf7799e`, coletor `274ecd9b-002e-4f79-a4b9-325fc26fece1`, ambos 100%. Backup SQL privado com 2.854.250 bytes, SHA256 `d36f8ebb7de701c87d1ea5bb6b61a9128f466cf0ffe7d1eeb2d29dc692d54a7f`. Restauração em memória aprovada: integridade ok, zero erros de FK, hashes de 20 miniaturas conferidos e contagens originais preservadas após ensaio da migração. Consulta de produção anterior à mudança: 13 agentes vinculados, três alertas de comunicação, nenhum evento de hardware; nenhuma escrita nessa consulta.

Migração **0024 aplicada no D1 real**; nenhuma semente/teste cadastrado. Publicado o código **827317a** em **10/11/2026, 11:10 de Fortaleza (14:10 UTC)**. Painel ativo em **100%: `1d055717-b1d6-42d1-a887-846fb78b6b28`**. Coletor confirmado na versão anterior `274ecd9b-002e-4f79-a4b9-325fc26fece1`; segredos, Drive e os dois crons preservados.

Sete verificações HTTP externas aprovadas: login e CSS públicos; novas APIs e monitoramento recusam acesso anônimo (401); módulo privado e Panorama redirecionam ao login (302). SQL pós-publicação somente leitura confirmou 0024, nenhuma decisão sintética e os mesmos três incidentes de comunicação. Cron bem-sucedido às **14:10:42 UTC**, posterior ao deploy; não houve snapshot novo processado nessa rodada. Não foi executada troca física de memória nem decisão em registros reais. Testes autenticados de interface descritos acima ocorreram no Worker/SQLite isolados.

Build/dry-run, scanner de 562 arquivos do índice e links documentais aprovados. Logs e backup em `private-data/release-hardware-2026-11-10/`, excluídos do Git.

Em caso de retorno, voltar somente o código do painel à versão anterior registrada. Não apagar a tabela de decisões nem restaurar banco antigo sobre dados novos. A versão anterior ignora a tabela adicional. Backup SQL privado e ensaio local não são backup das fotografias nem homologação completa de recuperação do sistema.

Endereço: https://painel-semed-paco.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev/panorama
