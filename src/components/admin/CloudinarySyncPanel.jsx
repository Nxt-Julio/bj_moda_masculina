import { useState } from 'react';

export function CloudinarySyncPanel({ onSync }) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [summary, setSummary] = useState(null);

  const handleSync = async () => {
    setIsSyncing(true);

    try {
      const result = await onSync();
      setSummary(result);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <section className="panel">
      <div className="page-head">
        <h2>Cloudinary</h2>
        <p className="small">Busca todas as imagens da conta e cria produtos no Firestore sem duplicar os itens ja importados.</p>
      </div>

      <div className="form-actions">
        <button type="button" onClick={handleSync} disabled={isSyncing}>
          {isSyncing ? 'Buscando imagens...' : 'Buscar imagens no Cloudinary'}
        </button>
      </div>

      {summary ? (
        <div className="sync-summary">
          <p className="small">
            Encontradas: <strong>{summary.found}</strong> | Criadas: <strong>{summary.created}</strong> | Ja existiam:{' '}
            <strong>{summary.skipped}</strong> | Erros: <strong>{summary.errors}</strong>
          </p>
        </div>
      ) : null}
    </section>
  );
}
