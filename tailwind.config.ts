import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "#faf9f6",
        ink: "#1c1b19",
        accent: {
          DEFAULT: "#3b5bdb",
          soft: "#edf0fd",
        },
      },
      fontFamily: {
        serif: ["Georgia", "Cambria", "Times New Roman", "serif"],
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 1px 2px rgba(28,27,25,0.04), 0 1px 3px rgba(28,27,25,0.06)",
        drawer: "-8px 0 30px rgba(28,27,25,0.10)",
        lift: "0 4px 18px rgba(28,27,25,0.10)",
      },
      keyframes: {
        pop: {
          "0%": { transform: "scale(0.6)", opacity: "0" },
          "60%": { transform: "scale(1.15)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        slideIn: {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        pop: "pop 0.25s ease-out",
        slideIn: "slideIn 0.22s cubic-bezier(0.32,0.72,0,1)",
        fadeIn: "fadeIn 0.15s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
