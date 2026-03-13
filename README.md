# BJ Moda Masculina - React + Vite

Refatoracao do projeto BJ para uma arquitetura moderna com React e Vite, focada em:

- build leve
- deploy estatico na Vercel
- compatibilidade com Node 18+
- eliminacao de dependencias nativas problematicas no build

## O que mudou

- migracao completa para `React + Vite`
- estrutura em `src/`, `src/components/`, `src/pages/`, `src/assets/`
- roteamento client-side com `react-router-dom`
- estado e persistencia local com `localStorage`
- remocao de `express`, `better-sqlite3`, `multer`, `cloudinary`, `bcryptjs` e outras dependencias do build antigo
- configuracao pronta para SPA na Vercel com `vercel.json`

## Requisitos

- Node.js 18 ou superior
- npm ou yarn

## Comandos

```bash
npm install
npm run dev
npm run build
```

O build gera a pasta:

```bash
dist/
```

## Estrutura principal

```text
.
+-- public/
|   +-- images/
+-- src/
|   +-- assets/
|   |   +-- bj-seal.svg
|   +-- components/
|   |   +-- admin/
|   |   +-- home/
|   |   +-- layout/
|   |   +-- shared/
|   +-- context/
|   |   +-- StoreContext.jsx
|   +-- data/
|   |   +-- initialStore.js
|   |   +-- siteContent.js
|   +-- pages/
|   |   +-- AdminDashboardPage.jsx
|   |   +-- AdminOrdersPage.jsx
|   |   +-- AdminProductFormPage.jsx
|   |   +-- AdminProductsPage.jsx
|   |   +-- HomePage.jsx
|   |   +-- LoginPage.jsx
|   |   +-- NotFoundPage.jsx
|   |   +-- OrdersPage.jsx
|   |   +-- RegisterPage.jsx
|   +-- utils/
|   |   +-- formatters.js
|   +-- App.jsx
|   +-- main.jsx
|   +-- styles.css
+-- index.html
+-- package.json
+-- vite.config.js
+-- vercel.json
```

## Observacao sobre dados

Para garantir deploy estatico e compatibilidade total com a Vercel, esta versao roda sem backend Node.

Isso significa que:

- login, cadastro, produtos e pedidos funcionam em modo front-end
- os dados ficam persistidos no `localStorage`
- a conta admin demo e:
  - e-mail: `admin@bjmodas.com`
  - senha: `admin123`

## Deploy na Vercel

1. Suba o projeto para um repositorio Git.
2. Importe o repositorio na Vercel.
3. Configure:

```text
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

4. Faca o deploy.

O arquivo `vercel.json` ja inclui rewrite para SPA:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

## Observacao tecnica importante

O aviso antigo:

```text
npm warn deprecated prebuild-install@7.1.3
```

vinha do fluxo anterior baseado em dependencias nativas, principalmente `better-sqlite3`.

Nesta refatoracao, esse caminho foi removido do build. Hoje o projeto compila com `vite build` e gera `dist` corretamente para deploy.
