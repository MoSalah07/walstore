"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { useTranslations } from "next-intl";

// Shown while the browser reports no connection.
export default function OfflineBanner() {
  const t = useTranslations("Errors");
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  if (!offline) return null;
  return (
    <div role="status" className="sticky top-0 z-50 flex items-center justify-center gap-2 bg-warning-bg px-4 py-2.5 text-sm font-semibold text-warning-fg">
      <WifiOff className="size-4 shrink-0" aria-hidden />
      {t("Offline")}
    </div>
  );
}
