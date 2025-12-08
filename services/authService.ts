import { User } from './dbService';

// Mock Users for Demo
const MOCK_USER_KAKAO: User = {
  id: 'user_kakao_001',
  email: 'user@kakao.com',
  nickname: '자취생 김코딩',
  avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'
};

const MOCK_USER_GOOGLE: User = {
  id: 'user_google_002',
  email: 'user@gmail.com',
  nickname: 'Google User',
  avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka'
};

export const authService = {
  // Simulate Kakao Login
  loginWithKakao: async (): Promise<User> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // In real app: Supabase.auth.signInWithOAuth({ provider: 'kakao' })
        localStorage.setItem('eat_user', JSON.stringify(MOCK_USER_KAKAO));
        resolve(MOCK_USER_KAKAO);
      }, 800);
    });
  },

  // Simulate Google Login
  loginWithGoogle: async (): Promise<User> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        localStorage.setItem('eat_user', JSON.stringify(MOCK_USER_GOOGLE));
        resolve(MOCK_USER_GOOGLE);
      }, 800);
    });
  },

  // Check current session
  getCurrentUser: (): User | null => {
    const stored = localStorage.getItem('eat_user');
    return stored ? JSON.parse(stored) : null;
  },

  // Logout
  logout: async (): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        localStorage.removeItem('eat_user');
        resolve();
      }, 300);
    });
  }
};