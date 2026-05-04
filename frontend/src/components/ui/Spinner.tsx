import React from 'react';
import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };

const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className = '' }) => (
  <div className={`flex items-center justify-center ${className}`}>
    <Loader2 className={`${sizes[size]} animate-spin text-blue-600`} />
  </div>
);

export default Spinner;
