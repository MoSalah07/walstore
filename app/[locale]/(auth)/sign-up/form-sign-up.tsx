"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerUser, signInWithCredentials } from "@/actions/user.action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { IUserSignUp } from "@/interfaces/user.type";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserSignUpSchema } from "@/interfaces/validator/validator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import toast from "react-hot-toast";
import { useState } from "react";
import { WEBSITE_NAME } from "@/constants";
import Image from "next/image";

const signUpDefaultValues =
  process.env.NODE_ENV === "development"
    ? {
        name: "john doe",
        email: "john@me.com",
        password: "123456",
        confirmPassword: "123456",
      }
    : {
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
      };

export default function FormSignUp() {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);
  const form = useForm<IUserSignUp>({
    resolver: zodResolver(UserSignUpSchema),
    defaultValues: signUpDefaultValues,
  });

  const { control, handleSubmit, reset } = form;

  const handleRegister = async (data: IUserSignUp) => {
    setLoading(true);
    try {
      const res = await registerUser(data);
      if (!res.success) {
        toast.error(res.error as string);
      } else {
        toast.success(res.message as string);
        await signInWithCredentials({
          email: data.email,
          password: data.password,
        });
        reset();
        setLoading(false);
        router.push(`/`);
      }
    } catch (err) {
      console.log(err);
      setLoading(false);
      toast.error(`Something went wrong ${err}`);
    }
  };
  return (
    <Form {...form}>
      <form
        onSubmit={handleSubmit(handleRegister)}
        className="w-[95%] sm:w-[80%] lg:w-[60%] xl:w-1/2 bg-black/15 text-white py-12 px-6 md:px-32 min-h-[90vh] rounded-md"
      >
        <div className="w-full h-full bg-black/5 rounded-md px-6 py-4">
          <div className="text-white font-bold text-center mb-2 flex-center gap-1">
            <span>{WEBSITE_NAME}</span>
            <Image src={"/images/logo.svg"} alt="logo" width={42} height={42} />
          </div>
          <h2 className="text-white text-lg font-bold capitalize tracking-wide mb-4">
            Register
          </h2>
          <div className="h-full w-full">
            <FormField
              control={control}
              name="name"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      className="bg-white caret-primary-color text-black font-medium"
                      placeholder="Enter name address"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                      type="password"
                      className="bg-white caret-primary-color text-black font-medium"
                      placeholder="Enter password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      className="bg-white caret-primary-color text-black font-medium"
                      placeholder="Confirm Password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="my-6">
              <Button
                disabled={loading}
                variant={"default"}
                type="submit"
                className="bg-primary-color hover:bg-primary-color/50 w-full"
              >
                {loading ? "Registering..." : "Register"}
              </Button>
            </div>
            <p className="text-white/60 font-normal sm:font-medium text-[10px] sm:text-[13px] flex-center">
              Already have an account ?{" "}
              <Link
                className="font-bold text-white ml-1 hover:underline hover:text-white/90 hovcer-effect"
                href={`/sign-in`}
              >
                login now
              </Link>
            </p>
          </div>
        </div>
      </form>
    </Form>
  );
}
