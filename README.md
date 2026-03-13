# BJ Moda Masculina - React, Vite e Firebase

Projeto refatorado para deploy estatico na Vercel com:

- React + Vite
- Firebase Authentication
- Cloud Firestore
- painel administrativo persistente
- cadastro de produtos com URL de imagem do Cloudinary
- sincronizacao em lote Cloudinary -> Firestore via Node.js

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
+-- scripts/
|   +-- sync-cloudinary-to-firestore.js
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
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=
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

### Sincronizacao automatica Cloudinary -> Firestore

Foi adicionada a rotina:

```bash
npm run sync:cloudinary
```

Ela deve ser executada:

- no seu computador
- em uma VPS
- ou em CI/CD

Nao deve ser executada no navegador nem no front-end Vite, porque usa:

- Cloudinary Admin API
- Firebase Admin SDK
- credenciais sensiveis via variavel de ambiente

O que a rotina faz:

1. le todas as imagens do Cloudinary via Admin API
2. pagina com `next_cursor` ate buscar tudo
3. verifica duplicidade por `cloudinaryPublicId`
4. cria documentos na collection `products`
5. grava os campos do painel e os campos pedidos para rastreio da origem

Campos gravados em cada produto importado:

```json
{
  "nome": "",
  "preco": 0,
  "estoque": 0,
  "imagemUrl": "URL_DA_IMAGEM",
  "cloudinaryPublicId": "PUBLIC_ID_DA_IMAGEM",
  "formato": "FORMATO_DA_IMAGEM",
  "createdAt": "timestamp",
  "updatedAt": "timestamp",
  "origem": "cloudinary",
  "ativo": true
}
```

Campos extras para compatibilidade com o painel atual:

```json
{
  "name": "",
  "priceCents": 0,
  "stock": 0,
  "imageUrl": "URL_DA_IMAGEM",
  "active": true,
  "description": "",
  "descricao": ""
}
```

### Importador em lote

No painel de produtos agora existe um importador em lote.

Formato aceito, uma linha por produto:

```text
Nome | URL da imagem | Preco | Estoque | Descricao | Ativo
```

Exemplo:

```text
Gravata Azul | https://res.cloudinary.com/.../gravata-azul.jpg | 89,90 | 10 | Gravata social azul em cetim | sim
Kit Executivo | https://res.cloudinary.com/.../kit-executivo.jpg | 199,90 | 5 | Kit com gravata, lenco e prendedor | sim
```

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
