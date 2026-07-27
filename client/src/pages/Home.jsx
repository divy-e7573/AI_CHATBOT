import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { AboutSection } from "../components/landing/AboutSection";
import { AuthDialog } from "../components/landing/AuthDialog";
import { FeaturesSection } from "../components/landing/FeaturesSection";
import { Footer } from "../components/landing/Footer";
import { HeroSection } from "../components/landing/HeroSection";
import { Navbar } from "../components/landing/Navbar";
import { PricingSection } from "../components/landing/PricingSection";
import { useAuthStore } from "../store/authStore";

export default function Home({ initialAuthMode = null }) {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const [authOpen, setAuthOpen] = useState(Boolean(initialAuthMode));
  const [authMode, setAuthMode] = useState(initialAuthMode || "signup");

  useEffect(() => {
    if (!initialAuthMode) return;
    setAuthMode(initialAuthMode);
    setAuthOpen(true);
  }, [initialAuthMode]);

  const openAuth = (mode) => {
    if (token) {
      navigate("/chat");
      return;
    }
    setAuthMode(mode);
    setAuthOpen(true);
    navigate(`/${mode}`);
  };

  const setDialogOpen = (open) => {
    setAuthOpen(open);
    if (!open) navigate("/", { replace: true });
  };

  const changeMode = (mode) => {
    setAuthMode(mode);
    navigate(`/${mode}`, { replace: true });
  };

  const getStarted = () => (token ? navigate("/chat") : openAuth("signup"));

  return (
    <div className="landing-page min-h-screen bg-white text-slate-950">
      <Navbar
        authenticated={Boolean(token)}
        onLogin={() => openAuth("login")}
        onSignup={() => openAuth("signup")}
        onOpenChat={() => navigate("/chat")}
      />
      <main>
        <HeroSection onGetStarted={getStarted} />
        <FeaturesSection />
        <AboutSection onGetStarted={getStarted} />
        <PricingSection onGetStarted={getStarted} />
      </main>
      <Footer onGetStarted={getStarted} />
      <AuthDialog
        open={authOpen}
        mode={authMode}
        onOpenChange={setDialogOpen}
        onModeChange={changeMode}
        onSuccess={() => navigate("/chat")}
      />
    </div>
  );
}
