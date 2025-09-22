let dimensions = [];
let values = [];
const maxValue = 10;
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
  const step = 360 / dimension.length;
  const points = [];

  // Círculos de fondo
  for (let i = 1; i <= maxValue; i++) {
    const r = (i / maxValue) * radius;
    svg.innerHTML += `<circle cx="0" cy="0" r="${r}" fill="none" stroke="#eee"/>`;
  }

  // Líneas + etiquetas
  for (let i = 0; i < dimensions.length; i++) {
    const angle = i * step;
    const guide = polarToCartesian(angle, maxValue);
    const label = polarToCartesian(angle, maxValue + 0.6);
    svg.innerHTML += `
      <line x1="0" y1="0" x2="${guide.x}" y2="${guide.y}" stroke="#ccc"/>
      <text x="${label.x}" y="${label.y}" font-size="12" text-anchor="middle">${dimensions[i]}</text>
    `;
  }

  // Área del radar
  for (let i = 0; i < dimensions.length; i++) {
    const angle = i * step;
    const pt = polarToCartesian(angle, values[i]);
    points.push(`${pt.x},${pt.y}`);
  }
  svg.innerHTML += `
    <polygon points="${points.join(" ")}" fill="rgba(0,123,255,0.4)" stroke="#007bff" stroke-width="2"/>
  `;

  // Puntos activos
  for (let i = 0; i < dimensions.length; i++) {
    const angle = i * step;
    const pt = polarToCartesian(angle, values[i]);
    svg.innerHTML += `<circle cx="${pt.x}" cy="${pt.y}" r="6" fill="#007bff"/>`;
  }

  // Puntos clickeables
  for (let i = 0; i < dimensions.length; i++) {
    const angle = i * step;
    for (let level = 1; level <= maxValue; level++) {
      const pt = polarToCartesian(angle, level);
      svg.innerHTML += `
        <circle 
          cx="${pt.x}" cy="${pt.y}" r="5" 
          fill="transparent" 
          stroke="#ccc" 
          stroke-width="1" 
          data-index="${i}" 
          data-value="${level}" 
          style="cursor:pointer"
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

// Botón para cargar los ejes
function generateRadar() {
  const rawText = document.getElementById("input-dimension").value;
  const lines = rawText.split('\n').map(line => line.trim()).filter(line => line !== '');

  if (lines.length < 3) {
    alert("Por favor, ingresa al menos 3 ejes.");
    return;
  }

  dimensions = lines;
  values = new Array(dimension.length).fill(0);
  drawRadar();
}

// Genera el radar al cargar la página con los ejes por defecto
window.onload = () => {
  generateRadar();
};
