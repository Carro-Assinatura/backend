import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { useIsMobile } from "./useIsMobile";

export function useBotConfig() {
  const isMobile = useIsMobile();
  const { data, isLoading } = useQuery({
    queryKey: ["bot-config"],
    queryFn: () => api.getBotConfig(),
    staleTime: 2 * 60 * 1000,
    retry: false,
  });

  const config = data ?? null;
  const isDesktop = !isMobile;
  const showBot = !!(config?.active && config?.webhook_url?.trim());

  return { config, isLoading, showBot, isDesktop, isMobile };
}
