// Yellow, Black, and White Theme
// High contrast design with yellow accents

export const stellarTheme = {
  // Primary Colors
  colors: {
    // Yellow - Primary accent color
    primary: '#FFD700', // Gold yellow
    primaryLight: '#FFE55C', // Light yellow
    primaryDark: '#B8860B', // Dark yellow
    
    // Secondary Yellow - Secondary accent
    secondary: '#FFA500', // Orange yellow
    secondaryLight: '#FFB84D', // Light orange
    secondaryDark: '#FF8C00', // Dark orange
    
    // Accent Colors
    accent: '#FFFF00', // Bright yellow
    accentLight: '#FFFF99', // Light bright yellow
    accentDark: '#CCCC00', // Dark bright yellow
    
    // Black and Gray Colors
    black: {
      50: '#F5F5F5',
      100: '#E5E5E5',
      200: '#CCCCCC',
      300: '#B3B3B3',
      400: '#999999',
      500: '#808080',
      600: '#666666',
      700: '#4D4D4D',
      800: '#333333',
      900: '#1A1A1A',
      950: '#000000', // Pure black
    },
    
    // Status Colors
    success: '#00FF00', // Bright green
    successLight: '#66FF66',
    successDark: '#00CC00',
    
    warning: '#FFD700', // Gold yellow
    warningLight: '#FFE55C',
    warningDark: '#B8860B',
    
    error: '#FF0000', // Bright red
    errorLight: '#FF6666',
    errorDark: '#CC0000',
    
    info: '#FFFF00', // Bright yellow
    infoLight: '#FFFF99',
    infoDark: '#CCCC00',
  },
  
  // Gradients
  gradients: {
    primary: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
    primaryHover: 'linear-gradient(135deg, #FFA500 0%, #FF8C00 100%)',
    secondary: 'linear-gradient(135deg, #FFFF00 0%, #FFD700 100%)',
    success: 'linear-gradient(135deg, #00FF00 0%, #00CC00 100%)',
    warning: 'linear-gradient(135deg, #FFD700 0%, #B8860B 100%)',
    error: 'linear-gradient(135deg, #FF0000 0%, #CC0000 100%)',
    dark: 'linear-gradient(135deg, #000000 0%, #1A1A1A 100%)',
    light: 'linear-gradient(135deg, #F5F5F5 0%, #E5E5E5 100%)',
  },
  
  // Background Colors
  backgrounds: {
    primary: '#000000', // Pure black
    secondary: '#1A1A1A', // Dark gray
    tertiary: '#333333', // Medium gray
    card: 'rgba(0, 0, 0, 0.8)', // Semi-transparent black card
    overlay: 'rgba(0, 0, 0, 0.9)', // Overlay background
    glass: 'rgba(255, 215, 0, 0.1)', // Glass effect with yellow tint
  },
  
  // Text Colors
  text: {
    primary: '#FFFFFF', // Pure white text
    secondary: '#FFD700', // Gold yellow text
    tertiary: '#FFFF00', // Bright yellow text
    muted: '#CCCCCC', // Light gray text
    inverse: '#000000', // Black text for light backgrounds
  },
  
  // Border Colors
  borders: {
    primary: 'rgba(255, 215, 0, 0.5)', // Gold yellow border
    secondary: 'rgba(255, 255, 0, 0.3)', // Bright yellow border
    muted: 'rgba(255, 255, 255, 0.2)', // White border
    success: 'rgba(0, 255, 0, 0.5)', // Success border
    warning: 'rgba(255, 215, 0, 0.5)', // Warning border
    error: 'rgba(255, 0, 0, 0.5)', // Error border
  },
  
  // Shadows
  shadows: {
    small: '0 1px 3px rgba(0, 0, 0, 0.3)',
    medium: '0 4px 6px rgba(0, 0, 0, 0.3)',
    large: '0 10px 15px rgba(0, 0, 0, 0.3)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.3)',
    yellow: '0 4px 12px rgba(255, 215, 0, 0.3)', // Yellow shadow
    yellowHover: '0 8px 24px rgba(255, 215, 0, 0.4)', // Yellow hover shadow
  },
  
  // Spacing
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
  },
  
  // Border Radius
  borderRadius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    '2xl': '1.5rem',
    full: '9999px',
  },
  
  // Typography
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'Monaco', 'Consolas', 'monospace'],
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },
  
  // Animation
  animation: {
    duration: {
      fast: '150ms',
      normal: '200ms',
      slow: '300ms',
    },
    easing: {
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    },
  },
} as const;

export type StellarTheme = typeof stellarTheme;
