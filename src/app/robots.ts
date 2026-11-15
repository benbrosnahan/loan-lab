import type { MetadataRoute } from "next";

// Results pages are one person's numbers: keep them out of search.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: "/results" }],
    sitemap: "https://loan-lab.vercel.app/sitemap.xml",
  };
}
