import React from 'react';
import { motion, PanInfo } from 'framer-motion';
import { Recipe } from '../types';
import { Clock, Flame } from 'lucide-react';

interface SwipeCardProps {
  recipe: Recipe;
  onSwipe: (direction: 'left' | 'right') => void;
}

const SwipeCard: React.FC<SwipeCardProps> = ({ recipe, onSwipe }) => {
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x > 100) {
      onSwipe('right');
    } else if (info.offset.x < -100) {
      onSwipe('left');
    }
  };

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      className="absolute w-full h-full max-h-[60vh] bg-white rounded-2xl shadow-xl overflow-hidden cursor-grab active:cursor-grabbing border border-gray-100"
      whileTap={{ scale: 0.98 }}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="h-2/3 bg-gray-200 relative">
        <img 
          src={`https://picsum.photos/seed/${recipe.id}/400/500`} 
          alt={recipe.name} 
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/60 to-transparent p-6 pt-12">
          <h2 className="text-3xl font-bold text-white mb-2">{recipe.name}</h2>
          <div className="flex gap-2 flex-wrap">
            {recipe.tags.map(tag => (
              <span key={tag} className="px-2 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs text-white font-medium">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center text-gray-600">
            <Clock size={18} className="mr-1" />
            <span>{recipe.time}</span>
          </div>
          <div className="flex items-center text-gray-600">
            <Flame size={18} className="mr-1" />
            <span>{recipe.calories} kcal</span>
          </div>
        </div>
        
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-gray-400 uppercase mb-2">핵심 재료</h3>
          <p className="text-gray-800 leading-relaxed">
            {recipe.ingredients.slice(0, 5).join(', ')}
            {recipe.ingredients.length > 5 && '...'}
          </p>
        </div>
      </div>

      {/* Overlay indicators for drag */}
      <motion.div 
        className="absolute top-8 right-8 px-4 py-2 border-4 border-green-500 rounded-lg text-green-500 font-bold text-2xl transform rotate-12 opacity-0"
        style={{ x: 100 }} // Placeholder for animation logic, simplified for MVP
      >
        LIKE
      </motion.div>
    </motion.div>
  );
};

export default SwipeCard;
