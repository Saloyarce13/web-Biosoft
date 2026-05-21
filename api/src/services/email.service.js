// src/services/email.service.js
const nodemailer = require('nodemailer');

// ─── Transporter ──────────────────────────────────────────────────────────────
const getTransporter = () => {
  const host = process.env.EMAIL_HOST;
  const port = Number(process.env.EMAIL_PORT || 587);
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!host || !user || !pass) {
    return {
      sendMail: async ({ to, subject }) => {
        console.warn(`[EMAIL SIMULADO] Sin SMTP. Para: ${to} | Asunto: ${subject}`);
      },
    };
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
  });
};

const FROM = () => process.env.EMAIL_FROM || process.env.EMAIL_USER || 'no-reply@bionatural.local';

// ─── Helper interno ────────────────────────────────────────────────────────────
const send = async ({ to, subject, html, text }) => {
  const transporter = getTransporter();
  try {
    await transporter.sendMail({ from: FROM(), to, subject, html, text });
  } catch (err) {
    console.error('[EMAIL ERROR]', err.message);
  }
};

// ─── 1. Código de verificación / recuperación ─────────────────────────────────
const sendEmailWithCode = async ({ to, code, subject, text }) => {
  const html = `
<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f4f7f4;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7f4;padding:32px 16px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr><td style="background:linear-gradient(135deg,#16a34a,#15803d);padding:32px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700;">🌿 Bionatural</h1>
        </td></tr>
        <tr><td style="padding:36px 40px;text-align:center;">
          <p style="color:#374151;font-size:15px;margin:0 0 24px;">${text || subject}</p>
          <div style="background:#f0fdf4;border:2px dashed #16a34a;border-radius:12px;padding:20px;display:inline-block;">
            <p style="color:#6b7280;font-size:12px;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px;">Tu código</p>
            <p style="color:#16a34a;font-size:36px;font-weight:700;letter-spacing:8px;margin:0;font-family:monospace;">${code}</p>
          </div>
          <p style="color:#9ca3af;font-size:12px;margin:24px 0 0;">Este código expira pronto. No lo compartas con nadie.</p>
        </td></tr>
        <tr><td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px 40px;text-align:center;">
          <p style="color:#9ca3af;font-size:11px;margin:0;">© 2024 Bionatural · Tienda Naturista</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  await send({ to, subject, html, text: `Tu código es: ${code}` });
};

// ─── 2. Bienvenida ─────────────────────────────────────────────────────────────
const sendWelcomeEmail = async ({ to, name }) => {
  const subject = '¡Bienvenido a Bionatural! 🌿';
  const html = `
<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f4f7f4;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7f4;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr><td style="background:linear-gradient(135deg,#16a34a,#15803d);padding:40px;text-align:center;">
          <span style="font-size:40px;">🌿</span>
          <h1 style="color:#fff;margin:8px 0 0;font-size:28px;font-weight:700;">Bionatural</h1>
          <p style="color:rgba(255,255,255,0.85);margin:4px 0 0;font-size:14px;">Tienda Naturista</p>
        </td></tr>
        <tr><td style="padding:40px;">
          <h2 style="color:#1a1a1a;font-size:22px;margin:0 0 12px;">¡Hola, ${name}! 👋</h2>
          <p style="color:#4b5563;font-size:15px;line-height:1.7;margin:0 0 20px;">
            Nos alegra tenerte en <strong style="color:#16a34a;">Bionatural</strong>. Tu cuenta ha sido creada exitosamente.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border-radius:12px;padding:20px;margin-bottom:28px;">
            <tr><td style="padding:6px 0;"><span style="color:#16a34a;">✅</span> <span style="color:#374151;font-size:14px;margin-left:8px;">Acceso al catálogo de productos naturales</span></td></tr>
            <tr><td style="padding:6px 0;"><span style="color:#16a34a;">✅</span> <span style="color:#374151;font-size:14px;margin-left:8px;">Realiza pedidos en línea fácilmente</span></td></tr>
            <tr><td style="padding:6px 0;"><span style="color:#16a34a;">✅</span> <span style="color:#374151;font-size:14px;margin-left:8px;">Historial de compras y seguimiento de pedidos</span></td></tr>
          </table>
          <p style="color:#6b7280;font-size:13px;margin:0;">Con cariño,<br/><strong style="color:#16a34a;">El equipo de Bionatural 🌱</strong></p>
        </td></tr>
        <tr><td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px 40px;text-align:center;">
          <p style="color:#9ca3af;font-size:11px;margin:0;">© 2024 Bionatural · Tienda Naturista</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  await send({ to, subject, html, text: `Hola ${name}, bienvenido a Bionatural. Tu cuenta ha sido creada exitosamente.` });
};

