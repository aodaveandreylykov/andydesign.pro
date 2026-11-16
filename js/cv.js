/* Скачать CV на языке интерфейса — без модального окна. */
(() => {
  'use strict';

  const FILES = {
    ru: { href: 'assets/cv/cv-ru.pdf', name: 'Andrey_Lykov_CV_RU.pdf' },
    en: { href: 'assets/cv/cv-en.pdf', name: 'Andrey_Lykov_CV_EN.pdf' }
  };

  const lang = (window.AndyI18n && AndyI18n.lang === 'en') ? 'en' : 'ru';
  const file = FILES[lang];

  document.querySelectorAll('.js-cv').forEach((el) => {
    if (el.tagName === 'A') {
      el.href = file.href;
      el.download = file.name;
      return;
    }

    const a = document.createElement('a');
    a.className = el.className;
    a.href = file.href;
    a.download = file.name;
    if (el.hasAttribute('data-magnetic')) a.setAttribute('data-magnetic', '');
    a.innerHTML = el.innerHTML;
    el.replaceWith(a);
  });
})();
