import { llmsIndex } from "@/lib/llms";

export const revalidate = 3600;

export async function GET() {
  return new Response(await llmsIndex(), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600",
    },
  });
}
