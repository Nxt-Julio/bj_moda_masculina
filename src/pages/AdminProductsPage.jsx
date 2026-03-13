import { useNavigate } from 'react-router-dom';
import { BulkImporter } from '../components/admin/BulkImporter';
import { CloudinarySyncPanel } from '../components/admin/CloudinarySyncPanel';
import { ProductsTable } from '../components/admin/ProductsTable';
import { GateCard } from '../components/shared/GateCard';
import { useStore } from '../context/StoreContext';

export function AdminProductsPage() {
  const navigate = useNavigate();
  const { currentUser, products, deleteProduct, importProductsBatch, syncCloudinaryProducts, pushNotice } = useStore();

  if (!currentUser) {
    return (
      <GateCard
        title="Login necessario"
        text="Entre com a conta de administrador para gerenciar os produtos."
        actionLabel="Ir para login"
        onAction={() => navigate('/login')}
      />
    );
  }

  if (currentUser.role !== 'admin') {
    return (
      <GateCard
        title="Acesso restrito"
        text="Somente administradores podem alterar o catalogo."
        actionLabel="Voltar para a home"
        onAction={() => navigate('/')}
      />
    );
  }

  const handleDelete = async (productId) => {
    if (!window.confirm('Excluir produto?')) return;
    try {
      await deleteProduct(productId);
    } catch (error) {
      pushNotice('error', error.message);
    }
  };

  const handleImport = async (items) => {
    try {
      await importProductsBatch(items);
    } catch (error) {
      pushNotice('error', error.message);
      throw error;
    }
  };

  const handleCloudinarySync = async () => {
    try {
      return await syncCloudinaryProducts();
    } catch (error) {
      pushNotice('error', error.message);
      throw error;
    }
  };

  return (
    <section>
      <div className="page-head page-head-inline">
        <div>
          <h1>Produtos</h1>
          <p className="small">Gerencie o catalogo, importe lotes manuais e sincronize imagens direto do Cloudinary.</p>
        </div>
        <button className="btn" type="button" onClick={() => navigate('/admin/produtos/novo')}>
          Novo produto
        </button>
      </div>

      <ProductsTable
        products={products}
        onEdit={(productId) => navigate(`/admin/produtos/${productId}/editar`)}
        onDelete={handleDelete}
      />

      <div className="admin-importer">
        <CloudinarySyncPanel onSync={handleCloudinarySync} />
      </div>

      <div className="admin-importer">
        <BulkImporter onImport={handleImport} />
      </div>
    </section>
  );
}
