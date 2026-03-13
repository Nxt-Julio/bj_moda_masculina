export const allCatalogOption = {
  slug: 'todos',
  label: 'Todos os produtos',
};

export const catalogGroups = [
  {
    slug: 'gravata',
    label: 'Gravata',
    pluralLabel: 'Gravatas',
    allLabel: 'Todas as gravatas',
    heroImage: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=900&q=80',
    subgroups: [
      { slug: 'trabalhada', label: 'Trabalhada' },
      { slug: 'lisa', label: 'Lisa' },
      { slug: 'borboleta', label: 'Borboleta' },
      { slug: 'infantil', label: 'Infantil' },
      { slug: 'kit', label: 'Kit' },
      { slug: 'trabalhada-com-lenco', label: 'Trabalhada com lenco' },
      { slug: 'lisa-com-lenco', label: 'Lisa com lenco' },
    ],
  },
  {
    slug: 'acessorios',
    label: 'Acessorios',
    pluralLabel: 'Acessorios',
    allLabel: 'Todos os acessorios',
    heroImage: 'https://images.unsplash.com/photo-1570021977627-0f1dd6b0f0f0?auto=format&fit=crop&w=900&q=80',
    subgroups: [
      { slug: 'pressilha', label: 'Pressilha' },
      { slug: 'abotoadura', label: 'Abotoadura' },
    ],
  },
];

const textNormalizer = new Intl.Collator('pt-BR', { sensitivity: 'base', usage: 'search' });

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function getCatalogGroup(groupSlug) {
  return catalogGroups.find((group) => group.slug === groupSlug) || null;
}

export function getCatalogSubgroup(groupSlug, subgroupSlug) {
  const group = getCatalogGroup(groupSlug);
  if (!group) return null;
  return group.subgroups.find((subgroup) => subgroup.slug === subgroupSlug) || null;
}

export function getSubgroupsForGroup(groupSlug) {
  return getCatalogGroup(groupSlug)?.subgroups || [];
}

function matchAny(text, patterns) {
  return patterns.some((pattern) => text.includes(pattern));
}

export function inferProductTaxonomy(text) {
  const normalized = normalizeText(text);

  if (!normalized) {
    return {
      groupSlug: '',
      groupName: '',
      subgroupSlug: '',
      subgroupName: '',
    };
  }

  if (matchAny(normalized, ['abotoadura', 'abotoaduras', 'cufflink', 'cufflinks'])) {
    return buildTaxonomyFields({ groupSlug: 'acessorios', subgroupSlug: 'abotoadura' });
  }

  if (matchAny(normalized, ['pressilha', 'presilha', 'prendedor', 'clip'])) {
    return buildTaxonomyFields({ groupSlug: 'acessorios', subgroupSlug: 'pressilha' });
  }

  if (matchAny(normalized, ['borboleta', 'bow tie', 'bowtie'])) {
    return buildTaxonomyFields({ groupSlug: 'gravata', subgroupSlug: 'borboleta' });
  }

  if (normalized.includes('infantil')) {
    return buildTaxonomyFields({ groupSlug: 'gravata', subgroupSlug: 'infantil' });
  }

  if (normalized.includes('kit')) {
    return buildTaxonomyFields({ groupSlug: 'gravata', subgroupSlug: 'kit' });
  }

  if (matchAny(normalized, ['lenco', 'lenço']) && matchAny(normalized, ['trabalhada', 'trabalhado', 'jacquard', 'texturizada'])) {
    return buildTaxonomyFields({ groupSlug: 'gravata', subgroupSlug: 'trabalhada-com-lenco' });
  }

  if (matchAny(normalized, ['lenco', 'lenço']) && matchAny(normalized, ['lisa', 'plain'])) {
    return buildTaxonomyFields({ groupSlug: 'gravata', subgroupSlug: 'lisa-com-lenco' });
  }

  if (matchAny(normalized, ['trabalhada', 'trabalhado', 'jacquard', 'texturizada', 'estampada'])) {
    return buildTaxonomyFields({ groupSlug: 'gravata', subgroupSlug: 'trabalhada' });
  }

  if (matchAny(normalized, ['gravata', 'tie', 'lisa', 'plain'])) {
    return buildTaxonomyFields({ groupSlug: 'gravata', subgroupSlug: 'lisa' });
  }

  return {
    groupSlug: '',
    groupName: '',
    subgroupSlug: '',
    subgroupName: '',
  };
}

export function buildTaxonomyFields({ groupSlug, subgroupSlug, fallbackText = '' } = {}) {
  const group = getCatalogGroup(groupSlug);
  const subgroup = getCatalogSubgroup(groupSlug, subgroupSlug);

  if (group && subgroup) {
    return {
      groupSlug: group.slug,
      groupName: group.label,
      subgroupSlug: subgroup.slug,
      subgroupName: subgroup.label,
      grupoSlug: group.slug,
      grupoNome: group.label,
      subgrupoSlug: subgroup.slug,
      subgrupoNome: subgroup.label,
    };
  }

  if (fallbackText) {
    const inferred = inferProductTaxonomy(fallbackText);
    if (inferred.groupSlug && inferred.subgroupSlug) {
      return {
        ...inferred,
        grupoSlug: inferred.groupSlug,
        grupoNome: inferred.groupName,
        subgrupoSlug: inferred.subgroupSlug,
        subgrupoNome: inferred.subgroupName,
      };
    }
  }

  return {
    groupSlug: '',
    groupName: '',
    subgroupSlug: '',
    subgroupName: '',
    grupoSlug: '',
    grupoNome: '',
    subgrupoSlug: '',
    subgrupoNome: '',
  };
}

export function hasStoredTaxonomy(product) {
  return Boolean(product?.groupSlug && product?.subgroupSlug);
}

export function compareCatalogProducts(a, b) {
  return String(b.createdAt || '').localeCompare(String(a.createdAt || ''), 'pt-BR');
}

export function isSameLabel(a, b) {
  return textNormalizer.compare(String(a || ''), String(b || '')) === 0;
}
