import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { Sparkles } from "lucide-react";
import { CarImageLegalCaptionOverlay } from "@/components/CarImageLegalCaption";

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
        "w-[min(280px,85vw)] shrink-0 flex flex-col text-center rounded-2xl border border-primary-foreground/20 bg-primary-foreground/10 backdrop-blur-sm overflow-hidden shadow-card"
      }
    >
      <div className="flex items-center justify-center gap-2.5 px-5 pt-5 pb-3 w-full">
        <Sparkles className="h-7 w-7 shrink-0 text-accent" aria-hidden />
        <span className="text-lg md:text-xl font-extrabold tracking-wide text-red-400 leading-tight">
          Somente Hoje!!
        </span>
      </div>

      {s.imageUrl ? (
        <div className="relative w-full aspect-[4/3] flex items-center justify-center bg-transparent overflow-hidden">
          <img
            src={s.imageUrl}
            alt={s.carDisplayName}
            className="max-h-full w-full object-contain px-3 py-2"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
          <CarImageLegalCaptionOverlay className="!from-black/45 !via-black/20 !to-transparent text-primary-foreground/55 [text-shadow:0_1px_4px_rgba(0,0,0,0.55)]" />
        </div>
      ) : null}

      <div className="flex flex-col items-center px-5 pt-3 pb-5 w-full text-center">
        <p className="text-lg font-bold text-primary-foreground leading-snug">{s.linhaMarcaNome}</p>
        {s.modeloVersao ? (
          <p className="text-sm md:text-base text-primary-foreground/85 font-medium mt-1.5 leading-snug">
            {s.modeloVersao}
          </p>
        ) : null}
        <p className="mt-4 text-2xl md:text-3xl font-extrabold text-accent tabular-nums">
          {s.formattedPromoPrice}
          <span className="text-base md:text-lg font-semibold text-primary-foreground/80"> /mês</span>
        </p>
      </div>
    </div>
  );
}
