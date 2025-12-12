import React, { useEffect, useState } from 'react';
import { useApp } from '../App';
import { generateShoppingList } from '../services/recipeService';
import { CheckCircle, Circle, ShoppingCart, ExternalLink } from 'lucide-react';
import { Recipe } from '../types';

const ListPage: React.FC = () => {
  const { plannedRecipes, fridge, shoppingListChecks, toggleShoppingItem } = useApp();
  const [items, setItems] = useState<{name: string, count: number, category: 'staple' | 'daily'}[]>([]);

  useEffect(() => {
    // WeeklyPlan을 전달
    const rawList = generateShoppingList(plannedRecipes, fridge);
    setItems(rawList);
  }, [plannedRecipes, fridge]);

  const completedCount = items.filter(i => shoppingListChecks[i.name]).length;

  const handleBuyClick = (e: React.MouseEvent, itemName: string) => {
      e.stopPropagation(); // Prevent toggling the checkbox
      const url = `https://www.coupang.com/np/search?q=${encodeURIComponent(itemName)}`;
      window.open(url, '_blank');
  };

  return (
    <div className="p-6 pb-24">
       <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <ShoppingCart className="mr-2 text-orange-500"/>
            장보기 목록
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
            냉장고에 없는 재료만 추렸어요.
        </p>
      </header>

      {/* 주간 구매 (Staples) */}
      {items.filter(i => i.category === 'staple').length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-4">
          <div className="p-4 bg-blue-50 border-b border-blue-100 flex justify-between items-center">
            <div>
              <span className="font-bold text-blue-700 text-sm">일주일 구매 (Staples)</span>
              <p className="text-xs text-blue-600 mt-0.5">일요일에 사두세요</p>
            </div>
            <span className="text-sm text-blue-600 font-semibold">
              {items.filter(i => i.category === 'staple').length}개
            </span>
          </div>
          
          <div className="divide-y divide-gray-100">
            {items.filter(i => i.category === 'staple').map((item, idx) => {
              const isChecked = !!shoppingListChecks[item.name];
              return (
                <div 
                  key={`staple-${item.name}`} 
                  onClick={() => toggleShoppingItem(item.name)}
                  className={`p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition ${isChecked ? 'bg-gray-50' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    {isChecked ? (
                      <CheckCircle className="text-green-500" size={20} />
                    ) : (
                      <Circle className="text-gray-300" size={20} />
                    )}
                    <div>
                      <span className={`font-medium ${isChecked ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                        {item.name}
                      </span>
                      {item.count > 1 && (
                        <span className="ml-2 text-[10px] font-bold bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full">
                          x{item.count}
                        </span>
                      )}
                    </div>
                  </div>

                  <button 
                    onClick={(e) => handleBuyClick(e, item.name)}
                    className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-full transition-colors flex items-center"
                    title="쿠팡에서 최저가 검색"
                  >
                    <ShoppingCart size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 당일 구매 (Daily) */}
      {items.filter(i => i.category === 'daily').length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 bg-orange-50 border-b border-orange-100 flex justify-between items-center">
            <div>
              <span className="font-bold text-orange-700 text-sm">당일 구매 (Daily)</span>
              <p className="text-xs text-orange-600 mt-0.5">요리 당일 퇴근길에 사세요</p>
            </div>
            <span className="text-sm text-orange-600 font-semibold">
              {items.filter(i => i.category === 'daily').length}개
            </span>
          </div>
          
          {items.filter(i => i.category === 'daily').length === 0 ? (
            <div className="p-10 text-center text-gray-400">
              당일 구매할 재료가 없어요!
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {items.filter(i => i.category === 'daily').map((item, idx) => {
                const isChecked = !!shoppingListChecks[item.name];
                return (
                  <div 
                    key={`daily-${item.name}`} 
                    onClick={() => toggleShoppingItem(item.name)}
                    className={`p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition ${isChecked ? 'bg-gray-50' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      {isChecked ? (
                        <CheckCircle className="text-green-500" size={20} />
                      ) : (
                        <Circle className="text-gray-300" size={20} />
                      )}
                      <div>
                        <span className={`font-medium ${isChecked ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                          {item.name}
                        </span>
                        {item.count > 1 && (
                          <span className="ml-2 text-[10px] font-bold bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full">
                            x{item.count}
                          </span>
                        )}
                      </div>
                    </div>

                    <button 
                      onClick={(e) => handleBuyClick(e, item.name)}
                      className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-full transition-colors flex items-center"
                      title="쿠팡에서 최저가 검색"
                    >
                      <ShoppingCart size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 재료가 없는 경우 */}
      {items.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-10 text-center text-gray-400">
            살 재료가 없어요! <br/> 냉장고 파먹기 대성공 🎉
          </div>
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 rounded-xl flex items-start gap-3">
        <div className="mt-1 bg-blue-100 p-1 rounded-full">
            <CheckCircle size={14} className="text-blue-600" />
        </div>
        <div>
            <h4 className="font-bold text-blue-800 text-sm">Chain Cooking 효과</h4>
            <p className="text-xs text-blue-600 mt-1">
                재료 연계 알고리즘 덕분에 약 15,000원의 식재료 낭비를 막았어요!
            </p>
        </div>
      </div>
    </div>
  );
};

export default ListPage;