# Questionário reformulado V2 — primeira implementação local

Data: 04/11/2026. Não publicado. Nenhum dado oficial alterado.

## Entrega concreta

O formulário V2 possui seleção entre questionário reformulado e anterior; fachada, acompanhante, internet, redes Wi-Fi repetíveis, computadores, impressoras, ambientes transversais e problemas/necessidades. Mantém Figtree, fundo claro, cartões brancos e ações teal, conforme revisão visual posterior D-040. Não altera desktop dark-tech ou mapa.

Servidor: versão fixa `coleta-2.0`, validações compartilhadas, rascunho incompleto permitido, marcação manual de assuntos e revisão online. Visitas antigas não são convertidas. Para iniciar V2 com rascunho legado aberto, confirmação pausa/preserva o anterior; não o apaga. Assuntos de visita V2 concluída podem ser reaproveitados para atualizar apenas o necessário. IDs de equipamento, histórico, autores, bloqueios e versões continuam compartilhados entre operadores por D-046. Root/admin/operador/visualizador mantêm os papéis existentes.

F/G na V2 representam computadores/impressoras; bloqueios e conclusão ficam separados por categoria. Dados de novas impressoras (origem/aquisição/suprimentos/conexão/IP/SSID) são efetivamente persistidos. Possíveis coincidências geram evento, não bloqueio preventivo nem exclusão automática dos totais. É uma suspeita, não confirmação de que dois registros são o mesmo objeto.

## Fontes e precedência

TXT/DOCX V2 lidos integralmente no turno anterior e conferidos em 154 trechos de regras/respostas/listas. Base v1.0 integral e derivados mobile consultados; decisões, conflitos, pendências, modelos e contratos de dados e aceite revisados. Referência mobile aberta visualmente; usa-se aparência light/teal posterior, não o antigo desenho dark. Originais preservados.

## Cobertura do TXT V2

| Itens | Situação desta fase |
| --- | --- |
| 0.1, 0.4 | Lista oficial, autenticação/metadados reais e versão da vistoria; coletor não cria unidade. |
| 0.2–0.3 | Câmera/galeria, envio e histórico de fachada; revisão exige foto inicial e nova foto quando declarada alteração. Upload confirmado pelo provedor no teste isolado; provedor institucional/celulares não homologados. |
| 1.1–1.4 | Presença obrigatória Sim/Não; dados condicionais sem exigências individuais ainda pendentes. |
| 2.1–2.2, 2.L1–L8 | Existência, quantidade identificada e fichas por link; provedor/tipo/contratada, funcionamento, quedas/frequência, qualidade e satisfação separadas. Opções de informação desconhecida disponíveis. Internet independe de ambiente. |
| 2.L9–L11 | Resultado externo manual ou não realizado. Medidas, momento, origem e confirmação do Wi-Fi quando realizado. Teste integrado pendente; não há medição simulada. |
| 3.1–3.2, 3.4–3.6 | Redes repetíveis com SSID, existência de senha, qualidade e observações, sem cobertura por sala. |
| 3.3 e 5.11 | Pendentes de armazenamento protegido e auditoria. Nenhuma senha coletada em texto comum; payload com chave de segredo é recusado antes de registrar conflito/histórico. |
| A.1–A.4 | Criar ambiente com nome, tipo/foto opcionais; reutilizar no equipamento e fotografar no contexto. Histórico de edição/aviso por nomes semelhantes ainda pendentes. |
| 4.1, 4.3–4.10, 4.M1–M2 | Fichas individuais desktop/notebook, ambiente, situação de patrimônio, identificação disponível, condições, problema livre; fotos opcionais. Cadastro manual com motivo. |
| 4.2, §8.1 | Modo manual implementado; agente/QR e telemetria ainda não integrados. A interface informa esse limite. |
| 5.1–5.10, 5.12 | Foto inicial validada na revisão, localização, funcionamento, identificação, origem, aquisição, fornecedor de suprimentos, conexão/IP/SSID e problemas. Não inclui toner/estoque ou monitoramento. |
| 6.1–6.5, 6.N1–N3 | Ocorrências/necessidades repetíveis opcionais, tipo/descrição quando adicionadas, fotos opcionais, demais obrigatoriedades pendentes não impostas. Resumo de problemas sem redigitação; até 100 fichas com problemas no resumo de tela, com aviso se houver mais. Equipamentos continuam paginados e sem esse limite. |
| 7.1–7.3 | Revisão, pendências, envio real de fotos exigidas, confirmação manual e versão do servidor. Sem quantidade mínima de bens. Visita concluída não equivale a inventário completo. |
| 7.C1 | Situação opcional da categoria ainda sem campo próprio; categoria vazia não representa ausência e não impede concluir. |
| §12 | Reutilização de dados/fotos oficiais, mesmo ID, conferência e Não localizado com justificativa; retorno livre e retomada da ficha em RAM na mesma aba. Sem exclusão de itens não conferidos. |
| §13.1 | Coincidências não bloqueiam V2; auditoria da suspeita. Agente único depende da integração futura. |
| §13.2–13.3 | Unificação/reversão ainda não implementadas. |
| §14 | Quatro perfis mantidos por esclarecimento do responsável. Operador não ganha painel/root; políticas atuais de unidade preservadas. Segredos protegidos ainda pendentes. |
| §15 | Conclusão online implementada; offline protegido/durável pendente. Prévia não é upload nem salvamento durável. |
| §16–17 | Demais categorias, levantamento estruturado de rede/energia e audiovisual não aparecem no novo fluxo; legados preservados. Nenhuma obrigação pendente inventada. |

