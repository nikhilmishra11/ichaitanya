"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    const formData = new FormData(event.currentTarget);
    setError("");
    setLoading(true);
    const result = await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false
    });
    if (result?.ok) {
      router.push("/admin/dashboard");
      return;
    }
    setError("Invalid admin credentials");
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAF7F2] p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="font-serif text-3xl">Saarthi Admin Gate</CardTitle>
          <CardDescription>Use the seeded admin login to access the portal.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-4">
            <Input name="email" type="text" defaultValue="admin" placeholder="Username" autoComplete="username" required disabled={loading} />
            <Input name="password" type="password" defaultValue="Boldy@_1aekam" autoComplete="current-password" required disabled={loading} />
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <Button variant="accent" type="submit" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {loading ? "Opening Dashboard..." : "Enter Admin Portal"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
