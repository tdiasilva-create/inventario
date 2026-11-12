# Avatares dos técnicos — 12/11/2026

## Escopo e fontes

Solicitação e confirmação expressa do responsável: imagem por técnico, anexada pelo root. Consultados: `00_LEIA_ANTES_DE_TUDO.md`, `AGENTS.md`, precedência, decisões, pendências e conflitos documentais; D-105/D-106, documentação desktop e referências aprovadas, D-072, armazenamento privado de fotografias, publicação e recuperação. Implementação D-107: [contrato](../03-painel-desktop/AVATARES_TECNICOS_D107.md).

Arquivos centrais: `server/technician-avatars.mjs`, `web/technician-avatar.js`, `web/dispatch.js`, `web/dispatch-map.js`, `server/technical-dispatch.mjs`, `server/dispatch-road-routing.mjs`, `server/photo-storage.mjs`, `server/worker.mjs`, `web/painel.css`, build desktop e migração 0029. Não altera perguntas do TXT, coletor, instalador/telemetria ou regras de atendimento/GPS. Cobertura do TXT nesta entrega: somente preservação das permissões e armazenamento privado; nenhum questionário adicional implementado.

## Testes executados

- `pnpm test`: **242/242**, incluindo quatro testes novos com vários cenários de avatar; regressão do roteamento no runtime Cloudflare workerd aprovada.
- Validação root/CSRF, bloqueio admin/operador/visualizador/coletor, PNG inválido/grande/dimensão excessiva, leitura privada e 304 autorizado.
- Gravar/repetir operação, trocar com versão, conflito, remoção auditada, arquivo antigo privado preservado, erro de armazenamento mantendo imagem anterior e retry.
- Tentativas simultâneas da mesma operação: apenas uma realiza o envio; nenhuma alteração em atribuição/atendimento.
- Google Drive simulado: pasta privada própria, arquivo reutilizado após repetição, nenhuma unidade/vistoria fictícia, leitura pelo provedor. Não confundir simulação local com envio real ao Drive.
- `node tests/technician-avatars-browser.cjs`: preview real em Chromium/Edge, upload via formulário, imagem privada 128px no mapa, tooltip, tracejado por ruas preservado, sem quadro superior, polling sem nova leitura da imagem, remoção e iniciais. Zero erros JavaScript.
- Build desktop: 107 arquivos; build coletor: 55 arquivos, não publicado nesta entrega.
- Esquema gerado em SQLite isolado: 29 migrações, 85 tabelas, integridade OK e zero erros de chave estrangeira.

Evidências com dados sintéticos: [prévia root](evidencias/avatares-tecnicos-2026-11-12/01-previa-root.png), [salvo](evidencias/avatares-tecnicos-2026-11-12/02-imagem-salva.png), [avatar e rota](evidencias/avatares-tecnicos-2026-11-12/03-avatar-e-rota.png), [iniciais](evidencias/avatares-tecnicos-2026-11-12/04-iniciais-sem-imagem.png).

## Conferência pelo responsável

1. Como root, abrir Central de demandas → Organizar atendimentos → Técnicos.
2. Em uma conta escolhida, Anexar imagem, escolher arquivo, conferir prévia, Salvar imagem.
3. Técnico aceita atendimento com GPS pelo fluxo já existente. No mapa root, conferir avatar e nome ao passar o mouse, além de unidade/posição. Não precisa reinstalar APK.
4. Trocar imagem e aguardar a atualização de até 15 s da aba visível. Não muda demanda/rota.
5. Remover imagem com confirmação: iniciais no mapa; conta, permissão e atendimento continuam iguais.

Nenhuma imagem de exemplo foi atribuída a usuário real. Publicação e conferência autenticada registradas no adendo abaixo quando concluídas. A homologação com a imagem escolhida e GPS do técnico depende de uma escolha real do root e atendimento ativo; não criar posições artificiais em produção.

## Publicação e conferência real

- Migração 0029 aplicada no D1 institucional, quatro comandos em 1,56 ms, sem seeds/alteração de demandas ou usuários. Bookmark anterior guardado em private-data/avatar-d107/bookmark-before.json; sem exportar/bloquear banco com dump durante coleta ativa.
- Painel publicado em **12/11/2026 às 13:03:45 Fortaleza (16:03:45 UTC)**. Versão **18002f7f-e6b8-4954-8bb3-ef53371feb28**, 100% do tráfego. Crons existentes preservados.
- Coletor permanece na versão **2dac8571-2671-4eec-8ab0-7492753a0255**. APK sem alteração, SHA256 6fdabb65acba9f530d407a8da1d03df35f4432a4a5df84e168d1b99bac59fd11.
- Publicação: 51 verificações públicas aprovadas; avatar-info e avatar sem sessão recusados com 401.
- Regressões navegador D105 (arraste, dois técnicos, GPS, conclusão, móvel) e D106 (geometria, falhas, ausência de coordenadas e conclusão) aprovadas. Estilo final do formulário conferido visualmente com espaçamento próprio.
- Após login do responsável, navegação autenticada em produção confirmou Técnicos e imagens no mapa, botões Anexar imagem e formulário de um técnico com nome/iniciais, escolha de arquivo e ações. Captura privada: private-data/avatar-d107/painel-real-imagem-tecnico.png. Não foi salva imagem em conta real; não foram mudadas permissões, demandas ou posições. Upload completo permanece comprovado em testes isolados; a associação real é feita pelo root escolhendo o técnico e arquivo.
- No momento da conferência, zero técnicos com posição recente no mapa. Não simulamos GPS em produção para apresentar avatar fictício.

Endereço: https://painel-semed-paco.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev/roteiro-demandas
