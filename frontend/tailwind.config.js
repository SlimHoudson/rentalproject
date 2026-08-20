/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      "colors": {
        border: "var(--border)",
        input: "var(--border-strong)",
        ring: "var(--brand)",
        background: "var(--bg-page)",
        foreground: "var(--tx-primary)",
        primary: {
          DEFAULT: "var(--brand)",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "var(--bg-subtle)",
          foreground: "var(--tx-primary)",
        },
        destructive: {
          DEFAULT: "var(--danger)",
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "var(--bg-muted)",
          foreground: "var(--tx-muted)",
        },
        accent: {
          DEFAULT: "var(--brand-light)",
          foreground: "var(--brand)",
        },
        popover: {
          DEFAULT: "var(--bg-base)",
          foreground: "var(--tx-primary)",
        },
        card: {
          DEFAULT: "var(--bg-base)",
          foreground: "var(--tx-primary)",
        },
      },
      "borderRadius": {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "full": "9999px"
      },
      "spacing": {
        "sidebar-width": "280px",
        "card-gap": "24px",
        "gutter": "24px",
        "container-padding": "32px",
        "base": "8px"
      },
      "fontFamily": {
        "label-caps": ["Inter", "sans-serif"],
        "body-sm": ["Inter", "sans-serif"],
        "body-md": ["Inter", "sans-serif"],
        "h2": ["Inter", "sans-serif"],
        "body-lg": ["Inter", "sans-serif"],
        "h1": ["Inter", "sans-serif"]
      },
      "fontSize": {
        "label-caps": ["12px", {"lineHeight": "1", "letterSpacing": "0.05em", "fontWeight": "600"}],
        "body-sm": ["14px", {"lineHeight": "1.5", "fontWeight": "400"}],
        "body-md": ["16px", {"lineHeight": "1.5", "fontWeight": "400"}],
        "h2": ["24px", {"lineHeight": "1.3", "letterSpacing": "-0.01em", "fontWeight": "600"}],
        "body-lg": ["18px", {"lineHeight": "1.5", "fontWeight": "400"}],
        "h1": ["32px", {"lineHeight": "1.2", "letterSpacing": "-0.02em", "fontWeight": "600"}]
      }
    },
  },
  plugins: [],
}
