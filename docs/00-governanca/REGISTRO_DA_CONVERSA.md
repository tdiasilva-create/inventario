# Decisões da conversa — preservação de contexto, sem fingir transcrição literal

Este registro é **síntese verificável do que foi decidido**; não é uma transcrição integral de todos os turnos. O questionário mobile foi consolidado no TXT original fornecido pelo responsável.

## Evolução da concepção
- Fluxo anterior: Google Planilhas → APIs → páginas HTML; novo sistema exige banco estruturado, fotos, relatórios e integrações futuras.
- Stack escolhida: Cloudflare D1 + R2; Workers para API/backend. Páginas HTML/JS continuam possíveis, sem stack frontend definitivamente aprovada.
- Separação deliberada de duas experiências: **coletor mobile apenas cadastra e atualiza informações**; **painel desktop analisa, consulta e apresenta**. Evitar reduzir painel para celular ou fazer o coletor mostrar gráficos.
- Catálogo escolar oficial: administrador fornece cerca de 90 unidades; coletor somente seleciona autorizadas, não cria escolas.
- Inventário contínuo com verificação de itens existentes e histórico; visitas parciais e coletas colaborativas (TXT consolidado).
- Mobile escolhido: **Mobile-First Task-Oriented Wizard + Card-Based Navigation + Guided Data Entry**, com referência dark-tech azul-marinho, cartões coloridos, etapas curtas, captura por câmera/galeria, confirmação de cadastro. A aprovação é de **linguagem visual**, não de campos inventados na imagem.
- Desktop escolhido: **Centro de Inteligência Tecnológica**, com mapa da rede, matriz colorida de equipamentos por unidade e detalhe de unidade selecionada; grandes boxes/KPIs genéricos foram rejeitados. Foram aprovados estudos setoriais adicionais.
- Repositório de referência: `tdiasilva-create/inventario`; os dados da Wiki não foram confirmados e a conexão do ChatGPT era somente leitura na última verificação.

## Não confundir desejos com decisões
- Ideias de mapas/regiões, ranking, alertas, relatórios avançados, exportações e novas APIs têm estética aprovada em imagens, mas sem todas as regras e integrações aprovadas.
- Não foi fornecida planilha oficial das 90 escolas nem brasão institucional autorizado; imagens contêm ilustrações.
- Não houve aprovação de framework específico (React/Vue/Svelte etc.). Codex deve inspecionar o repositório e propor alternativas quando necessário.

## Recuperação de falas exatas
Para reprodução textual rigorosa de uma fala antiga, consultar a conversa original. Este repositório conserva **decisões, artefatos e justificativas**, não afirma preservar a transcrição completa da conversa.
