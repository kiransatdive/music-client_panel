import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

interface User {
  id: number;
  email: string;
  phone?: string;
  role: 'artist' | 'admin';
  artistProfile?: {
    id: number;
    artist_name: string;
    profile_image?: string;
    bio?: string;
    website?: string;
    social_links?: string;
  };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  loading: boolean;
  fetchProfile: () => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  artist_name: string;
  phone: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchProfile = async () => {
    try {
      const response = await axios.get('/api/artist/profile');
      const { artist } = response.data.data;
      setUser({
        id: artist.id,
        email: artist.email,
        phone: artist.phone,
        role: artist.role as 'artist' | 'admin',
        artistProfile: {
          id: artist.id,
          artist_name: artist.name || '',
          profile_image: artist.profileImage || undefined,
          bio: artist.bio || undefined,
          social_links: artist.socialLinks || undefined,
        }
      });
    } catch (error) {
      localStorage.removeItem('token');
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await axios.post('/api/artist/login', { email, password });
    const { token, artist } = response.data.data;
    localStorage.setItem('token', token);
    setToken(token);
    setUser({
      id: artist.id,
      email: artist.email,
      phone: artist.phone,
      role: artist.role as 'artist' | 'admin',
      artistProfile: {
        id: artist.id,
        artist_name: artist.name,
        profile_image: artist.profileImage || undefined,
        bio: artist.bio || undefined,
        social_links: artist.socialLinks || undefined,
      }
    });
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  };

  const register = async (data: RegisterData) => {
    await axios.post('/api/artist/register', {
      name: data.artist_name,
      email: data.email,
      password: data.password,
      phone: data.phone
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading, fetchProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
