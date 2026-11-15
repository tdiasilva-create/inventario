# D-116 — refinamento da coleta rev3 publicado

O responsável autorizou explicitamente integrar a revisão 3, executar os testes finais e publicar, mantendo permissões e localização dos técnicos. Publicação realizada em 14/11/2026, às 11:05 Fortaleza. Este registro substitui a condição “somente revisão local” dos registros anteriores, preservados como histórico.

## Origem, escopo e integração

Pacote `COLETA_REFINO_CLAUDE_REV3_2026-11-14.zip`, SHA-256 `dbabc151f4c033868b3b183140792e175bf3d7b03f49ac3baa5fae80aa6b28d6`, base `09442d0d24de214694c0236018837335b3b83068`. A [revisão independente](REVISAO_REFINO_COLETA_REV3_2026-11-14.txt) permanece como evidência dos defeitos corrigidos e das quatro sondas adicionais. Antes da integração, repetida conferência dos 175 hashes do pacote e dos nove arquivos anteriores: nenhuma divergência.

Integrados, sem reescrever a proposta aprovada:

- `web/collector-v3.js`, `web/collector-v3.css`: novo visual, blocos de ficha, estados e tratamento de concorrência/fotos pendentes.
- `web/mobile-app.html`, `web/mobile-app.css`, `web/mobile-app.js`: apresentação do shell e identificação da conta na confirmação de saída.
- `web/collector-dialog.js`, `web/collector.js`, `web/collector.css`: compatibilidade dos diálogos e áreas de coleta.
- `tests/mobile-app-browser.cjs`, `tests/collector-concurrency-browser.cjs`, `scripts/capture-coleta-refino.cjs`: regressões e capturas reproduzíveis.

Nenhuma fonte em `server/`, `android/`, `migrations/` ou `shared/` foi modificada nesta integração. Perguntas, QR, regras de permissão, localização D114 e autenticação D115 preservados. Sem nova migração, alteração de plano, secrets, contas, habilitação técnica, unidades, equipamentos ou fotografias de teste em produção. Ambos os builds usam o servidor compartilhado atual; o coletor independente estava na publicação anterior D108. A publicação promove o código compartilhado atual também nesse endereço, com rotas restritas por `APP_KIND=collector` e regressões completas aprovadas.

Mantidas as escolhas: blocos da ficha; navegação entre assuntos da mesma unidade durante foto; somente estados individuais dos assuntos. Upload captura o ID original; foto selecionada que falhou deve ser reenviada ou sua prévia descartada explicitamente antes da conclusão. Foto opcional não foi transformada em campo obrigatório. Rascunho concorrente não pode ser apresentado como ficha completamente salva.

## Testes finais na árvore integrada

- `node --test --test-concurrency=1 tests/*.test.mjs`: **301 aprovados, zero falhas**, incluindo permissões, rastreamento e D1.
- `collector-concurrency-browser.cjs`: **22 verificações aprovadas**, inclusive falhas antes/depois do envio, conflito da mesma conta, alvo de foto, leitura atrasada, ausência de duplicação e pendência no `/app`.
- `mobile-app-browser.cjs`: troca de áreas, preservação de respostas, sessão e ponte nativa simulada aprovadas, usando o build final.
- `technician-tracking-browser.cjs`: fluxo D114 aprovado; GPS simulado, não físico.
- `collector-refinement-browser.cjs` e `collector-review-pending-browser.cjs`: navegação, revisão por ficha, paginação, rascunhos e retomada aprovados.
- `capture-coleta-refino.cjs`: **31 screenshots reais da implementação local**, zero erros JavaScript; categorias e ficha em 390×844 abertas visualmente. Dados explicitamente isolados.
- Builds: coletor **56 arquivos**; painel **139 arquivos/9 bundles**, incluindo o APK já existente. `git diff --check` aprovado.

Os demais dez roteiros e as quatro sondas independentes já haviam passado na revisão com estes mesmos hashes. Não se declarou uma segunda execução deles nesta integração. Capturas curtas simulam área de teclado; não substituem teclado Android físico.

Cobertura da Base original preservada: seleção de unidades oficiais, categorias/estados, navegação livre, conclusão manual, salvamento versus conclusão, câmera/galeria e vínculo por equipamento, versões/conflitos e sessão/permissões (§§3, 7–9 e 13, conforme decisões posteriores). Sem implantação de offline durável, autosave integral, novas perguntas, busca global do coletor, fusão de duplicados ou conclusão automática. A Base original permanece intacta.

## Publicação e conferência remota

| Destino | Horário Fortaleza | Versão, 100% do tráfego |
|---|---|---|
| Coletor independente | 11:05:21 | `7f6b559e-3bec-433f-b45e-90b29977f394` |
| Painel e app unificado | 11:05:41 | `79d0598b-6e8d-40da-81b4-f1144126caae` |

D1 compartilhado, Drive privado, KV do painel e cron `23 3 * * *` / `* * * * *` preservados. Não foi necessária exportação ou restauração do banco para uma entrega de código/assets sem migração. Nenhum novo polling adicionado pelo refinamento.

