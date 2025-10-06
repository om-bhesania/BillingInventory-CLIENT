import { useState, useEffect } from 'react';

interface BreakpointConfig {
  sm: number;
  md: number;
  lg: number;
  xl: number;
  '2xl': number;
}

const defaultBreakpoints: BreakpointConfig = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

type Breakpoint = keyof BreakpointConfig;

export const useResponsive = (breakpoints: BreakpointConfig = defaultBreakpoints) => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowSize.width < breakpoints.md;
  const isTablet = windowSize.width >= breakpoints.md && windowSize.width < breakpoints.lg;
  const isDesktop = windowSize.width >= breakpoints.lg;
  const isLargeScreen = windowSize.width >= breakpoints.xl;

  const isBreakpoint = (breakpoint: Breakpoint) => {
    return windowSize.width >= breakpoints[breakpoint];
  };

  const isBelowBreakpoint = (breakpoint: Breakpoint) => {
    return windowSize.width < breakpoints[breakpoint];
  };

  const isAboveBreakpoint = (breakpoint: Breakpoint) => {
    return windowSize.width >= breakpoints[breakpoint];
  };

  return {
    width: windowSize.width,
    height: windowSize.height,
    isMobile,
    isTablet,
    isDesktop,
    isLargeScreen,
    isBreakpoint,
    isBelowBreakpoint,
    isAboveBreakpoint,
    breakpoints,
  };
};

export default useResponsive;
