import Container from "@/components/shared/container";
import { WEBSITE_NAME } from "@/constants";
import FormSignUp from "./form-sign-up";

export const metadata = {
  title: `Sign Up - ${WEBSITE_NAME}`,
  description: "Register to access your account and explore our services.",
};

export default function SignupPage() {
  return (
    <Container className="w-full h-full flex-center">
      <FormSignUp />
    </Container>
  );
}
