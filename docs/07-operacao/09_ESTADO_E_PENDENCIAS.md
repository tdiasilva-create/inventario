# Estado e pendências em 05/11/2026

## O que existe

- Dois Workers reais, um D1 compartilhado, usuários/perfis e interfaces distintas.
- Coletor atual por assuntos, fotos vinculadas às respostas/equipamentos, envio automático e campos AnyDesk/RustDesk opcionais.
- Computador manual com motivo e computador com agente/QR; ambiente/posição informados na coleta.
- Drive como provedor configurado; integração e upload têm código e testes. O uso real já teve registros de verificação em entregas anteriores, mas esta documentação não realiza novo upload nem nova autorização.
- Consulta desktop parcial separada da publicação oficial; histórico, IDs e permissões no servidor.
- Cadastro automático do agente sem lote conforme D-058 e preservação de assinaturas/vínculo autenticado.
- Identidade visual/UX do coletor publicadas conforme D-061/D-062. Não alteradas nesta organização.

## Verificação desta organização

A [CI do commit bcf2ebab](https://github.com/tdiasilva-create/inventario/actions/runs/42146235419) passou em Linux/Chromium, incluindo 98 testes, três testes de navegador, builds e reprodução dos documentos. O ensaio de instalação local a partir dos arquivos Git também passou. Isso comprova reprodução do código/testes, não restauração de produção ou homologação física.

## O que não deve ser anunciado como concluído

| Pendência | Implicação / próximo passo |
|---|---|
| Restore completo ensaiado | Executar em destino privado isolado, incluindo Drive/chaves/IDs |
| Política de backup, RPO/RTO e retenção | Responsável deve defini-la e testar recuperação; não há garantia automática |
| Migração para outro runtime/banco | Exige adaptadores e homologação; não há Docker/VPS pronto |
| Continuidade de endpoint Windows | Conferir agente real e estratégia de atualização/ponte |
| Homologação do EXE exato | Instalar em Windows designado, QR no celular, reinício, sincronização e falhas |
| Offline durável | Fila atual vive na memória da aba; fechar aba pode perder pendências |
| Teclado/câmera físicos | Testes em navegador desktop não substituem aparelhos reais |
| Observabilidade operacional | Definir monitoramento/alertas, logs privados e responsáveis |
| Separação de material privado | Cofre institucional, fontes/instaladores e backup precisam de responsável |

## Lacunas de apresentação desktop já identificadas

O [mapeamento de respostas](../06-entregas/MAPEAMENTO_COLETOR_PARA_PAINEL_DESKTOP_2026-11-05.txt) é a referência detalhada. Entre os pontos registrados: áreas genéricas/galeria não cobrem toda navegação desejada; limite de fotos sem paginação completa; detalhes de telemetria e sinalização parcial precisam revisão; diferença entre campo de discos recebido e campo lido por algumas telas; relatórios/exportações ainda não representam todo o escopo. Esta entrega documenta, não corrige silenciosamente essas funções.

## Atualização posterior: fotografias D-064

A lacuna da galeria foi tratada nesta etapa posterior: página `/fotografias`, paginação, filtros por unidade/vínculo/estado e viewer compartilhado com identidade do coletor. Fotos de coletas pausadas permanecem histórico PARCIAL. Leitura de dez arquivos reais no Drive confirmada, sem novo upload ou alteração de dados. Ver [relatório e publicação](../05-qualidade/GALERIA_FOTOGRAFIAS_2026-11-05.md). Outras lacunas desktop acima permanecem.

## Como ler pendências antigas

Listas anteriores de R2 bloqueado, autorização de lote, ausência de fotografia de computador ou navegação V2 podem estar superadas pelas decisões D-048/D-057/D-058/D-060/D-062. Preservar histórico e consultar a decisão posterior antes de reimplementar a solução antiga. O manual atual não apaga lacunas de homologação.

## Escopo desta entrega

Documentação, organização Git, exemplos locais, catálogo físico e portabilidade dos três testes de navegador atuais. Nenhuma nova pergunta, regra, tela, migração SQL, credencial ou deploy de produção. Base original preservada. Resultados efetivamente executados ficam no [registro da organização](10_REGISTRO_DA_ORGANIZACAO.md).
