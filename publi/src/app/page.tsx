import { CTASection } from "@/components/publi/CTASection";
import { FeatureTabs } from "@/components/publi/FeatureTabs";
import { FeaturesGrid } from "@/components/publi/FeaturesGrid";
import { Footer } from "@/components/publi/Footer";
import { Hero } from "@/components/publi/Hero";
import { MultiPlatform } from "@/components/publi/MultiPlatform";
import { Navbar } from "@/components/publi/Navbar";
import { createClient } from "@/lib/supabase/server";

export default async function LandingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isLoggedIn = !!user;

  return (
    <main className="min-h-screen bg-background">
      <Navbar isLoggedIn={isLoggedIn} />
      <Hero isLoggedIn={isLoggedIn} />
      <FeatureTabs />
      <MultiPlatform />
      <FeaturesGrid />
      <CTASection isLoggedIn={isLoggedIn} />
      <Footer />
    </main>
  );
}
