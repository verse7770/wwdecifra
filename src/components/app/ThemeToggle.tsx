import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  return (
    <Button variant="ghost" size="icon" aria-label="Alternar tema" onClick={() => {
      const dark = document.documentElement.classList.toggle("dark");
      localStorage.setItem("theme", dark ? "dark" : "light");
    }}>
      <Sun className="hidden dark:block" /><Moon className="dark:hidden" />
    </Button>
  );
}
