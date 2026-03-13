import { Outlet } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import { FlashBanner } from './FlashBanner';
import { SiteFooter } from './SiteFooter';
import { SiteHeader } from './SiteHeader';

export function SiteLayout() {
  const { isBootstrapping } = useStore();

  return (
    <>
      <SiteHeader />
      <main className="container">
        <FlashBanner />
        {isBootstrapping ? (
          <section className="card empty-card">
            <h1>Conectando com o Firebase</h1>
            <p className="small">Carregando produtos, usuarios e pedidos em tempo real.</p>
          </section>
        ) : (
          <Outlet />
        )}
      </main>
      <SiteFooter />
    </>
  );
}
