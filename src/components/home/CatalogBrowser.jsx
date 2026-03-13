import { allCatalogOption, catalogGroups, getCatalogGroup, getSubgroupsForGroup } from '../../data/catalogTaxonomy';
import { ProductGrid } from './ProductGrid';

function FilterChip({ isActive, onClick, children }) {
  return (
    <button className={`filter-chip${isActive ? ' active' : ''}`} type="button" onClick={onClick}>
      {children}
    </button>
  );
}

export function CatalogBrowser({ selectedGroupSlug, selectedSubgroupSlug, products, isLoading, onSelectGroup, onSelectSubgroup }) {
  const selectedGroup = getCatalogGroup(selectedGroupSlug);
  const subgroupOptions = selectedGroup
    ? [{ slug: '', label: selectedGroup.allLabel }, ...getSubgroupsForGroup(selectedGroup.slug)]
    : [];

  const title = selectedGroup ? selectedGroup.pluralLabel : 'Colecao completa';
  const description = selectedGroup
    ? selectedSubgroupSlug
      ? `Exibindo itens de ${selectedGroup.label.toLowerCase()} na subcategoria selecionada.`
      : `Exibindo ${selectedGroup.allLabel.toLowerCase()}.`
    : 'Exibindo todos os produtos disponiveis no catalogo.';

  return (
    <section className="section-block" id="produtos">
      <div className="catalog-shell">
        <div className="page-head">
          <p className="small section-kicker">Colecao Organizada</p>
          <h2>{title}</h2>
          <p className="small">{description}</p>
        </div>

        <div className="catalog-filters">
          <div className="catalog-filter-row">
            <FilterChip isActive={!selectedGroup} onClick={() => onSelectGroup(allCatalogOption.slug)}>
              {allCatalogOption.label}
            </FilterChip>

            {catalogGroups.map((group) => (
              <FilterChip key={group.slug} isActive={selectedGroupSlug === group.slug} onClick={() => onSelectGroup(group.slug)}>
                {group.pluralLabel}
              </FilterChip>
            ))}
          </div>

          {selectedGroup ? (
            <div className="catalog-filter-row">
              {subgroupOptions.map((subgroup) => (
                <FilterChip
                  key={`${selectedGroup.slug}-${subgroup.slug || 'all'}`}
                  isActive={(selectedSubgroupSlug || '') === subgroup.slug}
                  onClick={() => onSelectSubgroup(selectedGroup.slug, subgroup.slug)}
                >
                  {subgroup.label}
                </FilterChip>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <ProductGrid products={products} isLoading={isLoading} title="" kicker="" description="" />
    </section>
  );
}
