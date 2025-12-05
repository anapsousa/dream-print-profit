import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  className?: string;
}

export function Logo({ size = 'md', showSubtitle = false, className }: LogoProps) {
  const sizeClasses = {
    sm: {
      container: 'w-8 h-8 rounded-lg',
      icon: 'w-5 h-5',
      text: 'text-lg',
    },
    md: {
      container: 'w-10 h-10 rounded-xl shadow-soft',
      icon: 'w-6 h-6',
      text: 'text-xl',
    },
    lg: {
      container: 'w-12 h-12 rounded-xl shadow-soft',
      icon: 'w-7 h-7',
      text: 'text-2xl',
    },
  };

  const sizes = sizeClasses[size];

  return (
    <Link to="/" className={cn("flex items-center gap-3", className)}>
      <div className={cn("gradient-primary flex items-center justify-center", sizes.container)}>
        <Zap className={cn("text-primary-foreground", sizes.icon)} />
      </div>
      <div>
        <span className={cn("font-display font-bold", sizes.text)}>Dr3amToReal</span>
        {showSubtitle && (
          <p className="text-xs text-muted-foreground">Cost Calculator</p>
        )}
      </div>
    </Link>
  );
}
