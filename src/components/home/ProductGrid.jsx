import { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { fallbackProductImage } from '../../data/siteContent';
import { formatCurrency } from '../../utils/formatters';
import { SectionHeader } from '../shared/SectionHeader';

function ProductCard({ product }) {
  const [quantity, setQuantity] = useState(1);
  const { currentUser, createOrder, pushNotice } = useStore();

  const handlePurchase = async () => {
    try {
      await createOrder(product.id, quantity);
    } catch (error) {
      pushNotice('error', error.message);
    }
  };

  return (
    <article className="product-card">
      <img src={product.imageUrl || fallbackProductImage} alt={product.name} />
      <div className="product-content">
        <div className="product-meta">
          {product.groupName ? <span className="product-chip">{product.groupName}</span> : null}
          {product.subgroupName ? <span className="product-chip">{product.subgroupName}</span> : null}
        </div>
        <h3>{product.name}</h3>
        <p className="small">{product.description || 'Acabamento refinado para ocasioes especiais.'}</p>
        <p className="price">{formatCurrency(product.priceCents)}</p>
        <p className="stock">
          Estoque: <strong>{product.stock}</strong>
        </p>

        {currentUser?.role === 'customer' ? (
          product.stock > 0 ? (
            <div className="inline">
              <input
                type="number"
                min="1"
                max={product.stock}
                value={quantity}
                onChange={(event) => setQuantity(Number(event.target.value) || 1)}
              />
              <button type="button" onClick={handlePurchase}>
                Comprar
              </button>
            </div>
          ) : (
            <p className="small">Sem estoque no momento.</p>
          )
        ) : (
          <p className="support-note">Entre como cliente para comprar.</p>
        )}
      </div>
    </article>
  );
}

export function ProductGrid({ products, kicker = 'Curadoria Premium', title = 'Produtos em Destaque', description = '', isLoading = false }) {
  return (
    <div>
      {title ? <SectionHeader kicker={kicker} title={title} /> : null}
      {description ? <p className="small">{description}</p> : null}

      {isLoading ? (
        <div className="card empty-card">
          <p>Carregando produtos...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="card empty-card">
          <p>Nenhum produto disponivel no momento.</p>
        </div>
      ) : (
        <div className="product-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
