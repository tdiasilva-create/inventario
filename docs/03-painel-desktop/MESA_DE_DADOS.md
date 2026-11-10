# Mesa de dados e login — D-080, 10/11/2026

## Fontes consultadas

Pacotes originais:

- `entrega-claude-painel-mesa-de-dados-2026-11-10.zip` — SHA256 `d5f322fb488dba7526eeb1fdaf1c12ca3873c2b2f686647b2ed86a81debb38f6`.
- `entrega-claude-login-painel-2026-11-10.zip` — SHA256 `0b3a2d2ac0935939ad9d14c05941f8ecec7643908cb17087775bca253b32c053`.
- Comparações `ANTES-vs-DEPOIS-computadores.jpg`, `ANTES-vs-DEPOIS-panorama.jpg`, `ANTES-vs-DEPOIS-390x844.jpg`, `ANTES-vs-DEPOIS-1440x900.jpg`.

Lidos em ambos os pacotes: `00_LEIA_PRIMEIRO.txt`, `01_ARQUIVOS_E_DESTINOS.txt`, `02_PASSO_A_PASSO_PUBLICACAO.txt`, `03_ROTEIRO_TESTE_VISUAL.txt`, `04_ALTERACOES_EXPLICADAS.txt`, `MANIFESTO_SHA256.txt`; no painel também `05_PROPOSTA_DECISAO.txt`, `raiz/PRODUCT.md`, `raiz/DESIGN.md`. Revisados arquivos HTML/CSS/JS e os patches contra o HEAD atual. As cópias completas dos patches não substituíram indiscriminadamente o projeto.

Integridade: 98 arquivos do painel e 43 do login conferem com os manifestos. Cada manifesto inclui um hash de si próprio que não confere; essa entrada autorreferente foi registrada, sem tratar os demais arquivos como corrompidos. Hashes dos ZIPs e dos arquivos efetivamente publicados ficam preservados nos registros de entrega/build.

Governança consultada: leitura inicial, AGENTS, precedência, decisões, pendências, conflitos, especificações desktop e registros de aceite D-065–D-079. Referências desktop originais continuam históricas para composição; os novos pacotes refinam densidade/apresentação. O coletor não muda.

## Aplicação e limites

1. Nova moldura compartilhada entre consulta, computadores/demandas e administração. Mesmos menus e regras de acesso, com trilho de ícones, nomes ao expandir e fixação opcional.
2. Resumo superior lê `/api/operations/units`, `/api/operations/queue-summary` e `/api/inventory/in-progress`. Mostra comunicação, sem comunicação recente, sem agente, demandas pendentes e coletas em andamento. Escopo global, independente dos filtros locais. Atualização de 60 s apenas com aba visível; mantém 15 s nas telas já existentes. Sem nova escrita/API/migração.
3. Falha HTTP, dados inválidos ou sessão sem acesso geram indisponibilidade, não contagem zero. Controlador cancela leituras/listeners anteriores ao reiniciar a moldura. As sessões continuam sendo verificadas pelo Worker.
4. Folha `web/painel.css` substitui o carregamento de 13 CSS antigos. Leaflet e tokens permanecem. A página de erro também referencia a nova folha. Arquivos antigos são históricos, fora do pacote publicado.
5. Login conserva autenticação, redefinição administrativa e tratamento da senha. Mudam layout, rótulos, tamanhos, foco e apresentação de mensagens. Favicon público; CSS e dados do painel continuam autenticados.
6. D-079 foi preservada na folha nova com estilos distintos de vínculo/cadastro. Fixação do menu não cobre permanentemente o conteúdo; expansão também funciona por teclado; Escape fecha o menu móvel.
7. `PRODUCT.md` e `DESIGN.md` foram adaptados à governança real, sem congelar contagens dos exemplos. A numeração D-079 proposta pelo pacote foi substituída por D-080, pois D-079 já identifica a melhoria de vínculo.

## Aceite

- Login desktop/390 px legível, campos e mostrar senha funcionais; sem rolagem horizontal; ajuda e mensagens preservadas.
- Menu acessível por teclado, fixação persistida e conteúdo recuado; navegação móvel e atalhos sem capturar campos/diálogos.
- Resumo superior coincide com as APIs; erro explícito e recuperação, sem zero fictício.
- Panorama preserva mapa, 11 blocos, sete categorias, filtros e matriz; consultas oficiais/parciais mantêm separação.
- Etiquetas, fotos, edição de nomes, exclusão com prévia, demandas e notificações continuam com permissões atuais.
- Nenhuma escrita fictícia, exclusão, migração ou publicação do coletor em produção.

Testes e versão publicada: [registro de qualidade](../05-qualidade/MESA_DADOS_LOGIN_2026-11-10.md).
