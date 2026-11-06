# Estados transacionais, imagens e sincronização

## Cinco resultados que jamais podem ser confundidos
1. `Item salvo localmente`: dados presentes apenas no navegador/dispositivo. Ainda pode faltar servidor/foto.
2. `Item sincronizado`: API confirmou dados do item. Pode não ser oficial até conclusão da vistoria.
3. `Cartão concluído`: coletor marcou manualmente e as validações do cartão passaram. Não equivale à vistoria oficial.
4. `Vistoria concluída`: revisão/confirmacão explícita + resposta do servidor + obrigatórias presentes. Somente aqui dados entram no painel oficial.
5. `Foto opcional pendente`: vistoria pode estar concluída, mas a mídia ainda exige envio; indicar honestamente pendência.

## Matriz de mensagens
| Estado | Mensagem de interface sugerida (DERIVADA) | Pode entrar no painel? |
| --- | --- | --- |
| Rascunho em digitação | `Salvando...` | Não |
| Salvo no aparelho | `Salvo neste dispositivo; ainda não sincronizado` | Não |
| Dados recebidos API | `Dados sincronizados` | Não, se vistoria não concluída |
| Foto obrigatória pendente | `Falta enviar uma fotografia obrigatória` | Não |
| Conflito | `Alteração em conflito — precisa de revisão` | Não para alteração divergente |
| Envio oficial confirmado | `Vistoria concluída e recebida` | Sim |
| Fotos opcionais atrasadas | `Vistoria concluída; X fotos opcionais aguardam envio` | Sim, sem afirmar foto já disponível |

### Regras originais
- Base §5: câmera ou galeria, até 5 fotos por equipamento, até 5 por ocorrência de infraestrutura; compressão sem perder leitura das etiquetas; sem vídeo/documento/desenho.
- Base §7.1: autosave + botão Salvar; distinguir local e servidor.
- Base §7.2: offline com retenção protegida dos dados ainda não enviados.
- Base §§7.3–7.4: controle de concorrência/versão; dois conflitos preservados; sem último a salvar ganha.
- Base §§7.5–7.11: conclusão após revisão + fotos obrigatórias, opcionais podem chegar depois; opção de Wi-Fi para fotos e retries sem uploads duplicados.
- Base §§8.13–8.16: criptografia local e desbloqueio offline com limitações de Chrome/Safari a testar.

### Restrições técnicas
Não afirmar Background Sync universal ou detecção infalível de Wi-Fi móvel. Não excluir fotos locais antes do R2 confirmar persistência. Propor identificadores idempotentes por upload e manutenção dos metadados no D1; esquema e API definitivos ainda não aprovados.
