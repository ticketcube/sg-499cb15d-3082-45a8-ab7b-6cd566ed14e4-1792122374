import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface User {
  uid: string;
  email: string;
  displayName: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string) => Promise<void>;
  register: (email: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {}
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing user session in localStorage
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string) => {
    // Mock authentication - replace with real auth later
    const mockUser: User = {
      uid: `user_${Date.now()}`,
      email,
      displayName: email.split("@")[0],
    };

    setUser(mockUser);
    localStorage.setItem("currentUser", JSON.stringify(mockUser));
  };

  const register = async (email: string, displayName: string) => {
    // Mock registration - replace with real auth later
    const mockUser: User = {
      uid: `user_${Date.now()}`,
      email,
      displayName
    };
    
    setUser(mockUser);
    localStorage.setItem('currentUser', JSON.stringify(mockUser));
  };

  const logout = async () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
