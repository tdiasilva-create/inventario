# Índice do código e referências de API

Gerado por `pnpm docs:code`. 421 arquivos de texto. Hashes/bytes usam UTF-8 com finais de linha LF normalizados; hashes exatos das migrações estão no catálogo físico separado. Não inclui bibliotecas vendor, binários, segredos nem dados reais. O JSON inclui imports literais, exports nomeados, nomes de variáveis de ambiente e referências de API. **Índice estático parcial de rotas**, não contrato executável: conferir método, autenticação e parâmetros na implementação/testes.

## server

| Arquivo | Linhas | Bytes |
|---|---:|---:|
| [server/agent-crypto.mjs](../../../server/agent-crypto.mjs) | 34 | 4012 |
| [server/agent-monitoring.mjs](../../../server/agent-monitoring.mjs) | 112 | 13889 |
| [server/agentes/catalogo.mjs](../../../server/agentes/catalogo.mjs) | 79 | 11157 |
| [server/agentes/connection.mjs](../../../server/agentes/connection.mjs) | 18 | 1287 |
| [server/agentes/index.mjs](../../../server/agentes/index.mjs) | 82 | 10322 |
| [server/agentes/nucleo/catalogo.mjs](../../../server/agentes/nucleo/catalogo.mjs) | 86 | 6725 |
| [server/agentes/nucleo/crypto.mjs](../../../server/agentes/nucleo/crypto.mjs) | 116 | 4681 |
| [server/agentes/nucleo/d1-store.mjs](../../../server/agentes/nucleo/d1-store.mjs) | 461 | 37485 |
| [server/agentes/nucleo/enrollment-policy.mjs](../../../server/agentes/nucleo/enrollment-policy.mjs) | 5 | 298 |
| [server/agentes/nucleo/store.mjs](../../../server/agentes/nucleo/store.mjs) | 481 | 22481 |
| [server/agentes/nucleo/validate.mjs](../../../server/agentes/nucleo/validate.mjs) | 251 | 12157 |
| [server/agentes/nucleo/worker.mjs](../../../server/agentes/nucleo/worker.mjs) | 1339 | 76707 |
| [server/agentes/presence.mjs](../../../server/agentes/presence.mjs) | 11 | 887 |
| [server/asset-response.mjs](../../../server/asset-response.mjs) | 12 | 951 |
| [server/collector-access.mjs](../../../server/collector-access.mjs) | 8 | 317 |
| [server/collector-v2.mjs](../../../server/collector-v2.mjs) | 59 | 7959 |
| [server/collector-v3.mjs](../../../server/collector-v3.mjs) | 61 | 8323 |
| [server/collector.mjs](../../../server/collector.mjs) | 186 | 54056 |
| [server/communication-log.mjs](../../../server/communication-log.mjs) | 36 | 3727 |
| [server/d1-budget.mjs](../../../server/d1-budget.mjs) | 11 | 1034 |
| [server/d1-usage.mjs](../../../server/d1-usage.mjs) | 79 | 5768 |
| [server/dispatch-road-routing.mjs](../../../server/dispatch-road-routing.mjs) | 86 | 8847 |
| [server/environments.mjs](../../../server/environments.mjs) | 63 | 6484 |
| [server/equipment-deletions.mjs](../../../server/equipment-deletions.mjs) | 53 | 9606 |
| [server/equipment-link-state.mjs](../../../server/equipment-link-state.mjs) | 9 | 585 |
| [server/equipment-names.mjs](../../../server/equipment-names.mjs) | 41 | 4231 |
| [server/google-auth.mjs](../../../server/google-auth.mjs) | 82 | 12399 |
| [server/hardware-review.mjs](../../../server/hardware-review.mjs) | 65 | 8518 |
| [server/import-units.mjs](../../../server/import-units.mjs) | 24 | 3951 |
| [server/in-progress-photos.mjs](../../../server/in-progress-photos.mjs) | 56 | 4685 |
| [server/in-progress.mjs](../../../server/in-progress.mjs) | 48 | 6332 |
| [server/inventory-equipment.mjs](../../../server/inventory-equipment.mjs) | 59 | 7948 |
| [server/inventory-results.mjs](../../../server/inventory-results.mjs) | 54 | 9214 |
| [server/management-views.mjs](../../../server/management-views.mjs) | 67 | 7184 |
| [server/monitoring-queries.mjs](../../../server/monitoring-queries.mjs) | 40 | 2786 |
| [server/panel-read-cache.mjs](../../../server/panel-read-cache.mjs) | 42 | 2692 |
| [server/panel-search.mjs](../../../server/panel-search.mjs) | 49 | 5491 |
| [server/pending-indicators.mjs](../../../server/pending-indicators.mjs) | 44 | 3555 |
| [server/photo-gallery.mjs](../../../server/photo-gallery.mjs) | 38 | 4599 |
| [server/photo-labels.mjs](../../../server/photo-labels.mjs) | 35 | 3958 |
| [server/photo-read.mjs](../../../server/photo-read.mjs) | 13 | 996 |
| [server/photo-response.mjs](../../../server/photo-response.mjs) | 20 | 1150 |
| [server/photo-storage.mjs](../../../server/photo-storage.mjs) | 129 | 17945 |
| [server/photo-thumbnails.mjs](../../../server/photo-thumbnails.mjs) | 82 | 7479 |
| [server/provider-report-history.mjs](../../../server/provider-report-history.mjs) | 42 | 3058 |
| [server/provider-report.mjs](../../../server/provider-report.mjs) | 43 | 2900 |
| [server/request-timing.mjs](../../../server/request-timing.mjs) | 50 | 3434 |
| [server/security.mjs](../../../server/security.mjs) | 10 | 1223 |
| [server/service-desk.mjs](../../../server/service-desk.mjs) | 149 | 19243 |
| [server/technical-dispatch.mjs](../../../server/technical-dispatch.mjs) | 155 | 17228 |
| [server/technician-avatars.mjs](../../../server/technician-avatars.mjs) | 99 | 9246 |
| [server/unit-deletion.mjs](../../../server/unit-deletion.mjs) | 74 | 7611 |
| [server/unit-scope.mjs](../../../server/unit-scope.mjs) | 10 | 998 |
| [server/unit-validation.mjs](../../../server/unit-validation.mjs) | 3 | 104 |
| [server/units.mjs](../../../server/units.mjs) | 48 | 6667 |
| [server/visit-routes.mjs](../../../server/visit-routes.mjs) | 44 | 6130 |
| [server/worker.mjs](../../../server/worker.mjs) | 182 | 28229 |

## web

