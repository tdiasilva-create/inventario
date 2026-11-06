# Como inserir este pacote em `tdiasilva-create/inventario`

**Verificado:** o repositório `tdiasilva-create/inventario` existe e está público. A integração atual do ChatGPT tinha acesso **somente de leitura**, portanto este pacote NÃO foi publicado automaticamente.

## Opção recomendada — Git no seu computador Windows
1. Entre no GitHub com a conta que pode escrever no repositório. Instale Git for Windows se ainda não tiver.
2. Baixe `SEMED_PACOTE_MESTRE_CODEX_2026-10-27.zip` e **extraia** em uma pasta local, por exemplo `C:\SEMED\pacote`.
3. Abra PowerShell numa pasta de trabalho e execute:

```powershell
git clone https://github.com/tdiasilva-create/inventario.git
cd inventario
# Copie para esta pasta TODOS os arquivos e pastas extraídos do pacote,
# preservando a organização. Não copie a pasta contêiner externa.
git status
git add .
git commit -m "docs: consolida requisitos e referencias aprovadas SEMED"
git push origin main
```

Se pedir autenticação, siga o fluxo do Git Credential Manager. Se `main` estiver protegida, trabalhe em uma branch e abra um pull request.

**Atenção:** confirme se já existem `AGENTS.md`, `README.md` ou documentos no repositório antes de sobrescrevê-los. Se houver, faça merge cuidadoso e preserve histórico.

## Opção pelo navegador
No GitHub, abra a aba `Code` do repositório e escolha `Add file` → `Upload files`. Envie os **arquivos extraídos**, mantendo as pastas corretas. Para múltiplas pastas e imagens, a opção Git local tende a ser mais confiável. **Não envie só o ZIP**: a leitura de arquivos e a indexação do Codex dependem do conteúdo presente na árvore do Git.

## Como verificar
Na raiz do repositório devem aparecer `AGENTS.md`, `README.md`, `COMECE_AQUI.md`, `docs/`, `design/`, `prompts/`. Entre em `design/referencias/mobile/00_coleta_mobile_APROVADA.png` e confira se renderiza. Entre em `docs/02-coleta-mobile/BASE_DE_COLETA_V1_0_ORIGINAL.txt` e confira seu conteúdo. 

## A Wiki
A GitHub Wiki é opcional e pode ser usada como porta de entrada. Não trate a Wiki como banco principal de requisitos: páginas de wiki e árvore de arquivos do repositório têm fluxos de versionamento diferentes, e o Codex deve trabalhar a partir da documentação junto ao código.
