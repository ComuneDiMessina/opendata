import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Component that scrolls to show only the header slim on route change
 */
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll to show only the slim header, hiding center and navbar
    const headerCenter = document.querySelector('.it-header-center-wrapper');
    if (headerCenter) {
      // Scroll to the center header so only slim is visible
      const headerCenterTop = headerCenter.offsetTop;
      window.scrollTo({ top: headerCenterTop, behavior: 'instant' });
    } else {
      // Fallback
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  return null;
}

export default ScrollToTop;
