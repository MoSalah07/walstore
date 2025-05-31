import Container from "@/components/shared/container";
import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WEBSITE_NAME } from "@/constants";
import Link from "next/link";
import React from "react";

export const metadata = {
  title: `Sign In - ${WEBSITE_NAME}`,
  description: "Login to access your account and explore our services.",
};

export default function SignInPage() {
  return (
    <Container className="w-full h-full flex-center">
      <form
        action=""
        className="w-[95%] sm:w-[80%] lg:w-[60%] xl:w-1/2 bg-black/15 text-white py-12 px-6 sm:px-32 h-[60vh] rounded-md"
      >
        <div className="w-full h-full bg-black/5 rounded-md px-6 py-6">
          <div className="text-white font-bold text-center mb-8">Logo</div>
          <h2 className="text-white text-lg font-medium capitalize tracking-wide mb-8">
            login
          </h2>
          <div className="flex flex-col gap-4">
            <div>
              <Label className="text-[12px] font-normal" htmlFor="email">
                Email
              </Label>
              <Input
                type="email"
                required
                className="bg-white text-black outline-none focus:outline-none border border-transparent"
              />
            </div>
            <div>
              <Label className="text-[12px] font-normal" htmlFor="password">
                Password
              </Label>
              <Input
                type="password"
                required
                className="bg-white text-black outline-none focus:outline-none border border-transparent"
              />
            </div>
            <div className="mt-4">
              <Button
                variant={"default"}
                type="submit"
                className="bg-primary-color hover:bg-primary-color/50 w-full"
              >
                Sign in
              </Button>
            </div>
            <p className="text-white/60 font-normal sm:font-medium text-[10px] sm:text-[13px] flex-center">
              dont have an account yet ?{" "}
              <Link
                className="font-bold text-white ml-1 hover:underline hover:text-white/90 hovcer-effect"
                href={`/sign-up`}
              >
                Register Now
              </Link>
            </p>
          </div>
        </div>
      </form>
    </Container>
  );
}
