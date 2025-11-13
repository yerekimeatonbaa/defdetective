
"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth.tsx";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ForgotPasswordPage() {
  const { sendPasswordReset } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await sendPasswordReset(email);
      setSubmitted(true);
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Error",
            description: error.message || "Failed to send password reset email. Please try again."
        })
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Forgot Password</CardTitle>
          <CardDescription>
            {submitted 
              ? "If an account exists for that email, a reset link has been sent."
              : "Enter your email to receive a password reset link."
            }
          </CardDescription>
        </CardHeader>
        {!submitted ? (
            <form onSubmit={handleSubmit}>
            <CardContent className="grid gap-4">
                <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                    id="email" 
                    type="email" 
                    placeholder="m@example.com" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                />
                </div>
            </CardContent>
            <CardFooter className="flex flex-col items-stretch gap-4">
                <Button className="w-full" type="submit" disabled={loading}>
                    {loading ? 'Sending...' : <><Mail className="mr-2 h-4 w-4"/> Send Reset Link</>}
                </Button>
            </CardFooter>
            </form>
        ) : (
            <CardContent>
                <p className="text-center text-sm text-muted-foreground">You can now close this page.</p>
            </CardContent>
        )}
        <CardFooter>
            <p className="mt-4 text-xs text-center text-muted-foreground w-full">
                Remember your password?{" "}
                <Link href="/login" className="underline text-primary">
                    Login
                </Link>
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}
