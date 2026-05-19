import { useEffect } from 'react';

const ZERO_RECT = {
  height: 0,
  width: 0,
  x: 0,
  y: 0,
};

function readOverlayRect(overlay) {
  if (!overlay?.getTitlebarAreaRect) return ZERO_RECT;
  try {
    return overlay.getTitlebarAreaRect();
  } catch {
    return ZERO_RECT;
  }
}

function writeOverlayState(visible, rect = ZERO_RECT) {
  const root = document.documentElement;
  root.dataset.wcoVisible = visible ? 'true' : 'false';
  root.style.setProperty('--wco-titlebar-height', `${visible ? rect.height : 0}px`);
  root.style.setProperty('--wco-titlebar-width', `${visible ? rect.width : 0}px`);
  root.style.setProperty('--wco-titlebar-x', `${visible ? rect.x : 0}px`);
  root.style.setProperty('--wco-titlebar-y', `${visible ? rect.y : 0}px`);
}

export function useWindowControlsOverlay() {
  useEffect(() => {
    const overlay = navigator.windowControlsOverlay;
    if (!overlay) {
      document.documentElement.dataset.wcoSupported = 'false';
      writeOverlayState(false);
      return undefined;
    }

    document.documentElement.dataset.wcoSupported = 'true';

    const syncOverlayState = () => {
      const visible = Boolean(overlay.visible);
      writeOverlayState(visible, readOverlayRect(overlay));
    };

    syncOverlayState();
    overlay.addEventListener('geometrychange', syncOverlayState);

    return () => {
      overlay.removeEventListener('geometrychange', syncOverlayState);
      writeOverlayState(false);
    };
  }, []);
}
