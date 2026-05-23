# Trabalho de conclusão de curso - Finantec 

Bem-vindo(a) ao Finantec, aqui você irá encontrar um trabalho de conclusão de curso feito durante o 3º ano do ensino médio integrado ao técnico em informática para internet da Escola Técnica Estadual de Campo Limpo Paulista (ETECAMP).

Grupo do Trabalho:
- Daniel Gomes da Silva
- Paloma do Carmo Dantas 
- Maria Luiza Pereira 

Orientadoras: Barbara Kathellen Andrade Porfirio e Thaynara Cristina Maia dos Santos.

Como começamos e qual nosso objetivo: 

Nas escolas brasileiras, e especialmente no contexto do ensino médio, observamos que muitos jovens saem para o mercado de trabalho ou para a vida adulta sem saber lidar com o próprio dinheiro. Faltam noções básicas sobre como economizar, como evitar dívidas e como investir para o futuro. Foi pensando nisso que nasceu o **Finantec**.
Nosso objetivo foi criar uma plataforma que não fosse apenas "mais um site de finanças", mas sim um ambiente onde o aluno pudesse aprender jogando (gamificação), controlar seus gastos de forma simples e visualizar seu progresso através de gráficos intuitivos.
Durante o desenvolvimento, aplicamos pesquisas com os estudantes da ETECAMP e notamos que a maioria tinha interesse em investir, mas não sabia por onde começar. Assim, unimos a tecnologia web moderna com a educação financeira para criar uma ferramenta capaz de transformar a relação do jovem com o dinheiro.


## Linguagens usadas no website: 

HTML: Versão 5
CSS: Versão 3
JavaScript: Versão ECMAScript 2023
Node.js (Ambiente de execução)
MySQL (Banco de Dados)

EXTENSÕES/PACOTES (Dependências):
Express: Framework web rápido e minimalista.
Nodemailer: Para envio de e-mails de recuperação de senha.
Bcrypt.js: Para criptografia de senhas.
JsonWebToken (JWT): Para autenticação segura dos usuários.
Dotenv:Para gerenciamento de variáveis de ambiente.
Cors: Para segurança e requisições HTTP.
MySQL2: Driver para conexão com o banco de dados.

Etapas para término do processo de construção do Artigo: 

1.  Definição do tema (Educação Financeira) e pesquisa de viabilidade.
2.  Pesquisa de campo com estudantes da ETECAMP (questionários).
3.  Prototipagem de baixa e média fidelidade (Figma).
4.  Criação da identidade visual (Manual da marca, Logo Pixel Art).
5.  Desenvolvimento do Front-end (Interface e Responsividade).
6.  Desenvolvimento do Back-end (API, Rotas e Lógica).
7.  Integração do Banco de Dados e Testes de funcionalidades.
8.  Implementação de recursos de Gamificação.
9.  Apresentação do TCC à banca.

Como executar esse trabalho: 

Executando o website: 

1. Instalar as dependências e aplicativos
1.  Entre no link a seguir para baixar o Visual Studio Code: [https://code.visualstudio.com/](https://code.visualstudio.com/) (Baixe o pacote base para seu sistema e siga os passos de instalação).
2.  Entre no link a seguir para baixar o Node.js: [https://nodejs.org/](https://nodejs.org/) (Baixe a versão LTS recomendada).
3.  Entre no link para instalar o XAMPP (apenas para usar o MySQL): [https://www.apachefriends.org/pt_br/download.html](https://www.apachefriends.org/pt_br/download.html) ou instale o MySQL Workbench separadamente.

2. Carregar a base de dados
1.  Abra o seu XAMPP Control Panel e inicie os serviços Apache e MySQL. Clique em "Admin" do MySQL para abrir o phpMyAdmin.
2.  No phpMyAdmin, clique em "Novo", crie um banco de dados com o nome `fintec`.
3.  Vá na aba "Importar", clique em "Escolher arquivo" e selecione o arquivo `fintec.sql` que está na pasta raiz do projeto. Clique em "Executar". Pronto, o banco está criado!

3. Configurar o projeto e variáveis de ambiente
1.  Abra o Visual Studio Code, vá em "Arquivo" > "Abrir Pasta" e selecione a pasta do projeto Finantec.
2.  Abra o terminal integrado do VS Code (Ctrl + ') e digite o seguinte comando para instalar todas as dependências do projeto:
    ```bash
    npm install
    ```
3.  Na raiz do projeto, crie um arquivo chamado `.env` e configure as conexões (copie o código abaixo):
    ```env
    DB_HOST=localhost
    DB_USER=root
    DB_PASS=          # Deixe vazio se seu XAMPP não tiver senha, ou coloque sua senha
    DB_NAME=fintec
    JWT_SECRET=sua_chave_secreta_super_segura
    PORT=5000
    ```
4.  **Configuração de E-mail:** Abra o arquivo `controllers/authController.js`. Procure a configuração do `nodemailer` e insira suas credenciais do Mailtrap (ou Gmail) para que a recuperação de senha funcione.

**4. Iniciar o site e abrir no navegador**
1.  No terminal do VS Code, inicie o servidor com o comando:
    ```bash
    npm start
    ```
2.  Você verá a mensagem "Servidor rodando na porta 5000".
3.  Abra seu navegador preferido e digite:
    `http://localhost:5000`

---

Como citar este trabalho: 

SILVA, Daniel Gomes da; PEREIRA, Maria Luiza; DANTAS, Paloma do Carmo. **Desenvolvimento de um Website para Auxiliar no Planejamento Pessoal Financeiro dos Estudantes do Ensino Médio da Etec de Campo Limpo Paulista**. 2025. TCC (Ensino Médio Integrado ao Técnico em Informática para Internet) - Etec de Campo Limpo Paulista, Centro Paula Souza, São Paulo.



Copyright @ 2025 Todos os direitos reservados aos autores.
