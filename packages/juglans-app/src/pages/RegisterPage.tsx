import { Component, createSignal } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import './AuthPage.css';

const RegisterPage: Component = () => {
  const navigate = useNavigate();
  const [username, setUsername] = createSignal('');
  const [password, setPassword] = createSignal('');
  const [error, setError] = createSignal('');
  const [success, setSuccess] = createSignal('');
  const [loading, setLoading] = createSignal(false);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username(), password: password() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Registration failed');
      
      setSuccess('Registration successful! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="auth-page-container">
      <form onSubmit={handleSubmit} class="auth-form">
        <h2>Create an Account</h2>
        <div class="form-group">
          <input type="text" class="auth-input" placeholder="Username" onInput={(e) => setUsername(e.currentTarget.value)} required />
        </div>
        <div class="form-group">
          <input type="password" class="auth-input" placeholder="Password" onInput={(e) => setPassword(e.currentTarget.value)} required />
        </div>
        <button type="submit" class="auth-button" disabled={loading() || success() !== ''}>
          {loading() ? 'Registering...' : 'Register'}
        </button>
        {error() && <p class="error-message">{error()}</p>}
        {success() && <p class="success-message">{success()}</p>}
        <p class="switch-link">
          Already have an account? <a href="/login">Log in</a>
        </p>
      </form>
    </div>
  );
};

export default RegisterPage;