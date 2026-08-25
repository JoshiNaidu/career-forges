import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],

  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",

        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",

        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground:
            "hsl(var(--primary-foreground))",
        },

        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground:
            "hsl(var(--secondary-foreground))",
        },

        destructive: {
          DEFAULT:
            "hsl(var(--destructive))",

          foreground:
            "hsl(var(--destructive-foreground))",
        },

        muted: {
          DEFAULT: "hsl(var(--muted))",

          foreground:
            "hsl(var(--muted-foreground))",
        },

        accent: {
          DEFAULT: "hsl(var(--accent))",

          foreground:
            "hsl(var(--accent-foreground))",
        },

        popover: {
          DEFAULT: "hsl(var(--popover))",

          foreground:
            "hsl(var(--popover-foreground))",
        },

        card: {
          DEFAULT: "hsl(var(--card))",

          foreground:
            "hsl(var(--card-foreground))",
        },

        /* CareerForges Brand */

        brand: {
          DEFAULT: "#f97316",
          hover: "#fb923c",
          dark: "#ea580c",
        },
      },

      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },

      fontFamily: {
        sans: [
          "Geist Variable",
          "sans-serif",
        ],

        display: [
          "Plus Jakarta Sans",
          "sans-serif",
        ],
      },

      boxShadow: {
        glow:
          "0 0 40px rgba(249,115,22,0.18)",

        soft:
          "0 8px 30px rgba(0,0,0,0.12)",

        card:
          "0 20px 60px rgba(0,0,0,0.25)",
      },

      animation: {
        "fade-in":
          "fadeIn 0.3s ease forwards",

        "fade-up":
          "fadeUp 0.4s ease forwards",

        "scale-in":
          "scaleIn 0.25s ease forwards",
      },

      keyframes: {
        fadeIn: {
          from: {
            opacity: "0",
          },

          to: {
            opacity: "1",
          },
        },

        fadeUp: {
          from: {
            opacity: "0",
            transform:
              "translateY(12px)",
          },

          to: {
            opacity: "1",
            transform:
              "translateY(0)",
          },
        },

        scaleIn: {
          from: {
            opacity: "0",
            transform: "scale(0.96)",
          },

          to: {
            opacity: "1",
            transform: "scale(1)",
          },
        },
      },
    },
  },

  plugins: [],
};

export default config;