| Arquivo | Linhas | Bytes |
|---|---:|---:|
| [web/account-entry.js](../../../web/account-entry.js) | 4 | 79 |
| [web/account-shell.js](../../../web/account-shell.js) | 6 | 1277 |
| [web/account.css](../../../web/account.css) | 10 | 4154 |
| [web/account.html](../../../web/account.html) | 2 | 7007 |
| [web/account.js](../../../web/account.js) | 31 | 9971 |
| [web/admin-units.js](../../../web/admin-units.js) | 70 | 21033 |
| [web/agent-connection.js](../../../web/agent-connection.js) | 32 | 3944 |
| [web/app.js](../../../web/app.js) | 123 | 22070 |
| [web/coleta.html](../../../web/coleta.html) | 3 | 348 |
| [web/collector-account.html](../../../web/collector-account.html) | 2 | 1549 |
| [web/collector-account.js](../../../web/collector-account.js) | 34 | 2791 |
| [web/collector-dialog.js](../../../web/collector-dialog.js) | 20 | 1446 |
| [web/collector-drafts.js](../../../web/collector-drafts.js) | 25 | 1737 |
| [web/collector-environments.js](../../../web/collector-environments.js) | 53 | 4988 |
| [web/collector-errors.js](../../../web/collector-errors.js) | 20 | 1159 |
| [web/collector-login.html](../../../web/collector-login.html) | 2 | 2031 |
| [web/collector-login.js](../../../web/collector-login.js) | 5 | 1073 |
| [web/collector-navigation.js](../../../web/collector-navigation.js) | 20 | 1799 |
| [web/collector-photo-viewer.js](../../../web/collector-photo-viewer.js) | 11 | 1299 |
| [web/collector-qr.js](../../../web/collector-qr.js) | 55 | 7161 |
| [web/collector-schema.js](../../../web/collector-schema.js) | 91 | 19225 |
| [web/collector-ui.js](../../../web/collector-ui.js) | 95 | 5967 |
| [web/collector-unit-list.js](../../../web/collector-unit-list.js) | 7 | 646 |
| [web/collector-v2-schema.js](../../../web/collector-v2-schema.js) | 54 | 12337 |
| [web/collector-v2.html](../../../web/collector-v2.html) | 2 | 463 |
| [web/collector-v2.js](../../../web/collector-v2.js) | 178 | 46027 |
| [web/collector-v3-schema.js](../../../web/collector-v3-schema.js) | 69 | 6386 |
| [web/collector-v3.css](../../../web/collector-v3.css) | 109 | 10458 |
| [web/collector-v3.html](../../../web/collector-v3.html) | 2 | 511 |
| [web/collector-v3.js](../../../web/collector-v3.js) | 276 | 56183 |
| [web/collector.css](../../../web/collector.css) | 288 | 32856 |
| [web/collector.html](../../../web/collector.html) | 2 | 537 |
| [web/collector.js](../../../web/collector.js) | 146 | 55659 |
| [web/communication-log.html](../../../web/communication-log.html) | 2 | 491 |
| [web/communication-log.js](../../../web/communication-log.js) | 38 | 8367 |
| [web/data/map-examples.json](../../../web/data/map-examples.json) | 2 | 127 |
| [web/data/map-v33.json](../../../web/data/map-v33.json) | 651 | 7130 |
| [web/desktop-agents.js](../../../web/desktop-agents.js) | 49 | 12885 |
| [web/desktop-blocks.js](../../../web/desktop-blocks.js) | 34 | 2097 |
| [web/desktop-data.js](../../../web/desktop-data.js) | 6 | 437 |
| [web/desktop-demand-count.js](../../../web/desktop-demand-count.js) | 32 | 4166 |
| [web/desktop-equipment.css](../../../web/desktop-equipment.css) | 12 | 7738 |
| [web/desktop-equipment.js](../../../web/desktop-equipment.js) | 100 | 27499 |
| [web/desktop-exports.js](../../../web/desktop-exports.js) | 40 | 3465 |
| [web/desktop-icons.js](../../../web/desktop-icons.js) | 36 | 2707 |
| [web/desktop-inventory.js](../../../web/desktop-inventory.js) | 25 | 8844 |
| [web/desktop-management.js](../../../web/desktop-management.js) | 65 | 15797 |
| [web/desktop-map.css](../../../web/desktop-map.css) | 31 | 3468 |
| [web/desktop-map.js](../../../web/desktop-map.js) | 240 | 21109 |
| [web/desktop-metrics.css](../../../web/desktop-metrics.css) | 22 | 3128 |
| [web/desktop-notifications.css](../../../web/desktop-notifications.css) | 4 | 2507 |
| [web/desktop-notifications.js](../../../web/desktop-notifications.js) | 30 | 3039 |
| [web/desktop-photos.css](../../../web/desktop-photos.css) | 25 | 7711 |
| [web/desktop-progress-photos.css](../../../web/desktop-progress-photos.css) | 4 | 1613 |
| [web/desktop-progress-photos.js](../../../web/desktop-progress-photos.js) | 42 | 5292 |
| [web/desktop-progress.js](../../../web/desktop-progress.js) | 60 | 12709 |
| [web/desktop-request.js](../../../web/desktop-request.js) | 48 | 3002 |
| [web/desktop-results.js](../../../web/desktop-results.js) | 29 | 7408 |
| [web/desktop-theme.css](../../../web/desktop-theme.css) | 93 | 19405 |
| [web/desktop-thumbnails.js](../../../web/desktop-thumbnails.js) | 21 | 3278 |
| [web/desktop.css](../../../web/desktop.css) | 27 | 32546 |
| [web/desktop.js](../../../web/desktop.js) | 327 | 53307 |
| [web/dispatch-map.js](../../../web/dispatch-map.js) | 63 | 5596 |
| [web/dispatch.html](../../../web/dispatch.html) | 2 | 407 |
| [web/dispatch.js](../../../web/dispatch.js) | 31 | 8809 |
| [web/domain.js](../../../web/domain.js) | 29 | 2397 |
| [web/environment-editor.js](../../../web/environment-editor.js) | 27 | 2924 |
| [web/equipment-deletion.js](../../../web/equipment-deletion.js) | 22 | 5786 |
| [web/equipment-link-state.js](../../../web/equipment-link-state.js) | 26 | 2181 |
| [web/equipment-name-editor.js](../../../web/equipment-name-editor.js) | 34 | 4138 |
| [web/hardware-attention.js](../../../web/hardware-attention.js) | 33 | 9173 |
| [web/index.html](../../../web/index.html) | 3 | 595 |
| [web/login.css](../../../web/login.css) | 117 | 9886 |
| [web/login.html](../../../web/login.html) | 8 | 4384 |
| [web/login.js](../../../web/login.js) | 9 | 2039 |
| [web/map-geography.js](../../../web/map-geography.js) | 16 | 914 |
| [web/metric-icons.js](../../../web/metric-icons.js) | 10 | 909 |
| [web/operations.css](../../../web/operations.css) | 6 | 6228 |
| [web/operations.html](../../../web/operations.html) | 2 | 432 |
| [web/operations.js](../../../web/operations.js) | 106 | 31318 |
| [web/painel.css](../../../web/painel.css) | 1084 | 105900 |
| [web/panel-confirm.js](../../../web/panel-confirm.js) | 14 | 1183 |
| [web/panel-pulse.js](../../../web/panel-pulse.js) | 41 | 4343 |
| [web/panel-refinement.css](../../../web/panel-refinement.css) | 6 | 9479 |
| [web/panel-search.html](../../../web/panel-search.html) | 2 | 469 |
| [web/panel-search.js](../../../web/panel-search.js) | 57 | 8232 |
| [web/panel-shell.js](../../../web/panel-shell.js) | 51 | 9216 |
| [web/panel-status.js](../../../web/panel-status.js) | 36 | 2457 |
| [web/panel-usage.js](../../../web/panel-usage.js) | 61 | 6797 |
| [web/panorama-layout.css](../../../web/panorama-layout.css) | 66 | 8024 |
| [web/pending-collections.html](../../../web/pending-collections.html) | 2 | 487 |
| [web/pending-collections.js](../../../web/pending-collections.js) | 32 | 5877 |
| [web/photo-prepare.js](../../../web/photo-prepare.js) | 45 | 4703 |
| [web/photo-viewer.js](../../../web/photo-viewer.js) | 31 | 6082 |
| [web/provider-report.js](../../../web/provider-report.js) | 62 | 8576 |
| [web/runtime-config.js](../../../web/runtime-config.js) | 4 | 158 |
| [web/school-presence.js](../../../web/school-presence.js) | 81 | 4784 |
| [web/spreadsheet-io.js](../../../web/spreadsheet-io.js) | 13 | 4518 |
| [web/styles.css](../../../web/styles.css) | 2 | 7915 |
| [web/technician-avatar.js](../../../web/technician-avatar.js) | 49 | 5277 |
| [web/technician.css](../../../web/technician.css) | 3 | 3138 |
| [web/technician.html](../../../web/technician.html) | 2 | 600 |
| [web/technician.js](../../../web/technician.js) | 32 | 10894 |
| [web/tokens.css](../../../web/tokens.css) | 51 | 6205 |
| [web/unit-catalogue.css](../../../web/unit-catalogue.css) | 34 | 3889 |
| [web/unit-figures.js](../../../web/unit-figures.js) | 14 | 2732 |
| [web/unit-map-palette.js](../../../web/unit-map-palette.js) | 15 | 1061 |
| [web/unit-name-picker.js](../../../web/unit-name-picker.js) | 50 | 4991 |
| [web/unit-names.js](../../../web/unit-names.js) | 61 | 6455 |
| [web/unit-schema.js](../../../web/unit-schema.js) | 241 | 11409 |
| [web/visit-schema.js](../../../web/visit-schema.js) | 32 | 3893 |
| [web/visit.html](../../../web/visit.html) | 2 | 509 |
| [web/visit.js](../../../web/visit.js) | 56 | 21846 |

