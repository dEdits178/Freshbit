import { GraduationCap } from 'lucide-react';
import { cn } from '../../utils/helpers';

const Logo = ({ variant = 'dark', showText = true, size = 'md' }) => {
  const sizes = {
    sm: { wrap: 'w-8 h-8', icon: 'w-4 h-4', text: 'text-base' },
    md: { wrap: 'w-10 h-10', icon: 'w-5 h-5', text: 'text-lg' },
    lg: { wrap: 'w-12 h-12', icon: 'w-6 h-6', text: 'text-xl' }
  };

  const tones = {
    dark: {
      wrap: 'bg-primary-600 text-white',
      text: 'text-primary-700'
    },
    light: {
      wrap: 'bg-white/20 text-white border border-white/30',
      text: 'text-white'
    }
  };

  return (
    <div className="inline-flex items-center gap-3">
      <div
        className={cn(
          'rounded-xl flex items-center justify-center shadow-sm',
          sizes[size].wrap,
          tones[variant].wrap
        )}
      >
        <GraduationCap className={sizes[size].icon} />
      </div>

      {showText && (
        <div className="leading-tight">
          <p className={cn('font-extrabold tracking-tight', sizes[size].text, tones[variant].text)}>FreshBit</p>
          <p className={cn('text-xs', variant === 'light' ? 'text-gray-200' : 'text-gray-500')}>Placement OS</p>
        </div>
      )}
    </div>
  );
};

export default Logo;
