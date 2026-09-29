import type { NextRequest } from "next/server";
import { CaptionsLimitError, getEnglishCaptions } from "@/lib/captions";
import { createClient } from "@/lib/supabase/server";

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
    const cues = await getEnglishCaptions(await createClient(), videoId);
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
    if (e instanceof CaptionsLimitError)
      return Response.json({ error: "limit" }, { status: 503 });
    return Response.json({ error: "Couldn't load subtitles" }, { status: 502 });
  }
}
