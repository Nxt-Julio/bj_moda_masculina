import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { BrandStory } from '../components/home/BrandStory';
import { CategoryGrid } from '../components/home/CategoryGrid';
import { HeroSection } from '../components/home/HeroSection';
import { ProductGrid } from '../components/home/ProductGrid';
import { useStore } from '../context/StoreContext';

export function HomePage() {
  const location = useLocation();
  const { activeProducts } = useStore();

  useEffect(() => {
    if (!location.hash) return;

    const targetId = location.hash.replace('#', '');
    window.requestAnimationFrame(() => {
      document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [location.hash]);

  return (
    <div className="page-stack">
      <HeroSection />
      <CategoryGrid />
      <ProductGrid products={activeProducts} />
      <BrandStory />
    </div>
  );
}
