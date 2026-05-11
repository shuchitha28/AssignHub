import { useEffect, useState } from "react";
import API from "../api/axios";

export function useTheme() {
  const [theme, setTheme] = useState(
    localStorage.getItem("theme") || "light"
  );
  const [colorTheme, setColorTheme] = useState(
    localStorage.getItem("colorTheme") || "pink"
  );

  useEffect(() => {
    // Handle light/dark mode
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
    
    // Handle color theme
    document.documentElement.setAttribute("data-theme", colorTheme);
    localStorage.setItem("colorTheme", colorTheme);
  }, [theme, colorTheme]);

  const toggleTheme = async (sync = false) => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    if (sync && localStorage.getItem("token")) {
      try {
        await API.put("/profile/update", { theme: newTheme });
      } catch (err) {
        console.error("Failed to sync theme", err);
      }
    }
  };

  const changeColorTheme = async (color: string, sync = false) => {
    setColorTheme(color);
    if (sync && localStorage.getItem("token")) {
      try {
        await API.put("/profile/update", { colorTheme: color });
      } catch (err) {
        console.error("Failed to sync color theme", err);
      }
    }
  };

  return { theme, colorTheme, toggleTheme, changeColorTheme, setTheme, setColorTheme };
}