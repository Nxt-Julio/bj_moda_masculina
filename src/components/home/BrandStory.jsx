import { benefits } from '../../data/siteContent';
import { SectionHeader } from '../shared/SectionHeader';

export function BrandStory() {
  return (
    <>
      <section className="section-block about-block" id="sobre">
        <SectionHeader kicker="Nossa Marca" title="Sobre a BJ" />
        <p className="about-text">
          A BJ Moda Social Masculina nasceu para elevar o estilo do homem moderno. Cada gravata e acessorio e escolhido
          para transmitir elegancia, personalidade e sofisticacao em qualquer ocasiao.
        </p>
      </section>

      <section className="section-block kit-block" id="kits-especiais">
        <SectionHeader kicker="Combinacoes Exclusivas" title="Kits Especiais" />

        <div className="kit-highlight">
          <div>
            <h3>Kit Assinatura Premium</h3>
            <p>Combine gravata, abotoadura e prendedor com curadoria sofisticada para eventos e ocasioes formais.</p>
            <a className="btn" href="#produtos">
              Montar meu kit
            </a>
          </div>

          <ul>
            <li>Gravata de seda com acabamento premium</li>
            <li>Abotoaduras com detalhe metalico elegante</li>
            <li>Prendedor em aco escovado</li>
          </ul>
        </div>
      </section>

      <section className="section-block" id="beneficios">
        <SectionHeader kicker="Diferenciais BJ" title="Beneficios" />

        <div className="benefit-grid">
          {benefits.map((benefit) => (
            <article className="benefit-item" key={benefit}>
              &#10003; {benefit}
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
