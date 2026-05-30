
const alunos = [];

const situacoesMap = new Map([
  ["APROVADO", "Aprovado"],
  ["RECUPERACAO", "Em recuperação"],
  ["REPROVADO", "Reprovado"]
]);

let indiceAlunoSelecionado = null;
let desafioAtual = null;
let tentativasRestantes = 3;

// ===============================
// elementos DOM
// ===============================

const form = document.getElementById("form-estudante");
const alertaErro = document.getElementById("alerta-erro");

const tabelaBody = document.querySelector("#tabela-alunos tbody");
const cardsAlunosContainer = document.getElementById("cards-alunos");

const buscaNomeInput = document.getElementById("busca-nome");
const filtroStatusSelect = document.getElementById("filtro-status");

const nomeSelecionadoSpan = document.getElementById("nome-selecionado");
const mediaSelecionadaSpan = document.getElementById("media-selecionada");
const perguntaDesafioDiv = document.getElementById("pergunta-desafio");
const respostaDesafioInput = document.getElementById("resposta-desafio");
const feedbackDesafioDiv = document.getElementById("feedback-desafio");
const btnVerificarDesafio = document.getElementById("btn-verificar-desafio");
const btnNovoDesafio = document.getElementById("btn-novo-desafio");

const btnToggleDark = document.getElementById("toggle-dark");


// calculo da média ponderada 
function calcularMediaPonderada(n1, n2, n3) {
  const pesos = [3, 3, 4];
  const somaPesos = pesos.reduce((a, b) => a + b, 0);

  const media = (n1 * pesos[0] + n2 * pesos[1] + n3 * pesos[2]) / somaPesos;
  return Number(media.toFixed(2));
}

function calcularFrequencia(presencas, aulasTotais) {
  return Number(((presencas / aulasTotais) * 100).toFixed(1));
}

function determinarSituacao(media, frequencia) {
  return media >= 7 && frequencia >= 75
    ? "APROVADO"
    : media >= 5
    ? "RECUPERACAO"
    : "REPROVADO";
}

function determinarConceito(media) {
  if (media >= 9) return "A";
  if (media >= 7) return "B";
  if (media >= 5) return "C";
  return "D";
}

function validarNumero(valor, min, max, campo) {
  if (Number.isNaN(valor)) {
    throw new Error(`O campo "${campo}" deve ser um número válido.`);
  }
  if (valor < min || valor > max) {
    const limite = max === Infinity ? `maior ou igual a ${min}` : `entre ${min} e ${max}`;
    throw new Error(`O campo "${campo}" deve estar ${limite}.`);
  }
}

function limitarDecimais(input) {
  input.addEventListener("input", () => {
    if (input.value.includes(".")) {
      const [inteiro, decimal] = input.value.split(".");
      input.value = `${inteiro}.${decimal.slice(0, 2)}`;
    }
  });
}

// numero do telefone determinado
function aplicarMascaraTelefone(input) {
  input.addEventListener("input", () => {
    let valor = input.value.replace(/\D/g, "");

    if (valor.length > 11) valor = valor.slice(0, 11);

    if (valor.length > 2 && valor.length <= 7) {
      valor = `${valor.slice(0, 2)} ${valor.slice(2)}`;
    } else if (valor.length > 7) {
      valor = `${valor.slice(0, 2)} ${valor.slice(2, 7)}-${valor.slice(7)}`;
    }

    input.value = valor;
  });
}

// formato numero do telefone 
function validarTelefoneFormato(telefone) {
  const regex = /^\d{2} \d{5}-\d{4}$/;
  if (!regex.test(telefone)) {
    throw new Error('O telefone deve estar no formato "xx xxxxx-xxxx".');
  }
}


limitarDecimais(document.getElementById("nota1"));
limitarDecimais(document.getElementById("nota2"));
limitarDecimais(document.getElementById("nota3"));
aplicarMascaraTelefone(document.getElementById("telefone"));

// ===============================
// cadastro dos alunos 
// ===============================

