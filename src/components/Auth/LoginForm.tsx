import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useAuth } from '../../contexts/SupabaseAuthContext';

interface LoginFormProps {
  onToggleMode: () => void;
}

export function LoginForm({ onToggleMode }: LoginFormProps) {
  const [formData, setFormData] = useState({
    login: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await signIn(formData.login, formData.password);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <Card className="doodle-card float-animation">
      <CardHeader className="text-center">
        <CardTitle className="handwritten text-2xl color-soft-purple">Welcome Back!</CardTitle>
        <p className="text-gray-600 handwritten">Sign in to your TEA account</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-100 border-2 border-dashed border-red-300 rounded-lg">
              <p className="text-red-700 text-sm handwritten">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="login" className="block text-sm font-medium text-gray-700 handwritten mb-1">
              Username or Email
            </label>
            <input
              type="text"
              id="login"
              name="login"
              value={formData.login}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg handwritten sketchy-border focus:border-purple-400"
              placeholder="Enter your username or email"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 handwritten mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg handwritten sketchy-border focus:border-purple-400"
              placeholder="Enter your password"
              disabled={isLoading}
            />
          </div>

          <Button
            type="submit"
            className="w-full doodle-button bg-soft-purple text-white handwritten"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <div className="text-center">
          <button
            type="button"
            onClick={onToggleMode}
            className="text-sm color-soft-purple handwritten hover:underline"
            disabled={isLoading}
          >
            Don't have an account? Sign up
          </button>
        </div>
      </CardContent>
    </Card>
  );
}