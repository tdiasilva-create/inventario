# Publicação do painel desktop — entrega 01

Data: 27/10/2026. Decisão D-027. Autorização: pedido do responsável para publicação gratuita do painel e escolha dos dois nomes.

## Resultado

URL: https://painel-semed-paco.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev

Worker: `painel-semed-paco`. Versão: `915533e5-5aea-4643-b3d5-af3dbacab13b`. Conta institucional: Secretaria Municipal de Educação de Paço do Lumiar. Hospedagem estática; sem banco, bucket, API ou serviço pago criado. Coletor futuro: `inventario-semed-lumiar`, não publicado nesta entrega.

## Escopo e documentos

Consultados nesta fase: `AGENTS.md`, decisões e rastreabilidade existentes, `DEVELOPMENT.md` e documentação oficial Cloudflare de Workers Static Assets, workers.dev e preços. As leituras integrais do TXT e revisão visual constam das entregas anteriores. Arquivos alterados: configuração Wrangler, package/lockfile/workspace, gitignore, script de build e de verificação, configuração de link do coletor e documentação de governança.

Critérios: publicar somente desktop; manter mapa e linguagem visual; não expor arquivos internos/coletor; não simular backend; verificar endereço público em navegador.

## Testes e evidências

- 10 testes unitários de domínio/geografia/exemplos: aprovados.
- Build exclusivo com lista permitida e manifesto de hashes: aprovado.
- Wrangler deploy --dry-run: aprovado, sem bindings.
- Verificação local e pública: 25 recursos/rotas verificados em cada ambiente, sem erros JavaScript.
- Arquivos do coletor, documentos, .env e API de vistorias retornam 404.
- Navegador: mapa pronto, quatro marcadores institucionais, cinco indicadores, aviso DEMO, filtros e perfil; link de coleta removido da distribuição pública.
- Capturas reais: `evidencias/publicacao-painel/local-painel-1672.png` e `evidencias/publicacao-painel/publicado-painel-1672.png`.
- Resultados reproduzíveis: `local-resultado.json` e `publicado-resultado.json` na mesma pasta.

## Cobertura e lacunas do TXT

Esta entrega disponibiliza a interface de consulta, em apoio à separação de papéis dos §§0–1. Não acrescenta cobertura dos formulários A–H (§4). Os estados/conclusão oficial (§7), autenticação/permissões (§8), histórico/concorrência (§9), fotos R2 (§5) e backups (§10) continuam sem integração operacional. A presença visual de equipamentos, fotos e indicadores DEMO não comprova esses requisitos.

D1 + R2 + Workers preservados para integração futura. O painel público ainda não recebe coletas; números e fotos ilustrativos continuam rotulados. Contorno do mapa mantém a condição de fonte fornecida, sem homologação oficial adicional. Não há validação de segurança de um futuro sistema autenticado nesta entrega.
