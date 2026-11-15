# Estado consolidado para auditoria — 15/11/2026

Este índice supera as contagens de estado dos guias D-110/08 de novembro. As decisões originais e relatórios datados permanecem como histórico. A preparação da auditoria não realiza nova implantação nem altera regras de produto.

## Versões de referência

| Componente | Estado documentado mais recente |
|---|---|
| Painel e app web | `582b5ec9-993b-45fe-87b6-d88d9f516440`, 15/11/2026 11:42:38 Fortaleza, 100%; [D122 e conferência autenticada](../05-qualidade/BUSCA_UNIDADES_2026-11-15.md) |
| Coletor independente | `e1ddf5ca-3b70-4f86-9377-cd667ac7c9dc`, 15/11/2026 07:30:59 Fortaleza; [D120](../05-qualidade/DESEMPENHO_COLETA_D120_2026-11-15.md) |
| Android | APK 1.0.4, versionCode 5, Android 8+, mesma assinatura; SHA-256 `f258f5f8a483a52d092d9a0d4d8bceba89654256524dae24a28b369c397a82a5`; [D117](../05-qualidade/ANDROID_AREA_UTIL_D117_2026-11-14.md) |
| Agente Windows | Core 0.1.9, instalador 0.1.9-rc3; SHA-256 `F284E9B2F030655ABD07480872E0405680B20F0B8B37583BB0891AD271C8DED7`; [D119](../05-qualidade/RECUPERACAO_AGENTE_D119_2026-11-14.md) |
| Migrações | 34 arquivos ordenados, última `0034_agent_network_tests.sql`; [catálogo recalculado](gerado/DICIONARIO_DADOS.md) e [SQL/hash](gerado/schema.json) |
| Código da auditoria | Branch `codex/auditoria-completa-2026-11-15`; commit exato no manifesto do ZIP. Base anterior à consolidação: `09442d0` |

As versões acima vêm das verificações das entregas referenciadas, não de nova leitura do ambiente oficial nesta preparação. Identificador Cloudflare não é commit Git. O código atual reúne também funcionalidades que não existiam no último envio ao GitHub. `main` não deve ser usada como sinônimo da versão desta auditoria.

## Arquitetura e portas de entrada

- `server/worker.mjs`: fetch e scheduled comuns, selecionados por `APP_KIND`. `wrangler.jsonc` publica painel; `wrangler.collector.jsonc` publica coletor. Ambos usam o mesmo D1 e exigem compatibilidade do esquema.
- `web/`: documentos e módulos; `scripts/build-desktop.mjs` e `scripts/build-collector.mjs` montam assets/versionamento. O painel inclui `/app`, `/tecnico` e `/app/coleta`. Coletor independente mantém origem e login próprios.
- `android/technician/`: WebView, câmera, troca entre áreas e serviço de localização. O nome histórico do diretório não significa que o APK seja exclusivo do técnico.
- `windows/agent/`: Core C# reconstruído do EXE 0.1.8, novas medições, instalador PowerShell/NSIS e testes. Serviço/UI/biblioteca Windows originais são dependências binárias privadas, não fonte completa. [Proveniência](../../windows/agent/README.md).
- D1: cadastros, visitas, respostas/fichas, vínculos, presença, telemetria, demandas, recibos, auditoria, projeções e histórico. Drive privado: fotos/avatares. D1 admite somente miniaturas D072. KV: cache de Analytics; não base autoritativa das permissões.
- Agentes assinam comunicação; usuários usam sessão/CSRF. APK possui capacidade restrita para localização D114. Não tratar esses três meios de autenticação como intercambiáveis.
- OSRM/FOSSGIS calcula ruas; Google Maps ou equivalente abre externamente no celular. Medição usa `speed.cloudflare.com` dentro dos limites D118. Nenhum desses serviços permite inferir contrato de internet.

## Evolução posterior ao manual D110

| Decisões | Mudança que o auditor precisa considerar |
|---|---|
| D111/D112 | Controle sem dados/parcial/completa e Panorama; completa só muda por root. Visita concluída não implica inventário completo |
| D113 | Visual técnico, páginas extras preservadas sob demanda e Avisos com consulta pontual autorizada |
| D114 | Localização nativa durante fila após primeiro aceite, inclusive após expiração de login; revogação e fila vazia encerram capacidade |
| D115 | APK com duas áreas e conta única, capacidades independentes, câmera/QR e sessão recuperável |
| D116 | Coleta rev3, blocos de ficha, estados sem percentual/contador geral, fotos com alvo preservado e barreira de conclusão, ACK distinto de rascunho |
| D117 | Área útil nativa protege controles de barras/teclado/recortes, atualização APK necessária |
| D118/D119 | Medição por comando root, migração 0034, agente 0.1.9 e recuperação explícita de revogado com arquivo de dados antigos |
| D120 | Menos leituras repetidas da coleta, bundles e pipeline de fotos; melhoria web recebida pelo APK atual |
| D121 | Mapa de setores horizontal, grade de equipamentos, status, fotos e ficha modal com ações autorizadas |
| D122 | Cabeçalho busca apenas unidades enquanto digita, usa catálogo local, mantém mapa/seleção e campo na tela ampliada |

As interfaces antigas de busca de equipamentos permanecem em rotas específicas. D122 não apaga o módulo legado `/busca`. Equipamentos publicados, lista operacional de atuais e mapa de setores têm escopos distintos; auditar cada fonte antes de alegar divergência de totais.

## Limites relevantes

- Câmera/GPS em aparelho físico, tela bloqueada, encerramento forçado pelo Android, economia de bateria, permissões do fabricante e Safari iPhone não são comprovados por testes Chromium/JVM. Não prometer funcionamento com force-stop do sistema.
- Fila na memória do coletor não é offline durável. Expiração deve conservar respostas enquanto a aba existe e recuperar apenas a mesma identidade conforme fluxo aprovado.
- Piloto rc2 de internet confirmado; aceites físicos restantes da atualização/recuperação rc3 constam nos relatórios. Teste local do Core não executa CNG/serviço/UI sob a conta Windows real.
- Instalador híbrido depende de binários 0.1.8 preservados; APK de atualização depende da chave privada original. Não acompanham o repositório/ZIP; sua ausência é limitação de reprodução, não autorização para gerar outra identidade de assinatura.
- Ensaios de D1 local e contadores de instruções não equivalem a consumo real diário de toda a conta. Caches, índices e observabilidade precisam ser auditados sem prometer capacidade ilimitada no gratuito.
- Migração física continua análise; não há corte realizado. Backup/restauração integral, RPO/RTO e continuidade de endpoints precisam de homologação/decisão conforme documentação de migração.
- Pendências antigas devem ser reconciliadas com os adendos. Não restaurar senha de 12 caracteres, notificações de comunicação no sino, rota reta ou obrigatoriedade de novo APK para atualização somente web.

O [pedido ao Claude](../08-auditoria/2026-11-15/00_PEDIDO_AO_CLAUDE.txt) define o escopo de revisão e a [matriz atual](../08-auditoria/2026-11-15/01_ESCOPO_E_CRITERIOS.md) localiza as áreas. Não é declaração de ausência de defeitos.
