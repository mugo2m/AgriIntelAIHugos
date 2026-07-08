"use client";

import { z } from "zod";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { auth } from "@/firebase/client";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";

import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import { signIn, signUp, createPhoneAccount, signInWithPhone } from "@/lib/actions/auth.action";
import FormField from "./FormField";

// Country codes for African countries
const countryCodes = [
  { code: "+254", country: "Kenya", flag: "🇰🇪" },
  { code: "+255", country: "Tanzania", flag: "🇹🇿" },
  { code: "+256", country: "Uganda", flag: "🇺🇬" },
  { code: "+260", country: "Zambia", flag: "🇿🇲" },
  { code: "+27", country: "South Africa", flag: "🇿🇦" },
  { code: "+234", country: "Nigeria", flag: "🇳🇬" },
  { code: "+233", country: "Ghana", flag: "🇬🇭" },
  { code: "+1", country: "USA/Canada", flag: "🇺🇸" },
  { code: "+44", country: "UK", flag: "🇬🇧" },
];

// Email schema
const emailSignUpSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(3),
});

const emailSignInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(3),
});

// Phone PIN schema
const phoneSignUpSchema = z.object({
  name: z.string().min(3),
  countryCode: z.string(),
  phoneNumber: z.string().regex(/^\d{6,15}$/, "Please enter a valid phone number"),
  pin: z.string().regex(/^\d{4}$/, "PIN must be exactly 4 digits"),
});

const phoneSignInSchema = z.object({
  countryCode: z.string(),
  phoneNumber: z.string().regex(/^\d{6,15}$/, "Please enter a valid phone number"),
  pin: z.string().regex(/^\d{4}$/, "PIN must be exactly 4 digits"),
});

const AuthForm = ({ type }: { type: FormType }) => {
  const router = useRouter();
  const [authMethod, setAuthMethod] = useState<"email" | "phone">("email");

  // Email form
  const emailForm = useForm<z.infer<typeof emailSignUpSchema | typeof emailSignInSchema>>({
    resolver: zodResolver(type === "sign-up" ? emailSignUpSchema : emailSignInSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  // Phone form
  const phoneForm = useForm<z.infer<typeof phoneSignUpSchema | typeof phoneSignInSchema>>({
    resolver: zodResolver(type === "sign-up" ? phoneSignUpSchema : phoneSignInSchema),
    defaultValues: {
      name: "",
      countryCode: "+254",
      phoneNumber: "",
      pin: "",
    },
  });

  const onEmailSubmit = async (data: any) => {
    try {
      if (type === "sign-up") {
        const { name, email, password } = data;

        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

        const result = await signUp({
          uid: userCredential.user.uid,
          name,
          email,
          password,
        });

        if (!result.success) {
          toast.error(result.message);
          return;
        }

        toast.success("Account created successfully. Please sign in.");
        router.push("/sign-in");
      } else {
        const { email, password } = data;

        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );

        const idToken = await userCredential.user.getIdToken();
        await signIn({ email, idToken });

        toast.success("Signed in successfully.");
        setTimeout(() => window.location.href = "/", 100);
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const onPhoneSubmit = async (data: any) => {
    try {
      const { name, countryCode, phoneNumber, pin } = data;
      const fullPhone = `${countryCode}${phoneNumber}`;

      if (type === "sign-up") {
        const result = await createPhoneAccount({
          name,
          phone: fullPhone,
          pin,
        });

        if (!result.success) {
          toast.error(result.message);
          return;
        }

        toast.success("Phone account created successfully. Please sign in.");
        router.push("/sign-in");
      } else {
        const result = await signInWithPhone({
          phone: fullPhone,
          pin,
        });

        if (!result.success) {
          toast.error(result.message);
          return;
        }

        const userCredential = await signInWithEmailAndPassword(
          auth,
          result.email!,
          result.password!
        );

        const idToken = await userCredential.user.getIdToken();
        await signIn({ email: result.email!, idToken });

        toast.success("Signed in successfully.");
        setTimeout(() => window.location.href = "/", 100);
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const isSignIn = type === "sign-in";

  return (
    <div className="card-border lg:min-w-[566px]">
      <div className="flex flex-col gap-6 card py-14 px-10">
        <div className="flex flex-row gap-2 justify-center">
          <Image src="/logo.svg" alt="logo" height={32} width={38} />
          <h2 className="text-primary-100">hugos</h2>
        </div>

        <h3 className="text-center">Practice job interviews with AI</h3>

        {/* Method Selection Tabs - FIXED: Removed onValueChange */}
        <Tabs defaultValue="email" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger
              value="email"
              onClick={() => setAuthMethod("email")}
            >
              📧 Email
            </TabsTrigger>
            <TabsTrigger
              value="phone"
              onClick={() => setAuthMethod("phone")}
            >
              📱 Phone (4-digit PIN)
            </TabsTrigger>
          </TabsList>

          {/* Email Tab Content */}
          <TabsContent value="email">
            <Form {...emailForm}>
              <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-6 mt-4">
                {!isSignIn && (
                  <FormField
                    control={emailForm.control}
                    name="name"
                    label="Your Name"
                    placeholder="Your Name"
                    type="text"
                  />
                )}

                <FormField
                  control={emailForm.control}
                  name="email"
                  label="Your email address"
                  placeholder="Your email address"
                  type="email"
                />

                <FormField
                  control={emailForm.control}
                  name="password"
                  label="Enter your password"
                  placeholder="Enter your password"
                  type="password"
                />

                <Button className="btn w-full" type="submit">
                  {isSignIn ? "Sign In with Email" : "Create Email Account"}
                </Button>
              </form>
            </Form>
          </TabsContent>

          {/* Phone Tab Content */}
          <TabsContent value="phone">
            <Form {...phoneForm}>
              <form onSubmit={phoneForm.handleSubmit(onPhoneSubmit)} className="space-y-6 mt-4">
                {!isSignIn && (
                  <FormField
                    control={phoneForm.control}
                    name="name"
                    label="Your Name"
                    placeholder="Your Name"
                    type="text"
                  />
                )}

                {/* Phone Number with Country Code */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone Number</label>
                  <div className="flex gap-2">
                    <select
                      {...phoneForm.register('countryCode')}
                      className="w-28 px-3 py-2 border rounded-md bg-white dark:bg-gray-800"
                    >
                      {countryCodes.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.flag} {country.code}
                        </option>
                      ))}
                    </select>

                    <Input
                      type="tel"
                      placeholder="712345678"
                      {...phoneForm.register('phoneNumber')}
                      className="flex-1"
                      maxLength={15}
                    />
                  </div>
                </div>

                {/* 4-digit PIN */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">4-Digit PIN</label>
                  <Input
                    type="password"
                    placeholder="3846"
                    {...phoneForm.register('pin')}
                    maxLength={4}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500">
                    Enter a 4-digit number (e.g., 3846)
                  </p>
                </div>

                <Button className="btn w-full" type="submit">
                  {isSignIn ? "Sign In with Phone" : "Create Phone Account"}
                </Button>
              </form>
            </Form>
          </TabsContent>
        </Tabs>

        {/* Toggle between sign-in and sign-up */}
        <p className="text-center">
          {isSignIn ? "Don't have an account?" : "Already have an account?"}
          <Link
            href={!isSignIn ? "/sign-in" : "/sign-up"}
            className="font-bold text-user-primary ml-1"
          >
            {!isSignIn ? "Sign In" : "Sign Up"}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default AuthForm;