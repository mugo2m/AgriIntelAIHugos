// lib/hooks/useMobile.ts
import { useState, useEffect } from 'react';

export interface MobileInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  orientation: 'portrait' | 'landscape';
  windowSize: {
    width: number;
    height: number;
  };
  isPortrait: boolean;
  isLandscape: boolean;
  pixelRatio: number;
  isTouchDevice: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  safeAreaInsets: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

export const useMobile = (): MobileInfo => {
  const [info, setInfo] = useState<MobileInfo>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    orientation: 'portrait',
    windowSize: { width: 0, height: 0 },
    isPortrait: true,
    isLandscape: false,
    pixelRatio: 1,
    isTouchDevice: false,
    isIOS: false,
    isAndroid: false,
    safeAreaInsets: { top: 0, bottom: 0, left: 0, right: 0 }
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const pixelRatio = window.devicePixelRatio || 1;

      // Detect device type
      const isMobile = width <= 640;
      const isTablet = width > 640 && width <= 1024;
      const isDesktop = width > 1024;

      // Detect orientation
      const isPortrait = height > width;
      const orientation = isPortrait ? 'portrait' : 'landscape';

      // Detect touch device
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

      // Detect OS
      const userAgent = navigator.userAgent;
      const isIOS = /iPad|iPhone|iPod/.test(userAgent) ||
                   (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      const isAndroid = /Android/.test(userAgent);

      // Get safe area insets (for notched phones)
      const safeAreaInsets = {
        top: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sat') || '0'),
        bottom: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sab') || '0'),
        left: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sal') || '0'),
        right: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sar') || '0')
      };

      setInfo({
        isMobile,
        isTablet,
        isDesktop,
        orientation,
        windowSize: { width, height },
        isPortrait,
        isLandscape: !isPortrait,
        pixelRatio,
        isTouchDevice,
        isIOS,
        isAndroid,
        safeAreaInsets
      });
    };

    // Initial call
    handleResize();

    // Add event listeners
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return info;
};

// Utility function for conditional styling
export const getMobileStyles = (
  base: string,
  mobile: string,
  tablet?: string
): ((info: MobileInfo) => string) => {
  return (info: MobileInfo) => {
    if (info.isMobile) return `${base} ${mobile}`;
    if (info.isTablet && tablet) return `${base} ${tablet}`;
    return base;
  };
};