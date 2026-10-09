import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../services/api';
import { ROLE } from '../data/roles';

const AuthContext = createContext(null);

const roleMap = {
  tenant: ROLE.TENANT,
  property_manager: ROLE.PROPERTY_MANAGER,
  landlord: ROLE.LANDLORD,
  admin: ROLE.ADMIN,
  [ROLE.TENANT]: ROLE.TENANT,
  [ROLE.PROPERTY_MANAGER]: ROLE.PROPERTY_MANAGER,
  [ROLE.LANDLORD]: ROLE.LANDLORD,
  [ROLE.ADMIN]: ROLE.ADMIN,
};

function normalizeUser(user) {
  if (!user) return null;

  const firstName =
    typeof user.firstName === 'string'
      ? user.firstName.trim()
      : '';

  const lastName =
    typeof user.lastName === 'string'
      ? user.lastName.trim()
      : '';

  const name =
    [firstName, lastName].filter(Boolean).join(' ') ||
    user.name ||
    '';

  return {
    id: String(user.id || user._id || ''),
    name,
    email: user.email || '',
    role: roleMap[user.role] || user.role,
    avatar:
      user.avatar ||
      name
        .split(/\s+/)
        .filter(Boolean)
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase(),
    phone: user.phone || '',
    location: user.location || 'Nigeria',
    company: user.company || '',
    status: user.status,
  };
}

function authErrorMessage(error, fallback) {
  return (
    error.response?.data?.message ||
    (error.request
      ? 'Unable to connect to the Keyhouse server. Please try again.'
      : error.message) ||
    fallback
  );
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved =
      localStorage.getItem('keyhouse-user') ||
      sessionStorage.getItem('keyhouse-user');
    const savedToken =
      localStorage.getItem('keyhouse-token') ||
      sessionStorage.getItem('keyhouse-token');

    if (!saved || !savedToken) return null;

    try {
      return normalizeUser(JSON.parse(saved));
    } catch {
      localStorage.removeItem('keyhouse-user');
      sessionStorage.removeItem('keyhouse-user');
      return null;
    }
  });

  // Get saved JWT token
  const [token, setToken] = useState(() => {
    return (
      localStorage.getItem('keyhouse-token') ||
      sessionStorage.getItem('keyhouse-token') ||
      null
    );
  });

  const [rememberSession, setRememberSession] = useState(() =>
    Boolean(localStorage.getItem('keyhouse-user'))
  );

  const [loading, setLoading] = useState(() =>
    Boolean(
      localStorage.getItem('keyhouse-token') ||
      sessionStorage.getItem('keyhouse-token')
    )
  );

  // Store user and token in the correct browser storage
  useEffect(() => {
    if (user && token) {
      const storage = rememberSession ? localStorage : sessionStorage;
      const otherStorage = rememberSession
        ? sessionStorage
        : localStorage;

      storage.setItem('keyhouse-user', JSON.stringify(user));
      storage.setItem('keyhouse-token', token);

      otherStorage.removeItem('keyhouse-user');
      otherStorage.removeItem('keyhouse-token');
    } else if (!user && !token) {
      localStorage.removeItem('keyhouse-user');
      localStorage.removeItem('keyhouse-token');

      sessionStorage.removeItem('keyhouse-user');
      sessionStorage.removeItem('keyhouse-token');
    }
  }, [user, token, rememberSession]);

  useEffect(() => {
    if (!token) return undefined;

    let isActive = true;
    setLoading(true);

    authApi
      .getCurrentUser()
      .then((response) => {
        if (isActive) setUser(normalizeUser(response.user));
      })
      .catch((error) => {
        if (
          isActive &&
          [401, 404].includes(error.response?.status)
        ) {
          setUser(null);
          setToken(null);
          setRememberSession(false);
        }
      })
      .finally(() => {
        if (isActive) setLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [token]);

  const login = async ({ email, password, remember = true }) => {
    setLoading(true);

    try {
      const response = await authApi.login({
        email: String(email).trim(),
        password,
      });

      const safeUser = normalizeUser(response.user);

      if (!response.token) {
        throw new Error(
          'Login succeeded, but the server did not return an authentication token.'
        );
      }

      setRememberSession(remember);
      setToken(response.token);
      setUser(safeUser);

      return safeUser;
    } catch (error) {
      throw new Error(
        authErrorMessage(error, 'Unable to log in.')
      );
    } finally {
      setLoading(false);
    }
  };

  const register = async ({ name, email, password, phone }) => {
    setLoading(true);

    try {
      const nameParts = String(name || '')
        .trim()
        .split(/\s+/)
        .filter(Boolean);

      if (nameParts.length < 2) {
        throw new Error(
          'Please enter both your first and last name.'
        );
      }

      const response = await authApi.register({
        firstName: nameParts.shift(),
        lastName: nameParts.join(' '),
        email: String(email).trim(),
        phone: String(phone).trim(),
        password,
      });

      const loginResponse = await authApi.login({
        email: String(email).trim(),
        password,
      });

      if (!loginResponse.token) {
        throw new Error(
          'Account created, but the server did not return an authentication token.'
        );
      }

      const newUser = normalizeUser(loginResponse.user || response.user);

      setRememberSession(true);
      setToken(loginResponse.token);
      setUser(newUser);
      return newUser;
    } catch (error) {
      throw new Error(
        authErrorMessage(error, 'Unable to create account.')
      );
    } finally {
      setLoading(false);
    }
  };

  const updateCurrentUser = (updates) => {
    setUser((current) => {
      if (!current) return current;

      return {
        ...current,
        ...updates,
      };
    });
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setRememberSession(false);
  };

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      login,
      register,
      logout,
      updateCurrentUser,
      isAuthenticated: Boolean(user && token),
    }),
    [user, token, loading]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth must be used inside an AuthProvider'
    );
  }

  return context;
}