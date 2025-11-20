import { Component, onMount } from 'solid-js';
import { useSearchParams, useNavigate } from '@solidjs/router';
import { Loading } from '@klinecharts/pro';

const AuthCallbackPage: Component = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  onMount(() => {
    const token = searchParams.token;
    const userStr = searchParams.user;

    if (token && userStr) {
      try {
        const user = JSON.parse(decodeURIComponent(userStr));
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(user));
        // 使用 window.location.href 强制刷新，以确保 AppContext 完全重新初始化
        window.location.href = '/';
      } catch (e) {
        console.error("Failed to parse user data from URL", e);
        navigate('/login', { replace: true });
      }
    } else {
      // 如果没有 token，重定向回登录页
      navigate('/login', { replace: true });
    }
  });

  return (
    <div style={{ display: 'flex', 'justify-content': 'center', 'align-items': 'center', height: '100vh' }}>
      <Loading />
    </div>
  );
};

export default AuthCallbackPage;