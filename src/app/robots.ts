import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/website/tragwerker/config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/login",
          "/cms",
          "/projects",
          "/portfolio",
          "/immobilien",
          "/events",
          "/blog",
          "/team",
          "/settings",
          "/media",
          "/analytics",
          "/api/",
        ],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
