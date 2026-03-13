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
const PUBLIC_DIR = path.join(__dirname, 'public');
const INDEX_FILE = path.join(PUBLIC_DIR, 'index.html');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(PUBLIC_DIR));

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

function sendError(res, status, message, extra = {}) {
  return res.status(status).json({
    ok: false,
    message,
    ...extra,
  });
}

function serializeUser(user) {
  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

function serializeProduct(product) {
  return {
    id: product.id,
    name: product.name,
    description: product.description || '',
    priceCents: product.price_cents,
    stock: product.stock,
    imageUrl: product.image_url || '',
    active: Boolean(product.active),
    createdAt: product.created_at,
    updatedAt: product.updated_at,
  };
}

function serializeOrder(order) {
  return {
    id: order.id,
    totalCents: order.total_cents,
    status: order.status,
    createdAt: order.created_at,
    customerName: order.customer_name || '',
    customerEmail: order.customer_email || '',
  };
}

function isCloudinaryReady() {
  return Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
}

function toCents(priceText) {
  const normalized = String(priceText ?? '').replace(',', '.').trim();
  const value = Number(normalized);
  if (!Number.isFinite(value) || value < 0) {
    return null;
  }
  return Math.round(value * 100);
}

function normalizeActive(value) {
  return value === true || value === 1 || value === '1' || value === 'true' || value === 'on' ? 1 : 0;
}

function requireAuth(req, res, next) {
  if (!req.session.user) {
    return sendError(res, 401, 'Faca login para continuar.');
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.user) {
    return sendError(res, 401, 'Faca login para continuar.');
  }

  if (req.session.user.role !== 'admin') {
    return sendError(res, 403, 'Acesso restrito ao administrador.');
  }

  next();
}

app.get('/api/session', (req, res) => {
  res.json({
    ok: true,
    user: serializeUser(req.session.user),
  });
});

app.get('/api/products', (_req, res) => {
  const products = db
    .prepare(
      `SELECT id, name, description, price_cents, stock, image_url, active, created_at, updated_at
       FROM products
       WHERE active = 1
       ORDER BY created_at DESC`
    )
    .all()
    .map(serializeProduct);

  res.json({
    ok: true,
    products,
  });
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password || password.length < 6) {
    return sendError(res, 400, 'Preencha os dados corretamente (senha com 6+ caracteres).');
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
  if (existing) {
    return sendError(res, 409, 'Este e-mail ja esta cadastrado.');
  }

  const normalizedName = name.trim();
  const hash = bcrypt.hashSync(password, 10);
  const result = db
    .prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)')
    .run(normalizedName, normalizedEmail, hash, 'customer');

  req.session.user = {
    id: result.lastInsertRowid,
    name: normalizedName,
    email: normalizedEmail,
    role: 'customer',
  };

  res.status(201).json({
    ok: true,
    message: 'Cadastro realizado com sucesso.',
    user: serializeUser(req.session.user),
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  const normalizedEmail = String(email || '').trim().toLowerCase();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(normalizedEmail);

  if (!user || !bcrypt.compareSync(password || '', user.password_hash)) {
    return sendError(res, 401, 'Credenciais invalidas.');
  }

  req.session.user = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  res.json({
    ok: true,
    message: `Bem-vindo, ${user.name}.`,
    user: serializeUser(req.session.user),
  });
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({
      ok: true,
      message: 'Sessao encerrada com sucesso.',
    });
  });
});

app.get('/api/orders/my', requireAuth, (req, res) => {
  const orders = db
    .prepare(
      `SELECT o.id, o.total_cents, o.status, o.created_at
       FROM orders o
       WHERE o.user_id = ?
       ORDER BY o.created_at DESC`
    )
    .all(req.session.user.id)
    .map(serializeOrder);

  res.json({
    ok: true,
    orders,
  });
});

app.post('/api/orders', requireAuth, (req, res) => {
  const productId = Number(req.body.productId);
  const quantity = Number(req.body.quantity);

  if (!Number.isInteger(productId) || !Number.isInteger(quantity) || quantity <= 0) {
    return sendError(res, 400, 'Pedido invalido.');
  }

  const product = db.prepare('SELECT * FROM products WHERE id = ? AND active = 1').get(productId);
  if (!product) {
    return sendError(res, 404, 'Produto nao encontrado.');
  }

  if (product.stock < quantity) {
    return sendError(res, 409, 'Estoque insuficiente para este pedido.');
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

  res.status(201).json({
    ok: true,
    message: 'Pedido realizado com sucesso.',
  });
});

app.get('/api/admin/dashboard', requireAdmin, (_req, res) => {
  const stats = {
    products: db.prepare('SELECT COUNT(*) AS count FROM products').get().count,
    customers: db.prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'customer'").get().count,
    orders: db.prepare('SELECT COUNT(*) AS count FROM orders').get().count,
    revenueCents: db.prepare("SELECT COALESCE(SUM(total_cents),0) AS value FROM orders WHERE status != 'cancelado'").get().value,
  };

  res.json({
    ok: true,
    stats,
  });
});

app.get('/api/admin/products', requireAdmin, (_req, res) => {
  const products = db
    .prepare(
      `SELECT id, name, description, price_cents, stock, image_url, active, created_at, updated_at
       FROM products
       ORDER BY created_at DESC`
    )
    .all()
    .map(serializeProduct);

  res.json({
    ok: true,
    products,
  });
});

app.get('/api/admin/products/:id', requireAdmin, (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(Number(req.params.id));
  if (!product) {
    return sendError(res, 404, 'Produto nao encontrado.');
  }

  res.json({
    ok: true,
    product: serializeProduct(product),
  });
});

app.post('/api/admin/upload-image', requireAdmin, (req, res) => {
  upload.single('image')(req, res, async (error) => {
    if (error) {
      return sendError(res, 400, error.message || 'Falha no upload da imagem.');
    }

    if (!isCloudinaryReady()) {
      return sendError(
        res,
        503,
        'Cloudinary nao configurado no ambiente. Defina CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY e CLOUDINARY_API_SECRET.'
      );
    }

    if (!req.file) {
      return sendError(res, 400, 'Envie uma imagem para continuar.');
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
        ok: true,
        image: {
          secureUrl: uploadResult.secure_url,
          publicId: uploadResult.public_id,
          width: uploadResult.width,
          height: uploadResult.height,
          format: uploadResult.format,
          bytes: uploadResult.bytes,
        },
        message: 'Upload concluido com sucesso.',
      });
    } catch (uploadError) {
      console.error('Falha no upload para Cloudinary:', uploadError.message);
      return sendError(res, 500, 'Nao foi possivel enviar a imagem agora.');
    }
  });
});

