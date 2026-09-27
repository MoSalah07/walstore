import Image from "next/image";
import { Check } from "lucide-react";

import Logo from "@/components/shared/logo";
import { cn } from "@/lib/utils";

const tiles = [
  { src: "/images/p35-1.jpg", bg: "bg-media" },
  { src: "/images/p41-1.jpg", bg: "bg-inverse-raised", round: true },
  { src: "/images/p22-1.jpg", bg: "bg-media" },
  { src: "/images/p11-1.jpg", bg: "bg-media" },
];

// Desktop: dark product panel beside the form. Phones: logo above the form.
export default function AuthShell({
  title,
  body,
  perks,
  children,
}: {
  title: string;
  body?: string;
  perks?: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh gap-6 bg-background p-4 lg:p-6">
      <aside className="hidden w-[min(640px,45%)] shrink-0 flex-col rounded-3xl bg-inverse p-12 text-inverse-foreground lg:flex">
        <Logo tone="inverse" />
        {perks ? (
          <div className="mt-auto flex flex-col gap-6">
            <h2 className="font-display text-[52px] font-extrabold leading-[1.02] tracking-[-0.035em]">{title}</h2>
            <ul className="flex flex-col gap-4 text-base">
              {perks.map((p) => (
                <li key={p} className="flex items-center gap-3">
                  <span className="flex size-8 items-center justify-center rounded-full bg-inverse-accent text-inverse-accent-foreground">
                    <Check className="size-4" strokeWidth={2.5} aria-hidden />
                  </span>
                  {p}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <>
            <div className="mt-12 grid grid-cols-2 gap-4">
              {tiles.map((tile) => (
                <div key={tile.src} className={cn("relative flex h-[200px] items-center justify-center rounded-xl", tile.bg)}>
                  <span className="relative h-[170px] w-[150px]">
                    <Image
                      src={tile.src}
                      alt=""
                      fill
                      sizes="160px"
                      className={cn("object-contain", tile.round ? "rounded-md" : "mix-blend-multiply")}
                    />
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-auto flex flex-col gap-3 pt-10">
              <h2 className="font-display text-[44px] font-extrabold leading-[1.05] tracking-[-0.035em]">{title}</h2>
              {body && <p className="text-base leading-relaxed text-inverse-muted">{body}</p>}
            </div>
          </>
        )}
      </aside>
      <main className="flex flex-1 flex-col items-center justify-center py-8">
        <div className="mb-10 lg:hidden">
          <Logo />
        </div>
        <div className="w-full max-w-[420px]">{children}</div>
      </main>
    </div>
  );
}
