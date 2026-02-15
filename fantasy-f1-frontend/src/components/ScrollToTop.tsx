import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Disable browser scroll restoration so we control scroll on navigation (helps on mobile)
if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual';
}

function scrollToTop() {
  // Clear focus so mobile browser doesn't scroll to the tapped link/button
  if (document.activeElement && document.activeElement !== document.body) {
    (document.activeElement as HTMLElement).blur();
  }
  const opts: ScrollToOptions = { top: 0, left: 0, behavior: 'auto' };
  window.scrollTo(opts);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
  const root = document.getElementById('root');
  if (root) {
    root.scrollTop = 0;
    root.scrollTo?.(opts);
  }
}

const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    scrollToTop();
    const raf1 = requestAnimationFrame(() => {
      scrollToTop();
      requestAnimationFrame(scrollToTop);
    });
    const t100 = setTimeout(scrollToTop, 100);
    const t300 = setTimeout(scrollToTop, 300);
    const t600 = setTimeout(scrollToTop, 600);
    return () => {
      cancelAnimationFrame(raf1);
      clearTimeout(t100);
      clearTimeout(t300);
      clearTimeout(t600);
    };
  }, [pathname]);

  return null;
};

export default ScrollToTop;














