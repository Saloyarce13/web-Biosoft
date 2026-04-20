const nodemailer = require('nodemailer');

const getTransporter = () => {
  const host = process.env.EMAIL_HOST;
  const port = Number(process.env.EMAIL_PORT || 587);
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  const emailConfigured = host && user && pass;
  if (!emailConfigured) {
    return {
      sendMail: async ({ from, to, subject, text }) => {
        console.warn('[EMAIL SIMULADO] SMTP no configurado.');
        console.warn(`From: ${from}`);
        console.warn(`To: ${to}`);
        console.warn(`Subject: ${subject}`);
        console.warn(`Text: ${text}`);
      },
    };
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
};

const sendMail = async ({ to, subject, text }) => {
  const from = process.env.EMAIL_FROM || 'no-reply@biosoft.local';
  const transporter = getTransporter();

  try {
    await transporter.sendMail({ from, to, subject, text });
  } catch (error) {
    console.error('[EMAIL ERROR]', error.message || error);
  }
};

const sendEmailWithCode = async ({ to, code, subject, text }) => {
  const from = process.env.EMAIL_FROM || 'no-reply@bionatural.local';
  const transporter = getTransporter();

  const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f4f7f4;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7f4;padding:32px 16px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#16a34a,#15803d);padding:32px;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700;">🌿 Bionatural</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px;text-align:center;">
            <p style="color:#374151;font-size:15px;margin:0 0 24px;">${text || subject}</p>
            <div style="background:#f0fdf4;border:2px dashed #16a34a;border-radius:12px;padding:20px;display:inline-block;margin:0 auto;">
              <p style="color:#6b7280;font-size:12px;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px;">Tu código</p>
              <p style="color:#16a34a;font-size:36px;font-weight:700;letter-spacing:8px;margin:0;font-family:monospace;">${code}</p>
            </div>
            <p style="color:#9ca3af;font-size:12px;margin:24px 0 0;">Este código expira pronto. No lo compartas con nadie.</p>
          </td>
        </tr>
        <tr>
          <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px 40px;text-align:center;">
            <p style="color:#9ca3af;font-size:11px;margin:0;">© 2024 Bionatural · Tienda Naturista</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    await transporter.sendMail({ from, to, subject, html, text: text || `Tu código es: ${code}` });
  } catch (error) {
    console.error('[EMAIL ERROR]', error.message || error);
  }
};

const sendWelcomeEmail = async ({ to, name }) => {
  const subject = '¡Bienvenido a Bionatural! 🌿';
  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Bienvenido a Bionatural</title>
</head>
<body style="margin:0;padding:0;background:#f4f7f4;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7f4;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          
          <!-- Header verde -->
          <tr>
            <td style="background:linear-gradient(135deg,#16a34a,#15803d);padding:40px 40px 32px;text-align:center;">
              <div style="display:inline-block;background:rgba(255,255,255,0.15);border-radius:50%;padding:16px;margin-bottom:16px;">
                <span style="font-size:40px;">🌿</span>
              </div>
              <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:700;letter-spacing:-0.5px;">Bionatural</h1>
              <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:14px;">Tienda Naturista · Sistema de Gestión</p>
            </td>
          </tr>

          <!-- Cuerpo -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <h2 style="color:#1a1a1a;font-size:22px;margin:0 0 12px;font-weight:600;">
                ¡Hola, ${name}! 👋
              </h2>
              <p style="color:#4b5563;font-size:15px;line-height:1.7;margin:0 0 20px;">
                Nos alegra tenerte en <strong style="color:#16a34a;">Bionatural</strong>. Tu cuenta ha sido creada exitosamente y ya puedes acceder a todos nuestros productos naturales.
              </p>

              <!-- Beneficios -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border-radius:12px;padding:20px;margin-bottom:28px;">
                <tr>
                  <td style="padding:8px 0;">
                    <span style="color:#16a34a;font-size:16px;">✅</span>
                    <span style="color:#374151;font-size:14px;margin-left:10px;">Acceso a nuestro catálogo de productos naturales</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;">
                    <span style="color:#16a34a;font-size:16px;">✅</span>
                    <span style="color:#374151;font-size:14px;margin-left:10px;">Realiza pedidos en línea fácilmente</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;">
                    <span style="color:#16a34a;font-size:16px;">✅</span>
                    <span style="color:#374151;font-size:14px;margin-left:10px;">Historial de compras y seguimiento de pedidos</span>
                  </td>
                </tr>
              </table>

              <p style="color:#4b5563;font-size:14px;line-height:1.6;margin:0 0 28px;">
                Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos. Estamos aquí para servirte.
              </p>

              <p style="color:#6b7280;font-size:13px;margin:0;">
                Con cariño,<br/>
                <strong style="color:#16a34a;">El equipo de Bionatural 🌱</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;">
              <p style="color:#9ca3af;font-size:12px;margin:0;">
                © 2024 Bionatural · Tienda Naturista<br/>
                Este correo fue enviado porque creaste una cuenta en nuestro sistema.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `Hola ${name},\n\n¡Bienvenido a Bionatural! Tu cuenta ha sido creada exitosamente.\n\nYa puedes acceder a nuestro catálogo de productos naturales y realizar pedidos.\n\nSaludos,\nEl equipo de Bionatural 🌿`;

  const from = process.env.EMAIL_FROM || 'no-reply@bionatural.local';
  const transporter = getTransporter();
  try {
    await transporter.sendMail({ from, to, subject, html, text });
  } catch (error) {
    console.error('[EMAIL BIENVENIDA ERROR]', error.message || error);
  }
};