## migrations

| Arquivo | Linhas | Bytes |
|---|---:|---:|
| [migrations/0001_auth.sql](../../../migrations/0001_auth.sql) | 7 | 879 |
| [migrations/0002_credential_version.sql](../../../migrations/0002_credential_version.sql) | 3 | 155 |
| [migrations/0003_units_assignments.sql](../../../migrations/0003_units_assignments.sql) | 6 | 867 |
| [migrations/0004_unit_manager.sql](../../../migrations/0004_unit_manager.sql) | 2 | 68 |
| [migrations/0005_review_catalogue.sql](../../../migrations/0005_review_catalogue.sql) | 8 | 541 |
| [migrations/0006_collector.sql](../../../migrations/0006_collector.sql) | 19 | 3312 |
| [migrations/0007_collector_totals.sql](../../../migrations/0007_collector_totals.sql) | 11 | 1483 |
| [migrations/0008_collector_publication.sql](../../../migrations/0008_collector_publication.sql) | 6 | 730 |
| [migrations/0009_published_totals.sql](../../../migrations/0009_published_totals.sql) | 9 | 1824 |
| [migrations/0010_in_progress.sql](../../../migrations/0010_in_progress.sql) | 17 | 2397 |
| [migrations/0011_root_deletion.sql](../../../migrations/0011_root_deletion.sql) | 6 | 556 |
| [migrations/0012_visit_answers.sql](../../../migrations/0012_visit_answers.sql) | 2 | 212 |
| [migrations/0013_photo_storage.sql](../../../migrations/0013_photo_storage.sql) | 16 | 1957 |
| [migrations/0014_agentes.sql](../../../migrations/0014_agentes.sql) | 252 | 10735 |
| [migrations/0015_questionario_v3.sql](../../../migrations/0015_questionario_v3.sql) | 30 | 4979 |
| [migrations/0016_unidades_cadastro_ampliado.sql](../../../migrations/0016_unidades_cadastro_ampliado.sql) | 17 | 2147 |
| [migrations/0017_agent_monitoring.sql](../../../migrations/0017_agent_monitoring.sql) | 35 | 1439 |
| [migrations/0018_service_desk.sql](../../../migrations/0018_service_desk.sql) | 52 | 1781 |
| [migrations/0019_photo_indexes.sql](../../../migrations/0019_photo_indexes.sql) | 4 | 276 |
| [migrations/0020_photo_thumbnails.sql](../../../migrations/0020_photo_thumbnails.sql) | 12 | 1016 |
| [migrations/0021_environment_names.sql](../../../migrations/0021_environment_names.sql) | 18 | 689 |
| [migrations/0022_equipment_names.sql](../../../migrations/0022_equipment_names.sql) | 26 | 971 |
| [migrations/0023_equipment_deletions.sql](../../../migrations/0023_equipment_deletions.sql) | 31 | 2785 |
| [migrations/0024_hardware_reviews.sql](../../../migrations/0024_hardware_reviews.sql) | 17 | 704 |
| [migrations/0025_school_registration.sql](../../../migrations/0025_school_registration.sql) | 30 | 4312 |
| [migrations/0026_provider_reports.sql](../../../migrations/0026_provider_reports.sql) | 21 | 908 |
| [migrations/0027_technical_dispatch.sql](../../../migrations/0027_technical_dispatch.sql) | 53 | 5416 |
| [migrations/0028_dispatch_road_routes.sql](../../../migrations/0028_dispatch_road_routes.sql) | 24 | 1072 |
| [migrations/0029_technician_avatars.sql](../../../migrations/0029_technician_avatars.sql) | 17 | 1047 |
| [migrations/0030_d1_read_budget.sql](../../../migrations/0030_d1_read_budget.sql) | 58 | 4256 |
| [migrations/0031_panel_read_revisions.sql](../../../migrations/0031_panel_read_revisions.sql) | 109 | 9305 |

## android

| Arquivo | Linhas | Bytes |
|---|---:|---:|
| [android/technician/AndroidManifest.xml](../../../android/technician/AndroidManifest.xml) | 16 | 1514 |
| [android/technician/res/drawable/app_icon.xml](../../../android/technician/res/drawable/app_icon.xml) | 2 | 419 |
| [android/technician/src/br/gov/ma/pacodolumiar/semed/tecnico/Api.java](../../../android/technician/src/br/gov/ma/pacodolumiar/semed/tecnico/Api.java) | 17 | 1541 |
| [android/technician/src/br/gov/ma/pacodolumiar/semed/tecnico/LocationService.java](../../../android/technician/src/br/gov/ma/pacodolumiar/semed/tecnico/LocationService.java) | 16 | 3523 |
| [android/technician/src/br/gov/ma/pacodolumiar/semed/tecnico/MainActivity.java](../../../android/technician/src/br/gov/ma/pacodolumiar/semed/tecnico/MainActivity.java) | 31 | 6736 |
| [android/technician/src/br/gov/ma/pacodolumiar/semed/tecnico/NoticeJob.java](../../../android/technician/src/br/gov/ma/pacodolumiar/semed/tecnico/NoticeJob.java) | 8 | 1803 |

## config

| Arquivo | Linhas | Bytes |
|---|---:|---:|
| [config/wrangler.coletor.example.jsonc](../../../config/wrangler.coletor.example.jsonc) | 11 | 657 |
| [config/wrangler.painel.example.jsonc](../../../config/wrangler.painel.example.jsonc) | 11 | 637 |

## scripts

