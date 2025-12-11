document.addEventListener("DOMContentLoaded", () => {
  /* -------------------------
     navbar navigation
  --------------------------*/
  const pages = document.querySelectorAll(".page");
  const navLinks = document.querySelectorAll(".nav-links a");

  function showPage(id) {
    pages.forEach(p => p.classList.remove("active"));
    const page = document.getElementById(id);
    if (page) page.classList.add("active");

    navLinks.forEach(a => {
      a.classList.toggle("active", a.dataset.target === id);
    });
  }

  navLinks.forEach(a => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const target = a.dataset.target;
      showPage(target);
      window.location.hash = target === "cards" ? "#cards" : "#quiz";
    });
  });

  window.addEventListener("load", () => {
    const hash = window.location.hash.replace("#", "");
    if (hash === "quiz") showPage("quiz");
    else showPage("cards");
  });


  /* -------------------------
   cards-> posts from cards.json
  --------------------------*/
  let posts = [];

  const postsGrid = document.getElementById("postsGrid");
  const postOverlay = document.getElementById("postOverlay");
  const overlayTitle = document.getElementById("overlayTitle");
  const overlayBody = document.getElementById("overlayBody");
  const overlayTags = document.getElementById("overlayTags");
  const overlayCounter = document.getElementById("overlayCounter");
  const closeOverlayBtn = document.getElementById("closeOverlayBtn");
  const prevPostBtn = document.getElementById("prevPostBtn");
  const nextPostBtn = document.getElementById("nextPostBtn");

  let currentPostIndex = 0;

  fetch("data/cards.json")
    .then(res => res.json())
    .then(data => {
      posts = data;
      renderPosts();
    })
    .catch(err => {
      console.error("Erro ao carregar Cards", err);
      postsGrid.innerHTML = "<p>Erro ao carregar Cards. Verifique a fonte de dados</p>";
    });

  function renderPosts() {
    postsGrid.innerHTML = "";
    if (!posts || posts.length === 0) {
      postsGrid.innerHTML = "<p>Nenhum card disponível.</p>";
      return;
    }

    posts.forEach((post, index) => {
      const card = document.createElement("article");
      card.className = "post-card";
      card.dataset.index = index;

      const title = document.createElement("h3");
      title.className = "post-title";
      title.textContent = post.title;

      const excerpt = document.createElement("p");
      excerpt.className = "post-excerpt";
      excerpt.textContent = post.excerpt;

      const tagsContainer = document.createElement("div");
      tagsContainer.className = "post-tags";
      (post.tags || []).forEach(tag => {
        const badge = document.createElement("span");
        badge.className = "tag-badge";
        badge.textContent = tag.label;
        badge.style.backgroundColor = tag.color || "#6b7280";
        tagsContainer.appendChild(badge);
      });

      card.appendChild(title);
      card.appendChild(excerpt);
      card.appendChild(tagsContainer);

      card.addEventListener("click", () => openPost(index));
      postsGrid.appendChild(card);
    });
  }

  function openPost(index) {
    currentPostIndex = index;
    const post = posts[index];

    overlayTitle.textContent = post.title;
    overlayTags.innerHTML = "";
    overlayBody.innerHTML = "";

    (post.tags || []).forEach(tag => {
      const badge = document.createElement("span");
      badge.className = "tag-badge";
      badge.textContent = tag.label;
      badge.style.backgroundColor = tag.color || "#6b7280";
      overlayTags.appendChild(badge);
    });

    (post.content || []).forEach(block => {
      if (block.type === "text") {
        const div = document.createElement("div");
        div.innerHTML = block.html;
        overlayBody.appendChild(div);
      } else if (block.type === "video") {
        const vid = document.createElement("video");
        vid.src = block.src;
        vid.controls = true;
        vid.style.maxWidth = "200px";
        vid.style.display = "block";
        vid.style.margin = "12px auto";
        overlayBody.appendChild(vid);
      } else if (block.type === "audio") {
        const audio = document.createElement("audio");
        audio.src = block.src;
        audio.controls = true;
        audio.style.width = "100%";
        audio.style.margin = "12px 0";
        const source = document.createElement("source");
        source.src = block.src;
        source.type = "audio/mpeg"; 
        audio.appendChild(source);
        const fallbackText = document.createTextNode("Não foi possível carregar este aúdio.")
        overlayBody.appendChild(audio);
      } else if (block.type === "image") {
        const img = document.createElement("img");
        img.src = block.src;
        img.alt = block.alt || "";
        img.style.maxWidth = "100%";
        img.style.margin = "12px 0";
        overlayBody.appendChild(img);
      }
    });

    overlayCounter.textContent = `Post ${index + 1} de ${posts.length}`;
    postOverlay.classList.add("visible");
  }

  function closePost() {
    postOverlay.classList.remove("visible");
  }

  function showNextPost() {
    if (!posts.length) return;
    const nextIndex = (currentPostIndex + 1) % posts.length;
    openPost(nextIndex);
  }

  function showPrevPost() {
    if (!posts.length) return;
    const prevIndex = (currentPostIndex - 1 + posts.length) % posts.length;
    openPost(prevIndex);
  }

  closeOverlayBtn.addEventListener("click", closePost);
  postOverlay.addEventListener("click", (e) => {
    if (e.target === postOverlay) closePost();
  });
  nextPostBtn.addEventListener("click", showNextPost);
  prevPostBtn.addEventListener("click", showPrevPost);

  /* -------------------------
     quiz from quiz.json
  --------------------------*/
  let allQuestions = [];
  let questions = [];
  let current = 0;
  let score = 0;
  let stats = {}; // { category: { hits, miss, color } }

  const quizContainer = document.getElementById("quizContainer");
  const quizStatus = document.getElementById("quizStatus");
  const startBtn = document.getElementById("startBtn");
  const nextBtn = document.getElementById("nextBtn");
  const restartBtn = document.getElementById("restartBtn");

  fetch("data/quiz.json")
    .then(res => res.json())
    .then(data => {
      allQuestions = data;
      quizStatus.textContent = "Clique em 'Iniciar Quiz' para começar.";
      startBtn.style.display = "inline-block";
    })
    .catch(err => {
      console.error(err);
      quizStatus.textContent = "Erro ao carregar quiz";
    });

  function getRandomQuestions(pool, n) {
    const arr = [...pool];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.slice(0, Math.min(n, arr.length));
  }

  function startQuiz() {
    if (!allQuestions || allQuestions.length === 0) {
      quizStatus.textContent = "Nenhuma questão disponível";
      return;
    }

    questions = getRandomQuestions(allQuestions, 10);
    current = 0;
    score = 0;
    stats = {};

    questions.forEach(q => {
      if (!stats[q.category]) {
        stats[q.category] = {
          hits: 0,
          miss: 0,
          color: q.categoryColor
        };
      }
    });

    startBtn.style.display = "none";
    restartBtn.style.display = "none";
    nextBtn.style.display = "none";
    quizStatus.textContent = "";
    renderQuestion();
  }

  function renderQuestion() {
    const q = questions[current];
    quizContainer.innerHTML = "";

    const metaDiv = document.createElement("div");
    metaDiv.className = "meta";

    const progressSpan = document.createElement("span");
    progressSpan.textContent = `Questão ${current + 1} de ${questions.length}`;

    const categorySpan = document.createElement("span");
    categorySpan.className = "category-badge";
    categorySpan.textContent = q.category;
    categorySpan.style.backgroundColor = q.categoryColor || "#374151";

    metaDiv.appendChild(progressSpan);
    metaDiv.appendChild(categorySpan);
    quizContainer.appendChild(metaDiv);

    const p = document.createElement("div");
    p.className = "question";
    p.textContent = q.text;
    quizContainer.appendChild(p);

    if (q.mediaType === "image" && q.mediaSrc) {
      const img = document.createElement("img");
      img.src = q.mediaSrc;
      img.alt = "Imagem da questão";
      img.className = "quiz-media";
      quizContainer.appendChild(img);
    } else if (q.mediaType === "video" && q.mediaSrc) {
      const vid = document.createElement("video");
      vid.src = q.mediaSrc;
      vid.controls = true;
      vid.className = "quiz-media";
      quizContainer.appendChild(vid);
    }

    const optionsDiv = document.createElement("div");
    optionsDiv.className = "options";

    q.options.forEach((opt, index) => {
      const btn = document.createElement("button");
      btn.textContent = opt;
      btn.onclick = () => handleAnswer(index);
      optionsDiv.appendChild(btn);
    });

    quizContainer.appendChild(optionsDiv);
    nextBtn.style.display = "none";
  }

  function handleAnswer(index) {
    const q = questions[current];
    const acerto = index === q.correctIndex;

    if (acerto) score++;
    if (acerto) stats[q.category].hits++;
    else stats[q.category].miss++;

    document
      .querySelectorAll("#quizContainer .options button")
      .forEach((b, i) => {
        b.disabled = true;
        if (i === q.correctIndex) {
          b.style.border = "2px solid #22c55e";
          b.style.boxShadow = "0 5px 18px rgba(7, 212, 34, 0.8)";
        }
        if (i === index && i !== q.correctIndex) {
          b.style.border = "2px solid #ef4444";
          b.style.boxShadow = "0 5px 18px rgba(239, 68, 68, 0.8)";
        }
      });

    nextBtn.style.display = "inline-block";
  }

  nextBtn.onclick = () => {
    current++;
    if (current < questions.length) {
      renderQuestion();
    } else {
      finishQuiz();
    }
  };
  function launchConfetti() {
  const duration = 4000;
  const end = Date.now() + duration;

  (function frame() {
    confetti({
      particleCount: 5,
      angle: 60,
      spread: 70,
      origin: { x: 0 }
    });
    confetti({
      particleCount: 5,
      angle: 120,
      spread: 70,
      origin: { x: 1 }
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  })();
  }
  
  function finishQuiz() {

    if (score > 7) {
      launchConfetti();
      quizContainer.innerHTML = `
      <h3>Resultado Final</h3>
      <p>Parabéns, você acertou <strong>${score}</strong> de <strong>${questions.length}</strong> questões.</p>
    `;
    }else {
      quizContainer.innerHTML = `
      <h3>Resultado Final</h3>
      <p>Você acertou apenas <strong>${score}</strong> de <strong>${questions.length}</strong> questões. Estude mais e melhore na próxima, aqui estão alguns tópicos e seu desempenho.</p>
    `;
    }
    const ranking = Object.entries(stats)
      .map(([category, data]) => ({
        category,
        hits: data.hits,
        miss: data.miss,
        color: data.color
      }))
      .sort((a, b) => b.hits - a.hits);

    const extra = document.createElement("div");
    extra.innerHTML = `<h4>Desempenho por tópico</h4>`;

    ranking.forEach(item => {
      const div = document.createElement("div");
      div.style.margin = "6px 0";
      div.innerHTML = `
        <span class="category-badge" style="background:${item.color}">
          ${item.category}
        </span>
        &nbsp;→ Acertos: <strong>${item.hits}</strong>,
        Erros: <strong>${item.miss}</strong>
      `;
      extra.appendChild(div);
    });

    quizContainer.appendChild(extra);

    nextBtn.style.display = "none";
    restartBtn.style.display = "inline-block";
  }

  restartBtn.onclick = startQuiz;
  startBtn.onclick = startQuiz;
});
