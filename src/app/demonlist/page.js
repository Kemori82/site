'use client';

import React, { useState, useEffect } from 'react';

const demonData = [
  { rank: 1, title: 'Bloodbath', attempts: 154941, difficulty: 8.6, enjoyment: 5, video: 'https://www.youtube.com/embed/aHepqRsI3QE?start=1' },
  { rank: 2, title: 'Nine Circles', attempts: 2454, difficulty: 3, enjoyment: 6, video: 'https://www.youtube.com/embed/oMs2dBdYz_s' },
  { rank: 3, title: 'Reanimation', attempts: 1933, difficulty: 2.8, enjoyment: 7, video: 'https://www.youtube.com/embed/LYt78UV_wY4' },
  { rank: 4, title: 'Invisible Clubstep', attempts: 146, difficulty: 2.2, enjoyment: 2, video: '' },
  { rank: 5, title: 'Problematic', attempts: 445, difficulty: 2.1, enjoyment: 0, video: 'https://www.youtube.com/embed/qsFg1W0bANo' },
  { rank: 6, title: 'Clubstep', attempts: 1842, difficulty: 2.1, enjoyment: 3, video: 'https://www.youtube.com/embed/RGhgz3ga_3Y' },
  { rank: 7, title: 'Death Moon', attempts: 346, difficulty: 1.6, enjoyment: 8, video: 'https://www.youtube.com/embed/J29z196QILs' },
  { rank: 8, title: 'Xstep v2', attempts: 682, difficulty: 1.6, enjoyment: 4, video: '' },
  { rank: 9, title: 'Shiver', attempts: 198, difficulty: 1.4, enjoyment: 5, video: '' },
  { rank: 10, title: 'Deadlocked', attempts: 654, difficulty: 1.3, enjoyment: 6, video: 'https://www.youtube.com/embed/TIvlU4Xz5zA' },
  { rank: 11, title: 'Theory of Everything 2', attempts: 823, difficulty: 1.2, enjoyment: 1, video: '' },
  { rank: 12, title: 'NothinG', attempts: 24, difficulty: 1.1, enjoyment: 5, video: '' },
  { rank: 13, title: 'Crescendo', attempts: 290, difficulty: 1, enjoyment: 5, video: '' },
  { rank: 14, title: 'Platinum Adventure', attempts: 791, difficulty: 1, enjoyment: 4, video: '' },
  { rank: 15, title: 'Ultra Paracosm', attempts: 54, difficulty: 0.8, enjoyment: 9, video: '' },
];

