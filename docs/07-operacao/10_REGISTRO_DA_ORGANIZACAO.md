# Registro da organização documental — 05/11/2026

## Escopo

D-063: organizar documentação e alimentar o repositório existente para manutenção e possível migração. Nenhuma alteração em web/, server/ ou no SQL das migrações. Nenhum deploy, escrita no D1 remoto, criação/remoção de usuários ou upload/exclusão de fotos nesta entrega.

## Material organizado

- Entradas README/COMECE_AQUI/DEVELOPMENT atualizadas; cinco guias anteriores preservados em docs/99-historico.
- Nove guias operacionais: arquitetura, ambientes, dados/contratos, desenvolvimento, release, backup, migração, segurança e pendências.
- Checklist e manual consolidado em TRANSFERENCIA_E_MIGRACAO.txt (gerado dos guias).
- Dicionário físico em Markdown e JSON, com SQL, FKs, índices/triggers e hashes de todas as migrações.
- Exemplos de configuração local isolada, arquivo de nomes de segredos sem valores reais e guia de transferência privada.
- Playwright declarado no projeto; importação portátil somente nos três testes atuais. Node/pnpm fixados; CI sem deploy ou segredos.
- Scanner do índice Git e verificação de links nos guias mantidos.

## Evidências locais

- Instalação com pnpm --frozen-lockfile: aprovada.
- Suíte padrão: 98 testes, 98 aprovados, zero falhas.
- Build desktop: 46 arquivos; coletor: 47 arquivos.
- Migrações em SQLite vazio: 15 aplicadas; 56 tabelas, 34 índices explícitos, uma view e 10 triggers; integrity_check ok, zero violações de FK.
- Teste UX no Edge: aprovado, incluindo busca sem escrita, foco/cursor durante upload, validação visível e retorno à lista.

Verificações complementares do checkout limpo, navegador, links, scanner e publicação Git são registradas no complemento desta entrega. Logs/capturas de execução ficam em private-data/ ou evidências ignoradas, sem conteúdo operacional no Git.

## Repositório e limites

Remoto: https://github.com/tdiasilva-create/inventario . No início estava público e sem commits. A primeira revisão consolida o estado atual; não reconstrói commits históricos que nunca existiram. Versões anteriores dos Workers permanecem identificadas em seus relatórios, sem equivalência inventada com commits Git.

Arquivos privados, backups, exportações, EXEs, pacotes recebidos e capturas reais permanecem fora da publicação. O scanner detecta padrões conhecidos e não substitui revisão. Direitos/licenças gerais do projeto não foram alterados.

Não houve nova homologação de Drive/câmera/instalador físico. Migração/restore e política de backup seguem pendentes. A aprovação dos testes isolados não declara o sistema completo ou a mudança de servidor pronta.

## Complemento de verificação

- Testes V3 e identidade no Edge: aprovados; fluxo com QR/fotografias sintéticas e larguras 360/390/640/812/1280 conforme cada teste. Sem câmera física.
- Revisão do índice: 418 arquivos, aproximadamente 26,9 MB; scanner sem assinaturas de segredos detectadas. Revisão adicional encontrou apenas a própria expressão do scanner.
- Bytes da Base de Coleta original e das 15 migrações iguais entre arquivos de trabalho e índice Git.
- Links mantidos: 50 destinos locais conferidos, sem referência ausente.
- Reprodução por git archive do índice, em diretório vazio privado: pnpm install --frozen-lockfile, 98 testes, dois builds, geração do esquema e dois dry-runs Wrangler aprovados. Nenhum arquivo privado foi copiado para esse ensaio.
- CI preparada para executar os mesmos checks locais e testes de navegador com Chromium no GitHub; resultado do runner remoto deve ser observado após o push.

A revisão inicial é consolidada em main; a identificação exata fica no histórico Git e na entrega ao responsável. Datas das publicações anteriores não foram convertidas em commits fictícios.
