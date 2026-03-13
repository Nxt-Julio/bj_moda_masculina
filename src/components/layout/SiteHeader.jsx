import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import seal from '../../assets/bj-seal.svg';
import { useStore } from '../../context/StoreContext';

function SectionAnchor({ sectionId, children }) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleClick = (event) => {
    event.preventDefault();
    navigate({ pathname: '/', hash: `#${sectionId}` });

    if (location.pathname === '/') {
      window.requestAnimationFrame(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  };

  return (
    <a href={`/#${sectionId}`} onClick={handleClick}>
      {children}
    </a>
  );
}

function CatalogAnchor({ groupSlug, subgroupSlug = '', children }) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleClick = (event) => {
    event.preventDefault();

    const search = new URLSearchParams();
    if (groupSlug && groupSlug !== 'todos') search.set('grupo', groupSlug);
    if (subgroupSlug) search.set('subgrupo', subgroupSlug);

    navigate({ pathname: '/', search: search.toString() ? `?${search.toString()}` : '', hash: '#produtos' });

    if (location.pathname === '/') {
      window.requestAnimationFrame(() => {
        document.getElementById('produtos')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  };

  return (
    <a href="/#produtos" onClick={handleClick}>
      {children}
    </a>
  );
}

export function SiteHeader() {
  const navigate = useNavigate();
  const { currentUser, logout } = useStore();

  return (
    <header>
      <div className="announcement">Qualidade premium em gravatas e acessorios - Envio para todo o Brasil</div>

      <div className="site-header">
        <div className="container header-shell">
          <Link className="logo" to="/" aria-label="BJ Moda Social Masculina">
            <img className="logo-image" src={seal} alt="" />
            <span className="logo-text">Moda Social Masculina</span>
          </Link>

          <nav className="main-nav" aria-label="Menu principal">
            <CatalogAnchor groupSlug="gravata">Gravatas</CatalogAnchor>
            <CatalogAnchor groupSlug="gravata" subgroupSlug="kit">
              Kits
            </CatalogAnchor>
            <CatalogAnchor groupSlug="gravata" subgroupSlug="infantil">
              Infantil
            </CatalogAnchor>
            <CatalogAnchor groupSlug="acessorios" subgroupSlug="pressilha">
              Pressilhas
            </CatalogAnchor>
            <CatalogAnchor groupSlug="acessorios" subgroupSlug="abotoadura">
              Abotoaduras
            </CatalogAnchor>
          </nav>

          <div className="header-actions">
            <SectionAnchor sectionId="produtos">
              <span className="icon-btn" aria-label="Buscar produtos">
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M10.5 3a7.5 7.5 0 0 1 5.95 12.07l4.24 4.23a1 1 0 1 1-1.42 1.42l-4.23-4.24A7.5 7.5 0 1 1 10.5 3Zm0 2a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11Z" />
                </svg>
              </span>
            </SectionAnchor>
            <SectionAnchor sectionId="produtos">
              <span className="icon-btn" aria-label="Colecao">
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M8 20a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm9 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4ZM3 2a1 1 0 0 0 0 2h1.12l2.07 9.66A3 3 0 0 0 9.12 16H18a1 1 0 1 0 0-2H9.12a1 1 0 0 1-.98-.79L7.89 12h10.66a3 3 0 0 0 2.93-2.34l1.3-5.52A1 1 0 0 0 21.8 3H6.28L6.03 1.86A1 1 0 0 0 5.05 1H3Z" />
                </svg>
              </span>
            </SectionAnchor>

            {currentUser ? (
              <>
                <span className="welcome">Ola, {currentUser.name}</span>
                {currentUser.role === 'customer' ? (
                  <NavLink className="action-link" to="/pedidos">
                    Meus pedidos
                  </NavLink>
                ) : null}
                {currentUser.role === 'admin' ? (
                  <NavLink className="action-link" to="/admin">
                    Portal ADM
                  </NavLink>
                ) : null}
                <button
                  className="action-link"
                  type="button"
                  onClick={async () => {
                    await logout();
                    navigate('/');
                  }}
                >
                  Sair
                </button>
              </>
            ) : (
              <>
                <NavLink className="action-link" to="/login">
                  Login
                </NavLink>
                <NavLink className="action-link highlight" to="/cadastro">
                  Cadastro
                </NavLink>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
