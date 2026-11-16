import { useWindowDimensions } from "react-native";

export const BREAKPOINTS = {
  compact: 640,
  tablet: 900,
  wide: 1280,
  ultra: 1600,
} as const;

export interface Responsive {
  width: number;
  height: number;
  isCompact: boolean;
  isTablet: boolean;
  isWide: boolean;
  isUltra: boolean;
  /** Maximum readable content width for the current screen size. */
  contentWidth: number;
  /** 1 on phones, 2 on tablets, 3 on wide desktops. */
  columns: 1 | 2 | 3;
}

/**
 * Layout decisions for phones through ultrawide desktops.
 *
 * The previous build rendered a single ~768px column at every size, so a
 * desktop browser showed a phone screen in the middle of the page.
 */
export function useResponsive(): Responsive {
  const { width, height } = useWindowDimensions();
  const isWide = width >= BREAKPOINTS.wide;
  const isUltra = width >= BREAKPOINTS.ultra;
  return {
    width,
    height,
    isCompact: width < BREAKPOINTS.compact,
    isTablet: width >= BREAKPOINTS.compact && width < BREAKPOINTS.wide,
    isWide,
    isUltra,
    contentWidth: Math.min(width - 32, isUltra ? 1520 : 1180),
    columns: isUltra ? 3 : isWide ? 2 : 1,
  };
}
