export const GOOGLE_SHEETS_CONFIG = {
  apiKey: import.meta.env.VITE_GOOGLE_SHEETS_API_KEY as string | undefined,
  sheetId: import.meta.env.VITE_GOOGLE_SHEETS_ID as string | undefined,
  tabName: (import.meta.env.VITE_GOOGLE_SHEETS_TAB as string) || "Página1",
};

export const COLUMN_MAP = {
  carName: (import.meta.env.VITE_COLUMN_CAR_NAME as string) || "Carro",
  category: (import.meta.env.VITE_COLUMN_CATEGORY as string) || "Categoria",
  price: (import.meta.env.VITE_COLUMN_PRICE as string) || "Preço",
  image: (import.meta.env.VITE_COLUMN_IMAGE as string) || "Imagem",
};

export const isGoogleSheetsConfigured = (): boolean => {
  const { apiKey, sheetId } = GOOGLE_SHEETS_CONFIG;
  return Boolean(
    apiKey &&
      apiKey !== "SUA_CHAVE_DE_API_AQUI" &&
      sheetId &&
      sheetId !== "SEU_ID_DA_PLANILHA_AQUI",
  );
};
