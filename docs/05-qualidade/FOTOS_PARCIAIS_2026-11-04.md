# Fotos recebidas durante a coleta — correção publicada em 04/11/2026

## Diagnóstico observado

O Drive estava conectado e o envio do usuário foi confirmado às 07:39:52 (Fortaleza). A fotografia `37b5bc82-3bbd-429d-8a57-01ac8d10cad2` estava em `ready`, vinculada à fachada da vistoria aberta `d046055d-cb30-4ea3-9ab5-ce061249b42d`. A imagem enviada é um teclado, usado pelo usuário como teste; o vínculo informado pelo coletor é fachada. O agente não alterou esse vínculo.

A galeria da unidade consultava apenas vistorias concluídas. A página de coletas em andamento ainda informava que fotos parciais não estavam disponíveis. Portanto o envio funcionava, mas faltava a apresentação no acompanhamento. A orientação anterior de procurar a foto nessa página foi prematura.

## Fontes, escopo e aceite

Consultados: `00_LEIA_ANTES_DE_TUDO.md`, `AGENTS.md`, `REGRAS_DE_PRECEDENCIA.md`, `DECISOES.md` (D-031, D-045, D-048, D-050, D-052), `PENDENCIAS.md`, `CONFLITOS_DOCUMENTAIS.md`, Base de Coleta §§7–9, documentos desktop, contratos/fluxos de dados e Drive, diagramas DOT, `ACEITE.md`, `COLETAS_EM_ANDAMENTO_01.md` e `TESTE_FOTOS_GOOGLE_DRIVE.txt`. Abertos os cinco PNGs do manifesto desktop: `00_painel_geral_APROVADO.png`, `01_mapa_da_rede_APROVADO.png`, `02_matriz_equipamentos_APROVADA.png`, `03_unidade_selecionada_APROVADA.png`, `04_indicadores_integrados_ESTUDO_APROVADO.png`.

Implementação de D-045: galeria de fotografias já recebidas na vistoria aberta, com vínculo, autoria, data, contadores de recebidas/pendentes, ampliação e páginas de 50. Apenas registros `ready` têm imagem. A consulta passa pelos mesmos perfis desktop (root/admin/visualizador); operador não recebe acesso gerencial. O proxy exige sessão, unidade ativa, vistoria aberta e pertencimento da foto à vistoria/unidade. Não fornece IDs do Drive, tokens, chaves de armazenamento nem URLs públicas. As regras anteriores do endpoint `/api/collector/photo` permanecem.

A mensagem vazia no detalhe da unidade agora esclarece que se refere a vistorias concluídas e oferece acesso ao acompanhamento. Os dados parciais continuam separados dos indicadores oficiais. A atualização de 15 segundos preserva os elementos das imagens quando o conteúdo não mudou. Nenhuma pergunta, obrigatoriedade, estado de vistoria ou cadastro foi alterado.

Arquivos: `server/in-progress-photos.mjs`, integração em `server/in-progress.mjs`; `web/desktop-progress-photos.js/.css`, `desktop-progress.js`, `desktop.js`; build desktop, testes e scripts da correção isolada.

## Verificação

- Testes Node: dois novos cenários cobrem 55 fotos, paginação sem duplicação, vínculos, ready/pending, três perfis desktop, operador bloqueado, consulta somente GET, foto de outra vistoria recusada, unidade inativa, conclusão, provedor indisponível e arquivo ausente. Leitura não muda histórico nem publica fotos.
- Dois testes de regressão de andamento aprovados; nove testes relacionados a autenticação/Drive aprovados (13 testes distintos nesta etapa).
- Pacote isolado: teste do Worker publicado com a correção, autenticação de assets e API, preservação dos bindings, transformação de JS e sintaxe aprovados.
- Navegador local com SQLite isolado: duas miniaturas e um envio pendente, ampliação/fechamento, atualização e zero erros de console. Nenhuma fixture inserida no D1 oficial.
- Produção: galeria exibiu **1 recebida, 0 envios sem confirmação**; miniatura e ampliação carregaram a fotografia real do usuário. Estado da vistoria continua aberto. Capturas `evidencias/fotos-parciais-2026-11-04/producao-galeria.png` e `producao-foto-ampliada.png`.
- Verificação externa de publicação: 46 verificações aprovadas para login, assets e rotas privadas. Endpoints novos também exigem autenticação.

## Publicação isolada e continuidade

Worker desktop publicado: `c990dc1b-bb8e-4ca8-9471-6cc6f2bdb7ff`. Baseline obtida por leitura da Cloudflare: `c49b5260-5a00-48ef-b3e6-1a7a8091b39c`. Coletor não republicado. Sem migração, alteração de segredo ou escrita de inventário em produção.

A V2 local ainda não está pronta para publicação conjunta. Por isso foi preparada uma correção sobre o bundle realmente publicado, preservando assets, bindings de D1, variáveis e segredos. Novos assets da galeria são servidos pelo wrapper somente após a autorização original. Artefatos privados em `private-data/partial-photos-release/`; preparação/teste em `scripts/prepare-partial-photos-release.mjs` e `scripts/test-partial-photos-release.mjs`. O código-fonte normal também recebeu a correção, para a próxima publicação integral. Não usar a versão local inteira como substituto desta baseline antes de concluir a adaptação V2.

## Cobertura e limites

Base §§7.1/7.5/7.6: confirmação de recebimento, acompanhamento de dados parciais e separação da conclusão; §8: consulta autenticada. D-045/D-048/D-050: fotos protegidas no contexto de coleta e acesso desktop. Não há nova pergunta ou obrigação.

Este teste comprova armazenamento/leitura desta foto enviada pelo usuário e sua apresentação real. Não homologa câmera em todos os aparelhos, offline protegido, retomada após fechar o navegador, vínculo de foto de equipamento em todos os fluxos, nem a V2. A conta do coletor não apareceu autenticada na aba controlada, mesmo após o usuário informar login; não houve tentativa de senha nem criação de sessão artificial. A verificação aproveitou a foto existente e a sessão root legítima do painel.

Link:
https://painel-semed-paco.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev/coletas-em-andamento?vistoria=d046055d-cb30-4ea3-9ab5-ce061249b42d
