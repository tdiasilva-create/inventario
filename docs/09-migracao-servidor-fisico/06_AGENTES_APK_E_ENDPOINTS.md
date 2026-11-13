# 06 · Continuidade dos agentes, QR, APK e conexão externa

## O maior ponto de compatibilidade

Agentes Windows instalados usam o endereço do **coletor**; o APK técnico contém a origem do **painel** em Java. Alterar um link do README ou hospedar a interface em novo IP não muda esses clientes. Não há neste trabalho prova de que todas as versões Windows aceitem alteração de endpoint remotamente.

O host `*.workers.dev` não é um domínio transferível para o DNS do servidor físico. Precisamos escolher uma estratégia antes de retirar os Workers.

| Estratégia | O que exige | Limite |
|---|---|---|
| Manter Workers como ponte dos hosts antigos | Proxy autenticado para origem física, um backend escritor, validação de corpo/metadados e testes | Continua usando Cloudflare e seus limites; ponte não existe pronta |
| Configurar agentes existentes para domínio novo | Verificar suporte no EXE efetivamente distribuído e mecanismo autorizado de atualização | Não presumir capacidade porque o servidor conhece o dispositivo |
| Distribuir novo EXE/APK | Fonte/build exatos, assinatura, manutenção de identidade e atualização em lotes | Trabalho nas máquinas; requer ensaio com fila pendente e reinstalação não destrutiva |

Proposta preferida para investigar: ponte temporária, mantendo as identidades existentes; depois transição gradual para domínios controlados pela instituição. Não decidir a contratação/domínio nem cortar o host legado nesta etapa.

## Instalações e identidade Windows

[INSTALADOR_OFICIAL.md](../04-dados-apis/INSTALADOR_OFICIAL.md) e [JSON](../04-dados-apis/INSTALADOR_OFICIAL.json) registram o EXE escolhido por D-056 e adendos posteriores. Há referências 0.1.6 e 0.1.8; levantar quais builds realmente estão instalados. Escolha de um arquivo não comprova funcionamento em todas as máquinas.

A chave privada CNG é individual/não exportável; preservar identidade no Windows e correspondência da chave pública no banco. Não exigir `/PURGE`, revogar instalações ou gerar outra identidade como rotina de migração. Receber fonte/configuração/build do EXE de forma privada; o backend não substitui essa entrega.

Cadastro automático sem autorização de lote usa `AGENTES_EXIGIR_AUTORIZACAO=nao`; omitir a variável volta ao padrão restritivo. QR continua temporário e o vínculo à unidade exige usuário autenticado. Renovar QR expirado não exige inventar novo equipamento nem apagar histórico.

## Protocolo assinado que o proxy deve respeitar

Fontes: `server/agentes/nucleo/crypto.mjs`, `worker.mjs`, `d1-store.mjs` e testes de agentes.

Mensagem canônica: cinco linhas separadas por LF, sem LF final:

```text
METHOD
PATH
TIMESTAMP
NONCE
SHA256_HEX_DO_CORPO_BRUTO
```

Assinatura ECDSA P-256/SHA-256 no formato IEEE P1363 (r||s, 64 bytes), base64url sem padding. Chave pública JWK EC/P-256; identificador de chave segue o contrato do código. Cabeçalhos `x-semed-*`, método/caminho e corpo precisam chegar intactos à validação. A host não é uma linha dessa mensagem, mas segurança TLS e allowlist continuam necessárias.

Não aceitar mensagens só porque o proxy está autenticado: manter assinatura, limites de tempo, nonce, anti-replay e recibos no backend. Não consumir um nonce em dois bancos independentes nem repetir escrita por tentativa de proxy sem respeitar a idempotência do protocolo.

### Endpoints indispensáveis

- POST de máquina sob `/api/agent/v1/`: enrollment-challenge, enrollments, enrollment-status, enrollment-renew, pairings/confirm-device, heartbeat, inventory, config, rotate-key.
- Pareamento humano: pairings/preview, pairings/claim, pairings/catalog, pairings/claim-status, com métodos/permissões reais do código.
- Localização humana: `/api/inventory/equipment-location` e consulta de recibo/status; permissões de visita/trava continuam.
- Consulta/histórico e revogação administrativa permanecem com seus perfis. Não liberar todo prefixo `/api/agent` anonimamente.

Teste crítico: interromper a resposta depois do commit e reenviar exatamente o comando. Deve retornar o recibo correspondente, sem duplicar cadastro, foto, evento, vínculo ou demanda.

## IP público e provedor: adaptação obrigatória

Hoje `server/agentes/connection.mjs` observa conexão somente após heartbeat vivo validado, usando `request.cf.asOrganization/asn` e `CF-Connecting-IPv6`/`CF-Connecting-IP`. Também recusa observação quando chega `CF-Worker`. No Node esses metadados não existem automaticamente. Encaminhar somente os mesmos cabeçalhos pode perder o provedor ou ser recusado pela regra atual.

Possibilidades a implementar:

1. Borda lê metadados originais confiáveis e transmite envelope autenticado contendo IP/ASN/organização/timestamp, ligado ao corpo/caminho da requisição. Origem valida assinatura/expiração, remove cabeçalhos de entrada forjáveis e só grava após a assinatura válida do agente. Definir formato/anti-replay e autenticação de transporte; não existe envelope pronto hoje.
2. Origem direta identifica IP real de transporte/proxy confiável e consulta base ASN/licenciamento/atualização escolhidos. Campo ausente fica ausente; PTR/localização geográfica não substituem identificação de rede.

[Metadados de Request no Workers](https://developers.cloudflare.com/workers/runtime-apis/request/). Não aceitar `provider` enviado pelo agente ou por cliente público como se fosse observação Cloudflare. IP interno permanece inventário separado. Histórico de provedores e último contato já recebidos são preservados na importação.

## APK exclusivo do técnico

`android/technician/src/br/gov/ma/pacodolumiar/semed/tecnico/Api.java` fixa a origem do painel e não segue redirects HTTP automaticamente. `MainActivity.java` restringe HTTPS/host da WebView; Java e frontend precisam concordar. `LocationService.java` e `NoticeJob.java` dependem da mesma origem/sessão.

Atualização nativa: manter pacote `br.gov.ma.pacodolumiar.semed.tecnico`, restaurar o **mesmo keystore**, aumentar versionCode/versionName, compilar e validar assinatura. [Guia de build e limites](../../android/technician/README.md). A ferramenta atual usa JDK21/Android35/Build Tools35 no Windows; não está pronta como pipeline Linux genérico.

Se `private-data/android-signing` não existir, o script pode criar outra chave: não executar assim para atualizar usuários já instalados. Não confundir sucesso de build com compatibilidade do APK distribuído. GPS em segundo plano/tela bloqueada e restrições de bateria exigem aparelho físico.

## Ensaio mínimo de compatibilidade

Uma máquina com cada versão efetivamente distribuída: identidade/vínculo existentes, heartbeat, inventário, retorno após internet interrompida, fila pendente e QR renovado. Testar nova instalação separada, sem reciclar a identidade existente. No celular, leitura/claim, foto, aplicativo técnico, GPS/aceite/conclusão e permissão negada. Confirmar que o painel recebeu o mesmo equipment/device/unit ID; nenhum dado duplicado por mudança de host.
