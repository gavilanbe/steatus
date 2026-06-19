import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useAuth } from '../../contexts/SupabaseAuthContext';

interface RegisterFormProps {
  onToggleMode: () => void;
}

export function RegisterForm({ onToggleMode }: RegisterFormProps) {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    displayName: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      await signUp(
        formData.email,
        formData.password,
        formData.username,
        formData.displayName || formData.username
      );
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
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
        <CardTitle className="handwritten text-2xl color-soft-purple">Join TEA!</CardTitle>
        <p className="text-gray-600 handwritten">Create your account to connect with friends</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-100 border-2 border-dashed border-red-300 rounded-lg">
              <p className="text-red-700 text-sm handwritten">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 handwritten mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg handwritten sketchy-border focus:border-purple-400"
              placeholder="your.email@example.com"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 handwritten mb-1">
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              minLength={3}
              maxLength={20}
              pattern="[a-zA-Z0-9_]+"
              className="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg handwritten sketchy-border focus:border-purple-400"
              placeholder="Choose a unique username"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 handwritten mb-1">
              Display Name (Optional)
            </label>
            <input
              type="text"
              id="displayName"
              name="displayName"
              value={formData.displayName}
              onChange={handleChange}
              maxLength={100}
              className="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg handwritten sketchy-border focus:border-purple-400"
              placeholder="How friends will see your name"
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
              minLength={6}
              className="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg handwritten sketchy-border focus:border-purple-400"
              placeholder="At least 6 characters"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 handwritten mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg handwritten sketchy-border focus:border-purple-400"
              placeholder="Re-enter your password"
              disabled={isLoading}
            />
          </div>

          <Button
            type="submit"
            className="w-full doodle-button bg-soft-purple text-white handwritten"
            disabled={isLoading}
          >
            {isLoading ? 'Creating account...' : 'Sign Up'}
          </Button>
        </form>

        <div className="text-center">
          <button
            type="button"
            onClick={onToggleMode}
            className="text-sm color-soft-purple handwritten hover:underline"
            disabled={isLoading}
          >
            Already have an account? Sign in
          </button>
        </div>
      </CardContent>
    </Card>
  );
}