| Arquivo | Linhas | Bytes |
|---|---:|---:|
| [scripts/bootstrap-auth.mjs](../../../scripts/bootstrap-auth.mjs) | 14 | 2149 |
| [scripts/build-collector.mjs](../../../scripts/build-collector.mjs) | 5 | 2186 |
| [scripts/build-desktop.mjs](../../../scripts/build-desktop.mjs) | 47 | 6151 |
| [scripts/build-technician-android.mjs](../../../scripts/build-technician-android.mjs) | 29 | 3662 |
| [scripts/bundle-desktop.mjs](../../../scripts/bundle-desktop.mjs) | 26 | 2345 |
| [scripts/capturar-proposta-ux.cjs](../../../scripts/capturar-proposta-ux.cjs) | 9 | 2077 |
| [scripts/capture-panel-performance.mjs](../../../scripts/capture-panel-performance.mjs) | 36 | 3146 |
| [scripts/check-doc-links.mjs](../../../scripts/check-doc-links.mjs) | 16 | 1186 |
| [scripts/check-outgoing-history.mjs](../../../scripts/check-outgoing-history.mjs) | 26 | 2510 |
| [scripts/check-repository.mjs](../../../scripts/check-repository.mjs) | 22 | 1733 |
| [scripts/document-code-map.mjs](../../../scripts/document-code-map.mjs) | 27 | 3474 |
| [scripts/document-schema.mjs](../../../scripts/document-schema.mjs) | 22 | 2450 |
| [scripts/export-collector-questionnaire.mjs](../../../scripts/export-collector-questionnaire.mjs) | 147 | 17921 |
| [scripts/export-operation-manual.mjs](../../../scripts/export-operation-manual.mjs) | 36 | 2326 |
| [scripts/extract-map-reference.mjs](../../../scripts/extract-map-reference.mjs) | 26 | 2362 |
| [scripts/gerar-compilado-frontend.mjs](../../../scripts/gerar-compilado-frontend.mjs) | 56 | 10850 |
| [scripts/gerar-proposta-ux-coletor.mjs](../../../scripts/gerar-proposta-ux-coletor.mjs) | 19 | 9115 |
| [scripts/import-map-examples.mjs](../../../scripts/import-map-examples.mjs) | 22 | 2534 |
| [scripts/lib/csv.mjs](../../../scripts/lib/csv.mjs) | 16 | 903 |
| [scripts/measure-d1-budget-local.mjs](../../../scripts/measure-d1-budget-local.mjs) | 92 | 9484 |
| [scripts/measure-panel-read-cache.mjs](../../../scripts/measure-panel-read-cache.mjs) | 53 | 5830 |
| [scripts/measure-panel-sql.mjs](../../../scripts/measure-panel-sql.mjs) | 27 | 3025 |
| [scripts/measure-photo-performance.mjs](../../../scripts/measure-photo-performance.mjs) | 17 | 1154 |
| [scripts/prepare-alternative-questionnaire-v02.mjs](../../../scripts/prepare-alternative-questionnaire-v02.mjs) | 83 | 12644 |
| [scripts/prepare-alternative-questionnaire.mjs](../../../scripts/prepare-alternative-questionnaire.mjs) | 162 | 26998 |
| [scripts/prepare-partial-photos-release.mjs](../../../scripts/prepare-partial-photos-release.mjs) | 56 | 4629 |
| [scripts/preview-partial-photos.mjs](../../../scripts/preview-partial-photos.mjs) | 9 | 982 |
| [scripts/read-live-panel.mjs](../../../scripts/read-live-panel.mjs) | 25 | 2088 |
| [scripts/recover-root.mjs](../../../scripts/recover-root.mjs) | 16 | 2215 |
| [scripts/refine-login.mjs](../../../scripts/refine-login.mjs) | 13 | 2108 |
| [scripts/register-requested-semed.mjs](../../../scripts/register-requested-semed.mjs) | 16 | 3742 |
| [scripts/serve.mjs](../../../scripts/serve.mjs) | 12 | 1023 |
| [scripts/test-partial-photos-release.mjs](../../../scripts/test-partial-photos-release.mjs) | 26 | 2701 |
| [scripts/verificar-ambiente-validacao.mjs](../../../scripts/verificar-ambiente-validacao.mjs) | 38 | 3397 |
| [scripts/verificar-identidade-coletor.mjs](../../../scripts/verificar-identidade-coletor.mjs) | 19 | 2809 |
| [scripts/verify-auth-boundaries.mjs](../../../scripts/verify-auth-boundaries.mjs) | 13 | 2384 |
| [scripts/verify-auth-ui.mjs](../../../scripts/verify-auth-ui.mjs) | 13 | 3863 |
| [scripts/verify-auth.mjs](../../../scripts/verify-auth.mjs) | 44 | 8481 |
| [scripts/verify-clean-inventory.mjs](../../../scripts/verify-clean-inventory.mjs) | 6 | 2326 |
| [scripts/verify-collector-api.mjs](../../../scripts/verify-collector-api.mjs) | 16 | 5562 |
| [scripts/verify-collector-desktop.mjs](../../../scripts/verify-collector-desktop.mjs) | 7 | 2485 |
| [scripts/verify-collector-finish.mjs](../../../scripts/verify-collector-finish.mjs) | 41 | 4526 |
| [scripts/verify-collector-login-visual.mjs](../../../scripts/verify-collector-login-visual.mjs) | 4 | 993 |
| [scripts/verify-collector-photo-block.mjs](../../../scripts/verify-collector-photo-block.mjs) | 10 | 2748 |
| [scripts/verify-collector-production.mjs](../../../scripts/verify-collector-production.mjs) | 9 | 1540 |
| [scripts/verify-collector-review-fixes.mjs](../../../scripts/verify-collector-review-fixes.mjs) | 16 | 5732 |
| [scripts/verify-collector-ui.mjs](../../../scripts/verify-collector-ui.mjs) | 9 | 6078 |
| [scripts/verify-collector-unit-list.mjs](../../../scripts/verify-collector-unit-list.mjs) | 16 | 4086 |
| [scripts/verify-collector-volume.mjs](../../../scripts/verify-collector-volume.mjs) | 7 | 3646 |
| [scripts/verify-connectivity-flow.mjs](../../../scripts/verify-connectivity-flow.mjs) | 23 | 1513 |
| [scripts/verify-d1-budget-backup.mjs](../../../scripts/verify-d1-budget-backup.mjs) | 25 | 2097 |
| [scripts/verify-in-progress.mjs](../../../scripts/verify-in-progress.mjs) | 15 | 4738 |
| [scripts/verify-inep.mjs](../../../scripts/verify-inep.mjs) | 12 | 6313 |
| [scripts/verify-login.mjs](../../../scripts/verify-login.mjs) | 10 | 2008 |
| [scripts/verify-map-default.mjs](../../../scripts/verify-map-default.mjs) | 3 | 115 |
| [scripts/verify-map-framing.mjs](../../../scripts/verify-map-framing.mjs) | 5 | 2365 |
| [scripts/verify-matrix-spacing.mjs](../../../scripts/verify-matrix-spacing.mjs) | 4 | 1035 |
| [scripts/verify-open-enrollment.mjs](../../../scripts/verify-open-enrollment.mjs) | 22 | 2584 |
| [scripts/verify-panel-release.mjs](../../../scripts/verify-panel-release.mjs) | 12 | 1984 |
| [scripts/verify-review-account.mjs](../../../scripts/verify-review-account.mjs) | 12 | 3074 |
| [scripts/verify-review-bulk.mjs](../../../scripts/verify-review-bulk.mjs) | 4 | 1993 |
| [scripts/verify-review-visual.mjs](../../../scripts/verify-review-visual.mjs) | 9 | 3298 |
| [scripts/verify-review.mjs](../../../scripts/verify-review.mjs) | 53 | 9944 |
| [scripts/verify-root-administration.mjs](../../../scripts/verify-root-administration.mjs) | 21 | 6778 |
| [scripts/verify-root-powers.mjs](../../../scripts/verify-root-powers.mjs) | 20 | 2611 |
| [scripts/verify-semed-display.mjs](../../../scripts/verify-semed-display.mjs) | 4 | 2205 |
| [scripts/verify-simple-registration.mjs](../../../scripts/verify-simple-registration.mjs) | 5 | 4548 |
| [scripts/verify-technical-release.mjs](../../../scripts/verify-technical-release.mjs) | 10 | 1607 |

