import { useNavigate } from 'react-router-dom';
import { GateCard } from '../components/shared/GateCard';
import { StatusPill } from '../components/shared/StatusPill';
import { useStore } from '../context/StoreContext';
import { formatCurrency, formatDate } from '../utils/formatters';

export function OrdersPage() {
  const navigate = useNavigate();
  const { currentUser, customerOrders } = useStore();

  if (!currentUser) {
    return (
      <GateCard
        title="Login necessario"
        text="Entre na sua conta para visualizar os pedidos."
        actionLabel="Ir para login"
        onAction={() => navigate('/login')}
      />
    );
  }

  if (currentUser.role !== 'customer') {
    return (
      <GateCard
        title="Area exclusiva para clientes"
        text="Administradores acompanham operacoes pelo portal administrativo."
        actionLabel="Abrir portal ADM"
        onAction={() => navigate('/admin')}
      />
    );
  }

  return (
    <section>
      <div className="page-head">
        <h1>Meus pedidos</h1>
        <p className="small">Historico de pedidos salvo localmente no navegador para demonstracao.</p>
      </div>

      {customerOrders.length === 0 ? (
        <div className="card">
          <p>Voce ainda nao fez pedidos.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Data</th>
                <th>Status</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {customerOrders.map((order) => (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td>{formatDate(order.createdAt)}</td>
                  <td>
                    <StatusPill status={order.status} />
                  </td>
                  <td>{formatCurrency(order.totalCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
