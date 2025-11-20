import { Component, createSignal, Show } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import TurnstileWidget from '../components/common/Turnstile'; // 导入新组件
import './AuthPage.css';

const RegisterPage: Component = () => {
  const navigate = useNavigate();
  const [email, setEmail] = createSignal('');
  const [username, setUsername] = createSignal('');
  const [password, setPassword] = createSignal('');
  const [verificationCode, setVerificationCode] = createSignal('');
  const [turnstileToken, setTurnstileToken] = createSignal('');
  
  const [isCodeSent, setIsCodeSent] = createSignal(false);
  const [error, setError] = createSignal('');
  const [success, setSuccess] = createSignal('');
  const [loading, setLoading] = createSignal(false);

  const handleSendCode = async () => {
    setError('');
    if (!email() || !/^\S+@\S+\.\S+$/.test(email())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!turnstileToken()) {
      setError('Please complete the security check.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/send-verification-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email(), turnstileToken: turnstileToken() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to send code.');
      
      setIsCodeSent(true);
      setSuccess('Verification code sent to your email!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!turnstileToken()) {
      setError('Security check expired. Please refresh.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: email(),
          username: username(), 
          password: password(),
          verificationCode: verificationCode(),
          turnstileToken: turnstileToken()
        }),
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
      </div>
      <div class="auth-form-column">
        <form onSubmit={handleSubmit} class="auth-form">
          <h2>Create an Account</h2>
          <p class="subtitle">Join the future of trading analysis.</p>

          <fieldset disabled={isCodeSent()} style={{ border: 'none', padding: 0, margin: 0 }}>
            <div class="form-group">
              <input type="email" class="auth-input" placeholder="Email" onInput={(e) => setEmail(e.currentTarget.value)} required />
            </div>
            {/* 使用独立的、干净的组件 */}
            <div class="form-group" style={{ display: 'flex', 'justify-content': 'center' }}>
              <TurnstileWidget 
                onSuccess={setTurnstileToken} 
                onError={() => setError('CAPTCHA failed to load. Please refresh.')} 
              />
            </div>
            <button type="button" class="auth-button" onClick={handleSendCode} disabled={loading() || !turnstileToken()}>
              {loading() ? 'Sending...' : 'Send Verification Code'}
            </button>
          </fieldset>

          <Show when={isCodeSent()}>
            <div class="form-group" style={{ "margin-top": "20px" }}>
              <input type="text" class="auth-input" placeholder="Verification Code" onInput={(e) => setVerificationCode(e.currentTarget.value)} required />
            </div>
            <div class="form-group">
              <input type="text" class="auth-input" placeholder="Username" onInput={(e) => setUsername(e.currentTarget.value)} required />
            </div>
            <div class="form-group">
              <input type="password" class="auth-input" placeholder="Password" onInput={(e) => setPassword(e.currentTarget.value)} required />
            </div>
            <button type="submit" class="auth-button" disabled={loading() || success() !== ''}>
              {loading() ? 'Registering...' : 'Create Account'}
            </button>
          </Show>

          {error() && <p class="error-message">{error()}</p>}
          {success() && <p class="success-message">{success()}</p>}
          
          <p class="switch-link">
            Already have an account? <a href="/login">Log in</a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;