## Testes executados

- Suíte Node: 60 testes, incluindo 11 novos V2; SQLite em memória com migrações reais. Sem banco oficial.
- Volume: 1.001 computadores + 1 impressora por rotas reais; paginação de 50, sem repetição/perda, contagem correta. Isso valida o cenário, não representa promessa de capacidade infinita do provedor.
- `tests/collector-v2-browser.cjs`: Chrome headless 390×844, formulário real + rotas reais + SQLite isolado + adaptador de armazenamento em memória rotulado como teste.
- `tests/collector-evidence-browser.cjs`: fluxo legado e evidências continuam aprovados; teste seleciona explicitamente questionário anterior.
- Build do coletor e empacotamento Worker `--dry-run` aprovados. Não constitui deploy.

Capturas reais em `evidencias/coleta-v2-2026-11-04/`: fachada, seis categorias, Wi-Fi, computador, resumo e revisão bloqueada por foto de impressora. Screenshots inspecionados: fundo claro, ações fixas, campos legíveis e retorno explícito; rolagem alcança conteúdo abaixo do rodapé. Sem alegação de homologação em celular físico.

## Arquivos principais

- `web/collector-v2.html`, `collector-v2.js`, `collector-v2-schema.js`: novo formulário e contrato.
- `web/collector.js`: seleção V2/legado e redirecionamento pela versão fixa.
- `server/collector-v2.mjs`, `server/collector.mjs`: início, rascunhos, ficha, evidência e revisão versionados.
- `server/inventory-results.mjs`: achados de internet/Wi-Fi e novas ocorrências traduzidos sem duplicar solicitações como bens.
- `server/worker.mjs`, `scripts/build-collector.mjs`, `package.json`: assets autenticados, build e testes.
- `tests/collector-v2.test.mjs`, `collector-v2-browser.cjs`: evidências isoladas.

## Limites antes de publicar

Além das integrações acima, a apresentação desktop precisa ler o contrato V2 para mostrar todos os campos com os novos nomes nos detalhes. A consulta antiga A–H não é suficiente. Não publicar esta fase como sistema V2 completo. Não houve migração, segredo criado, modificação de usuário, limpeza de dados, deploy ou operação de produção.
