import Container from "@/components/shared/container";
import { WEBSITE_NAME } from "@/constants";
import React from "react";
import FormSignIn from "./form-sign-in";

export const metadata = {
  title: `Sign In - ${WEBSITE_NAME}`,
  description: "Login to access your account and explore our services.",
};

export default function SignInPage() {
  return (
    <Container className="w-full h-full flex-center">
      <FormSignIn />
    </Container>
  );
}
