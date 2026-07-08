const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const enviarConfirmacion = async (ticket) => {
  const mailOptions = {
    from: `"Help Desk Inteligente 🎫" <${process.env.EMAIL_USER}>`,
    to: ticket.email,
    subject: `✅ Ticket #${ticket._id} - ${ticket.titulo}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; border-radius: 10px;">
        <div style="background: #1a1a2e; padding: 20px; border-radius: 10px; text-align: center;">
          <h1 style="color: #f5c518; margin: 0;">🎫 Help Desk Inteligente</h1>
          <p style="color: #ffffff; margin: 5px 0;">Tu ticket fue recibido exitosamente</p>
        </div>
        
        <div style="background: #ffffff; padding: 20px; border-radius: 10px; margin-top: 15px;">
          <h2 style="color: #1a1a2e;">📋 Detalles del Ticket</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 10px; font-weight: bold; color: #666;">ID:</td>
              <td style="padding: 10px; font-family: monospace;">${ticket._id}</td>
            </tr>
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 10px; font-weight: bold; color: #666;">Título:</td>
              <td style="padding: 10px;">${ticket.titulo}</td>
            </tr>
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 10px; font-weight: bold; color: #666;">Descripción:</td>
              <td style="padding: 10px;">${ticket.descripcion}</td>
            </tr>
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 10px; font-weight: bold; color: #666;">Prioridad:</td>
              <td style="padding: 10px;">
                <span style="background: ${ticket.prioridad === 'urgente' ? '#ef4444' : ticket.prioridad === 'alta' ? '#f97316' : ticket.prioridad === 'normal' ? '#eab308' : '#22c55e'}; color: white; padding: 3px 10px; border-radius: 20px; font-size: 12px;">
                  ${ticket.prioridad.toUpperCase()}
                </span>
              </td>
            </tr>
            <tr>
              <td style="padding: 10px; font-weight: bold; color: #666;">Estado:</td>
              <td style="padding: 10px;">${ticket.estado}</td>
            </tr>
          </table>
        </div>

        <div style="background: #ffffff; padding: 20px; border-radius: 10px; margin-top: 15px; border-left: 4px solid #f5c518;">
          <h3 style="color: #1a1a2e;">⏱️ ¿Qué sigue?</h3>
          <p style="color: #666;">Un agente de soporte revisará tu ticket pronto. Recibirás una actualización cuando haya novedades.</p>
        </div>

        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
          <p>Help Desk Inteligente — Powered by IA 🤖</p>
        </div>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

const enviarRespuestaIA = async (ticket) => {
  const mailOptions = {
    from: `"Help Desk Inteligente 🎫" <${process.env.EMAIL_USER}>`,
    to: ticket.email,
    subject: `🤖 Respuesta IA - Ticket #${ticket._id} - ${ticket.titulo}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; border-radius: 10px;">
        <div style="background: #1a1a2e; padding: 20px; border-radius: 10px; text-align: center;">
          <h1 style="color: #f5c518; margin: 0;">🤖 Respuesta del Asistente IA</h1>
          <p style="color: #ffffff; margin: 5px 0;">Tu ticket ha sido analizado automáticamente</p>
        </div>

        <div style="background: #ffffff; padding: 20px; border-radius: 10px; margin-top: 15px;">
          <h2 style="color: #1a1a2e;">📋 Tu Ticket: ${ticket.titulo}</h2>
          <p style="color: #666;">${ticket.descripcion}</p>
        </div>

        <div style="background: #f0f9ff; padding: 20px; border-radius: 10px; margin-top: 15px; border-left: 4px solid #0ea5e9;">
          <h3 style="color: #1a1a2e;">🤖 Análisis y Solución</h3>
          <p style="color: #333; line-height: 1.6;">${ticket.respuestaIA}</p>
        </div>

        <div style="background: #ffffff; padding: 20px; border-radius: 10px; margin-top: 15px;">
          <h3 style="color: #1a1a2e;">📊 Clasificación</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 10px; font-weight: bold; color: #666;">Categoría:</td>
              <td style="padding: 10px;">${ticket.categoria}</td>
            </tr>
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 10px; font-weight: bold; color: #666;">Prioridad:</td>
              <td style="padding: 10px;">${ticket.prioridad.toUpperCase()}</td>
            </tr>
            <tr>
              <td style="padding: 10px; font-weight: bold; color: #666;">Equipo asignado:</td>
              <td style="padding: 10px;">${ticket.equipo}</td>
            </tr>
          </table>
        </div>

        ${ticket.trelloUrl ? `
        <div style="background: #f0fdf4; padding: 20px; border-radius: 10px; margin-top: 15px; border-left: 4px solid #22c55e;">
          <h3 style="color: #1a1a2e;">🚨 Ticket Escalado</h3>
          <p style="color: #666;">Tu ticket fue marcado como urgente y un agente lo atenderá inmediatamente.</p>
          <a href="${ticket.trelloUrl}" style="color: #0ea5e9;">Ver tarjeta en Trello</a>
        </div>
        ` : ''}

        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
          <p>Help Desk Inteligente — Powered by IA 🤖</p>
        </div>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { enviarConfirmacion, enviarRespuestaIA };