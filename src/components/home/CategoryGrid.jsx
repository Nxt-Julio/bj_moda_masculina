import { categories } from '../../data/siteContent';
import { SectionHeader } from '../shared/SectionHeader';

export function CategoryGrid() {
  return (
    <section className="section-block" id="categorias">
      <SectionHeader kicker="Selecao Curada" title="Categorias" />

      <div className="category-grid">
        {categories.map((category) => (
          <article className="category-card" id={category.id} key={category.id}>
            <img src={category.image} alt={category.title} />
            <div className="category-content">
              <h3>{category.title}</h3>
              <a className="btn secondary" href={`#${category.target}`}>
                Explorar
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
