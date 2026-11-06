# Como os dois ambientes compartilham dados — contratos em alto nível

```text
COLETOR MOBILE (somente cadastro/conferência)
  ├─ autentica usuário / carrega escolas autorizadas
  ├─ abre/retoma vistoria contínua, com versão do questionário
  ├─ registra alteração e foto (eventualmente offline)
  └─ envia / aguarda confirmação oficial da vistoria
                        │ API Cloudflare Workers
                        ├─ autorização em servidor + validação + versões
                        ├─ D1: usuários, escolas, ambientes, equipamentos,
                        │      vistorias, perguntas, mudanças, pendências,
                        │      metadados de fotografias
                        └─ R2: objetos de fotografia e miniaturas
                        │
PAINEL DESKTOP (somente dados oficiais na análise)
  ├─ mapa da rede escolar quando houver coordenadas verificadas
  ├─ matriz por escola e categoria, sem contar revisitas
  ├─ perfil de unidade e fotos autorizadas
  └─ relatórios e indicadores após especificar seus cálculos
```

### Invariantes aprovados
- D1 guarda dados estruturados; R2 guarda binários; Worker autoriza e intermedeia. Fotos não devem ser públicas por padrão.
- Cliente mobile nunca dispõe de chave privada R2/D1.
- Duplicidades, transferências, conferência e histórico obedecem Base §§7–9.
- Invariantes de conclusão: fotos obrigatórias sincronizadas ou justificadas, revisão confirmada, backend confirmou.
- Referência de fotografia em metadados D1 deve apontar para um objeto válido R2 após confirmação.
- Integrações externas futuras previstas, sem provedor ou contrato específico aprovado.

### Não é contrato de endpoints
Endpoints HTTP, schemas JSON, migrações SQL e bibliotecas de autenticação dependem do projeto de implementação. O Codex deverá apresentar proposta técnica e verificar limites de D1/R2 e dos navegadores. Não transformar nomes sugeridos de tabelas em decisão aprovada.
