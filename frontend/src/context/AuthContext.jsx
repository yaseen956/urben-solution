import { createContext, useContext, useMemo, useState } from 'react';
import api from '../services/api.js';

const AuthContext = createContext(null);

const storedAuth = () => JSON.parse(localStorage.getItem('urben-auth') || 'null');

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(storedAuth);

  const saveAuth = (payload) => {
    localStorage.setItem('urben-auth', JSON.stringify(payload));
    setAuth(payload);
  };

  const login = async ({ email, password, type }) => {
    const endpoint = type === 'technician' ? '/technician/login' : '/auth/login';
    const { data } = await api.post(endpoint, { email, password });
    const payload =
      type === 'technician'
        ? { type: 'technician', token: data.token, profile: data.technician }
        : { type: 'user', token: data.token, profile: data.user };
    saveAuth(payload);
    return payload;
  };

  const register = async ({ type, values, formData }) => {
    if (type === 'technician') {
      const { data } = await api.post('/technician/register', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const payload = { type: 'technician', token: data.token, profile: data.technician };
      saveAuth(payload);
      return payload;
    }
    const { data } = await api.post('/auth/register', values);
    const payload = { type: 'user', token: data.token, profile: data.user };
    saveAuth(payload);
    return payload;
  };

  const logout = () => {
    localStorage.removeItem('urben-auth');
    setAuth(null);
  };

  const value = useMemo(() => ({ auth, login, register, logout, setAuth: saveAuth }), [auth]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
