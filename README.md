# BJ Moda Masculina - React, Vite e Firebase

Projeto refatorado para deploy estatico na Vercel com:

- React + Vite
- Firebase Authentication
- Cloud Firestore
- painel administrativo persistente
- cadastro de produtos com URL de imagem do Cloudinary

## Stack atual

- frontend: React 18
- bundler: Vite 5
- rotas: react-router-dom
- autenticacao: Firebase Auth
- banco: Cloud Firestore
- deploy: Vercel

## Comandos

```bash
npm install
npm run dev
npm run build
```

O build gera:

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
|   +-- components/
|   |   +-- admin/
|   |   +-- home/
|   |   +-- layout/
|   |   +-- shared/
|   +-- context/
|   |   +-- StoreContext.jsx
|   +-- data/
|   +-- lib/
|   |   +-- firebase.js
|   +-- pages/
|   +-- utils/
|   +-- App.jsx
|   +-- main.jsx
|   +-- styles.css
+-- .env.example
+-- index.html
+-- package.json
+-- vite.config.js
+-- vercel.json
```

## Firebase

Crie um arquivo `.env` local com base em `.env.example` ou configure as mesmas variaveis na Vercel:

```bash
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_ADMIN_EMAILS=bjmodasocial@gmail.com,admin@bjmodas.com
```

Observacoes:

- o projeto ja possui fallback para a configuracao Firebase enviada na conversa
- `VITE_ADMIN_EMAILS` define quais e-mails devem receber papel `admin` ao criar o perfil
- habilite `Authentication > Sign-in method > Google`
- se quiser usar login tradicional, habilite tambem `Email/Password`

## Collections esperadas no Firestore

- `users`
  - `name`
  - `email`
  - `role`
  - `createdAt`
  - `updatedAt`
- `products`
  - `name`
  - `description`
  - `priceCents`
  - `stock`
  - `imageUrl`
  - `active`
  - `createdAt`
  - `updatedAt`
- `orders`
  - `userId`
  - `customerName`
  - `customerEmail`
  - `totalCents`
  - `status`
  - `createdAt`
  - `items`

## Como usar com Cloudinary

As fotos podem ser usadas no painel admin colando a `secure_url` de cada imagem do Cloudinary no campo de URL do produto.

Fluxo recomendado:

1. envie as fotos ao Cloudinary
2. copie a `secure_url` de cada produto
3. acesse o painel admin
4. crie ou edite os produtos e salve as URLs no Firestore

## Vercel

Configuracao recomendada:

- Framework Preset: `Vite`
- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: `dist`

O arquivo `vercel.json` ja define:

- `outputDirectory: dist`
- rewrite SPA para `index.html`

## Importante sobre administracao

Para o admin funcionar no Firebase:

1. registre ou crie um usuario com o e-mail definido em `VITE_ADMIN_EMAILS`
2. faca login com esse usuario
3. o perfil sera salvo com role `admin`

## Validacao local

Fluxos validados nesta refatoracao:

- `npm install`
- `npm run dev`
- `npm run build`
- geracao correta de `dist`

## Proximo passo sugerido

Se quiser, na proxima etapa eu posso fazer a importacao automatica dos produtos a partir das URLs do Cloudinary para popular o Firestore em lote.
