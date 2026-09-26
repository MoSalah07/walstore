import { notFound } from "next/navigation";

// Any unknown path inside a locale renders the storefront 404.
export default function CatchAll() {
  notFound();
}