// ─── 3. Pedido cancelado (manual) ─────────────────────────────────────────────
const sendOrderCancelledEmail = async ({ to, clientName, orderId, items, total }) => {
  const subject = `Tu pedido #${orderId} ha sido cancelado — Bionatural`;

  const itemsHtml = items.map(i => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#374151;font-size:14px;">${i.name}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#374151;font-size:14px;text-align:center;">${i.quantity}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#374151;font-size:14px;text-align:right;">${Number(i.lineTotal).toLocaleString('es-CO')}</td>
    </tr>`).join('');

  const html = `
<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f4f7f4;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7f4;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr><td style="background:linear-gradient(135deg,#16a34a,#15803d);padding:32px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700;">🌿 Bionatural</h1>
        </td></tr>
        <tr><td style="padding:36px 40px;">
          <h2 style="color:#1a1a1a;font-size:20px;margin:0 0 12px;">Hola, ${clientName}</h2>
          <p style="color:#4b5563;font-size:15px;line-height:1.7;margin:0 0 20px;">
            Tu pedido <strong>#${orderId}</strong> ha sido <strong style="color:#dc2626;">cancelado</strong>.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-bottom:24px;">
            <tr style="background:#f9fafb;">
              <th style="padding:10px 12px;text-align:left;font-size:12px;color:#6b7280;font-weight:600;">Producto</th>
              <th style="padding:10px 12px;text-align:center;font-size:12px;color:#6b7280;font-weight:600;">Cant.</th>
              <th style="padding:10px 12px;text-align:right;font-size:12px;color:#6b7280;font-weight:600;">Subtotal</th>
            </tr>
            ${itemsHtml}
            <tr style="background:#f0fdf4;">
              <td colspan="2" style="padding:10px 12px;font-weight:700;color:#16a34a;font-size:14px;">Total</td>
              <td style="padding:10px 12px;font-weight:700;color:#16a34a;font-size:14px;text-align:right;">${Number(total).toLocaleString('es-CO')}</td>
            </tr>
          </table>
          <p style="color:#6b7280;font-size:13px;margin:0;">Gracias por confiar en nosotros.<br/><strong style="color:#16a34a;">El equipo de Bionatural 🌱</strong></p>
        </td></tr>
        <tr><td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px 40px;text-align:center;">
          <p style="color:#9ca3af;font-size:11px;margin:0;">© 2024 Bionatural · Tienda Naturista</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  await send({ to, subject, html, text: `Hola ${clientName}, tu pedido #${orderId} ha sido cancelado.` });
};

// ─── 4. Pedido cancelado por stock insuficiente ────────────────────────────────
const sendStockCancelledEmail = async ({ to, clientName, orderId, items, total, stockIssues }) => {
  const subject = `Tu pedido #${orderId} fue cancelado por falta de stock — Bionatural`;

  const issuesHtml = stockIssues.map(i => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #fee2e2;color:#374151;font-size:13px;">${i.productName}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #fee2e2;color:#dc2626;font-size:13px;text-align:center;">Pedido: ${i.requested} · Disponible: ${i.available}</td>
    </tr>`).join('');

  const itemsHtml = items.map(i => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#374151;font-size:13px;">${i.name}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#374151;font-size:13px;text-align:center;">${i.quantity}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#374151;font-size:13px;text-align:right;">${Number(i.lineTotal).toLocaleString('es-CO')}</td>
    </tr>`).join('');

  const html = `
<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f4f7f4;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7f4;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr><td style="background:linear-gradient(135deg,#16a34a,#15803d);padding:32px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700;">🌿 Bionatural</h1>
        </td></tr>
        <tr><td style="padding:36px 40px;">
          <h2 style="color:#1a1a1a;font-size:20px;margin:0 0 12px;">Hola, ${clientName}</h2>
          <p style="color:#4b5563;font-size:15px;line-height:1.7;margin:0 0 16px;">
            Tu pedido <strong>#${orderId}</strong> fue <strong style="color:#dc2626;">cancelado automáticamente</strong> por falta de stock.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;margin-bottom:24px;">
            <tr><td style="padding:14px 16px;">
              <p style="color:#dc2626;font-size:13px;font-weight:700;margin:0 0 10px;">⚠️ Productos con stock insuficiente:</p>
              <table width="100%" cellpadding="0" cellspacing="0">${issuesHtml}</table>
            </td></tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-bottom:24px;">
            <tr style="background:#f9fafb;">
              <th style="padding:10px 12px;text-align:left;font-size:12px;color:#6b7280;font-weight:600;">Producto</th>
              <th style="padding:10px 12px;text-align:center;font-size:12px;color:#6b7280;font-weight:600;">Cant.</th>
              <th style="padding:10px 12px;text-align:right;font-size:12px;color:#6b7280;font-weight:600;">Subtotal</th>
            </tr>
            ${itemsHtml}
            <tr style="background:#f0fdf4;">
              <td colspan="2" style="padding:10px 12px;font-weight:700;color:#16a34a;font-size:14px;">Total</td>
              <td style="padding:10px 12px;font-weight:700;color:#16a34a;font-size:14px;text-align:right;">${Number(total).toLocaleString('es-CO')}</td>
            </tr>
          </table>
          <p style="color:#6b7280;font-size:13px;margin:0;">Disculpa los inconvenientes.<br/><strong style="color:#16a34a;">El equipo de Bionatural 🌱</strong></p>
        </td></tr>
        <tr><td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px 40px;text-align:center;">
          <p style="color:#9ca3af;font-size:11px;margin:0;">© 2024 Bionatural · Tienda Naturista</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  await send({ to, subject, html, text: `Hola ${clientName}, tu pedido #${orderId} fue cancelado por falta de stock.` });
};

// ─── 5. Pedido listo para recoger ─────────────────────────────────────────────
const sendOrderReadyEmail = async ({ to, clientName, orderId, items, total, expiresAt }) => {
  const subject = `¡Tu pedido #${orderId} está listo para recoger! 🌿 — Bionatural`;

  const itemsHtml = items.map(i => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#374151;font-size:14px;">${i.name}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#374151;font-size:14px;text-align:center;">${i.quantity}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#374151;font-size:14px;text-align:right;">${Number(i.lineTotal).toLocaleString('es-CO')}</td>
    </tr>`).join('');

  const expiresFormatted = new Date(expiresAt).toLocaleString('es-CO', {
    dateStyle: 'full', timeStyle: 'short', timeZone: 'America/Bogota',
  });

  const html = `
<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f4f7f4;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7f4;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr><td style="background:linear-gradient(135deg,#16a34a,#15803d);padding:32px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700;">🌿 Bionatural</h1>
        </td></tr>
        <tr><td style="padding:36px 40px;">
          <h2 style="color:#1a1a1a;font-size:20px;margin:0 0 12px;">¡Hola, ${clientName}! 👋</h2>
          <p style="color:#4b5563;font-size:15px;line-height:1.7;margin:0 0 20px;">
            Tu pedido <strong>#${orderId}</strong> ya está <strong style="color:#16a34a;">listo para recoger</strong> en nuestra tienda.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef3c7;border:1px solid #fde68a;border-radius:12px;margin-bottom:24px;">
            <tr><td style="padding:16px 20px;">
              <p style="color:#92400e;font-size:14px;font-weight:700;margin:0 0 6px;">⏰ Tienes 24 horas para recogerlo</p>
              <p style="color:#92400e;font-size:13px;margin:0;">Expira el: <strong>${expiresFormatted}</strong></p>
            </td></tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-bottom:24px;">
            <tr style="background:#f9fafb;">
              <th style="padding:10px 12px;text-align:left;font-size:12px;color:#6b7280;font-weight:600;">Producto</th>
              <th style="padding:10px 12px;text-align:center;font-size:12px;color:#6b7280;font-weight:600;">Cant.</th>
              <th style="padding:10px 12px;text-align:right;font-size:12px;color:#6b7280;font-weight:600;">Subtotal</th>
            </tr>
            ${itemsHtml}
            <tr style="background:#f0fdf4;">
              <td colspan="2" style="padding:10px 12px;font-weight:700;color:#16a34a;font-size:14px;">Total a pagar en tienda</td>
              <td style="padding:10px 12px;font-weight:700;color:#16a34a;font-size:14px;text-align:right;">${Number(total).toLocaleString('es-CO')}</td>
            </tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;margin-bottom:24px;">
            <tr><td style="padding:16px 20px;">
              <p style="color:#15803d;font-size:13px;font-weight:700;margin:0 0 8px;">📍 Dónde recoger</p>
              <p style="color:#374151;font-size:13px;margin:0 0 4px;"><strong>Bionatural — Tienda Principal</strong></p>
              <p style="color:#6b7280;font-size:12px;margin:0 0 2px;">Calle 47 #45-87 · C.C. San Antonio, Local 101</p>
              <p style="color:#6b7280;font-size:12px;margin:0 0 2px;">🕐 Lun–Vie 8:00 AM – 6:00 PM · Sáb 8:00 AM – 2:00 PM</p>
              <p style="color:#6b7280;font-size:12px;margin:0;">📞 +57 315 5397493</p>
            </td></tr>
          </table>
          <p style="color:#6b7280;font-size:13px;margin:0;">
            Presenta tu nombre o email al llegar. El pago se realiza en tienda.<br/>
            <strong style="color:#16a34a;">El equipo de Bionatural 🌱</strong>
          </p>
        </td></tr>
        <tr><td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px 40px;text-align:center;">
          <p style="color:#9ca3af;font-size:11px;margin:0;">© 2024 Bionatural · Tienda Naturista</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  await send({ to, subject, html, text: `Hola ${clientName}, tu pedido #${orderId} está listo. Tienes hasta el ${expiresFormatted} para recogerlo.` });
};

// ─── Exports ───────────────────────────────────────────────────────────────────
module.exports = {
  sendEmailWithCode,
  sendWelcomeEmail,
  sendOrderCancelledEmail,
  sendStockCancelledEmail,
  sendOrderReadyEmail,
};
