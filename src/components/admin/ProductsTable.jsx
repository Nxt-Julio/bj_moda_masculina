import { formatCurrency } from '../../utils/formatters';

export function ProductsTable({ products, onEdit, onDelete }) {
  if (!products.length) {
    return (
      <div className="card">
        <p>Nenhum produto cadastrado.</p>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nome</th>
            <th>Grupo</th>
            <th>Subgrupo</th>
            <th>Preco</th>
            <th>Estoque</th>
            <th>Ativo</th>
            <th>Acoes</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <td>{product.id}</td>
              <td>{product.name}</td>
              <td>{product.groupName || '-'}</td>
              <td>{product.subgroupName || '-'}</td>
              <td>{formatCurrency(product.priceCents)}</td>
              <td>{product.stock}</td>
              <td>{product.active ? 'Sim' : 'Nao'}</td>
              <td>
                <div className="table-actions">
                  <button className="btn secondary" type="button" onClick={() => onEdit(product.id)}>
                    Editar
                  </button>
                  <button className="danger" type="button" onClick={() => onDelete(product.id)}>
                    Excluir
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
