import localFont from "next/font/local";

export const ppNeueMontreal = localFont({
  src: [
    {
      path: "../../../../public/fonts/pp-neue-montreal/ppneuemontreal-book.woff",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../../../public/fonts/pp-neue-montreal/ppneuemontreal-medium.woff",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../../../public/fonts/pp-neue-montreal/ppneuemontreal-bold.woff",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-pp-neue-montreal",
  display: "swap",
});
