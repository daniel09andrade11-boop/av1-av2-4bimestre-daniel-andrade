const DIAS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

const catalogo = [
  { nome: "Supino reto", grupo: "Peito", desc: "Empurrar a barra deitado no banco." },
  { nome: "Crucifixo", grupo: "Peito", desc: "Abrir e fechar os braços com halteres." },
  { nome: "Puxada frontal", grupo: "Costas", desc: "Puxar a barra até a altura do peito." },
  { nome: "Remada curvada", grupo: "Costas", desc: "Puxar a barra em direção ao abdômen." },
  { nome: "Agachamento livre", grupo: "Pernas", desc: "Descer o quadril mantendo a coluna reta." },
  { nome: "Leg press", grupo: "Pernas", desc: "Empurrar a plataforma com as duas pernas." },
  { nome: "Desenvolvimento", grupo: "Ombros", desc: "Elevar halteres acima da cabeça." },
  { nome: "Elevação lateral", grupo: "Ombros", desc: "Levantar os halteres até a altura dos ombros." },
  { nome: "Rosca direta", grupo: "Braços", desc: "Flexionar os cotovelos com a barra." },
  { nome: "Tríceps corda", grupo: "Braços", desc: "Estender os cotovelos puxando a corda." },
  { nome: "Prancha", grupo: "Abdômen", desc: "Manter o corpo alinhado apoiado nos antebraços." },
  { nome: "Abdominal infra", grupo: "Abdômen", desc: "Elevar as pernas deitado no colchonete." }
];

let treinos = [];          
let proximoId = 1;
let grupoAtual = "Todos";
let diaAtual = DIAS[(new Date().getDay() + 6) % 7]; 

const $ = (id) => document.getElementById(id);
const form = $("formTreino");
const campos = ["dia", "exercicio", "series", "repeticoes", "carga"];

function salvar() {
  try { localStorage.setItem("serie+", JSON.stringify({ treinos, proximoId })); } catch (e) {}
}
function carregar() {
  try {
    const dados = JSON.parse(localStorage.getItem("serie+"));
    if (dados) { treinos = dados.treinos; proximoId = dados.proximoId; }
  } catch (e) {}
}

function mostrarFeedback(texto, tipo = "ok") {
  const toast = $("toastMsg");
  toast.className = "toast align-items-center border-0 " + tipo;
  $("toastTexto").textContent = texto;
  bootstrap.Toast.getOrCreateInstance(toast, { delay: 2800 }).show();
}

function renderFiltros() {
  const grupos = ["Todos", ...new Set(catalogo.map((e) => e.grupo))];
  $("filtrosGrupo").innerHTML = grupos
    .map((g) => `<button type="button" class="filtro ${g === grupoAtual ? "ativo" : ""}" data-grupo="${g}">${g}</button>`)
    .join("");
}

function renderCatalogo() {
  const lista = catalogo.filter((e) => grupoAtual === "Todos" || e.grupo === grupoAtual);
  $("listaCatalogo").innerHTML = lista
    .map((e) => `
      <div class="col-12 col-sm-6 col-lg-3">
        <div class="card card-ex shadow-sm">
          <div class="card-body d-flex flex-column">
            <span class="grupo">${e.grupo}</span>
            <h3 class="h5">${e.nome}</h3>
            <p class="small text-secondary flex-grow-1">${e.desc}</p>
            <button class="btn btn-sm btn-outline-dark" data-usar="${e.nome}">Adicionar</button>
          </div>
        </div>
      </div>`)
    .join("");
  $("sugestoes").innerHTML = catalogo.map((e) => `<option value="${e.nome}">`).join("");
}

function validarCampo(id) {
  const campo = $(id);
  const valor = campo.value.trim();
  let valido = true;
  if (id === "dia") valido = valor !== "";
  else if (id === "exercicio") valido = valor.length >= 3;
  else {
    const n = Number(valor);
    const min = Number(campo.min), max = Number(campo.max);
    valido = valor !== "" && Number.isFinite(n) && n >= min && n <= max;
  }
  campo.classList.toggle("is-invalid", !valido);
  campo.classList.toggle("is-valid", valido);
  return valido;
}

function validarFormulario() {
  return campos.map(validarCampo).every(Boolean);
}

function adicionarTreino(event) {
  event.preventDefault();
  if (!validarFormulario()) {
    mostrarFeedback("Corrija os campos destacados.", "erro");
    return;
  }
  const nome = $("exercicio").value.trim();
  const novo = {
    id: proximoId++,
    dia: $("dia").value,
    exercicio: nome,
    series: Number($("series").value),
    repeticoes: Number($("repeticoes").value),
    carga: Number($("carga").value) || 0,
    feito: false
  };
  const repetido = treinos.some((t) => t.dia === novo.dia && t.exercicio.toLowerCase() === nome.toLowerCase());
  if (repetido) {
    mostrarFeedback(`${nome} já está na rotina de ${novo.dia}.`, "erro");
    proximoId--;
    return;
  }
  treinos.push(novo);
  diaAtual = novo.dia;
  const diaEscolhido = novo.dia;
  form.reset();
  campos.forEach((c) => $(c).classList.remove("is-valid", "is-invalid"));
  $("dia").value = diaEscolhido;
  atualizarTudo();
  mostrarFeedback(`${nome} adicionado a ${diaEscolhido}.`);
}

