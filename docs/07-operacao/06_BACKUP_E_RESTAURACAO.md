# Backup e restauração

## O que constitui uma cópia recuperável

| Componente | Conteúdo | Destino |
|---|---|---|
| Código | Commit, lockfile, migrações, builds e configuração sem valores secretos | Git + pacote de release |
| D1 | Todas as tabelas/índices/views/triggers e registros necessários | Cofre privado, criptografado |
| Drive | Arquivos, IDs, hierarquia, metadados e relação com `collection_photos` | Armazenamento privado institucional |
| Segredos | Pepper, cliente OAuth/secret, chave de tokens, acessos de recuperação | Cofre de segredos separado |
| Agentes | Fontes/build exatos, instaladores e hashes; configuração de endpoint | Repositório/arquivo privado |
| Operação | Versões ativas, horários, migrações aplicadas, hashes e responsável | Manifesto de backup restrito |

Git não é backup do D1. SQL não contém bytes das imagens. Arquivos de foto sem IDs e vínculos não recompõem automaticamente as galerias. Chave privada dos agentes fica no Windows; não centralizar/exportar indiscriminadamente chaves das máquinas.

## Preparar uma captura consistente

1. Aprovar janela, destino privado e responsável. Medir espaço e decidir perda de dados/tempo de recuperação toleráveis (RPO/RTO ainda não definidos pelo responsável).
2. Registrar versões, esquema e timestamp UTC. Pausar novas escritas dos dois Workers, uploads, cron e agentes por mecanismo de manutenção previamente implementado/testado. **Não existe neste guia uma variável mágica de manutenção já implantada.**
3. Deixar requisições em voo terminarem ou registrar falhas/pendências e reconciliar. Não declarar consistência só porque os arquivos têm a mesma data.
4. Exportar D1 e obter manifesto de imagens/referências/estados, copiar arquivos necessários e registrar exclusões pendentes.
5. Calcular SHA-256 e verificar recuperação antes de descartar cópia anterior. Reabrir escrita de forma controlada.

Exemplo de exportação futura, somente após autorização da janela:

```powershell
New-Item -ItemType Directory -Force -Path private-data/backup-aprovado
pnpm exec wrangler d1 export semed-inventario-auth --remote --config wrangler.jsonc --output private-data/backup-aprovado/database.sql
Get-FileHash -Algorithm SHA256 -LiteralPath private-data/backup-aprovado/database.sql
```

A documentação Cloudflare informa que a exportação pode bloquear outras requisições ao banco enquanto é produzida; por isso não executar em horário de coleta por conveniência. Import/export não é uma cópia das outras integrações. [Cloudflare · importação e exportação](https://developers.cloudflare.com/d1/best-practices/import-export-data/).

O manifesto privado deve conter: data UTC, versão dos Workers, commit, DB de origem, migrações, número de arquivos, tamanho/hash do SQL e dos pacotes, inconsistências encontradas, referências do cofre (sem valores), responsável e resultado do ensaio.

## Drive: preservar vínculo e acesso

Se mantiver a mesma conta/pasta/cliente OAuth, confirmar que os IDs persistidos continuam acessíveis. Se copiar para outra conta ou pasta criando novos arquivos, os IDs podem mudar: produzir mapa **ID antigo → ID novo**, conferir todos os alvos e atualizar referências em transação/plano validado. Não vincular por nome do arquivo.

O escopo `drive.file` limita acesso aos arquivos autorizados ao aplicativo. Novo cliente OAuth não garante acesso às imagens do cliente anterior. Reautorização e teste de leitura/escrita/exclusão numa pasta de ensaio são necessários. Não tornar a pasta pública como solução.

Preservar `integration_tokens`, pastas, eventos e `GOOGLE_TOKEN_KEY`; copiar só refresh token cifrado sem a chave não recupera integração. Manter plano para reautorizar caso o token seja revogado.

## Restauração em destino isolado

- Criar base vazia e área de arquivos isolada. Remover cron e bloquear escrita/telemetria externa enquanto se confere.
- Importar o dump completo **ou** executar migrações vazias + carga de dados adequada. Não aplicar ambas integralmente sobre o mesmo esquema já criado.
- Confirmar o registro de migrações do destino: se o export não trouxer controle D1, estabelecer baseline conferida antes de usar migrations apply. Não declarar migrações como aplicadas sem comparar esquema/hashes.
- Usar configuração/chaves restritas e iguais às necessárias para ler os dados restaurados. Não rodar bootstrap nem gerar outro pepper.
- Verificar `PRAGMA integrity_check`, `PRAGMA foreign_key_check`, contagem por tabela, unicidades e referências órfãs.
- Comparar totais oficiais com registros publicados e parciais separadamente; verificar triggers e carregamento de agregados.
- Conferir amostra de visitas antigas/atuais, equipamentos manual/QR, fotos e histórico. Para imagens, manifesto deve demonstrar ausência de arquivos faltantes; amostra visual complementa, não substitui a conferência completa.
- Testar todos os perfis, troca/revogação de sessão, vínculo/reenvio do agente e salvamento concorrente.
- Registrar resultado, duração e discrepâncias. Destino só vira produção após aceite.

A restauração real e um backup agendado completo não foram executados por esta organização documental. Diretórios locais de backups anteriores não provam retenção externa nem restauração homologada.

## Recuperação pontual D1

Time Travel pode recuperar D1 dentro da janela disponível no plano, mas é restauração do banco e pode cancelar requisições em execução. Não recupera Drive, código ou segredos. Guardar bookmark e plano de retorno e tratar como operação destrutiva explícita. [Cloudflare · Time Travel](https://developers.cloudflare.com/d1/reference/time-travel/).

Definir com o responsável periodicidade, retenção, criptografia, responsável substituto e ensaio recorrente. Não prometer RPO zero nem recuperação automática sem infraestrutura e testes que sustentem isso.
