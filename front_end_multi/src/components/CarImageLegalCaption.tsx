import { cn } from "@/lib/utils";

export const CAR_IMAGE_DISCLAIMER_TEXT = "* Imagem meramente ilustrativa.";

/** Legenda jurídica discreta sobre a área da foto (rodapé interno do quadro). */
export function CarImageLegalCaptionOverlay({ className }: { className?: string }) {
  return (
    <p
      role="note"
      className={cn(
        "pointer-events-none absolute bottom-0 left-0 right-0 z-10 px-1.5 pb-0.5 pt-3 text-center font-normal leading-snug",
        "text-[0.625rem] sm:text-[0.6875rem] text-neutral-600/85 dark:text-muted-foreground/90",
        "bg-gradient-to-t from-white/90 via-white/45 to-transparent dark:from-card/95 dark:via-card/55 dark:to-transparent",
        "[text-shadow:0_0_4px_rgba(255,255,255,0.9)] dark:[text-shadow:0_1px_3px_rgba(0,0,0,0.35)]",
        className,
      )}
    >
      {CAR_IMAGE_DISCLAIMER_TEXT}
    </p>
  );
}

/** Hero em fundo escuro: texto discreto e legível sobre as fotos. */
export function CarImageLegalCaptionHero({ className }: { className?: string }) {
  return (
    <p
      role="note"
      className={cn(
        "pointer-events-none absolute bottom-4 left-4 right-4 z-20 text-center font-normal leading-snug",
        "text-[0.625rem] sm:text-[0.6875rem] text-primary-foreground/55",
        "[text-shadow:0_1px_4px_rgba(0,0,0,0.55)]",
        className,
      )}
    >
      {CAR_IMAGE_DISCLAIMER_TEXT}
    </p>
  );
}
