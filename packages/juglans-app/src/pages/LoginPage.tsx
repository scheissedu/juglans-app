import { Component, createSignal } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { useAppContext } from '../context/AppContext';
import './AuthPage.css';

const LoginPage: Component = () => {
  const [, actions] = useAppContext();
  const navigate = useNavigate();
  const [username, setUsername] = createSignal('');
  const [password, setPassword] = createSignal('');
  const [error, setError] = createSignal('');
  const [loading, setLoading] = createSignal(false);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username(), password: password() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Login failed');
      
      actions.setUser(data.user, data.token);
      navigate('/'); // 登录成功后跳转到主页

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="auth-page-container">
      <form onSubmit={handleSubmit} class="auth-form">
        <h2>Login to Juglans</h2>
        <div class="form-group">
          <input type="text" class="auth-input" placeholder="Username" onInput={(e) => setUsername(e.currentTarget.value)} required />
        </div>
        <div class="form-group">
          <input type="password" class="auth-input" placeholder="Password" onInput={(e) => setPassword(e.currentTarget.value)} required />
        </div>
        <button type="submit" class="auth-button" disabled={loading()}>
          {loading() ? 'Logging in...' : 'Log In'}
        </button>
        {error() && <p class="error-message">{error()}</p>}
        <p class="switch-link">
          Don't have an account? <a href="/register">Register</a>
        </p>
      </form>
    </div>
  );
};

export default LoginPage;