const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const path = require('path');
const { db, initDb, updateProductTimestamp } = require('./db');

initDb();

const app = express();
const DEFAULT_PORT = Number(process.env.PORT) || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
    if (allowedMimeTypes.has(file.mimetype)) {
      return cb(null, true);
    }

    cb(new Error('Formato invalido. Use JPG, PNG ou WEBP.'));
  },
});

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'troque-essa-chave-em-producao',
    resave: false,
    saveUninitialized: false,
  })
);

app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  res.locals.flash = req.session.flash || null;
  delete req.session.flash;
  next();
});

function setFlash(req, type, text) {
  req.session.flash = { type, text };
}

function isCloudinaryReady() {
  return Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
}

function toCents(priceText) {
  const normalized = String(priceText || '').replace(',', '.').trim();
  const value = Number(normalized);
  if (!Number.isFinite(value) || value < 0) {
    return null;
  }
  return Math.round(value * 100);
}

function requireAuth(req, res, next) {
  if (!req.session.user) {
    setFlash(req, 'error', 'Faca login para continuar.');
    return res.redirect('/login');
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'admin') {
    setFlash(req, 'error', 'Acesso restrito ao administrador.');
    return res.redirect('/');
  }
  next();
}

app.get('/', (req, res) => {
  const products = db
    .prepare(
      `SELECT id, name, description, price_cents, stock, image_url
       FROM products
       WHERE active = 1
       ORDER BY created_at DESC`
    )
    .all();

  res.render('home', { products });
});

app.get('/register', (req, res) => {
  if (req.session.user) return res.redirect('/');
  res.render('register');
});

app.post('/register', (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password || password.length < 6) {
    setFlash(req, 'error', 'Preencha os dados corretamente (senha com 6+ caracteres).');
    return res.redirect('/register');
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.trim().toLowerCase());
  if (existing) {
    setFlash(req, 'error', 'Este e-mail ja esta cadastrado.');
    return res.redirect('/register');
  }

  const hash = bcrypt.hashSync(password, 10);
  const result = db
    .prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)')
    .run(name.trim(), email.trim().toLowerCase(), hash, 'customer');

  req.session.user = {
    id: result.lastInsertRowid,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    role: 'customer',
  };

  setFlash(req, 'success', 'Cadastro realizado com sucesso.');
  return res.redirect('/');
});

app.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/');
  res.render('login');
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get((email || '').trim().toLowerCase());
  if (!user || !bcrypt.compareSync(password || '', user.password_hash)) {
    setFlash(req, 'error', 'Credenciais invalidas.');
    return res.redirect('/login');
  }

  req.session.user = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  setFlash(req, 'success', `Bem-vindo, ${user.name}.`);
  return res.redirect(user.role === 'admin' ? '/admin' : '/');
});

app.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

app.get('/my-orders', requireAuth, (req, res) => {
  const orders = db
    .prepare(
      `SELECT o.id, o.total_cents, o.status, o.created_at
       FROM orders o
       WHERE o.user_id = ?
       ORDER BY o.created_at DESC`
    )
    .all(req.session.user.id);

  res.render('customer/orders', { orders });
});

app.post('/orders', requireAuth, (req, res) => {
  const productId = Number(req.body.product_id);
  const quantity = Number(req.body.quantity);

  if (!Number.isInteger(productId) || !Number.isInteger(quantity) || quantity <= 0) {
    setFlash(req, 'error', 'Pedido invalido.');
    return res.redirect('/');
  }

  const product = db.prepare('SELECT * FROM products WHERE id = ? AND active = 1').get(productId);
  if (!product) {
    setFlash(req, 'error', 'Produto nao encontrado.');
    return res.redirect('/');
  }

  if (product.stock < quantity) {
    setFlash(req, 'error', 'Estoque insuficiente para este pedido.');
    return res.redirect('/');
  }

  const createOrder = db.transaction(() => {
    db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?').run(quantity, productId);
    updateProductTimestamp(productId);

    const totalCents = product.price_cents * quantity;
    const orderResult = db
      .prepare('INSERT INTO orders (user_id, total_cents, status) VALUES (?, ?, ?)')
      .run(req.session.user.id, totalCents, 'novo');

    db.prepare(
      'INSERT INTO order_items (order_id, product_id, quantity, unit_price_cents) VALUES (?, ?, ?, ?)'
    ).run(orderResult.lastInsertRowid, productId, quantity, product.price_cents);
  });

  createOrder();
  setFlash(req, 'success', 'Pedido realizado com sucesso.');
  return res.redirect('/my-orders');
});

