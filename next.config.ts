import type { NextConfig } from "next";
import fs from "node:fs";
import path from "node:path";

/**
 * lidl-discounts/kaufland-discounts are `file:` deps that live outside this
 * app's directory tree (siblings under the project's `scripts/` folder).
 * Turbopack refuses to resolve modules outside its inferred project root
 * (https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopack#root-directory).
 * That root also shifts depending on how deeply nested this checkout is
 * (a plain clone vs. a git worktree under .claude/worktrees/<name>/), so the
 * common ancestor is computed at config-load time instead of hardcoded.
 */
function findCommonRoot(a: string, b: string): string {
  const segA = path.resolve(a).split(path.sep);
  const segB = path.resolve(b).split(path.sep);
  const common: string[] = [];
  for (let i = 0; i < Math.min(segA.length, segB.length); i++) {
    if (segA[i] !== segB[i]) break;
    common.push(segA[i]);
  }
  return common.join(path.sep) || path.sep;
}

function computeTurbopackRoot(): string | undefined {
  try {
    const vendorPackage = fs.realpathSync(
      path.join(__dirname, "node_modules", "kaufland-discounts"),
    );
    return findCommonRoot(__dirname, vendorPackage);
  } catch {
    return undefined;
  }
}

const nextConfig: NextConfig = {
  turbopack: {
    root: computeTurbopackRoot(),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "kaufland.media.schwarz",
      },
      // TODO: Lidl's imageUrl host isn't present in any fixture/README in
      // this repo. Log a real offer.imageUrl from LidlProvider.fetch() with
      // a live country/city and add its hostname here once confirmed.
    ],
  },
};

export default nextConfig;
