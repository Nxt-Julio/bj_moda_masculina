import { Link } from 'react-router-dom';

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <h3 className="footer-brand">BJ - Moda Social Masculina</h3>
          <p>Gravatas e acessorios para homens que valorizam estilo, alfaiataria e sofisticacao.</p>
        </div>

        <div>
          <h4>Links Rapidos</h4>
          <Link to="/#gravatas">Gravatas</Link>
          <Link to="/#kits-especiais">Kits Especiais</Link>
          <Link to="/#beneficios">Beneficios</Link>
          <Link to="/login">Minha Conta</Link>
        </div>

        <div>
          <h4>Redes Sociais</h4>
          <a href="https://www.instagram.com" target="_blank" rel="noreferrer">
            Instagram
          </a>
          <a href="https://www.facebook.com" target="_blank" rel="noreferrer">
            Facebook
          </a>
          <a href="https://www.whatsapp.com" target="_blank" rel="noreferrer">
            WhatsApp
          </a>
        </div>

        <div>
          <h4>Contato</h4>
          <p>contato@bjmodasocial.com.br</p>
          <p>(11) 90000-0000</p>
          <a href="mailto:contato@bjmodasocial.com.br">Politica de Privacidade</a>
        </div>
      </div>

      <div className="container footer-bottom">
        <small>&copy; {new Date().getFullYear()} BJ - Moda Social Masculina. Todos os direitos reservados.</small>
      </div>
    </footer>
  );
}
