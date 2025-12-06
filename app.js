// Variables globales para almacenar datos
let participants = [];
let positions = [];
let votes = [];

// Inicialización de la aplicación
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    initTabs();
    // Removida la verificación de modo votación ya que usamos vote.html
});

// Cargar datos del localStorage
function loadData() {
    const storedParticipants = localStorage.getItem('participants');
    const storedPositions = localStorage.getItem('positions');
    const storedVotes = localStorage.getItem('votes');

    if (storedParticipants) participants = JSON.parse(storedParticipants);
    if (storedPositions) positions = JSON.parse(storedPositions);
    if (storedVotes) votes = JSON.parse(storedVotes);

    renderParticipants();
    renderPositions();
    renderResults();
}

// Guardar datos en localStorage
function saveData() {
    localStorage.setItem('participants', JSON.stringify(participants));
    localStorage.setItem('positions', JSON.stringify(positions));
    localStorage.setItem('votes', JSON.stringify(votes));
}

// Sistema de notificaciones
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification show ${type}`;
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 4000);
}

// Sistema de pestañas
function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            
            // Remover clase active de todos los botones y contenidos
            tabBtns.forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // Agregar clase active al botón y contenido seleccionado
            this.classList.add('active');
            document.getElementById(tabName).classList.add('active');
            
            // Actualizar resultados si se abre esa pestaña
            if (tabName === 'results') {
                renderResults();
            }
        });
    });
}

// ==================== PARTICIPANTES ====================

// Registrar nuevo participante
function registerParticipant() {
    const email = document.getElementById('participantEmail').value.trim();
    const nombre = document.getElementById('participantNombre').value.trim();
    const apellido = document.getElementById('participantApellido').value.trim();
    const campo1 = document.getElementById('participantCampo1').value.trim();
    const campo2 = document.getElementById('participantCampo2').value.trim();
    const campo3 = document.getElementById('participantCampo3').value.trim();

    // Validaciones
    if (!email || !nombre || !apellido) {
        showNotification('Complete los campos obligatorios (Email, Nombre, Apellido)', 'error');
        return;
    }

    // Verificar si el email ya existe
    if (participants.find(p => p.email === email)) {
        showNotification('Este correo ya está registrado', 'error');
        return;
    }

    // Crear nuevo participante
    const newParticipant = {
        id: Date.now(),
        email,
        nombre,
        apellido,
        campo1,
        campo2,
        campo3,
        registrado: new Date().toISOString(),
        haVotado: false
    };

    participants.push(newParticipant);
    saveData();
    renderParticipants();
    showNotification('Participante registrado exitosamente');

    // Limpiar formulario
    document.getElementById('participantEmail').value = '';
    document.getElementById('participantNombre').value = '';
    document.getElementById('participantApellido').value = '';
    document.getElementById('participantCampo1').value = '';
    document.getElementById('participantCampo2').value = '';
    document.getElementById('participantCampo3').value = '';
}

// Renderizar tabla de participantes
function renderParticipants() {
    const tbody = document.getElementById('participantsTableBody');
    const count = document.getElementById('participantCount');
    
    count.textContent = participants.length;
    
    if (participants.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 30px; color: #6b7280;">No hay participantes registrados</td></tr>';
        return;
    }

    tbody.innerHTML = participants.map(p => `
        <tr>
            <td>${p.email}</td>
            <td>${p.nombre}</td>
            <td>${p.apellido}</td>
            <td>
                ${p.haVotado 
                    ? '<span class="badge badge-success">Votó</span>' 
                    : '<span class="badge badge-pending">Pendiente</span>'}
            </td>
            <td>
                <button class="btn-icon" onclick="sendEmail('${p.email}')" title="Enviar correo">✉️</button>
                <button class="btn-icon" onclick="deleteParticipant(${p.id})" title="Eliminar">🗑️</button>
            </td>
        </tr>
    `).join('');
}

// Eliminar participante
function deleteParticipant(id) {
    if (confirm('¿Está seguro de eliminar este participante?')) {
        participants = participants.filter(p => p.id !== id);
        saveData();
        renderParticipants();
        showNotification('Participante eliminado');
    }
}

// Enviar correo individual
function sendEmail(email) {
    // Crear URL para vote.html
     const baseUrl = window.location.origin + window.location.pathname.replace('index.html', '');
    const surveyUrl = `${baseUrl}vote.html?email=${encodeURIComponent(email)}`;
    
    const subject = encodeURIComponent('Invitación a Encuesta');
    const body = encodeURIComponent(
        `Estimado/a participante,\n\n` +
        `Ha sido invitado a participar en nuestra encuesta.\n\n` +
        `Para votar, haga clic en el siguiente enlace:\n${surveyUrl}\n\n` +
        `Gracias por su participación.`
    );
    
    window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');
    showNotification('Cliente de correo abierto');
}

// Enviar correos a todos los participantes
function sendAllEmails() {
    if (participants.length === 0) {
        showNotification('No hay participantes registrados', 'error');
        return;
    }

    participants.forEach((p, index) => {
        setTimeout(() => sendEmail(p.email), index * 100);
    });
    
    showNotification(`Enviando ${participants.length} correos...`);
}

// ==================== CARGOS/POSICIONES ====================

// Registrar nuevo cargo
function registerPosition() {
    const titulo = document.getElementById('positionTitulo').value.trim();
    const candidatos = document.getElementById('positionCandidatos').value.trim();

    // Validaciones
    if (!titulo || !candidatos) {
        showNotification('Complete todos los campos', 'error');
        return;
    }

    // Procesar candidatos
    const candidatosArray = candidatos
        .split(',')
        .map(c => c.trim())
        .filter(c => c);

    if (candidatosArray.length === 0) {
        showNotification('Agregue al menos un candidato', 'error');
        return;
    }

    // Crear nuevo cargo
    const newPosition = {
        id: Date.now(),
        titulo,
        candidatos: candidatosArray
    };

    positions.push(newPosition);
    saveData();
    renderPositions();
    showNotification('Cargo agregado exitosamente');

    // Limpiar formulario
    document.getElementById('positionTitulo').value = '';
    document.getElementById('positionCandidatos').value = '';
}

// Renderizar lista de cargos
function renderPositions() {
    const container = document.getElementById('positionsList');
    const count = document.getElementById('positionCount');
    
    count.textContent = positions.length;
    
    if (positions.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 30px; color: #6b7280;">No hay cargos registrados</p>';
        return;
    }

    container.innerHTML = positions.map(pos => `
        <div class="position-item">
            <div class="position-header">
                <h4 class="position-title">${pos.titulo}</h4>
                <button class="btn-icon" onclick="deletePosition(${pos.id})" title="Eliminar">🗑️</button>
            </div>
            <div class="candidates-list">
                ${pos.candidatos.map(c => `<span class="candidate-tag">${c}</span>`).join('')}
            </div>
        </div>
    `).join('');
}

// Eliminar cargo
function deletePosition(id) {
    if (confirm('¿Está seguro de eliminar este cargo?')) {
        positions = positions.filter(p => p.id !== id);
        saveData();
        renderPositions();
        showNotification('Cargo eliminado');
    }
}

// ==================== VOTACIÓN ====================

// Las funciones de votación ahora están en vote.html
// Esta sección se mantiene vacía para organización del código

// ==================== RESULTADOS ====================

// Renderizar resultados
function renderResults() {
    const statTotalParticipants = document.getElementById('statTotalParticipants');
    const statTotalVotes = document.getElementById('statTotalVotes');
    const statParticipationRate = document.getElementById('statParticipationRate');
    const resultsContent = document.getElementById('resultsContent');

    // Estadísticas generales
    const totalParticipants = participants.length;
    const totalVotes = votes.length;
    const participationRate = totalParticipants > 0 
        ? ((totalVotes / totalParticipants) * 100).toFixed(1)
        : 0;

    statTotalParticipants.textContent = totalParticipants;
    statTotalVotes.textContent = totalVotes;
    statParticipationRate.textContent = participationRate + '%';

    // Calcular resultados por posición
    if (positions.length === 0) {
        resultsContent.innerHTML = '<p style="text-align: center; padding: 30px; color: #6b7280;">No hay cargos configurados</p>';
        return;
    }

    if (votes.length === 0) {
        resultsContent.innerHTML = '<p style="text-align: center; padding: 30px; color: #6b7280;">No se han registrado votos aún</p>';
        return;
    }

    const results = {};
    
    // Inicializar contadores
    positions.forEach(pos => {
        results[pos.id] = {
            titulo: pos.titulo,
            votos: {}
        };
        pos.candidatos.forEach(cand => {
            results[pos.id].votos[cand] = 0;
        });
    });

    // Contar votos
    votes.forEach(vote => {
        Object.entries(vote.votos).forEach(([posId, candidato]) => {
            if (results[posId] && results[posId].votos.hasOwnProperty(candidato)) {
                results[posId].votos[candidato]++;
            }
        });
    });

    // Renderizar resultados
    resultsContent.innerHTML = Object.values(results).map(result => {
        const sortedVotes = Object.entries(result.votos).sort((a, b) => b[1] - a[1]);
        const maxVotes = Math.max(...Object.values(result.votos));

        return `
            <div class="result-section">
                <h3 class="result-title">${result.titulo}</h3>
                ${sortedVotes.map(([candidato, votos]) => {
                    const percentage = totalVotes > 0 ? ((votos / totalVotes) * 100).toFixed(1) : 0;
                    const barWidth = maxVotes > 0 ? (votos / maxVotes) * 100 : 0;
                    
                    return `
                        <div class="result-item">
                            <div class="result-header">
                                <span class="result-name">${candidato}</span>
                                <span class="result-stats">${votos} votos (${percentage}%)</span>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${barWidth}%">
                                    ${barWidth > 15 ? percentage + '%' : ''}
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }).join('');
}