# Correções de experiência do coletor — D-062

Pedido explícito: “publique as correcoes”, após revisão e prévia aprovadas pelo responsável em 05/11/2026. Escopo: interface compacta, pesquisa, foco/teclado, visibilidade de erros e retorno à lista. Publicação somente do coletor; perguntas, permissões, Drive, banco e protocolo dos agentes preservados.

## Fontes e requisitos

Consultados o guia de entrada, AGENTS.md, regras de precedência, decisões D-057–D-061, pendências/conflitos e `docs/06-entregas/REVISAO_UX_COLETOR_2026-11-05.txt`. Base original e especificações mobile foram lidas integralmente anteriormente nesta cadeia de implementação; permanecem preservadas. O diagnóstico executável e as imagens do teste anterior são evidências do comportamento antes da correção.

Requisitos preservados: escolher unidade oficial; navegação por assuntos; ID permanente, vínculo QR, fotos opcionais de computador, confirmação do servidor, limites de fotografias e conclusão/reabertura manuais. Nenhuma nova pergunta do TXT foi implementada nesta entrega. Offline durável, homologação física de câmera/teclado/EXE e demais lacunas anteriores continuam separadas deste trabalho.

## O que mudou

- Cabeçalho único com seta de retorno, título, unidade e estado. Ícones e cores da identidade permanecem; bloco repetido de título/ícone retirado da área útil.
- Botões de 44–48px e lista compacta. Adicionar tem destaque; Concluir assunto tem apresentação secundária e continua ação explícita.
- Busca em uma linha, Enter funcional e limpeza explícita. Query separada de answers; nenhuma gravação de seção/histórico ao pesquisar. Consulta/paginação continuam no servidor.
- Atualização do DOM na mesma tela conserva controles existentes. Seleções e respostas de fotografia não substituem o input ativo nem seu cursor. Mudança real de tela continua renderizando a nova tela.
- Após envio/remoção de fotografia, atualiza-se o conjunto de fotos; não se recarregam respostas digitadas durante a requisição. Rascunho inicial preserva edição mais nova do nome de ambiente quando chega uma resposta antiga.
- Durante digitação em tela estreita ou dispositivo de toque, rodapé recolhido e botão Fechar teclado no cabeçalho. Próximo percorre os campos; Enter em observações continua quebra de linha. VisualViewport/foco ajustam a área visível, sem deslocamento a cada tecla. Isso também tem fallback por foco sem depender de detectar um teclado nativo específico.
- Erro de validação relacionado ao controle por aria-describedby/aria-invalid; primeiro campo inválido recebe foco e rolagem para ficar visível.
- Retorno da edição conserva a posição da lista. Reabertura após concluir inventário descarta a versão obsoleta daquele assunto na fila, evitando conflito consigo mesmo.

Arquivos: `web/collector-v3.js`, `web/collector-v3.css`, novo `web/collector-ui.js`; inclusão do módulo no build do coletor e na lista autenticada de assets do Worker. Nenhuma migração, biblioteca externa nova, credencial ou dado oficial alterado.

## Testes e limites

- Suíte geral: **98 testes aprovados**.
- `tests/collector-v3-browser.cjs`: Worker real/SQLite isolado; sete fotografias sintéticas, computador manual e QR, AnyDesk/RustDesk com zeros, revisão/conclusão e consulta desktop aprovados. Retorno às categorias em 224ms no ensaio local; não é medição da rede do celular.
- `tests/collector-identity-browser.cjs`: login/conta, fontes, cores, cartões, proteção HTTP, retrato/paisagem e QR com permissão negada simulada aprovados.
- `tests/collector-ux-browser.cjs`: busca/Enter/limpeza sem escrita; conclusão e reabertura; Próximo, Fechar teclado e multiline; identidade do nó/cursor mantidos durante upload; dados salvos/reabertos; erro focalizado e visível; largura 360/390/640/812; retorno em lista longa.
- Medição em área 390×660: primeiro equipamento em **208px** (antes ~542px); header 72px e footer 65px. Área reduzida 390×360: campo ativo visível e rodapé recolhido. Capturas em `evidencias/ux-publicacao-2026-11-05/`.
- Os testes foram executados em Edge automatizado. Altura reduzida e foco simulam condições de layout, mas não equivalem ao teclado físico do celular. Android/Safari e envio autenticado ao Drive real não foram homologados nesta rodada. Nenhum dado de teste foi criado em produção.

Os testes anteriores foram mantidos: apenas se acrescentou a interação Fechar teclado antes de ações de rodapé e tornou-se preciso o seletor do campo Categoria, agora que o botão de retorno possui nome acessível. Não foram removidas asserções de negócio para obter aprovação.

## Publicação

Autorização atual cobre publicação direta. Backup em `backups/pre-ux-2026-11-05/`. Versão anterior do coletor: `a96b3047-19d1-48b8-975b-6ddd0b36505e`. Painel permanece na versão `827d6900-aa3a-450c-974d-ac13fd2ecca5`.

URL: https://inventario-semed-lumiar.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev/

Publicado em **05/11/2026 às 21:23 (America/Fortaleza)**, versão **`5cf137cd-9c34-4e41-806b-d19cf0887bb6`**, com 100% do tráfego do coletor. Build de 47 arquivos e dry-run aprovados; três assets novos/alterados enviados (collector-v3.js, collector-v3.css e collector-ui.js). Configuração D1/Drive/cadastro de agentes preservada. Nenhum comando de migração, seed, alteração de segredos ou publicação do painel foi executado.

Após o deploy, **16 verificações públicas somente leitura aprovadas**: oito arquivos públicos iguais ao build por SHA-256, cinco rotas/assets internos redirecionam ao login e três APIs recusam acesso sem sessão. Login real capturado em 390px, fontes corretas e sem erro JavaScript/overflow. A lista de deployments confirma a versão ativa. Logs e `publicacao.json` na pasta de evidências.

Essas sondas não representam navegação autenticada em produção. As capturas internas e provas de QR/fotos são do Worker/SQLite isolado; a captura `15-login-producao-390.png` é do login público real. Não foi criado conteúdo fictício no banco oficial para conferir esta publicação.

## Conferência no celular

1. Atualizar a página e abrir Computadores. Conferir cabeçalho compacto, busca e itens visíveis.
2. Buscar pelo teclado e limpar. Concluir/reabrir assunto apenas se desejado, mantendo a confirmação manual.
3. Editar ambiente/posição, AnyDesk/RustDesk e observações. Usar Próximo e Fechar teclado. Campo e erro devem ficar visíveis.
4. Enviar fotografia e continuar digitando; conferir se cursor e texto permanecem. Aguardar confirmação do servidor.
5. Salvar e reabrir; retornar à lista longa e conferir a posição. Informar aparelho/navegador se o teclado ainda encobrir algo.
