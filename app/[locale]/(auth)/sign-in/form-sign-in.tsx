"use client";
import { signInWithCredentials } from "@/actions/user.action";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { IUserSignIn } from "@/interfaces/user.type";
import { UserSignInSchema } from "@/interfaces/validator/validator";
import { zodResolver } from "@hookform/resolvers/zod";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { WEBSITE_NAME } from "@/constants";

const signInDefaultValues =
  process.env.NODE_ENV === "development"
    ? {
        email: "admin@example.com",
        password: "123456",
      }
    : {
        email: "",
        password: "",
      };

export default function FormSignIn() {
  const [loading, setLoading] = useState<boolean>(false);

  const { push } = useRouter();

  const form = useForm<IUserSignIn>({
    resolver: zodResolver(UserSignInSchema),
    defaultValues: signInDefaultValues,
  });

  const { control, handleSubmit } = form;

  const handlerOnSubmit = async (data: IUserSignIn) => {
    setLoading(true);
    try {
      await signInWithCredentials({
        email: data.email,
        password: data.password,
      });
      setLoading(false);
      toast.success("Login successfully");
      push(`/`);
    } catch (error) {
      if (isRedirectError(error)) {
        throw error;
      }
      toast.error("Invalid email or password");
      setLoading(false);
    }
  };
  return (
    <Form {...form}>
      <form
        onSubmit={handleSubmit(handlerOnSubmit)}
        className="w-[95%] sm:w-[80%] lg:w-[60%] xl:w-1/2 bg-black/15 text-white py-12 px-6 sm:px-32 min-h-[60vh] rounded-md"
      >
        <div className="w-full h-full bg-black/5 rounded-md px-6 py-6">
          <div className="text-white font-bold text-center mb-8 flex-center gap-1">
            <span>{WEBSITE_NAME}</span>
            <Image src={"/images/logo.svg"} alt="logo" width={42} height={42} />
          </div>
          <h2 className="text-white text-lg font-bold capitalize tracking-wide mb-8">
            login
          </h2>
          <div className="flex flex-col gap-4">
            <FormField
              control={control}
              name="email"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      className="bg-white caret-primary-color text-black font-medium"
                      placeholder="Enter email address"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="password"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      className="bg-white caret-primary-color text-black font-medium"
                      type="password"
                      placeholder="Enter password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="mt-4">
              <Button
                disabled={loading}
                variant={"default"}
                type="submit"
                className="bg-primary-color hover:bg-primary-color/50 w-full text-white"
              >
                {loading ? "Loading..." : "Sign in"}
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
    </Form>
  );
}
