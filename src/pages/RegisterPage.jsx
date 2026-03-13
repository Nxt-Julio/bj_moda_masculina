import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';

export function RegisterPage() {
  const navigate = useNavigate();
  const { currentUser, register, pushNotice } = useStore();
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  if (currentUser) {
    return (
      <section className="card empty-card">
        <h1>Cadastro indisponivel</h1>
        <p className="small">Sua sessao ja esta ativa.</p>
        <button className="btn" type="button" onClick={() => navigate('/')}>
          Voltar para a home
        </button>
      </section>
    );
  }

  const handleSubmit = (event) => {
    event.preventDefault();

    try {
      register(form);
      navigate('/');
    } catch (error) {
      pushNotice('error', error.message);
    }
  };

  return (
    <section className="auth-card">
      <h1>Cadastro de cliente</h1>
      <p className="small">Fluxo local em React/Vite, ideal para deploy estatico na Vercel.</p>

      <form onSubmit={handleSubmit}>
        <label htmlFor="register-name">Nome</label>
        <input
          id="register-name"
          type="text"
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          required
        />

        <label htmlFor="register-email">E-mail</label>
        <input
          id="register-email"
          type="email"
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
          required
        />

        <label htmlFor="register-password">Senha (minimo 6 caracteres)</label>
        <input
          id="register-password"
          type="password"
          minLength="6"
          value={form.password}
          onChange={(event) => setForm({ ...form, password: event.target.value })}
          required
        />

        <button type="submit">Criar conta</button>
      </form>
    </section>
  );
}