form.addEventListener("submit", (event) => {
  event.preventDefault();

  alertaErro.classList.add("hidden");
  alertaErro.textContent = "";

  try {
    const nome = document.getElementById("nome").value.trim();
    const nota1 = Number(document.getElementById("nota1").value);
    const nota2 = Number(document.getElementById("nota2").value);
    const nota3 = Number(document.getElementById("nota3").value);
    const presencas = Number(document.getElementById("presencas").value);
    const aulasTotais = Number(document.getElementById("aulasTotais").value);
    const telefone = document.getElementById("telefone").value.trim();
    const email = document.getElementById("email").value.trim() || null;

    if (!nome) {
      throw new Error("O nome do aluno é obrigatório.");
    }

    validarNumero(nota1, 0, 10, "Nota 1");
    validarNumero(nota2, 0, 10, "Nota 2");
    validarNumero(nota3, 0, 10, "Nota 3");
    validarNumero(presencas, 0, Infinity, "Total de presenças");
    validarNumero(aulasTotais, 1, Infinity, "Aulas totais");

    if (presencas > aulasTotais) {
      throw new Error("Presenças não podem ser maiores que as aulas totais.");
    }

    validarTelefoneFormato(telefone);

    const media = calcularMediaPonderada(nota1, nota2, nota3);
    const frequencia = calcularFrequencia(presencas, aulasTotais);
    const situacao = determinarSituacao(media, frequencia);
    const conceito = determinarConceito(media);

    const aluno = {
      nome,
      notas: { nota1, nota2, nota3 },
      presencas,
      aulasTotais,
      media,
      frequencia,
      situacao,
      conceito,
      responsavel: {
        telefone,
        email
      }
    };

    alunos.push(aluno);
    form.reset();
    renderizarLista();

  } catch (erro) {
    alertaErro.textContent = erro.message;
    alertaErro.classList.remove("hidden");
  }
});


function renderizarLista() {
  tabelaBody.innerHTML = "";
  cardsAlunosContainer.innerHTML = "";

  const termoBusca = buscaNomeInput.value.trim().toLowerCase();
  const filtroStatus = filtroStatusSelect.value;

  for (const [indice, aluno] of alunos.entries()) {

    // filtros
    if (termoBusca && !aluno.nome.toLowerCase().includes(termoBusca)) continue;
    if (filtroStatus && aluno.situacao !== filtroStatus) continue;

    // ===============================
    // listar alunos
    // ===============================

    const tr = document.createElement("tr");
    tr.dataset.indice = indice;

    const tdNome = document.createElement("td");
    tdNome.textContent = aluno.nome;

    const tdMedia = document.createElement("td");
    tdMedia.textContent = aluno.media.toFixed(2);

    const tdFreq = document.createElement("td");
    tdFreq.textContent = aluno.frequencia.toFixed(1) + "%";

    const tdSituacao = document.createElement("td");
    const situacaoExtenso = situacoesMap.get(aluno.situacao) ?? "Indefinida";
    tdSituacao.textContent = situacaoExtenso;

    // classes de status
    const statusClass = 
      aluno.situacao === "APROVADO"
        ? "status-aprovado"
        : aluno.situacao === "RECUPERACAO"
        ? "status-recuperacao"
        : "status-reprovado";

    tdSituacao.classList.add(statusClass);

    const tdConceito = document.createElement("td");
    tdConceito.textContent = aluno.conceito;

    const tdTelefone = document.createElement("td");
    tdTelefone.textContent = aluno.responsavel?.telefone ?? "-";

    const tdEmail = document.createElement("td");
    tdEmail.textContent = aluno.responsavel?.email ?? "E-mail não informado";

    tr.append(tdNome, tdMedia, tdFreq, tdSituacao, tdConceito, tdTelefone, tdEmail);

    tr.addEventListener("click", () => selecionarAluno(indice));
    tabelaBody.appendChild(tr);


    const card = document.createElement("div");
    card.className = "card-aluno";
    card.dataset.indice = indice;

    const header = document.createElement("div");
    header.className = "card-aluno-header";

    const nomeSpan = document.createElement("span");
    nomeSpan.className = "card-aluno-nome";
    nomeSpan.textContent = aluno.nome;

    const tagSpan = document.createElement("span");
    tagSpan.className = "card-aluno-tag";
    tagSpan.textContent = situacaoExtenso;

    // cores do card
    const cores = {
      APROVADO: ["#e8f5e9", "#1b5e20"],
      RECUPERACAO: ["#fff8e1", "#f9a825"],
      REPROVADO: ["#ffebee", "#c62828"]
    };

    const [bg, cor] = cores[aluno.situacao] ?? ["#eee", "#333"];
    tagSpan.style.background = bg;
    tagSpan.style.color = cor;

    header.append(nomeSpan, tagSpan);

    const body = document.createElement("div");
    body.className = "card-aluno-body";
    body.innerHTML = `
      <span><strong>Média:</strong> ${aluno.media.toFixed(2)}</span>
      <span><strong>Freq.:</strong> ${aluno.frequencia.toFixed(1)}%</span>
      <span><strong>Conceito:</strong> ${aluno.conceito}</span>
      <span><strong>Tel.:</strong> ${aluno.responsavel?.telefone ?? "-"}</span>
      <span><strong>E-mail:</strong> ${aluno.responsavel?.email ?? "E-mail não informado"}</span>
    `;

    card.append(header, body);

    card.addEventListener("click", () => selecionarAluno(indice));
    cardsAlunosContainer.appendChild(card);
  }
}

