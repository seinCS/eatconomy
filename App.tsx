
import React, { useState, createContext, useContext, useEffect, useCallback } from 'react';
import { HashRouter, Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { Home, Refrigerator, ShoppingCart, ChefHat } from 'lucide-react';

import HomePage from './pages/Home';
import SwipePage from './pages/Swipe';
import PlanPage from './pages/Plan';
import ListPage from './pages/List';
import FridgePage from './pages/Fridge';
import LoginPage from './pages/Login';
import ProfilePage from './pages/Profile';
import AuthCallbackPage from './pages/AuthCallback';
import OnboardingPage from './pages/Onboarding';
import ErrorBoundary from './components/ErrorBoundary';
import { Recipe, UserPreferences, User, MealSet, WeeklyPlan, DailyPlan } from './types';
import { getAllRecipes } from './services/recipeService';
// import { generateScoredWeeklyPlan } from './services/recipeService'; // LLM 테스트용 주석처리
import { authService } from './services/authService';
import { apiService } from './services/apiService';
import { WEEKLY_PLAN_SLOTS, SWIPE_CARD_COUNT } from './constants';
import { getTodayDateKey, getTodayMealIndices } from './utils/date';

// --- Context Setup ---
interface AppContextType {
  user: User | null;
  isCheckingAuth: boolean; // 인증 확인 중인지 여부
  isLoadingData: boolean; // 사용자 데이터 로딩 중인지 여부
  login: (provider: 'kakao' | 'google') => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  
  preferences: UserPreferences | undefined;
  updatePreferences: (prefs: UserPreferences) => Promise<void>;

  fridge: string[];
  toggleFridgeItem: (item: string) => void;
  likedRecipes: Recipe[];
  addLikedRecipe: (recipe: Recipe) => void;
  dislikedRecipes: Recipe[];
  addDislikedRecipe: (recipe: Recipe) => void;
  plannedRecipes: WeeklyPlan | null;
  updatePlan: (day: number, dailyPlan: DailyPlan) => void;
  generatePlan: () => Promise<void>;
  generateAIPlan: () => Promise<void>; // Updated to Scored Generation
  isGeneratingPlan: boolean; // Loading state

  shoppingListChecks: Record<string, boolean>;
  toggleShoppingItem: (name: string) => void;
  todayMealFinished: boolean; // Legacy - kept for backward compatibility
  toggleTodayMealFinished: () => void; // Legacy
  toggleMealFinished: (dateKey: string, mealType: 'lunch' | 'dinner') => Promise<void>;
  getMealFinished: (dateKey: string, mealType: 'lunch' | 'dinner') => Promise<boolean>;
  resetSession: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};

// --- Protected Route Component ---
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isCheckingAuth, preferences, isLoadingData } = useApp();
  const routeLocation = useLocation();

  // 인증 확인 중이면 로딩 표시
  if (isCheckingAuth || isLoadingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">인증 확인 중...</p>
        </div>
      </div>
    );
  }

  // 인증 확인이 완료되었지만 사용자가 없으면 로그인 페이지로
  if (!user) {
    return <Navigate to="/login" state={{ from: routeLocation }} replace />;
  }

  // 데이터 로딩이 완료된 후에만 온보딩 체크 수행
  // preferences가 undefined이고 데이터 로딩이 완료되었을 때만 온보딩 페이지로 리다이렉트
  if (!preferences && routeLocation.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};

// --- Onboarding Route Component ---
const OnboardingRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isCheckingAuth, preferences, isLoadingData } = useApp();
  const routeLocation = useLocation();

  // 인증 확인 중이면 로딩 표시
  if (isCheckingAuth || isLoadingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">인증 확인 중...</p>
        </div>
      </div>
    );
  }

  // 인증 확인이 완료되었지만 사용자가 없으면 로그인 페이지로
  if (!user) {
    return <Navigate to="/login" state={{ from: routeLocation }} replace />;
  }

  // 데이터 로딩이 완료된 후에만 온보딩 완료 체크 수행
  // preferences가 있고 데이터 로딩이 완료되었을 때만 홈으로 리다이렉트
  if (preferences) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// --- Main App Component ---
