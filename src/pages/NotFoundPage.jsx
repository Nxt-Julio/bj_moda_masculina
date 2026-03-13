import { useNavigate } from 'react-router-dom';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <section className="card empty-card">
      <h1>Pagina nao encontrada</h1>
      <p>O endereco solicitado nao existe.</p>
      <button className="btn" type="button" onClick={() => navigate('/')}>
        Voltar para a pagina inicial
      </button>
    </section>
  );
}