buscaNomeInput.addEventListener("input", renderizarLista);
filtroStatusSelect.addEventListener("change", renderizarLista);

// ===============================
// game
// ===============================

function selecionarAluno(indice) {
  indiceAlunoSelecionado = indice;
  tentativasRestantes = 3;

  const aluno = alunos[indice];
  nomeSelecionadoSpan.textContent = aluno.nome;
  mediaSelecionadaSpan.textContent = aluno.media.toFixed(2);

  feedbackDesafioDiv.textContent = "";
  feedbackDesafioDiv.className = "feedback";
  btnNovoDesafio.style.display = "none";

  gerarNovoDesafio();
}

function gerarNovoDesafio() {
  if (indiceAlunoSelecionado === null) {
    perguntaDesafioDiv.textContent = "Selecione um aluno";
    desafioAtual = null;
    return;
  }

  tentativasRestantes = 3;
  feedbackDesafioDiv.textContent = "";
  feedbackDesafioDiv.className = "feedback";
  btnNovoDesafio.style.display = "none";

  const a = Math.floor(Math.random() * 10) + 1;
  const b = Math.floor(Math.random() * 10) + 1;
  const operacoes = ["+", "-", "*"];
  const op = operacoes[Math.floor(Math.random() * operacoes.length)];

  const resultado =
    op === "+" ? a + b :
    op === "-" ? a - b :
    a * b;

  desafioAtual = { a, b, op, resultado };

  perguntaDesafioDiv.textContent = `Quanto é ${a} ${op} ${b}?`;
  respostaDesafioInput.value = "";
}

btnVerificarDesafio.addEventListener("click", () => {
  if (indiceAlunoSelecionado === null) {
    feedbackDesafioDiv.textContent = "Clique em um aluno na lista.";
    feedbackDesafioDiv.className = "feedback erro";
    return;
  }

  if (!desafioAtual) {
    feedbackDesafioDiv.textContent = "Nenhum desafio ativo. Gere um novo desafio.";
    feedbackDesafioDiv.className = "feedback erro";
    return;
  }

  const respostaUsuario = Number(respostaDesafioInput.value);

  if (Number.isNaN(respostaUsuario)) {
    feedbackDesafioDiv.textContent = "Digite um número válido.";
    feedbackDesafioDiv.className = "feedback erro";
    return;
  }

  if (respostaUsuario === desafioAtual.resultado) {
    feedbackDesafioDiv.textContent =
      "Correto! +0.5 ponto de bônus na média do aluno.";
    feedbackDesafioDiv.className = "feedback ok";

    const aluno = alunos[indiceAlunoSelecionado];
    aluno.media = Number((aluno.media + 0.5).toFixed(2));
    aluno.conceito = determinarConceito(aluno.media);
    aluno.situacao = determinarSituacao(aluno.media, aluno.frequencia);

    mediaSelecionadaSpan.textContent = aluno.media.toFixed(2);
    renderizarLista();

    btnNovoDesafio.style.display = "block";
    return;
  }

  tentativasRestantes--;

  if (tentativasRestantes > 0) {
    feedbackDesafioDiv.textContent =
      `Resposta incorreta. Você tem mais ${tentativasRestantes} tentativa(s).`;
    feedbackDesafioDiv.className = "feedback erro";
  } else {
    feedbackDesafioDiv.textContent =
      "Você esgotou suas tentativas. Clique em \"Novo desafio\" para tentar novamente.";
    feedbackDesafioDiv.className = "feedback erro";
    btnNovoDesafio.style.display = "block";
  }
});

btnNovoDesafio.addEventListener("click", gerarNovoDesafio);
renderizarLista();
gerarNovoDesafio();

// ===============================
// modo escuro
// ===============================

btnToggleDark.addEventListener("click", () => {
  document.body.classList.toggle("dark");
});


