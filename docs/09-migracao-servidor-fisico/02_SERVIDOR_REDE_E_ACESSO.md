# 02 · Servidor físico, rede e acesso

## PROPOSTA de dimensionamento inicial

Estes números são ponto de partida de engenharia, não benchmark do sistema nem garantia para determinada quantidade de usuários. O dimensionamento final depende de agentes ativos, upload simultâneo, CPU, SSD, internet e retenção. A base atual pequena não representa o volume futuro.

| Recurso | Ensaio isolado | Candidato inicial de produção |
|---|---|---|
| CPU | 2 núcleos disponíveis | 4 núcleos físicos modernos ou capacidade equivalente reservada |
| RAM | 8 GB | 16 GB, expansível |
| Disco | SSD com 256 GB e espaço livre para restauração | Dois SSDs de 500 GB ou mais em espelhamento, monitorados |
| Backup | Disco/cópia separado do ensaio | Destino externo ao host, cifrado, com histórico e teste de recuperação |
| Rede interna | Ethernet estável | Ethernet 1 Gbit/s; acesso administrativo segregado |
| Energia | Ambiente de laboratório | Nobreak, desligamento controlado e recuperação automática testada |
| Internet | Saída HTTPS | Link estável, upload medido; contingência se disponibilidade exigir |

Espelhamento protege de falha de um disco; não é backup de exclusão, ransomware ou corrupção. Se fotos passarem do Drive para o servidor no futuro, calcular capacidade por quantidade × tamanho médio × versões × retenção × cópias. Os valores acima pressupõem originais no Drive; os 100 TB mencionados na conta não foram medidos nesta tarefa e não são capacidade do servidor.

## Sistema operacional e serviços

Proposta: Ubuntu Server LTS ainda suportado, por exemplo 24.04 LTS com atualizações de segurança, ou versão institucional equivalente após validar Node/SQLite. Conferir ciclo de suporte na instalação: [ciclo oficial Ubuntu](https://ubuntu.com/about/release-cycle). Não instalar uma versão sem suporte só para copiar um roteiro.

Se o hardware usa Windows por obrigação institucional, preferir VM Linux com recursos reservados, disco local, inicialização automática e backup consistente. Isso exige autorização do administrador do host. Não há neste projeto serviço Windows do backend pronto; o serviço Windows existente é o agente de inventário.

Serviços A IMPLEMENTAR: proxy HTTPS, aplicação Node, executor único de tarefas, supervisão de processos, logs rotativos, backup consistente e monitor de saúde. Diretórios propostos, não existentes: `/opt/semed/releases/` para releases, `/var/lib/semed/` para banco, `/etc/semed/` para configuração restrita. Manter dados fora da pasta de cada release.

## Rede e TLS

1. Identificar IP local reservado, operadora, IP público/CGNAT, firewall e pessoa responsável pelo roteador.
2. Escolher domínio/subdomínios que a Secretaria realmente possa administrar. Separar host do painel e do coletor para preservar sessões/contexto.
3. Definir entrada direta HTTPS ou tunnel autenticado. Se direta, publicar somente porta 443; administração por VPN/rede restrita. Não expor arquivo SQLite, PostgreSQL, SMB, RDP ou console de debug à internet.
4. Provisionar certificado válido e renovação automática testada. HTTPS é necessário para cookie Secure, câmera, GPS e integrações.
5. Limitar hosts aceitos; não formar URLs de callback/redirect a partir de `Host` ou `X-Forwarded-*` arbitrários.
6. Sincronizar horário com fonte confiável. Conferir UTC no servidor e Fortaleza apenas na apresentação/agendamento de negócio.

Medir latência e envio de fotos do celular pela internet móvel, não só na LAN. A escola precisa alcançar o endereço mesmo fora da rede da Secretaria.

## Como preparar acesso para a implantação futura

- Disponibilizar SSH pela rede administrativa/VPN/tunnel aprovado, com conta individual de implantação e autenticação por chave pública.
- Conceder sudo somente para tarefas necessárias e documentadas; aplicação roda com usuário de serviço sem login interativo. Não executar aplicação como root.
- Entregar endereço/porta/usuário e a impressão digital da chave do host por canal institucional. A chave privada fica no computador/cofre autorizado; não colar senha, chave ou token no chat/repositório.
- Conferir acesso no computador que realizará a implantação, comandos remotos, cópia de arquivo e elevação controlada antes de agendar o corte. Não presumir que esta sessão tenha acesso permanente ao novo servidor.
- Nomear responsável local para energia, console físico e recuperação da rede caso o acesso remoto caia.
- Criar credenciais de recuperação separadas, registrar quem pode usá-las e como revogar acessos após a transferência.

## Informações que a equipe deve devolver

Modelo/CPU/RAM/discos, espaço livre, saúde dos SSDs, SO/versão, virtualização, IP local, CGNAT/IP público, controle de DNS, método de entrada, disponibilidade de VPN/SSH, janela permitida, responsáveis, cópia externa e metas de recuperação. Não incluir senhas nesses registros públicos.

Sem esses dados, podemos desenvolver e testar os adaptadores localmente, mas não afirmar que um servidor específico está pronto para receber produção.
