/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#111827",
        mist: "#f5f5f7",
        line: "#d2d2d7",
        panel: "#ffffff",
        blue: "#0071e3",
        blueSoft: "#e8f3ff",
        success: "#1d9f5f"
      },
      fontFamily: {
        sans: ["SF Pro Display", "SF Pro Text", "Helvetica Neue", "Arial", "sans-serif"],
        serif: ["SF Pro Display", "Helvetica Neue", "Arial", "sans-serif"]
      },
      boxShadow: {
        panel: "0 24px 60px rgba(17, 24, 39, 0.08)",
        glass: "0 20px 45px rgba(15, 23, 42, 0.06)"
      }
    }
  },
  plugins: []
};
