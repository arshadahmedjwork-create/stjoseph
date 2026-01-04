import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ScrollProgress } from "@/components/ScrollProgress";
import { Navbar } from "@/components/Navbar";
import { HeroCTA } from "@/components/HeroCTA";
import { LegacySection } from "@/components/LegacySection";
import { TestimonialSection } from "@/components/TestimonialSection";
import { CampusBanner } from "@/components/CampusBanner";

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <ScrollProgress />

      <Navbar />
      <main className="flex-1">
        <HeroCTA />
        <LegacySection />
        <TestimonialSection />
        <CampusBanner />
      </main>
    </div>
  );
};

export default HomePage;
