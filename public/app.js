import React, { useEffect, useState } from 'https://esm.sh/react@18.3.1';
import { createRoot } from 'https://esm.sh/react-dom@18.3.1/client';
import htm from 'https://esm.sh/htm@3.1.1';

const html = htm.bind(React.createElement);
const root = createRoot(document.getElementById('root'));

const HERO_FALLBACK =
  'https://images.unsplash.com/photo-1594938291221-94f18cbb5660?auto=format&fit=crop&w=1600&q=80';
const PRODUCT_FALLBACK =
  'https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?auto=format&fit=crop&w=800&q=80';

const categories = [
  {
    id: 'gravatas',
    title: 'Gravatas',
    image: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=700&q=80',
    target: 'produtos',
  },
  {
    id: 'kits',
    title: 'Kits',
    image: 'https://images.unsplash.com/photo-1620012253295-c15cc3e65df4?auto=format&fit=crop&w=700&q=80',
    target: 'kits-especiais',
  },
  {
    id: 'crianca',
    title: 'Crianca',
    image: 'https://images.unsplash.com/photo-1597256679311-673c17979f84?auto=format&fit=crop&w=700&q=80',
    target: 'produtos',
  },
  {
    id: 'prendedores',
    title: 'Prendedores de Gravata',
    image: 'https://images.unsplash.com/photo-1570021977627-0f1dd6b0f0f0?auto=format&fit=crop&w=700&q=80',
    target: 'produtos',
  },
  {
    id: 'abotoaduras',
    title: 'Abotoaduras',
    image: 'https://images.unsplash.com/photo-1604014056139-53a89f1f5d90?auto=format&fit=crop&w=700&q=80',
    target: 'produtos',
  },
];

const benefits = [
  'Qualidade Premium',
  'Envio para todo Brasil',
  'Pagamento Seguro',
  'Estilo e Sofisticacao',
];

function formatCurrency(valueInCents) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format((valueInCents || 0) / 100);
}

