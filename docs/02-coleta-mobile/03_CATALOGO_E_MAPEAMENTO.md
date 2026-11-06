# Catálogo de perguntas — referência operacional indexada

**Este arquivo é um ÍNDICE e NÃO substitui a Base de Coleta original.** A redação exata, as alternativas, condicionais e exceções constam integralmente no TXT de 27/10/2026. Ao implementar formulários, leia a seção apontada e gere o esquema de perguntas com identificação estável e versionamento. Não omita campos porque não constam deste índice.

| Grupo | Área | Referência no TXT | Obrigatoriedade e observações |
| --- | --- | --- | --- |
| A | Identificação | §4.A | Catálogo/autenticação automáticos; responsável local e observações opcionais |
| B | Ambientes | §4.B | Contagem de tipos + identificação de ambientes relevantes; localização de equipamentos vinculada |
| C | Internet e conectividade | §4.C C.1–C.11 | Questões obrigatórias e condicionais explícitas; fotografias de falhas visíveis ou justificativa |
| D | Rede interna e Wi-Fi | §4.D D.1–D.11 | Cobertura e infraestrutura; totais de roteador/AP/switch sem somar novamente o grupo F |
| E | Energia | §4.E E.1–E.7 | Observação visual segura; não exigir laudo elétrico |
| F | Equipamentos | §4.F, 4.F.2–4.F.4 | Regimes por categoria; campos genéricos/status; técnicos geralmente opcionais |
| G | Audiovisual | §4.G | Navegação distinta, **mesma base de fichas F** |
| H | Problemas/necessidades | §4.H 19.1–19.7 | Consolidação de achados + manual, sem duplicar; classificação preliminar |

### Lista de fichas do Grupo F
- **INDIVIDUAL:** computador desktop, notebook, tablet, monitor, impressora/multifuncional, projetor/datashow.
- **HÍBRIDA:** scanner independente, televisão/painel interativo, roteador, access point, switch, nobreak/UPS, webcam, microfone, caixa de som, servidor físico/NAS.
- **PERSONALIZÁVEL:** outros equipamentos, individual ou em lote.

### Campos genéricos F (§4.F.3)
`patrimonio` texto sem remover zero inicial; `numero_serie`; `marca`; `modelo`; `conservacao` obrigatória (`Bom`, `Regular`, `Ruim`, `Não avaliado`); `funcionamento` obrigatório (`Funcionando`, `Funciona parcialmente`, `Não funciona`, `Não testado`); `situacao_uso` obrigatória (`Em uso`, `Fora de uso`, `Reserva`, `Desconhecido`); `problemas`/`acao_recomendada`/`prioridade` condicionais; `observacoes` opcionais; `fotos` 0–5 opcionais para equipamento.

### Campos técnicos opcionais (§4.F.4)
- Desktop: CPU, RAM, armazenamento, SO.
- Notebook: os do desktop + bateria e tamanho de tela.
- Tablet: capacidade, RAM, SO, tela, bateria, conectividade.
- Monitor: tela, resolução, conexões e painel; possível vínculo com desktop.
- Impressora: tecnologia, cor/PB, conectividade, funções, consumível, papel.
- Scanner: tipo, conectividade, ADF.
- Projetor: conexões, instalação e acessórios.
- TV/painel: tipo, polegadas, conexão e instalação.
- Roteador/AP/switch: detalhes simplificados específicos do TXT.
- Nobreak: VA, bateria, tomadas, instalação.
- Webcam/microfone/caixa de som: **sem campos extras**.
- Servidor/NAS: tipo, capacidade de discos, finalidade, rack/torre.

### Mapeamento por pergunta
Para implementar a engine, Codex deverá gerar uma **proposta de registro por ID** com: `id_estavel`, `grupo`, `subgrupo`, `enunciado`, `tipo_entrada`, `opcoes`, `condicao_exibicao`, `exigido_se`, `fonte_secao`, `versao`, `vinculo_entidade`. Deve conferir essa matriz **campo a campo contra o TXT original** e pedir revisão de ambiguidade; não reescrever a Base.

### Pendências para não inventar
Validação 25.10 personalizada, lista inicial de marcas/operadoras e ambientes, detalhe de fotos de lotes, prazo de sessões/offline/retencao e critério objetivo de criticidade ainda precisam estar marcados como pendentes se não estiverem explicitados na Base.
