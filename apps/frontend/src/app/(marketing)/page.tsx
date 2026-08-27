import { HeroSection } from "@/components/marketing/HeroSection";
import { ProcessSteps } from "@/components/marketing/ProcessSteps";
import { BenefitsGrid } from "@/components/marketing/BenefitsGrid";
import { CarriersStrip } from "@/components/marketing/CarriersStrip";
import { FinalCta } from "@/components/marketing/FinalCta";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <ProcessSteps />
      <BenefitsGrid />
      <CarriersStrip />
      <FinalCta />
    </>
  );
}