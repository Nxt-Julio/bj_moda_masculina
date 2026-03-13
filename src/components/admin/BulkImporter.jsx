import { useMemo, useState } from 'react';
import { parseProductsBulkInput } from '../../utils/bulkImport';
import { formatCurrency } from '../../utils/formatters';

const exampleText = `Gravata Azul | https://res.cloudinary.com/.../gravata-azul.jpg | 89,90 | 10 | Gravata social azul em cetim | sim
Kit Executivo | https://res.cloudinary.com/.../kit-executivo.jpg | 199,90 | 5 | Kit com gravata, lenco e prendedor | sim`;

export function BulkImporter({ onImport }) {
  const [text, setText] = useState(exampleText);
  const [isImporting, setIsImporting] = useState(false);

  const { preview, error } = useMemo(() => {
    try {
      return {
        preview: parseProductsBulkInput(text),
        error: '',
      };
    } catch (parseError) {
      return {
        preview: [],
        error: text.trim() ? parseError.message : '',
      };
    }
  }, [text]);

  const handleImport = async () => {
    const products = parseProductsBulkInput(text);
    setIsImporting(true);

    try {
      await onImport(products);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <section className="panel">
      <div className="page-head">
        <h2>Importador em lote</h2>
        <p className="small">Cole uma linha por produto no formato: nome | url | preco | estoque | descricao | ativo</p>
      </div>

      <label htmlFor="bulk-products">Produtos em lote</label>
      <textarea
        id="bulk-products"
        className="bulk-textarea"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder={exampleText}
      />

      {error ? <p className="small bulk-error">{error}</p> : null}

      <div className="form-actions">
        <button type="button" onClick={handleImport} disabled={isImporting || !preview.length}>
          {isImporting ? 'Importando...' : `Importar ${preview.length} produto(s)`}
        </button>
        <button className="btn secondary" type="button" onClick={() => setText(exampleText)}>
          Restaurar exemplo
        </button>
        <button className="btn secondary" type="button" onClick={() => setText('')}>
          Limpar
        </button>
      </div>

      {preview.length ? (
        <div className="bulk-preview">
          <h3>Preview</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Preco</th>
                  <th>Estoque</th>
                  <th>Ativo</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((product, index) => (
                  <tr key={`${product.name}-${index}`}>
                    <td>{product.name}</td>
                    <td>{formatCurrency(product.priceCents)}</td>
                    <td>{product.stock}</td>
                    <td>{product.active ? 'Sim' : 'Nao'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </section>
  );
}
