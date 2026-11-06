# Revisão do questionário reformulado V2

Status: leitura e definição do escopo; implementação e publicação ainda não realizadas nesta revisão.

## Fontes consultadas

- `SEMED_Questionario_Reformulado_V2.txt`, lido integralmente, seções 1–18.
- `SEMED_Questionario_Reformulado_V2.docx`, extraído e lido integralmente, 303 parágrafos.
- `00_LEIA_ANTES_DE_TUDO.md`, `docs/00-governanca/REGRAS_DE_PRECEDENCIA.md`, decisões D-031, D-035, D-043–D-051, pendências e conflitos documentais.
- Implementação atual: `web/collector-schema.js`, `server/collector.mjs`, `web/visit-schema.js` e testes do catálogo.

Conferência: 154 trechos de respostas, regras e listas do TXT encontrados no DOCX após normalização de espaços e marcadores. Não foram identificadas divergências funcionais; apresentação e títulos variam. SHA256 TXT: D25B9394C5FD57376BD0A762989443F0BEFC6B812510DDB9A1425A8F13745EA7. SHA256 DOCX: B375EE1EBB338C49812348256BCFF8DE26A7C1E44D05B9E032BCAD716E59B238.

Esclarecimento explícito do responsável nesta conversa: manter root, admin, operador e visualizador. O item 14 dos arquivos não autoriza reduzir os perfis existentes a dois.

## Fluxo pretendido

| Etapa | Comportamento e aceite |
| --- | --- |
| Unidade e fachada | Lista oficial; coletor não cria unidade. Foto inicial obrigatória; reutilizar histórico em atualização, exigindo nova foto quando declarada alteração relevante. Validar recebimento real no servidor. |
| Acompanhante | Perguntar se há acompanhante. Responder Não libera continuidade sem justificativa. Quando Sim, mostrar nome, função e telefone; obrigatoriedade individual permanece pendente. |
| Internet | Existência, links repetíveis, provedor, tecnologia, velocidade contratada, funcionamento, quedas/frequência, qualidade e satisfação distintas. Teste opcional; guardar origem/momento e não atribuir dados móveis ao link escolar. |
| Wi-Fi | Fichas repetíveis de SSID, existência de senha, segredo protegido quando informado, qualidade geral e observações. Sem avaliação por sala e sem depender de ambientes. |
| Computadores | Apenas desktop/notebook nesta fase. Ambiente obrigatório, patrimônio ou situação explícita, conservação, funcionamento e uso. Identificação disponível, descrição de defeito sem ação/prioridade obrigatórias. Fotos opcionais. Modo manual com motivo; modo agente depende de integração real. |
| Impressoras | Ambiente e funcionamento; foto inicial obrigatória, reaproveitável em atualização sem alteração. Identificação, origem, aquisição, suprimentos, conexão/IP/SSID e credenciais opcionais protegidas conforme disponibilidade. Sem monitoramento, toner ou estoque detalhado. |
| Problemas e necessidades | Resumo das informações já registradas sem redigitação. Ocorrências adicionais e solicitações opcionais, com tipo/descrição quando adicionadas. Fotos opcionais inclusive para falhas visíveis. Solicitações não contam como bens existentes. |
| Revisão | Mostrar registros e pendências; nenhuma categoria exige quantidade mínima. Concluir manualmente somente após validação online e envio das fotos exigidas. Visita concluída não afirma inventário completo. |

Ambientes são um recurso transversal: nome obrigatório ao criar, tipo e foto opcionais, reutilização e histórico. A contagem prévia de ambientes deixa de ser obrigatória. Avisos de nomes semelhantes não bloqueiam automaticamente.

## Mudanças de regra que precisam alcançar o servidor

