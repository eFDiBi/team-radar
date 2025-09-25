let dimensions = [];
let values = [];
let maxValue = 10;
const radius = 200;
const svg = document.getElementById("radar");



function polarToCartesian(angle, value) {
  const angleRad = (angle - 90) * Math.PI / 180;
  const r = (value / maxValue) * radius;
  return {
    x: r * Math.cos(angleRad),
    y: r * Math.sin(angleRad)
  };
}

function drawRadar() {
  svg.innerHTML = "";
  const step = 360 / dimensions.length;
  const points = [];

  // Círculos de fondo
  for (let i = 1; i <= maxValue; i++) {
    const r = (i / maxValue) * radius;
    // svg.innerHTML += `<circle cx="0" cy="0" r="${r}" fill="none" stroke="#eee"/>`;
    svg.innerHTML += `<circle class="grid-ring" cx="0" cy="0" r="${r}"></circle>`;
  }

  // Líneas + etiquetas
  for (let i = 0; i < dimensions.length; i++) {
    const angle = i * step;
    const guide = polarToCartesian(angle, maxValue);
    const label = polarToCartesian(angle, maxValue + 1.25);
    svg.innerHTML += `
      <line class="guide" x1="0" y1="0" x2="${guide.x}" y2="${guide.y}"/>
      <text x="${label.x}" y="${label.y}">${dimensions[i]}</text>
    `;
    svg.innerHTML += `
      <line class="guide" x1="0" y1="0" x2="${g.x}" y2="${g.y}"/>
      <text class="label" x="${lbl.x}" y="${lbl.y}">
        ${dimensions[i]}
      </text>
    `;
  }

  // Área del radar
  for (let i = 0; i < dimensions.length; i++) {
    const angle = i * step;
    const pt = polarToCartesian(angle, values[i]);
    points.push(`${pt.x},${pt.y}`);
  }
  let dataLayer = `<g class="anim-pop">`;
  dataLayer += `<polygon class="polygon" points="${points.join(" ")}"></polygon>`;
  
  // Puntos activos
  for (let i = 0; i < dimensions.length; i++) {
    const angle = i * step;
    const pt = polarToCartesian(angle, values[i]);
    dataLayer += `<circle class="point" cx="${pt.x}" cy="${pt.y}" r="6"/>`;
  }
  dataLayer += `</g>`;
  svg.innerHTML += dataLayer;

  // Puntos clickeables
  for (let i = 0; i < dimensions.length; i++) {
    const angle = i * step;
    for (let level = 1; level <= maxValue; level++) {
      const pt = polarToCartesian(angle, level);
      svg.innerHTML += `
        <circle class="pick" 
          cx="${pt.x}" cy="${pt.y}" r="6" 
          data-index="${i}" 
          data-value="${level}" 
          onclick="handleClick(event)"
        />
      `;
    }
  }
}

// Clic en punto del radar
function handleClick(e) {
  const index = parseInt(e.target.dataset.index);
  const value = parseInt(e.target.dataset.value);
  values[index] = value;
  drawRadar();
}

// Cargar configuracion
async function loadConfig() {
  try {
    const res = await fetch('./config.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const cfg = await res.json();

    // Toma datos del config si existen
    if (typeof cfg.maxValue === 'number' && cfg.maxValue > 0) {
      maxValue = cfg.maxValue;
    } // Por default seteado al declarar la variable
    
    if (Array.isArray(cfg.dimensions) && cfg.dimensions.length >= 3) {
      dimensions = cfg.dimensions;
      document.getElementById('input-dimensions').value = dimensions.join('\n');
    }
  } catch (err) {
    console.warn('No se cargó config.json, uso fallback del textarea.', err);
  }
}

// Botón para cargar los ejes
function generateRadar() {
  const rawText = document.getElementById("input-dimensions").value;
  const lines = rawText.split('\n').map(line => line.trim()).filter(line => line !== '');

  if (lines.length < 3) {
    alert("Por favor, ingresa al menos 3 ejes.");
    return;
  }

  dimensions = lines;
  values = new Array(dimensions.length).fill(0);
  drawRadar();
}

// Genera la rueda al cargar la página con las dimensiones por defecto
window.onload = async () => {
  await loadConfig(); // Inicialización al cargar
  generateRadar();
};