function formatDate(dateText) {
  if (!dateText) return '-';
  const normalized = dateText.includes('T') ? dateText : dateText.replace(' ', 'T');
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    return dateText;
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

function getRoute(pathname) {
  const normalized = pathname !== '/' ? pathname.replace(/\/+$/, '') || '/' : pathname;
  const editMatch = normalized.match(/^\/admin\/products\/(\d+)\/edit$/);

  if (normalized === '/') return { name: 'home' };
  if (normalized === '/login') return { name: 'login' };
  if (normalized === '/register') return { name: 'register' };
  if (normalized === '/my-orders') return { name: 'my-orders' };
  if (normalized === '/admin') return { name: 'admin-dashboard' };
  if (normalized === '/admin/products') return { name: 'admin-products' };
  if (normalized === '/admin/products/new') return { name: 'admin-product-new' };
  if (editMatch) return { name: 'admin-product-edit', params: { id: Number(editMatch[1]) } };
  if (normalized === '/admin/orders') return { name: 'admin-orders' };

  return { name: 'not-found' };
}

async function request(url, options = {}) {
  const { body, isFormData = false, ...rest } = options;
  const requestOptions = {
    headers: {
      Accept: 'application/json',
    },
    credentials: 'same-origin',
    ...rest,
  };

  if (body !== undefined) {
    if (isFormData) {
      requestOptions.body = body;
    } else {
      requestOptions.headers = {
        ...requestOptions.headers,
        'Content-Type': 'application/json',
      };
      requestOptions.body = JSON.stringify(body);
    }
  }

  const response = await fetch(url, requestOptions);
  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : null;

  if (!response.ok) {
    const error = new Error(payload?.message || 'Nao foi possivel concluir a solicitacao.');
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

function titleForRoute(route) {
  const titles = {
    home: 'BJ - Moda Social Masculina',
    login: 'Login | BJ',
    register: 'Cadastro | BJ',
    'my-orders': 'Meus pedidos | BJ',
    'admin-dashboard': 'Portal ADM | BJ',
    'admin-products': 'Produtos | BJ',
    'admin-product-new': 'Novo produto | BJ',
    'admin-product-edit': 'Editar produto | BJ',
    'admin-orders': 'Pedidos | BJ',
    'not-found': 'Pagina nao encontrada | BJ',
  };

  return titles[route.name] || 'BJ - Moda Social Masculina';
}

function AppLink({ href, onNavigate, className = '', ariaLabel, children }) {
  const handleClick = (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    event.preventDefault();
    onNavigate(href);
  };

  return html`
    <a href=${href} className=${className} aria-label=${ariaLabel} onClick=${handleClick}>
      ${children}
    </a>
  `;
}

function SectionLink({ sectionId, onNavigate, className = '', ariaLabel, children }) {
  const href = `/#${sectionId}`;

  const handleClick = (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    event.preventDefault();
    onNavigate('/', { hash: sectionId });
  };

  return html`
    <a href=${href} className=${className} aria-label=${ariaLabel} onClick=${handleClick}>
      ${children}
    </a>
  `;
}

function Notice({ notice, onClose }) {
  if (!notice) return null;

  return html`
    <div className=${`flash ${notice.type}`}>
      <div className="flash-row">
        <span>${notice.text}</span>
        <button className="flash-close" type="button" onClick=${onClose} aria-label="Fechar aviso">
          x
        </button>
      </div>
    </div>
  `;
}

function Header({ user, onNavigate, onLogout, busyAction }) {
  return html`
    <header>
      <div className="announcement">Qualidade premium em gravatas e acessorios - Envio para todo o Brasil</div>

      <div className="site-header">
        <div className="container header-shell">
          <${AppLink} href="/" className="logo" onNavigate=${onNavigate} ariaLabel="BJ Moda Social Masculina">
            <span className="logo-mark">BJ</span>
            <span className="logo-text">Moda Social Masculina</span>
          </${AppLink}>

          <nav className="main-nav" aria-label="Menu principal">
            <${SectionLink} sectionId="gravatas" onNavigate=${onNavigate}>Gravatas</${SectionLink}>
            <${SectionLink} sectionId="kits" onNavigate=${onNavigate}>Kits</${SectionLink}>
            <${SectionLink} sectionId="crianca" onNavigate=${onNavigate}>Crianca</${SectionLink}>
            <${SectionLink} sectionId="prendedores" onNavigate=${onNavigate}>Prendedores</${SectionLink}>
            <${SectionLink} sectionId="abotoaduras" onNavigate=${onNavigate}>Abotoaduras</${SectionLink}>
          </nav>

          <div className="header-actions">
            <${SectionLink} sectionId="produtos" className="icon-btn" ariaLabel="Buscar produtos" onNavigate=${onNavigate}>
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M10.5 3a7.5 7.5 0 0 1 5.95 12.07l4.24 4.23a1 1 0 1 1-1.42 1.42l-4.23-4.24A7.5 7.5 0 1 1 10.5 3Zm0 2a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11Z" />
              </svg>
            </${SectionLink}>
            <${SectionLink} sectionId="produtos" className="icon-btn" ariaLabel="Colecao" onNavigate=${onNavigate}>
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M8 20a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm9 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4ZM3 2a1 1 0 0 0 0 2h1.12l2.07 9.66A3 3 0 0 0 9.12 16H18a1 1 0 1 0 0-2H9.12a1 1 0 0 1-.98-.79L7.89 12h10.66a3 3 0 0 0 2.93-2.34l1.3-5.52A1 1 0 0 0 21.8 3H6.28L6.03 1.86A1 1 0 0 0 5.05 1H3Z" />
              </svg>
            </${SectionLink}>

            ${user
              ? html`
                  <span className="welcome">Ola, ${user.name}</span>
                  ${user.role === 'customer'
                    ? html`<${AppLink} href="/my-orders" className="action-link" onNavigate=${onNavigate}>Meus pedidos</${AppLink}>`
                    : null}
                  ${user.role === 'admin'
                    ? html`<${AppLink} href="/admin" className="action-link" onNavigate=${onNavigate}>Portal ADM</${AppLink}>`
                    : null}
                  <button className="action-link" type="button" onClick=${onLogout} disabled=${busyAction === 'logout'}>
                    ${busyAction === 'logout' ? 'Saindo...' : 'Sair'}
                  </button>
                `
              : html`
                  <${AppLink} href="/login" className="action-link" onNavigate=${onNavigate}>Login</${AppLink}>
                  <${AppLink} href="/register" className="action-link highlight" onNavigate=${onNavigate}>Cadastro</${AppLink}>
                `}
          </div>
        </div>
      </div>
    </header>
  `;
}

function Footer({ onNavigate }) {
  return html`
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <h3 className="footer-brand">BJ - Moda Social Masculina</h3>
          <p>Gravatas e acessorios para homens que valorizam estilo, alfaiataria e sofisticacao.</p>
        </div>

        <div>
          <h4>Links Rapidos</h4>
          <${SectionLink} sectionId="gravatas" onNavigate=${onNavigate}>Gravatas</${SectionLink}>
          <${SectionLink} sectionId="kits-especiais" onNavigate=${onNavigate}>Kits Especiais</${SectionLink}>
          <${SectionLink} sectionId="beneficios" onNavigate=${onNavigate}>Beneficios</${SectionLink}>
          <${AppLink} href="/login" onNavigate=${onNavigate}>Minha Conta</${AppLink}>
        </div>

        <div>
          <h4>Redes Sociais</h4>
          <a href="#" aria-label="Instagram">Instagram</a>
          <a href="#" aria-label="Facebook">Facebook</a>
          <a href="#" aria-label="WhatsApp">WhatsApp</a>
        </div>

        <div>
          <h4>Contato</h4>
          <p>contato@bjmodasocial.com.br</p>
          <p>(11) 90000-0000</p>
          <a href="#">Politica de Privacidade</a>
        </div>
      </div>
      <div className="container footer-bottom">
        <small>&copy; ${new Date().getFullYear()} BJ - Moda Social Masculina. Todos os direitos reservados.</small>
      </div>
    </footer>
  `;
}

function Hero({ onNavigate }) {
  const handleImageError = (event) => {
    event.currentTarget.onerror = null;
    event.currentTarget.src = HERO_FALLBACK;
  };

  return html`
    <section className="hero" id="topo">
      <div className="hero-media">
        <img src="/images/hero-gravatas.jpg" alt="Interior da loja BJ com gravatas e acessorios sociais masculinos" onError=${handleImageError} />
      </div>
      <div className="hero-content">
        <p className="hero-kicker">Colecao Premium</p>
        <h1>Elegancia em Cada Detalhe</h1>
        <p>Gravatas e acessorios para homens que valorizam estilo e sofisticacao.</p>
        <button className="btn" type="button" onClick=${() => onNavigate('/', { hash: 'produtos' })}>
          Ver Colecao
        </button>
      </div>
    </section>
  `;
}

function ProductCard({ product, user, onPurchase, busyAction, onNavigate }) {
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    setQuantity((current) => {
      const nextValue = Math.min(current, product.stock || 1);
      return nextValue > 0 ? nextValue : 1;
    });
  }, [product.id, product.stock]);

  const busyKey = `buy-${product.id}`;
  const handleSubmit = (event) => {
    event.preventDefault();
    onPurchase(product.id, quantity);
  };

  const handleImageError = (event) => {
    event.currentTarget.onerror = null;
    event.currentTarget.src = PRODUCT_FALLBACK;
  };

  return html`
    <article className="product-card">
      <img src=${product.imageUrl || PRODUCT_FALLBACK} alt=${product.name} onError=${handleImageError} />
      <div className="product-content">
        <h3>${product.name}</h3>
        <p className="small">${product.description || 'Acabamento refinado para ocasioes especiais.'}</p>
        <p className="price">${formatCurrency(product.priceCents)}</p>
        <p className="stock">Estoque: <strong>${product.stock}</strong></p>

        ${user && user.role === 'customer'
          ? product.stock > 0
            ? html`
                <form className="inline" onSubmit=${handleSubmit}>
                  <input
                    type="number"
                    min="1"
                    max=${product.stock}
                    value=${quantity}
                    onChange=${(event) => setQuantity(Number(event.target.value) || 1)}
                    required
                  />
                  <button type="submit" disabled=${busyAction === busyKey}>
                    ${busyAction === busyKey ? 'Processando...' : 'Comprar'}
                  </button>
                </form>
              `
            : html`<p className="small">Sem estoque no momento.</p>`
          : html`
              <button className="btn secondary" type="button" onClick=${() => onNavigate('/login')}>
                Faca login para comprar
              </button>
            `}
      </div>
    </article>
  `;
}

function HomePage({ products, user, onPurchase, busyAction, onNavigate, loadingPage }) {
  return html`
    <div className="page-stack">
      <${Hero} onNavigate=${onNavigate} />

      <section className="section-block" id="categorias">
        <div className="section-header">
          <p className="section-kicker">Selecao Curada</p>
          <h2>Categorias</h2>
        </div>

        <div className="category-grid">
          ${categories.map(
            (category) => html`
              <article className="category-card" id=${category.id} key=${category.id}>
                <img src=${category.image} alt=${category.title} />
                <div className="category-content">
                  <h3>${category.title}</h3>
                  <button className="btn secondary" type="button" onClick=${() => onNavigate('/', { hash: category.target })}>
                    Explorar
                  </button>
                </div>
              </article>
            `
          )}
        </div>
      </section>

      <section className="section-block" id="produtos">
        <div className="section-header">
          <p className="section-kicker">Curadoria Premium</p>
          <h2>Produtos em Destaque</h2>
        </div>

        ${loadingPage && products.length === 0
          ? html`<div className="card empty-card"><p>Carregando produtos...</p></div>`
          : products.length === 0
            ? html`
                <div className="card empty-card">
                  <p>Nenhum produto cadastrado no momento. Use o portal administrativo para criar os primeiros itens.</p>
                </div>
              `
            : html`
                <div className="product-grid">
                  ${products.map(
                    (product) => html`
                      <${ProductCard}
                        key=${product.id}
                        product=${product}
                        user=${user}
                        busyAction=${busyAction}
                        onPurchase=${onPurchase}
                        onNavigate=${onNavigate}
                      />
                    `
                  )}
                </div>
              `}
      </section>

      <section className="section-block about-block" id="sobre">
        <div className="section-header">
          <p className="section-kicker">Nossa Marca</p>
          <h2>Sobre a BJ</h2>
        </div>
        <p className="about-text">
          A BJ Moda Social Masculina nasceu para elevar o estilo do homem moderno. Cada gravata e escolhida para transmitir
          elegancia, personalidade e sofisticacao.
        </p>
      </section>

      <section className="section-block kit-block" id="kits-especiais">
        <div className="section-header">
          <p className="section-kicker">Combinacoes Exclusivas</p>
          <h2>Kits Especiais</h2>
        </div>

        <div className="kit-highlight">
          <div>
            <h3>Kit Assinatura Premium</h3>
            <p>Combine gravata, abotoadura e prendedor com curadoria sofisticada para eventos, negocios e ocasioes formais.</p>
            <button className="btn" type="button" onClick=${() => onNavigate('/', { hash: 'produtos' })}>
              Montar Meu Kit
            </button>
          </div>
          <ul>
            <li>Gravata de seda com acabamento premium</li>
            <li>Abotoaduras com detalhe metalico elegante</li>
            <li>Prendedor de gravata em aco escovado</li>
          </ul>
        </div>
      </section>

      <section className="section-block" id="beneficios">
        <div className="section-header">
          <p className="section-kicker">Diferenciais BJ</p>
          <h2>Beneficios</h2>
        </div>

        <div className="benefit-grid">
          ${benefits.map(
            (benefit) => html`
              <article className="benefit-item" key=${benefit}>
                &#10003; ${benefit}
              </article>
            `
          )}
        </div>
      </section>
    </div>
  `;
}

function AuthCard({ title, subtitle, children }) {
  return html`
    <section className="auth-card">
      <h1>${title}</h1>
      ${subtitle ? html`<p className="small">${subtitle}</p>` : null}
      ${children}
    </section>
  `;
}

function GateCard({ title, text, actionLabel, onAction }) {
  return html`
    <section className="card empty-card">
      <h1>${title}</h1>
      <p className="small">${text}</p>
      ${actionLabel ? html`<button className="btn" type="button" onClick=${onAction}>${actionLabel}</button>` : null}
    </section>
  `;
}

function LoginPage({ user, onLogin, busyAction, onNavigate }) {
  const [form, setForm] = useState({ email: '', password: '' });

  if (user) {
    return html`
      <section className="card empty-card">
        <h1>Voce ja esta logado</h1>
        <p className="small">Use o atalho abaixo para continuar navegando.</p>
        <button className="btn" type="button" onClick=${() => onNavigate(user.role === 'admin' ? '/admin' : '/')}>
          Continuar
        </button>
      </section>
    `;
  }

  const handleSubmit = (event) => {
    event.preventDefault();
    onLogin(form);
  };

  return html`
    <${AuthCard} title="Login" subtitle="Cliente e administrador usam o mesmo formulario.">
      <form onSubmit=${handleSubmit}>
        <label htmlFor="login-email">E-mail</label>
        <input
          id="login-email"
          type="email"
          value=${form.email}
          onChange=${(event) => setForm({ ...form, email: event.target.value })}
          required
        />

        <label htmlFor="login-password">Senha</label>
        <input
          id="login-password"
          type="password"
          value=${form.password}
          onChange=${(event) => setForm({ ...form, password: event.target.value })}
          required
        />

        <button type="submit" disabled=${busyAction === 'login'}>
          ${busyAction === 'login' ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      <p className="small">
        Nao tem conta?
        <button className="text-link" type="button" onClick=${() => onNavigate('/register')}>
          Cadastre-se
        </button>
        .
      </p>
    </${AuthCard}>
  `;
}

function RegisterPage({ user, onRegister, busyAction, onNavigate }) {
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  if (user) {
    return html`
      <section className="card empty-card">
        <h1>Cadastro indisponivel</h1>
        <p className="small">Sua sessao ja esta ativa.</p>
        <button className="btn" type="button" onClick=${() => onNavigate('/')}>Voltar para a home</button>
      </section>
    `;
  }

  const handleSubmit = (event) => {
    event.preventDefault();
    onRegister(form);
  };

  return html`
    <${AuthCard} title="Cadastro de cliente">
      <form onSubmit=${handleSubmit}>
        <label htmlFor="register-name">Nome</label>
        <input
          id="register-name"
          type="text"
          value=${form.name}
          onChange=${(event) => setForm({ ...form, name: event.target.value })}
          required
        />

        <label htmlFor="register-email">E-mail</label>
        <input
          id="register-email"
          type="email"
          value=${form.email}
          onChange=${(event) => setForm({ ...form, email: event.target.value })}
          required
        />

        <label htmlFor="register-password">Senha (minimo 6 caracteres)</label>
        <input
          id="register-password"
          type="password"
          minLength="6"
          value=${form.password}
          onChange=${(event) => setForm({ ...form, password: event.target.value })}
          required
        />

        <button type="submit" disabled=${busyAction === 'register'}>
          ${busyAction === 'register' ? 'Criando conta...' : 'Criar conta'}
        </button>
      </form>
    </${AuthCard}>
  `;
}

function OrdersPage({ user, orders, loadingPage, onNavigate }) {
  if (!user) {
    return html`
      <${GateCard}
        title="Login necessario"
        text="Entre na sua conta para visualizar os pedidos."
        actionLabel="Ir para login"
        onAction=${() => onNavigate('/login')}
      />
    `;
  }

  if (user.role !== 'customer') {
    return html`
      <${GateCard}
        title="Area exclusiva para clientes"
        text="Administradores acompanham operacoes pelo portal administrativo."
        actionLabel="Abrir portal ADM"
        onAction=${() => onNavigate('/admin')}
      />
    `;
  }

  return html`
    <section>
      <div className="page-head">
        <h1>Meus pedidos</h1>
        <p className="small">Acompanhe status, datas e totais dos seus pedidos.</p>
      </div>

      ${loadingPage && orders.length === 0
        ? html`<div className="card"><p>Carregando pedidos...</p></div>`
        : orders.length === 0
          ? html`<div className="card"><p>Voce ainda nao fez pedidos.</p></div>`
          : html`
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Data</th>
                      <th>Status</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${orders.map(
                      (order) => html`
                        <tr key=${order.id}>
                          <td>${order.id}</td>
                          <td>${formatDate(order.createdAt)}</td>
                          <td><span className=${`status-chip ${order.status}`}>${order.status}</span></td>
                          <td>${formatCurrency(order.totalCents)}</td>
                        </tr>
                      `
                    )}
                  </tbody>
                </table>
              </div>
            `}
    </section>
  `;
}

function AdminDashboardPage({ user, stats, loadingPage, onNavigate }) {
  if (!user) {
    return html`
      <${GateCard}
        title="Login necessario"
        text="Entre com a conta de administrador para acessar o painel."
        actionLabel="Ir para login"
        onAction=${() => onNavigate('/login')}
      />
    `;
  }

  if (user.role !== 'admin') {
    return html`
      <${GateCard}
        title="Acesso restrito"
        text="Esta area e exclusiva para administradores."
        actionLabel="Voltar para a home"
        onAction=${() => onNavigate('/')}
      />
    `;
  }

  return html`
    <section>
      <div className="page-head">
        <h1>Portal do Administrador</h1>
        <p className="small">Resumo operacional da loja em tempo real.</p>
      </div>

      ${loadingPage && !stats
        ? html`<div className="card"><p>Carregando indicadores...</p></div>`
        : html`
            <div className="stats">
              <div className="stat">
                <h3>${stats?.products || 0}</h3>
                <p className="small">Produtos cadastrados</p>
              </div>
              <div className="stat">
                <h3>${stats?.customers || 0}</h3>
                <p className="small">Clientes</p>
              </div>
              <div className="stat">
                <h3>${stats?.orders || 0}</h3>
                <p className="small">Pedidos</p>
              </div>
              <div className="stat">
                <h3>${formatCurrency(stats?.revenueCents || 0)}</h3>
                <p className="small">Faturamento (sem cancelados)</p>
              </div>
            </div>

            <div className="panel">
              <h2>Acoes rapidas</h2>
              <div className="admin-actions">
                <button className="btn" type="button" onClick=${() => onNavigate('/admin/products')}>
                  Gerenciar produtos
                </button>
                <button className="btn secondary" type="button" onClick=${() => onNavigate('/admin/orders')}>
                  Gerenciar pedidos
                </button>
              </div>
            </div>
          `}
    </section>
  `;
}

function AdminProductsPage({ user, products, loadingPage, busyAction, onNavigate, onDelete }) {
  if (!user) {
    return html`
      <${GateCard}
        title="Login necessario"
        text="Entre com a conta de administrador para gerenciar os produtos."
        actionLabel="Ir para login"
        onAction=${() => onNavigate('/login')}
      />
    `;
  }

  if (user.role !== 'admin') {
    return html`
      <${GateCard}
        title="Acesso restrito"
        text="Somente administradores podem alterar o catalogo."
        actionLabel="Voltar para a home"
        onAction=${() => onNavigate('/')}
      />
    `;
  }

  return html`
    <section>
      <div className="page-head page-head-inline">
        <div>
          <h1>Produtos</h1>
          <p className="small">Gerencie estoque, ativacao e imagens do catalogo.</p>
        </div>
        <button className="btn" type="button" onClick=${() => onNavigate('/admin/products/new')}>
          Novo produto
        </button>
      </div>

      ${loadingPage && products.length === 0
        ? html`<div className="card"><p>Carregando produtos...</p></div>`
        : products.length === 0
          ? html`<div className="card"><p>Nenhum produto cadastrado.</p></div>`
          : html`
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Nome</th>
                      <th>Preco</th>
                      <th>Estoque</th>
                      <th>Ativo</th>
                      <th>Acoes</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${products.map(
                      (product) => html`
                        <tr key=${product.id}>
                          <td>${product.id}</td>
                          <td>${product.name}</td>
                          <td>${formatCurrency(product.priceCents)}</td>
                          <td>${product.stock}</td>
                          <td>${product.active ? 'Sim' : 'Nao'}</td>
                          <td>
                            <div className="table-actions">
                              <button className="btn secondary" type="button" onClick=${() => onNavigate(`/admin/products/${product.id}/edit`)}>
                                Editar
                              </button>
                              <button
                                className="danger"
                                type="button"
                                onClick=${() => onDelete(product)}
                                disabled=${busyAction === `delete-product-${product.id}`}
                              >
                                ${busyAction === `delete-product-${product.id}` ? 'Excluindo...' : 'Excluir'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      `
                    )}
                  </tbody>
                </table>
              </div>
            `}
    </section>
  `;
}

function AdminProductFormPage({
  user,
  initialProduct,
  loadingPage,
  busyAction,
  onSave,
  onUploadImage,
  onNavigate,
  isEditing,
}) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    stock: 0,
    imageUrl: '',
    active: true,
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadMessage, setUploadMessage] = useState('');

  useEffect(() => {
    setForm({
      name: initialProduct?.name || '',
      description: initialProduct?.description || '',
      price:
        initialProduct && Number.isFinite(initialProduct.priceCents)
          ? (initialProduct.priceCents / 100).toFixed(2).replace('.', ',')
          : '',
      stock: initialProduct?.stock ?? 0,
      imageUrl: initialProduct?.imageUrl || '',
      active: initialProduct?.active ?? true,
    });
  }, [initialProduct]);

  if (!user) {
    return html`
      <${GateCard}
        title="Login necessario"
        text="Entre com a conta de administrador para editar o catalogo."
        actionLabel="Ir para login"
        onAction=${() => onNavigate('/login')}
      />
    `;
  }

  if (user.role !== 'admin') {
    return html`
      <${GateCard}
        title="Acesso restrito"
        text="Somente administradores podem gerenciar produtos."
        actionLabel="Voltar para a home"
        onAction=${() => onNavigate('/')}
      />
    `;
  }

  if (loadingPage && isEditing && !initialProduct) {
    return html`<section className="card"><p>Carregando produto...</p></section>`;
  }

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave(form, initialProduct?.id);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadMessage('Selecione um arquivo antes de enviar.');
      return;
    }

    setUploadMessage('Enviando imagem...');
    const uploadedUrl = await onUploadImage(selectedFile);
    if (uploadedUrl) {
      setForm((current) => ({ ...current, imageUrl: uploadedUrl }));
      setUploadMessage('Upload concluido. URL preenchida com sucesso.');
    } else {
      setUploadMessage('Nao foi possivel concluir o upload.');
    }
  };

  return html`
    <section className="panel">
      <div className="page-head">
        <h1>${isEditing ? 'Editar produto' : 'Novo produto'}</h1>
        <p className="small">Cadastre nome, descricao, preco, estoque e imagem do produto.</p>
      </div>

      <form onSubmit=${handleSubmit}>
        <div className="form-grid">
          <div>
            <label htmlFor="product-name">Nome</label>
            <input
              id="product-name"
              type="text"
              value=${form.name}
              onChange=${(event) => setForm({ ...form, name: event.target.value })}
              required
            />
          </div>

          <div>
            <label htmlFor="product-price">Preco (R$)</label>
            <input
              id="product-price"
              type="text"
              value=${form.price}
              onChange=${(event) => setForm({ ...form, price: event.target.value })}
              required
            />
          </div>

          <div>
            <label htmlFor="product-stock">Estoque</label>
            <input
              id="product-stock"
              type="number"
              min="0"
              value=${form.stock}
              onChange=${(event) => setForm({ ...form, stock: event.target.value })}
              required
            />
          </div>

          <div>
            <label htmlFor="product-active">Produto ativo?</label>
            <select
              id="product-active"
              value=${form.active ? 'true' : 'false'}
              onChange=${(event) => setForm({ ...form, active: event.target.value === 'true' })}
            >
              <option value="true">Sim</option>
              <option value="false">Nao</option>
            </select>
          </div>
        </div>

        <label htmlFor="product-description">Descricao</label>
        <textarea
          id="product-description"
          value=${form.description}
          onChange=${(event) => setForm({ ...form, description: event.target.value })}
        ></textarea>

        <label htmlFor="product-image-url">URL da imagem</label>
        <input
          id="product-image-url"
          type="url"
          value=${form.imageUrl}
          onChange=${(event) => setForm({ ...form, imageUrl: event.target.value })}
        />
        <p className="small">Opcional: envie uma imagem para o Cloudinary e a URL sera preenchida automaticamente.</p>

        <div className="upload-box">
          <div>
            <label htmlFor="product-image-file">Upload de imagem (JPG, PNG ou WEBP, ate 5MB)</label>
            <input
              id="product-image-file"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange=${(event) => setSelectedFile(event.target.files?.[0] || null)}
            />
          </div>

          <div className="inline">
            <button
              type="button"
              className="secondary"
              onClick=${handleUpload}
              disabled=${busyAction === 'upload-image'}
            >
              ${busyAction === 'upload-image' ? 'Enviando...' : 'Enviar para Cloudinary'}
            </button>
            <span className="small" aria-live="polite">${uploadMessage}</span>
          </div>
        </div>

        ${form.imageUrl
          ? html`
              <div className="image-preview">
                <img src=${form.imageUrl} alt="Preview do produto" />
              </div>
            `
          : null}

        <div className="form-actions">
          <button type="submit" disabled=${busyAction === 'save-product'}>
            ${busyAction === 'save-product' ? 'Salvando...' : isEditing ? 'Salvar alteracoes' : 'Criar produto'}
          </button>
          <button className="btn secondary" type="button" onClick=${() => onNavigate('/admin/products')}>
            Cancelar
          </button>
        </div>
      </form>
    </section>
  `;
}

