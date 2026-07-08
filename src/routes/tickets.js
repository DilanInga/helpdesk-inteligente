const express = require('express');
const router = express.Router();
const {
  obtenerTickets,
  obtenerTicketPorId,
  crearTicket,
  actualizarTicket,
  eliminarTicket
} = require('../controllers/ticketController');
const { procesarConIA } = require('../controllers/agentController');

// GET /api/tickets — Obtener todos los tickets
router.get('/', obtenerTickets);

// GET /api/tickets/:id — Obtener un ticket por ID
router.get('/:id', obtenerTicketPorId);

// POST /api/tickets — Crear un ticket nuevo
router.post('/', crearTicket);

// PUT /api/tickets/:id — Actualizar un ticket
router.put('/:id', actualizarTicket);

// DELETE /api/tickets/:id — Eliminar un ticket
router.delete('/:id', eliminarTicket);

// POST /api/tickets/:id/clasificar — Clasificar ticket con IA
router.post('/:id/clasificar', procesarConIA);

module.exports = router;