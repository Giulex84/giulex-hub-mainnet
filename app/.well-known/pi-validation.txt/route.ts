const FALLBACK_VALIDATION_KEY =
  "a0fb2d1fe6ea9476745db32b85b9d8bb7b833b75c3f17d9d6ecfc25163387837275be022971d14374eba7f6b4743819bd66c6d4d28588d1b004473b7172c6e36";

export async function GET() {
  const key = (process.env.NEXT_PUBLIC_PI_VALIDATION_KEY || FALLBACK_VALIDATION_KEY).trim();

  return new Response(`${key}\n`, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=300, must-revalidate"
    }
  });
}