**104 verificações HTTP aprovadas**, somente leitura ou chamadas recusadas sem credenciais: 14 do app; 51 do painel; 11 técnicas; sete da barreira de localização; 21 específicas dos dois endereços. Incluem APIs privadas, redirects, mesma origem, hashes de assets públicos e APK. A sonda inicial presumiu incorretamente que `collector-v3.css` era público; confrontada com o Worker, foi corrigida para exigir o redirect autenticado já previsto, sem alterar o servidor. Assets privados não foram liberados para facilitar teste.

APK **1.0.3, versionCode 4**, 33.246 bytes, SHA-256 remoto `6aebf056b489200456eb7f0a596d28c0f89fc6b0b68e13b29c98f9f585120a81`, igual ao binário anterior. **Não é necessário reinstalar o APK para receber este refinamento.** Salvar e aguardar fotos antes de fechar/reabrir a tela. Recarregar não é uma forma de preservar respostas pendentes.

Na primeira conferência, o app solicitou login. Após o responsável entrar como root, foi realizada a conferência autenticada descrita abaixo. Fotografias e GPS físicos continuam fora desta verificação de navegador.

## Complemento — conferência autenticada e correção de saída, 11:38 Fortaleza

Com a conta root já autenticada, conferidos lista de unidades, fachada/câmera/galeria, assuntos com estados individuais, ficha do computador em blocos e revisão com causas de pendência e acesso direto à pergunta. A conta só mostrou Coleta porque não possui habilitação técnica; nenhuma permissão foi alterada para o teste.

Encontrado no navegador real: confirmar “Descartar e trocar” de uma ficha local ainda deixava `item` pendente; `beforeunload` repetia a confirmação e impedia retornar à lista. Reproduzido antes da correção pelo teste `tests/collector-unit-navigation-browser.cjs`. Agora a saída aguarda os demais rascunhos, libera a trava e limpa somente a referência da ficha cujo descarte foi confirmado. As barreiras de fotos em preparação/envio/prévias e de falhas de salvamento permanecem.

Regressão nova aprovada nos dois contextos (coletor independente e iframe do app): cancelar mantém a resposta local; confirmar descarte retorna à lista sem segundo diálogo; nenhum equipamento gravado. Reexecutados com sucesso os 22 cenários de concorrência/fotos, integração do app D115 e fluxo D114 com GPS simulado. Builds refeitos. Mais 53 verificações HTTP aprovadas após este ajuste (14 app, 11 técnico, sete tracking e 21 específicas); APK 1.0.3 com mesmo hash. A suíte geral de 301 testes e as 104 verificações iniciais acima pertencem à integração, não a uma nova execução integral deste complemento.

Versões atuais, ambas com 100% do tráfego:

| Destino | Horário Fortaleza | Versão |
|---|---|---|
| Coletor independente | 11:38:10 | `e90229c7-e2cf-44ec-adb6-598fe1557113` |
| Painel/app | 11:38:32 | `53ce528f-fdb9-4a34-9916-cb3e7a65398e` |

Após a publicação, repetido o caso autenticado na visita já aberta do Almoxarifado: ficha vazia apenas na memória → assuntos → trocar unidade → descarte confirmado → lista de unidades, sem diálogo nativo nem erro/aviso no console. Não foram preenchidas respostas, salvos equipamentos, anexadas fotos ou concluídas visitas. A aba anterior, com a ficha vazia criada por esta conferência, foi fechada; a nova aba ficou na lista de unidades. Screenshot real em `private-data/release-coleta-d116/producao/coleta-ficha-real.jpg`; logs `unit-navigation-before.log`, `unit-navigation-after.log`, `*-after-navigation.log`, `deploy-*-navigation.log` e `after-*-navigation.log`. Homologação de câmera/QR/teclado/GPS no celular permanece necessária.

## Evidências e retorno

Registros privados em `private-data/release-coleta-d116/`: `integration.json`, cópias anteriores em `before/`, logs dos testes, `concorrencia/`, `capturas/`, registros de deploy e versões antes/depois, `producao/`. Evidências locais não contêm dados oficiais de teste. Capturas selecionadas em `docs/05-qualidade/evidencias/refino-coleta-d116/` (fora do Git).

Rollback de código, se necessário: painel anterior `77c27c3b-b823-4a0e-a362-0854516403d0`; coletor anterior `c678978a-9e71-4cab-a2dc-9744ec6d6e1c`. Reverter ambos para consistência visual; sem reverter banco, apagar registros ou desinstalar aplicativo. O APK/serviço de localização é o mesmo.

Pendentes de homologação física: câmera/galeria e QR reais; teclado/rotação/Voltar; queda/retorno de rede; troca Técnico/Coleta com localização e tela bloqueada; particularidades Android/Safari/HEIC. Latência/D1 diário em produção não foram medidos nesta entrega. Ver [roteiro de conferência no celular](../06-entregas/TESTE_COLETA_REFINADA_D116_2026-11-14.txt).

Links:

- https://inventario-semed-lumiar.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev/
- https://painel-semed-paco.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev/app
