import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';

export function LoginPage() {
  const navigate = useNavigate();
  const { currentUser, login, pushNotice } = useStore();
  const [form, setForm] = useState({ email: '', password: '' });

  if (currentUser) {
    return (
      <section className="card empty-card">
        <h1>Voce ja esta logado</h1>
        <p className="small">Use o atalho abaixo para continuar navegando.</p>
        <button className="btn" type="button" onClick={() => navigate(currentUser.role === 'admin' ? '/admin' : '/')}>
          Continuar
        </button>
      </section>
    );
  }

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const user = await login(form);
      navigate(user.role === 'admin' ? '/admin' : '/');
    } catch (error) {
      pushNotice('error', error.message);
    }
  };

  return (
    <section className="auth-card">
      <h1>Login</h1>
      <p className="small">Use uma conta criada no Firebase Authentication. O e-mail configurado como admin ganha acesso ao painel.</p>

      <form onSubmit={handleSubmit}>
        <label htmlFor="login-email">E-mail</label>
        <input
          id="login-email"
          type="email"
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
          required
        />

        <label htmlFor="login-password">Senha</label>
        <input
          id="login-password"
          type="password"
          value={form.password}
          onChange={(event) => setForm({ ...form, password: event.target.value })}
          required
        />

        <button type="submit">Entrar</button>
      </form>

      <p className="small">
        Nao tem conta? <Link to="/cadastro">Cadastre-se</Link>.
      </p>
    </section>
  );
}
