import { Monitor, Moon, Sun } from "lucide-react";
import { ScriptOnce } from "@tanstack/react-router";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getLocale } from "@/paraglide/runtime";

const messages = {
  en: {
    title: "Switch theme",
    light: "Light",
    dark: "Dark",
    system: "System",
  },
  fr: {
    title: "Changer de thème",
    light: "Clair",
    dark: "Sombre",
    system: "Système",
  },
} as const;

const themeMessages = () =>
  getLocale().startsWith("fr") ? messages.fr : messages.en;

const DEFAULT_THEME: Theme = "system";
const DEFAULT_SYSTEM_THEME: SystemTheme = "light";

export const themes = ["light", "dark", "system"] as const;

export type Theme = "light" | "dark" | "system";
export type SystemTheme = "dark" | "light";

type ThemeProviderState = {
  systemTheme: SystemTheme;
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

type ThemePayload = {
  systemTheme: SystemTheme;
  theme: Theme;
};

type ThemeProviderProps = {
  children: ReactNode;
};

type ThemeSwitcherProps = {
  options?: ReadonlyArray<Theme>;
  value: Theme;
  onChange: (value: Theme) => void;
};

const ThemeProviderContext = createContext<ThemeProviderState | null>(null);

const iconForTheme = {
  light: Sun,
  dark: Moon,
  system: Monitor,
} as const;

const themeScript = `(function() {
  try {
    const theme = localStorage.getItem('theme') || 'auto';
    const resolved = theme === 'auto' || theme === 'system'
      ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : theme;
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(resolved);
  } catch (e) {}
})();`;

const isTheme = (value: string | undefined): value is Theme =>
  value === "light" || value === "dark" || value === "system";

const currentSystemTheme = (): SystemTheme =>
  window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

const applyDocumentTheme = ({ theme, systemTheme }: ThemePayload) => {
  const resolvedTheme = theme === "system" ? systemTheme : theme;
  document.documentElement.classList.remove("light", "dark");
  document.documentElement.classList.add(resolvedTheme);
};

const getInitialTheme = (): ThemePayload => {
  if (typeof window === "undefined") {
    return {
      theme: DEFAULT_THEME,
      systemTheme: DEFAULT_SYSTEM_THEME,
    };
  }

  const theme = window.localStorage.getItem("theme") ?? undefined;

  return {
    theme: isTheme(theme) ? theme : DEFAULT_THEME,
    systemTheme: currentSystemTheme(),
  };
};

const persistTheme = (payload: ThemePayload) => {
  window.localStorage.setItem("theme", payload.theme);
};

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [{ theme, systemTheme }, setThemeState] = useState(getInitialTheme);

  const updateTheme = useCallback((payload: ThemePayload) => {
    setThemeState(payload);
    persistTheme(payload);
    applyDocumentTheme(payload);
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const syncSystemTheme = () => {
      const nextSystemTheme = currentSystemTheme();
      setThemeState((current) => {
        if (current.systemTheme === nextSystemTheme) return current;

        const next = { ...current, systemTheme: nextSystemTheme };
        persistTheme(next);
        applyDocumentTheme(next);
        return next;
      });
    };

    syncSystemTheme();
    media.addEventListener("change", syncSystemTheme);

    return () => media.removeEventListener("change", syncSystemTheme);
  }, []);

  const value = useMemo(
    () => ({
      systemTheme,
      theme,
      setTheme: (theme: Theme) => updateTheme({ theme, systemTheme }),
    }),
    [systemTheme, theme, updateTheme],
  );

  return (
    <>
      <ScriptOnce>{themeScript}</ScriptOnce>
      <ThemeProviderContext.Provider value={value}>
        {children}
      </ThemeProviderContext.Provider>
    </>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (!context) throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};

export const ThemeSwitcher = ({
  options = themes,
  value,
  onChange,
}: ThemeSwitcherProps) => {
  const labels = themeMessages();
  const Icon = iconForTheme[value];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="icon" aria-label={labels.title}>
            <Icon aria-hidden="true" />
            <span className="sr-only">{labels.title}</span>
          </Button>
        }
      />
      <DropdownMenuContent className="w-32">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{labels.title}</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            aria-label={labels.title}
            value={value}
            onValueChange={(theme) => {
              const selected = options.find((option) => option === theme);
              if (selected) onChange(selected);
            }}
          >
            {options.map((theme) => (
              <DropdownMenuRadioItem key={theme} value={theme}>
                <ThemeOptionIcon theme={theme} />
                <span>{labels[theme]}</span>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const ThemeOptionIcon = ({ theme }: { theme: Theme }) => {
  const Icon = iconForTheme[theme];

  return <Icon aria-hidden="true" className="text-muted-foreground" />;
};
