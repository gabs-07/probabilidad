
/* ==========================
   ESTRUCTURA DEL LIBRO (árbol)
   ========================== */
let libro = []; // array de nodos raíz en orden
let selectedId = null;
let idSeq = 1;

// Historial simple (deshacer)
const historyStack = [];
function pushHistory(){
  historyStack.push(JSON.stringify(libro));
  document.getElementById('btnDeshacer').disabled = historyStack.length <= 1;
}
function undo(){
  if(historyStack.length > 1){
    historyStack.pop();
    libro = JSON.parse(historyStack[historyStack.length-1]);
    selectedId = null;
    renderTOC(); renderPreview(); dumpHTML();
    setActionButtonsState();
  }
}

// Crear nodos
function newNode(tipo){
  return {
    id: "n"+(idSeq++),
    tipo,     // 'portada' | 'prefacio' | 'capitulo' | 'seccion' | 'subseccion'
    titulo: "",
    contenido: "",
    hijos: []
  };
}
// Búsqueda
function findNodeById(id, arr=libro){
  for(const n of arr){
    if(n.id === id) return n;
    const sub = findNodeById(id, n.hijos);
    if(sub) return sub;
  }
  return null;
}

/* ==========================
   MENÚ “Libro (partes)”
   ========================== */
const btnLibro = document.getElementById('btnLibro');
btnLibro.addEventListener('click', ()=>{
  alert(
`Partes disponibles:
• Portada — 1 única (puedes tener varias si quieres, pero lo normal es 1)
• Prefacio — Texto introductorio
• Capítulo — Contenedor de Secciones/Subsecciones
• Sección — Dentro de un capítulo
• Subsección — Dentro de una sección

Truco: Haz clic en el índice para EDITAR una parte.`);
});

/* ==========================
   BOTONES DE CREACIÓN RÁPIDA
   ========================== */
const btnAddPortada = document.getElementById('btnAddPortada');
const btnAddPrefacio = document.getElementById('btnAddPrefacio');
const btnAddCap = document.getElementById('btnAddCap');
const btnAddSec = document.getElementById('btnAddSec');
const btnAddSubsec = document.getElementById('btnAddSubsec');

btnAddPortada.onclick = ()=>openEditorForCreate('portada');
btnAddPrefacio.onclick = ()=>openEditorForCreate('prefacio');
btnAddCap.onclick = ()=>openEditorForCreate('capitulo');
btnAddSec.onclick = ()=>{
  if(!selectedId) return;
  const sel = findNodeById(selectedId);
  if(!sel || (sel.tipo!=='capitulo' && sel.tipo!=='seccion')) return;
  openEditorForCreate('seccion');
};
btnAddSubsec.onclick = ()=>{
  if(!selectedId) return;
  const sel = findNodeById(selectedId);
  if(!sel || sel.tipo!=='seccion') return;
  openEditorForCreate('subseccion');
};

function setActionButtonsState(){
  const sel = selectedId ? findNodeById(selectedId) : null;
  btnAddSec.disabled = !(sel && (sel.tipo==='capitulo' || sel.tipo==='seccion'));
  btnAddSubsec.disabled = !(sel && sel.tipo==='seccion');
}

/* ==========================
   MODAL DE EDICIÓN
   ========================== */
const modalBg = document.getElementById('modalEditorBg');
const modalTitulo = document.getElementById('modalTitulo');
const inpTitulo = document.getElementById('inpTitulo');
const inpContenido = document.getElementById('inpContenido');
const btnCancelar = document.getElementById('btnCancelar');
const btnGuardar = document.getElementById('btnGuardar');

// Math menus
const btnMathSimbolos = document.getElementById('btnMathSimbolos');
const btnMathEqs = document.getElementById('btnMathEqs');
const menuSimbolos = document.getElementById('menuSimbolos');
const menuEqs = document.getElementById('menuEqs');

// Simuladores (nuevo botón + menú)
const btnSimuladores = document.getElementById('btnSimuladores');
const menuSimuladores = document.getElementById('menuSimuladores');

// NUEVO: controles de imagen
const btnImagenJpg = document.getElementById('btnImagenJpg');
const inpImagenJpg = document.getElementById('inpImagenJpg');

let editingExistingId = null; // si edito uno existente
let creatingTipo = null;      // si estoy creando uno nuevo
let creatingParentId = null;  // dónde insertarlo si es hijo

function updateSimulatorToolsVisibility(tipo){
  // Mostrar dropdown de simuladores y botón de imagen
  // en capitulo / seccion / subseccion, y botón de imagen también en portada.
  const showSims = (tipo==='capitulo' || tipo==='seccion' || tipo==='subseccion');
  const showImg  = (tipo==='portada' || showSims);

  if (btnSimuladores) btnSimuladores.style.display = showSims ? 'inline-block' : 'none';
  if (!showSims && menuSimuladores) menuSimuladores.style.display = 'none';

  if (btnImagenJpg) btnImagenJpg.style.display = showImg ? 'inline-block' : 'none';
}

function openEditorForCreate(tipo){
  creatingTipo = tipo;
  creatingParentId = null;
  editingExistingId = null;

  if(tipo==='seccion'){
    const sel = findNodeById(selectedId);
    if(!sel) return;
    creatingParentId = sel.id;
  } else if(tipo==='subseccion'){
    const sel = findNodeById(selectedId);
    if(!sel || sel.tipo!=='seccion') return;
    creatingParentId = sel.id;
  }

  modalTitulo.textContent = "Nueva " + tipo.charAt(0).toUpperCase() + tipo.slice(1);
  inpTitulo.value = "";
  inpContenido.value = "";
  updateSimulatorToolsVisibility(tipo);
  showModal(true);
}

function openEditorForEdit(id){
  const node = findNodeById(id);
  if(!node) return;
  creatingTipo = null; creatingParentId = null;
  editingExistingId = id;

  modalTitulo.textContent = "Editar " + node.tipo.charAt(0).toUpperCase()+node.tipo.slice(1);
  inpTitulo.value = node.titulo || "";
  inpContenido.value = node.contenido || "";
  updateSimulatorToolsVisibility(node.tipo);
  showModal(true);
}

btnCancelar.onclick = ()=> showModal(false);
btnGuardar.onclick = ()=>{
  const titulo = inpTitulo.value.trim();
  const contenido = inpContenido.value;

  if(editingExistingId){
    const n = findNodeById(editingExistingId);
    if(!n) return;
    n.titulo = titulo;
    n.contenido = contenido;
  } else if(creatingTipo){
    const n = newNode(creatingTipo);
    n.titulo = titulo;
    n.contenido = contenido;

    if(!creatingParentId){
      libro.push(n);
    } else {
      const parent = findNodeById(creatingParentId);
      parent.hijos.push(n);
    }
  }

  pushHistory();
  showModal(false);
  renderTOC(); renderPreview(); dumpHTML();
  setActionButtonsState();
};

function showModal(show){
  modalBg.style.display = show ? 'flex' : 'none';
}

