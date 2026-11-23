/* ============================================================
   Weight Wave — волна насыщенности шрифта по буквам заголовка
   вслед за курсором. Единый эффект для всех крупных заголовков
   сайта (как имя «Андрей Лыков» на главной).

   Пружина --spring-settle (K 280, C 22): посадка на целевой вес
   с одним небольшим перелётом; интегратор как в main.js / case.js.
   Работает только с точным курсором и без reduce-motion —
   на тач/клавиатуре и при reduce-motion заголовки остаются
   обычным текстом (сохраняется перенос и переводы i18n).
   ============================================================ */
(() => {
  'use strict';

  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!finePointer || reducedMotion) return;

  const SELECTOR =
    '.hero__title, .section-title, .contact__title, .case-hero__title, .cs-title, .e404__title';

  const REST = 600, PEAK = 900, RADIUS = 130, K = 280, C = 22;

  /* Сплит текста на буквы «на месте». Внутренние элементы (например
     .c-grad с градиентом) сохраняются целиком и в волне не участвуют.
     Делим по обычному пробелу — неразрывные пробелы ( ) остаются
     внутри слова, поэтому `слово&nbsp;слово` не ломается по переносу. */
  function splitChars(el) {
    const label = el.textContent.replace(/\s+/g, ' ').trim();
    const nodes = [...el.childNodes];
    const frag = document.createDocumentFragment();
    const chars = [];
    let ci = 0;

    const addWord = (word) => {
      const w = document.createElement('span');
      w.className = 'word';
      [...word].forEach((ch) => {
        const s = document.createElement('span');
        s.className = 'char';
        s.textContent = ch;
        s.style.setProperty('--ci', ci++);
        w.appendChild(s);
        chars.push(s);
      });
      frag.appendChild(w);
    };

    nodes.forEach((node) => {
      if (node.nodeType === 3) {
        node.nodeValue.split(' ').forEach((word, wi) => {
          if (wi) frag.appendChild(document.createTextNode(' '));
          if (word) addWord(word);
        });
      } else {
        frag.appendChild(node); // .c-grad и прочие вложенные элементы — как есть
      }
    });

    el.textContent = '';
    el.appendChild(frag);
    el.setAttribute('aria-label', label);
    return chars;
  }

  function attach(el, chars) {
    if (!chars.length) return;

    const springs = chars.map(() => ({ x: REST, v: 0, t: REST }));
    let px = null, raf = null, last = 0;

    const retarget = () => {
      for (let i = 0; i < chars.length; i++) {
        if (px == null) { springs[i].t = REST; continue; }
        const r = chars[i].getBoundingClientRect();
        const d = Math.abs(r.left + r.width / 2 - px);
        const infl = d < RADIUS ? 0.5 * (1 + Math.cos(Math.PI * d / RADIUS)) : 0;
        springs[i].t = REST + (PEAK - REST) * infl;
      }
    };

    const frame = (now) => {
      const dt = Math.min((now - last) / 1000, 1 / 30); last = now;
      const h = dt / 4;
      let moving = false;
      for (let s = 0; s < 4; s++) {
        for (let i = 0; i < springs.length; i++) {
          const sp = springs[i];
          sp.v += (-K * (sp.x - sp.t) - C * sp.v) * h;
          sp.x += sp.v * h;
        }
      }
      for (let i = 0; i < chars.length; i++) {
        chars[i].style.fontVariationSettings = "'wght' " + springs[i].x.toFixed(1);
        if (Math.abs(springs[i].x - springs[i].t) > 0.4 || Math.abs(springs[i].v) > 0.4) moving = true;
      }
      raf = (moving || px != null) ? requestAnimationFrame(frame) : null;
    };

    const run = () => { if (raf == null) { last = performance.now(); raf = requestAnimationFrame(frame); } };

    el.addEventListener('pointermove', (e) => { px = e.clientX; retarget(); run(); });
    el.addEventListener('pointerleave', () => { px = null; retarget(); run(); });
  }

  document.querySelectorAll(SELECTOR).forEach((el) => {
    // hero / case-hero / contact уже разбиты на .char их сплиттерами — переиспользуем
    let chars = [...el.querySelectorAll('.char')];
    if (!chars.length) chars = splitChars(el);
    attach(el, chars);
  });
})();
