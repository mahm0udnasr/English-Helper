import type { NextRequest } from "next/server";
import { getEnglishCaptions } from "@/lib/captions";

// English subtitles for the video player: { cues } or { cues: null } when the
// video has none. Found captions rarely change, so the browser keeps them a
// day; "none" isn't cached, since captions can be added later.
export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/captions/[videoId]">,
) {
  const { videoId } = await ctx.params;
  if (!/^[\w-]{11}$/.test(videoId))
    return Response.json({ error: "Bad video id" }, { status: 400 });

  try {
    const cues = await getEnglishCaptions(videoId);
    return Response.json(
      { cues },
      {
        headers: {
          "Cache-Control": cues ? "private, max-age=86400" : "no-store",
        },
      },
    );
  } catch (e) {
    console.error(`Captions for ${videoId}:`, e);
    return Response.json({ error: "Couldn't load subtitles" }, { status: 502 });
  }
}