app.get('/admin', requireAdmin, (req, res) => {
  const stats = {
    products: db.prepare('SELECT COUNT(*) AS count FROM products').get().count,
    customers: db.prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'customer'").get().count,
    orders: db.prepare('SELECT COUNT(*) AS count FROM orders').get().count,
    revenueCents: db.prepare("SELECT COALESCE(SUM(total_cents),0) AS value FROM orders WHERE status != 'cancelado'").get().value,
  };

  res.render('admin/dashboard', { stats });
});

app.get('/admin/products', requireAdmin, (req, res) => {
  const products = db
    .prepare(
      `SELECT id, name, description, price_cents, stock, active, created_at
       FROM products
       ORDER BY created_at DESC`
    )
    .all();

  res.render('admin/products/list', { products });
});

app.get('/admin/products/new', requireAdmin, (req, res) => {
  res.render('admin/products/form', { product: null });
});

app.post('/admin/upload-image', requireAdmin, (req, res) => {
  upload.single('image')(req, res, async (error) => {
    if (error) {
      return res.status(400).json({ error: error.message || 'Falha no upload da imagem.' });
    }

    if (!isCloudinaryReady()) {
      return res.status(503).json({
        error: 'Cloudinary nao configurado no ambiente. Defina CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY e CLOUDINARY_API_SECRET.',
      });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Envie uma imagem para continuar.' });
    }

    try {
      const dataUri = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      const uploadResult = await cloudinary.uploader.upload(dataUri, {
        folder: 'bj-moda-social/produtos',
        resource_type: 'image',
        transformation: [
          { width: 1600, height: 1600, crop: 'limit' },
          { quality: 'auto:good' },
          { fetch_format: 'auto' },
        ],
      });

      return res.json({
        secure_url: uploadResult.secure_url,
        public_id: uploadResult.public_id,
        width: uploadResult.width,
        height: uploadResult.height,
        format: uploadResult.format,
        bytes: uploadResult.bytes,
      });
    } catch (uploadError) {
      console.error('Falha no upload para Cloudinary:', uploadError.message);
      return res.status(500).json({ error: 'Nao foi possivel enviar a imagem agora.' });
    }
  });
});

