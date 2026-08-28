import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./apps/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          1: "#020617",
          2: "#0B1220",
          3: "#0F172A",
        },
        brand: {
          red: "#FF4D63",
          redStrong: "#FF3D53",
          redSoft: "#FF5A6B",
        },
      },
    },
  },
  plugins: [],
};

export default config;