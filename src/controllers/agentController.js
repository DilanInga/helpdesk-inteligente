const Ticket = require('../models/ticket');
const { enviarRespuestaIA } = require('../services/emailService');

// Función para crear tarjeta en Trello
const crearTarjetaTrello = async (ticket, listId) => {
  const url = `https://api.trello.com/1/cards?key=${process.env.TRELLO_API_KEY}&token=${process.env.TRELLO_TOKEN}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: `🚨 ${ticket.titulo}`,
      desc: `📧 Email: ${ticket.email}\n\n📄 Descripción: ${ticket.descripcion}\n\n🤖 Análisis IA: ${ticket.respuestaIA}\n\n🏷️ Categoría: ${ticket.categoria}\n⚡ Prioridad: ${ticket.prioridad}`,
      idList: listId,
      pos: 'top'
    })
  });

  const data = await response.json();
  return data.shortUrl;
};

// Función para clasificar con Gemini
const clasificarTicket = async (ticket) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`;

  const prompt = `
Eres un agente experto de Help Desk. Tu trabajo es clasificar tickets de soporte técnico.
Analiza el siguiente ticket y responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional, sin markdown.

Ticket:
- Título: ${ticket.titulo}
- Descripción: ${ticket.descripcion}
- Prioridad indicada por usuario: ${ticket.prioridad}

IMPORTANTE: Debes respetar la prioridad que indicó el usuario. Solo puedes subirla si el problema es claramente más grave de lo que el usuario indicó. Nunca la bajes.

Responde SOLO con este JSON:
{
  "prioridad": "baja|normal|alta|urgente|crítica",
  "categoria": "hardware|software|red|acceso|infraestructura|otro",
  "equipo": "level1|level2|devops|infraestructura",
  "escalar": true|false,
  "esPreguntaFrecuente": true|false,
  "respuestaIA": "Mensaje detallado explicando el problema y pasos para resolverlo."
}

Reglas de prioridad — sé muy estricto:
- URGENTE: Servidor caído, red caída, sistema completamente inaccesible para TODA la empresa, pérdida de datos críticos
- ALTA: Problema que afecta a VARIOS usuarios o a un departamento completo, impide trabajar a un grupo
- NORMAL: Problema individual que afecta solo a UNA persona pero puede seguir trabajando parcialmente
- BAJA: Preguntas simples, dudas, problemas estéticos, cosas menores que no impiden trabajar

Ejemplos concretos:
- "Servidor caído, nadie entra" → URGENTE
- "Impresora de todo el departamento no funciona" → ALTA  
- "Mi Excel no abre" → NORMAL
- "Mi fondo de pantalla cambió" → BAJA
- "¿Cómo reinicio mi contraseña?" → BAJA
- "Internet lento en mi PC" → NORMAL
- "Toda la oficina sin internet" → URGENTE

Si el usuario exageró la prioridad → corrígela al nivel real según los ejemplos.
`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(JSON.stringify(data));
  }

  const text = data.candidates[0].content.parts[0].text;
  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
};

const procesarConIA = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    
    if (!ticket) {
      return res.status(404).json({
        success: false,
        mensaje: 'Ticket no encontrado'
      });
    }

    const clasificacion = await clasificarTicket(ticket);

    ticket.categoria = clasificacion.categoria;
    ticket.equipo = clasificacion.equipo;
    ticket.escalar = clasificacion.escalar;
    ticket.respuestaIA = clasificacion.respuestaIA;
    ticket.estado = clasificacion.esPreguntaFrecuente ? 'resuelto' : 'en_proceso';

    let trelloUrl = '';
    if (ticket.prioridad === 'urgente') {
      trelloUrl = await crearTarjetaTrello(ticket, process.env.TRELLO_LIST_URGENTE);
      ticket.trelloUrl = trelloUrl;
    } else if (ticket.prioridad === 'alta') {
      trelloUrl = await crearTarjetaTrello(ticket, process.env.TRELLO_LIST_ALTA);
      ticket.trelloUrl = trelloUrl;
    }

    await ticket.save();

    if (clasificacion.esPreguntaFrecuente) {
      await enviarRespuestaIA(ticket);
    }

    res.json({
      success: true,
      mensaje: 'Ticket clasificado por IA exitosamente',
      clasificacion,
      trelloUrl,
      ticket
    });

  } catch (error) {
    console.error('Error con Gemini:', error.message);
    res.status(500).json({
      success: false,
      mensaje: 'Error al procesar con IA',
      error: error.message
    });
  }
};

module.exports = { procesarConIA, clasificarTicket, crearTarjetaTrello };