## tests

| Arquivo | Linhas | Bytes |
|---|---:|---:|
| [tests/agent-connection-browser.cjs](../../../tests/agent-connection-browser.cjs) | 27 | 5154 |
| [tests/agent-connection.test.mjs](../../../tests/agent-connection.test.mjs) | 57 | 6207 |
| [tests/agent-monitoring-browser.cjs](../../../tests/agent-monitoring-browser.cjs) | 45 | 9444 |
| [tests/agent-monitoring.test.mjs](../../../tests/agent-monitoring.test.mjs) | 117 | 17135 |
| [tests/agentes-open-enrollment.test.mjs](../../../tests/agentes-open-enrollment.test.mjs) | 79 | 13192 |
| [tests/agentes.test.mjs](../../../tests/agentes.test.mjs) | 163 | 20363 |
| [tests/auth-flow-browser.cjs](../../../tests/auth-flow-browser.cjs) | 58 | 10656 |
| [tests/auth-flow.test.mjs](../../../tests/auth-flow.test.mjs) | 99 | 9743 |
| [tests/browser.cjs](../../../tests/browser.cjs) | 96 | 7995 |
| [tests/collector-environments-browser.cjs](../../../tests/collector-environments-browser.cjs) | 65 | 8241 |
| [tests/collector-environments.test.mjs](../../../tests/collector-environments.test.mjs) | 65 | 5610 |
| [tests/collector-evidence-browser.cjs](../../../tests/collector-evidence-browser.cjs) | 19 | 9935 |
| [tests/collector-identity-browser.cjs](../../../tests/collector-identity-browser.cjs) | 32 | 6827 |
| [tests/collector-list.test.mjs](../../../tests/collector-list.test.mjs) | 36 | 3967 |
| [tests/collector-refinement-browser.cjs](../../../tests/collector-refinement-browser.cjs) | 121 | 13177 |
| [tests/collector-review-fixes.test.mjs](../../../tests/collector-review-fixes.test.mjs) | 40 | 4524 |
| [tests/collector-review-pending-browser.cjs](../../../tests/collector-review-pending-browser.cjs) | 50 | 10629 |
| [tests/collector-review-pending.test.mjs](../../../tests/collector-review-pending.test.mjs) | 77 | 9643 |
| [tests/collector-schema.test.mjs](../../../tests/collector-schema.test.mjs) | 17 | 3526 |
| [tests/collector-ux-audit.cjs](../../../tests/collector-ux-audit.cjs) | 29 | 8044 |
| [tests/collector-ux-browser.cjs](../../../tests/collector-ux-browser.cjs) | 51 | 11945 |
| [tests/collector-v2-browser.cjs](../../../tests/collector-v2-browser.cjs) | 14 | 8632 |
| [tests/collector-v2-qr-browser.cjs](../../../tests/collector-v2-qr-browser.cjs) | 92 | 15542 |
| [tests/collector-v2-qr-lost-response-browser.cjs](../../../tests/collector-v2-qr-lost-response-browser.cjs) | 55 | 9181 |
| [tests/collector-v2.test.mjs](../../../tests/collector-v2.test.mjs) | 28 | 12327 |
| [tests/collector-v3-browser.cjs](../../../tests/collector-v3-browser.cjs) | 57 | 15715 |
| [tests/collector-v3.test.mjs](../../../tests/collector-v3.test.mjs) | 75 | 16124 |
| [tests/d1-budget-soak.cjs](../../../tests/d1-budget-soak.cjs) | 34 | 2969 |
| [tests/d1-budget.test.mjs](../../../tests/d1-budget.test.mjs) | 142 | 13504 |
| [tests/d1-usage-browser.cjs](../../../tests/d1-usage-browser.cjs) | 44 | 6408 |
| [tests/d1-usage.test.mjs](../../../tests/d1-usage.test.mjs) | 70 | 7761 |
| [tests/demand-save-browser.cjs](../../../tests/demand-save-browser.cjs) | 33 | 5799 |
| [tests/demand-unit-search-browser.cjs](../../../tests/demand-unit-search-browser.cjs) | 38 | 7425 |
| [tests/desktop-identity-browser.cjs](../../../tests/desktop-identity-browser.cjs) | 87 | 18369 |
| [tests/desktop-open-enrollment-browser.cjs](../../../tests/desktop-open-enrollment-browser.cjs) | 23 | 4066 |
| [tests/desktop-root-agents-browser.cjs](../../../tests/desktop-root-agents-browser.cjs) | 66 | 10708 |
| [tests/desktop-v2-agent-browser.cjs](../../../tests/desktop-v2-agent-browser.cjs) | 77 | 13849 |
| [tests/desktop.cjs](../../../tests/desktop.cjs) | 72 | 6684 |
| [tests/dispatch-road-routing-browser.cjs](../../../tests/dispatch-road-routing-browser.cjs) | 31 | 5335 |
| [tests/dispatch-road-routing-runtime.cjs](../../../tests/dispatch-road-routing-runtime.cjs) | 26 | 2495 |
| [tests/dispatch-road-routing.test.mjs](../../../tests/dispatch-road-routing.test.mjs) | 58 | 6367 |
| [tests/domain.test.mjs](../../../tests/domain.test.mjs) | 10 | 1538 |
| [tests/environment-rename-browser.cjs](../../../tests/environment-rename-browser.cjs) | 43 | 6823 |
| [tests/environment-rename.test.mjs](../../../tests/environment-rename.test.mjs) | 111 | 11185 |
| [tests/equipment-consultation-browser.cjs](../../../tests/equipment-consultation-browser.cjs) | 44 | 9294 |
| [tests/equipment-consultation.test.mjs](../../../tests/equipment-consultation.test.mjs) | 38 | 4604 |
| [tests/equipment-deletion-browser.cjs](../../../tests/equipment-deletion-browser.cjs) | 22 | 4638 |
| [tests/equipment-deletion.test.mjs](../../../tests/equipment-deletion.test.mjs) | 70 | 11432 |
| [tests/equipment-link-state-browser.cjs](../../../tests/equipment-link-state-browser.cjs) | 41 | 6047 |
| [tests/equipment-link-state.test.mjs](../../../tests/equipment-link-state.test.mjs) | 41 | 4922 |
| [tests/equipment-rename-browser.cjs](../../../tests/equipment-rename-browser.cjs) | 40 | 7480 |
| [tests/equipment-rename.test.mjs](../../../tests/equipment-rename.test.mjs) | 90 | 8565 |
| [tests/fixtures/d1-budget-legacy-queries.json](../../../tests/fixtures/d1-budget-legacy-queries.json) | 6 | 2330 |
| [tests/fixtures/public-road-paco-d106.json](../../../tests/fixtures/public-road-paco-d106.json) | 1 | 967 |
| [tests/google-worker.test.mjs](../../../tests/google-worker.test.mjs) | 35 | 3617 |
| [tests/hardware-review-browser.cjs](../../../tests/hardware-review-browser.cjs) | 24 | 7325 |
| [tests/hardware-review.test.mjs](../../../tests/hardware-review.test.mjs) | 45 | 6864 |
| [tests/helpers/accept-collector-dialogs.cjs](../../../tests/helpers/accept-collector-dialogs.cjs) | 9 | 372 |
| [tests/helpers/agent-client.mjs](../../../tests/helpers/agent-client.mjs) | 73 | 7646 |
| [tests/helpers/agent-connection.mjs](../../../tests/helpers/agent-connection.mjs) | 15 | 1531 |
| [tests/helpers/auth-fixture.mjs](../../../tests/helpers/auth-fixture.mjs) | 24 | 1898 |
| [tests/helpers/avatar-png.mjs](../../../tests/helpers/avatar-png.mjs) | 9 | 942 |
| [tests/helpers/collector-db.mjs](../../../tests/helpers/collector-db.mjs) | 18 | 2840 |
| [tests/helpers/collector-http.mjs](../../../tests/helpers/collector-http.mjs) | 15 | 2425 |
| [tests/helpers/dispatch-fixture.mjs](../../../tests/helpers/dispatch-fixture.mjs) | 7 | 1644 |
| [tests/helpers/equipment-consultation.mjs](../../../tests/helpers/equipment-consultation.mjs) | 27 | 4914 |
| [tests/helpers/equipment-link-state.mjs](../../../tests/helpers/equipment-link-state.mjs) | 13 | 1082 |
| [tests/helpers/fake-drive.mjs](../../../tests/helpers/fake-drive.mjs) | 35 | 4562 |
| [tests/helpers/hardware-change.mjs](../../../tests/helpers/hardware-change.mjs) | 10 | 1310 |
| [tests/helpers/map-demands.mjs](../../../tests/helpers/map-demands.mjs) | 15 | 1485 |
| [tests/helpers/panel-blocks.mjs](../../../tests/helpers/panel-blocks.mjs) | 21 | 1644 |
| [tests/helpers/panel-browser.cjs](../../../tests/helpers/panel-browser.cjs) | 11 | 2265 |
| [tests/helpers/photo-performance.mjs](../../../tests/helpers/photo-performance.mjs) | 27 | 3206 |
| [tests/helpers/playwright.cjs](../../../tests/helpers/playwright.cjs) | 13 | 598 |
| [tests/helpers/provider-report.mjs](../../../tests/helpers/provider-report.mjs) | 22 | 2521 |
| [tests/helpers/routing-provider.mjs](../../../tests/helpers/routing-provider.mjs) | 7 | 561 |
| [tests/helpers/select-environment.cjs](../../../tests/helpers/select-environment.cjs) | 15 | 787 |
| [tests/in-progress-photos.test.mjs](../../../tests/in-progress-photos.test.mjs) | 46 | 4395 |
| [tests/in-progress.test.mjs](../../../tests/in-progress.test.mjs) | 40 | 5739 |
| [tests/inventory-results.test.mjs](../../../tests/inventory-results.test.mjs) | 15 | 3579 |
| [tests/management-views-browser.cjs](../../../tests/management-views-browser.cjs) | 42 | 9193 |
| [tests/management-views.test.mjs](../../../tests/management-views.test.mjs) | 58 | 8915 |
| [tests/map-browser.cjs](../../../tests/map-browser.cjs) | 51 | 6977 |
| [tests/map-demands-browser.cjs](../../../tests/map-demands-browser.cjs) | 57 | 10158 |
| [tests/map-examples.test.mjs](../../../tests/map-examples.test.mjs) | 5 | 548 |
| [tests/map-geography.test.mjs](../../../tests/map-geography.test.mjs) | 17 | 1353 |
| [tests/operations-browser.cjs](../../../tests/operations-browser.cjs) | 27 | 5618 |
| [tests/operations-network-browser.cjs](../../../tests/operations-network-browser.cjs) | 37 | 6124 |
| [tests/panel-async-browser.cjs](../../../tests/panel-async-browser.cjs) | 91 | 10270 |
| [tests/panel-blocks-browser.cjs](../../../tests/panel-blocks-browser.cjs) | 54 | 10811 |
| [tests/panel-blocks.test.mjs](../../../tests/panel-blocks.test.mjs) | 27 | 2051 |
| [tests/panel-mesa-browser.cjs](../../../tests/panel-mesa-browser.cjs) | 55 | 6175 |
| [tests/panel-navigation-browser.cjs](../../../tests/panel-navigation-browser.cjs) | 48 | 6565 |
| [tests/panel-performance-browser.cjs](../../../tests/panel-performance-browser.cjs) | 44 | 4120 |
| [tests/panel-performance-round2-browser.cjs](../../../tests/panel-performance-round2-browser.cjs) | 69 | 6447 |
| [tests/panel-performance-round2.test.mjs](../../../tests/panel-performance-round2.test.mjs) | 42 | 3936 |
| [tests/panel-performance.test.mjs](../../../tests/panel-performance.test.mjs) | 59 | 4806 |
| [tests/panel-read-cache-browser.cjs](../../../tests/panel-read-cache-browser.cjs) | 44 | 4004 |
| [tests/panel-read-cache.test.mjs](../../../tests/panel-read-cache.test.mjs) | 144 | 12464 |
| [tests/panel-search-browser.cjs](../../../tests/panel-search-browser.cjs) | 24 | 6008 |
| [tests/panel-search.test.mjs](../../../tests/panel-search.test.mjs) | 47 | 6817 |
| [tests/panel-usability-browser.cjs](../../../tests/panel-usability-browser.cjs) | 52 | 9473 |
| [tests/panorama-map-browser.cjs](../../../tests/panorama-map-browser.cjs) | 48 | 7226 |
| [tests/pending-indicators-browser.cjs](../../../tests/pending-indicators-browser.cjs) | 43 | 7040 |
| [tests/pending-indicators.test.mjs](../../../tests/pending-indicators.test.mjs) | 66 | 8198 |
| [tests/photo-gallery.test.mjs](../../../tests/photo-gallery.test.mjs) | 37 | 4485 |
| [tests/photo-performance-browser.cjs](../../../tests/photo-performance-browser.cjs) | 48 | 7048 |
| [tests/photo-performance.test.mjs](../../../tests/photo-performance.test.mjs) | 84 | 8794 |
| [tests/photo-storage.test.mjs](../../../tests/photo-storage.test.mjs) | 167 | 18247 |
| [tests/photo-thumbnails-browser.cjs](../../../tests/photo-thumbnails-browser.cjs) | 50 | 11877 |
| [tests/photo-thumbnails.test.mjs](../../../tests/photo-thumbnails.test.mjs) | 79 | 10378 |
| [tests/provider-report-browser.cjs](../../../tests/provider-report-browser.cjs) | 40 | 8433 |
| [tests/provider-report-history.test.mjs](../../../tests/provider-report-history.test.mjs) | 86 | 8754 |
| [tests/provider-report.test.mjs](../../../tests/provider-report.test.mjs) | 39 | 4304 |
| [tests/remote-access-fields.test.mjs](../../../tests/remote-access-fields.test.mjs) | 45 | 4725 |
| [tests/revisao-independente.test.mjs](../../../tests/revisao-independente.test.mjs) | 433 | 58061 |
| [tests/root-powers.test.mjs](../../../tests/root-powers.test.mjs) | 62 | 6991 |
| [tests/school-presence-browser.cjs](../../../tests/school-presence-browser.cjs) | 77 | 11769 |
| [tests/school-presence.test.mjs](../../../tests/school-presence.test.mjs) | 28 | 1606 |
| [tests/school-registration-browser.cjs](../../../tests/school-registration-browser.cjs) | 17 | 4643 |
| [tests/school-registration.test.mjs](../../../tests/school-registration.test.mjs) | 13 | 5507 |
| [tests/security.test.mjs](../../../tests/security.test.mjs) | 22 | 1611 |
| [tests/service-desk.test.mjs](../../../tests/service-desk.test.mjs) | 64 | 8883 |
| [tests/technical-dispatch-browser.cjs](../../../tests/technical-dispatch-browser.cjs) | 22 | 5618 |
| [tests/technical-dispatch.test.mjs](../../../tests/technical-dispatch.test.mjs) | 64 | 9895 |
| [tests/technician-avatars-browser.cjs](../../../tests/technician-avatars-browser.cjs) | 22 | 4878 |
| [tests/technician-avatars.test.mjs](../../../tests/technician-avatars.test.mjs) | 42 | 6672 |
| [tests/tour-logic-browser.cjs](../../../tests/tour-logic-browser.cjs) | 32 | 7205 |
| [tests/tour-logic.test.mjs](../../../tests/tour-logic.test.mjs) | 30 | 5650 |
| [tests/unit-catalogue-browser.cjs](../../../tests/unit-catalogue-browser.cjs) | 32 | 9357 |
| [tests/unit-catalogue.test.mjs](../../../tests/unit-catalogue.test.mjs) | 17 | 8182 |
| [tests/unit-files.test.mjs](../../../tests/unit-files.test.mjs) | 27 | 2276 |
| [tests/unit-names.test.mjs](../../../tests/unit-names.test.mjs) | 7 | 1654 |
| [tests/units.test.mjs](../../../tests/units.test.mjs) | 9 | 2243 |
| [tests/v2-fase2.test.mjs](../../../tests/v2-fase2.test.mjs) | 51 | 7354 |
| [tests/validation-probe.test.mjs](../../../tests/validation-probe.test.mjs) | 33 | 2406 |
| [tests/visit.test.mjs](../../../tests/visit.test.mjs) | 27 | 4626 |

