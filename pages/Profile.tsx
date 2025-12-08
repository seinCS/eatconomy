import React, { useState, useEffect } from 'react';
import { useApp } from '../App';
import { useNavigate } from 'react-router-dom';
import { LogOut, Trash2, User as UserIcon, ChevronLeft, Save, Plus } from 'lucide-react';
import { UserPreferences } from '../types';
import { COMMON_ALLERGENS, COMMON_DISLIKED_FOODS } from '../constants';

const ProfilePage: React.FC = () => {
  const { user, preferences, updatePreferences, logout, deleteAccount } = useApp();
  const navigate = useNavigate();

  // Local state for editing form
  const [allergiesInput, setAllergiesInput] = useState('');
  const [allergies, setAllergies] = useState<string[]>([]);
  const [dislikedInput, setDislikedInput] = useState('');
  const [dislikedFoods, setDislikedFoods] = useState<string[]>([]);
  const [spicinessLevel, setSpicinessLevel] = useState<number>(1);
  const [cookingSkill, setCookingSkill] = useState<string>('Beginner');

  // Load initial values
  useEffect(() => {
    if (preferences) {
        setAllergies(preferences.allergies || []);
        setDislikedFoods(preferences.dislikedFoods || []);
        setSpicinessLevel(preferences.spicinessLevel || 1);
        setCookingSkill(preferences.cookingSkill || 'Beginner');
    }
  }, [preferences]);

  const handleSave = async () => {
      const newPrefs: UserPreferences = {
          allergies,
          dislikedFoods,
          spicinessLevel,
          cookingSkill
      };
      await updatePreferences(newPrefs);
      alert("설정이 저장되었습니다.");
  };

  const toggleTag = (tag: string, list: string[], setList: (v: string[]) => void) => {
    if (list.includes(tag)) {
        setList(list.filter(t => t !== tag));
    } else {
        setList([...list, tag]);
    }
  };

  const handleAddCustomTag = (
      input: string, 
      setInput: (v: string) => void, 
      list: string[], 
      setList: (v: string[]) => void
  ) => {
      if (!input.trim()) return;
      if (!list.includes(input.trim())) {
          setList([...list, input.trim()]);
      }
      setInput('');
  };

  const handleLogout = async () => {
    if (window.confirm('로그아웃 하시겠습니까?')) {
      await logout();
      navigate('/login');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('정말로 탈퇴하시겠습니까? 모든 데이터가 삭제됩니다.')) {
      await deleteAccount();
      navigate('/login');
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white px-6 py-4 flex items-center shadow-sm sticky top-0 z-10 justify-between">
        <div className="flex items-center">
            <button onClick={() => navigate(-1)} className="mr-4 text-gray-600">
            <ChevronLeft size={24} />
            </button>
            <h1 className="text-lg font-bold text-gray-900">내 정보 & 설정</h1>
        </div>
        <button onClick={handleSave} className="text-orange-500 font-bold flex items-center text-sm">
            <Save size={16} className="mr-1" /> 저장
        </button>
      </div>

      <div className="p-6">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col items-center mb-6">
          <div className="w-20 h-20 rounded-full bg-gray-100 mb-4 overflow-hidden border-4 border-white shadow-md">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.nickname} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <UserIcon size={32} className="text-gray-400" />
              </div>
            )}
          </div>
          <h2 className="text-lg font-bold text-gray-900">{user.nickname}</h2>
          <p className="text-xs text-gray-500">{user.email}</p>
        </div>

        {/* Preferences Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <h3 className="font-bold text-gray-900 mb-4 text-sm">AI 맞춤 설정</h3>
            
            {/* Allergies - Chip Selection */}
            <div className="mb-6">
                <label className="block text-xs font-bold text-gray-500 mb-2">알러지 / 못 먹는 재료 (AI 절대 제외)</label>
                <div className="flex flex-wrap gap-2 mb-3">
                    {COMMON_ALLERGENS.map(item => {
                        const isSelected = allergies.includes(item);
                        return (
                            <button
                                key={item}
                                onClick={() => toggleTag(item, allergies, setAllergies)}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                                    isSelected 
                                    ? 'bg-red-500 text-white shadow-md ring-2 ring-red-200' 
                                    : 'bg-gray-50 text-gray-600 border border-gray-200'
                                }`}
                            >
                                {item}
                            </button>
                        );
                    })}
                </div>
                {/* Custom Input */}
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={allergiesInput}
                        onChange={(e) => setAllergiesInput(e.target.value)}
                        placeholder="기타 알러지 직접 입력"
                        className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                        onKeyPress={(e) => e.key === 'Enter' && handleAddCustomTag(allergiesInput, setAllergiesInput, allergies, setAllergies)}
                    />
                    <button 
                        onClick={() => handleAddCustomTag(allergiesInput, setAllergiesInput, allergies, setAllergies)}
                        className="bg-gray-100 text-gray-600 px-3 py-2 rounded-lg text-xs font-bold"
                    >
                        <Plus size={16} />
                    </button>
                </div>
                {allergies.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                        {allergies.map(tag => !COMMON_ALLERGENS.includes(tag) && (
                            <span key={tag} className="bg-red-50 text-red-500 px-2 py-1 rounded-md text-xs font-medium flex items-center">
                                {tag} <button onClick={() => toggleTag(tag, allergies, setAllergies)} className="ml-1"><Trash2 size={10}/></button>
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Disliked Foods - Chip Selection */}
            <div className="mb-6">
                <label className="block text-xs font-bold text-gray-500 mb-2">싫어하는 음식 (AI 선호도 낮음)</label>
                <div className="flex flex-wrap gap-2 mb-3">
                    {COMMON_DISLIKED_FOODS.map(item => {
                        const isSelected = dislikedFoods.includes(item);
                        return (
                            <button
                                key={item}
                                onClick={() => toggleTag(item, dislikedFoods, setDislikedFoods)}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                                    isSelected 
                                    ? 'bg-gray-800 text-white shadow-md' 
                                    : 'bg-gray-50 text-gray-600 border border-gray-200'
                                }`}
                            >
                                {item}
                            </button>
                        );
                    })}
                </div>
                {/* Custom Input */}
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={dislikedInput}
                        onChange={(e) => setDislikedInput(e.target.value)}
                        placeholder="기타 싫어하는 음식 입력"
                        className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                        onKeyPress={(e) => e.key === 'Enter' && handleAddCustomTag(dislikedInput, setDislikedInput, dislikedFoods, setDislikedFoods)}
                    />
                    <button 
                        onClick={() => handleAddCustomTag(dislikedInput, setDislikedInput, dislikedFoods, setDislikedFoods)}
                        className="bg-gray-100 text-gray-600 px-3 py-2 rounded-lg text-xs font-bold"
                    >
                         <Plus size={16} />
                    </button>
                </div>
                {dislikedFoods.length > 0 && (
                     <div className="mt-2 flex flex-wrap gap-1">
                        {dislikedFoods.map(tag => !COMMON_DISLIKED_FOODS.includes(tag) && (
                            <span key={tag} className="bg-gray-100 text-gray-600 px-2 py-1 rounded-md text-xs font-medium flex items-center">
                                {tag} <button onClick={() => toggleTag(tag, dislikedFoods, setDislikedFoods)} className="ml-1"><Trash2 size={10}/></button>
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Spiciness */}
            <div className="mb-4">
                <label className="block text-xs font-bold text-gray-500 mb-2">맵기 선호도</label>
                <div className="flex gap-2 bg-gray-50 p-1 rounded-xl">
                    {[1, 2, 3].map(level => (
                        <button
                            key={level}
                            onClick={() => setSpicinessLevel(level)}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                                spicinessLevel === level ? 'bg-white shadow text-orange-600' : 'text-gray-400'
                            }`}
                        >
                            {level === 1 ? '순한맛' : level === 2 ? '보통' : '매운맛'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Cooking Skill */}
            <div className="mb-2">
                <label className="block text-xs font-bold text-gray-500 mb-2">요리 실력</label>
                <select 
                    value={cookingSkill}
                    onChange={(e) => setCookingSkill(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                >
                    <option value="Beginner">초보 (간단한 조리만)</option>
                    <option value="Intermediate">중수 (레시피 보고 가능)</option>
                    <option value="Advanced">고수 (자유로운 요리)</option>
                </select>
            </div>
        </div>

        {/* Account Settings */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <button 
            onClick={handleLogout}
            className="w-full px-6 py-4 text-left flex items-center gap-3 hover:bg-gray-50 transition border-b border-gray-100 text-gray-700"
          >
            <LogOut size={16} className="text-gray-600" />
            <span className="font-medium text-sm">로그아웃</span>
          </button>
          
          <button 
            onClick={handleDelete}
            className="w-full px-6 py-4 text-left flex items-center gap-3 hover:bg-red-50 transition text-red-500"
          >
             <Trash2 size={16} className="text-red-500" />
            <span className="font-medium text-sm">회원 탈퇴</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;