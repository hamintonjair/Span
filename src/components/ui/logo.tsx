'use client';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'white';
}

export function Logo({ className = '', size = 'md', variant = 'default' }: LogoProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  const variantClasses = {
    default: 'text-amber-600',
    white: 'text-white'
  };

  const svgSize = {
    sm: 32,
    md: 40,
    lg: 48,
    xl: 64
  };

  return (
    <div className={`${sizeClasses[size]} ${variantClasses[variant]} ${className} flex items-center justify-center`}>
      <svg 
        width={svgSize[size]} 
        height={svgSize[size]} 
        viewBox="0 0 32 32" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="object-contain"
      >
        <circle cx="16" cy="16" r="16" fill="#1f2937"/>
        <text x="8" y="20" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="bold" fill="white">AS</text>
        <rect x="20" y="14" width="8" height="1" fill="#3b82f6"/>
        <rect x="20" y="17" width="6" height="1" fill="#3b82f6"/>
        <rect x="20" y="20" width="4" height="1" fill="#3b82f6"/>
      </svg>
    </div>
  );
}

export function LogoIcon({ className = '', size = 'md' }: { className?: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10'
  };

  return (
    <div className={`${sizeClasses[size]} ${className} bg-amber-600 rounded-lg flex items-center justify-center`}>
      <span className="text-white font-bold text-xs">
        BP
      </span>
    </div>
  );
}
