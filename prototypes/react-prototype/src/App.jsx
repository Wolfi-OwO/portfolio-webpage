import { useEffect } from 'react';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Appearance, Footer, Header, Lightbox, Toasts } from './components/Shell.jsx';
import { Career, Contact, Home, Projects, Services } from './pages/main.jsx';
import { Personal } from './pages/personal.jsx';
import { Admin, Imprint, Login, NotFound, Privacy, Secret } from './pages/other.jsx';
import { IncidentsPage, StatusPage } from './pages/status.jsx';

const STATIC = new URLSearchParams(location.search).has('static'); // screenshots: show everything at once

export default function App() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => { window.scrollTo(0, 0); document.title = `Woofi-Developments · ${pathname === '/' ? 'Fullstack Web Development' : pathname.slice(1)}`; }, [pathname]);

  // plain <a href="/x"> links navigate client-side (no reload, so unsaved prototype edits survive)
  useEffect(() => {
    const onClick = (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target.closest('a[href]'); if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
      const href = a.getAttribute('href'); if (!href.startsWith('/') || href.startsWith('//')) return;
      e.preventDefault(); navigate(href);
    };
    document.addEventListener('click', onClick); return () => document.removeEventListener('click', onClick);
  }, [navigate]);

  // fade-up on scroll. Observes every not-yet-revealed element, also on the second effect run React does in dev.
  useEffect(() => {
    if (STATIC) { document.querySelectorAll('.page > section, .page-h, .page .card, .crow, .cta-band, .tech, .tl li, .statusbar').forEach((el) => el.classList.add('in')); return undefined; }
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.12 });
    document.querySelectorAll('.page > section, .page-h, .page .card, .crow, .cta-band, .tech, .tl li, .statusbar').forEach((el, i) => {
      if (!el.hasAttribute('data-r')) { el.setAttribute('data-r', ''); el.style.setProperty('--rd', (i % 4) * 70 + 'ms'); }
      if (!el.classList.contains('in')) io.observe(el);
    });
    return () => io.disconnect();
  }, [pathname]);

  useEffect(() => {
    const upd = () => { const bar = document.querySelector('.progress'); if (!bar) return; bar.style.transform = `scaleX(${scrollY / Math.max(1, document.body.scrollHeight - innerHeight)})`; };
    addEventListener('scroll', upd, { passive: true }); upd(); return () => removeEventListener('scroll', upd);
  }, []);

  if (pathname.startsWith('/status')) {
    return <><div className="ground" /><Routes><Route path="/status" element={<StatusPage />} /><Route path="/status/incidents" element={<IncidentsPage />} /></Routes><Toasts /></>;
  }

  return (
    <>
      <div className="progress" /><div className="ground" />
      <Header path={pathname} />
      <main className="page" key={pathname}>
        <Routes>
          <Route path="/" element={<Home />} /><Route path="/projects" element={<Projects />} /><Route path="/career" element={<Career />} />
          <Route path="/services" element={<Services />} /><Route path="/personal" element={<Personal />} /><Route path="/contact" element={<Contact />} />
          <Route path="/privacy" element={<Privacy />} /><Route path="/impressum" element={<Imprint />} />
          <Route path="/admin/login" element={<Login />} /><Route path="/admin" element={<Admin />} /><Route path="/secret" element={<Secret />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer /><Appearance /><Lightbox /><Toasts />
    </>
  );
}
