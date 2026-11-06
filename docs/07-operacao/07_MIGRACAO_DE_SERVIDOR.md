# Migração de servidor

## Escolher o tipo de mudança

| Destino | Reaproveitamento | Trabalho adicional |
|---|---|---|
| Outra estação de desenvolvimento | Clone, dependências, código, testes | Acessos institucionais separados; não precisa migrar dados |
| Mesma conta Cloudflare | Workers/D1/Drive atuais | Novos nomes/domínio, configuração, OAuth e endpoints |
| Outra conta Cloudflare | Mesmo runtime e SQL em princípio | Novo D1, importação, segredos, bindings, Drive/OAuth, URLs e agentes |
| VPS/outro runtime | Regras JS e assets parcialmente reaproveitáveis | Adaptadores de HTTP, D1, assets, cron, configuração, autenticação e observabilidade |
| PostgreSQL/MySQL | Modelo lógico | Tradução/teste de SQL/JSON, tipos, índices/triggers, transações e API do banco |

Não há pacote pronto de hospedagem VPS neste projeto. A passagem para Node/Express/Docker não se resume a copiar `server/worker.mjs`: ele depende de bindings Workers/D1, Request/Response, WebCrypto, assets e agendamento. Um adaptador teria que preservar esses contratos. O protótipo de testes em memória não é backend de produção.

## Fase 1 · Levantamento e critérios

- Nomear responsável técnico e institucional, destino, orçamento, janela e autoridade para corte.
- Inventariar recursos/versões atuais, tamanho de banco/imagens, volume de uso e número de agentes ativos; não inferir contagens dos mockups.
- Definir RPO/RTO, prazo de observação, critérios de aceite e de retorno.
- Confirmar domínio/endereço final dos dois ambientes e continuidade do endpoint dos agentes já instalados.
- Garantir acesso a backups, chaves, OAuth e instaladores/fontes exatos.
- Preparar projeto isolado com cópia de configuração sem cron e sem escritas no banco antigo.

## Fase 2 · Preparar e provar o destino

1. Reproduzir builds e testes a partir do commit, sem arquivos privados implícitos.
2. Implementar adaptadores se mudar de runtime/banco e comparar contratos usando os mesmos testes.
3. Restaurar cópia privada isolada de D1/fotos e chaves necessárias; validar conforme guia de recuperação.
4. Manter banco restaurado sem acesso público e sem receber agentes reais. Dados reais restaurados continuam privados.
5. Preparar HTTPS, origem, cookies, CSRF, limites de upload, MIME, cache privado e timeouts.
6. Registrar callback OAuth exato do painel de destino e ensaiar a autorização/pasta. Callback de outro host não será aceito automaticamente.
7. Ensaiar um Windows e um celular reais: nova instalação, QR, leitura, vínculo, inventário, heartbeat, reinício e reenvio.
8. Confirmar que um agente já vinculado mantém ID, chave pública, escola, posição e histórico depois da troca.

As URIs OAuth precisam corresponder ao cadastro do cliente, incluindo esquema e caminho. [Google · OAuth para aplicações web](https://developers.google.com/identity/protocols/oauth2/web-server).

## Fase 3 · Planejar o endpoint instalado

O executável pode conter a URL antiga. Inventariar a configuração efetivamente usada pela versão distribuída. Não supor suporte a atualização remota de endpoint ou a redirecionamento 301/302 em POST assinado. Testar caminho/corpo/assinatura e continuidade dos recibos. Alternativas a decidir: manter endpoint antigo como ponte autenticada para a mesma base, atualizar configuração distribuída ou nova versão do agente. Nenhuma está implantada só por constar neste plano.

Se a ponte for necessária, precisa preservar autenticação e unicidade, não escrever em duas bases. Nunca embutir pepper/segredo Google no EXE. Não reenrolar todos os computadores apagando identidades como estratégia de migração.

## Fase 4 · Corte

- Registrar checkpoint e versões. Comunicar a janela aos usuários por canal autorizado.
- Interromper escritores humanos e de máquina no ambiente antigo; suspender cron. Registrar tentativas em voo.
- Fazer exportação final consistente e sincronizar arquivos alterados desde o ensaio.
- Restaurar no destino, aplicar somente migrações incrementais pertinentes e conferir integridade/totais/referências.
- Ativar configurações, segredos e OAuth, mantendo autorização de agentes `nao` conforme D-058.
- Trocar roteamento/links/configuração dos clientes segundo o plano testado.
- Liberar primeiro uma operação controlada e verificar logs, depois o restante.
- Ativar manutenção em um único executor e manter origem sem escrita.

**Proibido operar duas bases graváveis independentes como se fossem a mesma produção.** Dados novos no destino tornam um simples retorno de DNS insuficiente.

## Aceite mínimo

| Verificação | Evidência exigida |
|---|---|
| Contas/perfis | Login dos quatro perfis e recusas de permissão corretas |
| Cadastro | Unidade sem INEP quando permitido; IDs preservados |
| Coleta | Salvar/reabrir rascunho, assunto e publicação manual |
| Painel | Parcial rotulado; oficial consistente; campos/histórico acessíveis |
| Fotografias | Enviar, reabrir, visualizar autenticado e negar acesso anônimo |
| Agente | Identidade antiga preservada; instalação nova sem lote; QR e telemetria |
| Concorrência | Resposta perdida/reenvio não duplicam; conflito explícito |
| Recuperação | Restore ensaiado e retorno documentado |
| Segurança | Sem tokens no frontend/log; cookies, origem e assinatura mantidos |

## Retorno após corte

Parar novas escritas no destino. Avaliar dados criados após o corte e reconciliar antes de voltar. Se não houver escrita nova, retorno pode ser mais simples, mas ainda depende do roteamento/segredos/OAuth. Havendo escrita, restauração antiga implica perda e exige decisão explícita. Preservar logs/dumps de ambos os lados para reconciliar; não sobrescrever às cegas.

Só desativar infraestrutura antiga após período de observação aprovado e confirmação de que nenhum agente continua dependendo do endpoint antigo. Guardar configuração e backups segundo retenção institucional.

## Entrega para a equipe receptora

Commit, lockfile, manifesto de assets, migrações/hashes, inventário de recursos, nomes de segredos e acesso ao cofre, backup validado, mapa de IDs das fotos se mudou, contratos de agentes, instalador/fontes/build, testes/resultados, pendências e contatos responsáveis. Não enviar esse conjunto privado por repositório público.
