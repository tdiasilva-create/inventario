# Login — entrega visual 01 (27/10/2026)

Rota local: http://127.0.0.1:4173/login.html. Não publicada nesta entrega. Painel e mapa preservados; não se trata de proteção de acesso ao painel público DEMO.

## Fontes consultadas

`00_LEIA_ANTES_DE_TUDO.md`, `AGENTS.md`, `REGRAS_DE_PRECEDENCIA.md`, `DECISOES.md`, `PENDENCIAS.md`, `CONFLITOS_DOCUMENTAIS.md`, `docs/04-dados-apis/MODELO_CONCEITUAL.md`, trechos §8 da Base original e estrutura da distribuição desktop. Referências novas abertas visualmente: `440cc1f96e03f6072322fbf77dfc9deb-a26a684286b3b4c78516f1399fe5cdef.png`, `Login Tecnológico SEMED com Paisagem Amazônica.png`, `codex-clipboard-bece6d1c-6672-42a8-aaef-24af17ecc881.png`.

## Implementação e aceite

Formulário real, campos com labels/autocomplete, senha visível/oculta, validação nativa de campos obrigatórios, mensagens acessíveis e orientação de redefinição pelo administrador. Responsivo desktop/celular. Sem seletor de perfil: futuro servidor determina permissões. Root/admin/operador/visualizador registrados em D-028; matriz de permissões pendente.

Arquivos: `web/login.html`, `web/login.css`, `web/login.js`, `web/assets/prefeitura-paco.png`, `web/assets/paisagem-login.png`, lista permitida em `scripts/build-desktop.mjs` e verificação `scripts/verify-login.mjs`.

Teste real Chrome: aprovado em 1602×982 e 390×844; mostrar/ocultar senha, ausência de POST, limpeza da senha após submit, instrução de reset e ausência de overflow horizontal. Reproduzir com servidor local e `node scripts/verify-login.mjs`. Capturas reais: `evidencias/login/desktop.png`, `evidencias/login/mobile.png`; resultado JSON ao lado.

Comparação visual: composição em duas colunas, foto enviada, tons azuis, painel translúcido, contornos ciano e ação azul. Marca original mantida sobre placa branca para legibilidade, pois a versão fornecida contém letras azuis. Não reproduz mapa decorativo gerado nem promessa de offline da referência. Sem alteração no mapa operacional.

## TXT: cobertura e limites

§8.4: interface usuário/senha implementada visualmente; §8.6: instrução de contato com administração. Não implementados autenticação, contas, reset real, senha provisória, primeiro acesso, sessões, hash, limitação de tentativas, autorizações nem offline (§8). Nenhuma credencial é enviada, persistida ou validada; submit informa ausência de integração. Nenhuma cobertura nova A–H (§4), fotos (§5), sincronização/conclusão (§7), histórico (§9) ou backup (§10). Base original preservada; D1/R2/Workers continuam arquitetura prevista.

## Revisão visual 02 — 27/10/2026

Pedido posterior: maior fidelidade ao PNG, novo fundo similar, logo original sem fundo branco e refinamento do desenho. Consultados nesta revisão: referência reenviada, marca original, implementação login e relatório anterior. Alterados somente HTML/CSS do login, ativos decorativos e lista de distribuição. Painel e mapa operacional preservados.

Fundo novo gerado com a habilidade imagegen: `web/assets/paisagem-login-v2.png`, paisagem ilustrativa de rio/manguezal/barcos, sem alegação de fotografia oficial ou localização documental. O resultado de tentativa de edição generativa da marca NÃO foi usado: a página preserva o arquivo original `prefeitura-paco.png`, com duas camadas CSS para manter o símbolo colorido e apresentar a tipografia em branco, sem placa. Elemento tecnológico em SVG (`login-network.svg`) decorativo e aria-hidden, derivado do contorno V33 existente; não representa dados de inventário. Ícones inferiores agora em SVG real.

Composição revista: em 1602 px, formulário com 510 px à direita, marca e título à esquerda, campos de 62 px e botão de 67 px, contornos ciano e fotografia em tela cheia. Ainda há diferenças deliberadas: fundo é uma nova ilustração, elementos decorativos são redesenhados, aviso de autenticação e rodapé dos quatro perfis substituem promessa de offline da arte. Não é reprodução pixel a pixel.

`node scripts/verify-login.mjs`: PASS após revisão, incluindo capturas desktop/mobile, toggle de senha, zero POST, limpeza de senha, ajuda de reset e ausência de overflow horizontal. Evidências atualizadas em `evidencias/login/desktop.png`, `mobile.png` e `resultado.json`. Build desktop novamente validado. Não houve deploy nesta revisão.

Cobertura TXT permanece a anterior: somente interface §8.4 e orientação §8.6. Login real, sessões, autorização, recuperação efetiva e offline seguem pendentes; nenhuma nova cobertura A–H ou integração D1/R2/Workers.

## Publicação da revisão 02 — 27/10/2026

Autorização explícita: “vamos publicar . e criar os usuarios”. Login publicado em https://painel-semed-paco.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev/login.html . Versão Cloudflare `34738de1-1145-4a96-a326-8dfbd4d05ebd`.

Verificação real na URL pública: `node scripts/verify-login.mjs URL` passou em Chrome desktop e celular, incluindo toggle, zero POST, limpeza de senha, ajuda e ausência de overflow. Evidências em `evidencias/login-publicado/`. Não há autenticação operacional nem proteção do painel DEMO. Não foram criadas contas, D1 ou segredos: nomes individuais e atribuições ainda aguardam resposta do responsável. Proposta de permissões em `docs/04-dados-apis/PROPOSTA_ACESSO_INICIAL.md`. Não confundir autorização para criar usuários com definição de permissões ou existência de contas.
