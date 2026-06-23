const DEFAULT_IMAGE = "https://corretajeguzman.com/assets/guzman-logo.jpg";

function safeUrl(value) {
  try {
    const url = new URL(String(value || ""));
    if (url.protocol !== "https:" && url.protocol !== "http:") return "";
    return url.toString();
  } catch (error) {
    return "";
  }
}

export default async (request) => {
  const url = new URL(request.url);
  const source = safeUrl(url.searchParams.get("src")) || DEFAULT_IMAGE;

  try {
    const upstream = await fetch(source, {
      headers: {
        "user-agent": "Mozilla/5.0 CorretajeGuzmanBot/1.0",
        accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"
      }
    });

    if (!upstream.ok) throw new Error(`image fetch failed ${upstream.status}`);

    const contentType = upstream.headers.get("content-type") || "image/jpeg";
    const body = await upstream.arrayBuffer();

    return new Response(body, {
      status: 200,
      headers: {
        "content-type": contentType,
        "cache-control": "public, max-age=86400, s-maxage=604800",
        "access-control-allow-origin": "*"
      }
    });
  } catch (error) {
    const fallback = await fetch(DEFAULT_IMAGE);
    const contentType = fallback.headers.get("content-type") || "image/jpeg";
    const body = await fallback.arrayBuffer();

    return new Response(body, {
      status: 200,
      headers: {
        "content-type": contentType,
        "cache-control": "public, max-age=86400, s-maxage=604800",
        "access-control-allow-origin": "*"
      }
    });
  }
};
