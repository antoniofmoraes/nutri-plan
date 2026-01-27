# NutriPlan API

Backend API para o aplicativo de Plano Alimentar.

## Stack

- **Hono** - Web framework
- **TypeScript** - Linguagem
- **PostgreSQL** - Banco de dados
- **Prisma** - ORM
- **JWT** - Autenticação
- **Zod** - Validação

## Setup

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/postgres?schema=public"
JWT_SECRET="sua-chave-secreta-aqui"
JWT_EXPIRES_IN="7d"
PORT=3000
```

### 3. Gerar Prisma Client

```bash
npm run db:generate
```

### 4. Criar tabelas no banco

```bash
npm run db:push
```

### 5. Popular dados iniciais (opcional)

```bash
npm run db:seed
```

### 6. Iniciar servidor

```bash
npm run dev
```

## API Endpoints

### Auth

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/auth/register` | Cadastro de usuário |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Dados do usuário logado |
| POST | `/api/auth/logout` | Logout |

### Users

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/users/me` | Obter perfil |
| PATCH | `/api/users/me` | Atualizar perfil |
| DELETE | `/api/users/me` | Excluir conta |

### Foods

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/foods` | Listar alimentos |
| GET | `/api/foods?search=frango` | Buscar por nome |
| GET | `/api/foods/:id` | Obter alimento |
| POST | `/api/foods` | Criar alimento |
| PATCH | `/api/foods/:id` | Atualizar alimento |
| DELETE | `/api/foods/:id` | Excluir alimento |

### Meal Plans

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/meal-plans` | Listar planos |
| GET | `/api/meal-plans/:id` | Obter plano |
| POST | `/api/meal-plans` | Criar plano |
| PATCH | `/api/meal-plans/:id` | Atualizar plano |
| DELETE | `/api/meal-plans/:id` | Excluir plano |

### Meals

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/meal-plans/:planId/days/:day/meals` | Listar refeições do dia |
| POST | `/api/meal-plans/:planId/days/:day/meals` | Criar refeição |
| PATCH | `/api/meal-plans/:planId/days/:day/meals/:mealId` | Atualizar refeição |
| DELETE | `/api/meal-plans/:planId/days/:day/meals/:mealId` | Excluir refeição |

### Meal Foods

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/meals/:mealId/foods` | Listar alimentos da refeição |
| POST | `/api/meals/:mealId/foods` | Adicionar alimento |
| PATCH | `/api/meals/:mealId/foods/:foodId` | Atualizar quantidade |
| DELETE | `/api/meals/:mealId/foods/:foodId` | Remover alimento |

## Estrutura de Pastas

```
apps/api/
├── prisma/
│   ├── schema.prisma    # Modelos do banco
│   ├── client.ts        # Singleton do Prisma
│   └── seed.ts          # Dados iniciais
├── src/
│   ├── app.ts           # Servidor Hono
│   ├── types/           # Tipos compartilhados
│   ├── dtos/            # DTOs de entrada/saída
│   ├── middlewares/     # Middlewares
│   └── modules/         # Módulos por domínio
│       ├── auth/
│       ├── user/
│       ├── food/
│       ├── meal-plan/
│       ├── meal/
│       └── meal-food/
├── package.json
├── tsconfig.json
└── .env.example
```

## Deploy (Coolify)

1. Configure a variável `DATABASE_URL` apontando para seu PostgreSQL
2. Configure `JWT_SECRET` com uma chave segura
3. O build command é `npm run build`
4. O start command é `npm start`