const App: React.FC = () => {
  // --- Auth State ---
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // --- App Data State (Synced from DB) ---
  const [fridge, setFridge] = useState<string[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences | undefined>(undefined);
  const [likedRecipes, setLikedRecipes] = useState<Recipe[]>([]);
  const [dislikedRecipes, setDislikedRecipes] = useState<Recipe[]>([]);
  const [plannedRecipes, setPlannedRecipes] = useState<WeeklyPlan | null>(null);
  const [shoppingListChecks, setShoppingListChecks] = useState<Record<string, boolean>>({});
  const [todayMealFinished, setTodayMealFinished] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);

  // --- Check Authentication on Mount ---
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
        
        // 에러 추적 서비스에 사용자 정보 설정
        if (currentUser) {
          const { errorTracking } = await import('./utils/errorTracking');
          errorTracking.setUser(currentUser.id, currentUser.email);
        }
      } catch (error) {
        const { logError } = await import('./utils/errors');
        logError(error, 'checkAuth');
        setUser(null);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, []);

  // --- Load Data on Auth Change ---
  useEffect(() => {
    const loadUserData = async () => {
      if (user) {
        setIsLoadingData(true);
        try {
          // Initialize user data (백엔드에서 자동 처리)
          await apiService.initUserData(user);

          // Fetch all data in parallel from API
          const [
            fullUser,
            fridgeData, 
            planData, 
            likedData, 
            dislikedData, 
            shoppingData,
            todayStatus
          ] = await Promise.all([
            apiService.getUser(user.id),
            apiService.getFridge(user.id),
            apiService.getPlan(user.id),
            apiService.getLikedRecipes(user.id),
            apiService.getDislikedRecipes(user.id),
            apiService.getShoppingChecks(user.id),
            apiService.getTodayFinished(user.id)
          ]);

          setPreferences(fullUser?.preferences);
          setFridge(fridgeData);
          // API에서 받은 Recipe[]는 레거시 구조이므로 null로 설정
          // TODO: 백엔드 API가 WeeklyPlan을 반환하도록 업데이트 필요
          setPlannedRecipes(null);
          setLikedRecipes(likedData);
          setDislikedRecipes(dislikedData);
          setShoppingListChecks(shoppingData);
          setTodayMealFinished(todayStatus);

        } catch (e) {
          const { logError } = await import('./utils/errors');
          logError(e, 'loadUserData');
        } finally {
          setIsLoadingData(false);
        }
      } else {
        // Clear state on logout
        setFridge([]);
        setPreferences(undefined);
        setPlannedRecipes(Array(WEEKLY_PLAN_SLOTS).fill(null).map(() => ({ main: null, side: null })));
        setLikedRecipes([]);
        setDislikedRecipes([]);
        setShoppingListChecks({});
        setTodayMealFinished(false);
      }
    };

    loadUserData();
  }, [user]);

  // --- Auth Actions ---
  const login = async (provider: 'kakao' | 'google') => {
    if (provider === 'kakao') {
      // 카카오 로그인: 카카오 인가 서버로 리다이렉트
      // 리다이렉트되므로 여기서는 아무것도 하지 않음
      authService.loginWithKakao();
    } else {
      // Google 로그인은 아직 구현 안 됨
      throw new Error('Google login not implemented yet');
    }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    
    // 에러 추적 서비스에서 사용자 정보 제거
    const { errorTracking } = await import('./utils/errorTracking');
    errorTracking.clearUser();
  };

  const deleteAccount = async () => {
    if (user) {
      await apiService.deleteAccount(user.id);
      await logout();
    }
  };

  // --- Data Actions (Proxies to API) ---
  const updatePreferences = async (prefs: UserPreferences) => {
    if (!user) return;
    setPreferences(prefs);
    await apiService.updateUserPreferences(user.id, prefs);
  };

  const toggleFridgeItem = async (item: string) => {
    if (!user) return;
    // Optimistic Update
    setFridge(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
    // API Update
    try {
      const updatedFridge = await apiService.toggleFridgeItem(user.id, item);
      setFridge(updatedFridge);
    } catch (error) {
      // Rollback on error
      setFridge(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
      throw error;
    }
  };

  const addLikedRecipe = async (recipe: Recipe) => {
    if (!user) return;
    setLikedRecipes(prev => [...prev, recipe]);
    try {
      await apiService.addLikedRecipe(user.id, recipe.id);
    } catch (error) {
      // Rollback on error
      setLikedRecipes(prev => prev.filter(r => r.id !== recipe.id));
      throw error;
    }
  };

  const addDislikedRecipe = async (recipe: Recipe) => {
    if (!user) return;
    setDislikedRecipes(prev => [...prev, recipe]);
    try {
      await apiService.addDislikedRecipe(user.id, recipe.id);
    } catch (error) {
      // Rollback on error
      setDislikedRecipes(prev => prev.filter(r => r.id !== recipe.id));
      throw error;
    }
  };

  const updatePlan = async (day: number, dailyPlan: DailyPlan) => {
    if (!user || !plannedRecipes) return;
    const newPlan: WeeklyPlan = {
      ...plannedRecipes,
      dailyPlans: plannedRecipes.dailyPlans.map(dp => dp.day === day ? dailyPlan : dp),
    };
    setPlannedRecipes(newPlan);
    try {
      // API는 아직 Recipe 단일 구조를 지원하므로 메인만 저장 (임시)
      // TODO: 백엔드 API를 WeeklyPlan 구조로 업데이트 필요
      if (dailyPlan.dinner.mainRecipe) {
        // 레거시 인덱스 계산 (저녁만 저장)
        const legacyIndex = day * 2 + 1; // 저녁은 홀수 인덱스
        await apiService.updatePlanSlot(user.id, legacyIndex, dailyPlan.dinner.mainRecipe);
      }
    } catch (error) {
      // Rollback on error
      setPlannedRecipes(plannedRecipes);
      throw error;
    }
  };

  // LLM-based generation only (스코어링 알고리즘 폴백 주석처리)
  const generatePlan = async (useLLM: boolean = true) => {
    if (!user) {
      console.warn('[generatePlan] 사용자가 로그인하지 않았습니다.');
      return;
    }
    
    // 중복 호출 방지
    if (isGeneratingPlan) {
      console.warn('[generatePlan] 이미 식단 생성 중입니다. 중복 호출 무시.');
      return;
    }
    
    setIsGeneratingPlan(true);
    
    try {
      console.log('[generatePlan] 시작 - 사용자:', user.id, '냉장고:', fridge.length, '개');
      console.log('[generatePlan] 좋아요 레시피:', likedRecipes.length, '개');
      console.log('[generatePlan] 싫어요 레시피:', dislikedRecipes.length, '개');
      
      let weeklyPlan: WeeklyPlan;
      
      if (useLLM) {
        // LLM-based generation only
        const { generateWeeklyPlanWithLLM } = await import('./services/openaiService');
        console.log('[generatePlan] LLM 기반 식단 생성 시작...');
        weeklyPlan = await generateWeeklyPlanWithLLM(
          fridge,
          preferences,
          dislikedRecipes,
          likedRecipes
        );
        console.log('[generatePlan] LLM 기반 식단 생성 완료');
        console.log('[generatePlan] 고정 반찬:', weeklyPlan.stapleSideDishes.map(s => s.name).join(', '));
        console.log('[generatePlan] 저녁 메뉴:', weeklyPlan.dailyPlans.map(dp => `Day ${dp.day}: ${dp.dinner.mainRecipe.name}`).join(', '));
      } else {
        // 스코어링 알고리즘 직접 사용 (주석처리)
        throw new Error('스코어링 알고리즘은 현재 비활성화되어 있습니다. LLM 모드를 사용하세요.');
      }
      
      setPlannedRecipes(weeklyPlan);
      console.log('[generatePlan] 상태 업데이트 완료');
      
      // API는 아직 Recipe[] 구조를 지원하므로 메인만 변환해서 저장 (임시)
      // TODO: 백엔드 API를 WeeklyPlan 구조로 업데이트 필요
      const mainRecipes = weeklyPlan.dailyPlans.map(dp => dp.dinner.mainRecipe);
      console.log('[generatePlan] 백엔드 저장 시작...');
      await apiService.savePlan(user.id, mainRecipes);
      console.log('[generatePlan] 백엔드 저장 완료');
    } catch (e) {
        console.error('[generatePlan] 에러 발생:', e);
        const { logError } = await import('./utils/errors');
        logError(e, 'generatePlan');
        throw e; // Propagate error for UI handling
    } finally {
      setIsGeneratingPlan(false);
      console.log('[generatePlan] 완료 (로딩 상태 해제)');
    }
  };

  // Explicit AI/LLM Generation Trigger (e.g. from Fridge Page or Home)
  const generateAIPlan = async () => {
    if (!user) return;
    setIsGeneratingPlan(true);
    
    // Simulate a small delay for better UX (making it feel like "analysis")
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      // Use LLM-based generation (with automatic fallback)
      await generatePlan(true);
    } catch (error) {
      const { logError } = await import('./utils/errors');
      logError(error, 'generateAIPlan');
      alert("식단 생성 중 오류가 발생했습니다.");
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const toggleShoppingItem = async (name: string) => {
    if (!user) return;
    setShoppingListChecks(prev => ({ ...prev, [name]: !prev[name] }));
    try {
      const updatedChecks = await apiService.toggleShoppingCheck(user.id, name);
      setShoppingListChecks(updatedChecks);
    } catch (error) {
      // Rollback on error
      setShoppingListChecks(prev => ({ ...prev, [name]: !prev[name] }));
      throw error;
    }
  };

  const toggleTodayMealFinished = async () => {
    if (!user) return;
    setTodayMealFinished(prev => !prev);
    try {
      const finished = await apiService.toggleTodayFinished(user.id);
      setTodayMealFinished(finished);
    } catch (error) {
      // Rollback on error
      setTodayMealFinished(prev => !prev);
      throw error;
    }
  };

  const toggleMealFinished = useCallback(async (dateKey: string, mealType: 'lunch' | 'dinner') => {
    if (!user) return;
    try {
      await apiService.toggleMealFinished(user.id, dateKey, mealType);
    } catch (error) {
      const { logError } = await import('./utils/errors');
      logError(error, 'toggleMealFinished');
      throw error;
    }
  }, [user]);

  const getMealFinished = useCallback(async (dateKey: string, mealType: 'lunch' | 'dinner'): Promise<boolean> => {
    if (!user) return false;
    return await apiService.getMealFinished(user.id, dateKey, mealType);
  }, [user]);

  const resetSession = async () => {
    if (!user) return;
    setLikedRecipes([]);
    setDislikedRecipes([]);
    setTodayMealFinished(false);
    await apiService.resetSession(user.id);
  };

  // 인증 확인 중일 때 로딩 표시
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <AppContext.Provider value={{ 
      user, isCheckingAuth, isLoadingData, login, logout, deleteAccount,
      preferences, updatePreferences,
      fridge, toggleFridgeItem, 
      likedRecipes, addLikedRecipe, 
      dislikedRecipes, addDislikedRecipe,
      plannedRecipes, updatePlan, 
      generatePlan, generateAIPlan, isGeneratingPlan,
      shoppingListChecks, toggleShoppingItem,
      todayMealFinished, toggleTodayMealFinished,
      toggleMealFinished, getMealFinished,
      resetSession
    }}>
      <ErrorBoundary>
        <HashRouter>
          <div className="min-h-screen bg-gray-50 flex justify-center">
            <div className="w-full max-w-md bg-white min-h-screen shadow-xl relative flex flex-col">
              
              <div className="flex-1 overflow-y-auto no-scrollbar">
                 <Routes>
                  {/* Public Routes */}
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/auth/callback" element={<AuthCallbackPage />} />

                  {/* Onboarding Route */}
                  <Route path="/onboarding" element={<OnboardingRoute><OnboardingPage /></OnboardingRoute>} />

                  {/* Protected Routes */}
                  <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
                  <Route path="/fridge" element={<ProtectedRoute><FridgePage /></ProtectedRoute>} />
                  <Route path="/swipe" element={<ProtectedRoute><SwipePage /></ProtectedRoute>} />
                  <Route path="/plan" element={<ProtectedRoute><PlanPage /></ProtectedRoute>} />
                  <Route path="/list" element={<ProtectedRoute><ListPage /></ProtectedRoute>} />
                  <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                  
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </div>

              {/* Bottom Nav - Only show if logged in */}
              {user && <BottomNav />}
            </div>
          </div>
        </HashRouter>
      </ErrorBoundary>
    </AppContext.Provider>
  );
};

// --- Bottom Navigation ---
const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  if (location.pathname === '/swipe' || location.pathname === '/login' || location.pathname === '/onboarding') return null;

  const navItems = [
    { path: '/', icon: Home, label: '홈' },
    { path: '/fridge', icon: Refrigerator, label: '냉장고' },
    { path: '/plan', icon: ChefHat, label: '식단표' },
    { path: '/list', icon: ShoppingCart, label: '장보기' },
  ];

  return (
    <nav className="sticky bottom-0 w-full bg-white border-t border-gray-100 py-3 px-6 flex justify-between items-center z-50 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center space-y-1 transition-colors ${
              isActive ? 'text-orange-500' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default App;