## configuração raiz

| Arquivo | Linhas | Bytes |
|---|---:|---:|
| [.github/workflows/ci.yml](../../../.github/workflows/ci.yml) | 156 | 4319 |
| [package.json](../../../package.json) | 84 | 6725 |
| [pnpm-lock.yaml](../../../pnpm-lock.yaml) | 2982 | 93879 |
| [wrangler.collector.jsonc](../../../wrangler.collector.jsonc) | 12 | 709 |
| [wrangler.jsonc](../../../wrangler.jsonc) | 22 | 1566 |
| [wrangler.validation.jsonc](../../../wrangler.validation.jsonc) | 30 | 986 |
| [wrangler.validation.painel.jsonc](../../../wrangler.validation.painel.jsonc) | 21 | 1497 |

## API e dependências de plataforma por módulo servidor

### server/agent-crypto.mjs

Sem rota literal detectada; pode ser auxiliar ou compor caminhos dinamicamente.

### server/agent-monitoring.mjs

Ambiente: `APP_KIND`, `DB`.

- `/api/inventory/communication-log`
- `/api/inventory/monitoring`
- `/api/inventory/notifications/read`
- `/api/inventory/panel-status`

### server/agentes/catalogo.mjs

Sem rota literal detectada; pode ser auxiliar ou compor caminhos dinamicamente.