/* ==========================
   ÍNDICE (TOC)
   ========================== */
const tocList = document.getElementById('tocList');

function renderTOC(){
  tocList.innerHTML = "";
  let capNum = 0;
  libro.forEach(n=>{
    if(n.tipo==='capitulo') capNum++;
    const li = renderTOCItem(n, {capNum, secNum:0, subNum:0}, 0);
    tocList.appendChild(li);
  });
}

function renderTOCItem(node, ctx, lvl){
  const li = document.createElement('li');
  li.dataset.id = node.id;
  li.className = "lvl-"+lvl + (node.id===selectedId ? " selected" : "");
  li.textContent = labelFor(node, ctx);
  li.onclick = (e)=>{ e.stopPropagation(); selectedId = node.id; renderTOC(); setActionButtonsState(); openEditorForEdit(node.id); };

  if(node.hijos?.length){
    const ul = document.createElement('ul');
    ul.style.listStyle = 'none';
    ul.style.paddingLeft = '0';
    let sec=ctx.secNum, sub=ctx.subNum, cap=ctx.capNum;
    node.hijos.forEach(h=>{
      let childCtx = {capNum:cap, secNum:sec, subNum:sub};
      if(h.tipo==='seccion'){ childCtx.secNum = sec+1; childCtx.subNum=0; sec=childCtx.secNum; }
      if(h.tipo==='subseccion'){ childCtx.subNum = sub+1; sub=childCtx.subNum; }
      ul.appendChild(renderTOCItem(h, childCtx, lvl+1));
    });
    li.appendChild(ul);
  }
  return li;
}

function labelFor(node, ctx){
  switch(node.tipo){
    case 'portada': return `Portada${node.titulo?': '+node.titulo:''}`;
    case 'prefacio': return `Prefacio${node.titulo?': '+node.titulo:''}`;
    case 'capitulo': return `Capítulo ${ctx.capNum}${node.titulo?': '+node.titulo:''}`;
    case 'seccion':  return `${ctx.capNum}.${ctx.secNum} ${node.titulo||''}`;
    case 'subseccion': return `${ctx.capNum}.${ctx.secNum}.${ctx.subNum} ${node.titulo||''}`;
    default: return node.titulo||node.tipo;
  }
}

/* ==========================
   PREVIEW + HTML GENERADO
   ========================== */
const preview = document.getElementById('preview');
const codigoHtml = document.getElementById('codigoHtml');

// === Registro central de simuladores ===
const SIMULADORES = [
  {
    id: 'suma',
    title: 'Suma de dos enteros',
    token: '[SIM:suma]',
    render: () => crearSimuladorSuma(),
    useUnifiedCard: true,
    instructionsHTML: 'Ingrese dos enteros y observe el resultado.'
  },
  {
    id: 'recta',
    title: 'Recta numérica (Plotly)',
    token: '[SIM:recta]',
    render: (ctx) => {
      const idDiv = "recta_" + (ctx?.uid || Math.random().toString(36).slice(2,7));
      return crearGraficadorRecta(idDiv);
    },
    useUnifiedCard: true,
    instructionsHTML: 'Recta numérica con marcas y extremos \\(\\pm\\infty\\).'
  },
  {
    id: 'enteros',
    title: 'Enteros (toggle interno)',
    token: '[SIM:enteros]',
    render: (ctx) => {
      const key = "graf_" + (ctx?.uid || Math.random().toString(36).slice(2,7));
      return crearGraficadorEnterosToggle(key);
    },
    useUnifiedCard: false
  }
];

function findSimById(id){ return SIMULADORES.find(s => s.id === id); }
function findSimByToken(token){ return SIMULADORES.find(s => s.token === token); }

// Tarjeta unificada (toggle)
function crearTarjetaSimulador(titulo, contentEl, opts={}){
  const card = document.createElement('div');
  card.className = 'simulador-box';

  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.alignItems = 'center';
  header.style.justifyContent = 'space-between';
  header.style.marginBottom = '6px';

  const h3 = document.createElement('h3');
  h3.textContent = titulo;
  h3.style.margin = '0';

  const btn = document.createElement('button');
  btn.textContent = opts.initiallyOpen ? 'Ocultar' : 'Mostrar';
  btn.className = 'btn-sim';

  header.appendChild(h3);
  header.appendChild(btn);

  const instr = document.createElement('div');
  if (opts.instructionsHTML){
    instr.innerHTML = `<div class="figure-caption" style="margin-top:4px">${opts.instructionsHTML}</div>`;
  }

  const contentWrap = document.createElement('div');
  contentWrap.style.display = opts.initiallyOpen ? 'block' : 'none';
  contentWrap.appendChild(instr);
  contentWrap.appendChild(contentEl);

  btn.onclick = ()=>{
    const open = contentWrap.style.display === 'block';
    contentWrap.style.display = open ? 'none' : 'block';
    btn.textContent = open ? 'Mostrar' : 'Ocultar';
    if(!open && window.MathJax?.typesetPromise) MathJax.typesetPromise([contentWrap]);
  };

  card.appendChild(header);
  card.appendChild(contentWrap);
  return card;
}

function renderPreview(){
  preview.innerHTML = "";
  libro.forEach(n=>{
    preview.appendChild(renderNode(n));
  });
  if(window.MathJax?.typesetPromise) MathJax.typesetPromise([preview]);
}

