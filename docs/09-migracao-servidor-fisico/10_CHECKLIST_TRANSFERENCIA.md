# 10 · Checklist e registro para a equipe receptora

Modelo de acompanhamento. Não marcar como concluído sem evidência. As escolhas propostas não são aprovações do responsável.

## A. Base documental e código

- [ ] Registrar commit exato a implantar, branch, data e responsável.
- [ ] Ler precedência/decisões e distinguir código atual de propostas da branch.
- [ ] Reproduzir `pnpm install --frozen-lockfile`, testes e builds com Node24/pnpm11.25.
- [ ] Reproduzir `pnpm docs:schema`, `pnpm docs:code`, `pnpm docs:txt`, `pnpm check:docs`.
- [ ] Conferir catálogo de 31 migrações e guardar hashes; nunca editar SQL já aplicado.
- [ ] Verificar assinatura/código exatos do EXE e APK realmente distribuídos.

## B. Inventário privado, fora do Git

- [ ] Dump consistente, schema/migration ledger, horário/hash e totais privados.
- [ ] Manifesto e cópia recuperável de originais Drive, avatares e vínculo dos IDs.
- [ ] Segredos correspondentes em cofre, responsável titular e substituto.
- [ ] Keystore Android/configuração e certificado da versão distribuída.
- [ ] Fonte/build/configuração de cada EXE em uso, inclusive possibilidade de trocar endpoint.
- [ ] Configuração institucional Cloudflare/Google/DNS e acesso de recuperação.
- [ ] Lista dos atendimentos/coletas/envios em andamento para planejar corte.

## C. Ambiente físico

- [ ] CPU/RAM/disco/RAID/saúde/UPS/rede inventariados.
- [ ] SO e runtime suportados, usuário de serviço, diretórios e permissões.
- [ ] HTTPS/domínios/renovação e origem confiável para IP externo.
- [ ] SSH/VPN e console de recuperação testados, sem senha no chat/repo.
- [ ] Monitoramento e cópia externa, teste de restauração e espaço de reserva.
- [ ] RPO/RTO, retenção, simultaneidade e janela aprovados.

## D. Implementação e homologação

- [ ] Runtime HTTP e adaptadores reais implementados/revisados.
- [ ] DB batch atômico, FKs/JSON/BLOB/triggers/guardas e códigos de erro equivalentes.
- [ ] Proteção de host/origem/cookies/CSRF/roles e rotas de agente assinadas.
- [ ] Fotos/upload/ready/miniatura/fallback/renovação funcionais no destino.
- [ ] QR/heartbeat/inventário/recibos, filas e versão antiga Windows testados.
- [ ] Técnico/atribuição/GPS/ruas/encerramento/Android físico testados.
- [ ] Hardware/48h/presença/relatório semanal e cron único testados.
- [ ] ETag/cache/projeções sem dados desatualizados ou autorização em cache.
- [ ] Carga, falhas, reinício, disco cheio e backup/restore testados.
- [ ] Corte e retorno completo ensaiados sem duplicar escritores.

## E. Registro do corte futuro

```text
Autorização e responsável:
Data/janela (Fortaleza e UTC):
Commit/backend/builds/EXE/APK:
Origem e destino (sem credenciais):
Versão de esquema/hash do conjunto SQL:
Hash/tamanho/instante do export final:
Manifesto/cópia Drive (referência privada):
Suspensão de escritores e cron confirmada às:
Importação/integridade/equivalência concluídas às:
Mudança de entrada/geração realizada às:
Primeira escrita confirmada no destino:
Canários e resultados por perfil/dispositivo:
Pendências e limitações aceitas:
Backup pós-corte e responsável pela observação:
Condição/horário de retorno, se necessário:
Encerramento formal da migração:
```

## Estado desta entrega documental

Código atual e catálogo foram organizados; plano proposto está versionado em branch própria. Banco real não foi migrado, servidor físico não foi instalado e produção não foi republicada nesta tarefa. O TXT é gerado destes capítulos por `node docs/09-migracao-servidor-fisico/gerar-txt.mjs`; editar os capítulos e regenerar para manter consistência.
