import nodemailer from "nodemailer";

interface SendOtpParams {
  toEmail: string;
  toPhone: string;
  ownerName: string;
  businessName: string;
  otp: string;
}

/**
 * Konfigurasi Pengirim Default
 */
export const NOTIFICATION_CONFIG = {
  defaultSenderEmail: process.env.SMTP_USER || "qisthih@gmail.com",
  defaultSenderPhone: process.env.WA_SENDER_PHONE || "085716008651",
  smtpHost: process.env.SMTP_HOST || "smtp.gmail.com",
  smtpPort: Number(process.env.SMTP_PORT) || 465,
  smtpUser: process.env.SMTP_USER || "qisthih@gmail.com",
  smtpPass: process.env.SMTP_PASS || "", // Google App Password 16 karakter jika diisi di .env
  waGatewayUrl: process.env.WA_GATEWAY_URL || "", // URL endpoint gateway WA (opsional)
  waGatewayToken: process.env.WA_GATEWAY_TOKEN || "", // Token auth gateway WA (opsional)
};

/**
 * 1. Kirim Email OTP via SMTP / Nodemailer
 */
export async function sendOtpEmail({
  toEmail,
  ownerName,
  businessName,
  otp,
}: {
  toEmail: string;
  ownerName: string;
  businessName: string;
  otp: string;
}): Promise<{ sent: boolean; message: string }> {
  try {
    // Jika password SMTP belum di-set di .env, kita log instruksi bantuan dan status
    if (!NOTIFICATION_CONFIG.smtpPass) {
      console.log(`\n📧 [EMAIL OTP DISPATCH SIMULATION]`);
      console.log(`Pengirim (From): Qassa POS <${NOTIFICATION_CONFIG.defaultSenderEmail}>`);
      console.log(`Penerima (To): ${ownerName} <${toEmail}> (Toko: ${businessName})`);
      console.log(`Subjek: ${otp} adalah Kode Verifikasi Pendaftaran Qassa POS`);
      console.log(`Isi: Halo ${ownerName}, kode OTP Anda adalah ${otp} (berlaku 10 menit).`);
      console.log(`💡 Tips: Untuk pengiriman email nyata via Gmail, isi SMTP_PASS (16 digit Google App Password) di file .env\n`);
      return {
        sent: false,
        message: "Email SMTP_PASS belum diset di .env (cek log terminal untuk kode OTP)",
      };
    }

    const transporter = nodemailer.createTransport({
      host: NOTIFICATION_CONFIG.smtpHost,
      port: NOTIFICATION_CONFIG.smtpPort,
      secure: NOTIFICATION_CONFIG.smtpPort === 465,
      auth: {
        user: NOTIFICATION_CONFIG.smtpUser,
        pass: NOTIFICATION_CONFIG.smtpPass,
      },
    });

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 32px 24px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #4F46E5; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Qassa Cloud POS</h2>
          <p style="color: #64748B; font-size: 13px; margin-top: 4px;">Platform Kasir Cerdas Multi-Vertikal</p>
        </div>
        
        <div style="background-color: #F8FAFC; border-radius: 12px; padding: 24px; border: 1px solid #EEF2F6; margin-bottom: 24px;">
          <p style="color: #1E293B; font-size: 15px; margin: 0 0 12px 0;">Halo <strong>${ownerName}</strong>,</p>
          <p style="color: #475569; font-size: 14px; line-height: 1.5; margin: 0 0 20px 0;">
            Terima kasih telah mendaftarkan <strong>${businessName}</strong> di Qassa POS. Berikut adalah kode verifikasi akun Anda:
          </p>
          
          <div style="text-align: center; padding: 18px; background: linear-gradient(135deg, #4F46E5, #7C3AED); border-radius: 12px; margin-bottom: 16px;">
            <span style="font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #FFFFFF; font-family: monospace;">${otp}</span>
          </div>
          
          <p style="color: #94A3B8; font-size: 12px; margin: 0; text-align: center;">
            Kode verifikasi ini berlaku selama <strong>10 menit</strong>. Jangan bagikan kode ini kepada siapapun.
          </p>
        </div>
        
        <div style="text-align: center; border-top: 1px solid #F1F5F9; padding-top: 20px;">
          <p style="color: #94A3B8; font-size: 11px; margin: 0;">
            Email ini dikirim otomatis oleh sistem pendaftaran Qassa POS.<br/>
            Pengirim resmi: ${NOTIFICATION_CONFIG.defaultSenderEmail}
          </p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"Qassa POS" <${NOTIFICATION_CONFIG.defaultSenderEmail}>`,
      to: toEmail,
      subject: `${otp} adalah Kode Verifikasi Pendaftaran Qassa POS`,
      html: htmlContent,
    });

    console.log(`✅ [EMAIL SENT] Sukses terkirim ke ${toEmail} dari ${NOTIFICATION_CONFIG.defaultSenderEmail}`);
    return { sent: true, message: "Email OTP berhasil dikirim." };
  } catch (error: any) {
    console.error(`❌ [EMAIL ERROR] Gagal mengirim email ke ${toEmail}:`, error.message);
    return { sent: false, message: error.message };
  }
}

/**
 * 2. Kirim WhatsApp OTP via Gateway API / Webhook
 */
export async function sendOtpWhatsApp({
  toPhone,
  ownerName,
  businessName,
  otp,
}: {
  toPhone: string;
  ownerName: string;
  businessName: string;
  otp: string;
}): Promise<{ sent: boolean; message: string }> {
  try {
    const formattedPhone = toPhone.startsWith("0")
      ? "62" + toPhone.slice(1)
      : toPhone.replace("+", "");

    const waMessage = `*Qassa Cloud POS - Kode Verifikasi Pendaftaran*\n\nHalo *${ownerName}*,\nTerima kasih telah mendaftarkan *${businessName}*.\n\nBerikut adalah 6-digit kode OTP verifikasi akun Anda:\n\n👉 *${otp}*\n\n_Kode ini berlaku selama 10 menit. Mohon untuk tidak membagikan kode ini kepada siapa pun demi keamanan akun Anda._\n\nPengirim: ${NOTIFICATION_CONFIG.defaultSenderPhone}`;

    // Jika WA Gateway URL belum di-set, log ke server console
    if (!NOTIFICATION_CONFIG.waGatewayUrl) {
      console.log(`\n📱 [WHATSAPP OTP DISPATCH SIMULATION]`);
      console.log(`Nomor Pengirim (From): ${NOTIFICATION_CONFIG.defaultSenderPhone}`);
      console.log(`Nomor Penerima (To): ${formattedPhone} (${ownerName})`);
      console.log(`Pesan WhatsApp:\n${waMessage}`);
      console.log(`💡 Tips: Untuk integrasi WA Gateway otomatis (Fonnte/Waba), isi WA_GATEWAY_URL & WA_GATEWAY_TOKEN di .env\n`);
      return {
        sent: false,
        message: "WA_GATEWAY_URL belum diset (cek log terminal untuk kode OTP)",
      };
    }

    // Panggil REST API Gateway WhatsApp jika URL telah dikonfigurasi
    const response = await fetch(NOTIFICATION_CONFIG.waGatewayUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: NOTIFICATION_CONFIG.waGatewayToken,
      },
      body: JSON.stringify({
        target: formattedPhone,
        message: waMessage,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`❌ [WA GATEWAY ERROR]: ${errText}`);
      return { sent: false, message: `Gateway error: ${response.statusText}` };
    }

    console.log(`✅ [WA SENT] Sukses terkirim ke ${formattedPhone} dari ${NOTIFICATION_CONFIG.defaultSenderPhone}`);
    return { sent: true, message: "WhatsApp OTP berhasil dikirim." };
  } catch (error: any) {
    console.error(`❌ [WA ERROR] Gagal mengirim WA ke ${toPhone}:`, error.message);
    return { sent: false, message: error.message };
  }
}

/**
 * 3. Dispatcher Terpadu (Kirim ke Email & WhatsApp sekaligus)
 */
export async function sendOtpToAllChannels(params: SendOtpParams) {
  const { toEmail, toPhone, ownerName, businessName, otp } = params;

  console.log(`\n==================================================`);
  console.log(`🚀 [QASSA DISPATCHER: Mengirim OTP ke Email & WA]`);
  console.log(`Pengirim Email : ${NOTIFICATION_CONFIG.defaultSenderEmail}`);
  console.log(`Pengirim WA    : ${NOTIFICATION_CONFIG.defaultSenderPhone}`);
  console.log(`Penerima       : ${ownerName} (${businessName})`);
  console.log(`Email Tujuan   : ${toEmail}`);
  console.log(`WhatsApp Tujuan: ${toPhone}`);
  console.log(`KODE OTP       : >>> ${otp} <<<`);
  console.log(`==================================================\n`);

  const [emailResult, waResult] = await Promise.allSettled([
    sendOtpEmail({ toEmail, ownerName, businessName, otp }),
    sendOtpWhatsApp({ toPhone, ownerName, businessName, otp }),
  ]);

  return {
    email: emailResult.status === "fulfilled" ? emailResult.value : { sent: false },
    wa: waResult.status === "fulfilled" ? waResult.value : { sent: false },
  };
}