### server/agentes/connection.mjs

Sem rota literal detectada; pode ser auxiliar ou compor caminhos dinamicamente.

### server/agentes/index.mjs

Ambiente: `AGENTES_EXIGIR_AUTORIZACAO`, `AGENTES_EXIGIR_VISTORIA`, `AGENTES_GUARDAR_HEARTBEATS`, `AGENTES_INTERVALO_HEARTBEAT`, `AGENTES_LOTE_MAX_HORAS`, `AGENTES_LOTE_MAX_MAQUINAS`, `AGENTES_SNAPSHOTS_POR_MAQUINA`, `DB`.

- `/api/agent/v1`
- `/api/inventory/agent-history`
- `/api/inventory/agent-status`
- `/api/inventory/equipment-location`
- `/api/inventory/equipment-location-status`
- `/api/root/agent-devices`
- `/api/root/agent-install-grants`
- `/api/root/agent-install-grants/revoke`
- `/api/root/agent-maintenance`
- `/api/root/agent-revoke`

### server/agentes/nucleo/catalogo.mjs

Sem rota literal detectada; pode ser auxiliar ou compor caminhos dinamicamente.

### server/agentes/nucleo/crypto.mjs

Sem rota literal detectada; pode ser auxiliar ou compor caminhos dinamicamente.

### server/agentes/nucleo/d1-store.mjs

Ambiente: `DB`.

Sem rota literal detectada; pode ser auxiliar ou compor caminhos dinamicamente.

### server/agentes/nucleo/enrollment-policy.mjs

Sem rota literal detectada; pode ser auxiliar ou compor caminhos dinamicamente.

### server/agentes/nucleo/store.mjs

Sem rota literal detectada; pode ser auxiliar ou compor caminhos dinamicamente.

### server/agentes/nucleo/validate.mjs

Sem rota literal detectada; pode ser auxiliar ou compor caminhos dinamicamente.

### server/agentes/nucleo/worker.mjs

Ambiente: `HUMAN_ORIGINS`.

- `/api/agent/v1`
- `/api/inventory/agent-history`
- `/api/inventory/agent-status`
- `/api/inventory/equipment-location`
- `/api/root/agent-install-grants`
- `/api/root/agent-install-grants/revoke`
- `/api/root/agent-reconcile`
- `/api/root/agent-revoke`
- `/api/root/hardware-event-review`

### server/agentes/presence.mjs

Ambiente: `AGENTES_INTERVALO_HEARTBEAT`.

Sem rota literal detectada; pode ser auxiliar ou compor caminhos dinamicamente.

### server/asset-response.mjs

Ambiente: `ASSETS`.

- `/api/`

### server/collector-access.mjs

Sem rota literal detectada; pode ser auxiliar ou compor caminhos dinamicamente.

### server/collector-v2.mjs

Ambiente: `DB`.

Sem rota literal detectada; pode ser auxiliar ou compor caminhos dinamicamente.

### server/collector-v3.mjs

Ambiente: `DB`.

Sem rota literal detectada; pode ser auxiliar ou compor caminhos dinamicamente.

### server/collector.mjs

Ambiente: `APP_KIND`, `DB`.

- `/api/collector/`
- `/api/collector/capabilities`
- `/api/collector/environment-rename`
- `/api/collector/environment-save`
- `/api/collector/environments`
- `/api/collector/equipment-list`
- `/api/collector/equipment-lock`
- `/api/collector/equipment-save`
- `/api/collector/equipment-unlock`
- `/api/collector/finish`
- `/api/collector/inspection`
- `/api/collector/inventory-section`
- `/api/collector/photo`
- `/api/collector/photo-list`
- `/api/collector/photo-remove`
- `/api/collector/photo-upload`
- `/api/collector/review`
- `/api/collector/section-save`
- `/api/collector/start`
- `/api/collector/v2-problems`
- `/api/collector/v2-start`
- `/api/collector/v3-start`
- `/api/collector/verify`
- `/api/inventory/`
- `/api/inventory/equipment`
- `/api/inventory/summary`
- `/api/inventory/unit`

