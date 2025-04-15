# EmbalaFest - Sistema de Gestão

Sistema de gestão desenvolvido para lojas de embalagens e artigos para festas, focado no controle de vendas, estoque e caixa.

## 💻 Tecnologias

### Frontend

- **Next.js 15** - Framework React com Server-Side Rendering
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Framework CSS utilitário
- **Shadcn/ui** - Componentes React reutilizáveis
- **Recharts** - Biblioteca para criação de gráficos
- **Lucide Icons** - Ícones modernos e personalizáveis
- **React Hook Form** - Gerenciamento de formulários
- **Zod** - Validação de dados

### Backend

- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **MongoDB** - Banco de dados NoSQL
- **Mongoose** - ODM para MongoDB
- **JWT** - Autenticação baseada em tokens
- **Winston** - Sistema de logs
- **Multer** - Upload de arquivos
- **PDFKit** - Geração de PDFs
- **ExcelJS** - Geração de relatórios Excel

## 🚀 Funcionalidades

### Gestão de Vendas

- Registro de vendas com múltiplos produtos
- Suporte a diferentes formas de pagamento (Dinheiro, Cartão de Crédito, Cartão de Débito, PIX)
- Histórico completo de vendas
- Relatórios de vendas por período
- Associação de vendas a clientes cadastrados

### Controle de Caixa

- Abertura e fechamento de caixa
- Registro de entradas e saídas
- Controle de saldo inicial e final
- Relatório de movimentações
- Histórico detalhado de operações

### Gestão de Produtos

- Cadastro e edição de produtos
- Controle de estoque com alertas de estoque baixo
- Histórico de preços
- Categorização de produtos
- Associação com fornecedores

### Gestão de Clientes

- Cadastro de clientes (consumidores)
- Histórico de compras por cliente
- Endereços de entrega
- Relatórios de consumo

### Gestão de Fornecedores

- Cadastro de fornecedores
- Associação de produtos a fornecedores
- Informações de contato

### Dashboard

- Visão geral do negócio
- Gráficos de vendas
- Indicadores de desempenho (vendas, produtos vendidos, ticket médio)
- Vendas recentes
- Status do caixa

### Relatórios

- Relatórios de vendas por período
- Análise de produtos mais vendidos
- Desempenho por período
- Exportação de dados em PDF e Excel

## 🔒 Segurança

- Autenticação JWT
- Controle de acesso baseado em funções (admin, manager, cashier)
- Proteção de rotas
- Logs de atividades
- Senhas criptografadas

## 🏗️ Arquitetura

### Frontend

```
client/
├── app/              # Páginas e rotas (Next.js App Router)
├── components/       # Componentes reutilizáveis
├── lib/             # Utilitários e configurações
├── hooks/           # Hooks personalizados
├── services/        # Serviços de API
└── styles/          # Estilos globais
```

### Backend

```
server/
├── src/
│   ├── config/      # Configurações
│   ├── controllers/ # Controladores
│   ├── middleware/  # Middlewares
│   ├── models/      # Modelos do Mongoose
│   ├── routes/      # Rotas da API
│   ├── services/    # Tarefas agendadas e serviços de sistema
│   └── types/       # Tipagens TypeScript
└── logs/           # Arquivos de log
```

## 📦 Instalação

### Pré-requisitos

- Node.js 18+
- MongoDB
- NPM ou Yarn

### Frontend

```bash
cd client
npm install
npm run dev
```

### Backend

```bash
cd server
npm install
npm run dev
```

## 🔧 Configuração

### Variáveis de Ambiente

#### Frontend (.env.local)

```
NEXT_PUBLIC_API_URL=http://localhost:3000
```

#### Backend (.env)

```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/embala-fest
JWT_SECRET=seu_secret_aqui
```

## 🚀 Deploy

O projeto está implantado em serviços de hospedagem:

### Frontend

- **Plataforma**: Netlify
- **URL**: https://embalafest.netlify.app/
- **Configuração**: O arquivo `netlify.toml` na pasta `client` contém as configurações de build
- **CI/CD**: Integrado com GitHub para deploy automático a cada push na branch main

### Backend

- **Plataforma**: Render
- **URL**: https://embala-fest-api.onrender.com
- **Base de dados**: MongoDB Atlas

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.
