import type { Config } from "tailwindcss";
import animatePlugin from "tailwindcss-animate";

// Semantic color tokens live as RGB channels in app/globals.css.
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: "1rem", md: "2rem", xl: "5rem" },
      screens: { "2xl": "1440px" },
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "sans-serif"],
      },
      colors: {
        background: {
          DEFAULT: token("background"),
          subtle: token("background-subtle"),
        },
        foreground: {
          DEFAULT: token("foreground"),
          secondary: token("foreground-secondary"),
        },
        card: {
          DEFAULT: token("card"),
          foreground: token("card-foreground"),
        },
        popover: {
          DEFAULT: token("popover"),
          foreground: token("popover-foreground"),
        },
        sunken: token("sunken"),
        media: {
          DEFAULT: token("media"),
          paper: token("media-paper"),
          foreground: token("media-foreground"),
        },
        scrim: token("scrim"),
        inverse: {
          DEFAULT: token("inverse"),
          foreground: token("inverse-foreground"),
          muted: token("inverse-muted"),
          raised: token("inverse-raised"),
          border: token("inverse-border"),
          accent: {
            DEFAULT: token("inverse-accent"),
            foreground: token("inverse-accent-foreground"),
          },
          success: token("inverse-success"),
          error: token("inverse-error"),
        },
        primary: {
          DEFAULT: token("primary"),
          hover: token("primary-hover"),
          foreground: token("primary-foreground"),
        },
        secondary: {
          DEFAULT: token("secondary"),
          foreground: token("secondary-foreground"),
        },
        muted: {
          DEFAULT: token("muted"),
          foreground: token("muted-foreground"),
        },
        accent: {
          DEFAULT: token("accent"),
          foreground: token("accent-foreground"),
        },
        destructive: {
          DEFAULT: token("destructive"),
          foreground: token("destructive-foreground"),
        },
        deal: {
          DEFAULT: token("deal"),
          foreground: token("deal-foreground"),
          subtle: token("deal-subtle"),
        },
        success: {
          DEFAULT: token("success"),
          foreground: token("success-foreground"),
          fg: token("success-fg"),
          bg: token("success-bg"),
        },
        warning: {
          DEFAULT: token("warning"),
          fg: token("warning-fg"),
          bg: token("warning-bg"),
        },
        rating: token("rating"),
        error: { fg: token("error-fg"), bg: token("error-bg") },
        info: { fg: token("info-fg"), bg: token("info-bg") },
        violet: { fg: token("violet-fg"), bg: token("violet-bg") },
        border: {
          DEFAULT: token("border"),
          soft: token("border-soft"),
        },
        input: token("input"),
        ring: token("ring"),
        chart: {
          "1": token("chart-1"),
          "2": token("chart-2"),
          "3": token("chart-3"),
          "4": token("chart-4"),
          "5": token("chart-5"),
        },
      },
      borderRadius: {
        xs: "4px",
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "20px",
        "2xl": "24px",
        "3xl": "28px",
      },
      boxShadow: {
        xs: "0 1px 2px rgb(11 13 18 / 0.04)",
        sm: "0 1px 2px rgb(11 13 18 / 0.06)",
        // Filled buttons: top highlight + soft contact shadow.
        button:
          "inset 0 1px 0 rgb(255 255 255 / 0.14), 0 1px 2px rgb(11 13 18 / 0.18)",
        card: "0 1px 2px rgb(11 13 18 / 0.04), 0 1px 1px rgb(11 13 18 / 0.02)",
        md: "0 8px 24px rgb(11 13 18 / 0.10)",
        lg: "0 24px 48px rgb(11 13 18 / 0.20)",
      },
      transitionDuration: {
        fast: "120ms",
        base: "200ms",
        slow: "320ms",
      },
      transitionTimingFunction: {
        standard: "cubic-bezier(0.2, 0, 0, 1)",
        exit: "cubic-bezier(0.4, 0, 1, 1)",
      },
      maxWidth: {
        content: "1280px",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        // Hero copy entrance: rises out of a soft blur.
        rise: {
          from: { opacity: "0", transform: "translateY(18px)", filter: "blur(8px)" },
          to: { opacity: "1", transform: "translateY(0)", filter: "blur(0)" },
        },
        shimmer: {
          from: { backgroundPosition: "200% 0" },
          to: { backgroundPosition: "-200% 0" },
        },
      },
      animation: {
        "fade-up": "fade-up 480ms cubic-bezier(0.2, 0, 0, 1) both",
        rise: "rise 900ms cubic-bezier(0.16, 1, 0.3, 1) both",
        shimmer: "shimmer 1.6s linear infinite",
      },
      screens: {
        "max-sm": { max: "639px" },
        portrait: { raw: "(orientation: portrait)" },
        "hover-hover": { raw: "(hover: hover)" },
      },
    },
  },

  plugins: [animatePlugin],
} satisfies Config;
