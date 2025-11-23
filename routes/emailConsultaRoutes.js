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
      // El from SIEMPRE debe ser un dominio verificado o un email permitido
      reply_to: email, // así podes responderles directo
      to: process.env.EMAIL_RECEIVER,
      subject: "GEN IMPOSITIVO website: Nueva consulta",
      html: `
        <h2>Nueva consulta recibida</h2>
        <p><strong>Nombre:</strong> ${nombre}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Mensaje:</strong></p>
        <p>${mensaje}</p>
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
