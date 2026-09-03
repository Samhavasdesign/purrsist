import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Skip Next internals, static assets, PWA files, and the generated
     * metadata image routes (opengraph-image / twitter-image) so the service
     * worker, manifest, and link-preview crawlers are never redirected
     * through auth.
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest\\.json|sw\\.js|workbox-.*\\.js|swe-worker-.*\\.js|icons/|opengraph-image|twitter-image|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
