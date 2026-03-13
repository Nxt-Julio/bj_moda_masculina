import { formatCurrency } from '../../utils/formatters';

export function StatsGrid({ stats }) {
  return (
    <div className="stats">
      <div className="stat">
        <h3>{stats.products}</h3>
        <p className="small">Produtos cadastrados</p>
      </div>
      <div className="stat">
        <h3>{stats.customers}</h3>
        <p className="small">Clientes</p>
      </div>
      <div className="stat">
        <h3>{stats.orders}</h3>
        <p className="small">Pedidos</p>
      </div>
      <div className="stat">
        <h3>{formatCurrency(stats.revenueCents)}</h3>
        <p className="small">Faturamento (sem cancelados)</p>
      </div>
    </div>
  );
}
