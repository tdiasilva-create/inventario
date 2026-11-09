# Seleção de ambientes compartilhados — D-074

## Escopo e fontes

Pedido do responsável: selecionar ambientes cadastrados da própria unidade durante o cadastro de equipamentos, reduzindo digitação e duplicação entre operadores. A lista traz inclusive ambientes salvos em coleta aberta. Ambiente não pertence exclusivamente ao operador que o criou. D-074 supera apenas D-057 ponto 4. Identidade D-061/D-062 preservada; Fases 4/5 permanecem pausadas.

Consultados: `00_LEIA_ANTES_DE_TUDO.md`, `AGENTS.md`, `REGRAS_DE_PRECEDENCIA.md`, `DECISOES.md`, `PENDENCIAS.md`, `CONFLITOS_DOCUMENTAIS.md`; `BASE_DE_COLETA_V1_0_ORIGINAL.txt` integral (1.085 linhas), `06_ESPECIFICACAO_TELA_A_TELA.md`, `02_TELAS_E_TRANSICOES.md`, `03_CATALOGO_E_MAPEAMENTO.md`, `04_FOTOS_E_ESTADOS.md`, `05_GUIA_VISUAL_MOBILE.md`; `MODELO_CONCEITUAL.md`, `02_FLUXO_DE_INTEGRACAO.md`, `03_CONTRATOS_E_PERMISSOES_PROPOSTOS.md`, contrato de QR/concorrência; `ACEITE.md`, `02_CASOS_DE_TESTE_PRIORITARIOS.md`, publicações anteriores. Aberto visualmente `design/referencias/mobile/00_coleta_mobile_APROVADA.png`, histórico superado na paleta por D-061. Não reintroduzir aparência antiga nem perguntas removidas.

## Comportamento

- Computador/impressora: botão Ambiente abre lista real consultada naquele momento; busca filtra localmente sem gravar resposta. Atualizar lista consulta apenas ambientes, preservando a ficha, o QR e as prévias de fotos.
- Nome já selecionado aparece na ficha. Nenhum ambiente é escolhido automaticamente. Cancelar mantém a seleção anterior.
- Novo ambiente: ação separada, nome explícito, confirmação do servidor e seleção do ID devolvido. Falha mantém o texto; repetir o mesmo nome não duplica. Nomes diferentes continuam diferentes.
- Cartão Ambientes: descrição atualizada e botão Atualizar ambientes. Abrir o cartão consulta a lista atual.
- Teclado não abre ao selecionar ambiente; título recebe foco. Botões de pelo menos 44px, busca opcional, contraste/cores/fontes existentes. Ao fechar, foco retorna ao campo.

## API e compatibilidade

`GET /api/collector/environments?inspectionId=UUID` exige sessão/perfil de coleta e vistoria de unidade ativa dentro do escopo. Devolve apenas ID, nome e tipo dos ambientes daquela unidade; não grava histórico nem revisão.

`POST /api/collector/equipment-save`: novo cliente envia `environmentId` fora do JSON da ficha. Para computador/impressora, ID vazio/inexistente/de outra unidade é recusado com erro junto ao campo; o nome e ID persistidos vêm do catálogo. Validações de foto, versão, trava, estados, QR e reabertura continuam existentes. Outros equipamentos não ganham obrigação de ambiente.

Clientes antigos sem environmentId mantêm a compatibilidade de texto D-057. Não se faz migração nem alteração em cadastros existentes. Recarregar uma aba antiga (após salvar seu preenchimento) recebe o novo controle. Não é atualização colaborativa por websocket nem offline durável.

## Aceite executado

- Suíte de domínio/API: **144 testes aprovados**, incluindo três novos casos de ambientes. Duas contas gravam equipamentos no mesmo ambiente, consultas sem escrita, rejeição de ID estrangeiro/vazio, visualizador/sem sessão/inativa bloqueados, criação concorrente/repetida com mesmo ID e autoria preservada.
- Navegador: **três roteiros aprovados** (ambientes compartilhados, V3 completo e UX). Dois contextos autenticados, tela já aberta antes do cadastro pelo outro operador, seleção sem teclado, cancelamento, falha 503 e repetição, cadastro na seleção, foco do erro, edição, rascunho, QR, sete fotos e conclusão no banco isolado.
- Viewports 390×844, 360×640 e 812×375 sem rolagem horizontal; comparação visual com identidade atual. Testes UX também em 390×660/altura reduzida, preservando foco/cursor durante foto.
- Evidências locais: `evidencias/ambientes-compartilhados-2026-11-09/01-selecao-compartilhada.png`, `02-ficha-com-ambiente.png`, `03-selecao-360.png`, `04-selecao-paisagem.png` e `resultado.json`. Dados explicitamente TESTE ISOLADO; SQLite efêmero e armazenamento de foto em memória nos ensaios.

## Cobertura e limites

Base §§1.1, 2.2–2.3, 4.B, 4.F.1 e 7.3 atendidas nesta fatia: colaboração, vínculo estável, minimização de digitação e controle no servidor. Não conclui todos os requisitos da Base nem das Fases 4/5. Homologação em Android/iPhone físicos, offline durável, revisão/unificação de duplicidades antigas e instalação em 40 PCs permanecem fora deste teste. Nenhuma foto/unidade fictícia foi enviada ao ambiente oficial.

## Publicação

Coletor publicado em **09/11/2026 às 08:26:12 (Fortaleza)**, código `14fd191`, versão **`c23eb70f-4541-4007-a125-5cba581ab87f`**, confirmada ativa em **100%** pelo Wrangler. Build (53 arquivos) e dry-run aprovados; três assets atualizados (`collector-v3.js`, `collector-v3.css`, `collector-environments.js`).

Endereço: https://inventario-semed-lumiar.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev/

Nove verificações HTTP pós-publicação aprovadas: login 200, páginas/assets privados redirecionam e APIs de ambientes/vistoria/foto recusam acesso sem sessão. Navegador real abriu o login; a sessão do coletor não estava ativa, portanto a seleção autenticada em produção não foi exercitada nesta rodada. Não se utilizou credencial antiga, redefinição de senha ou inserção fictícia para contornar isso. Os testes funcionais descritos acima são isolados.

Somente o Worker coletor foi publicado; painel permanece `104e92dc-7b74-4509-9ad9-24c215f7dbc1` da Fase 3. D1, Drive, segredos, protocolo do agente e agendamentos preservados, sem migração ou escrita de teste em produção. Logs e evidências HTTP em `private-data/release-ambientes-2026-11-09/` (fora do Git).

Retorno de código, se necessário: coletor anterior `ef33d619-52da-4726-989c-6a49b551a899`; não exige restaurar banco, excluir ambientes nem desfazer coleta. Nenhum rollback foi executado.
