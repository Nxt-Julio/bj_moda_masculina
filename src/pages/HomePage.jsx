import { useEffect, useMemo, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { BrandStory } from '../components/home/BrandStory';
import { CatalogBrowser } from '../components/home/CatalogBrowser';
import { CategoryGrid } from '../components/home/CategoryGrid';
import { HeroSection } from '../components/home/HeroSection';
import { getCatalogGroup, getCatalogSubgroup } from '../data/catalogTaxonomy';
import { useStore } from '../context/StoreContext';

export function HomePage() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { fetchCatalogProducts, pushNotice } = useStore();
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [isCatalogLoading, setIsCatalogLoading] = useState(true);

  const selectedGroupSlug = useMemo(() => {
    const groupSlug = searchParams.get('grupo') || 'todos';
    return groupSlug === 'todos' || getCatalogGroup(groupSlug) ? groupSlug : 'todos';
  }, [searchParams]);

  const selectedSubgroupSlug = useMemo(() => {
    if (selectedGroupSlug === 'todos') return '';

    const subgroupSlug = searchParams.get('subgrupo') || '';
    return getCatalogSubgroup(selectedGroupSlug, subgroupSlug) ? subgroupSlug : '';
  }, [searchParams, selectedGroupSlug]);

  useEffect(() => {
    if (!location.hash) return;

    const targetId = location.hash.replace('#', '');
    window.requestAnimationFrame(() => {
      document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [location.hash]);

  useEffect(() => {
    let isMounted = true;
    setIsCatalogLoading(true);

    fetchCatalogProducts({
      groupSlug: selectedGroupSlug,
      subgroupSlug: selectedSubgroupSlug,
    })
      .then((items) => {
        if (isMounted) {
          setCatalogProducts(items);
        }
      })
      .catch((error) => {
        if (isMounted) {
          pushNotice('error', error.message || 'Falha ao carregar o catalogo.');
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsCatalogLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedGroupSlug, selectedSubgroupSlug]);

  const handleGroupChange = (groupSlug) => {
    const nextParams = new URLSearchParams(searchParams);

    if (!groupSlug || groupSlug === 'todos') {
      nextParams.set('grupo', 'todos');
      nextParams.delete('subgrupo');
    } else {
      nextParams.set('grupo', groupSlug);
      nextParams.delete('subgrupo');
    }

    setSearchParams(nextParams);
  };

  const handleSubgroupChange = (groupSlug, subgroupSlug) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('grupo', groupSlug);

    if (subgroupSlug) {
      nextParams.set('subgrupo', subgroupSlug);
    } else {
      nextParams.delete('subgrupo');
    }

    setSearchParams(nextParams);
  };

  return (
    <div className="page-stack">
      <HeroSection />
      <CategoryGrid />
      <CatalogBrowser
        selectedGroupSlug={selectedGroupSlug === 'todos' ? '' : selectedGroupSlug}
        selectedSubgroupSlug={selectedSubgroupSlug}
        products={catalogProducts}
        isLoading={isCatalogLoading}
        onSelectGroup={handleGroupChange}
        onSelectSubgroup={handleSubgroupChange}
      />
      <BrandStory />
    </div>
  );
}
