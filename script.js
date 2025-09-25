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
      <text class="label" x="${label.x}" y="${label.y}">${dimensions[i]}</text>
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

// Descargar un Blob como archivo
function downloadBlob(blob, filename) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(a.href);
  a.remove();
}

// Exportar CSV (Dimension,Valor)
function exportRadarCSV() {
  if (!dimensions?.length) return;
  const rows = [['Dimension', 'Valor']];
  for (let i = 0; i < dimensions.length; i++) {
    const dim = String(dimensions[i] ?? '');
    const val = Number(values[i] ?? 0);
    rows.push([dim, val]);
  }
  const csv = rows
    .map(r => r.map(cell => {
      const s = String(cell);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    }).join(','))
    .join('\n');

  downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), 'radar.csv');
}

// Exportar PNG desde el SVG (#radar)
function exportRadarPNG() {
  const node = document.getElementById('radar');
  if (!node) return;

  // Tomamos tamaño del viewBox
  const vb = (node.getAttribute('viewBox') || '0 0 500 500').split(/\s+/).map(parseFloat);
  const width = Math.abs(vb[2] || 500);
  const height = Math.abs(vb[3] || 500);

  // Clonamos el SVG y “inlineamos” estilos computados para que se vean en la imagen
  const clone = node.cloneNode(true);
  const origEls = node.querySelectorAll('*');
  const cloneEls = clone.querySelectorAll('*');

  for (let i = 0; i < origEls.length; i++) {
    const cs = getComputedStyle(origEls[i]);
    const c  = cloneEls[i];

    // Colores y trazos
    if (cs.fill)        c.setAttribute('fill', cs.fill);
    if (cs.stroke)      c.setAttribute('stroke', cs.stroke);
    if (cs.strokeWidth) c.setAttribute('stroke-width', cs.strokeWidth);

    // Texto legible
    if (c.tagName.toLowerCase() === 'text') {
      c.setAttribute('font-size', cs.fontSize);
      c.setAttribute('font-family', cs.fontFamily);
      
      // 👇 asegura que el relleno se pinte arriba del trazo blanco
      const po = cs.paintOrder || 'stroke';
      c.style.setProperty('paint-order', po);
      
      // preservamos attributes de anclaje si no existen
      if (!c.hasAttribute('text-anchor')) c.setAttribute('text-anchor', 'middle');
      if (!c.hasAttribute('dominant-baseline')) c.setAttribute('dominant-baseline', 'middle');
    }
  }

  // Serializamos el SVG clonado
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  const svgStr = new XMLSerializer().serializeToString(clone);
  const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  // Lo dibujamos en un canvas y descargamos PNG
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    URL.revokeObjectURL(url);

    canvas.toBlob((pngBlob) => {
      if (pngBlob) downloadBlob(pngBlob, 'radar.png');
    }, 'image/png');
  };
  img.src = url;
}


// Genera la rueda al cargar la página con las dimensiones por defecto
window.onload = async () => {
  await loadConfig(); // Inicialización al cargar
  generateRadar();
};
