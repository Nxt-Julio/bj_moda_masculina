# BJ Modas Masculina - React + Express

Aplicacao web de moda social masculina com:

- vitrine de produtos em React
- login e cadastro de clientes
- portal administrativo
- gestao de produtos e estoque
- pedidos com atualizacao de status
- banco SQLite local (`database.sqlite`)

## Arquitetura atual

- frontend: SPA em React escrita somente com HTML, CSS e JavaScript
- backend: Express servindo arquivos estaticos e API JSON
- banco: SQLite com `better-sqlite3`

Observacao:
- o React e carregado no navegador via modulos ESM no arquivo `public/app.js`
- nao ha TypeScript no projeto
- nao ha mais renderizacao por EJS

## Requisitos

- Node.js 18+

## Como executar

1. Instale as dependencias:

```bash
npm install
```

No PowerShell, se precisar:

```bash
npm.cmd install
```

2. Inicie o servidor:

```bash
npm start
```

3. Abra no navegador:

- http://localhost:3000

Observacao sobre porta:

- padrao: `3000`
- se `3000` estiver ocupada, a aplicacao tenta automaticamente a proxima porta livre
- para forcar uma porta especifica no PowerShell:

```powershell
$env:PORT=4000
npm.cmd start
```

## Acesso inicial do administrador

- e-mail: `admin@bjmodas.com`
- senha: `admin123`

## Estrutura principal

- `app.js`: servidor Express e rotas da API
- `db.js`: schema e inicializacao do banco
- `public/index.html`: entrada da SPA
- `public/app.js`: interface React em JavaScript puro
- `public/styles.css`: estilos globais
- `docs/IMAGE_STANDARD.md`: padrao operacional de imagens

## Endpoints principais

- `GET /api/session`
- `GET /api/products`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/orders/my`
- `POST /api/orders`
- `GET /api/admin/dashboard`
- `GET /api/admin/products`
- `POST /api/admin/products`
- `PUT /api/admin/products/:id`
- `DELETE /api/admin/products/:id`
- `GET /api/admin/orders`
- `PATCH /api/admin/orders/:id/status`
- `POST /api/admin/upload-image`

## Upload de imagem com Cloudinary

Defina estas variaveis no ambiente antes de iniciar a aplicacao:

- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `SESSION_SECRET`

Limites atuais:

- formatos: JPG, PNG, WEBP
- tamanho maximo: 5MB

## Proximas evolucoes sugeridas

- carrinho com multiplos itens
- busca e filtro por categoria
- recuperacao de senha
- migracao do React CDN para build local caso queira deploy mais controlado
