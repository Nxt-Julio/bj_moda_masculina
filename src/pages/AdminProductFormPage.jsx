import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ProductEditorForm } from '../components/admin/ProductEditorForm';
import { GateCard } from '../components/shared/GateCard';
import { useStore } from '../context/StoreContext';

export function AdminProductFormPage() {
  const navigate = useNavigate();
  const params = useParams();
  const { currentUser, products, saveProduct, pushNotice } = useStore();
  const productId = params.productId || null;

  const initialProduct = useMemo(
    () => (productId ? products.find((product) => product.id === productId) || null : null),
    [productId, products]
  );

  if (!currentUser) {
    return (
      <GateCard
        title="Login necessario"
        text="Entre com a conta de administrador para editar o catalogo."
        actionLabel="Ir para login"
        onAction={() => navigate('/login')}
      />
    );
  }

  if (currentUser.role !== 'admin') {
    return (
      <GateCard
        title="Acesso restrito"
        text="Somente administradores podem gerenciar produtos."
        actionLabel="Voltar para a home"
        onAction={() => navigate('/')}
      />
    );
  }

  if (productId && !initialProduct) {
    return (
      <GateCard
        title="Produto nao encontrado"
        text="O item solicitado nao existe mais no catalogo."
        actionLabel="Voltar para produtos"
        onAction={() => navigate('/admin/produtos')}
      />
    );
  }

  const handleSubmit = async (form) => {
    try {
      await saveProduct(form, productId);
      navigate('/admin/produtos');
    } catch (error) {
      pushNotice('error', error.message);
    }
  };

  return <ProductEditorForm initialProduct={initialProduct} onSubmit={handleSubmit} onCancel={() => navigate('/admin/produtos')} />;
}
