import React, { useState, useEffect } from 'react';
import './LoginForm.css';

function LoginForm({ login, register, onClose }) {
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authData, setAuthData] = useState({ username: '', password: '', fullName: '' });
  const [error, setError] = useState('');
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    return () => {
      setError('');
      setIsShaking(false);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    let result;
    if (isRegister) {
      result = await register(authData.username, authData.password, authData.fullName);
    } else {
      result = await login(authData.username, authData.password);
    }
    
    if (!result.success) {
      setError(result.message);
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 400);
    } else {
      if (isRegister) {
        alert("Регистрация успешна! Теперь вы можете войти.");
        setIsRegister(false);
      } else {
        onClose();
      }
    }
  };

  return (
    <div className="auth-overlay">
      <div className="auth-container">
        <form 
          className={`login-card ${isShaking ? 'shake' : ''}`} 
          onSubmit={handleSubmit}
        >
          <button type="button" className="close-btn" onClick={onClose}>&times;</button>
          
          <h2>{isRegister ? '📝 Регистрация' : '🔐 Авторизация'}</h2>
          
          {isRegister && (
            <input
              type="text"
              placeholder="Полное имя (ФИО)"
              value={authData.fullName}
              onChange={e => setAuthData({ ...authData, fullName: e.target.value })}
              required
            />
          )}

          <input
            type="text"
            placeholder="Логин"
            autoComplete="username"
            value={authData.username}
            onChange={e => setAuthData({ ...authData, username: e.target.value })}
            required
          />
          
          <div className="password-input-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Пароль"
              autoComplete="current-password"
              value={authData.password}
              onChange={e => setAuthData({ ...authData, password: e.target.value })}
              required
            />
            <button
              type="button"
              className="toggle-password-btn"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex="-1"
            >
              {showPassword ? "👁️" : "🙈"}
            </button>
          </div>
          
          <button type="submit" className="btn-primary">
            {isRegister ? 'Создать аккаунт' : 'Войти'}
          </button>

          <div className="auth-switch">
            {isRegister ? 'Уже есть аккаунт?' : 'Впервые у нас?'}
            <button 
              type="button" 
              className="link-btn" 
              onClick={() => {
                setIsRegister(!isRegister);
                setError('');
              }}
            >
              {isRegister ? 'Войти' : 'Зарегистрироваться'}
            </button>
          </div>
          
          {error && <div className="error-msg-bottom">{error}</div>}
        </form>
      </div>
    </div>
  );
}

export default LoginForm;