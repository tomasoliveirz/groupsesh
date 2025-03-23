# Sistema de Agendamento de Disponibilidade

Um sistema completo para coordenar disponibilidades entre múltiplos participantes. Permite que administradores criem pesquisas de disponibilidade e compartilhem links com participantes, que indicam suas disponibilidades em um calendário anual.

## Características

- Criação de pesquisas de disponibilidade com links únicos
- Interface de calendário interativa para seleção de datas
- Dashboard administrativo com visualização de disponibilidades
- Exportação de dados para CSV
- Design responsivo para dispositivos móveis
- Funciona em navegadores modernos

## Requisitos

- Python 3.8+
- Flask e dependências (listadas em `requirements.txt`)
- SQLite (padrão) ou outro banco de dados compatível com SQLAlchemy
- Navegador moderno com JavaScript habilitado

## Instalação e Configuração

### Instalação Local (Desenvolvimento)

1. Clone o repositório:
   ```bash
   git clone https://github.com/seu-usuario/availability-survey.git
   cd availability-survey
   ```

2. Crie e ative um ambiente virtual:
   ```bash
   python -m venv venv
   source venv/bin/activate  # No Windows: venv\Scripts\activate
   ```

3. Instale as dependências:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure as variáveis de ambiente:
   ```bash
   cp .env.example .env
   # Edite o arquivo .env com suas configurações
   ```

5. Execute a aplicação:
   ```bash
   flask run
   ```

6. Acesse a aplicação em [http://localhost:5000](http://localhost:5000)

### Instalação com Docker (Produção)

1. Clone o repositório:
   ```bash
   git clone https://github.com/seu-usuario/availability-survey.git
   cd availability-survey
   ```

2. Configure as variáveis de ambiente:
   ```bash
   cp .env.example .env
   # Edite o arquivo .env com suas configurações
   ```

3. Construa e inicie os containers:
   ```bash
   docker-compose up -d
   ```

4. Acesse a aplicação em [http://localhost:80](http://localhost:80)

## Segurança

Este sistema implementa várias medidas de segurança:

- Proteção CSRF para formulários
- Sanitização de inputs
- Tokens únicos para surveys
- Configurações seguras de cookies
- Validação de dados no servidor

Para produção, recomenda-se:
- Usar HTTPS (certificado SSL)
- Configurar uma chave secreta forte
- Configurar adequadamente o proxy reverso (Nginx)
- Considerar o uso de um banco de dados mais robusto (PostgreSQL, MySQL)

## Estrutura do Projeto

```
availability-survey/
├── app.py                 # Aplicação Flask principal
├── config.py              # Configurações do aplicativo
├── requirements.txt       # Dependências do projeto
├── database/              # Módulos de banco de dados
├── static/                # Arquivos estáticos (CSS, JS)
├── templates/             # Templates HTML
├── Dockerfile             # Configuração Docker
└── docker-compose.yml     # Configuração Docker Compose
```

## Uso

### Para administradores:

1. Acesse a página inicial e clique em "Criar Survey"
2. Preencha o título, descrição e seus dados
3. Compartilhe o link de participantes com os interessados
4. Use o link do dashboard para visualizar as respostas

### Para participantes:

1. Acesse o link recebido
2. Preencha seu nome e e-mail
3. Selecione os dias em que está disponível no calendário
4. Envie sua resposta

## Contribuição

Contribuições são bem-vindas! Para contribuir:

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.# groupsesh