const DemonlistUI = () => {
  const [selected, setSelected] = useState(null);

  // Add this useEffect to remove body margin and match theme
  useEffect(() => {
    document.body.style.margin = '0';
    document.body.style.overflowX = 'hidden'; // Prevent horizontal scrolling
    document.body.style.backgroundColor = '#0c0c0c';
    return () => {
      document.body.style.margin = '';
      document.body.style.overflowX = '';
      document.body.style.backgroundColor = '';
    };
  }, []);

  const closePanel = () => setSelected(null);

  return (
    <div style={styles.container}>
      {/* Left List */}
      <div style={{ ...styles.listWrapper, flex: selected ? '0 0 48%' : '1 1 100%' }}>
        <div style={styles.header}>Kemori Demonlist</div>
        <div style={styles.levelList}>
          {demonData.map((demon) => (
            <div
              key={demon.rank}
              style={styles.levelItem}
              className="demonlist-level-item"
              onClick={() => setSelected(demon)}
            >
              <span
                className="demonlist-level-text"
                style={{
                  ...styles.levelText,
                  borderBottom: selected?.rank === demon.rank ? '2px solid #cc0000' : 'none',
                  color: selected?.rank === demon.rank ? '#cc0000' : '#ddd',
                }}
              >
                #{demon.rank} {demon.title}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel */}
      {selected && (
        <div style={styles.statsPanel}>
          <button style={styles.closeBtn} onClick={closePanel}>×</button>
          <h2 style={styles.title}>{selected.title}</h2>

          {selected.video ? (
            <div style={styles.videoWrapper}>
              <iframe
                src={selected.video}
                title={selected.title}
                style={styles.video}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          ) : (
            <div style={styles.noVideo}>No video available</div>
          )}

          <div style={styles.ratingsRow}>
            <div style={styles.ratingBox}>
              <strong>Attempts:</strong>&nbsp;{selected.attempts?.toLocaleString() ?? 'Unknown'}
            </div>
            <div style={styles.ratingBox}>
              <strong>Difficulty:</strong>&nbsp;{selected.difficulty ?? '-'} / 10
            </div>
            <div style={styles.ratingBox}>
              <strong>Enjoyment:</strong>&nbsp;{selected.enjoyment ?? '-'} / 10
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    width: '100vw',
    height: '100vh',
    backgroundColor: '#0c0c0c',
    fontFamily: 'Segoe UI, sans-serif',
    color: '#fff',
    overflow: 'hidden',
    position: 'fixed', // prevent scrolling
    top: 0,
    left: 0,
  },
  listWrapper: {
    display: 'flex',
    flexDirection: 'column',
    padding: '32px', // was 20px, make sidebar pop out more
    backgroundColor: '#18181c', // slightly lighter for more pop
    transition: 'flex 0.3s ease',
    height: '100vh',
    overflow: 'hidden',
    boxShadow: '4px 0 24px 0 #000a', // subtle shadow for pop
    zIndex: 2,
  },
  header: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#cc0000',
    paddingBottom: '10px',
    borderBottom: '1px solid #222',
    marginBottom: '10px',
  },
  levelList: {
    flex: 1,
    overflowY: 'auto',
    maxHeight: 'calc(100vh - 58px)', // 58px = header + padding
  },
  levelItem: {
    padding: '10px 0',
    marginBottom: '5px',
    cursor: 'pointer',
    // Add hover effect using inline style
    transition: 'background 0.15s, color 0.15s',
  },
  levelText: {
    fontSize: '14px',
    fontWeight: 'bold',
    paddingBottom: '3px',
    display: 'inline-block',
    transition: 'color 0.2s ease, border 0.2s ease',
  },
  statsPanel: {
    flex: '0 0 45%',
    height: '100vh',
    backgroundColor: '#1a1a1a',
    borderLeft: '2px solid #cc0000',
    padding: '28px 28px 20px 28px', // more padding for pop
    display: 'flex',
    flexDirection: 'column',
    fontSize: '14px',
    overflow: 'hidden',
    zIndex: 3,
  },
  closeBtn: {
    alignSelf: 'flex-end',
    fontSize: '24px',
    background: 'none',
    border: 'none',
    color: '#cc0000',
    cursor: 'pointer',
    marginBottom: '10px',
  },
  title: {
    color: '#cc0000',
    marginBottom: '10px',
  },
  videoWrapper: {
    width: '100%',
    aspectRatio: '16/9',
    marginBottom: '10px',
  },
  video: {
    width: '100%',
    height: '100%',
    border: 'none',
    borderRadius: '6px',
  },
  noVideo: {
    padding: '20px',
    backgroundColor: '#2a2a2a',
    color: '#bbb',
    borderRadius: '6px',
    textAlign: 'center',
  },
  ratingsRow: {
    display: 'flex',
    flexDirection: 'row',
    gap: '18px',
    margin: '10px 0 0 0',
    alignItems: 'center',
  },
  ratingBox: {
    background: '#222',
    color: '#fff',
    borderRadius: '6px',
    padding: '6px 14px',
    fontWeight: 'bold',
    fontSize: '13px',
    border: '1px solid #333',
    display: 'flex',
    alignItems: 'center',
    minWidth: '90px',
    justifyContent: 'center',
  },
};

if (typeof window !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    .demonlist-level-item:hover .demonlist-level-text {
      color: #cc0000 !important;
      border-bottom: 2px solid #cc0000 !important;
      background: none !important;
    }
  `;
  document.head.appendChild(style);
}

export default DemonlistUI;
