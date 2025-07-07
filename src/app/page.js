'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import SpaceWindow from '../components/SpaceWindow';
import Image from 'next/image';

export default function Home() {
  const canvasRef = useRef(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const pathname = usePathname();

  // Toggle hamburger menu
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Remove body margin on mount, restore on unmount
  useEffect(() => {
    document.body.style.margin = "0";
    return () => {
      document.body.style.margin = "";
    };
  }, []);

  // Moon drag state
  const [moonPos, setMoonPos] = useState({ x: null, y: null });
  const [dragging, setDragging] = useState(false);
  const moonRef = useRef(null);

  // Set initial moon position after mount
  useEffect(() => {
    if (moonPos.x === null && moonPos.y === null) {
      // Default to top: 10vh, right: 10vw
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      setMoonPos({
        x: vw - vw * 0.10 - 40, // 40 = moon radius
        y: vh * 0.10
      });
    }
  }, [moonPos.x, moonPos.y]);

  // Drag handlers
  function onMoonMouseDown(e) {
    e.preventDefault();
    setDragging(true);
  }
  function onMoonTouchStart(e) {
    setDragging(true);
  }
  useEffect(() => {
    if (!dragging) return;

    function onMove(e) {
      let clientX, clientY;
      if (e.touches) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      setMoonPos({ x: clientX - 40, y: clientY - 40 }); // center moon under pointer
    }
    function onUp() {
      setDragging(false);
    }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [dragging]);

  // Helper to check if moon is in bottom right
  function isMoonInBottomRight() {
    if (moonPos.x === null || moonPos.y === null) return false;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    // Moon size: 80x80, so check if center is in bottom right 25% of screen
    const moonCenterX = moonPos.x + 40;
    const moonCenterY = moonPos.y + 40;
    return (
      moonCenterX > vw * 0.75 &&
      moonCenterY > vh * 0.75
    );
  }

  // Starfield background effect (stars warp and move away from cursor)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const stars = [];

    // Track mouse position (center by default)
    let mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

    // Mouse move handler
    function onPointerMove(e) {
      if (e.touches && e.touches.length > 0) {
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
      } else {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
      }
    }
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('touchmove', onPointerMove);

    // Set canvas size to match viewport
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      // Update star positions to match new canvas size
      stars.forEach(star => {
        star.x = Math.random() * canvas.width;
        star.y = Math.random() * canvas.height;
      });
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Create 300 stars
    for (let i = 0; i < 300; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 1.5 + 1, // 1-2.5px
        opacity: Math.random() * 0.5 + 0.5, // 0.5-1
        deltaOpacity: (Math.random() * 0.02 + 0.02) * (Math.random() > 0.5 ? 1 : -1), // Fade speed
        delay: Math.random() * 2000, // 0-2s delay
        baseX: 0, // will be set after resize
        baseY: 0,
      });
    }
    // Store base positions for warp
    stars.forEach(star => {
      star.baseX = star.x;
      star.baseY = star.y;
    });

    const animate = (time) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Warp: move stars away from cursor, stronger the closer they are
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const mx = mouse.x;
      const my = mouse.y;

      stars.forEach((star) => {
        if (time - star.delay < 0) return;

        star.opacity += star.deltaOpacity;
        if (star.opacity <= 0.3 || star.opacity >= 1) {
          star.deltaOpacity = -star.deltaOpacity;
        }

        // Vector from cursor to star's base position
        let dx = star.baseX - mx;
        let dy = star.baseY - my;
        let dist = Math.sqrt(dx * dx + dy * dy);

        // Warp effect: push stars away from cursor, stronger when closer
        // The effect fades with distance, and is capped
        let warpStrength = 120; // max warp distance
        let minDist = 60; // within this distance, warp is strongest
        let maxDist = Math.max(canvas.width, canvas.height) * 0.7;
        let t = Math.max(0, 1 - dist / maxDist); // 1 near, 0 far
        let push = t * warpStrength / (1 + dist / minDist);

        // Apply warp
        let px = star.baseX + (dx / (dist || 1)) * push;
        let py = star.baseY + (dy / (dist || 1)) * push;

        ctx.beginPath();
        ctx.arc(px, py, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
        ctx.fill();
      });

      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('touchmove', onPointerMove);
    };
  }, []);

  // Only load WinBox on the client
  const [WinBox, setWinBox] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('winbox/src/js/winbox').then(mod => setWinBox(() => mod.default || mod));
      import('winbox/dist/css/winbox.min.css');
    }
  }, []);

  // Only define openWindow if WinBox is loaded and window is defined
  const openWindow = () => {
    if (typeof window === 'undefined' || !WinBox) return;
    new WinBox({
      title: '💥 MISSION START',
      width: 400,
      height: 300,
      x: 'center',
      y: 'center',
      html: `<div style="font-family:'Bebas Neue','Arial Black',sans-serif;font-size:1.15rem;line-height:1.5;">
        <p>Phantom Thieves are on the move.<br>
        <span style="color:#ff003c;font-weight:bold;">Steal their hearts!</span></p>
      </div>`,
      class: ["persona5-winbox"], // for custom styling if needed
      background: "#ff003c",
    });
  };

  return (
    <div
      style={{
        ...styles.page,
        background: "#000",
        color: "#f9c0d9",
      }}
    >
      {/* Navigation Bar */}
      <nav style={styles.navbar}>
        {/* Remove the circular animated menu button */}
        <div style={{ flex: 1 }} />
      </nav>
      {/* Sidebar menu */}
      {isMenuOpen && (
        <div style={styles.sidebarOverlay} onClick={toggleMenu}>
          <div
            style={styles.sidebar}
            onClick={e => e.stopPropagation()}
          >
            <Link
              href="/stats"
              style={{
                ...styles.sidebarLink,
                ...(pathname === "/stats" ? styles.sidebarLinkActive : {}),
                animationDelay: '0.1s',
              }}
              className="sidebar-link-animate"
              prefetch={false}
              scroll={true}
              onClick={e => {
                setIsMenuOpen(false);
              }}
            >
              Stats Viewer
            </Link>
            <Link
              href="/linktree"
              style={{
                ...styles.sidebarLink,
                ...(pathname === "/linktree" ? styles.sidebarLinkActive : {}),
                animationDelay: '0.1s',
              }}
              className="sidebar-link-animate"
              prefetch={false}
              scroll={true}
              onClick={e => {
                setIsMenuOpen(false);
              }}
            >
              Website Index
            </Link>
            <Link
              href="/demonlist"
              style={{
                ...styles.sidebarLink,
                ...(pathname === "/linktree" ? styles.sidebarLinkActive : {}),
                animationDelay: '0.1s',
              }}
              className="sidebar-link-animate"
              prefetch={false}
              scroll={true}
              onClick={e => {
                setIsMenuOpen(false);
              }}
            >
              Kemori Demonlist
            </Link>
            {/* Add more sidebar links here if needed */}
          </div>
        </div>
      )}
      <canvas ref={canvasRef} style={styles.canvas} />
      {/* Replace moon with star.png image */}
      <div
        ref={moonRef}
        style={{
          ...styles.moon,
          left: moonPos.x !== null ? moonPos.x : undefined,
          top: moonPos.y !== null ? moonPos.y : undefined,
          right: undefined,
          cursor: dragging ? 'grabbing' : 'grab',
          position: 'absolute',
          background: 'none',
          boxShadow: 'none',
          width: 100,
          height: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1,
        }}
        onMouseDown={onMoonMouseDown}
        onTouchStart={onMoonTouchStart}
        onClick={() => {
          if (isMoonInBottomRight()) toggleMenu();
        }}
        tabIndex={0}
        role="button"
        aria-label="Open menu"
        onKeyDown={e => {
          if ((e.key === 'Enter' || e.key === ' ') && isMoonInBottomRight()) toggleMenu();
        }}
      >
        <Image
          src="/laconic.png"
          alt="Draggable laconic"
          width={100}
          height={100}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            userSelect: 'none',
            pointerEvents: 'none',
            display: 'block',
          }}
          draggable={false}
        />
      </div>
      {/* Remove the Night Sky title and description */}
      {/* <h1 style={styles.title}>Welcome to the Night Sky</h1>
      <p style={styles.description}>
        Explore a universe of possibilities. Dive into our chess statistics tool or discover more features coming soon.
      </p> */}
      {/* Remove the Open Window button */}
      {/* <button
        onClick={openWindow}
        style={{
          ...styles.button,
          marginTop: '1rem',
        }}
        disabled={!WinBox}
      >
        Open Window
      </button> */}
      {/* <Link href="/stats" style={styles.button}>
        Explore Chess Stats
      </Link> */}
      {/* <iMacWindow /> is not PascalCase, change to <IMacWindow /> */}
 
      {unlocked && (
        <div
          style={{
            color: 'white',
            fontFamily: 'Bebas Neue, sans-serif',
            padding: '40px',
            textAlign: 'center',
            fontSize: '2rem',
            zIndex: 101,
            position: 'relative'
          }}
        >
          🎉 Welcome to the hidden section!
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    width: '100vw',
    background: '#000', // pitch black background (already matches)
    color: '#f9c0d9',   // match stats page text color
    fontFamily: "'Inter', Arial, Helvetica, sans-serif",
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    position: 'relative',
    overflow: 'hidden',
    boxSizing: 'border-box',
    transition: 'background 0.4s, color 0.4s',
  },
  navbar: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    padding: '1rem 2rem',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    background: 'transparent', // transparent navbar
    zIndex: 3,
    boxSizing: 'border-box',
    justifyContent: 'space-between',
  },
  menuButton: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    fontSize: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.3s ease, background-color 0.3s ease',
    zIndex: 5,
    position: 'relative',
  },
  hamburgerActive: {},
  bar1Active: {
    transform: 'translate(0, 8px) rotate(-45deg)',
    backgroundColor: '#2563eb',
  },
  bar2Active: {
    opacity: 0,
  },
  bar3Active: {
    transform: 'translate(0, -8px) rotate(45deg)',
    backgroundColor: '#2563eb',
  },
  hamburgerLine: {
    width: '100%',
    height: '3px',
    backgroundColor: '#e0e0ff',
    transition: 'all 0.3s ease',
  },
  sidebarOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    background: 'rgba(20,20,40,0.45)',
    zIndex: 20,
    transition: 'background 0.3s',
    display: 'flex',
  },
  sidebar: {
    width: '220px',
    maxWidth: '80vw',
    height: '100vh',
    background: '#181828',
    boxShadow: '2px 0 16px rgba(0,0,0,0.18)',
    borderRight: '1px solid #23234a',
    display: 'flex',
    flexDirection: 'column',
    padding: '2.5rem 1.5rem 1.5rem 1.5rem',
    gap: '1.2rem',
    animation: 'slideInSidebar 0.35s cubic-bezier(.4,0,.2,1)',
    position: 'relative',
  },
  sidebarLink: {
    color: '#e0e0ff',
    textDecoration: 'none',
    fontSize: '1.15rem',
    padding: '0.7rem 0 0.7rem 1.2rem',
    borderLeft: '3px solid transparent',
    borderRadius: '4px',
    transition: 'color 0.2s, border-left 0.2s, background 0.2s, opacity 0.3s',
    opacity: 0,
    animation: 'fadeInSidebarOption 0.45s forwards',
    background: 'none',
    position: 'relative',
    display: 'block',
  },
  sidebarLinkActive: {
    color: '#2563eb',
    borderLeft: '3px solid #2563eb',
    background: 'rgba(37,99,235,0.08)',
  },
  canvas: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 0,
  },
  moon: {
    position: 'absolute',
    top: '10vh',
    right: '10vw',
    width: '80px',
    height: '80px',
    animation: 'float 6s ease-in-out infinite',
    zIndex: 1,
    // background: and boxShadow intentionally omitted
  },
  title: {
    fontSize: '2rem',
    fontWeight: 'bold',
    marginBottom: '2rem',
    textAlign: 'center',
    letterSpacing: '0.05em',
    color: '#e0e0ff',
    textShadow: '0 0 10px rgba(224, 224, 255, 0.5)',
    zIndex: 2,
  },
  description: {
    fontSize: '1.2rem',
    maxWidth: '600px',
    marginBottom: '2rem',
    color: '#e0e0ff',
    opacity: 0.9,
    textAlign: 'center',
    zIndex: 2,
  },
  button: {
    backgroundColor: '#4b0082',
    border: 'none',
    color: '#e0e0ff',
    fontWeight: 600,
    padding: '12px 24px',
    fontSize: '1rem',
    borderRadius: '12px',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'background-color 0.3s, box-shadow 0.3s',
    cursor: 'pointer',
    boxShadow: '0 0 10px rgba(75, 0, 130, 0.5)',
    zIndex: 2,
  },
};