app.post('/admin/products', requireAdmin, (req, res) => {
  const { name, description, price, stock, image_url, active } = req.body;

  const priceCents = toCents(price);
  const stockInt = Number(stock);

  if (!name || priceCents === null || !Number.isInteger(stockInt) || stockInt < 0) {
    setFlash(req, 'error', 'Dados invalidos para criar produto.');
    return res.redirect('/admin/products/new');
  }

  db.prepare(
    `INSERT INTO products (name, description, price_cents, stock, image_url, active)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(name.trim(), description?.trim() || '', priceCents, stockInt, image_url?.trim() || '', active ? 1 : 0);

  setFlash(req, 'success', 'Produto criado com sucesso.');
  return res.redirect('/admin/products');
});

app.get('/admin/products/:id/edit', requireAdmin, (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(Number(req.params.id));

  if (!product) {
    setFlash(req, 'error', 'Produto nao encontrado.');
    return res.redirect('/admin/products');
  }

  res.render('admin/products/form', { product });
});

app.post('/admin/products/:id/update', requireAdmin, (req, res) => {
  const productId = Number(req.params.id);
  const { name, description, price, stock, image_url, active } = req.body;

  const priceCents = toCents(price);
  const stockInt = Number(stock);

  if (!name || priceCents === null || !Number.isInteger(stockInt) || stockInt < 0) {
    setFlash(req, 'error', 'Dados invalidos para atualizar produto.');
    return res.redirect(`/admin/products/${productId}/edit`);
  }

  const result = db.prepare(
    `UPDATE products
     SET name = ?, description = ?, price_cents = ?, stock = ?, image_url = ?, active = ?, updated_at = datetime('now')
     WHERE id = ?`
  ).run(name.trim(), description?.trim() || '', priceCents, stockInt, image_url?.trim() || '', active ? 1 : 0, productId);

  if (result.changes === 0) {
    setFlash(req, 'error', 'Produto nao encontrado.');
    return res.redirect('/admin/products');
  }

  setFlash(req, 'success', 'Produto atualizado com sucesso.');
  return res.redirect('/admin/products');
});

app.post('/admin/products/:id/delete', requireAdmin, (req, res) => {
  const productId = Number(req.params.id);
  const result = db.prepare('DELETE FROM products WHERE id = ?').run(productId);

  if (result.changes === 0) {
    setFlash(req, 'error', 'Produto nao encontrado.');
  } else {
    setFlash(req, 'success', 'Produto removido com sucesso.');
  }

  return res.redirect('/admin/products');
});

app.get('/admin/orders', requireAdmin, (req, res) => {
  const orders = db
    .prepare(
      `SELECT o.id, o.total_cents, o.status, o.created_at, u.name AS customer_name, u.email AS customer_email
       FROM orders o
       JOIN users u ON u.id = o.user_id
       ORDER BY o.created_at DESC`
    )
    .all();

  res.render('admin/orders/list', { orders });
});

app.post('/admin/orders/:id/status', requireAdmin, (req, res) => {
  const orderId = Number(req.params.id);
  const nextStatus = req.body.status;
  const allowed = new Set(['novo', 'pago', 'enviado', 'cancelado']);

  if (!allowed.has(nextStatus)) {
    setFlash(req, 'error', 'Status invalido.');
    return res.redirect('/admin/orders');
  }

  const order = db.prepare('SELECT id, status FROM orders WHERE id = ?').get(orderId);
  if (!order) {
    setFlash(req, 'error', 'Pedido nao encontrado.');
    return res.redirect('/admin/orders');
  }
  if (order.status === 'cancelado' && nextStatus !== 'cancelado') {
    setFlash(req, 'error', 'Pedido cancelado nao pode ser reativado.');
    return res.redirect('/admin/orders');
  }

  const tx = db.transaction(() => {
    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(nextStatus, orderId);

    if (order.status !== 'cancelado' && nextStatus === 'cancelado') {
      const items = db
        .prepare('SELECT product_id, quantity FROM order_items WHERE order_id = ?')
        .all(orderId);

      for (const item of items) {
        db.prepare("UPDATE products SET stock = stock + ?, updated_at = datetime('now') WHERE id = ?").run(
          item.quantity,
          item.product_id
        );
      }
    }
  });

  tx();
  setFlash(req, 'success', 'Status do pedido atualizado.');
  return res.redirect('/admin/orders');
});

app.use((req, res) => {
  res.status(404).render('not-found');
});

function startServer(port, retriesLeft) {
  const server = app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
  });

  server.on('error', (error) => {
    const usingExplicitPort = Boolean(process.env.PORT);

    if (error.code === 'EADDRINUSE' && !usingExplicitPort && retriesLeft > 0) {
      const nextPort = port + 1;
      console.warn(`Porta ${port} em uso. Tentando ${nextPort}...`);
      return startServer(nextPort, retriesLeft - 1);
    }

    console.error(`Nao foi possivel iniciar o servidor na porta ${port}.`, error.message);
    process.exit(1);
  });
}

startServer(DEFAULT_PORT, 20);
