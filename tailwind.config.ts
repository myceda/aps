import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0f172a",
        line: "#e2e8f0",
        mist: "#f8fafc",
        teal: "#0284c7",
        coral: "#ef4444",
        amber: "#f59e0b",
        leaf: "#10b981"
      }
    }
  },
  plugins: []
};

export default config;
