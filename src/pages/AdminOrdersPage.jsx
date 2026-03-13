import { useNavigate } from 'react-router-dom';
import { OrdersTable } from '../components/admin/OrdersTable';
import { GateCard } from '../components/shared/GateCard';
import { useStore } from '../context/StoreContext';

export function AdminOrdersPage() {
  const navigate = useNavigate();
  const { currentUser, adminOrders, updateOrderStatus, pushNotice } = useStore();

  if (!currentUser) {
    return (
      <GateCard
        title="Login necessario"
        text="Entre com a conta de administrador para acompanhar os pedidos."
        actionLabel="Ir para login"
        onAction={() => navigate('/login')}
      />
    );
  }

  if (currentUser.role !== 'admin') {
    return (
      <GateCard
        title="Acesso restrito"
        text="Somente administradores podem alterar os status dos pedidos."
        actionLabel="Voltar para a home"
        onAction={() => navigate('/')}
      />
    );
  }

  const handleChangeStatus = async (orderId, status) => {
    try {
      await updateOrderStatus(orderId, status);
    } catch (error) {
      pushNotice('error', error.message);
    }
  };

  return (
    <section>
      <div className="page-head">
        <h1>Pedidos</h1>
        <p className="small">Controle de status direto no navegador, sem dependencias de servidor.</p>
      </div>

      <OrdersTable orders={adminOrders} onChangeStatus={handleChangeStatus} />
    </section>
  );
}
