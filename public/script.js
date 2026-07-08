async function crearTicket() {
  const titulo = document.getElementById('titulo').value.trim();
  const descripcion = document.getElementById('descripcion').value.trim();
  const prioridad = document.getElementById('prioridad').value;
  const email = document.getElementById('email').value.trim();
  const resultado = document.getElementById('resultado');
  const btn = document.querySelector('.btn-submit');

  if (!titulo || !descripcion || !email) {
    mostrarResultado('error', '⚠️ Campos incompletos', 'Por favor completa todos los campos antes de enviar.');
    return;
  }

  if (!email.includes('@')) {
    mostrarResultado('error', '⚠️ Email inválido', 'Por favor ingresa un email válido.');
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<span>⏳</span> <span>Procesando con IA...</span>';

  try {
    const response = await fetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo, descripcion, prioridad, email })
    });

    const data = await response.json();

    if (data.success) {
      const ticket = data.ticket;
      const prioridadFinal = ticket.prioridad;
      const prioridadCambio = prioridadFinal !== prioridad;

      // Construir mensaje extra según el caso
      let extras = '';

      // Prioridad cambiada por IA
      if (prioridadCambio) {
        const colores = {
          baja: '#22c55e',
          normal: '#eab308',
          alta: '#f97316',
          urgente: '#ef4444'
        };
        extras += `
          <div style="margin-top:0.8rem; padding:0.7rem 1rem; background:rgba(99,102,241,0.1); border:1px solid rgba(99,102,241,0.3); border-radius:8px; font-size:0.85rem;">
            🤖 <strong>La IA ajustó tu prioridad:</strong> 
            <span style="text-decoration:line-through; color:rgba(255,255,255,0.4);">${prioridad.toUpperCase()}</span>
            → <span style="color:${colores[prioridadFinal]}; font-weight:700;">${prioridadFinal.toUpperCase()}</span>
          </div>
        `;
      }

      // Ticket urgente con Trello
      if (prioridadFinal === 'urgente') {
        extras += `
          <div style="margin-top:0.8rem; padding:0.7rem 1rem; background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); border-radius:8px; font-size:0.85rem;">
            🚨 <strong>Ticket URGENTE:</strong> Tu caso ha sido escalado inmediatamente al equipo de soporte.
          </div>
        `;
      }

      // Ticket alta con Trello
      if (prioridadFinal === 'alta') {
        extras += `
          <div style="margin-top:0.8rem; padding:0.7rem 1rem; background:rgba(249,115,22,0.1); border:1px solid rgba(249,115,22,0.3); border-radius:8px; font-size:0.85rem;">
            ⚡ <strong>Prioridad ALTA:</strong> Tu ticket fue tomado con importancia y asignado al equipo correspondiente.
          </div>
        `;
      }

      // Pregunta frecuente
      if (data.esPreguntaFrecuente) {
        extras += `
          <div style="margin-top:0.8rem; padding:0.7rem 1rem; background:rgba(34,197,94,0.1); border:1px solid rgba(34,197,94,0.3); border-radius:8px; font-size:0.85rem;">
            ✨ <strong>Respuesta automática:</strong> La IA detectó tu pregunta y ya te envió la respuesta a tu correo.
          </div>
        `;
      }

      mostrarResultado('success', '✅ Ticket creado exitosamente', 
        `Tu ticket fue registrado y recibirás actualizaciones en tu correo.`,
        ticket._id,
        extras
      );
      limpiarFormulario();
    } else {
      mostrarResultado('error', '❌ Error al crear ticket', data.mensaje);
    }

  } catch (error) {
    mostrarResultado('error', '❌ Error de conexión', 'No se pudo conectar con el servidor. Intenta de nuevo.');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span class="btn-icon">🚀</span><span class="btn-text">Enviar Ticket</span>';
  }
}

function mostrarResultado(tipo, titulo, mensaje, ticketId = null, extras = '') {
  const resultado = document.getElementById('resultado');
  resultado.style.display = 'block';
  resultado.innerHTML = `
    <div class="result-${tipo}">
      <div class="result-title">${titulo}</div>
      <div class="result-detail">${mensaje}</div>
      ${ticketId ? `
  <div class="ticket-id">ID: ${ticketId}</div>
  <div style="margin-top:0.5rem;">
    <a href="ticket.html?id=${ticketId}" style="color:#f5c518; font-size:0.85rem;">🔍 Ver estado de tu ticket</a>
  </div>
` : ''}
      ${extras}
    </div>
  `;
  resultado.scrollIntoView({ behavior: 'smooth' });
}

function limpiarFormulario() {
  document.getElementById('titulo').value = '';
  document.getElementById('descripcion').value = '';
  document.getElementById('email').value = '';
  document.getElementById('prioridad').value = 'normal';
}