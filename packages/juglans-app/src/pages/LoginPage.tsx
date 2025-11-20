// packages/juglans-app/src/pages/LoginPage.tsx
import { Component, createSignal } from 'solid-js';
import { useAppContext } from '../context/AppContext';
import './AuthPage.css';

const LoginPage: Component = () => {
  const [, actions] = useAppContext();
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
      
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      window.location.href = '/'; 

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="auth-page-container">
      {/* --- 左侧宣传栏 --- */}
      <div class="auth-promo-column">
        <div class="promo-header">
          <img src="/logo.svg" alt="Juglans Logo" />
          <span class="logo-text">Juglans</span>
        </div>
        <p class="promo-slogan">The World's First Vibe Trading App.</p>
        <div class="phone-mockup">
          <div class="phone-frame">
            <div class="phone-notch"></div>
            <div class="phone-screen">
              <iframe src="https://juglans.ai" title="Juglans AI Website Preview"></iframe>
            </div>
          </div>
        </div>
        <div class="telegram-card">
          <h4>加入我们的 Telegram 社区</h4>
          <p>学课程, 拿福利, 共交流</p>
        </div>
      </div>

      {/* --- 右侧表单栏 --- */}
      <div class="auth-form-column">
        <form onSubmit={handleSubmit} class="auth-form">
          <h2>Welcome Back</h2>
          <p class="subtitle">Enter your credentials to access your account.</p>

          <a href={`${import.meta.env.VITE_API_BASE_URL}/api/auth/google`} class="auth-button google-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" style={{ "margin-right": "10px" }}><path fill="#4285F4" d="M21.35 11.1h-9.1v3.8h5.2a4.5 4.5 0 0 1-1.9 2.9v2.5h3.2a9.7 9.7 0 0 0 2.8-7.2z"/><path fill="#34A853" d="M12.25 22c2.7 0 4.9-0.9 6.5-2.5l-3.2-2.5a5.4 5.4 0 0 1-3.3 1.2c-2.5 0-4.7-1.7-5.5-4H3.85v2.6a10 10 0 0 0 8.4 4.7z"/><path fill="#FBBC05" d="M6.75 14.1a5.4 5.4 0 0 1 0-3.2V8.3H3.85a10 10 0 0 0 0 8.4l2.9-2.6z"/><path fill="#EA4335" d="M12.25 6.2c1.4 0 2.5 0.5 3.3 1.2l2.8-2.8a9.6 9.6 0 0 0-6.1-2.2 10 10 0 0 0-8.4 4.7l2.9 2.6a5.4 5.4 0 0 1 5.5-4z"/></svg>
            Sign in with Google
          </a>
          
          <div class="divider">OR</div>

          <div class="form-group">
            <input type="text" class="auth-input" placeholder="Username" onInput={(e) => setUsername(e.currentTarget.value)} required />
          </div>
          <div class="form-group">
            <input type="password" class="auth-input" placeholder="Password" onInput={(e) => setPassword(e.currentTarget.value)} required />
          </div>

          {/* --- 核心修改 --- */}
          <button 
            type="submit" 
            class="auth-button login-btn"
            classList={{ 'active': username() && password() }}
            disabled={loading() || !username() || !password()}
          >
            {loading() ? 'Logging in...' : 'Log In'}
          </button>
          
          {error() && <p class="error-message">{error()}</p>}
          
          <p class="switch-link">
            Don't have an account? <a href="/register">Register</a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;