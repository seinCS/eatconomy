
import React, { useState, useEffect } from 'react';
import { useApp } from '../App';
import { getAllRecipes } from '../services/recipeService';
import { Recipe } from '../types';
import SwipeCard from '../components/SwipeCard';
import { X, Heart, Check, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

const SwipePage: React.FC = () => {
  const { addLikedRecipe, addDislikedRecipe, generatePlan, preferences } = useApp();
  const navigate = useNavigate();
  const [cards, setCards] = useState<Recipe[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Set number of cards to swipe
  const TOTAL_CARDS = 10; 

  useEffect(() => {
    // Load recipes and shuffle
    const all = getAllRecipes();
    
    // Filter out recipes that contain allergenic ingredients
    const safeRecipes = all.filter(recipe => {
        if (!preferences?.allergies || preferences.allergies.length === 0) return true;
        
        // Check if any ingredient in the recipe matches an allergy
        const hasAllergen = recipe.ingredients.some(ing => 
            preferences.allergies.includes(ing)
        );
        return !hasAllergen;
    });

    const shuffled = [...safeRecipes].sort(() => 0.5 - Math.random()).slice(0, TOTAL_CARDS);
    setCards(shuffled);
  }, [preferences]);

  const handleSwipe = (direction: 'left' | 'right') => {
    const recipe = cards[currentIndex];
    
    if (direction === 'right') {
      addLikedRecipe(recipe);
    } else {
      addDislikedRecipe(recipe);
    }
    
    setCurrentIndex(prev => prev + 1);
  };

  const finishSwiping = async () => {
    await generatePlan(); // Trigger logic update based on likes and dislikes
    navigate('/plan');
  };

  const isFinished = currentIndex >= cards.length;

  const handleBack = () => {
    // Prevent accidental exit if progress has been made
    if (currentIndex > 0 && !isFinished) {
        if (window.confirm("지금 나가시면 선택 내역이 초기화됩니다. 정말 나가시겠습니까?")) {
            navigate(-1);
        }
    } else {
        navigate(-1);
    }
  };

  // -- Result Screen --
  if (isFinished) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-6 text-center bg-white">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
          <Check size={40} className="text-green-600" />
        </div>
        <h2 className="text-2xl font-bold mb-2 text-gray-900">메뉴 선정 완료!</h2>
        <p className="text-gray-500 mb-8">선택하신 취향을 반영해<br/>일주일 식단을 구성했습니다.</p>
        <button 
          onClick={finishSwiping}
          className="w-full max-w-xs bg-orange-500 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-orange-600 transition active:scale-95"
        >
          식단표 확인하러 가기
        </button>
      </div>
    );
  }

  // -- Swipe Screen --
  return (
    <div className="h-screen overflow-hidden flex flex-col bg-gray-50">
      {/* Header */}
      <div className="px-4 py-4 flex items-center justify-between bg-white z-50 shadow-sm relative">
        <button onClick={handleBack} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full">
            <ChevronLeft size={24} />
        </button>
        <div className="flex flex-col items-center">
            <span className="text-xs font-bold text-gray-400">MENU PICK</span>
            <div className="flex items-center gap-1 text-sm font-bold text-gray-800">
                <span>{currentIndex + 1}</span>
                <span className="text-gray-300">/</span>
                <span>{TOTAL_CARDS}</span>
            </div>
        </div>
        <div className="w-10"></div> {/* Spacer for centering */}
        
        {/* Progress Bar Line */}
        <div className="absolute bottom-0 left-0 h-1 bg-gray-100 w-full">
            <div 
                className="h-full bg-orange-500 transition-all duration-300"
                style={{ width: `${((currentIndex) / TOTAL_CARDS) * 100}%` }}
            ></div>
        </div>
      </div>

      {/* Cards Area */}
      <div className="flex-1 relative w-full max-w-md mx-auto mt-6 px-4">
        <AnimatePresence>
            {/* Render items in reverse order so the current index is on top */}
             {cards.slice(currentIndex, currentIndex + 2).reverse().map((recipe, index) => {
                const isTop = recipe.id === cards[currentIndex].id;
                return (
                    <div key={recipe.id} className={`absolute inset-0 pb-32 ${isTop ? 'z-10' : 'z-0'}`}>
                         <SwipeCard 
                            recipe={recipe} 
                            onSwipe={handleSwipe}
                         />
                    </div>
                )
             })}
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="h-24 px-10 flex justify-between items-center w-full max-w-md mx-auto mb-10 z-20">
        <button 
          onClick={() => handleSwipe('left')}
          className="w-16 h-16 bg-white rounded-full shadow-xl flex items-center justify-center text-red-500 hover:bg-red-50 transition border border-red-50 active:scale-90"
        >
          <X size={32} />
        </button>
        <span className="text-xs font-medium text-gray-400 bg-white/50 px-3 py-1 rounded-full backdrop-blur-sm">
            Swipe
        </span>
        <button 
          onClick={() => handleSwipe('right')}
          className="w-16 h-16 bg-orange-500 rounded-full shadow-xl shadow-orange-200 flex items-center justify-center text-white hover:bg-orange-600 transition active:scale-90"
        >
          <Heart size={32} fill="currentColor" />
        </button>
      </div>
    </div>
  );
};

export default SwipePage;