- Não basta ocultar D/E/G: as validações antigas de revisão não podem exigir esses cartões na nova versão.
- A nova regra de fotografias substitui a obrigação de evidência/justificativa de falha visível apenas na versão reformulada. Fotos obrigatórias passam a fachada inicial e impressora inicial/alterada.
- Coincidência de patrimônio/série deve gerar indicação para análise, sem bloquear cadastro nem exigir justificativa de duplicidade durante a coleta V2.
- Não impor ação recomendada e prioridade a defeitos de computadores.
- Não obrigar itens de categorias vazias e não interpretar silêncio como inexistência.
- Preservar identificadores permanentes, autores, versões, fotos e registros não conferidos. Dados antigos não são apagados porque a nova visita não os inclui.
- Não reutilizar automaticamente o roteiro experimental `visita-2`: ele exige laboratório, avaliações elétricas e fotos de computadores, incompatíveis com esta especificação.

## Pendências expressas e limites de integração

O próprio documento deixa pendentes a obrigatoriedade dos dados do acompanhante, campos “solicitar” das impressoras, impacto/prioridade/origem de ocorrências e detalhes das necessidades. Até definição, não torná-los bloqueios novos.

O escopo também inclui projetos técnicos além da troca de perguntas:

1. Credenciais: armazenamento cifrado separado, chaves protegidas, autorização de leitura e auditoria sem valores secretos. Nunca salvar senha no JSON comum, histórico de respostas, exportações ou URL.
2. Agente: API autenticada, vinculação QR de uso limitado, identidade única, histórico e estados de comunicação. Protótipo externo não equivale a integração publicada.
3. Teste pelo celular: validar provedor/método, consumo e associação ao link; não simular medição.
4. Offline: persistência protegida de dados/fotos, retomada após fechamento, fila idempotente e conflitos; prévia em RAM não satisfaz esse requisito.
5. Unificação/reversão: seleção campo a campo, preservação integral e aprovação por conta distinta. Permissão do responsável superior precisa ser definida.
6. Fotos: conexão institucional e teste real do armazenamento continuam necessários; campo de câmera não prova upload operacional.

A frase “unidades autorizadas” do documento não determina por si só retorno à atribuição individual. Preservar D-046 até decisão explícita sobre restringir unidades. O pedido de manter quatro perfis não concede automaticamente novas operações de root ao admin.

## Etapas de implementação e testes de aceite

1. Versionamento e persistência: nova versão explícita; visitas antigas retomam seu formulário, novas usam contrato V2 após ativação. Testar leitura de legado, idempotência, histórico, conflitos e ausência de alteração por navegação.
2. Fluxo e fichas: acompanhar, internet/Wi-Fi, ambientes no contexto, computadores e impressoras, resumo e revisão. Testar Não há acompanhante, Não há internet, zero equipamentos, múltiplas redes/links, muitos itens e retorno livre entre etapas.
3. Evidências e segredos: câmera/galeria vinculadas ao registro; validação de foto realmente recebida; reutilização histórica; leitura auditada de credenciais. Testar falha de envio, permissão negada, acesso indevido e ausência de segredos em respostas comuns.
4. Atualização e administração: conferência, Não localizado com justificativa, duplicidades sem bloqueio, unificação e reversão separada. Testar totais sem duplicação e manutenção de IDs/fotos/histórico.
5. Integrações: agente/QR, teste de velocidade e offline em cenários reais. Homologar Chrome Android/Safari iPhone, interrupção/reabertura, edição concorrente e reconexão.
6. Entrega: screenshots reais do novo fluxo, relatório de cobertura por item do TXT e roteiro de testes em TXT. Publicação não deve ser descrita como concluída antes da verificação do ambiente real.

Arquivos prováveis: novo contrato versionado de questionário e validadores compartilhados; `web/collector.js`, `web/collector.css`, `web/collector-navigation.js`, `server/collector.mjs`, leitura dos resultados desktop, migrações aditivas necessárias e testes. Os originais recebidos e a Base v1.0 permanecem intactos.

Nenhum aplicativo, banco oficial, perfil ou registro foi modificado por esta análise.
