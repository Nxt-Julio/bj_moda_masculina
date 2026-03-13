import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { SiteLayout } from './components/layout/SiteLayout';
import { StoreProvider } from './context/StoreContext';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminOrdersPage } from './pages/AdminOrdersPage';
import { AdminProductFormPage } from './pages/AdminProductFormPage';
import { AdminProductsPage } from './pages/AdminProductsPage';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { OrdersPage } from './pages/OrdersPage';
import { RegisterPage } from './pages/RegisterPage';

function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<SiteLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/cadastro" element={<RegisterPage />} />
            <Route path="/pedidos" element={<OrdersPage />} />
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/produtos" element={<AdminProductsPage />} />
            <Route path="/admin/produtos/novo" element={<AdminProductFormPage />} />
            <Route path="/admin/produtos/:productId/editar" element={<AdminProductFormPage />} />
            <Route path="/admin/pedidos" element={<AdminOrdersPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </StoreProvider>
  );
}

export default App;
