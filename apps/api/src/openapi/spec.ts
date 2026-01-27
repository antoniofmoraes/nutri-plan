import { OpenAPIV3 } from 'openapi-types';

export const openApiSpec: OpenAPIV3.Document = {
  openapi: '3.0.3',
  info: {
    title: 'NutriPlan API',
    version: '1.0.0',
    description: 'API para gerenciamento de planos alimentares, refeições e alimentos.',
    contact: {
      name: 'NutriPlan Support',
    },
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Development server',
    },
  ],
  tags: [
    { name: 'Auth', description: 'Autenticação e registro de usuários' },
    { name: 'Users', description: 'Gerenciamento de perfil do usuário' },
    { name: 'Foods', description: 'CRUD de alimentos' },
    { name: 'Meal Plans', description: 'CRUD de planos alimentares' },
    { name: 'Meals', description: 'Gerenciamento de refeições dentro de planos' },
    { name: 'Meal Foods', description: 'Alimentos dentro de refeições' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Token JWT obtido no login/registro',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Food: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          calories: { type: 'number' },
          protein: { type: 'number' },
          carbs: { type: 'number' },
          fat: { type: 'number' },
          portion: { type: 'string', default: '100g' },
        },
      },
      MealFood: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          quantity: { type: 'number' },
          food: { $ref: '#/components/schemas/Food' },
        },
      },
      Meal: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          time: { type: 'string', nullable: true },
          foods: {
            type: 'array',
            items: { $ref: '#/components/schemas/MealFood' },
          },
        },
      },
      DayPlan: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          day: {
            type: 'string',
            enum: ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'],
          },
          meals: {
            type: 'array',
            items: { $ref: '#/components/schemas/Meal' },
          },
        },
      },
      MealPlan: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          goal: {
            type: 'string',
            enum: ['emagrecer', 'manter', 'ganhar'],
          },
          dailyCalories: { type: 'integer' },
          dailyProtein: { type: 'integer', nullable: true },
          dailyCarbs: { type: 'integer', nullable: true },
          dailyFat: { type: 'integer', nullable: true },
          days: {
            type: 'array',
            items: { $ref: '#/components/schemas/DayPlan' },
          },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          user: { $ref: '#/components/schemas/User' },
          token: { type: 'string' },
        },
      },
      ApiResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: { type: 'object' },
          error: { type: 'string' },
          message: { type: 'string' },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: { type: 'string' },
          details: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: { type: 'string' },
                message: { type: 'string' },
              },
            },
          },
        },
      },
    },
  },
  paths: {
    // Auth
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Registrar novo usuário',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string', minLength: 1 },
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 6 },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Usuário criado com sucesso',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/AuthResponse' },
                  },
                },
              },
            },
          },
          '409': {
            description: 'Email já cadastrado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login do usuário',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Login realizado com sucesso',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/AuthResponse' },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Credenciais inválidas',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Obter dados do usuário autenticado',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Dados do usuário',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Não autenticado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    // Users
    '/api/users/me': {
      get: {
        tags: ['Users'],
        summary: 'Obter perfil do usuário',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Perfil do usuário',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
        },
      },
      patch: {
        tags: ['Users'],
        summary: 'Atualizar perfil',
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Perfil atualizado',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
        },
      },
      delete: {
        tags: ['Users'],
        summary: 'Excluir conta',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Conta excluída',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    // Foods
    '/api/foods': {
      get: {
        tags: ['Foods'],
        summary: 'Listar todos os alimentos',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'search',
            in: 'query',
            description: 'Buscar por nome',
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Lista de alimentos',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Food' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Foods'],
        summary: 'Criar novo alimento',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'calories', 'protein', 'carbs', 'fat'],
                properties: {
                  name: { type: 'string' },
                  calories: { type: 'number', minimum: 0 },
                  protein: { type: 'number', minimum: 0 },
                  carbs: { type: 'number', minimum: 0 },
                  fat: { type: 'number', minimum: 0 },
                  portion: { type: 'string', default: '100g' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Alimento criado',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/Food' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/foods/{id}': {
      get: {
        tags: ['Foods'],
        summary: 'Obter alimento por ID',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': {
            description: 'Alimento encontrado',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/Food' },
                  },
                },
              },
            },
          },
          '404': {
            description: 'Alimento não encontrado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
      patch: {
        tags: ['Foods'],
        summary: 'Atualizar alimento',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  calories: { type: 'number', minimum: 0 },
                  protein: { type: 'number', minimum: 0 },
                  carbs: { type: 'number', minimum: 0 },
                  fat: { type: 'number', minimum: 0 },
                  portion: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Alimento atualizado',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/Food' },
                  },
                },
              },
            },
          },
        },
      },
      delete: {
        tags: ['Foods'],
        summary: 'Excluir alimento',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': {
            description: 'Alimento excluído',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    // Meal Plans
    '/api/meal-plans': {
      get: {
        tags: ['Meal Plans'],
        summary: 'Listar planos do usuário',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Lista de planos alimentares',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/MealPlan' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Meal Plans'],
        summary: 'Criar novo plano alimentar',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'goal', 'dailyCalories'],
                properties: {
                  name: { type: 'string' },
                  goal: {
                    type: 'string',
                    enum: ['emagrecer', 'manter', 'ganhar'],
                  },
                  dailyCalories: { type: 'integer', minimum: 1 },
                  dailyProtein: { type: 'integer', minimum: 1, nullable: true },
                  dailyCarbs: { type: 'integer', minimum: 1, nullable: true },
                  dailyFat: { type: 'integer', minimum: 1, nullable: true },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Plano criado',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/MealPlan' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/meal-plans/{id}': {
      get: {
        tags: ['Meal Plans'],
        summary: 'Obter plano por ID',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': {
            description: 'Plano encontrado',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/MealPlan' },
                  },
                },
              },
            },
          },
        },
      },
      patch: {
        tags: ['Meal Plans'],
        summary: 'Atualizar plano',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  goal: {
                    type: 'string',
                    enum: ['emagrecer', 'manter', 'ganhar'],
                  },
                  dailyCalories: { type: 'integer', minimum: 1 },
                  dailyProtein: { type: 'integer', minimum: 1, nullable: true },
                  dailyCarbs: { type: 'integer', minimum: 1, nullable: true },
                  dailyFat: { type: 'integer', minimum: 1, nullable: true },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Plano atualizado',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/MealPlan' },
                  },
                },
              },
            },
          },
        },
      },
      delete: {
        tags: ['Meal Plans'],
        summary: 'Excluir plano',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': {
            description: 'Plano excluído',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    // Meals
    '/api/meal-plans/{planId}/days/{day}/meals': {
      get: {
        tags: ['Meals'],
        summary: 'Listar refeições do dia',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'planId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
          {
            name: 'day',
            in: 'path',
            required: true,
            schema: {
              type: 'string',
              enum: ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'],
            },
          },
        ],
        responses: {
          '200': {
            description: 'Lista de refeições',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Meal' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Meals'],
        summary: 'Criar refeição',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'planId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
          {
            name: 'day',
            in: 'path',
            required: true,
            schema: {
              type: 'string',
              enum: ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'],
            },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string' },
                  time: { type: 'string', example: '08:00' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Refeição criada',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/Meal' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/meal-plans/{planId}/days/{day}/meals/{mealId}': {
      patch: {
        tags: ['Meals'],
        summary: 'Atualizar refeição',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'planId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
          {
            name: 'day',
            in: 'path',
            required: true,
            schema: {
              type: 'string',
              enum: ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'],
            },
          },
          {
            name: 'mealId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  time: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Refeição atualizada',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/Meal' },
                  },
                },
              },
            },
          },
        },
      },
      delete: {
        tags: ['Meals'],
        summary: 'Excluir refeição',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'planId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
          {
            name: 'day',
            in: 'path',
            required: true,
            schema: {
              type: 'string',
              enum: ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'],
            },
          },
          {
            name: 'mealId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': {
            description: 'Refeição excluída',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    // Meal Foods
    '/api/meals/{mealId}/foods': {
      get: {
        tags: ['Meal Foods'],
        summary: 'Listar alimentos da refeição',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'mealId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': {
            description: 'Lista de alimentos na refeição',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/MealFood' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Meal Foods'],
        summary: 'Adicionar alimento à refeição',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'mealId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['foodId', 'quantity'],
                properties: {
                  foodId: { type: 'string', format: 'uuid' },
                  quantity: { type: 'number', minimum: 1, default: 100 },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Alimento adicionado',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/MealFood' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/meals/{mealId}/foods/{foodId}': {
      patch: {
        tags: ['Meal Foods'],
        summary: 'Atualizar quantidade do alimento',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'mealId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
          {
            name: 'foodId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['quantity'],
                properties: {
                  quantity: { type: 'number', minimum: 1 },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Quantidade atualizada',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/MealFood' },
                  },
                },
              },
            },
          },
        },
      },
      delete: {
        tags: ['Meal Foods'],
        summary: 'Remover alimento da refeição',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'mealId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
          {
            name: 'foodId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': {
            description: 'Alimento removido',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};
