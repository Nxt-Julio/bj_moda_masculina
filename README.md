# BJ Modas Masculina - Site de Vendas de Gravatas

Aplicação web completa com:

- vitrine de produtos (gravatas)
- cadastro/login de clientes
- login de administrador
- gestão de produtos e estoque
- pedidos com atualização de status
- banco de dados SQLite local (`database.sqlite`)

## Requisitos

- Node.js 18+

## Como executar

1. Instale dependências:

```bash
npm install
```

Se estiver no PowerShell com política restrita, use:

```bash
npm.cmd install
```

2. Inicie o servidor:

```bash
npm start
```

Ou:

```bash
npm.cmd start
```

3. Abra no navegador:

- http://localhost:3000

Observação sobre porta:
- padrão: `3000`
- se `3000` estiver ocupada, a aplicação tenta automaticamente a próxima porta livre (`3001`, `3002`, etc.)
- para forçar uma porta específica: `set PORT=4000 && npm.cmd start` (Windows CMD)

## Acesso inicial do administrador

- E-mail: `admin@bjmodas.com`
- Senha: `admin123`

Altere a senha depois do primeiro acesso em uma evolução futura.

## Estrutura principal

- `app.js`: servidor, rotas, autenticação, regras de negócio
- `db.js`: inicialização e schema do banco
- `views/`: páginas EJS
- `public/styles.css`: estilos
- `docs/IMAGE_STANDARD.md`: padrão operacional de imagens

## Upload de imagem com Cloudinary (admin)

Foi adicionada a rota:
- `POST /admin/upload-image` (restrita ao admin logado)

No formulário de produto (`/admin/products/new` e edição) agora existe:
- campo para selecionar arquivo
- botão `Enviar para Cloudinary`
- preenchimento automático de `image_url`

Configuração:
1. Copie `.env.example` para `.env`.
2. Preencha:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
   - `SESSION_SECRET`
3. Inicie a aplicação normalmente.

Limites atuais da rota:
- formatos: JPG, PNG, WEBP
- tamanho máximo: 5MB

## Padrão de imagens (celular -> site)

Use o guia:
- `docs/IMAGE_STANDARD.md`

Resumo rápido:
- produto: 1000x1250
- banner hero: 1920x1080
- nome de arquivo padronizado (sem espaços/acentos)
- fluxo recomendado: foto -> compressão -> upload no admin -> salvar produto

## Deploy na Hostinger

Para esse projeto (Node + SQLite + sessões), o recomendado é:
- usar VPS da Hostinger (não plano de hospedagem compartilhada)

Boas práticas para produção:
- usar PM2 para manter o processo ativo
- usar Nginx como proxy reverso
- habilitar HTTPS
- mover banco para PostgreSQL/MySQL em crescimento de tráfego
- manter imagens no Cloudinary (não no disco da VPS)

## Próximas evoluções sugeridas

- carrinho com múltiplos itens
- recuperação de senha
- painel com relatórios por período
- deploy com CI/CD
