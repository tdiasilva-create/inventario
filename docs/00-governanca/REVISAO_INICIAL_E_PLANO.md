# Revisão inicial — 27/10/2026, antes do código

Pacote extraído: `SEMED_CODEX_PACOTE_DEFINITIVO_DOCUMENTACAO_E_IMAGENS.zip`. Este repositório é a fonte oficial. Prompts históricos não são novas solicitações.

## Índice nominal de leitura

- Raiz: `00_LEIA_ANTES_DE_TUDO.md`, `AGENTS.md`, `PLANO_DE_EXECUCAO_CODEX.md`.
- `docs/00-governanca/`: `INVENTARIO_DAS_FONTES_E_LACUNAS.md`, `REGRAS_DE_PRECEDENCIA.md`, `DECISOES.md`, `PENDENCIAS.md`, `CONFLITOS_DOCUMENTAIS.md`, `RASTREABILIDADE.md`.
- `docs/01-projeto/VISAO_E_ARQUITETURA.md`.
- `docs/02-coleta-mobile/`: `BASE_DE_COLETA_V1_0_ORIGINAL.txt` (1.084 linhas, integralmente: blocos 1–350, 351–700, 701–1084 após saída inicial truncada), `CATALOGO_DE_CAMPOS_EXTRAIDO.csv`, `02_TELAS_E_TRANSICOES.md`, `03_CATALOGO_E_MAPEAMENTO.md`, `04_FOTOS_E_ESTADOS.md`, `05_GUIA_VISUAL_MOBILE.md`, `06_ESPECIFICACAO_TELA_A_TELA.md`, `INTERFACE_E_FLUXOS.md`.
- `docs/02-coleta-mobile/grupos-originais/`: `GRUPO_A_TRANSCRICAO_FIEL.txt`, `GRUPO_B_TRANSCRICAO_FIEL.txt`, `GRUPO_C_TRANSCRICAO_FIEL.txt`, `GRUPO_D_TRANSCRICAO_FIEL.txt`, `GRUPO_E_TRANSCRICAO_FIEL.txt`, `GRUPO_F_TRANSCRICAO_FIEL.txt`, `GRUPO_G_TRANSCRICAO_FIEL.txt`, `GRUPO_H_TRANSCRICAO_FIEL.txt`. CSV e grupos são índices, não substitutos da Base.
- `docs/03-painel-desktop/`: `02_TELAS_E_INTERACOES.md`, `03_INDICADORES_E_CRITERIOS.md`, `04_ESPECIFICACAO_SETORES.md`, `ESPECIFICACAO_DE_INTERFACE.md`, `ESPECIFICACAO_VISUAL_ANTERIOR.md`.
- `docs/04-dados-apis/`: `02_FLUXO_DE_INTEGRACAO.md`, `03_CONTRATOS_E_PERMISSOES_PROPOSTOS.md`, `MODELO_CONCEITUAL.md`.
- `docs/05-qualidade/`: `02_CASOS_DE_TESTE_PRIORITARIOS.md`, `03_CHECKLIST_DE_ENTREGA.md`, `ACEITE.md`.
- `design/`: `COMO_USAR_CADA_IMAGEM.md`, `GUIA_LEITURA_DAS_IMAGENS.md`, `MANIFESTO_REFERENCIAS.md`.
- `arquitetura/DIAGRAMAS_E_STATUS.md`; fontes `01_ARQUITETURA_GERAL.dot`, `02_FLUXO_COLETA_MOBILE.dot`, `03_RELACIONAMENTOS_DE_DADOS.dot`, `04_ESTADOS_DE_SINCRONIZACAO.dot`, `05_DESKTOP_NAVEGACAO.dot`.

## Inspeção visual realizada

- `design/referencias/mobile/00_coleta_mobile_APROVADA.png`.
- `design/referencias/desktop/00_painel_geral_APROVADO.png`.
- `design/referencias/desktop/01_mapa_da_rede_APROVADO.png`.
- `design/referencias/desktop/02_matriz_equipamentos_APROVADA.png`.
- `design/referencias/desktop/03_unidade_selecionada_APROVADA.png`.
- `design/referencias/desktop/04_indicadores_integrados_ESTUDO_APROVADO.png`.
- `arquitetura/01_ARQUITETURA_GERAL.png`, `02_FLUXO_COLETA_MOBILE.png`, `03_RELACIONAMENTOS_DE_DADOS.png`, `04_ESTADOS_DE_SINCRONIZACAO.png`, `05_DESKTOP_NAVEGACAO.png`.

Diagramas são DERIVADOS, não novos requisitos. Originais preservados. Arquivos avulsos recebidos: `ABRA_IMAGENS_E_DIAGRAMAS.html`, `BASE_DE_COLETA_V1_0_ORIGINAL.txt`, `06_ESPECIFICACAO_TELA_A_TELA.md`, `01_ARQUITETURA_GERAL.png`, `Imagem do ChatGPT 27 de out. de 2026, 06_47_01.png`; os equivalentes canônicos são os do pacote, sem assumir aprovação de conteúdo adicional.

## Quadro de decisões APROVADAS