app.post('/api/admin/products', requireAdmin, (req, res) => {
  const { name, description, price, stock, imageUrl, active } = req.body;

  const priceCents = toCents(price);
  const stockInt = Number(stock);

  if (!name || priceCents === null || !Number.isInteger(stockInt) || stockInt < 0) {
    return sendError(res, 400, 'Dados invalidos para criar produto.');
  }

  const result = db
    .prepare(
      `INSERT INTO products (name, description, price_cents, stock, image_url, active)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(name.trim(), description?.trim() || '', priceCents, stockInt, imageUrl?.trim() || '', normalizeActive(active));

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);

  res.status(201).json({
    ok: true,
    message: 'Produto criado com sucesso.',
    product: serializeProduct(product),
  });
});

app.put('/api/admin/products/:id', requireAdmin, (req, res) => {
  const productId = Number(req.params.id);
  const { name, description, price, stock, imageUrl, active } = req.body;

  const priceCents = toCents(price);
  const stockInt = Number(stock);

  if (!name || priceCents === null || !Number.isInteger(stockInt) || stockInt < 0) {
    return sendError(res, 400, 'Dados invalidos para atualizar produto.');
  }

  const result = db
    .prepare(
      `UPDATE products
       SET name = ?, description = ?, price_cents = ?, stock = ?, image_url = ?, active = ?, updated_at = datetime('now')
       WHERE id = ?`
    )
    .run(name.trim(), description?.trim() || '', priceCents, stockInt, imageUrl?.trim() || '', normalizeActive(active), productId);

  if (result.changes === 0) {
    return sendError(res, 404, 'Produto nao encontrado.');
  }

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);

  res.json({
    ok: true,
    message: 'Produto atualizado com sucesso.',
    product: serializeProduct(product),
  });
});

app.delete('/api/admin/products/:id', requireAdmin, (req, res) => {
  const productId = Number(req.params.id);
  const result = db.prepare('DELETE FROM products WHERE id = ?').run(productId);

  if (result.changes === 0) {
    return sendError(res, 404, 'Produto nao encontrado.');
  }

  res.json({
    ok: true,
    message: 'Produto removido com sucesso.',
  });
});

app.get('/api/admin/orders', requireAdmin, (_req, res) => {
  const orders = db
    .prepare(
      `SELECT o.id, o.total_cents, o.status, o.created_at, u.name AS customer_name, u.email AS customer_email
       FROM orders o
       JOIN users u ON u.id = o.user_id
       ORDER BY o.created_at DESC`
    )
    .all()
    .map(serializeOrder);

  res.json({
    ok: true,
    orders,
  });
});

app.patch('/api/admin/orders/:id/status', requireAdmin, (req, res) => {
  const orderId = Number(req.params.id);
  const nextStatus = req.body.status;
  const allowed = new Set(['novo', 'pago', 'enviado', 'cancelado']);

  if (!allowed.has(nextStatus)) {
    return sendError(res, 400, 'Status invalido.');
  }

  const order = db.prepare('SELECT id, status FROM orders WHERE id = ?').get(orderId);
  if (!order) {
    return sendError(res, 404, 'Pedido nao encontrado.');
  }

  if (order.status === 'cancelado' && nextStatus !== 'cancelado') {
    return sendError(res, 409, 'Pedido cancelado nao pode ser reativado.');
  }

  const tx = db.transaction(() => {
    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(nextStatus, orderId);

    if (order.status !== 'cancelado' && nextStatus === 'cancelado') {
      const items = db.prepare('SELECT product_id, quantity FROM order_items WHERE order_id = ?').all(orderId);

      for (const item of items) {
        db.prepare("UPDATE products SET stock = stock + ?, updated_at = datetime('now') WHERE id = ?").run(
          item.quantity,
          item.product_id
        );
      }
    }
  });

  tx();

  res.json({
    ok: true,
    message: 'Status do pedido atualizado.',
  });
});

app.use('/api', (_req, res) => {
  sendError(res, 404, 'Endpoint nao encontrado.');
});

app.get('*', (_req, res) => {
  res.sendFile(INDEX_FILE);
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
