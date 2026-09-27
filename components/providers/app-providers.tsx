"use client";

import * as React from "react";
import { DirectionProvider } from "@radix-ui/react-direction";
import { Toaster } from "react-hot-toast";

import { ThemeProvider } from "./theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import OfflineBanner from "@/components/shared/offline-banner";

function useIsMobile() {
  const [mobile, setMobile] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return mobile;
}

export default function AppProviders({
  dir,
  children,
}: {
  dir: "ltr" | "rtl";
  children: React.ReactNode;
}) {
  const mobile = useIsMobile();
  return (
    <DirectionProvider dir={dir}>
      <ThemeProvider>
        <TooltipProvider delayDuration={300}>
          <OfflineBanner />
          {children}
          {/* Bottom-right on desktop, bottom-centre above the tab bar on mobile. */}
          <Toaster
            position={mobile ? "bottom-center" : dir === "rtl" ? "bottom-left" : "bottom-right"}
            containerStyle={mobile ? { bottom: 88 } : { bottom: 24, insetInline: 24 }}
            toastOptions={{
              duration: 5000,
              className:
                "!max-w-[380px] !rounded-md !bg-inverse !px-4 !py-3.5 !text-sm !font-sans !text-inverse-foreground !shadow-md",
              success: { iconTheme: { primary: "rgb(var(--inverse-success))", secondary: "rgb(var(--inverse))" } },
              error: { duration: Infinity, iconTheme: { primary: "rgb(var(--inverse-error))", secondary: "rgb(var(--inverse))" } },
            }}
          />
        </TooltipProvider>
      </ThemeProvider>
    </DirectionProvider>
  );
}
