import React from "react";
import Container from "../container";

import ScrollTop from "./ScrollTop";
import FooterTop from "./FooterTop";
import FooterBottom from "./FooterBottom";

export default function Footer() {
  return (
    <footer className="bg-blue-700 min-h-[10vh]">
      <ScrollTop />
      <Container className="h-full w-full py-8">
        <FooterTop />
        <FooterBottom />
      </Container>
    </footer>
  );
}
