import { formatCurrency, formatDate } from '../../utils/formatters';
import { StatusPill } from '../shared/StatusPill';

export function OrdersTable({ orders, onChangeStatus }) {
  if (!orders.length) {
    return (
      <div className="card">
        <p>Nenhum pedido realizado ainda.</p>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Cliente</th>
            <th>E-mail</th>
            <th>Total</th>
            <th>Status</th>
            <th>Data</th>
            <th>Atualizar</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td>{order.id}</td>
              <td>{order.customerName}</td>
              <td>{order.customerEmail}</td>
              <td>{formatCurrency(order.totalCents)}</td>
              <td>
                <StatusPill status={order.status} />
              </td>
              <td>{formatDate(order.createdAt)}</td>
              <td>
                <div className="inline">
                  <select value={order.status} onChange={(event) => onChangeStatus(order.id, event.target.value)}>
                    <option value="novo">novo</option>
                    <option value="pago">pago</option>
                    <option value="enviado">enviado</option>
                    <option value="cancelado">cancelado</option>
                  </select>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