function OrderStatusRow({ order, busyAction, onSave }) {
  const [status, setStatus] = useState(order.status);

  useEffect(() => {
    setStatus(order.status);
  }, [order.id, order.status]);

  const busyKey = `order-status-${order.id}`;

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave(order.id, status);
  };

  return html`
    <tr>
      <td>${order.id}</td>
      <td>${order.customerName}</td>
      <td>${order.customerEmail}</td>
      <td>${formatCurrency(order.totalCents)}</td>
      <td><span className=${`status-chip ${order.status}`}>${order.status}</span></td>
      <td>${formatDate(order.createdAt)}</td>
      <td>
        <form className="inline" onSubmit=${handleSubmit}>
          <select value=${status} onChange=${(event) => setStatus(event.target.value)}>
            <option value="novo">novo</option>
            <option value="pago">pago</option>
            <option value="enviado">enviado</option>
            <option value="cancelado">cancelado</option>
          </select>
          <button type="submit" disabled=${busyAction === busyKey}>
            ${busyAction === busyKey ? 'Salvando...' : 'Salvar'}
          </button>
        </form>
      </td>
    </tr>
  `;
}

function AdminOrdersPage({ user, orders, loadingPage, busyAction, onUpdateStatus, onNavigate }) {
  if (!user) {
    return html`
      <${GateCard}
        title="Login necessario"
        text="Entre com a conta de administrador para acompanhar os pedidos."
        actionLabel="Ir para login"
        onAction=${() => onNavigate('/login')}
      />
    `;
  }

  if (user.role !== 'admin') {
    return html`
      <${GateCard}
        title="Acesso restrito"
        text="Somente administradores podem alterar os status dos pedidos."
        actionLabel="Voltar para a home"
        onAction=${() => onNavigate('/')}
      />
    `;
  }

  return html`
    <section>
      <div className="page-head">
        <h1>Pedidos</h1>
        <p className="small">Atualize o status e acompanhe o historico mais recente.</p>
      </div>

      ${loadingPage && orders.length === 0
        ? html`<div className="card"><p>Carregando pedidos...</p></div>`
        : orders.length === 0
          ? html`<div className="card"><p>Nenhum pedido realizado ainda.</p></div>`
          : html`
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Cliente</th>
                      <th>E-mail</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Data</th>
                      <th>Atualizar</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${orders.map(
                      (order) => html`
                        <${OrderStatusRow}
                          key=${order.id}
                          order=${order}
                          busyAction=${busyAction}
                          onSave=${onUpdateStatus}
                        />
                      `
                    )}
                  </tbody>
                </table>
              </div>
            `}
    </section>
  `;
}