### server/communication-log.mjs

Ambiente: `APP_KIND`, `DB`.

Sem rota literal detectada; pode ser auxiliar ou compor caminhos dinamicamente.

### server/d1-budget.mjs

Sem rota literal detectada; pode ser auxiliar ou compor caminhos dinamicamente.

### server/d1-usage.mjs

Ambiente: `APP_KIND`, `CLOUDFLARE_ANALYTICS_TOKEN`, `USAGE_ACCOUNT_ID`, `USAGE_CACHE`.

- `/api/root/d1-usage`

### server/dispatch-road-routing.mjs

Ambiente: `DB`, `ROUTING_FETCH`.

Sem rota literal detectada; pode ser auxiliar ou compor caminhos dinamicamente.

### server/environments.mjs

Ambiente: `APP_KIND`, `DB`.

- `/api/root/environment-rename`
- `/api/root/environments`

### server/equipment-deletions.mjs

Ambiente: `APP_KIND`, `DB`.

- `/api/root/equipment-delete`
- `/api/root/equipment-deleted`

### server/equipment-link-state.mjs

Sem rota literal detectada; pode ser auxiliar ou compor caminhos dinamicamente.

### server/equipment-names.mjs

Ambiente: `APP_KIND`, `DB`.

- `/api/root/equipment-name`

### server/google-auth.mjs

Ambiente: `DB`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_LOGIN_HINT`, `PHOTO_STORAGE_PROVIDER`.

- `/api/root/google/`
- `/api/root/google/callback`
- `/api/root/google/disconnect`
- `/api/root/google/start`
- `/api/root/google/status`
- `/api/root/google/test`

### server/hardware-review.mjs

Ambiente: `APP_KIND`, `DB`.

- `/api/inventory/hardware-alerts`
- `/api/inventory/hardware-review`

### server/import-units.mjs

- `/api/root/import-`
- `/api/root/import-confirm`
- `/api/root/import-preview`

### server/in-progress-photos.mjs

Ambiente: `DB`.

- `/api/inventory/in-progress-photo`
- `/api/inventory/in-progress-photos`

### server/in-progress.mjs

Ambiente: `DB`.

- `/api/inventory/in-progress`
- `/api/inventory/in-progress-detail`
- `/api/inventory/in-progress-equipment`

### server/inventory-equipment.mjs

Ambiente: `APP_KIND`, `DB`.

Sem rota literal detectada; pode ser auxiliar ou compor caminhos dinamicamente.

### server/inventory-results.mjs

Ambiente: `DB`.

- `/api/inventory/findings`
- `/api/inventory/results`

### server/management-views.mjs

Ambiente: `APP_KIND`, `DB`.

- `/api/inventory/computer-report`
- `/api/inventory/provider-report`
- `/api/inventory/provider-report-saved`
- `/api/inventory/provider-reports`
- `/api/inventory/work-plan`

### server/monitoring-queries.mjs

Sem rota literal detectada; pode ser auxiliar ou compor caminhos dinamicamente.

### server/panel-read-cache.mjs

Sem rota literal detectada; pode ser auxiliar ou compor caminhos dinamicamente.

### server/panel-search.mjs

Ambiente: `APP_KIND`, `DB`.

- `/api/inventory/search`

### server/pending-indicators.mjs

Ambiente: `APP_KIND`, `DB`.

- `/api/inventory/pending-collections`
- `/api/inventory/pending-summary`

### server/photo-gallery.mjs

Ambiente: `DB`.

- `/api/inventory/photo`
- `/api/inventory/photos`

### server/photo-labels.mjs

Sem rota literal detectada; pode ser auxiliar ou compor caminhos dinamicamente.

### server/photo-read.mjs

Ambiente: `DB`.

Sem rota literal detectada; pode ser auxiliar ou compor caminhos dinamicamente.

### server/photo-response.mjs

Sem rota literal detectada; pode ser auxiliar ou compor caminhos dinamicamente.

### server/photo-storage.mjs

Ambiente: `DB`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_TOKEN_KEY`, `PHOTOS`, `PHOTO_STORAGE_PROVIDER`.

Sem rota literal detectada; pode ser auxiliar ou compor caminhos dinamicamente.

### server/photo-thumbnails.mjs

Ambiente: `APP_KIND`, `DB`.

- `/api/collector/photo-thumb`
- `/api/root/photo-thumbnails`

### server/provider-report-history.mjs

Ambiente: `APP_KIND`, `DB`.

Sem rota literal detectada; pode ser auxiliar ou compor caminhos dinamicamente.

### server/provider-report.mjs

Sem rota literal detectada; pode ser auxiliar ou compor caminhos dinamicamente.

### server/request-timing.mjs

Ambiente: `APP_KIND`, `DB`.

- `/api/`

### server/security.mjs

Sem rota literal detectada; pode ser auxiliar ou compor caminhos dinamicamente.

### server/service-desk.mjs

Ambiente: `APP_KIND`, `DB`.

- `/api/operations/`
- `/api/operations/computers`
- `/api/operations/context`
- `/api/operations/queue-summary`
- `/api/operations/request-save`
- `/api/operations/requests`
- `/api/operations/units`

### server/technical-dispatch.mjs

Ambiente: `APP_KIND`, `DB`.

- `/api/dispatch/`
- `/api/technician/`

### server/technician-avatars.mjs

Ambiente: `APP_KIND`, `DB`.

- `/api/dispatch/`

### server/unit-deletion.mjs

- `/api/root/photo-cleanup`
- `/api/root/unit-delete`
- `/api/root/unit-delete-preview`

### server/unit-scope.mjs

Sem rota literal detectada; pode ser auxiliar ou compor caminhos dinamicamente.

### server/unit-validation.mjs

Sem rota literal detectada; pode ser auxiliar ou compor caminhos dinamicamente.

### server/units.mjs

- `/api/root/`
- `/api/root/assignments`
- `/api/root/unit-save`
- `/api/root/units`
- `/api/root/user-role`
- `/api/units`

### server/visit-routes.mjs

Ambiente: `DB`, `PHOTOS`.

- `/api/collector/visit`
- `/api/collector/visit-save`
- `/api/collector/visit-start`

### server/worker.mjs

Ambiente: `APP_KIND`, `AUTH_PEPPER`, `DB`, `DEBUG_COLLECTION`.

- `/api/`
- `/api/admin/`
- `/api/admin/audit`
- `/api/admin/create`
- `/api/admin/reset`
- `/api/admin/revoke`
- `/api/admin/settings`
- `/api/admin/status`
- `/api/admin/users`
- `/api/auth/login`
- `/api/auth/logout`
- `/api/auth/me`
- `/api/auth/password`
- `/api/auth/revoke`
- `/api/auth/sessions`
- `/api/collector/`
- `/api/collector/photo-thumb`
- `/api/collector/photo-upload`
- `/api/dispatch/`
- `/api/dispatch/avatar`
- `/api/operations/`
- `/api/root/assignments`
- `/api/root/import-preview`
- `/api/root/photo-thumbnails`
- `/api/root/unit-save`
- `/api/technician/`
