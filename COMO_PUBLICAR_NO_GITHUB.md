# Publicação do código

Repositório público: https://github.com/tdiasilva-create/inventario . Publicar código não publica automaticamente a aplicação nos Workers.

Revisar mudanças, executar testes, selecionar arquivos com `git add`, executar `pnpm check:repository` e conferir `git diff --cached --stat`. Não usar `git add -f` para conteúdo ignorado sem revisão. Banco, dumps, fotos operacionais, tokens, senhas, arquivos OAuth e instaladores não devem ir para este repositório.

Comitar alterações coerentes e enviar por push normal, sem sobrescrever o histórico remoto. A [CI](.github/workflows/ci.yml) verifica código e documentação; não tem segredos e não faz deploy. O scanner identifica padrões conhecidos e não substitui revisão humana.

Recursos privados são transferidos conforme o [guia de backup](docs/07-operacao/06_BACKUP_E_RESTAURACAO.md). Manter o [índice operacional](docs/07-operacao/README.md) e a rastreabilidade atualizados.
