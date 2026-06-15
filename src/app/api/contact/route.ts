import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const form = await request.formData();
  await prisma.contactRequest.create({
    data: {
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
      phone: String(form.get("phone") ?? ""),
      message: String(form.get("message") ?? "")
    }
  });
  redirect("/contact?sent=1");
}
