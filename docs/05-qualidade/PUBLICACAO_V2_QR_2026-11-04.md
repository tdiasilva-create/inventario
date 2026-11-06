# Publicação real V2 + QR — 04/11/2026

Autorização explícita D-054 substituiu a homologação prévia em recursos separados. Preservados usuários, cadastros, fotografias e configuração Google Drive. Sem seed, reset, alteração de senhas ou instalação do executável nesta estação.

## Publicação e banco

- Coletor: https://inventario-semed-lumiar.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev/
- Painel: https://painel-semed-paco.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev/
- Coletor anterior `4ce66d17-5545-4ff2-883e-d59d18a43c8d`; publicado `8c871ce6-4f7a-4874-bef1-e13f2728c568`.
- Painel anterior `c990dc1b-bb8e-4ca8-9471-6cc6f2bdb7ff`; publicado `29cc8c92-a6a4-4100-b389-1e37720cd7ca`.
- D1 semed-inventario-auth: única migração pendente 0014 aplicada; 46 comandos, 22 tabelas agent_* e cinco colunas de localização. Nenhuma migração restante.
- Backup privado `backups/pre-v2-qr-2026-11-04.sql`, 442178 bytes, SHA256 `f1db6528b85f7519929c36cc841e03c548c4dc72ca41936fc2e7d5ed36b1e2dd`. Restaurado em memória, migração ensaiada e integridade aprovada. Não distribuir SQL ou URLs de exportação.
- Contagens antes/depois da publicação: 71 unidades, 7 usuários, 6 vistorias, 4 equipamentos, 2 fotos, 1 integração. Testes posteriores do responsável podem alterar esses totais.
- Cron do painel 23 3 * * * (00:23 Fortaleza). Variáveis e segredos existentes preservados; valores secretos não exibidos.

## Evidências

- Revisão local anterior: 78 testes + 2 de fotografias, seis cenários independentes aprovados. Fontes de execução conferidas contra pacote auditado. Builds coletor 26/painel 45 arquivos e dry-runs aprovados.
- Sonda HTTP real: 14/14, arquivo `evidencias/publicacao-v2-qr-2026-11-04/http.txt`. Proteção de endpoints não atesta migração; esquema conferido separadamente no D1. POST sem grant não cria máquina; grava contador técnico.
- Interface real autenticada root: Drive conectado, fotos habilitadas, gerenciamento de autorizações e agentes disponível. Autoteste de envio/remoção Drive aprovado às 21:18:51 Fortaleza; permaneciam duas fotos e zero exclusões pendentes. Captura `evidencias/publicacao-v2-qr-2026-11-04/painel-drive-agentes.png`.
- Logs privados em `private-data/publicacao-v2-qr-2026-11-04/`. Sem teste destrutivo de unidade real.
- EXE 0.1.6 original extraído e hash conferido, não assinado/não executado. Pasta preparada `C:/Users/SIGAE/Downloads/SEMED-AGENTE-PRODUCAO/`, config aponta para coletor real. Guia `TESTE_COLETOR_V2_QR_PRODUCAO_2026-11-04.txt` na raiz e Downloads.

## Limites e continuidade

Ainda faltam teste do EXE em Windows designado e câmera/QR/fotografias nos celulares físicos. O usuário iniciou teste pelo celular. QR simulado solicitado depois está registrado separadamente em QR_TESTE_SOLICITADO_2026-11-04.md. Não confundir esse teste com execução do instalador.

Hardware/alertas de alteração, histórico técnico completo entre instalações, credenciais Wi-Fi/impressora protegidas, medição integrada, offline durável e unificação continuam pendentes. Comando pendente QR vive apenas na aba. Estados PARCIAL/publicado, quatro perfis e regras de reabertura manual mantidos. Nenhuma alegação de cobertura integral da Base original.
