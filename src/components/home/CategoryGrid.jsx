import { Link } from 'react-router-dom';
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
              <Link
                className="btn secondary"
                to={{
                  pathname: '/',
                  search: `?${new URLSearchParams(
                    Object.entries({
                      grupo: category.groupSlug || '',
                      subgrupo: category.subgroupSlug || '',
                    }).filter(([, value]) => value)
                  ).toString()}`,
                  hash: '#produtos',
                }}
              >
                Explorar
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
