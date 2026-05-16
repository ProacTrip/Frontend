import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: '#FEF9F0',
        'paper-dim': '#F7F2E7',
        'paper-container': '#EFE9DA',
        'paper-outline': '#E0D8C5',
        ink: '#15140F',
        'ink-muted': '#5C5954',
        'ink-faint': '#8B8781',
        coral: '#ED6F5C',
        'coral-hover': '#D65B4A',
        'coral-container': '#FDE8E5',
        olive: '#5C6238',
        'olive-hover': '#4A4F2C',
        'olive-container': '#E8EBD6',
        mustard: '#E9B94A',
        'mustard-container': '#FDF4DC',
        success: '#2E7D32',
        'success-container': '#E8F5E9',
        warning: '#E6A817',
        'warning-container': '#FFF8E1',
        error: '#BA1A1A',
        'error-container': '#FFEBEE',
      },
    },
  },
  plugins: [],
};
export default config;