function NotFoundPage({ onNavigate }) {
  return html`
    <section className="card empty-card">
      <h1>Pagina nao encontrada</h1>
      <p>O endereco solicitado nao existe.</p>
      <button className="btn" type="button" onClick=${() => onNavigate('/')}>Voltar para a pagina inicial</button>
    </section>
  `;
}

function App() {
  const [pathname, setPathname] = useState(window.location.pathname);
  const [user, setUser] = useState(null);
  const [notice, setNotice] = useState(null);
  const [busyAction, setBusyAction] = useState('');
  const [sessionReady, setSessionReady] = useState(false);
  const [loadingPage, setLoadingPage] = useState(false);
  const [storeProducts, setStoreProducts] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [adminStats, setAdminStats] = useState(null);
  const [adminProducts, setAdminProducts] = useState([]);
  const [adminOrders, setAdminOrders] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);

  const route = getRoute(pathname);

  useEffect(() => {
    document.title = titleForRoute(route);
  }, [route]);

  useEffect(() => {
    const onPopState = () => {
      setPathname(window.location.pathname);
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function syncSession() {
      try {
        const data = await request('/api/session');
        if (!cancelled) {
          setUser(data.user);
        }
      } catch (error) {
        if (!cancelled) {
          setNotice({ type: 'error', text: error.message });
        }
      } finally {
        if (!cancelled) {
          setSessionReady(true);
        }
      }
    }

    syncSession();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!notice) return undefined;

    const timer = window.setTimeout(() => {
      setNotice(null);
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (!sessionReady) return undefined;

    let cancelled = false;

    async function loadRouteData() {
      setLoadingPage(true);

      try {
        if (route.name === 'home') {
          const data = await request('/api/products');
          if (!cancelled) {
            setStoreProducts(data.products);
          }
        } else if (route.name === 'my-orders') {
          if (user?.role === 'customer') {
            const data = await request('/api/orders/my');
            if (!cancelled) {
              setMyOrders(data.orders);
            }
          } else if (!cancelled) {
            setMyOrders([]);
          }
        } else if (route.name === 'admin-dashboard') {
          if (user?.role === 'admin') {
            const data = await request('/api/admin/dashboard');
            if (!cancelled) {
              setAdminStats(data.stats);
            }
          } else if (!cancelled) {
            setAdminStats(null);
          }
        } else if (route.name === 'admin-products') {
          if (user?.role === 'admin') {
            const data = await request('/api/admin/products');
            if (!cancelled) {
              setAdminProducts(data.products);
            }
          } else if (!cancelled) {
            setAdminProducts([]);
          }
        } else if (route.name === 'admin-product-new') {
          if (!cancelled) {
            setEditingProduct(null);
          }
        } else if (route.name === 'admin-product-edit') {
          if (user?.role === 'admin') {
            const data = await request(`/api/admin/products/${route.params.id}`);
            if (!cancelled) {
              setEditingProduct(data.product);
            }
          } else if (!cancelled) {
            setEditingProduct(null);
          }
        } else if (route.name === 'admin-orders') {
          if (user?.role === 'admin') {
            const data = await request('/api/admin/orders');
            if (!cancelled) {
              setAdminOrders(data.orders);
            }
          } else if (!cancelled) {
            setAdminOrders([]);
          }
        }
      } catch (error) {
        if (!cancelled) {
          setNotice({ type: 'error', text: error.message });
          if (error.status === 401) {
            setUser(null);
          }
        }
      } finally {
        if (!cancelled) {
          setLoadingPage(false);
        }
      }
    }

    loadRouteData();

    return () => {
      cancelled = true;
    };
  }, [pathname, route.name, route.params?.id, sessionReady, user?.id, user?.role]);

  useEffect(() => {
    if (window.location.hash) {
      const targetId = window.location.hash.replace('#', '');
      window.requestAnimationFrame(() => {
        const element = document.getElementById(targetId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }
  }, [pathname]);

  const navigate = (nextPath, options = {}) => {
    const targetPath = nextPath || '/';
    const hash = options.hash ? `#${options.hash}` : '';
    const url = `${targetPath}${hash}`;

    if (options.replace) {
      window.history.replaceState({}, '', url);
    } else if (`${window.location.pathname}${window.location.hash}` !== url) {
      window.history.pushState({}, '', url);
    }

    setPathname(window.location.pathname);

    if (options.hash) {
      window.requestAnimationFrame(() => {
        const element = document.getElementById(options.hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleLogin = async (credentials) => {
    setBusyAction('login');

    try {
      const data = await request('/api/auth/login', {
        method: 'POST',
        body: credentials,
      });

      setUser(data.user);
      setNotice({ type: 'success', text: data.message });
      navigate(data.user.role === 'admin' ? '/admin' : '/');
    } catch (error) {
      setNotice({ type: 'error', text: error.message });
    } finally {
      setBusyAction('');
    }
  };

  const handleRegister = async (payload) => {
    setBusyAction('register');

    try {
      const data = await request('/api/auth/register', {
        method: 'POST',
        body: payload,
      });

      setUser(data.user);
      setNotice({ type: 'success', text: data.message });
      navigate('/');
    } catch (error) {
      setNotice({ type: 'error', text: error.message });
    } finally {
      setBusyAction('');
    }
  };

  const handleLogout = async () => {
    setBusyAction('logout');

    try {
      const data = await request('/api/auth/logout', {
        method: 'POST',
      });

      setUser(null);
      setNotice({ type: 'success', text: data.message });
      navigate('/', { replace: true });
    } catch (error) {
      setNotice({ type: 'error', text: error.message });
    } finally {
      setBusyAction('');
    }
  };

  const handlePurchase = async (productId, quantity) => {
    const busyKey = `buy-${productId}`;
    setBusyAction(busyKey);

    try {
      const data = await request('/api/orders', {
        method: 'POST',
        body: {
          productId,
          quantity,
        },
      });

      setNotice({ type: 'success', text: data.message });
      navigate('/my-orders');
    } catch (error) {
      setNotice({ type: 'error', text: error.message });
    } finally {
      setBusyAction('');
    }
  };

  const handleSaveProduct = async (form, productId) => {
    setBusyAction('save-product');

    try {
      const data = await request(productId ? `/api/admin/products/${productId}` : '/api/admin/products', {
        method: productId ? 'PUT' : 'POST',
        body: {
          name: form.name,
          description: form.description,
          price: form.price,
          stock: form.stock,
          imageUrl: form.imageUrl,
          active: form.active,
        },
      });

      setNotice({ type: 'success', text: data.message });
      navigate('/admin/products');
    } catch (error) {
      setNotice({ type: 'error', text: error.message });
    } finally {
      setBusyAction('');
    }
  };

  const handleUploadImage = async (file) => {
    setBusyAction('upload-image');

    try {
      const formData = new FormData();
      formData.append('image', file);

      const data = await request('/api/admin/upload-image', {
        method: 'POST',
        body: formData,
        isFormData: true,
      });

      setNotice({ type: 'success', text: data.message });
      return data.image.secureUrl;
    } catch (error) {
      setNotice({ type: 'error', text: error.message });
      return '';
    } finally {
      setBusyAction('');
    }
  };

  const handleDeleteProduct = async (product) => {
    if (!window.confirm(`Excluir o produto "${product.name}"?`)) {
      return;
    }

    const busyKey = `delete-product-${product.id}`;
    setBusyAction(busyKey);

    try {
      const data = await request(`/api/admin/products/${product.id}`, {
        method: 'DELETE',
      });

      setAdminProducts((current) => current.filter((item) => item.id !== product.id));
      setNotice({ type: 'success', text: data.message });
    } catch (error) {
      setNotice({ type: 'error', text: error.message });
    } finally {
      setBusyAction('');
    }
  };

  const handleUpdateOrderStatus = async (orderId, status) => {
    const busyKey = `order-status-${orderId}`;
    setBusyAction(busyKey);

    try {
      const data = await request(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        body: { status },
      });

      setAdminOrders((current) =>
        current.map((order) => (order.id === orderId ? { ...order, status } : order))
      );
      setNotice({ type: 'success', text: data.message });
    } catch (error) {
      setNotice({ type: 'error', text: error.message });
    } finally {
      setBusyAction('');
    }
  };

  let pageContent = null;

  if (!sessionReady) {
    pageContent = html`<section className="card empty-card"><p>Inicializando a aplicacao...</p></section>`;
  } else if (route.name === 'home') {
    pageContent = html`
      <${HomePage}
        products=${storeProducts}
        user=${user}
        onPurchase=${handlePurchase}
        busyAction=${busyAction}
        onNavigate=${navigate}
        loadingPage=${loadingPage}
      />
    `;
  } else if (route.name === 'login') {
    pageContent = html`
      <${LoginPage} user=${user} onLogin=${handleLogin} busyAction=${busyAction} onNavigate=${navigate} />
    `;
  } else if (route.name === 'register') {
    pageContent = html`
      <${RegisterPage}
        user=${user}
        onRegister=${handleRegister}
        busyAction=${busyAction}
        onNavigate=${navigate}
      />
    `;
  } else if (route.name === 'my-orders') {
    pageContent = html`
      <${OrdersPage}
        user=${user}
        orders=${myOrders}
        loadingPage=${loadingPage}
        onNavigate=${navigate}
      />
    `;
  } else if (route.name === 'admin-dashboard') {
    pageContent = html`
      <${AdminDashboardPage}
        user=${user}
        stats=${adminStats}
        loadingPage=${loadingPage}
        onNavigate=${navigate}
      />
    `;
  } else if (route.name === 'admin-products') {
    pageContent = html`
      <${AdminProductsPage}
        user=${user}
        products=${adminProducts}
        loadingPage=${loadingPage}
        busyAction=${busyAction}
        onNavigate=${navigate}
        onDelete=${handleDeleteProduct}
      />
    `;
  } else if (route.name === 'admin-product-new') {
    pageContent = html`
      <${AdminProductFormPage}
        user=${user}
        initialProduct=${null}
        loadingPage=${loadingPage}
        busyAction=${busyAction}
        onSave=${handleSaveProduct}
        onUploadImage=${handleUploadImage}
        onNavigate=${navigate}
        isEditing=${false}
      />
    `;
  } else if (route.name === 'admin-product-edit') {
    pageContent = html`
      <${AdminProductFormPage}
        user=${user}
        initialProduct=${editingProduct}
        loadingPage=${loadingPage}
        busyAction=${busyAction}
        onSave=${handleSaveProduct}
        onUploadImage=${handleUploadImage}
        onNavigate=${navigate}
        isEditing=${true}
      />
    `;
  } else if (route.name === 'admin-orders') {
    pageContent = html`
      <${AdminOrdersPage}
        user=${user}
        orders=${adminOrders}
        loadingPage=${loadingPage}
        busyAction=${busyAction}
        onUpdateStatus=${handleUpdateOrderStatus}
        onNavigate=${navigate}
      />
    `;
  } else {
    pageContent = html`<${NotFoundPage} onNavigate=${navigate} />`;
  }

  return html`
    <div>
      <${Header} user=${user} onNavigate=${navigate} onLogout=${handleLogout} busyAction=${busyAction} />
      <main className="container">
        <${Notice} notice=${notice} onClose=${() => setNotice(null)} />
        ${pageContent}
      </main>
      <${Footer} onNavigate=${navigate} />
    </div>
  `;
}

root.render(html`<${App} />`);
