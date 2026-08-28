import { HeroSection } from "@/components/marketing/HeroSection";
import { ProcessSteps } from "@/components/marketing/ProcessSteps";
import { BenefitsGrid } from "@/components/marketing/BenefitsGrid";
import { CarriersStrip } from "@/components/marketing/CarriersStrip";
import { ValuesSection } from "@/components/marketing/ValuesSection";
import { MissionVisionSection } from "@/components/marketing/MissionVisionSection";
import { FinalCta } from "@/components/marketing/FinalCta";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { ServicesSection } from "@/components/marketing/ServicesSection";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-[var(--ink)]">
      <SiteHeader />
      <main>
        <HeroSection />
        <ProcessSteps />
        <ServicesSection />
        <BenefitsGrid />
        <CarriersStrip />
        <ValuesSection />
        <MissionVisionSection />
        <FinalCta />
      </main>
      <SiteFooter />
    </div>
  );
}