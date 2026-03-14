const CACHE_KEY = "car-image-cache-v5";
const REMOVEBG_KEY = import.meta.env.VITE_REMOVEBG_API_KEY as string | undefined;

try {
  localStorage.removeItem("car-image-cache");
  localStorage.removeItem("car-image-cache-v2");
  localStorage.removeItem("car-image-cache-v3");
  localStorage.removeItem("car-image-cache-v4");
} catch { /* ignore */ }

interface WikiSummary {
  thumbnail?: { source?: string };
  originalimage?: { source?: string };
}

interface WikiPage {
  imageinfo?: Array<{ thumburl?: string }>;
  title?: string;
}

interface WikiSearchResponse {
  query?: { pages?: Record<string, WikiPage> };
}

function getCache(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
  } catch {
    return {};
  }
}

function setCache(cache: Record<string, string>) {
  localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
}

export function getCachedImage(carName: string): string | null {
  const val = getCache()[carName.toLowerCase()];
  return val && val.length > 0 ? val : null;
}

export function isImageSearchConfigured(): boolean {
  return true;
}

function isRemoveBgConfigured(): boolean {
  return Boolean(REMOVEBG_KEY && REMOVEBG_KEY !== "SUA_CHAVE_REMOVEBG_AQUI");
}

function upgradeResolution(url: string, width = 800): string {
  return url.replace(/\/\d+px-/, `/${width}px-`);
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function imageMatchesCar(imageUrl: string, carName: string): boolean {
  const urlLower = decodeURIComponent(imageUrl).toLowerCase();
  const words = carName.toLowerCase().split(/\s+/);
  return words.every((w) => urlLower.includes(w));
}

async function searchWikipediaArticle(carName: string): Promise<string> {
  const slug = carName.replace(/\s+/g, "_");

  for (const lang of ["pt", "en"]) {
    const data = await fetchJson<WikiSummary>(
      `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(slug)}`,
    );
    const src = data?.originalimage?.source ?? data?.thumbnail?.source;
    if (src && imageMatchesCar(src, carName)) {
      return upgradeResolution(src);
    }
  }

  return "";
}

async function searchWikimediaCommons(carName: string): Promise<string> {
  const data = await fetchJson<WikiSearchResponse>(
    `https://commons.wikimedia.org/w/api.php` +
      `?action=query&generator=search` +
      `&gsrsearch=${encodeURIComponent(carName)}` +
      `&gsrnamespace=6&prop=imageinfo&iiprop=url` +
      `&iiurlwidth=800&format=json&origin=*`,
  );

  const pages = data?.query?.pages;
  if (!pages) return "";

  const queryWords = carName.toLowerCase().split(/\s+/);

  const scored = Object.values(pages)
    .filter((p) => {
      const t = p.title?.toLowerCase() ?? "";
      return (
        (t.endsWith(".jpg") || t.endsWith(".jpeg") || t.endsWith(".png")) &&
        !t.includes("logo") &&
        !t.includes("icon") &&
        !t.includes("flag") &&
        !t.includes("map") &&
        !t.includes("monte") &&
        !t.includes("panorama") &&
        p.imageinfo?.[0]?.thumburl
      );
    })
    .map((p) => {
      const t = p.title?.toLowerCase() ?? "";
      const matchCount = queryWords.filter((w) => t.includes(w)).length;
      const allMatch = matchCount === queryWords.length;
      return { page: p, score: allMatch ? matchCount + 10 : matchCount };
    })
    .sort((a, b) => b.score - a.score);

  return scored[0]?.page.imageinfo?.[0]?.thumburl ?? "";
}

async function removeBackground(imageUrl: string): Promise<string> {
  if (!isRemoveBgConfigured()) return imageUrl;

  try {
    const imgResponse = await fetch(imageUrl);
    if (!imgResponse.ok) return imageUrl;
    const imgBlob = await imgResponse.blob();

    const formData = new FormData();
    formData.append("image_file", imgBlob, "car.jpg");
    formData.append("size", "auto");

    const response = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: { "X-Api-Key": REMOVEBG_KEY! },
      body: formData,
    });

    if (!response.ok) {
      console.warn("remove.bg erro:", response.status, await response.text());
      return imageUrl;
    }

    const resultBlob = await response.blob();

    return new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(resultBlob);
    });
  } catch (err) {
    console.warn("remove.bg falhou:", err);
    return imageUrl;
  }
}

async function findCarImage(carName: string): Promise<string> {
  let imageUrl = await searchWikipediaArticle(carName);

  if (!imageUrl) {
    imageUrl = await searchWikimediaCommons(carName);
  }

  return imageUrl;
}

export async function searchCarImage(carName: string): Promise<string> {
  const cached = getCachedImage(carName);
  if (cached) return cached;

  const rawImageUrl = await findCarImage(carName);
  if (!rawImageUrl) return "";

  const finalUrl = await removeBackground(rawImageUrl);

  if (finalUrl) {
    try {
      const cache = getCache();
      cache[carName.toLowerCase()] = finalUrl;
      setCache(cache);
    } catch {
      // localStorage cheio — ignora cache mas retorna imagem
    }
  }

  return finalUrl;
}

export async function searchCarImages(
  carNames: string[],
): Promise<Record<string, string>> {
  const results: Record<string, string> = {};

  for (const name of carNames) {
    const cached = getCachedImage(name);
    if (cached) {
      results[name] = cached;
      continue;
    }

    try {
      results[name] = await searchCarImage(name);
    } catch (err) {
      console.warn(`Erro ao buscar imagem de "${name}":`, err);
      results[name] = "";
    }

    await new Promise((r) => setTimeout(r, 200));
  }

  return results;
}

export function clearImageCache() {
  localStorage.removeItem(CACHE_KEY);
}
