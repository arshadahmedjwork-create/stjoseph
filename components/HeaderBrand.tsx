import { content } from "@/data/content";
import crestImage from "@/assets/crest.png";

export function HeaderBrand() {
  return (
    <header className="bg-background border-b border-border">
      <div className="max-w-full px-6 lg:px-8 py-4 lg:py-6">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-6">
          <img
            src={crestImage}
            alt="St. Joseph's crest"
            className="h-16 w-16 lg:h-20 lg:w-20 object-contain"
          />
          <div className="text-center sm:text-left">
            <h2 className="font-display text-lg lg:text-xl font-semibold text-primary">
              {content.brand.title}
            </h2>
            <p className="text-small text-text-secondary mt-0.5">
              {content.brand.subtitle}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