| Decisão | Fonte | Aplicação |
|---|---|---|
| Coleta e análise são interfaces distintas | TXT §§0–1 | Começar mobile, sem dashboard |
| D1 dados, R2 fotos, Workers controla acesso | §1.2/D-002 | Sem segredos no cliente |
| Inventário contínuo, ID permanente e histórico | §§1,9 | Revisita não duplica bem |
| Unidades oficiais e autorizadas; só admin mantém catálogo | §2.5 | Sem criar escola no coletor |
| Cartões A–H livres em ordem sugerida | §3.2 | Bloqueio só de etapa dependente |
| Conclusão manual, reabertura confirmada, sem percentual geral | §3.3 | Estado escrito no cartão |
| A híbrido; B contagem e identificação de ambientes | §4.A/B | Vínculos reutilizados |
| C/D/E condicionais; falhas visíveis com foto ou justificativa | §4.C–E | Não impor foto de equipamento |
| F individual/híbrido conforme categoria; técnicos opcionais | §4.F | CPU opcional; patrimônio texto |
| G é navegação de F; H consolida sem duplicidade | §4.G/H | Um bem, um registro |
| Fotos 0–5/equipamento; câmera/galeria | §5 | Sem vídeos/documentos/desenho |
| Questionário versionado | §6 | Vistoria mantém versão inicial |
| Auto + Salvar; local, sync e oficial distintos | §7 | Não simular persistência |
| Revisão explícita e confirmação do servidor | §7.5 | Sem sucesso oficial fictício |
| Dois perfis, usuário/senha, cadastro/reset por admin | §8 | Sem autocadastro, CPF ou matrícula |
| Conflitos, duplicidades e movimentações auditáveis | §§7–9 | Sem último a salvar ganha |
| Backup diário/7 dias/restore trimestral | §10 | Integridade D1/R2 exige prova |

## Telas previstas

| Interface | Telas |
|---|---|
| Mobile M01–M04 | Login, início/retomada, unidade autorizada, cartões |
| M05-A–H | Identificação, ambientes, internet, rede, energia, equipamentos, audiovisual, necessidades |
| M06–M12 | Identificação do bem, técnicos opcionais, condições, problemas, fotos, existente, lote |
| M13–M15 | Audiovisual compartilhado, necessidades, salvar/retomar |
| M16–M20 | Revisão, envio, confirmação do servidor, conflitos, sessão/offline |
| Desktop P01–P05 | Panorama, mapa, matriz, unidade selecionada, indicadores integrados |
| Desktop P06–P09 | Ambientes, ocorrências, relatórios/planejamento/exportação, administração |

## Conflitos e pendências

Preservar C-01–C-12: C.5 não prevê zero links para escola sem internet; arte não aprova GPS/distância ou percentual geral; G/F compartilham fichas; fotos de equipamentos opcionais; obrigatório sincronizado difere de foto opcional pendente.

P1 validação personalizada; P2 sessão; P3 janela/teto offline; P4 retenção local; P5 compressão/formatos; P6 fotos de lote; P7 critérios de prioridade; P8 proteção/desbloqueio offline; P9 backup consistente; P10 identidade final (referência mobile recuperada, ativos oficiais ausentes); P11 editabilidade do questionário. Nenhum valor pendente será fixado como aprovado.

Faltam catálogo oficial/permissões, brasão autorizado, coordenadas, recursos Cloudflare e fórmulas/ações finais desktop. Prototipar em DEMO isolada, sem gravar no D1 oficial.

## Plano com testes de aceite

| Fase | Entrega | Aceite |
|---|---|---|
| 01 agora | Componentes mobile dark-tech, DEMO navegável, fatia A/B/F, G compartilhado, câmera/galeria, revisão | Sem criar escola; respostas preservadas entre passos; dependência de ambiente com atalho; conclusão manual/reabrir; prévia/remover/limite; sem falso envio; screenshots 390/430 px e tela maior |
| 02 | Administração de catálogo/contas | T01/T19/T20; permissões e importação sem duplicidades |
| 03 | D1/Workers, migrações e contratos revistos | Autorização servidor, histórico, versões, idempotência, T15/T22 |
| 04 | R2 e compressão validada | T10/T11/T13/T14; upload interrompido e vínculo íntegro |
| 05 | Catálogo A–H completo, conferência, offline e conflitos | T02–T18; dispositivos Chrome Android/Safari iPhone; espaço/expiração/retomada |
| 06 | Desktop com consultas oficiais | T21/T24; coordenadas reais, matriz sem dupla contagem |
| 07 | Indicadores/relatórios e operação | Fórmulas aprovadas; backup D1/R2 e restauração isolada |

PROPOSTA técnica reversível: HTML/CSS/JS modular, sem dependências de produção. Arquivos previstos: `web/index.html`, `web/styles.css`, `web/app.js`, `web/domain.js`, `scripts/serve.mjs`, `tests/`, `package.json`, relatório de entrega e rastreabilidade. Rascunho somente em memória nesta fase: não é persistência local criptografada nem offline operacional. Login e envio oficial indisponíveis até integração. Sem deploy/push.
