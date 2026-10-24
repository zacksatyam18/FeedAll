/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          50:  '#f0f7f3',
          100: '#dceee3',
          200: '#bbdecb',
          300: '#8ec7ab',
          400: '#5da987',
          500: '#3c8c6a',
          600: '#2c7053',
          700: '#225943',
          800: '#1a4736',
          900: '#134431',  // Brand Dark Forest Green
          950: '#0a261b',  // Ultra Deep Forest
        },
        brand: {
          dark:       '#134431',
          darker:     '#0a261b',
          orange:     '#F26224',
          orangeHover:'#d94f15',
          gold:       '#F5A623',
          leaf:       '#4EA044',
          cream:      '#FCFBF7',
        },
      },
      fontFamily: {
        sans:    ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        heading: ['Outfit', 'Plus Jakarta Sans', 'sans-serif'],
      },
      animation: {
        // Existing
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-fast':   'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        // New motion system
        'float-slow':   'floatY 6s ease-in-out infinite',
        'float-medium': 'floatY 4.5s ease-in-out infinite',
        'float-fast':   'floatYSm 3.2s ease-in-out infinite',
        'zoom-ambient': 'slowZoom 8s ease-in-out infinite',
        'slide-up':     'slideUp 300ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-in':      'fadeIn 250ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'list-in':      'listItemIn 300ms cubic-bezier(0.16, 1, 0.3, 1) both',
      },
      keyframes: {
        floatY: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':       { transform: 'translateY(-8px)' },
        },
        floatYSm: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':       { transform: 'translateY(-4px)' },
        },
        slowZoom: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%':       { transform: 'scale(1.03)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(16px) scale(0.97)' },
          to:   { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'scale(0.97) translateY(8px)' },
          to:   { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        listItemIn: {
          from: { opacity: '0', transform: 'translateX(-12px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
      },
      transitionTimingFunction: {
        'out-expo':       'cubic-bezier(0.16, 1, 0.3, 1)',
        'in-out-smooth':  'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      backgroundImage: {
        'green-radial': 'radial-gradient(ellipse at top left, #225943 0%, #0a261b 100%)',
      },
    },
  },
  plugins: [],
}