const sendOrderCancelledEmail = async ({ to, clientName, orderId, items, total }) => {
  const subject = `Tu pedido #${orderId} ha sido cancelado — Bionatural`;

  const itemsHtml = items.map(i =>
    `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#374151;font-size:14px;">${i.name}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#374151;font-size:14px;text-align:center;">${i.quantity}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#374151;font-size:14px;text-align:right;">$${Number(i.lineTotal).toLocaleString('es-CO')}</td>
    </tr>`
  ).join('');

  const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f4f7f4;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7f4;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#16a34a,#15803d);padding:32px;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700;">🌿 Bionatural</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px;">
            <h2 style="color:#1a1a1a;font-size:20px;margin:0 0 12px;">Hola, ${clientName}</h2>
            <p style="color:#4b5563;font-size:15px;line-height:1.7;margin:0 0 20px;">
              Lamentamos informarte que tu pedido <strong>#${orderId}</strong> ha sido <strong style="color:#dc2626;">cancelado</strong>.
            </p>
            <p style="color:#4b5563;font-size:14px;margin:0 0 24px;">
              Si tienes alguna pregunta sobre esta cancelación, no dudes en contactarnos directamente en nuestra tienda.
            </p>

            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-bottom:24px;">
              <tr style="background:#f9fafb;">
                <th style="padding:10px 12px;text-align:left;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;">Producto</th>
                <th style="padding:10px 12px;text-align:center;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;">Cant.</th>
                <th style="padding:10px 12px;text-align:right;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;">Subtotal</th>
              </tr>
              ${itemsHtml}
              <tr style="background:#f0fdf4;">
                <td colspan="2" style="padding:10px 12px;font-weight:700;color:#16a34a;font-size:14px;">Total</td>
                <td style="padding:10px 12px;font-weight:700;color:#16a34a;font-size:14px;text-align:right;">$${Number(total).toLocaleString('es-CO')}</td>
              </tr>
            </table>

            <p style="color:#6b7280;font-size:13px;margin:0;">
              Gracias por confiar en nosotros.<br/>
              <strong style="color:#16a34a;">El equipo de Bionatural 🌱</strong>
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px 40px;text-align:center;">
            <p style="color:#9ca3af;font-size:11px;margin:0;">© 2024 Bionatural · Tienda Naturista</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = `Hola ${clientName},\n\nTu pedido #${orderId} ha sido cancelado.\n\nSi tienes preguntas, visítanos en nuestra tienda.\n\nSaludos,\nBionatural 🌿`;

  const from = process.env.EMAIL_FROM || 'no-reply@bionatural.local';
  const transporter = getTransporter();
  try {
    await transporter.sendMail({ from, to, subject, html, text });
  } catch (error) {
    console.error('[EMAIL CANCELACIÓN ERROR]', error.message || error);
  }
};

module.exports = { sendEmailWithCode, sendWelcomeEmail, sendOrderCancelledEmail };

