import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './registrationForm.css';

const RegistrationForm = () => {
    const [formData, setFormData] = useState({
        full_name: '',
        username: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError("Пароли не совпадают!");
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    full_name: formData.full_name,
                    username: formData.username,
                    password: formData.password
                }),
            });

            const data = await response.json();

            if (response.ok) {
                alert("Регистрация успешно завершена!");
                navigate('/login');
            } else {
                setError(data.error || "Ошибка регистрации");
            }
        } catch (err) {
            setError("Не удалось соединиться с сервером");
        }
    };

    return (
        <div className="reg-page">
            <div className="reg-card">
                <h2>Регистрация в АИС</h2>
                <p className="subtitle">Создайте аккаунт читателя</p>
                
                {error && <div className="error-msg">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label>Полное имя (ФИО)</label>
                        <input 
                            type="text" 
                            name="full_name" 
                            placeholder="Иванов Иван Иванович"
                            onChange={handleChange} 
                            required 
                        />
                    </div>

                    <div className="input-group">
                        <label>Логин (Username)</label>
                        <input 
                            type="text" 
                            name="username" 
                            placeholder="ivanov77"
                            onChange={handleChange} 
                            required 
                        />
                    </div>

                    <div className="input-group">
                        <label>Пароль</label>
                        <input 
                            type="password" 
                            name="password" 
                            placeholder="••••••••"
                            onChange={handleChange} 
                            required 
                        />
                    </div>

                    <div className="input-group">
                        <label>Подтверждение пароля</label>
                        <input 
                            type="password" 
                            name="confirmPassword" 
                            placeholder="••••••••"
                            onChange={handleChange} 
                            required 
                        />
                    </div>

                    <button type="submit" className="reg-btn">Зарегистрироваться</button>
                </form>
                
                <div className="reg-footer">
                    Уже есть аккаунт? <span onClick={() => navigate('/login')}>Войти</span>
                </div>
            </div>
        </div>
    );
};

export default RegistrationForm;