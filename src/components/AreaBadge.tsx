import React from 'react';
import { getAreaStyle } from '../utils/areaColor';
import { Briefcase, Zap, Sparkles, Heart } from 'lucide-react';

interface AreaBadgeProps {
  area?: string;
  projectName?: string;
  className?: string;
  useLetter?: boolean;
}

export const AreaBadge: React.FC<AreaBadgeProps> = ({
  area,
  projectName,
  className = '',
  useLetter = false,
}) => {
  const style = getAreaStyle(area, projectName);

  const renderIcon = () => {
    if (useLetter) {
      return <span>{style.letter}</span>;
    }
    switch (style.area) {
      case 'Career':
        return <Briefcase className="w-4 h-4 stroke-[2.2]" />;
      case 'Magneto':
        return <Zap className="w-4 h-4 fill-current stroke-none" />;
      case 'Shamanicca':
        return <Sparkles className="w-4 h-4 stroke-[2.2]" />;
      case 'Wellness':
        return <Heart className="w-4 h-4 fill-current stroke-none" />;
      default:
        return <span>{style.letter}</span>;
    }
  };

  return (
    <div
      className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center font-bold text-xs select-none transition-transform duration-200 group-hover:scale-105 ${style.badgeBg15} ${style.badgeText} ${className}`}
      title={`${style.area} Area`}
      style={{
        backgroundColor: `${style.hexColor}26`, // 15% opacity
        color: style.hexColor,
      }}
    >
      {renderIcon()}
    </div>
  );
};
