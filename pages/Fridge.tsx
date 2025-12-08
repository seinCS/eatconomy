
import React, { useState, useMemo } from 'react';
import { useApp } from '../App';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Refrigerator, Search, X, Loader2 } from 'lucide-react';
import { INGREDIENT_CATEGORIES, MASTER_INGREDIENTS } from '../constants';

const FridgePage: React.FC = () => {
  const { fridge, toggleFridgeItem, generateAIPlan, isGeneratingPlan } = useApp();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const handleStartPlanning = async () => {
    if (fridge.length === 0) {
        alert("냉장고에 재료를 최소 1개 이상 넣어주세요!");
        return;
    }

    // Updated Confirmation Text
    if (window.confirm("현재 재료와 취향을 분석해 최적의 식단을 구성합니다. 시작할까요?")) {
        // NOTE: Do not reset session here to keep Swipe preferences
        await generateAIPlan();
        navigate('/plan');
    }
  };

  const getEmoji = (name: string, category: string) => {
    if (name.includes('계란')) return '🥚';
    if (name.includes('김치')) return '🥬';
    if (name.includes('고기')) return '🥩';
    if (name.includes('양파')) return '🧅';
    if (name.includes('두부')) return '🧊';
    if (name.includes('스팸') || name.includes('참치')) return '🥫';
    if (name.includes('면') || name.includes('라면')) return '🍜';
    if (name.includes('밥')) return '🍚';
    if (name.includes('빵')) return '🍞';
    if (name.includes('치즈')) return '🧀';
    if (name.includes('우유')) return '🥛';
    if (name.includes('오징어') || name.includes('새우')) return '🦑';
    if (name.includes('어묵')) return '🍢';
    
    // Category Fallbacks
    if (category === INGREDIENT_CATEGORIES.VEGETABLES) return '🥦';
    if (category === INGREDIENT_CATEGORIES.MEAT) return '🍖';
    if (category === INGREDIENT_CATEGORIES.SEAFOOD) return '🐟';
    if (category === INGREDIENT_CATEGORIES.DAIRY) return '🥛';
    if (category === INGREDIENT_CATEGORIES.SAUCES) return '🧂';
    if (category === INGREDIENT_CATEGORIES.PROCESSED) return '🍱';
    return '🥘';
  };

  // Filter and grouping logic
  const filteredIngredients = useMemo(() => {
    if (searchTerm.trim() === "") return null;
    return MASTER_INGREDIENTS.filter(item => 
        item.name.includes(searchTerm)
    );
  }, [searchTerm]);

  const categorizedIngredients = useMemo(() => {
    const grouped: Record<string, typeof MASTER_INGREDIENTS> = {};
    Object.values(INGREDIENT_CATEGORIES).forEach(cat => {
        grouped[cat] = [];
    });
    
    MASTER_INGREDIENTS.forEach(item => {
        if (grouped[item.category]) {
            grouped[item.category].push(item);
        }
    });
    return grouped;
  }, []);

  // Helper to render an item
  const renderItem = (item: {name: string, category: string}) => {
    const hasItem = fridge.includes(item.name);
    return (
        <div 
            key={item.name} 
            onClick={() => toggleFridgeItem(item.name)}
            className={`aspect-square rounded-xl border flex flex-col items-center justify-center cursor-pointer transition-all active:scale-95 relative overflow-hidden ${
                hasItem 
                ? 'bg-orange-50 border-orange-200 shadow-sm' 
                : 'bg-white border-gray-100'
            }`}
        >
            <span className="text-2xl mb-1 filter drop-shadow-sm">
                {getEmoji(item.name, item.category)}
            </span>
            <span className={`text-xs font-bold text-center px-1 break-keep ${hasItem ? 'text-gray-900' : 'text-gray-400'}`}>
                {item.name}
            </span>
            
            {hasItem && (
                <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full ring-2 ring-white"></div>
            )}
        </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-24 relative">
        {/* Loading Overlay */}
        {isGeneratingPlan && (
            <div className="absolute inset-0 bg-white/80 z-[70] flex flex-col items-center justify-center backdrop-blur-sm">
                <Loader2 size={48} className="text-orange-500 animate-spin mb-4" />
                <h2 className="text-lg font-bold text-gray-900">맞춤 식단을 분석 중이에요</h2>
                <p className="text-sm text-gray-500">재료와 취향을 계산하는 중...</p>
            </div>
        )}

        {/* Sticky Header with Search */}
        <div className="sticky top-0 bg-white z-40 border-b border-gray-100 shadow-sm px-6 pt-6 pb-4">
             <div className="flex justify-between items-center mb-4">
                <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Refrigerator className="text-orange-500" size={24}/>
                    내 냉장고 관리
                </h1>
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
                    {fridge.length}개 보유중
                </span>
            </div>
            
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input 
                    type="text" 
                    placeholder="재료 검색 (예: 계란, 양파)" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-50 text-gray-800 rounded-xl py-3 pl-10 pr-10 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm font-medium placeholder-gray-400"
                />
                {searchTerm && (
                    <button 
                        onClick={() => setSearchTerm("")}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>
        </div>

        {/* Content Area */}
        <div className="p-6">
            {searchTerm ? (
                // --- Search Results ---
                <div>
                     <h2 className="text-sm font-bold text-gray-500 mb-4 flex items-center">
                        '<span className="text-orange-500">{searchTerm}</span>' 검색 결과
                    </h2>
                    {filteredIngredients && filteredIngredients.length > 0 ? (
                        <div className="grid grid-cols-4 gap-2">
                            {filteredIngredients.map(item => renderItem(item))}
                        </div>
                    ) : (
                        <div className="py-12 text-center text-gray-400 text-sm">
                            검색된 재료가 없습니다.
                        </div>
                    )}
                </div>
            ) : (
                // --- Categorized View ---
                <div className="space-y-8">
                     {Object.entries(categorizedIngredients).map(([category, items]) => (
                        <div key={category}>
                            <h3 className="text-sm font-bold text-gray-500 mb-3 pl-1 border-l-4 border-orange-500 leading-none">
                                {category}
                            </h3>
                            <div className="grid grid-cols-4 gap-2">
                                {items.map(item => renderItem(item))}
                            </div>
                        </div>
                     ))}
                </div>
            )}
        </div>

        {/* Floating Action Button area - Z-index 60 - Fixed Layout */}
        <div className="fixed bottom-24 left-0 w-full px-6 flex justify-center z-[60]">
            <div className="w-full max-w-md">
                <button 
                    onClick={handleStartPlanning}
                    disabled={isGeneratingPlan}
                    className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold text-lg shadow-xl flex items-center justify-center group active:scale-98 transition-transform disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    <Sparkles className="mr-2 text-yellow-400 group-hover:rotate-12 transition-transform" />
                    {isGeneratingPlan ? '분석 중...' : '이 재료로 식단 추천받기'}
                </button>
            </div>
        </div>
    </div>
  );
};

export default FridgePage;
