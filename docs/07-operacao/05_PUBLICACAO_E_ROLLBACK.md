# Publicação e rollback

Este é um procedimento para uma **publicação futura autorizada**. A organização documental não executa estes comandos remotos. GitHub e Cloudflare são entregas diferentes; o workflow atual não faz deploy.

## Antes da publicação

1. Identificar commit/revisão, motivo, testes, migrações novas e componentes afetados.
2. Confirmar conta, Worker e DB por configuração e inspeção somente leitura. Não confiar só no nome da aba.
3. Registrar versões ativas dos dois Workers e alterações de variáveis/bindings/segredos. Preservar bundle anterior ou capacidade de reproduzi-lo.
4. Se houver escrita/alteração de esquema, preparar recuperação consistente conforme o guia de backup. Definir janela e critério de retorno.
5. Instalar com lockfile; executar testes e os dois builds quando o servidor/esquema compartilhado mudar.

Verificações locais:

```powershell
pnpm test
pnpm build:desktop
pnpm build:collector
pnpm exec wrangler deploy --dry-run --config wrangler.jsonc --outdir private-data/dry-run-painel
pnpm exec wrangler deploy --dry-run --config wrangler.collector.jsonc --outdir private-data/dry-run-coletor
```

Dry-run empacota, mas não comprova permissões/segredos/banco no destino. Revisar pacote e destinos. Metadados antigos do manifesto de build podem ainda dizer “future” ou “awaiting official data”; não são a fonte de estado operacional.

## Execução aprovada

Se houver migrações: conferir pendentes no **único D1 compartilhado**, validar compatibilidade com versões antiga/nova e aplicar apenas as incrementais necessárias. Não aplicar sementes. Mudança incompatível exige plano específico; não há ordem universal que elimine esse risco.

Para uma mudança compatível, publicar a API/interface de cada Worker afetado com configuração explícita, registrando cada versão retornada:

```powershell
pnpm exec wrangler deploy --config wrangler.jsonc
pnpm exec wrangler deploy --config wrangler.collector.jsonc
```

Não executar ambos automaticamente quando só o frontend de um foi alterado. Mudanças de servidor devem considerar os dois, pois compartilham banco e recebem operações distintas. Confirmar que o tráfego está na versão desejada e que cron existe uma só vez.

## Conferência após publicação

- Login público e assets essenciais carregam; APIs privadas sem sessão retornam recusa apropriada.
- Root entra no painel; operador fica restrito à coleta; visualizador não escreve.
- Unidade oficial e visita de verificação autorizada abrem; rascunho salvo reaparece após recarregar.
- Foto realmente enviada pode ser reaberta pelo coletor e pelo painel autorizado; acesso anônimo não funciona.
- QR de máquina de teste vincula sem duplicar equipamento; reenvio/resposta perdida não duplica operações.
- Parcial continua parcial; oficial só muda por publicação confirmada.
- Conferir logs sem vazar dados; guardar evidências privadas e relatório textual publicável.

Não concluir visita real nem excluir conteúdo para “testar”. Usar unidade/máquina de ensaio autorizadas, identificadas e com plano de limpeza.

## Retorno

Rollback de código não desfaz SQL, fotos enviadas, mudanças de OAuth ou dados editados. Antes de retornar, conferir se a versão anterior suporta o esquema/dados atuais. Registrar versão de origem/destino e motivo; usar mecanismo de versões Cloudflare ou bundle anterior validado, com configuração/segredos corretos.

Se houver necessidade de recuperar dados, interromper escritores primeiro, medir perdas desde o backup e aprovar explicitamente a restauração. Não copiar um SQL antigo por cima da produção em funcionamento. Recuperação D1 e Drive precisa ser coerente; evitar que filas de exclusão antigas removam arquivos válidos.

Encerrar registro com commit, versões de ambos os Workers, migrações, testes executados, resultados, horário/fuso, pendências e operador responsável.
