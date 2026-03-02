import React from 'react';
import type { ElementType, ReactNode } from 'react';

export interface IconProps {
  symbol: ReactNode | ElementType;
  className?: string;
}

export const SvgIcon: React.FC<IconProps> = ({
  symbol,
  className = 'text-md',
}) => {
  return (
    <span className={`inline-block ${className}`}>
      {typeof symbol === 'function' ? React.createElement(symbol) : symbol}{' '}
    </span>
  );
};

export default SvgIcon;
