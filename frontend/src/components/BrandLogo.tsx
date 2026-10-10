import React from 'react';
import { useTheme } from '../context/ThemeContext';

export interface BrandLogoProps {
  /** Tamaño predefinido del símbolo */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Variante de color: 'auto' selecciona según tema claro/oscuro */
  variant?: 'auto' | 'default' | 'light' | 'dark' | 'mono' | 'white';
  /** Clases CSS adicionales */
  className?: string;
  /** Mostrar con animación sutil de espera/carga */
  isLoading?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'sm',
  variant = 'auto',
  className = '',
  isLoading = false,
}) => {
  const { theme } = useTheme();

  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  // Selección de activo optimizado según contraste de superficie
  let logoSrc = '/brand/credirisk-logo.png';
  if (variant === 'light' || (variant === 'auto' && theme === 'light')) {
    logoSrc = '/brand/credirisk-logo-light.png';
  } else if (variant === 'dark' || (variant === 'auto' && theme === 'dark')) {
    logoSrc = '/brand/credirisk-logo-dark.png';
  } else if (variant === 'mono') {
    logoSrc = '/brand/credirisk-logo-mono.png';
  } else if (variant === 'white') {
    logoSrc = '/brand/credirisk-logo-white.png';
  }

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${sizeClasses[size]} ${className}`}>
      <img
        src={logoSrc}
        alt="CrediRisk"
        className={`w-full h-full object-contain select-none transition-all duration-200 ${
          isLoading ? 'animate-pulse opacity-80' : 'opacity-100'
        }`}
        loading="eager"
        decoding="async"
      />
    </div>
  );
};

export default BrandLogo;
