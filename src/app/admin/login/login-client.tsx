"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function LoginClient() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [csrfToken, setCsrfToken] = useState("");

  useEffect(() => {
    fetch("/api/auth/csrf")
      .then((response) => response.json())
      .then((data) => setCsrfToken(String(data.csrfToken ?? "")))
      .catch(() => setCsrfToken(""));
  }, []);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    const formData = new FormData(event.currentTarget);
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/auth/callback/credentials?json=true", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          csrfToken,
          email: String(formData.get("email") ?? ""),
          password: String(formData.get("password") ?? ""),
          callbackUrl: "/admin/dashboard",
          json: "true"
        })
      });
      const data = await response.json();
      if (response.ok && data?.url) {
        router.push(data.url);
        return;
      }
      setError("Invalid admin credentials");
    } catch {
      setError("Unable to sign in right now");
    } finally {
      setLoading(false);
    }
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
