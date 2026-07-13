import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest { return { name: "おつきみつーるず", short_name: "おつきみ", description: "ライバーとリスナーのための、ちいさくて便利なツール置き場", start_url: "/", display: "standalone", background_color: "#FFFDFE", theme_color: "#FF6B91", icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" }] }; }
