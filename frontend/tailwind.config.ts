import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // === COLORS ===
      colors: {
        // Surfaces
        canvas: "#fbfaf9",
        stone: "#f2f0ed",
        parchment: "#f8f7f4",
        card: "#ffffff",
        dark: "#000000",

        // Text
        graphite: "#474645",
        charcoal: "#343433",
        midnight: "#121212",
        ash: "#848281",
        fog: "#c6c6c6",
        smoke: "#a7a7a7",
        pepper: "#282624",

        // Brand - Primary
        ember: "#ff3e00",

        // Brand - Secondary
        meadow: "#00ca48",

        // Brand - Tertiary
        sky: "#0090ff",

        // Brand - Quaternary
        sunburst: "#ffbb26",

        // Illustration colors
        amber: "#d48f00",
        ocean: "#0086fc",
        ice: "#64c6ff",
        spearmint: "#00c978",
        flamingo: "#ff58ae",
        violet: "#9f4fff",
        coral: "#ff2b3a",
        valid: "#00c454",
      },

      // === TYPOGRAPHY ===
      fontFamily: {
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },

      fontSize: {
        caption: ["12px", { lineHeight: "1.58", letterSpacing: "-0.14px" }],
        body: ["15px", { lineHeight: "1.47", letterSpacing: "-0.2px" }],
        "heading-sm": [
          "19px",
          { lineHeight: "1.38", letterSpacing: "-0.25px" },
        ],
        heading: ["23px", { lineHeight: "1.2", letterSpacing: "-0.44px" }],
        "heading-lg": [
          "44px",
          { lineHeight: "1.09", letterSpacing: "-1.14px" },
        ],
        display: ["68px", { lineHeight: "1.09", letterSpacing: "-2.11px" }],
      },

      fontWeight: {
        regular: "400",
        medium: "500",
        semibold: "600",
      },

      // === SPACING ===
      spacing: {
        "4": "4px",
        "8": "8px",
        "12": "12px",
        "16": "16px",
        "20": "20px",
        "24": "24px",
        "28": "28px",
        "32": "32px",
        "36": "36px",
        "48": "48px",
        "60": "60px",
        "76": "76px",
        "80": "80px",
        "92": "92px",
        "96": "96px",
        "104": "104px",
      },

      // === BORDER RADIUS ===
      borderRadius: {
        sm: "6px",
        md: "10px",
        lg: "17px",
        xl: "24px",
        "2xl": "32px",
        "3xl": "40px",
        full: "72px",
        // Named
        tags: "6px",
        cards: "10px",
        icons: "40px",
        inputs: "10px",
        buttons: "32px",
        "cards-large": "24px",
        "buttons-pill": "32px",
        illustrations: "72px",
      },

      // === SHADOWS ===
      boxShadow: {
        subtle: "inset 0 0 0 1px #f2f0ed",
        "subtle-2": "inset 0 0 0 0px #f2f0ed",
        "subtle-3": "0 0 0 1px rgba(0, 0, 0, 0.04)",
        lg: "0 0 24px 0 rgba(0, 0, 0, 0.15)",
        sm: "0 1px 6px 0 rgba(0, 0, 0, 0.04), 0 0 24px 0 rgba(0, 0, 0, 0.05)",
        card: "inset 0 0 0 1px #f2f0ed",
        phone: "0 0 24px 0 rgba(0, 0, 0, 0.15)",
        nav: "0 0 0 1px rgba(0, 0, 0, 0.04)",
      },

      // === MAX WIDTH ===
      maxWidth: {
        page: "1200px",
      },

      // === ANIMATION ===
      transitionDuration: {
        base: "200ms",
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.19, 1, 0.22, 1)",
      },
    },
  },
  plugins: [],
};

export default config;