function alternarConcluido(id) {
  const t = treinos.find((x) => x.id === id);
  if (!t) return;
  t.feito = !t.feito;
  atualizarTudo();
  mostrarFeedback(t.feito ? `${t.exercicio} concluído!` : `${t.exercicio} voltou para pendente.`);
}

function removerTreino(id) {
  const t = treinos.find((x) => x.id === id);
  treinos = treinos.filter((x) => x.id !== id);
  atualizarTudo();
  if (t) mostrarFeedback(`${t.exercicio} removido.`);
}

function limparConcluidos() {
  const total = treinos.filter((t) => t.feito).length;
  if (total === 0) return mostrarFeedback("Nenhum exercício concluído para remover.", "erro");
  treinos = treinos.filter((t) => !t.feito);
  atualizarTudo();
  mostrarFeedback(`${total} exercício(s) concluído(s) removido(s).`);
}

function usarDoCatalogo(nome) {
  $("exercicio").value = nome;
  $("dia").value = diaAtual;
  validarCampo("exercicio");
  $("rotina").scrollIntoView();
  $("series").focus();
}

function renderAbas() {
  $("abasDia").innerHTML = DIAS.map((d) => {
    const qtd = treinos.filter((t) => t.dia === d).length;
    return `<li class="nav-item">
      <button class="nav-link ${d === diaAtual ? "active" : ""}" data-dia="${d}">
        ${d.slice(0, 3)} ${qtd ? `<span class="badge rounded-pill">${qtd}</span>` : ""}
      </button></li>`;
  }).join("");
}

function renderTreinos() {
  const doDia = treinos.filter((t) => t.dia === diaAtual);
  if (doDia.length === 0) {
    $("listaTreinos").innerHTML = `<div class="vazio">Nenhum exercício em ${diaAtual}. Preencha o formulário ou escolha um no catálogo.</div>`;
    return;
  }
  $("listaTreinos").innerHTML = doDia.map((t) => `
    <div class="item-treino ${t.feito ? "feito" : ""}">
      <input class="form-check-input mt-0" type="checkbox" ${t.feito ? "checked" : ""} data-concluir="${t.id}" aria-label="Concluir ${t.exercicio}">
      <div class="info">
        <div class="nome">${t.exercicio}</div>
        <small class="text-secondary">${t.series} × ${t.repeticoes} ${t.carga ? "· " + t.carga + " kg" : "· peso corporal"}</small>
      </div>
      <button class="btn btn-sm btn-outline-danger" data-remover="${t.id}">Remover</button>
    </div>`).join("");
}

function renderResumo() {
  const total = treinos.length;
  const feitos = treinos.filter((t) => t.feito).length;
  const diasAtivos = new Set(treinos.map((t) => t.dia)).size;
  const volume = treinos.filter((t) => t.feito).reduce((s, t) => s + t.series * t.repeticoes * t.carga, 0);
  const cards = [
    [total, "exercícios na semana"],
    [feitos, "concluídos"],
    [diasAtivos, "dias com treino"],
    [volume.toLocaleString("pt-BR"), "kg levantados (séries × reps × carga)"]
  ];
  $("cardsResumo").innerHTML = cards
    .map(([n, r]) => `<div class="col-6 col-lg-3"><div class="card-resumo"><p class="grande">${n}</p><p class="mb-0">${r}</p></div></div>`)
    .join("");
}

function renderHoje() {
  const hoje = DIAS[(new Date().getDay() + 6) % 7];
  const lista = treinos.filter((t) => t.dia === hoje);
  const feitos = lista.filter((t) => t.feito).length;
  const pct = lista.length ? Math.round((feitos / lista.length) * 100) : 0;
  $("hojeNome").textContent = `Hoje · ${hoje}`;
  $("hojeProgresso").textContent = `${feitos} de ${lista.length}`;
  $("barraHoje").style.width = pct + "%";
}

function atualizarTudo() {
  renderAbas();
  renderTreinos();
  renderResumo();
  renderHoje();
  salvar();
}

form.addEventListener("submit", adicionarTreino);
campos.forEach((c) => $(c).addEventListener("blur", () => validarCampo(c)));
$("btnLimpar").addEventListener("click", limparConcluidos);

$("filtrosGrupo").addEventListener("click", (e) => {
  const b = e.target.closest("[data-grupo]");
  if (!b) return;
  grupoAtual = b.dataset.grupo;
  renderFiltros();
  renderCatalogo();
});
$("listaCatalogo").addEventListener("click", (e) => {
  const b = e.target.closest("[data-usar]");
  if (b) usarDoCatalogo(b.dataset.usar);
});
$("abasDia").addEventListener("click", (e) => {
  const b = e.target.closest("[data-dia]");
  if (!b) return;
  diaAtual = b.dataset.dia;
  renderAbas();
  renderTreinos();
});
$("listaTreinos").addEventListener("click", (e) => {
  const r = e.target.closest("[data-remover]");
  if (r) removerTreino(Number(r.dataset.remover));
});
$("listaTreinos").addEventListener("change", (e) => {
  if (e.target.dataset.concluir) alternarConcluido(Number(e.target.dataset.concluir));
});

carregar();
renderFiltros();
renderCatalogo();
atualizarTudo();