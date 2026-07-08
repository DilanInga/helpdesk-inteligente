const Ticket = require('../models/ticket');
const { enviarConfirmacion, enviarRespuestaIA } = require('../services/emailService');
const { clasificarTicket, crearTarjetaTrello } = require('./agentController');

// Obtener todos los tickets
const obtenerTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      total: tickets.length,
      tickets
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      mensaje: 'Error al obtener tickets',
      error: error.message
    });
  }
};

// Obtener un ticket por ID
const obtenerTicketPorId = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        mensaje: 'Ticket no encontrado'
      });
    }
    res.json({ success: true, ticket });
  } catch (error) {
    res.status(500).json({
      success: false,
      mensaje: 'Error al obtener el ticket',
      error: error.message
    });
  }
};

// Crear un nuevo ticket — TODO AUTOMÁTICO
const crearTicket = async (req, res) => {
  try {
    const { titulo, descripcion, prioridad, email } = req.body;

    if (!titulo || !descripcion || !email) {
      return res.status(400).json({
        success: false,
        mensaje: 'Titulo, descripcion y email son obligatorios'
      });
    }

    // 1. Crear ticket en MongoDB
    const nuevoTicket = await Ticket.create({
      titulo,
      descripcion,
      prioridad: prioridad || 'normal',
      email
    });

    // 2. Clasificar con Gemini automáticamente
    try {
      const clasificacion = await clasificarTicket(nuevoTicket);
      // IA decide la prioridad final — puede subir o bajar
      const orden = ['baja', 'normal', 'alta', 'urgente'];
      const prioridadIA = clasificacion.prioridad === 'crítica' ? 'urgente' : clasificacion.prioridad;
      nuevoTicket.prioridad = orden.includes(prioridadIA) ? prioridadIA : (prioridad || 'normal');
      nuevoTicket.categoria = clasificacion.categoria;
      nuevoTicket.equipo = clasificacion.equipo;
      nuevoTicket.escalar = clasificacion.escalar;
      nuevoTicket.respuestaIA = clasificacion.respuestaIA;
      nuevoTicket.estado = clasificacion.esPreguntaFrecuente ? 'resuelto' : 'en_proceso';

      // 3. Si es urgente → crear tarjeta en Trello
     if (nuevoTicket.prioridad === 'urgente') {
  trelloUrl = await crearTarjetaTrello(nuevoTicket, process.env.TRELLO_LIST_URGENTE);
  nuevoTicket.trelloUrl = trelloUrl;
} else if (nuevoTicket.prioridad === 'alta') {
  trelloUrl = await crearTarjetaTrello(nuevoTicket, process.env.TRELLO_LIST_ALTA);
  nuevoTicket.trelloUrl = trelloUrl;
}
      await nuevoTicket.save();

      // 4. Enviar UN solo email según el tipo
      if (clasificacion.esPreguntaFrecuente) {
        await enviarRespuestaIA(nuevoTicket);
        console.log(`🤖 Email IA enviado a ${email}`);
      } else {
        await enviarConfirmacion(nuevoTicket);
        console.log(`📧 Email confirmación enviado a ${email}`);
      }

      // 5. Responder al usuario
      res.status(201).json({
        success: true,
        mensaje: clasificacion.esPreguntaFrecuente
          ? '🤖 Pregunta detectada — revisa tu correo con la respuesta'
          : clasificacion.escalar
          ? '🚨 Ticket urgente creado — un agente lo atenderá de inmediato'
          : '✅ Ticket creado exitosamente',
        esPreguntaFrecuente: clasificacion.esPreguntaFrecuente,
        trelloUrl,
        ticket: nuevoTicket
      });

    } catch (iaError) {
  console.error('Error con IA:', iaError.message);
  res.status(201).json({
    success: true,
    mensaje: '✅ Ticket creado exitosamente',
    ticket: nuevoTicket
  });
}

  } catch (error) {
    res.status(500).json({
      success: false,
      mensaje: 'Error al crear el ticket',
      error: error.message
    });
  }
};

// Actualizar un ticket
const actualizarTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!ticket) {
      return res.status(404).json({
        success: false,
        mensaje: 'Ticket no encontrado'
      });
    }
    res.json({
      success: true,
      mensaje: 'Ticket actualizado correctamente',
      ticket
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      mensaje: 'Error al actualizar el ticket',
      error: error.message
    });
  }
};

// Eliminar un ticket
const eliminarTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findByIdAndDelete(req.params.id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        mensaje: 'Ticket no encontrado'
      });
    }
    res.json({
      success: true,
      mensaje: 'Ticket eliminado correctamente'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      mensaje: 'Error al eliminar el ticket',
      error: error.message
    });
  }
};

module.exports = {
  obtenerTickets,
  obtenerTicketPorId,
  crearTicket,
  actualizarTicket,
  eliminarTicket
};