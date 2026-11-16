# Estado após D125 — 16/11/2026

Complementa [D124](15_ESTADO_ATUAL_D124.md). Correção aprovada para fotos/miniaturas: decodificação integral de JPEG no servidor, paginação indexada e contagens da galeria reutilizadas somente na mesma revisão transacional. Manutenção root usa índice de pendências e inclui hash NULL divergente.

Migração aditiva 0036 deve preceder os dois Workers. Sem novo APK/EXE, mudanças de perguntas, permissões, GPS, alertas ou plano. Originais e histórico permanecem intactos. Estado de publicação, medidas e versões: [qualidade D125](../05-qualidade/FOTOS_MINIATURAS_D125_2026-11-16.md). [Contrato](../04-dados-apis/FOTOS_E_MINIATURAS_D125.md).

O build precisa empacotar o WASM de `@jsquash/jpeg` e respeitar o alias `#jpeg-decoder` no Wrangler; o adaptador Node é apenas para execução local. Um futuro servidor físico deve manter validação e revisão transacional equivalentes. Regenerar schema/dicionário pelos scripts; não copiar dados privados para o repositório.

349 testes gerais e teste do bundle workerd passaram. Backup restaurado em isolamento; evidências sintéticas e agregados versionados. Comparação local não certifica capacidade para toda a frota no gratuito. Validação visual contra o original, regras de retenção/limpeza/revisitas, demais achados e homologação física permanecem fora desta entrega.

Publicado em 16/11/2026, 100%: painel `7bc28e12-21fb-4ccd-afa4-a74b78b5c18b` às 06:45:39; coletor `a1ff9077-58ac-4799-b733-5d88605c58da` às 06:46:01 Fortaleza. Migração 0036 aplicada/verificada. 84 verificações HTTP passaram. APK 1.0.4 preservado; conferir fotos autenticadas após renovar o login root, expirado durante a inspeção.
