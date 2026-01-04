import React from 'react';
import { content } from '@/data/content';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-100 border-t border-gray-200">
      <div className="max-w-7xl mx-auto py-10 px-6">
        <div className="flex flex-col items-center text-center gap-6">
          {/* Brand lockup */}
          <div className="flex items-center gap-3">
            <div className="text-center">
              <p className="text-sm font-semibold" style={{ color: '#1294F5' }}>
                {content.brand.title}
              </p>
              <p className="text-xs text-gray-600">
                {content.brand.subtitle}
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="w-12 h-px bg-gray-300" />

          {/* Links */}
          <div className="flex items-center gap-6 flex-wrap justify-center">
            {content.footer.links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm text-gray-600 hover:text-[#1294F5] transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Copyright */}
          <p className="text-xs text-gray-500">
            {content.footer.copyright}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