function renderNode(node, ctx={}){
  const wrap = document.createElement('section');
  wrap.dataset.id = node.id;
  wrap.style.scrollMarginTop = "60px";

  // Título
  const h = document.createElement(node.tipo==='subseccion' ? 'h4' :
                                   node.tipo==='seccion' ? 'h3' :
                                   node.tipo==='capitulo' ? 'h2' : 'h2');
  h.textContent = node.titulo || (node.tipo==='portada'?'Portada':node.tipo);
  wrap.appendChild(h);
  if(node.tipo==='capitulo' || node.tipo==='seccion') {
    const hr = document.createElement('hr'); hr.className='separador-seccion'; wrap.appendChild(hr);
  }

  // Contenido (texto + LaTeX + simuladores)
  const body = document.createElement('div');
  const lines = (node.contenido||"").split(/\n/);
  const simTokenRegex = /^\[SIM:([a-z0-9\-]+)(?:\|([^\]]+))?\]$/i;

  lines.forEach(line=>{
    const trimmed = line.trim();

    // Compat tokens antiguos
    if(trimmed === '[SIM:suma]'){
      const simDef = findSimById('suma');
      const el = simDef.render({uid: node.id});
      const card = simDef.useUnifiedCard ? crearTarjetaSimulador(simDef.title, el, {initiallyOpen:false, instructionsHTML: simDef.instructionsHTML}) : el;
      body.appendChild(card);
      return;
    } else if(trimmed === '[SIM:recta]'){
      const simDef = findSimById('recta');
      const el = simDef.render({uid: node.id});
      const card = simDef.useUnifiedCard ? crearTarjetaSimulador(simDef.title, el, {initiallyOpen:false, instructionsHTML: simDef.instructionsHTML}) : el;
      body.appendChild(card);
      return;
    } else if(trimmed === '[SIM:enteros]'){
      const simDef = findSimById('enteros');
      const el = simDef.render({uid: node.id});
      const card = simDef.useUnifiedCard ? crearTarjetaSimulador(simDef.title, el, {initiallyOpen:false}) : el;
      body.appendChild(card);
      return;
    }

    // Router general: [SIM:<id>|param=val;...]
    const m = trimmed.match(simTokenRegex);
    if(m){
      const id = m[1].toLowerCase();
      const paramsRaw = m[2] || "";
      const simDef = findSimById(id);
      if(simDef){
        const el = simDef.render({uid: node.id, params: paramsRaw});
        const card = simDef.useUnifiedCard ? crearTarjetaSimulador(simDef.title, el, {initiallyOpen:false, instructionsHTML: simDef.instructionsHTML}) : el;
        body.appendChild(card);
      } else {
        const warn = document.createElement('div');
        warn.className = 'simulador-box';
        warn.innerHTML = `<b>Simulador no encontrado:</b> <code>${id}</code>`;
        body.appendChild(warn);
      }
      return;
    }

    // Imágenes crudas
    if(trimmed.startsWith('<img')){
      const w = document.createElement('div'); w.innerHTML = trimmed; body.appendChild(w.firstChild);
      return;
    }

    // Texto normal
    if(trimmed){
      const p = document.createElement('p'); p.style.textAlign='justify'; p.style.margin='0';
      p.textContent = line; body.appendChild(p);
    } else {
      body.appendChild(document.createElement('br'));
    }
  });

  // Portada con aviso si vacía
  if(node.tipo==='portada' && !node.contenido.trim()){
    const d = document.createElement('div');
    d.className = 'definicion-estilo';
    d.innerHTML = `<p>Escribe el <b>título</b>, <i>autor</i> y <u>fecha</u> en el contenido para personalizar la portada.</p>`;
    body.appendChild(d);
  }

  wrap.appendChild(body);

  // hijos
  if(node.hijos?.length){
    node.hijos.forEach(hijo=>{
      wrap.appendChild(renderNode(hijo, ctx));
    });
  }
  return wrap;
}

function dumpHTML(){
  // exporta una versión mínima (solo texto/estructura y marcadores)
  let html = "";
  function emit(n, ctx){
    const tituloEtiq =
      n.tipo==='subseccion' ? 'h4' :
      n.tipo==='seccion' ? 'h3' :
      'h2';
    html += `<${tituloEtiq}>${n.titulo||n.tipo}</${tituloEtiq}>\n`;
    if(n.tipo==='capitulo' || n.tipo==='seccion') html += `<hr class="separador-seccion">\n`;
    const lines = (n.contenido||"").split(/\n/);
    lines.forEach(line=>{
      const t = line.trim();
      if(t==='[SIM:suma]') html += `<!-- Simulador suma -->\n`;
      else if(t==='[SIM:recta]') html += `<!-- Recta numérica (Plotly) -->\n`;
      else if(t==='[SIM:enteros]') html += `<!-- Enteros (toggle) -->\n`;
      else if(t.startsWith('<img')) html += `${t}\n`;
      else if(t) html += `<p style="text-align:justify;margin:0">${line}</p>\n`;
      else html += `<br>\n`;
    });
    n.hijos?.forEach(h=>emit(h,ctx));
  }
  libro.forEach(n=>emit(n,{}));
  codigoHtml.value = html;
}

/* ==========================
   SELECCIÓN EN ÍNDICE
   ========================== */
document.getElementById('btnDeshacer').onclick = undo;

/* ==========================
   MENÚS MATEMÁTICOS + SIMULADORES + IMAGEN
   ========================== */
