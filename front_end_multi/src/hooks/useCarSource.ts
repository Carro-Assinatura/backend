import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";

export type CarSourceValue = "planilhas" | "importar" | "";

export function useCarSource() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["car-source"],
    queryFn: () => api.getCarSource(),
    staleTime: 30 * 1000,
  });

  const mutation = useMutation({
    mutationFn: (value: CarSourceValue) => api.setCarSource(value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["car-source"] });
      queryClient.invalidateQueries({ queryKey: ["cars-for-site"] });
    },
  });

  const setCarSource = async (value: CarSourceValue) => {
    await mutation.mutateAsync(value);
  };

  return {
    carSource: query.data ?? "",
    isLoading: query.isLoading,
    setCarSource,
    isSaving: mutation.isPending,
    refetch: query.refetch,
  };
}
