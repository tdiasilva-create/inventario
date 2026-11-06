# Operação, manutenção e migração

Referência: **05/11/2026**. Derivado do código, configurações, migrações, decisões e registros de publicação. Não altera requisitos nem afirma que um novo destino já está homologado.

| Guia | Uso |
|---|---|
| [01 · Arquitetura](01_ARQUITETURA_ATUAL.md) | Interfaces, serviços e fluxos |
| [02 · Ambientes](02_AMBIENTES_E_CONFIGURACAO.md) | Recursos e nomes das chaves necessárias |
| [03 · Dados e contratos](03_BANCO_E_CONTRATOS.md) | Entidades, APIs e compatibilidade |
| [04 · Desenvolvimento](04_DESENVOLVIMENTO_E_TESTES.md) | Nova estação e verificações |
| [05 · Publicação](05_PUBLICACAO_E_ROLLBACK.md) | Release e retorno |
| [06 · Recuperação](06_BACKUP_E_RESTAURACAO.md) | Backup completo e restauração |
| [07 · Migração](07_MIGRACAO_DE_SERVIDOR.md) | Destino, corte e retorno |
| [08 · Segurança](08_SEGURANCA_E_INTEGRACOES.md) | Autenticação, Drive, QR e agentes |
| [09 · Pendências](09_ESTADO_E_PENDENCIAS.md) | Implementado versus homologado |
| [10 · Organização](10_REGISTRO_DA_ORGANIZACAO.md) | Verificações desta entrega |
| [Checklist TXT](TRANSFERENCIA_E_MIGRACAO.txt) | Transferência para outra equipe |
| [Dicionário físico](gerado/DICIONARIO_DADOS.md) / [JSON](gerado/schema.json) | Esquema completo sem dados reais |

Onde cada resposta aparece: [mapeamento coletor → desktop](../06-entregas/MAPEAMENTO_COLETOR_PARA_PAINEL_DESKTOP_2026-11-05.txt).

## Autoridade

Requisitos seguem [DECISOES.md](../00-governanca/DECISOES.md) e [precedência](../00-governanca/REGRAS_DE_PRECEDENCIA.md). Documentação original preservada não é descrição literal da versão atual. Código local, commit Git e versão Cloudflare são identificadores diferentes. Prova de recuperação exige ensaio no destino; um SQL exportado sozinho não é essa prova.

Após mudança aprovada, atualizar guias, decisão/rastreabilidade, esquema quando houver SQL e registro da versão publicada. Nunca inserir segredos ou respostas reais nesses arquivos.

## Materiais privados de transferência

Exportação consistente do D1; imagens e manifesto de vínculos; segredos em cofre; acesso institucional Cloudflare/Google e OAuth; fontes/binários exatos do agente; evidências privadas. Não acompanham o clone público. `.gitignore` ajuda a excluí-los; os exemplos locais não concedem acesso à produção.
