# D114 — localização contínua da fila / APK 1.0.2

Estado: implementação e testes locais concluídos; publicação solicitada ao responsável e ainda não executada. Não declarar homologação física do Android.

## Fontes, escopo e decisões
Pedido explícito após aprovação visual do APK 1.0.1; acompanhamento após primeiro aceite até todas as demandas atribuídas terminarem. Resposta explícita permite continuar somente localização após expiração do login, com novo login obrigatório para ações nas demandas. [Contrato detalhado](../03-painel-desktop/LOCALIZACAO_CONTINUA_D114.md), governança D105–D113, esquemas/rotas/qualidade existentes e documentação oficial Android consultados. Não modificados: questionários/Base TXT, coletor, agente Windows, fotos, plano e alertas.

## Arquivos principais
Migração aditiva `0033_technician_tracking.sql`; `server/technician-tracking.mjs`, `technical-dispatch.mjs`, `dispatch-road-routing.mjs`, entrada restrita no Worker; `web/technician.js`; Android Manifest, Api, MainActivity, LocationService, TrackingStore, TrackingPolicy, TrackingStopJob e serviço legado de compatibilidade. Interface visual D113 preservada; novo aviso de acompanhamento e consentimento explícito no aceite.

## Evidências executadas
- `node --test --test-concurrency=1 tests/*.test.mjs`: **298/298**, incluindo 12 testes novos D114. Saída local `private-data/d114-tests-final.log`.
- `node tests/technician-tracking-browser.cjs`: Worker real com SQLite isolado, ponte Android/GPS simulados; aceite, conclusão parcial, fechamento da página, token após expiração, login bloqueado e saída. Capturas reais da interface em 390 × 844, verificadas visualmente.
- `node tests/technician-redesign-browser.cjs`: páginas extras, reenvio imutável, ACK perdido, abas, detalhe de aviso, pausa de polling durante diálogo e Voltar preservados; 390/360/812 px.
- `node tests/technical-dispatch-browser.cjs`: organização root/arraste, dois técnicos, GPS obrigatório, fluxo legado por atendimento, mapa/ruas e encerramento aprovados.
- `node tests/dispatch-road-routing-runtime.cjs`: módulo real em workerd, geometria aceita, redirect recusado; OSRM simulado, sem transmissão de localização real.
- `node scripts/test-technician-android.mjs`: **21 verificações JVM** da política de recuperação/erros/frescura. Não emula sistema Android.
- `node scripts/build-technician-android.mjs`: APK compilado/assinado, v2/v3 e certificado original verificados.
- `node scripts/build-desktop.mjs`: 112 arquivos, nove bundles, APK incluído; coletor excluído.

Casos de servidor: primeiro aceite; zero demandas não inicia; parcial/pausa/entre atendimentos; conclusão da última; reabertura sem início automático; colega conclui; retirada intermediária/última; revogação/conta/senha/logout; login expira sem ampliar acesso de leitura; segredo errado/escopo/coletor; posição inválida/antiga/duplicada; posição vencida/retorno; recibos e rollback; troca explícita de aparelho; revogação entre validação e escrita; migração sem promoção de aceites legados; contador consistente em estados/retiradas/rollback; rota restante e resposta tardia após encerramento.

## Consumo medido, somente cenário local
`node scripts/measure-technician-tracking.mjs`, SQLite D1 executado em workerd, dados sintéticos, autenticação incluída:

| Ciclo com posição nova | Requisições | Chamadas SQL | Linhas lidas | Linhas escritas |
|---|---:|---:|---:|---:|
| APK antigo: verificar atendimento + posição | 2 | 6 | 14 | 1 |
| APK novo: autorização + posição na mesma requisição | 1 | 2 | 9 | 1 |

Intervalo normal permanece aproximadamente 25 segundos. Autorização usa índices por hash/ID/usuário e contador por usuário, sem varredura de demandas concluídas. Projeção aritmética de cinco técnicos durante oito horas: 80.640 → 51.840 leituras, 5.760 escritas, **somente ciclos de localização**. Não inclui mapa, OSRM, filas, agentes, cron, inicialização, erros ou outras aplicações. Acompanhamento agora pode durar mais horas; monitorar consumo real pelo medidor D1. Não é garantia de franquia ilimitada.

Evidências: `docs/05-qualidade/evidencias/localizacao-d114-2026-11-13/`: `01-aviso-aceite.png`, `02-entre-atendimentos.png`, `browser.json`, `d1-local.json`. Dados sintéticos; nenhuma criação/conclusão de demanda oficial para teste.

## APK preparado
- Arquivo: `private-data/releases/SEMED-Tecnico-1.0.2.apk`, versionCode 3, Android 8+, target 35.
- SHA-256: `e73a23ecc098578a2d8ccb8f739495d4eeeaeba4ce9e6a1b3d5948a774dca0b3`.
- 29.151 bytes; certificado SHA-256 `74458344d426bf1b00b82d9f5b2f106e0600497e2d788a54245721a37a9b3850`.
- Keystore e segredo preservados somente no diretório privado; não versionar.

## Publicação / rollback
Pendente de aprovação específica desta entrega. Antes: exportação privada D1, conferir versão atual/migrações; aplicar 0033; comparar contadores à consulta canônica; publicar somente painel/APK; conferir hash remoto, ativos de interface e fronteiras de autenticação; registrar versões/horários aqui. Não semear contas, GPS ou demandas fictícias em produção. Coletor deve continuar na versão `c678978a-9e71-4cab-a2dc-9744ec6d6e1c`.

Versão anterior esperada do painel: `f9329df4-d5d7-4d24-953c-f9ce056a5914`; reler antes de qualquer publicação. Retorno mantém tabelas 0033/histórico; versão antiga não suporta a capacidade nativa nova. Não restaurar dump sobre contribuições feitas após publicação.

## Pendência física
Celular real: atualização sobre 1.0.1, permissões/notificação, GPS parado/movendo, tela bloqueada, remover dos recentes, retorno de internet/GPS, bateria do fabricante, encerramento e login expirado. Não há aparelho conectado/homologado nesta execução. Usar [roteiro detalhado TXT](../06-entregas/SEMED_TECNICO_1_0_2_LOCALIZACAO_E_TESTES.txt). Forçar parada/telefone desligado/permissão retirada não permitem garantir localização atual; o painel não deve apresentar dado vencido como atual.
