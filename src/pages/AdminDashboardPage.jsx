import { useNavigate } from 'react-router-dom';
import { StatsGrid } from '../components/admin/StatsGrid';
import { GateCard } from '../components/shared/GateCard';
import { useStore } from '../context/StoreContext';

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const { currentUser, adminStats } = useStore();

  if (!currentUser) {
    return (
      <GateCard
        title="Login necessario"
        text="Entre com a conta de administrador para acessar o painel."
        actionLabel="Ir para login"
        onAction={() => navigate('/login')}
      />
    );
  }

  if (currentUser.role !== 'admin') {
    return (
      <GateCard
        title="Acesso restrito"
        text="Esta area e exclusiva para administradores."
        actionLabel="Voltar para a home"
        onAction={() => navigate('/')}
      />
    );
  }

  return (
    <section>
      <div className="page-head">
        <h1>Portal do Administrador</h1>
        <p className="small">Painel React/Vite com dados persistidos em localStorage.</p>
      </div>

      <StatsGrid stats={adminStats} />

      <div className="panel">
        <h2>Acoes rapidas</h2>
        <div className="admin-actions">
          <button className="btn" type="button" onClick={() => navigate('/admin/produtos')}>
            Gerenciar produtos
          </button>
          <button className="btn secondary" type="button" onClick={() => navigate('/admin/pedidos')}>
            Gerenciar pedidos
          </button>
        </div>
      </div>
    </section>
  );
}
