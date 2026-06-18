import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: { DEFAULT: "#261915", foreground: "#FFF9F4" },
        accent: { DEFAULT: "#E94B2E", foreground: "#261915" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" }
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Nunito Sans", "sans-serif"],
        serif: ["var(--font-serif)", "Cormorant Garamond", "serif"]
      },
      boxShadow: {
        soft: "0 18px 54px rgba(38, 25, 21, 0.08)"
      }
    }
  },
  plugins: [animate]
};

export default config;
