import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const { email, code, name } = await req.json();

    if (!email || !code) {
      return NextResponse.json({ success: false, error: "Email and OTP code are required" }, { status: 400 });
    }

    console.log(`[OTP DISPATCH] Destination: ${email} | 6-Digit OTP Code: ${code} | Name: ${name || "User"}`);

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #030712; margin: 0; padding: 40px 20px; color: #F8FAFC; }
        .container { max-width: 520px; margin: 0 auto; background-color: #0F172A; border: 1px solid #1E293B; border-radius: 20px; padding: 36px; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
        .header { text-align: center; margin-bottom: 28px; }
        .brand { font-size: 28px; font-weight: 900; color: #FFFFFF; letter-spacing: -0.5px; margin: 0; }
        .brand-green { color: #54B400; }
        .subtitle { font-size: 13px; color: #94A3B8; margin-top: 6px; }
        .divider { height: 1px; background: #1E293B; margin: 24px 0; }
        .heading { font-size: 18px; font-weight: 700; color: #F1F5F9; margin-bottom: 12px; text-align: center; }
        .text { font-size: 14px; color: #CBD5E1; line-height: 1.6; text-align: center; margin-bottom: 24px; }
        .otp-box { background: linear-gradient(135deg, #020617 0%, #0F172A 100%); border: 2px solid #2563EB; border-radius: 16px; padding: 24px; text-align: center; margin: 24px 0; box-shadow: 0 10px 25px -5px rgba(37, 99, 235, 0.3); }
        .otp-code { font-size: 38px; font-weight: 900; letter-spacing: 10px; color: #38BDF8; font-family: 'Courier New', Courier, monospace; margin: 0; text-shadow: 0 0 10px rgba(56, 189, 248, 0.4); }
        .badge { display: inline-block; background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.3); color: #38BDF8; font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 20px; margin-top: 10px; text-transform: uppercase; letter-spacing: 1px; }
        .warning { font-size: 12px; color: #64748B; text-align: center; margin-top: 20px; line-height: 1.5; }
        .footer { text-align: center; margin-top: 32px; font-size: 12px; color: #475569; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 class="brand">zplus<span class="brand-green">crm</span></h1>
          <p class="subtitle">Practice Management Workspace</p>
        </div>
        
        <div class="divider"></div>

        <h2 class="heading">Security Verification Code</h2>
        <p class="text">Hello ${name ? name : "User"},<br>Use the 6-digit verification code below to complete your account registration:</p>

        <div class="otp-box">
          <p class="otp-code">${code}</p>
          <div class="badge">Expires in 10 minutes</div>
        </div>

        <p class="warning">🔒 If you did not request this registration code, please ignore this email.<br>Do not share this OTP code with anyone for security purposes.</p>

        <div class="divider"></div>

        <div class="footer">
          <p>© 2025 zpluscrm • Practice Management Suite. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
    `;

    // 1. Resend API Dispatch
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendKey.trim()}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "zpluscrm Security <onboarding@resend.dev>",
            to: [email],
            subject: `Your zpluscrm Verification Code: [ ${code} ]`,
            html: htmlContent,
          }),
        });
        const resData = await res.json();
        console.log("Resend API response:", res.status, resData);
      } catch (resendErr: any) {
        console.error("Resend API send error:", resendErr);
      }
    }

    // 2. Nodemailer SMTP Dispatch
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT) || 587,
          secure: Number(process.env.SMTP_PORT) === 465,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        await transporter.sendMail({
          from: `"zpluscrm Security" <${process.env.SMTP_USER}>`,
          to: email,
          subject: `Your zpluscrm Verification Code: [ ${code} ]`,
          text: `Your zpluscrm verification code is: ${code}. Valid for 10 minutes.`,
          html: htmlContent,
        });
      } catch (mailErr: any) {
        console.error("Live SMTP send error:", mailErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: `OTP verification code processed for ${email}`,
    });
  } catch (error: any) {
    console.error("Failed to send OTP email:", error);
    return NextResponse.json({ success: true, message: "OTP code processed" });
  }
}
