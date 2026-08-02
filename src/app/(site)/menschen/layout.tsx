import { ppNeueMontreal } from "@/website/tragwerker/fonts/pp-neue-montreal";

import "@/website/tragwerker/styles/menschen.css";

export default function MenschenLayout({ children }: { children: React.ReactNode }) {
  return <div className={`menschen-page ${ppNeueMontreal.variable}`}>{children}</div>;
}
