import { CTASection } from "@/components/publi/CTASection";
import { FeatureTabs } from "@/components/publi/FeatureTabs";
import { FeaturesGrid } from "@/components/publi/FeaturesGrid";
import { Footer } from "@/components/publi/Footer";
import { Hero } from "@/components/publi/Hero";
import { MultiPlatform } from "@/components/publi/MultiPlatform";
import { Navbar } from "@/components/publi/Navbar";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export default async function LandingPage() {
  const cookieStore = await cookies();
  const hasAuthCookie = cookieStore.getAll().some((c) => c.name.includes("-auth-token"));

  let isLoggedIn = false;

  if (hasAuthCookie) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    isLoggedIn = !!user;
  }

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
