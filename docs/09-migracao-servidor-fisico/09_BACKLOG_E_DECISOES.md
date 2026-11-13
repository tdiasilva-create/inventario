# 09 · Backlog executável e decisões pendentes

## Decisões do responsável antes da implantação

| ID | Decisão | Proposta desta análise | Por que bloqueia o corte |
|---|---|---|---|
| M-01 | Servidor/SO e responsável de infraestrutura | Linux LTS, SSD local, 16 GB/4 núcleos como ponto inicial | Sem recursos/rede não há destino para homologar |
| M-02 | Banco do primeiro corte | SQLite local compatível; PostgreSQL se carga exigir | Define adaptador, restauração e cron |
| M-03 | DNS/domínio e modo de entrada | Domínios institucionais controlados, HTTPS | Sessão, câmeras, GPS, OAuth e URLs dependem disso |
| M-04 | Continuidade de hosts legados | Investigar ponte temporária Worker → servidor | Agentes/APK possuem origens já distribuídas |
| M-05 | Fotos na primeira etapa | Preservar Drive/cliente/pasta/chaves | Trocar provedor simultaneamente amplia risco de órfãos |
| M-06 | RPO/RTO, retenção e destino de cópia | Definir com a instituição, ensaiar recuperação | Não há prazo de recuperação garantido hoje |
| M-07 | Janela de corte e tratamento de trabalho em andamento | Pausa combinada, drenar envios e atendimentos | Coletor não tem offline durável e GPS é efêmero |
| M-08 | Volume e simultaneidade esperados | Inventariar agentes, operadores, técnicos, fotos e painéis | Sizing/limites precisam de cenário realista |
| M-09 | Gestão de segredos e assinatura Android | Cofre institucional e responsável substituto | Perda de chave pode impedir acesso/fotos/atualização |
| M-10 | Atualização dos clientes e observação pós-corte | Canários por versão real, depois expansão gradual | Não basta teste de navegador/fixture |

Estas perguntas não exigem resposta para concluir a documentação/Git. Exigem decisão antes de mudar produção. Nenhuma delas revoga permissões, localização ou alertas aprovados; são escolhas de infraestrutura.

## Entregas técnicas em ordem

| Etapa | Trabalho e pontos do código | Testes/saída obrigatória |
|---|---|---|
| P0 — inventário | Fixar commit, versões, 31 migrações, inventário privado EXE/APK, hosts/configuração e dependências | Hashes, responsáveis, baseline sem segredo; parte documental entregue nesta branch |
| P1 — adaptador DB | Contrato D1, serialização, atomicidade, JSON/BLOB/erros, revisions/cache | Mesmo resultado da suíte SQLite/Worker; rollback e concorrência |
| P2 — runtime HTTP | Adaptar fetch/scheduled/assets, host/app, corpo bruto, HTTPS/cookies/CSRF | Paridade por família de endpoint e limites; permissões negativas |
| P3 — integrações | Drive/OAuth, conexão IP/ASN confiável, OSRM global, métrica de host | Upload/renovação/rota e cabeçalhos forjados; falhas isoladas |
| P4 — compatibilidade | Ponte ou atualização EXE/APK, assinatura Android e endpoints | Windows/celular reais, QR/ACK perdido, identidade persistente |
| P5 — operação | systemd/supervisão, scheduler único, logs sanitizados, backups e alertas | Reinício/crash/disk full/recuperação; atraso de jobs |
| P6 — corte | Barreira de escrita/geração, dreno, restore, reconciliação/retorno | Ensaio completo sem dois escritores ou perda de ACK |
| P7 — homologação/carga | Cenário acordado e matriz do capítulo 08 | Resultados medidos, comparação e aceite do responsável |
| P8 — produção | Janela autorizada, canários e expansão, observação | Registro de versão/instante, reconciliação, retorno disponível |

As etapas P1–P8 não foram implementadas nesta entrega. Não há estimativa confiável de horas antes de decidir M-01–M-04 e testar o destino. Produzir um Dockerfile ou serviço vazio não fecha essas lacunas.

## Arquivos novos prováveis, ainda PROPOSTOS

Um entrypoint HTTP Node, adaptador de persistência, adaptador de assets, configuração por host, transporte autenticado da ponte, serviço agendador, scripts de backup/restore/validação, migração de controle de escrita se necessária, testes de paridade/carga e manifestos de implantação. Os nomes/caminhos finais serão definidos na implementação e registrados no índice de código.

Não tratar o arquivo de exemplo local Wrangler como configuração física. Não colocar senhas em `.env.example`. Não versionar banco/Drive/EXE/keystore para tornar um tutorial autocontido.

## Riscos prioritários e mitigação

| Risco | Mitigação verificável |
|---|---|
| Divisão de dados entre D1 e servidor | Barreira de corte + backend escritor único + teste de requisição em trânsito |
| Quebra de agentes já instalados | Preservar corpo/rota/chave/recibo; testar versões reais, ponte ou atualização aprovada |
| Perda de fotos ou tokens | Banco + manifesto/cópia Drive + chave correspondente + leitura/renovação no destino |
| GPS como histórico indevido | Manter sessão/atendimento/expiração; logs sem coordenadas e limpeza existente |
| SQLite bloqueando interface | Executor/filas, consultas limitadas, índices, WAL e teste de carga/disco |
| Informações falsas de provedor | Canal de borda autenticado ou fonte ASN escolhida; rejeitar cabeçalho forjado |
| Jobs duplicados | Único executor, lease/idempotência, desligamento explícito da origem |
| Rollback com perda de escrita | Reconciliador/restore de volta ensaiado; não voltar dump antigo após ACK novo |
| Dependência de uma pessoa/um disco | Cofre, cópias externas, responsável substituto e recuperação comprovada |

## O que não faz parte desta migração

Redesenhar coletor/painel, reduzir perguntas, alterar senha/perfis, redefinir status online, excluir dados de teste/produção, trocar endereço escolar, reclassificar categorias, mover fotos para área pública, mudar intervalo/retencão dos agentes sem decisão ou contratar plano pago. Cada um seria outra solicitação funcional, não requisito implícito para hospedar.
