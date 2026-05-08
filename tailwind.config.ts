import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#18212f",
        line: "#d8dee8",
        mist: "#f5f7fb",
        teal: "#167c80",
        coral: "#c85042",
        amber: "#a66a00",
        leaf: "#3f7d45"
      }
    }
  },
  plugins: []
};

export default config;
