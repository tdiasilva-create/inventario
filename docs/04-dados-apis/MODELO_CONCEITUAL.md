# Modelo conceitual e contratos — diretrizes aprovadas, não esquema SQL final

**Fonte primária:** Base original v1.0, especialmente seções 1, 4.F, 7–11.

## Entidades principais
- `unidades`: cadastro mestre oficial, inclusive status e grupos de acesso; importação Excel/CSV administrativa.
- `usuarios`, `sessoes`, `autorizacoes`: dois perfis iniciais; escola autorizada por coletor ou grupo.
- `questionarios`, `versoes`, `definicoes`: configuração parcial, publicação por versão e congelamento da versão para vistoria iniciada.
- `ambientes`: pertencem à unidade; equipamentos referenciam ambiente quando aplicável.
- `equipamentos`: identidade interna imutável, categoria, atributos, status, unidade, histórico; registro individual ou lote conforme tabela aprovada.
- `vistorias`, `secoes`, `verificacoes`: visitas e conferências, histórico/estado, responsáveis, revisão e conclusão oficial.
- `internet`, `rede`, `energia`: avaliações contextualizadas e equipamentos compartilhados sem dupla contagem.
- `problemas`, `necessidades`, `movimentacoes`, `duplicidades`, `nao_localizados`: trilha histórica com origem e prioridade.
- `fotos`: metadados e referência R2, estado de upload, vínculo e miniaturas.
- `eventos_auditoria`, `conflitos_sincronizacao`, `configuracoes`, `backup_logs`.

## Invariantes indispensáveis
1. Unidade mestre editada só por administrador.
2. Equipamento mantém ID único e histórico após sucessivas verificações; não somar repetido.
3. Coleta concluída não depende de aprovação administrativa, mas depende de confirmação do servidor e fotos obrigatórias sincronizadas.
4. Foto opcional pode ficar pendente após conclusão e nunca pode ser declarada sincronizada antes da confirmação.
5. Foto é objeto R2; D1 mantém metadados e vínculo íntegro.
6. Consulta e alteração segregadas por escola autorizada e perfil; nunca confiar apenas em seleção no frontend.
7. Atualizações concorrentes usam versão/conflitos, não `último salva ganha`.
8. Transferência oficial, cancelamento oficial, duplicidade confirmada são ações administrativas.

## Não preencher prematuramente
- SQL/migrações finais, endpoints específicos e contratos JSON não foram aprovados.
- Planos de fila, idempotência, política de upload, imagens e backup exigem teste e documentação técnica.
- Campos informados em mockups não são dados reais da rede.

## D-031 — usuários e sessões

A entidade usuários agora tem os quatro perfis aprovados pelo responsável, superando a quantidade inicial da Base preservada. O esquema físico desta fatia de acesso está em `migrations/`; não é esquema final de inventário. Usuários, sessões revogáveis, proteção progressiva e auditoria estão integrados a D1/Worker. As demais entidades e R2 seguem não implementadas.

## Administração de unidades — D-035

Cadastro/edição de unidades e atribuição direta a operadores agora operacionais em `/administracao`, exclusivo root. O catálogo é real, persistido em `units`; a lista `/api/units` filtra o operador por `unit_assignments` e por unidade ativa. Não há ainda importação ou grupos de autorização, calendário de visitas, tabelas de equipamentos ou coletas. Campo nome individual disponível na criação de conta. Criação exclusiva root; admin não cria contas por D-035.
