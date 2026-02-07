import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      // Don't reveal whether the email exists
      return NextResponse.json({
        message: "If an account with that email exists, we've sent a password reset link.",
      });
    }

    // Generate a secure random token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { email: normalizedEmail },
      data: { resetToken, resetTokenExpiry },
    });

    // Build reset URL
    const baseUrl =
      process.env.NEXTAUTH_URL ||
      process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000";
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

    // Require email service to be configured
    if (!process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not configured. Cannot send password reset emails.");
      return NextResponse.json(
        { error: "Email service is not configured. Please contact the administrator." },
        { status: 500 }
      );
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Organic SEO <onboarding@resend.dev>",
      to: normalizedEmail,
      subject: "Reset your Organic SEO password",
      html: `
        <div style="font-family: Georgia, 'Times New Roman', serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="font-size: 24px; color: #111827; margin: 0;">Organic SEO</h1>
            <p style="color: #6b7280; font-size: 14px; margin-top: 4px;">AI Citation Checker</p>
          </div>

          <h2 style="font-size: 20px; color: #111827; margin-bottom: 16px;">Reset your password</h2>

          <p style="color: #4b5563; font-size: 15px; line-height: 1.6;">
            Hi${user.name ? ` ${user.name}` : ''},
          </p>
          <p style="color: #4b5563; font-size: 15px; line-height: 1.6;">
            We received a request to reset your password. Click the button below to set a new password. This link expires in 1 hour.
          </p>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetUrl}"
               style="background-color: #4263eb; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; display: inline-block;">
              Reset Password
            </a>
          </div>

          <p style="color: #9ca3af; font-size: 13px; line-height: 1.6;">
            If you didn't request this, you can safely ignore this email. Your password won't be changed.
          </p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;" />

          <p style="color: #9ca3af; font-size: 12px;">
            If the button doesn't work, copy and paste this link into your browser:<br/>
            <a href="${resetUrl}" style="color: #4263eb; word-break: break-all;">${resetUrl}</a>
          </p>
        </div>
      `,
    });

    return NextResponse.json({
      message: "If an account with that email exists, we've sent a password reset link.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
