import React, { type ReactNode, useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './Tooltip.css';

type TooltipVariant = 'color-match' | 'glass-card';

interface TooltipProps {
  children: ReactNode;
  content: ReactNode;
  variant?: TooltipVariant;
  
  // Custom colors for 'color-match' variant
  bgColor?: string;
  textColor?: string;
  borderColor?: string;
  shadowColor?: string;
  blur?: boolean;
  
  // Placement (default to top center for color-match, left side for glass-card)
  placement?: 'top' | 'left' | 'right' | 'bottom';
  
  // Additional classes
  className?: string;
  style?: React.CSSProperties; // add passing style to container
}

export const Tooltip: React.FC<TooltipProps> = ({ 
  children, 
  content, 
  variant = 'color-match', 
  bgColor = '#fbbf24', 
  textColor = '#18181b', 
  borderColor,
  shadowColor,
  blur = false,
  placement,
  className = '',
  style
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, height: 0, isReady: false });
  const containerRef = useRef<HTMLDivElement>(null);

  const effectivePlacement = placement || (variant === 'glass-card' ? 'left' : 'top');

  const updateCoords = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setCoords({
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      isReady: true,
    });
  };

  const handleMouseEnter = () => {
    if (className.includes('no-tooltip-hover')) return;
    updateCoords();
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  useEffect(() => {
    if (isVisible) {
      window.addEventListener('scroll', updateCoords, true);
      window.addEventListener('resize', updateCoords);
      return () => {
        window.removeEventListener('scroll', updateCoords, true);
        window.removeEventListener('resize', updateCoords);
      };
    }
  }, [isVisible]);

  const inlineStyles: React.CSSProperties & { [key: string]: any } = {};

  if (variant === 'color-match') {
    inlineStyles['--tooltip-bg'] = bgColor;
    inlineStyles['--tooltip-color'] = textColor;
    if (borderColor) inlineStyles['--tooltip-border'] = `1px solid ${borderColor}`;
    if (shadowColor) inlineStyles['--tooltip-shadow'] = `0 4px 12px ${shadowColor}`;
    if (blur) inlineStyles['--tooltip-blur'] = 'blur(8px)';
  }

  const portalContent = isVisible && coords.isReady ? createPortal(
    <div style={{ position: 'fixed', top: coords.top, left: coords.left, width: coords.width, height: coords.height, pointerEvents: 'none', zIndex: 99999 }}>
      <div 
        className={`global-tooltip tooltip-${variant} tooltip-pos-${effectivePlacement} tooltip-visible`}
        style={inlineStyles as React.CSSProperties}
      >
        {variant === 'color-match' && (
          <svg className="tooltip-arrow" width="10" height="5" viewBox="0 0 10 5">
            <polygon points="0,0 5,5 10,0" />
          </svg>
        )}
        <div className="tooltip-content-inner">
          {content}
        </div>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <div 
      className={`global-tooltip-container ${className}`} 
      style={style} 
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {portalContent}
    </div>
  );
};
