# NutriPlan - Web App

Frontend do NutriPlan, aplicativo de planejamento alimentar com base de alimentos da TBCA-USP.

## Tecnologias

- React 18 + TypeScript
- Vite
- Tailwind CSS + shadcn/ui
- React Router

## Desenvolvimento local

```sh
npm install
npm run dev
```

O servidor de desenvolvimento inicia em `http://localhost:8080`.

## Build de produção

```sh
npm run build
npm run preview
```

## Docker

O `Dockerfile` faz build multi-stage (Node → Nginx) e serve a aplicação na porta 80 com proxy reverso de `/api` para o backend.

```sh
docker compose up --build
```

## Variáveis de ambiente

| Variável | Descrição | Default |
|---|---|---|
| `VITE_API_URL` | URL base da API | `/api` |
