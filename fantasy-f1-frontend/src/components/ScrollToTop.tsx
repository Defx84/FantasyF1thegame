import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Disable browser scroll restoration so we control scroll on navigation (helps on mobile)
if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual';
}

function scrollToTop() {
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll immediately when route changes
    scrollToTop();
    // Run again after paint so we win over mobile layout / late content (e.g. "My League", "My Deck")
    const raf = requestAnimationFrame(() => {
      scrollToTop();
    });
    const t = setTimeout(() => scrollToTop(), 100);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, [pathname]);

  return null;
};

export default ScrollToTop;














