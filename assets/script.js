// ===== Navbar: scrolled state + mobile toggle =====
const nav = document.getElementById('nav');
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 12);
}, { passive: true });

if (navToggle) {
  navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
  navLinks.querySelectorAll('a').forEach(a =>
    a.addEventListener('click', () => navLinks.classList.remove('open'))
  );
}

// ===== Reveal on scroll =====
const io = new IntersectionObserver((entries) => {
  entries.forEach((e, i) => {
    if (e.isIntersecting) {
      e.target.style.transitionDelay = `${Math.min(i * 60, 240)}ms`;
      e.target.classList.add('in');
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal').forEach(el => io.observe(el));

// ===== Duplicate marquee content for seamless loop =====
const marquee = document.getElementById('marquee');
if (marquee) marquee.innerHTML += marquee.innerHTML;

// ===== Current year in footer =====
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ===== Language toggle (TR / EN) with persistence =====
const LANG_KEY = 'ko-lang';
function setLang(lang) {
  document.body.setAttribute('data-lang', lang);
  document.documentElement.setAttribute('lang', lang);
  try { localStorage.setItem(LANG_KEY, lang); } catch (e) {}
  document.querySelectorAll('[data-set-lang]').forEach(btn =>
    btn.classList.toggle('active', btn.getAttribute('data-set-lang') === lang)
  );
}
const savedLang = (() => { try { return localStorage.getItem(LANG_KEY); } catch (e) { return null; } })();
setLang(savedLang === 'tr' || savedLang === 'en' ? savedLang : (navigator.language || '').toLowerCase().startsWith('tr') ? 'tr' : 'en');
document.querySelectorAll('[data-set-lang]').forEach(btn =>
  btn.addEventListener('click', () => setLang(btn.getAttribute('data-set-lang')))
);
