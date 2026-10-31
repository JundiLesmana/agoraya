import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type ExploreCtaBannerProps = {
  titleId: string;
  eyebrow: string;
  title: string;
  description: string;
  buttonLabel: string;
  buttonHref: string;
  mobileDescription?: string;
};

export function ExploreCtaBanner({
  titleId,
  eyebrow,
  title,
  description,
  buttonLabel,
  buttonHref,
  mobileDescription,
}: ExploreCtaBannerProps) {
  return (
    <section
      aria-labelledby={titleId}
      className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8 lg:pb-12"
    >
      <div className="relative isolate aspect-[350/180] overflow-hidden rounded-2xl bg-slate-950 text-white shadow-lg shadow-slate-950/10 sm:aspect-[1320/300] sm:rounded-3xl">
        <picture className="absolute inset-0 -z-10 block">
          <source
            media="(max-width: 639px)"
            srcSet="/landing/footer-mobile.png"
          />
          <Image
            src="/landing/footer-desktop.png"
            alt=""
            fill
            sizes="(max-width: 1280px) 100vw, 1280px"
            className="object-cover"
          />
        </picture>
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-[5] bg-gradient-to-r from-slate-950/80 via-slate-950/45 to-transparent"
        />
        <div className="absolute inset-y-0 left-0 flex w-[68%] flex-col items-start justify-center gap-0.5 px-2 py-1 sm:w-auto sm:max-w-[54%] sm:gap-3 sm:px-8 sm:py-0 lg:px-12">
          <p className="text-[0.55rem] font-semibold tracking-[0.14em] text-sky-200 sm:text-xs sm:tracking-[0.2em]">
            {eyebrow}
          </p>
          <h2
            id={titleId}
            className="text-xs leading-[1.05] font-semibold tracking-tight sm:text-2xl sm:leading-tight lg:text-3xl"
          >
            {title}
          </h2>
          {mobileDescription && (
            <p className="max-w-sm text-xs leading-[1.15] text-slate-200 sm:hidden">
              {mobileDescription}
            </p>
          )}
          <p
            className={
              mobileDescription
                ? "hidden max-w-sm text-xs leading-[1.15] text-slate-200 sm:block sm:text-sm sm:leading-6"
                : "max-w-sm text-xs leading-[1.15] text-slate-200 sm:text-sm sm:leading-6"
            }
          >
            {description}
          </p>
          <Button
            asChild
            className="h-8 bg-white px-3 text-xs text-blue-800 hover:bg-slate-100 focus-visible:ring-white sm:h-10 sm:px-4 sm:text-sm"
          >
            <Link href={buttonHref}>
              {buttonLabel}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