// Inline keyframes for moon animation, sidebar, and responsive styles
const styleSheet = typeof window !== 'undefined' ? document.createElement('style') : null;
if (styleSheet) {
  styleSheet.innerHTML = `
    @keyframes float {
      0% { transform: translate(0, 0); }
      50% { transform: translate(10px, -10px); }
      100% { transform: translate(0, 0); }
    }
    @keyframes slideInSidebar {
      from { transform: translateX(-100%); }
      to { transform: translateX(0); }
    }
    @keyframes fadeInSidebarOption {
      from { opacity: 0; transform: translateY(-12px);}
      to { opacity: 1; transform: translateY(0);}
    }
    .sidebar-link-animate {
      opacity: 0;
      animation: fadeInSidebarOption 0.45s forwards;
    }
    .sidebar-link-animate:hover {
      color: #ef4444 !important;
      border-left: 3px solid #ef4444 !important;
      background: rgba(239,68,68,0.08) !important;
      transition: color 0.2s, border-left 0.2s, background 0.2s;
    }
    @media (max-width: 768px) {
      .hamburger {
        display: flex !important;
      }
      .navLinks {
        display: none !important;
      }
      .navLinksOpen {
        display: flex !important;
      }
    }
  `;
  document.head.appendChild(styleSheet);
}

// Update the keyframes to move both images seamlessly
if (typeof window !== 'undefined') {
  const moveBgStyle = document.createElement('style');
  moveBgStyle.innerHTML = `
    @keyframes moveBackground {
      from {
        background-position: 0 0, 100% 0;
      }
      to {
        background-position: 100% 0, 200% 0;
      }
    }
  `;
  document.head.appendChild(moveBgStyle);
}

// Add global CSS for menu-button animation
if (typeof window !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.innerHTML = `
    .menu-button.open {
      transform: scale(1.3) rotate(45deg);
      background-color: #2980b9 !important;
    }
  `;
  document.head.appendChild(styleSheet);
}
