import { Outlet } from 'react-router-dom';
import { FlashBanner } from './FlashBanner';
import { SiteFooter } from './SiteFooter';
import { SiteHeader } from './SiteHeader';

export function SiteLayout() {
  return (
    <>
      <SiteHeader />
      <main className="container">
        <FlashBanner />
        <Outlet />
      </main>
      <SiteFooter />
    </>
  );
}
