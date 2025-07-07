import React, { useEffect, useRef, useState } from 'react';
import interact from 'interactjs';

const MacWindow = () => {
  const windowRef = useRef(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [isMinimized, setIsMinimized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(true); // Fullscreen by default
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (windowRef.current) {
      windowRef.current.style.transform = `translate(0px, 0px)`;
    }

    interact(windowRef.current).draggable({
      allowFrom: '.titlebar',
      listeners: {
        move(event) {
          if (isFullscreen || isMinimized) return;
          setPos(prev => {
            const x = prev.x + event.dx;
            const y = prev.y + event.dy;
            if (windowRef.current) {
              windowRef.current.style.transform = `translate(${x}px, ${y}px)`;
            }
            return { x, y };
          });
        }
      }
    });
  }, [isFullscreen, isMinimized]);

  const toggleMinimize = () => {
    if (!isMinimized) {
      setLastPos(pos);
      const x = 0;
      const y = window.innerHeight - 32;
      setPos({ x, y });
      windowRef.current.style.transition = 'all 0.3s ease';
      windowRef.current.style.transform = `translate(${x}px, ${y}px)`;
      setIsMinimized(true);
    } else {
      setPos(lastPos);
      windowRef.current.style.transition = 'all 0.3s ease';
      windowRef.current.style.transform = `translate(${lastPos.x}px, ${lastPos.y}px)`;
      setIsMinimized(false);
    }

    setTimeout(() => {
      if (windowRef.current) {
        windowRef.current.style.transition = 'none';
      }
    }, 300);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(prev => {
      const next = !prev;
      if (next) {
        setLastPos(pos);
        setPos({ x: 0, y: 0 });
        windowRef.current.style.transition = 'all 0.3s ease';
        windowRef.current.style.transform = `translate(0px, 0px)`;
      } else {
        setPos(lastPos);
        windowRef.current.style.transition = 'all 0.3s ease';
        windowRef.current.style.transform = `translate(${lastPos.x}px, ${lastPos.y}px)`;
      }

      setTimeout(() => {
        if (windowRef.current) {
          windowRef.current.style.transition = 'none';
        }
      }, 300);

      return next;
    });
  };

  const winStyle = {
    width: isMinimized ? '180px' : isFullscreen ? '100vw' : '460px',
    height: isMinimized ? '32px' : isFullscreen ? '100vh' : '300px',
    background: 'rgba(20, 20, 20, 0.70)', // was 0.85, now more transparent
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: isFullscreen ? '0px' : '10px',
    position: 'fixed',
    top: 0,
    left: 0,
    transform: 'none',
    zIndex: 10000,
    overflow: 'hidden',
    boxShadow: isFullscreen ? 'none' : '0 6px 20px rgba(0,0,0,0.4)',
    fontFamily: 'system-ui, sans-serif',
    color: '#e0e0e0',
    backdropFilter: 'blur(10px)',
    transition: 'width 0.3s ease, height 0.3s ease',
    userSelect: 'none',
  };

  const iconButton = (src, onClick, alt = '') => (
    <button
      onClick={onClick}
      style={{
        background: 'none',
        border: 'none',
        padding: 0,
        marginRight: '8px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '20px',
        height: '20px',
        opacity: 0.9,
      }}
    >
      <img
        src={src}
        alt={alt}
        style={{ width: '16px', height: '16px' }}
        // Make SVG fill transparent if possible
        onLoad={e => {
          try {
            const svgDoc = e.target.contentDocument || e.target;
            if (svgDoc && svgDoc instanceof SVGSVGElement) {
              svgDoc.querySelectorAll('[fill]').forEach(el => {
                el.setAttribute('fill', 'transparent');
              });
            }
          } catch {}
        }}
      />
    </button>
  );

  return (
    <div ref={windowRef} style={winStyle}>
      {/* Title Bar */}
      <div
        className="titlebar"
        style={{
          height: '32px',
          background: 'rgba(40, 40, 40, 0.95)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 10px',
          cursor: 'move',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', userSelect: 'none' }}>
          {iconButton('/close.svg', () => (windowRef.current.style.display = 'none'), 'Close')}
          {iconButton('/bookmark.svg', toggleMinimize, 'Minimize')}
          {iconButton(isFullscreen ? '/resize-in.svg' : '/resize-out.svg', toggleFullscreen, 'Toggle Fullscreen')}
        </div>
        <div style={{ fontSize: '0.9rem', fontWeight: 500, color: '#ccc', userSelect: 'none' }}>
          {/* You can put a window title here if desired */}
        </div>
      </div>

      {/* Window Content */}
      {!isMinimized && (
        <div style={{
          height: 'calc(100% - 32px)',
          padding: '20px',
          background: 'rgba(0, 0, 0, 0.15)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          userSelect: 'none',
        }}>
          {/* Replace this with your custom window content */}
          <p style={{ fontSize: '1rem', color: '#ccc', userSelect: 'none' }}>
            Placeholder
          </p>
        </div>
      )}
    </div>
  );
};

export default MacWindow;
