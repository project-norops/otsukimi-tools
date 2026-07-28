import type { MetadataRoute } from "next";
import { availableTools } from "@/data/tools";

const SITE_URL = "https://sushiusa.net";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL },
    ...availableTools.map((tool) => ({ url: `${SITE_URL}${tool.href}` })),
  ];
}
