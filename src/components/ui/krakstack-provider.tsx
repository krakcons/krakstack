import { createContext, type ReactNode, useContext } from "react";

type KrakstackContextValue = {
  locale: string;
  locales: readonly string[];
};

const KrakstackContext = createContext<KrakstackContextValue>({
  locale: "en",
  locales: ["en"],
});

export type KrakstackProviderProps = {
  children: ReactNode;
  locale: string;
  locales?: readonly string[];
};

export const KrakstackProvider = ({
  children,
  locale,
  locales = [locale],
}: KrakstackProviderProps) => (
  <KrakstackContext.Provider value={{ locale, locales }}>
    {children}
  </KrakstackContext.Provider>
);

export const useKrakstackLocale = (locale?: string) => {
  const context = useContext(KrakstackContext);
  return locale ?? context.locale;
};

export const useKrakstackLocales = (locales?: readonly string[]) => {
  const context = useContext(KrakstackContext);
  return locales ?? context.locales;
};
