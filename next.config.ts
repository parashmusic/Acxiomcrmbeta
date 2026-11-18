import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.plugins.push({
      apply: (compiler: any) => {
        compiler.hooks.beforeRun.tap("FixEpermPlugin", (comp: any) => {
          const fs = comp.outputFileSystem;
          if (fs && fs.mkdir) {
            const origMkdir = fs.mkdir.bind(fs);
            fs.mkdir = (p: string, opt: any, cb: any) => {
              if (typeof opt === "function") {
                cb = opt;
                opt = { recursive: true };
              } else if (typeof opt === "object" && opt !== null) {
                opt = { ...opt, recursive: true };
              } else {
                opt = { recursive: true };
              }
              origMkdir(p, opt, (err: any) => {
                if (err && (err.code === "EPERM" || err.code === "EEXIST")) {
                  return cb(null);
                }
                cb(err);
              });
            };
          }
        });
      },
    });
    return config;
  },
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        {
          key: "Content-Security-Policy",
          value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob:; font-src 'self' https://fonts.gstatic.com; connect-src 'self';"
        }
      ]
    }
  ]
};

export default nextConfig;
