import { useEffect, useState } from "react";

// True after the first client render — gates values read from persisted stores.
export default function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
