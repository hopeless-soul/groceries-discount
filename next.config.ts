import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets a phone on the same Wi-Fi load dev assets (otherwise 403).
  allowedDevOrigins: ["192.168.1.130"],
  turbopack: {
    // Lets `import Logo from "@/public/x.svg"` render the file as an inline
    // <svg> React component so CSS (fill, currentColor) can style it.
    rules: {
      "*.svg": {
        loaders: [
          {
            loader: "@svgr/webpack",
            options: {
              svgoConfig: {
                plugins: [
                  {
                    name: "preset-default",
                    params: { overrides: { removeViewBox: false } },
                  },
                  // Drop the editor-only <style> block and ids so they
                  // don't leak into the page's global scope.
                  "removeStyleElement",
                  { name: "removeAttrs", params: { attrs: "id" } },
                ],
              },
            },
          },
        ],
        as: "*.js",
      },
    },
  },
};

export default nextConfig;