function populateMathMenus(){
  // Símbolos
  menuSimbolos.innerHTML = `
    <div class="menu-cat">Conjuntos</div>
    <div class="menu-cat">Los símbolos matemáticos siempre se escriben dentro de un sólo parétesis: Inicie con paréntesis</div>
      <span class="math-item" data-insert="\\( \\)">\( Genere un Paréntesis \)</span>    
      <span class="math-item" data-insert="\\mathbb{N}">ℕ</span>
      <span class="math-item" data-insert="\\mathbb{Z}">ℤ</span>
      <span class="math-item" data-insert="\\mathbb{Q}">ℚ</span>
      <span class="math-item" data-insert="\\mathbb{R}">ℝ</span>
      <span class="math-item" data-insert="\\mathbb{C}">ℂ</span>
    <div class="menu-cat">Operaciones</div>
      <span class="math-item" data-insert="\\( \\)">\( Genere un Paréntesis \)</span>
      <span class="math-item" data-insert="+">+</span>
      <span class="math-item" data-insert="-">−</span>
      <span class="math-item" data-insert="\\times">×</span>
      <span class="math-item" data-insert="\\cdot">·</span>
      <span class="math-item" data-insert="\\div">÷</span>
      <span class="math-item" data-insert="/">/</span>
      <span class="math-item" data-insert="=">=</span>
      <span class="math-item" data-insert="\\neq">≠</span>
      <span class="math-item" data-insert="<">&lt;</span>
      <span class="math-item" data-insert=">">&gt;</span>
      <span class="math-item" data-insert="\\leq">≤</span>
      <span class="math-item" data-insert="\\geq">≥</span>
    <div class="menu-cat">Los símbolos matemáticos siempre se escriben dentro de un sólo parétesis: Inicie con paréntesis</div>      
    <div class="menu-cat">Especiales</div>
      <span class="math-item" data-insert="\\( \\)">\( Genere un Paréntesis \)</span>    
      <span class="math-item" data-insert="\\infty">∞</span>
      <span class="math-item" data-insert="\\in">∈</span>
      <span class="math-item" data-insert="\\notin">∉</span>
      <span class="math-item" data-insert="\\subset">⊂</span>
      <span class="math-item" data-insert="\\varnothing">∅</span>
    <div class="menu-cat">Los símbolos matemáticos siempre se escriben dentro de un sólo parétesis: Inicie con paréntesis</div>       
    <div class="menu-cat">Letras del alfabeto griego</div>
      <span class="math-item" data-insert="A">Α</span>
      <span class="math-item" data-insert="B">Β</span>
      <span class="math-item" data-insert="\\Gamma">Γ</span>
      <span class="math-item" data-insert="\\Delta">Δ</span>
      <span class="math-item" data-insert="E">Ε</span>
      <span class="math-item" data-insert="Z">Ζ</span>
      <span class="math-item" data-insert="H">Η</span>
      <span class="math-item" data-insert="\\Theta">Θ</span>
      <span class="math-item" data-insert="I">Ι</span>
      <span class="math-item" data-insert="K">Κ</span>
      <span class="math-item" data-insert="\\Lambda">Λ</span>
      <span class="math-item" data-insert="M">Μ</span>
      <span class="math-item" data-insert="N">Ν</span>
      <span class="math-item" data-insert="\\Xi">Ξ</span>
      <span class="math-item" data-insert="O">Ο</span>
      <span class="math-item" data-insert="\\Pi">Π</span>
      <span class="math-item" data-insert="P">Ρ</span>
      <span class="math-item" data-insert="\\Sigma">Σ</span>
      <span class="math-item" data-insert="T">Τ</span>
      <span class="math-item" data-insert="\\Upsilon">Υ</span>
      <span class="math-item" data-insert="\\Phi">Φ</span>
      <span class="math-item" data-insert="X">Χ</span>
      <span class="math-item" data-insert="\\Psi">Ψ</span>
      <span class="math-item" data-insert="\\Omega">Ω</span>
    <div class="menu-cat">Las estructuras algebraicas siempre se escriben dentro de un sólo parétesis: Inicie con paréntesis</div>
      <span class="math-item" data-insert="\\( \\)">\( Genere un Paréntesis \)</span>
      <span class="math-item" data-insert="\\alpha">α</span>
      <span class="math-item" data-insert="\\beta">β</span>
      <span class="math-item" data-insert="\\gamma">γ</span>
      <span class="math-item" data-insert="\\delta">δ</span>
      <span class="math-item" data-insert="\\epsilon">ε</span>
      <span class="math-item" data-insert="\\zeta">ζ</span>
      <span class="math-item" data-insert="\\eta">η</span>
      <span class="math-item" data-insert="\\theta">θ</span>
      <span class="math-item" data-insert="\\iota">ι</span>
      <span class="math-item" data-insert="\\kappa">κ</span>
      <span class="math-item" data-insert="\\lambda">λ</span>
      <span class="math-item" data-insert="\\mu">μ</span>
      <span class="math-item" data-insert="\\nu">ν</span>
      <span class="math-item" data-insert="\\xi">ξ</span>
      <span class="math-item" data-insert="\\omicron">ο</span>
      <span class="math-item" data-insert="\\pi">π</span>
      <span class="math-item" data-insert="\\rho">ρ</span>
      <span class="math-item" data-insert="\\sigma">σ</span>
      <span class="math-item" data-insert="\\tau">τ</span>
      <span class="math-item" data-insert="\\upsilon">υ</span>
      <span class="math-item" data-insert="\\phi">φ</span>
      <span class="math-item" data-insert="\\chi">χ</span>
      <span class="math-item" data-insert="\\psi">ψ</span>
      <span class="math-item" data-insert="\\omega">ω</span>
  `;

  // Estructuras
  menuEqs.innerHTML = `
    <div class="menu-cat">Las estructuras algebraicas siempre se escriben dentro de un sólo parétesis: Inicie con paréntesis</div>
      <span class="math-item" data-insert="\\( \\)">\( Genere un Paréntesis \)</span>
      <span class="math-item" data-insert="\\frac{a}{b}">Fracción \\( \\frac{a}{b} \\)</span>
      <span class="math-item" data-insert="\\sqrt{a}">Raíz \\( \\sqrt{a} \\)</span>
      <span class="math-item" data-insert="a^{n}">Potencia \\( a^n \\)</span>
      <span class="math-item" data-insert="a_{n}">Índice \\( a_n \\)</span>
      <span class="math-item" data-insert="|a|">Valor absoluto \\( |a| \\)</span>
      <span class="math-item" data-insert="\\sum_{i=1}^{n} a_i">Sumatoria \\( \\sum_{i=1}^{n} a_i \\)</span>
      <span class="math-item" data-insert="\\prod_{i=1}^{n} a_i">Productoria \\( \\prod_{i=1}^{n} a_i \\)</span>
      <span class="math-item" data-insert="\\lim_{x \\to 0} f(x)">Límite \\( \\lim_{x \\to 0} f(x) \\)</span>
      <span class="math-item" data-insert="\\frac{d}{dx} f(x)">Derivada \\( \\frac{d}{dx} f(x) \\)</span>
      <span class="math-item" data-insert="\\int_{a}^{b} f(x)\\,dx">Integral \\( \\int_{a}^{b} f(x)\\,dx \\)</span>
      <span class="math-item" data-insert="\\left( a+b \\right)">Paréntesis grandes \\( \\left( a+b \\right) \\)</span>
      <span class="math-item" data-insert="\\left| a \\right|">Valor absoluto \\( \\left| a \\right| \\)</span>
      <span class="math-item" data-insert="\\left[ a \\right]">Corchetes grandes \\( \\left[ a \\right] \\)</span>
      <span class="math-item" data-insert="\\left\\{ a \\right\\}">Llaves grandes \\( \\left\\{ a \\right\\} \\)</span>
  `;

  // Re-render de MathJax para ejemplos dentro del menú
  if (window.MathJax && MathJax.typesetPromise) {
    MathJax.typesetClear && MathJax.typesetClear([menuEqs]);
    MathJax.typesetPromise([menuEqs]);
  }

  // Click-to-insert (Símbolos + Eqs)
  [...menuSimbolos.querySelectorAll('.math-item'),
   ...menuEqs.querySelectorAll('.math-item')].forEach(el=>{
    el.addEventListener('click', (ev)=>{
      ev.stopPropagation();
      const val = el.getAttribute('data-insert');

      // Caso especial para \( \) — cursor adentro
      if (val === "\\( \\)") {
        const ta = inpContenido;
        const start = ta.selectionStart, end = ta.selectionEnd;
        const v = ta.value;
        ta.value = v.slice(0, start) + val + v.slice(end);
        ta.selectionStart = ta.selectionEnd = start + 3; 
      } else {
        insertAtCursor(inpContenido, val);
      }

      menuSimbolos.style.display = 'none';
      menuEqs.style.display = 'none';
      menuSimuladores.style.display = 'none';
      inpContenido.focus();
    });
  });

  // ===== Menú de Simuladores (desde el registro) =====
  let simItems = `<div class="menu-cat">Simuladores disponibles</div>`;
  SIMULADORES.forEach(sim=>{
    simItems += `<span class="math-item" data-token="${sim.token}">${sim.title}</span>`;
  });
  menuSimuladores.innerHTML = simItems;

  // Click-to-insert (Simuladores)
  [...menuSimuladores.querySelectorAll('.math-item')].forEach(el=>{
    el.addEventListener('click', (ev)=>{
      ev.stopPropagation();
      const token = el.getAttribute('data-token') || '';
      if(token) insertAtCursor(inpContenido, token);
      menuSimuladores.style.display = 'none';
      inpContenido.focus();
    });
  });

  // ===== NUEVO: Manejo del botón de imagen JPG =====
  btnImagenJpg.addEventListener('click', ()=>{
    inpImagenJpg.click();
  });
  inpImagenJpg.addEventListener('change', ()=>{
    const file = inpImagenJpg.files && inpImagenJpg.files[0];
    if(!file) return;
    if(!/^image\/jpeg$/i.test(file.type)){
      alert('Por favor, selecciona un archivo JPG (.jpg o .jpeg).');
      inpImagenJpg.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = function(e){
      const dataURL = e.target.result;
      // Inserta una imagen responsiva alineada con el texto
      const tag = `<img src="${dataURL}" alt="Imagen" style="max-width:100%;height:auto;display:block;margin:8px auto;">`;
      insertAtCursor(inpContenido, tag);
      inpImagenJpg.value = '';
      inpContenido.focus();
    };
    reader.readAsDataURL(file);
  });
}

function insertAtCursor(textarea, text){
  const start = textarea.selectionStart, end = textarea.selectionEnd;
  const v = textarea.value;
  textarea.value = v.slice(0,start) + text + v.slice(end);
  textarea.selectionStart = textarea.selectionEnd = start + text.length;
}

// Menús emergentes (Math y Simuladores)
btnMathSimbolos.onclick = (e)=>{
  e.stopPropagation();
  menuEqs.style.display='none';
  menuSimuladores.style.display='none';
  smartToggleMenu(menuSimbolos, e.target);
};
btnMathEqs.onclick = (e)=>{
  e.stopPropagation();
  menuSimbolos.style.display='none';
  menuSimuladores.style.display='none';
  smartToggleMenu(menuEqs, e.target);
};
btnSimuladores.onclick = (e)=>{
  e.stopPropagation();
  menuSimbolos.style.display='none';
  menuEqs.style.display='none';
  smartToggleMenu(menuSimuladores, e.target);
};
function smartToggleMenu(menu, anchorBtn){
  if(menu.style.display==='block'){ menu.style.display='none'; return; }
  menu.style.display='block'; // mostrar para medir
  const rect = anchorBtn.getBoundingClientRect();
  const mH = menu.offsetHeight;
  const desiredTop = rect.top - mH - 8; // arriba del botón
  const top = desiredTop < 8 ? (rect.bottom + 6) : desiredTop;
  menu.style.left = Math.max(8, Math.min(window.innerWidth - menu.offsetWidth - 8, rect.left)) + 'px';
  menu.style.top  = top + 'px';
}

window.addEventListener('click', (e)=>{
  if(!e.target.closest('.math-menu') && !e.target.closest('button')){
    menuSimbolos.style.display='none';
    menuEqs.style.display='none';
    menuSimuladores.style.display='none';
  }
});

/* ==========================
   SIMULADORES (tus funciones, intactas)
   ========================== */
function crearSimuladorSuma() {
  const div = document.createElement("div");
  div.className = "simulador-box";
  const titulo = document.createElement("h3");
  titulo.textContent = "Simulador de suma de dos enteros";
  div.appendChild(titulo);

  const label1 = document.createElement("label");
  label1.style.color = "blue"; label1.style.fontWeight = "bold";
  label1.textContent = "Primer número: ";
  const input1 = document.createElement("input"); input1.type="number"; input1.value=3;
  label1.appendChild(input1);

  const label2 = document.createElement("label");
  label2.style.color = "red"; label2.style.fontWeight = "bold"; label2.style.marginLeft="10px";
  label2.textContent = "Segundo número: ";
  const input2 = document.createElement("input"); input2.type="number"; input2.value=5;
  label2.appendChild(input2);

  const btn = document.createElement("button"); btn.textContent="Sumar";
  const resul = document.createElement("h2"); resul.style.color="green"; resul.style.fontWeight="bold"; resul.style.display="inline";
  btn.onclick = ()=>{ const n1=+input1.value||0, n2=+input2.value||0; resul.textContent = `${n1} + ${n2} = ${n1+n2}`; };

  div.appendChild(label1); div.appendChild(document.createTextNode(" "));
  div.appendChild(label2); div.appendChild(document.createTextNode(" "));
  div.appendChild(btn); div.appendChild(resul);
  return div;
}

function crearGraficadorRecta(idDiv) {
  const cont = document.createElement("div");
  cont.className = "simulador-box";
  cont.innerHTML = `<div id="${idDiv}" style="width:100%;max-width:800px;height:150px;"></div>
    <div class="figure-caption"><strong>Figura.</strong> Recta numérica extendida hacia \\(-\\infty\\) y \\(+\\infty\\).</div>`;
  setTimeout(() => {
    const minX = -3, maxX = 3;
    const valoresX = Array.from({length: maxX - minX + 1}, (_, i) => i + minX);
    const linea = { x:[minX,maxX], y:[0,0], mode:'lines', line:{color:'black', width:3}, hoverinfo:'skip', showlegend:false };
    const etiquetasEnteros = {
      x: valoresX, y: valoresX.map(() => -0.08), mode: 'text',
      text: valoresX.map(String), textfont: { size:14, color: valoresX.map(v=>v===0?'red':'black'), family:'Arial Black'},
      hoverinfo:'skip', showlegend:false
    };
    const ticksEnteros = valoresX.map(v => ({type:'line', x0:v, y0:-0.025, x1:v, y1:0.025, line:{color:'black', width:2}}));
    const flechas = [
      { type:'line', x0:-2.5, y0:0.05, x1:minX-0.5, y1:0.05, line:{color:'blue', width:2} },
      { type:'line', x0: 2.5, y0:0.05, x1:maxX+0.5, y1:0.05, line:{color:'blue', width:2} },
    ];
    const etiquetasInfinito = { x:[minX-0.5, maxX+0.5], y:[0.05, 0.05], mode:'text',
      text:['−∞','+∞'], textfont:{size:30, color:'red', family:'Arial Black'}, hoverinfo:'skip', showlegend:false };
    const layout = {
      margin:{l:5,r:5,t:5,b:5},
      xaxis:{ range:[minX-1, maxX+1], showgrid:false, zeroline:false, visible:false },
      yaxis:{ range:[-0.12, 0.15], visible:false },
      shapes:[...ticksEnteros, ...flechas]
    };
    Plotly.newPlot(idDiv, [linea, etiquetasEnteros, etiquetasInfinito], layout, {displayModeBar:false});
    if (window.MathJax?.typesetPromise) MathJax.typesetPromise([cont]);
  }, 20);
  return cont;
}

// ==== Enteros (toggle) + helpers canvas ====
function crearGraficadorEnterosToggle(key) {
  const box = document.createElement('div'); box.className = 'simulador-box';
  const btn = document.createElement('button'); btn.textContent='Mostrar graficador';
  const cont = document.createElement('div'); cont.style.display='none';

  cont.innerHTML = `
    <h3>Graficador de números enteros</h3>
    <p style="text-align:justify;">Indica un entero \\(n\\in[-20,20]\\) y observa.</p>
    <label>Ingresa un número: <input type="number" id="num_${key}" min="-20" max="20" value="0"></label>
    <button id="btnGraf_${key}">Graficar</button>
    <div id="contGraf_${key}" style="margin-top:10px; position:relative; width:100%;">
      <canvas id="canvas_${key}" height="100" style="width:100%"></canvas>
      <div id="recta_${key}" style="position:relative; height:20px;"></div>
    </div>`;

  btn.onclick = ()=>{
    const open = cont.style.display==='block';
    cont.style.display = open? 'none':'block';
    btn.textContent = open? 'Mostrar graficador':'Ocultar graficador';
    if(window.MathJax?.typesetPromise) MathJax.typesetPromise([cont]);
  };
  cont.querySelector(`#btnGraf_${key}`).onclick = ()=>{
    const val = parseInt(cont.querySelector(`#num_${key}`).value);
    if(isNaN(val)||val<-20||val>20){ alert('Ingrese entre -20 y 20'); return; }
    dibujarEntero(val, `contGraf_${key}`, `canvas_${key}`, `recta_${key}`);
  };

  box.appendChild(btn); box.appendChild(cont);
  return box;
}
function ajustarCanvasYRecta(contenedor, canvas, recta, inicio, fin) {
  canvas.width = contenedor.clientWidth;
  let paso = canvas.width / (fin - inicio);
  let altura = Math.max(50, paso);
  canvas.height = altura + 20;
  recta.style.top = altura + "px";
  recta.style.width = canvas.width + "px";
  contenedor.style.height = (altura + 40) + "px";
  return { paso, altura };
}
function dibujaRecta(inicio, fin, recta, anchoRecta){
  recta.innerHTML = '';
  for(let i=inicio;i<=fin;i++){
    let pos=((i-inicio)/(fin-inicio))*anchoRecta;
    let marca=document.createElement("div"); marca.style.position='absolute';
    marca.style.left=pos+"px"; marca.style.top='0px';
    marca.style.width='1px'; marca.style.height='10px'; marca.style.background='#000';
    recta.appendChild(marca);

    let numero=document.createElement("div"); numero.style.position='absolute';
    numero.style.left=pos+"px"; numero.style.top='10px';
    numero.style.transform='translateX(-50%)'; numero.style.fontSize='12px';
    numero.textContent=i; recta.appendChild(numero);
  }
}
function dibujarArco(ctx, xInicio, pasos, color, paso, altura, tipo) {
  let dir = tipo === 'derecha' ? 1 : -1;
  let x = xInicio;
  for (let i=0;i<pasos;i++){
    ctx.beginPath();
    ctx.strokeStyle = color; ctx.lineWidth=2;
    if (color === 'blue') {
      ctx.arc(x + dir*(paso/2), altura, paso/2, Math.PI, 0, false);
    } else {
      ctx.moveTo(x, altura);
      ctx.quadraticCurveTo(x + dir*(paso/2), altura - altura*0.75, x + dir*paso, altura);
    }
    ctx.stroke(); x += dir*paso;
  }
}
function dibujarEntero(num, contId, canvasId, rectaId){
  let inicio = Math.min(0,num) - 1;
  let fin    = Math.max(0,num) + 1;

  let contenedor = document.getElementById(contId);
  let canvas = document.getElementById(canvasId);
  let ctx = canvas.getContext("2d");
  let recta = document.getElementById(rectaId);

  let { paso, altura } = ajustarCanvasYRecta(contenedor,canvas,recta,inicio,fin);

  ctx.clearRect(0,0,canvas.width,canvas.height);
  dibujaRecta(inicio,fin,recta,canvas.width);

  // Punto inicio (0)
  let xCero = (0 - inicio) * paso;
  ctx.beginPath(); ctx.fillStyle="blue"; ctx.arc(xCero, altura, 6, 0, 2*Math.PI); ctx.fill(); ctx.stroke();

  if(num>0){ dibujarArco(ctx,xCero,Math.abs(num),'blue',paso,altura,'derecha'); }
  else if(num<0){ dibujarArco(ctx,xCero,Math.abs(num),'red',paso,altura,'izquierda'); }

  let xFin = (num - inicio) * paso;
  ctx.beginPath();
  ctx.moveTo(xFin, altura + 12);
  ctx.lineTo(xFin - 8, altura - 8);
  ctx.lineTo(xFin + 8, altura - 8);
  ctx.closePath();
  ctx.fillStyle = num >= 0 ? "blue" : "red";
  ctx.fill(); ctx.stroke();
}

/* ==========================
   INICIO
   ========================== */
window.onload = function(){
  libro = [];
  pushHistory();
  renderTOC(); renderPreview(); dumpHTML();
  setActionButtonsState();
  populateMathMenus();
};


/* ==========================
   NUEVO: Exportación a HTML
   ========================== */
document.getElementById('btnExportarHtml').addEventListener('click', ()=>{
  // Nombre sugerido (usa la Portada si existe)
  const portada = libro.find(n => n.tipo==='portada' && n.titulo?.trim());
  const nombre = (portada ? portada.titulo.trim() : 'libro').replace(/[\\/:*?"<>|]+/g,'-') || 'libro';
  const archivo = nombre + '.html';

  // JSON del libro
  const libroJson = JSON.stringify(libro);

  // HTML autónomo (solo lectura) que re-renderiza la vista previa y simuladores
  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>${nombre}</title>
<link rel="stylesheet" href="editor_libro.css">
<script src="https://cdn.plot.ly/plotly-2.32.0.min.js"><\/script>
<script>
  MathJax = { tex: { inlineMath: [['\\\\(','\\\\)']], displayMath: [['\\\\[','\\\\]']] }, svg: { fontCache: 'global' } };
<\/script>
<script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"><\/script>
<style>
  body { max-width: 960px; margin: 24px auto; padding: 0 16px; }
</style>
</head>
<body>
  <div class="info">
    <span class="badge">Versión exportada (solo lectura)</span>
  </div>
  <div id="preview" class="output"></div>

  <script>
    // ================= RUNTIME DE LECTURA =================
    const libro = ${libroJson};

    // Simuladores (mismo registro básico)
    const SIMULADORES = [
      {
        id: 'suma',
        title: 'Suma de dos enteros',
        token: '[SIM:suma]',
        render: () => crearSimuladorSuma(),
        useUnifiedCard: true,
        instructionsHTML: 'Ingrese dos enteros y observe el resultado.'
      },
      {
        id: 'recta',
        title: 'Recta numérica (Plotly)',
        token: '[SIM:recta]',
        render: (ctx) => {
          const idDiv = "recta_" + (ctx?.uid || Math.random().toString(36).slice(2,7));
          return crearGraficadorRecta(idDiv);
        },
        useUnifiedCard: true,
        instructionsHTML: 'Recta numérica con marcas y extremos \\\\(\\\\pm\\\\infty\\\\).'
      },
      {
        id: 'enteros',
        title: 'Enteros (toggle interno)',
        token: '[SIM:enteros]',
        render: (ctx) => {
          const key = "graf_" + (ctx?.uid || Math.random().toString(36).slice(2,7));
          return crearGraficadorEnterosToggle(key);
        },
        useUnifiedCard: false
      }
    ];
    function findSimById(id){ return SIMULADORES.find(s => s.id === id); }

    function crearTarjetaSimulador(titulo, contentEl, opts={}){
      const card = document.createElement('div');
      card.className = 'simulador-box';
      const header = document.createElement('div');
      header.style.display = 'flex';
      header.style.alignItems = 'center';
      header.style.justifyContent = 'space-between';
      header.style.marginBottom = '6px';
      const h3 = document.createElement('h3'); h3.textContent = titulo; h3.style.margin = '0';
      const btn = document.createElement('button'); btn.textContent = opts.initiallyOpen ? 'Ocultar' : 'Mostrar'; btn.className = 'btn-sim';
      header.appendChild(h3); header.appendChild(btn);
      const instr = document.createElement('div');
      if (opts.instructionsHTML){ instr.innerHTML = '<div class="figure-caption" style="margin-top:4px">'+opts.instructionsHTML+'</div>'; }
      const contentWrap = document.createElement('div'); contentWrap.style.display = opts.initiallyOpen ? 'block' : 'none';
      contentWrap.appendChild(instr); contentWrap.appendChild(contentEl);
      btn.onclick = ()=>{ const open = contentWrap.style.display === 'block'; contentWrap.style.display = open ? 'none' : 'block'; btn.textContent = open ? 'Mostrar' : 'Ocultar'; if(!open && window.MathJax?.typesetPromise) MathJax.typesetPromise([contentWrap]); };
      card.appendChild(header); card.appendChild(contentWrap);
      return card;
    }

    // === Funciones de simuladores ===
    function crearSimuladorSuma() {
      const div = document.createElement("div");
      div.className = "simulador-box";
      const titulo = document.createElement("h3"); titulo.textContent = "Simulador de suma de dos enteros"; div.appendChild(titulo);
      const label1 = document.createElement("label"); label1.style.color = "blue"; label1.style.fontWeight = "bold"; label1.textContent = "Primer número: ";
      const input1 = document.createElement("input"); input1.type="number"; input1.value=3; label1.appendChild(input1);
      const label2 = document.createElement("label"); label2.style.color = "red"; label2.style.fontWeight = "bold"; label2.style.marginLeft="10px"; label2.textContent = "Segundo número: ";
      const input2 = document.createElement("input"); input2.type="number"; input2.value=5; label2.appendChild(input2);
      const btn = document.createElement("button"); btn.textContent="Sumar";
      const resul = document.createElement("h2"); resul.style.color="green"; resul.style.fontWeight="bold"; resul.style.display="inline";
      btn.onclick = ()=>{ const n1=+input1.value||0, n2=+input2.value||0; resul.textContent = n1 + " + " + n2 + " = " + (n1+n2); };
      div.appendChild(label1); div.appendChild(document.createTextNode(" ")); div.appendChild(label2); div.appendChild(document.createTextNode(" ")); div.appendChild(btn); div.appendChild(resul);
      return div;
    }
    function crearGraficadorRecta(idDiv) {
      const cont = document.createElement("div");
      cont.className = "simulador-box";
      cont.innerHTML = '<div id="'+idDiv+'" style="width:100%;max-width:800px;height:150px;"></div>\
        <div class="figure-caption"><strong>Figura.</strong> Recta numérica extendida hacia \\\\(-\\\\infty\\\\) y \\\\(+\\\\infty\\\\).</div>';
      setTimeout(() => {
        const minX = -3, maxX = 3;
        const valoresX = Array.from({length: maxX - minX + 1}, (_, i) => i + minX);
        const linea = { x:[minX,maxX], y:[0,0], mode:'lines', line:{color:'black', width:3}, hoverinfo:'skip', showlegend:false };
        const etiquetasEnteros = {
          x: valoresX, y: valoresX.map(() => -0.08), mode: 'text',
          text: valoresX.map(String), textfont: { size:14, color: valoresX.map(v=>v===0?'red':'black'), family:'Arial Black'},
          hoverinfo:'skip', showlegend:false
        };
        const ticksEnteros = valoresX.map(v => ({type:'line', x0:v, y0:-0.025, x1:v, y1:0.025, line:{color:'black', width:2}}));
        const flechas = [
          { type:'line', x0:-2.5, y0:0.05, x1:minX-0.5, y1:0.05, line:{color:'blue', width:2} },
          { type:'line', x0: 2.5, y0:0.05, x1:maxX+0.5, y1:0.05, line:{color:'blue', width:2} },
        ];
        const etiquetasInfinito = { x:[minX-0.5, maxX+0.5], y:[0.05, 0.05], mode:'text',
          text:['−∞','+∞'], textfont:{size:30, color:'red', family:'Arial Black'}, hoverinfo:'skip', showlegend:false };
        const layout = {
          margin:{l:5,r:5,t:5,b:5},
          xaxis:{ range:[minX-1, maxX+1], showgrid:false, zeroline:false, visible:false },
          yaxis:{ range:[-0.12, 0.15], visible:false },
          shapes:[...ticksEnteros, ...flechas]
        };
        Plotly.newPlot(idDiv, [linea, etiquetasEnteros, etiquetasInfinito], layout, {displayModeBar:false});
        if (window.MathJax?.typesetPromise) MathJax.typesetPromise([cont]);
      }, 20);
      return cont;
    }
    function crearGraficadorEnterosToggle(key) {
      const box = document.createElement('div'); box.className = 'simulador-box';
      const btn = document.createElement('button'); btn.textContent='Mostrar graficador';
      const cont = document.createElement('div'); cont.style.display='none';
      cont.innerHTML = '\
        <h3>Graficador de números enteros</h3>\
        <p style="text-align:justify;">Indica un entero \\\\(n\\\\in[-20,20]\\\\) y observa.</p>\
        <label>Ingresa un número: <input type="number" id="num_'+key+'" min="-20" max="20" value="0"></label>\
        <button id="btnGraf_'+key+'">Graficar</button>\
        <div id="contGraf_'+key+'" style="margin-top:10px; position:relative; width:100%;">\
          <canvas id="canvas_'+key+'" height="100" style="width:100%"></canvas>\
          <div id="recta_'+key+'" style="position:relative; height:20px;"></div>\
        </div>';
      btn.onclick = ()=>{ const open = cont.style.display==='block'; cont.style.display = open? 'none':'block'; btn.textContent = open? 'Mostrar graficador':'Ocultar graficador'; if(window.MathJax?.typesetPromise) MathJax.typesetPromise([cont]); };
      setTimeout(()=>{
        const b = cont.querySelector('#btnGraf_'+key);
        if(b) b.onclick = ()=>{
          const val = parseInt(cont.querySelector('#num_'+key).value);
          if(isNaN(val)||val<-20||val>20){ alert('Ingrese entre -20 y 20'); return; }
          dibujarEntero(val, 'contGraf_'+key, 'canvas_'+key, 'recta_'+key);
        };
      },0);
      box.appendChild(btn); box.appendChild(cont);
      return box;
    }
    function ajustarCanvasYRecta(contenedor, canvas, recta, inicio, fin) {
      canvas.width = contenedor.clientWidth;
      let paso = canvas.width / (fin - inicio);
      let altura = Math.max(50, paso);
      canvas.height = altura + 20;
      recta.style.top = altura + 'px';
      recta.style.width = canvas.width + 'px';
      contenedor.style.height = (altura + 40) + 'px';
      return { paso, altura };
    }
    function dibujaRecta(inicio, fin, recta, anchoRecta){
      recta.innerHTML = '';
      for(let i=inicio;i<=fin;i++){
        let pos=((i-inicio)/(fin-inicio))*anchoRecta;
        let marca=document.createElement('div'); marca.style.position='absolute';
        marca.style.left=pos+'px'; marca.style.top='0px';
        marca.style.width='1px'; marca.style.height='10px'; marca.style.background='#000';
        recta.appendChild(marca);
        let numero=document.createElement('div'); numero.style.position='absolute';
        numero.style.left=pos+'px'; numero.style.top='10px';
        numero.style.transform='translateX(-50%)'; numero.style.fontSize='12px';
        numero.textContent=i; recta.appendChild(numero);
      }
    }
    function dibujarArco(ctx, xInicio, pasos, color, paso, altura, tipo) {
      let dir = tipo === 'derecha' ? 1 : -1;
      let x = xInicio;
      for (let i=0;i<pasos;i++){
        ctx.beginPath();
        ctx.strokeStyle = color; ctx.lineWidth=2;
        if (color === 'blue') {
          ctx.arc(x + dir*(paso/2), altura, paso/2, Math.PI, 0, false);
        } else {
          ctx.moveTo(x, altura);
          ctx.quadraticCurveTo(x + dir*(paso/2), altura - altura*0.75, x + dir*paso, altura);
        }
        ctx.stroke(); x += dir*paso;
      }
    }
    function dibujarEntero(num, contId, canvasId, rectaId){
      let inicio = Math.min(0,num) - 1;
      let fin    = Math.max(0,num) + 1;
      let contenedor = document.getElementById(contId);
      let canvas = document.getElementById(canvasId);
      let ctx = canvas.getContext('2d');
      let recta = document.getElementById(rectaId);
      let { paso, altura } = ajustarCanvasYRecta(contenedor,canvas,recta,inicio,fin);
      ctx.clearRect(0,0,canvas.width,canvas.height);
      dibujaRecta(inicio,fin,recta,canvas.width);
      let xCero = (0 - inicio) * paso;
      ctx.beginPath(); ctx.fillStyle='blue'; ctx.arc(xCero, altura, 6, 0, 2*Math.PI); ctx.fill(); ctx.stroke();
      if(num>0){ dibujarArco(ctx,xCero,Math.abs(num),'blue',paso,altura,'derecha'); }
      else if(num<0){ dibujarArco(ctx,xCero,Math.abs(num),'red',paso,altura,'izquierda'); }
      let xFin = (num - inicio) * paso;
      ctx.beginPath(); ctx.moveTo(xFin, altura + 12); ctx.lineTo(xFin - 8, altura - 8); ctx.lineTo(xFin + 8, altura - 8); ctx.closePath();
      ctx.fillStyle = num >= 0 ? 'blue' : 'red'; ctx.fill(); ctx.stroke();
    }

    const preview = document.getElementById('preview');

    function renderPreview(){
      preview.innerHTML = '';
      libro.forEach(n=> preview.appendChild(renderNode(n)) );
      if(window.MathJax?.typesetPromise) MathJax.typesetPromise([preview]);
    }
    function renderNode(node, ctx={}){
      const wrap = document.createElement('section');
      wrap.style.scrollMarginTop = '60px';
      const h = document.createElement(node.tipo==='subseccion' ? 'h4' : node.tipo==='seccion' ? 'h3' : 'h2');
      h.textContent = node.titulo || (node.tipo==='portada'?'Portada':node.tipo);
      wrap.appendChild(h);
      if(node.tipo==='capitulo' || node.tipo==='seccion'){ const hr=document.createElement('hr'); hr.className='separador-seccion'; wrap.appendChild(hr); }
      const body = document.createElement('div');
      const lines = (node.contenido||'').split(/\\n/);
      const simTokenRegex = /^\\[SIM:([a-z0-9\\-]+)(?:\\|([^\\]]+))?\\]$/i;

      lines.forEach(line=>{
        const trimmed = line.trim();
        if(trimmed === '[SIM:suma]'){
          const simDef = findSimById('suma'); const el = simDef.render({uid: node.id});
          const card = simDef.useUnifiedCard ? crearTarjetaSimulador(simDef.title, el, {initiallyOpen:false, instructionsHTML: simDef.instructionsHTML}) : el;
          body.appendChild(card); return;
        } else if(trimmed === '[SIM:recta]'){
          const simDef = findSimById('recta'); const el = simDef.render({uid: node.id});
          const card = simDef.useUnifiedCard ? crearTarjetaSimulador(simDef.title, el, {initiallyOpen:false, instructionsHTML: simDef.instructionsHTML}) : el;
          body.appendChild(card); return;
        } else if(trimmed === '[SIM:enteros]'){
          const simDef = findSimById('enteros'); const el = simDef.render({uid: node.id});
          const card = simDef.useUnifiedCard ? crearTarjetaSimulador(simDef.title, el, {initiallyOpen:false}) : el;
          body.appendChild(card); return;
        }
        const m = trimmed.match(simTokenRegex);
        if(m){
          const id = m[1].toLowerCase();
          const simDef = findSimById(id);
          if(simDef){
            const el = simDef.render({uid: node.id});
            const card = simDef.useUnifiedCard ? crearTarjetaSimulador(simDef.title, el, {initiallyOpen:false, instructionsHTML: simDef.instructionsHTML}) : el;
            body.appendChild(card);
          } else {
            const warn = document.createElement('div'); warn.className = 'simulador-box'; warn.innerHTML = '<b>Simulador no encontrado:</b> <code>'+id+'</code>';
            body.appendChild(warn);
          }
          return;
        }
        if(trimmed.startsWith('<img')){
          const w = document.createElement('div'); w.innerHTML = trimmed; body.appendChild(w.firstChild); return;
        }
        if(trimmed){
          const p = document.createElement('p'); p.style.textAlign='justify'; p.style.margin='0'; p.textContent = line; body.appendChild(p);
        } else {
          body.appendChild(document.createElement('br'));
        }
      });

      if(node.tipo==='portada' && !node.contenido.trim()){
        const d = document.createElement('div'); d.className='definicion-estilo';
        d.innerHTML='<p>Escribe el <b>título</b>, <i>autor</i> y <u>fecha</u> en el contenido para personalizar la portada.</p>';
        body.appendChild(d);
      }
      wrap.appendChild(body);
      if(node.hijos?.length){ node.hijos.forEach(hijo=> wrap.appendChild(renderNode(hijo, ctx)) ); }
      return wrap;
    }
    window.addEventListener('load', renderPreview);
  <\/script>
</body>
</html>`;

  const blob = new Blob([html], {type:'text/html;charset=utf-8'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = archivo;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(a.href);
});
