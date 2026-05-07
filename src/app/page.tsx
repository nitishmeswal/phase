import Hero from "@/components/landing/Hero";
import WhatItIs from "@/components/landing/WhatItIs";
import HowItWorks from "@/components/landing/HowItWorks";
import Brushes from "@/components/landing/Brushes";
import Engine from "@/components/landing/Engine";
import Pricing from "@/components/landing/Pricing";
import FinalCTA from "@/components/landing/FinalCTA";
import Footer from "@/components/landing/Footer";

/**
 * / — Marketing landing page.
 *
 * The live builder/playground lives at /build.
 */
export default function Home() {
  return (
    <main className="bg-[#03040a] text-white selection:bg-cyan-300 selection:text-black antialiased">
      <Hero />
      <WhatItIs />
      <HowItWorks />
      <Brushes />
      <Engine />
      <Pricing />
      <FinalCTA />
      <Footer />
    </main>
  );
}
