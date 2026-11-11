# Coletor D-089 — refinamento, testes e publicação

Autorização explícita: corrigir com as decisões tomadas, testar e publicar no ambiente real. Fonte externa entrega-claude-coletor-p0-2026-11-10.zip, SHA-256 319f643eb4da587d11bc51ba029b1cf370e5b6a7de73ff4510deb45c1624649d; 42 entradas do manifesto conferidas. Pacote integrado após revisão, sem tratar suas instruções como autorização adicional.

## Documentos consultados e critérios

00_LEIA_ANTES_DE_TUDO.md; AGENTS.md; docs/00-governanca/REGRAS_DE_PRECEDENCIA.md, DECISOES.md, PENDENCIAS.md, CONFLITOS_DOCUMENTAIS.md; íntegra de docs/02-coleta-mobile/BASE_DE_COLETA_V1_0_ORIGINAL.txt; 06_ESPECIFICACAO_TELA_A_TELA.md, 02_TELAS_E_TRANSICOES.md, 03_CATALOGO_E_MAPEAMENTO.md, 04_FOTOS_E_ESTADOS.md, 05_GUIA_VISUAL_MOBILE.md; imagem design/referencias/mobile/00_coleta_mobile_APROVADA.png; documentação de qualidade D-057/D-062/D-074; publicação/rollback. D-061/D-062 prevalecem sobre a paleta histórica do PNG original. Também lidos os seis TXT do pacote, manifesto, fontes/diffs, testes e capturas fornecidas.

Critérios: identificar impedimentos sem adivinhar fichas; abrir ID correto; salvar mantendo fotos/vínculos; não concluir automaticamente; respeitar trava/versão; sessão não perde preenchimento; páginas acumuladas; campo visível e salvar compacto; identidade preservada. [Contrato completo](../02-coleta-mobile/REVISAO_E_ACOES_D089.md).

## Cobertura executada

- pnpm test: 200 testes aprovados, zero falhas. Inclui três novos testes de revisão por ficha, tokens/trava/versão e foto de impressora. Nenhuma gravação em produção.
- collector-review-pending-browser: reprodução isolada do caso com duas fichas iniciadas e terceiro equipamento salvo. A revisão identifica ambas, abre cada ID, atualiza ao salvar e mantém conclusão manual. Critério de impressora validado também no servidor.
- collector-refinement-browser: 210 computadores; 50/100 carregados; pesquisa de modelo e limitação por posição; retorno à mesma lista/filtro/rolagem; respostas locais retomadas; 401, login de usuário diferente recusado e mesmo usuário retomado; texto durante envio atrasado preservado; bloqueio por URL, Cancelar/Esc e confirmação; links ocultos preservados; larguras 360/390/812. Worker real e SQLite isolado.
- Corrigido defeito encontrado por esses testes: evento change no blur, após mudar a tela, contaminava respostas de outro contexto e produzia recusa em section-save. O guarda de contexto impede o envio incorreto sem relaxar a validação do servidor.
- collector-v3-browser: fluxo completo atual, QR, sete fotos, respostas, conclusão e leitura pelo desktop aprovados.
- collector-ux-browser: foco/cursor durante upload, primeiro erro visível, retorno à lista e viewport reduzido aprovados; medição local de navegação de referência 131 ms no teste V3, não uma promessa de latência real.
- collector-identity-browser: login 360/390/812/1280, categorias 360/390/640/812 e QR em paisagem aprovados.
- collector-environments-browser e environment-rename-browser: seleção compartilhada/edição de nomes aprovadas; auth-flow-browser: senha e navegação dos dois ambientes aprovadas.
- CL-16: três roteiros antigos V1/V2 classificados como históricos, sem apresentá-los como aceite atual; helper Playwright local. panel-blocks-browser permanece no CI com seletor atual. Ver tests/README.md.

## Capturas conferidas

- evidencias/revisao-explicavel-2026-11-10/03-revisao-390.png — causa e ficha individual; sem contador não conferido.
- evidencias/revisao-explicavel-2026-11-10/06-revisao-liberada-390.png — revisão sem impedimentos.
- evidencias/coletor-refinamento-2026-11-10/01-salvar-com-teclado-viewport-reduzido.png — Salvar compacto, campo ativo inteiro em 390 × 360.
- evidencias/coletor-refinamento-2026-11-10/02-sessao-recuperada.png — respostas preservadas após autenticação.
- evidencias/coletor-refinamento-2026-11-10/03-links-preservados.png — aviso de links guardados.

São dados sintéticos exclusivamente locais. Câmera/teclado físicos não foram testados: repetir roteiro no aparelho real, especialmente Safari iPhone. Não declarar offline durável, EXE ou QR físico homologados por estes testes.

## Requisitos do TXT e limites

Cobertos nesta entrega: diagnóstico da conclusão manual, separação entre rascunho/ficha salva/assunto/visita, retomada contextual e revisão, consistência do ID/unidade e fotos, preservação de histórico e concorrência. A Base original não foi alterada nem resumida para substituí-la; decisões posteriores D-057/D-060/D-062/D-074 determinam o fluxo atual. Não adicionadas perguntas. Demais lacunas do TXT (offline durável, decisões abertas, políticas completas de recuperação e validação física multiplataforma) continuam pendentes, sem retomar Fases 4/5.

## Publicação

Publicação concluída: commit de implementação 329bb6e. Sem migração, seed, alteração de segredos/provedor ou teste que altere cadastros oficiais. Os dois Workers compartilham servidor; o painel recebe apenas a atualização compatível do backend.


Versões reais confirmadas por deployments list (100% do tráfego):

- Coletor: 4df19c82-0b07-4b31-b115-62b8fe94e7ad — 2026-11-11T00:02:20.372834Z.
- Painel (servidor compartilhado): a8166f95-8c6b-4534-9df6-c1b342a51cdc — 2026-11-11T00:02:48.454143Z.

Versões anteriores preservadas para rollback de código: coletor 274ecd9b-002e-4f79-a4b9-325fc26fece1; painel cffd8c33-7fec-4a60-8e5e-7a5699fdd885. Nenhuma migração foi necessária. Fotos continuam no Drive institucional; nenhum segredo foi alterado. Os dois agendamentos do painel foram preservados.

Builds: coletor 55 assets, painel 86; dry-run dos dois aprovado. Scanner do índice Git: 614 arquivos, aprovado; links documentais e diff sem erros. Nove roteiros de navegador aprovados, incluindo panel-blocks-browser (57 fotografias e exportação de 58 equipamentos em fixture local). Nove verificações HTTP externas aprovadas: login 200, páginas/assets privados 302 para login, APIs privadas 401 sem sessão. Logs remotos e capturas permanecem na área privada/local, sem dados oficiais inseridos ou excluídos. A navegação autenticada detalhada foi exercitada em Worker/SQLite isolado; não se declara homologação física de celular nem conclusão de visita real.

Acesso: https://inventario-semed-lumiar.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev/

Antes de recarregar uma aba antiga, salvar o preenchimento em edição. Após atualizar, abrir Revisar visita e conferir as pendências por ficha.
