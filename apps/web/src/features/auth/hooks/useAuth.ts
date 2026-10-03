import { useContext } from 'react';
import { AuthContext, type AuthContextValue } from '../AuthContext';

/**
 * useAuth — hook للوصول إلى AuthContext.
 *
 * يجب أن يُستخدم داخل AuthProvider.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}