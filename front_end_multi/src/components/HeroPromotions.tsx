import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { Sparkles } from "lucide-react";

const ROTATE_MS = 5000;
const QUERY_KEY = ["hero-promo-snippets"] as const;

export default function HeroPromotions({ className }: { className?: string }) {
  const { data: snippets = [], isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => api.getHeroPromoSnippets(),
    staleTime: 2 * 60 * 1000,
  });

  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (snippets.length === 0) return;
    setIndex(Math.floor(Math.random() * snippets.length));
  }, [snippets.length]);

  useEffect(() => {
    if (snippets.length <= 1) return;
    const t = window.setInterval(() => {
      setIndex((i) => {
        if (snippets.length <= 1) return 0;
        let next = Math.floor(Math.random() * snippets.length);
        if (next === i) next = (i + 1) % snippets.length;
        return next;
      });
    }, ROTATE_MS);
    return () => window.clearInterval(t);
  }, [snippets.length]);

  if (isLoading) return null;
  if (snippets.length === 0) return null;

  const s = snippets[index % snippets.length];

  return (
    <div
      className={
        className ??
        "flex flex-col items-center justify-center text-center rounded-2xl border border-primary-foreground/20 bg-primary-foreground/10 px-6 py-8 backdrop-blur-sm min-h-[200px]"
      }
    >
      <div className="flex items-center justify-center gap-2 text-primary-foreground/90 mb-2">
        <Sparkles className="h-5 w-5 shrink-0 text-accent" aria-hidden />
        <span className="text-xs font-bold uppercase tracking-wider text-red-400">Promoção</span>
      </div>
      <p className="text-lg md:text-xl font-semibold text-primary-foreground leading-snug max-w-[280px]">
        {s.carDisplayName}
      </p>
      <p className="mt-3 text-2xl md:text-3xl font-extrabold text-accent tabular-nums">
        {s.formattedPromoPrice}
        <span className="text-base md:text-lg font-semibold text-primary-foreground/80"> /mês</span>
      </p>
    </div>
  );
}
