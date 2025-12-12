import React, { useState } from 'react';
import { useApp } from '../App';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Globe, MessageSquare, AlertCircle, ChefHat } from 'lucide-react';
import { UserPreferences } from '../types';
import { COMMON_ALLERGENS, COMMON_DISLIKED_FOODS } from '../constants';

const OnboardingPage: React.FC = () => {
  const { user, updatePreferences } = useApp();
  const navigate = useNavigate();

  // State
  const [allergies, setAllergies] = useState<string[]>([]);
  const [dislikedFoods, setDislikedFoods] = useState<string[]>([]);
  const [cookingSkill, setCookingSkill] = useState<string>('Beginner');
  const [isSaving, setIsSaving] = useState(false);

  const toggleTag = (tag: string, list: string[], setList: (v: string[]) => void) => {
    if (list.includes(tag)) {
      setList(list.filter(t => t !== tag));
    } else {
      setList([...list, tag]);
    }
  };

  const handleContinue = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const prefs: UserPreferences = {
        allergies,
        dislikedFoods,
        spicinessLevel: 2, // 기본값 유지 (사용하지 않음)
        cookingSkill,
      };
      await updatePreferences(prefs);
      // 저장 완료 후 홈으로 이동
      navigate('/');
    } catch (error) {
      console.error('온보딩 저장 실패:', error);
      alert('설정 저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white px-6 py-6 text-center border-b border-gray-100">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">선호도 설정</h1>
        <p className="text-gray-500 text-sm">맞춤형 식단 추천을 위해 선호도를 알려주세요 (선택사항)</p>
      </div>

      <div className="px-6 py-6 pb-32">
        {/* 알러지 섹션 */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <h2 className="text-lg font-bold text-gray-900">알러지 / 못 먹는 재료</h2>
          </div>
          <p className="text-xs text-gray-500 mb-4">선택한 재료는 절대 추천되지 않습니다 (선택사항)</p>
          <div className="flex flex-wrap gap-2">
            {COMMON_ALLERGENS.map(item => {
              const isSelected = allergies.includes(item);
              return (
                <button
                  key={item}
                  onClick={() => toggleTag(item, allergies, setAllergies)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    isSelected
                      ? 'bg-red-500 text-white shadow-md ring-2 ring-red-200'
                      : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {item}
                </button>
              );
            })}
          </div>
        </div>

        {/* 싫어하는 음식 섹션 */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-bold text-gray-900">싫어하는 음식</h2>
          </div>
          <p className="text-xs text-gray-500 mb-4">선택한 재료는 가능한 한 피해서 추천됩니다 (선택사항)</p>
          <div className="flex flex-wrap gap-2">
            {COMMON_DISLIKED_FOODS.map(item => {
              const isSelected = dislikedFoods.includes(item);
              return (
                <button
                  key={item}
                  onClick={() => toggleTag(item, dislikedFoods, setDislikedFoods)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    isSelected
                      ? 'bg-gray-800 text-white shadow-md'
                      : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {item}
                </button>
              );
            })}
          </div>
        </div>

        {/* 요리 실력 */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <ChefHat className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-bold text-gray-900">요리 실력</h2>
          </div>
          <select
            value={cookingSkill}
            onChange={(e) => setCookingSkill(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium"
          >
            <option value="Beginner">초보 (간단한 조리만)</option>
            <option value="Intermediate">중수 (레시피 보고 가능)</option>
            <option value="Advanced">고수 (자유로운 요리)</option>
          </select>
        </div>
      </div>

      {/* 하단 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-6">
        <button
          onClick={handleContinue}
          disabled={isSaving}
          className={`w-full py-4 rounded-xl font-bold text-white transition-all ${
            !isSaving
              ? 'bg-orange-500 hover:bg-orange-600 shadow-lg active:scale-95'
              : 'bg-gray-300 cursor-not-allowed'
          }`}
        >
          {isSaving ? '저장 중...' : '계속하기'}
        </button>
      </div>
    </div>
  );
};

export default OnboardingPage;

