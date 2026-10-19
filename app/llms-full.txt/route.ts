import { llmsFull } from "@/lib/llms";

export const revalidate = 3600;

export async function GET() {
  return new Response(await llmsFull(), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600",
    },
  });
}
