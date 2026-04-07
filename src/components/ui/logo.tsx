'use client';

import Image from 'next/image';
import { useState } from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'white';
}

export function Logo({ className = '', size = 'md', variant = 'default' }: LogoProps) {
  const [imageError, setImageError] = useState(false);
  
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

  return (
    <div className={`${sizeClasses[size]} ${variantClasses[variant]} ${className} flex items-center justify-center`}>
      {!imageError ? (
        <Image
          src="/logo.svg"
          alt="BeautyPro Logo"
          width={size === 'sm' ? 32 : size === 'md' ? 40 : size === 'lg' ? 48 : 64}
          height={size === 'sm' ? 32 : size === 'md' ? 40 : size === 'lg' ? 48 : 64}
          className="object-contain"
          onError={() => setImageError(true)}
          priority
        />
      ) : (
        <div className="font-bold text-xl">
          BP
        </div>
      )}
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
