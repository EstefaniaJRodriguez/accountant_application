import express from "express";
import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();
const resend = new Resend(process.env.RESEND_API_KEY);

router.post("/", async (req, res) => {
  const { nombre, email, mensaje } = req.body;

  if (!nombre || !email || !mensaje) {
    return res.status(400).json({ message: "Todos los campos son obligatorios" });
  }

  try {
    const result = await resend.emails.send({
      from: `GEN IMPOSITIVO <onboarding@resend.dev>`,
      reply_to: email,
      to: process.env.EMAIL_RECEIVER,
      subject: "GEN IMPOSITIVO website: Nueva consulta",
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; padding: 20px; background-color: #f2f2f2;">
          <div style="max-width: 600px; margin: auto; background: #fff; padding: 25px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.08);">

            <h2 style="color: #1a73e8; text-align: center; margin-bottom: 20px;">📩 Nueva Consulta</h2>

            <div style="border-top: 1px solid #eee; margin: 20px 0;"></div>

            <p style="font-size: 16px;"><strong>Nombre:</strong> ${nombre}</p>
            <p style="font-size: 16px;"><strong>Email:</strong> ${email}</p>

            <p style="font-size: 16px; margin-top: 20px;"><strong>Mensaje:</strong></p>
            <div style="padding: 15px; background-color: #f8f8f8; border-left: 4px solid #1a73e8; border-radius: 5px; font-size: 15px; line-height: 1.5;">
              ${mensaje}
            </div>

            <div style="border-top: 1px solid #eee; margin: 25px 0;"></div>

            <p style="text-align: center; font-size: 12px; color: #777;">
              Este correo fue enviado automáticamente desde el formulario de consultas del sitio web GEN IMPOSITIVO.
            </p>

          </div>
        </div>
      `,
    });

    console.log("✔ Email enviado con Resend:", result);

    res.status(200).json({ message: "Consulta enviada correctamente" });
  } catch (error) {
    console.error("❌ Error al enviar el correo:", error);
    res.status(500).json({ message: "Error al enviar el correo", error: error.message });
  }
});

export default router;
