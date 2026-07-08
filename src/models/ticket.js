const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  titulo: {
    type: String,
    required: true,
    trim: true
  },
  descripcion: {
    type: String,
    required: true,
    trim: true
  },
  prioridad: {
    type: String,
    enum: ['baja', 'normal', 'alta', 'urgente'],
    default: 'normal'
  },
  categoria: {
    type: String,
    enum: ['hardware', 'software', 'red', 'acceso', 'infraestructura', 'otro'],
    default: 'otro'
  },
  estado: {
    type: String,
    enum: ['abierto', 'en_proceso', 'resuelto', 'cerrado'],
    default: 'abierto'
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  escalar: {
    type: Boolean,
    default: false
  },
  equipo: {
    type: String,
    enum: ['level1', 'level2', 'devops', 'infraestructura'],
    default: 'level1'
  },
  respuestaIA: {
    type: String,
    default: ''
  },
  trelloUrl: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Ticket', ticketSchema);