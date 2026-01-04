import { useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { content } from "@/data/content";
import { Button } from "@/components/Button";
import { useActiveSection, scrollToSection } from "@/hooks/useActiveSection";
import crest from "@/assets/crest.png";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Extract section IDs from nav links
  const sectionIds = useMemo(
    () => content.nav.links.map((link) => link.href.replace("#", "")),
    []
  );

  const activeSection = useActiveSection(sectionIds);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    scrollToSection(href);
    setIsMobileMenuOpen(false);
  };

  return (
    <header
      className={`sticky top-0 z-50 bg-surface transition-shadow duration-200 ${
        isScrolled ? "shadow-md" : ""
      }`}
    >
      <div className="border-b border-border">
        <nav className="max-w-full px-6 lg:px-8 flex items-center justify-between py-3 lg:py-4">
          {/* Brand Lockup */}
          <Link to="/" className="flex items-center gap-3">
            <img
              src={crest}
              alt="St. Joseph's crest"
              className="h-8 w-8 lg:h-9 lg:w-9 object-contain"
            />
            <div className="hidden sm:block">
              <p className="font-display text-sm lg:text-base font-bold text-primary-deep leading-tight">
                {content.brand.title}
              </p>
              <p className="text-xs text-text-secondary">
                {content.brand.subtitle}
              </p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            {content.nav.links.map((link) => {
              const isActive = activeSection === link.href.replace("#", "");
              return (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className={`relative text-sm font-medium transition-colors py-1 ${
                    isActive ? "text-primary-deep" : "text-text-secondary hover:text-primary-deep"
                  }`}
                >
                  {link.label}
                  <motion.span
                    className="absolute bottom-0 left-0 h-0.5 bg-primary"
                    initial={false}
                    animate={{ width: isActive ? "100%" : "0%" }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                  />
                </a>
              );
            })}
            <Link to="/alumni/submit">
              <Button size="default">{content.hero.ctaLabel}</Button>
            </Link>
            <Link to="/admin">
              <Button size="default" className="bg-primary-deep hover:bg-primary">Admin Portal</Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-3 md:hidden">
            <Link to="/alumni/submit">
              <Button size="sm">{content.hero.ctaLabel}</Button>
            </Link>
          </div>
        </nav>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden bg-surface border-b border-border overflow-hidden"
          >
            <div className="max-w-full px-6 lg:px-8 py-4 flex flex-col gap-3">
              {content.nav.links.map((link) => {
                const isActive = activeSection === link.href.replace("#", "");
                return (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={(e) => handleNavClick(e, link.href)}
                    className={`text-base font-medium transition-colors py-2 ${
                      isActive ? "text-primary-deep" : "text-text-secondary hover:text-primary-deep"
                    }`}
                  >
                    {link.label}
                    {isActive && (
                      <span className="ml-2 inline-block w-1.5 h-1.5 rounded-full bg-primary" />
                    )}
                  </a>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
