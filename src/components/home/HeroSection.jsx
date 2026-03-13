import { Link } from 'react-router-dom';
import seal from '../../assets/bj-seal.svg';
import { heroImage } from '../../data/siteContent';

export function HeroSection() {
  return (
    <section className="hero" id="topo">
      <div className="hero-media">
        <img src={heroImage} alt="Interior da loja BJ com gravatas e acessorios sociais masculinos" />
      </div>

      <div className="hero-content">
        <div className="hero-badge">
          <img src={seal} alt="" />
          <span>Curadoria premium</span>
        </div>
        <p className="hero-kicker">Colecao Premium</p>
        <h1>Elegancia em cada detalhe para o homem moderno.</h1>
        <p>Gravatas, kits e acessorios para homens que valorizam estilo, sofisticacao e presenca.</p>
        <div className="hero-actions">
          <Link className="btn" to="/?grupo=gravata#produtos">
            Ver colecao
          </Link>
          <Link className="btn secondary" to="/?grupo=gravata&subgrupo=kit#produtos">
            Explorar kits
          </Link>
        </div>
      </div>
    </section>
  );
}
