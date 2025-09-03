import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { login } from '../store/authSlice';
import { Button, Input } from '../components/ui';
import { LoginRequest } from '../types';

const LoginPage: React.FC = () => {
  const [formData, setFormData] = useState<LoginRequest>({
    email: '',
    password: '',
  });

  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await dispatch(login(formData));
      if (login.fulfilled.match(result)) {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleQuickLogin = async (email: string, password: string) => {
    try {
      const result = await dispatch(login({ email, password }));
      if (login.fulfilled.match(result)) {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Quick login failed:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-primary-600 mb-2">🍽️ Pingnom</h1>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">歡迎回來</h2>
          <p className="text-gray-600">登入開始您的美食社交之旅</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="電子郵件"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="請輸入電子郵件"
            required
          />

          <Input
            label="密碼"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="請輸入密碼"
            required
          />

          <Button
            type="submit"
            size="lg"
            loading={isLoading}
            className="w-full"
          >
            登入
          </Button>
        </form>

        {/* Quick Login Options */}
        <div className="mt-6">
          <div className="text-center text-sm text-gray-600 mb-4">
            開發模式快速登入：
          </div>
          <div className="space-y-2">
            <Button
              variant="secondary"
              size="sm"
              className="w-full bg-green-100 hover:bg-green-200 text-green-800"
              onClick={() => handleQuickLogin('testuser@pingnom.app', 'TestPassword2024!')}
            >
              👨‍💼 Frank Li (創建者)
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="w-full bg-purple-100 hover:bg-purple-200 text-purple-800"
              onClick={() => handleQuickLogin('alice@pingnom.app', 'AlicePassword2024!')}
            >
              👩‍💼 Alice Wang (邀請對象)
            </Button>
          </div>
        </div>

        {/* Register Link */}
        <div className="text-center">
          <span className="text-gray-600">還沒有帳號？ </span>
          <button
            type="button"
            onClick={() => navigate('/register')}
            className="text-primary-600 hover:text-primary-500 font-medium"
          >
            立即註冊
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;