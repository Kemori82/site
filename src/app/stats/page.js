'use client';

import React, { useState, useEffect } from "react";
import Link from 'next/link';
import Image from 'next/image';
import axios from "axios";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { Line, Pie } from "react-chartjs-2";
import { findOpening, ecoData } from "../../lib/openings";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

export default function Home() {
  const [username, setUsername] = useState("");
  const [games, setGames] = useState([]);
  const [archives, setArchives] = useState([]);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState(null);
  const [ratingData, setRatingData] = useState(null);
  const [winrateMap, setWinrateMap] = useState(null);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [openingsStats, setOpeningsStats] = useState(null);

  useEffect(() => {
    if (error) setError(null);
  }, [username, error]);

  // Set body styles for VSCode theme
  useEffect(() => {
    document.body.style.margin = '0';
    document.body.style.overflowX = 'hidden';
    document.body.style.backgroundColor = '#1e1e1e';
    return () => {
      document.body.style.margin = '';
      document.body.style.overflowX = '';
      document.body.style.backgroundColor = '';
    };
  }, []);

  function setLoadingProgressUp(newValue) {
    setLoadingProgress((prev) => (newValue > prev ? newValue : prev));
  }

  async function fetchAllGames() {
    if (!username) {
      setError("Please enter a username.");
      return;
    }

    setLoadingProgress(5);
    setError(null);
    setGames([]);
    setArchives([]);
    setRatingData(null);
    setWinrateMap(null);
    setProfile(null);
    setStats(null);
    setOpeningsStats(null);

    try {
      const profileRes = await axios.get(
        `https://api.chess.com/pub/player/${username.toLowerCase()}`
      );
      setProfile(profileRes.data);

      const statsRes = await axios.get(
        `https://api.chess.com/pub/player/${username.toLowerCase()}/stats`
      );
      setStats(statsRes.data);

      const archivesRes = await axios.get(
        `https://api.chess.com/pub/player/${username.toLowerCase()}/games/archives`
      );
      const archives = archivesRes.data.archives || [];
      setArchives(archives);
      setLoadingProgressUp(20);

      if (!archives.length) {
        setError("No game archives found for this user.");
        setLoadingProgressUp(100);
        return;
      }

      const gamesResponses = await Promise.all(
        archives.map(async (url, i) => {
          try {
            const res = await axios.get(url);
            setLoadingProgressUp(Math.min(25 + (i / archives.length) * 50, 75));
            return res.data.games || [];
          } catch {
            return [];
          }
        })
      );

      const allGames = gamesResponses.flat();
      setGames(allGames);
      setLoadingProgressUp(85);

      if (!allGames.length) {
        setError("No games found in the archives.");
        setLoadingProgressUp(100);
      } else {
        const ratingMap = extractRatingHistoryByTimeControl(
          allGames,
          username.toLowerCase()
        );
        setRatingData(ratingMap);

        const winrateMap = extractWinrateByTimeControl(allGames, username.toLowerCase());
        setWinrateMap(winrateMap);

        const openingsStats = computeOpeningStats(allGames, username.toLowerCase());
        setOpeningsStats(openingsStats);

        setLoadingProgressUp(100);
      }
    } catch (e) {
      setError("Failed to fetch data. Please check the username and try again.");
      console.error(e);
      setLoadingProgressUp(100);
    }
  }

  function computeOpeningStats(games, username) {
    const stats = {};
    const isValidEco = (eco) => eco && /^[A-E][0-9]{2}$/.test(eco);

    const extractFromUrl = (url) => {
      if (!url || !url.includes("chess.com/openings/")) return { name: null, eco: null };
      const match = url.match(/openings\/([A-Za-z0-9-]+)(?:-\d\..*)?$/);
      if (!match) return { name: null, eco: null };
      const name = match[1]
        .replace(/-/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
      const ecoMatch = match[1].match(/^([A-E][0-9]{2})-/);
      const eco = ecoMatch && isValidEco(ecoMatch[1]) ? ecoMatch[1] : null;
      return { name, eco };
    };

    const ecoFallbackMap = {
      "Anderssen's Opening": "A00",
      "Nimzowitsch-Larsen Attack": "A01",
      "English Opening": "A10",
      "Dutch Defense": "A80",
      "Benoni Defense": "A60",
      "Scandinavian Defense": "B01",
      "Alekhine Defense": "B02",
      "Pirc Defense": "B07",
      "Caro-Kann Defense": "B10",
      "Sicilian Defense": "B20",
      "French Defense": "C00",
      "Italian Game": "C50",
      "Ruy Lopez": "C60",
      "Queen's Gambit Declined": "D30",
      "Slav Defense": "D10",
      "Grünfeld Defense": "D80",
      "Nimzo-Indian Defense": "E20",
      "King's Indian Defense": "E60",
      "Queen's Indian Defense": "E12",
      "Catalan Opening": "E01",
      "Modern Defense Standard Line": "B06",
      "Nimzowitsch Larsen Attack Modern Variation": "A01",
      "Reti Opening Kingside Fianchetto Variation": "A05",
      "Caro Kann Defense Two Knights Attack": "B11",
      "Pirc Defense": "B07",
      "Italian Game": "C50",
    };

    for (const game of games) {
      const isWhite = game.white.username.toLowerCase() === username.toLowerCase();
      const moves = game.moves || "";
      const opening = findOpening(moves);
      const urlInfo = extractFromUrl(game.eco);

      const eco = isValidEco(opening.eco)
        ? opening.eco
        : isValidEco(urlInfo.eco)
        ? urlInfo.eco
        : isValidEco(game.eco)
        ? game.eco
        : ecoFallbackMap[opening.name] || ecoFallbackMap[urlInfo.name] || "N/A";

      const name =
        opening.name !== "Unknown Opening"
          ? opening.name
          : urlInfo.name || "Unknown Opening";

      if (Math.random() < 0.01) {
        console.log(`Game sample: moves=${moves.slice(0, 50)}..., Opening=${name}, ECO=${eco}, game.eco=${game.eco}`);
      }

      if (!stats[name]) {
        stats[name] = {
          white: { wins: 0, draws: 0, losses: 0, total: 0 },
          black: { wins: 0, draws: 0, losses: 0, total: 0 },
          eco,
        };
      }

      const whiteResult = (game.white.result || "").toLowerCase();
      const blackResult = (game.black.result || "").toLowerCase();

      let outcome = "draw";
      if (whiteResult === "win") outcome = "white";
      else if (blackResult === "win") outcome = "black";
      else if (
        whiteResult === "timeout" ||
        whiteResult === "resigned" ||
        whiteResult === "checkmated" ||
        whiteResult === "lose"
      )
        outcome = "black";
      else if (
        blackResult === "timeout" ||
        blackResult === "resigned" ||
        blackResult === "checkmated" ||
        blackResult === "lose"
      )
        outcome = "white";

      if (isWhite) {
        if (outcome === "draw") {
          stats[name].white.draws++;
        } else if (outcome === "white") {
          stats[name].white.wins++;
        } else {
          stats[name].white.losses++;
        }
        stats[name].white.total++;
      } else {
        if (outcome === "draw") {
          stats[name].black.draws++;
        } else if (outcome === "black") {
          stats[name].black.wins++;
        } else {
          stats[name].black.losses++;
        }
        stats[name].black.total++;
      }
    }
    return stats;
  }

  return (
    <div style={styles.vscodeShell}>
      {/* Tab Bar */}
      <div style={styles.tabBar}>
        <Link
          href="/"
          style={{
            ...styles.tab,
            marginRight: '4px',
            textDecoration: 'none',
            color: '#d4d4d4',
            backgroundColor: '#252526',
            borderBottom: '1px solid #3c3c3c',
            borderTopLeftRadius: '4px',
            borderTopRightRadius: '4px',
            border: '1px solid #3c3c3c',
            borderBottom: 'none',
          }}
        >
          Home
        </Link>
        <div style={styles.tabActive}>Stats Viewer</div>
      </div>
      {/* Main Area */}
      <div style={styles.mainArea}>
        {/* Sidebar with Search Bar */}
        <div style={styles.sidebar}>
          <h3 style={styles.sidebarHeading}>🔎 Search</h3>
          <div style={styles.inputContainer}>
            <input
              type="text"
              placeholder="Enter chess.com username"
              value={username}
              onChange={(e) => setUsername(e.target.value.trim())}
              style={styles.input}
              disabled={loadingProgress > 0 && loadingProgress < 100}
            />
            <button
              onClick={fetchAllGames}
              disabled={!username || (loadingProgress > 0 && loadingProgress < 100)}
              style={{
                ...styles.button,
                backgroundColor:
                  loadingProgress > 0 && loadingProgress < 100 ? '#3c3c3c' : '#007acc',
              }}
            >
              Search
            </button>
            {loadingProgress > 0 && loadingProgress < 100 && (
              <div style={styles.progressContainer}>
                <div
                  style={{
                    ...styles.progressBar,
                    width: `${loadingProgress}%`,
                  }}
                />
              </div>
            )}
            {error && <p style={styles.error}>{error}</p>}
          </div>
        </div>
        {/* Editor Area */}
        <div style={styles.editorArea}>
          <div style={styles.editorContent}>
            {/* Profile Section */}
            {profile && (
              <div id="profile-section" style={styles.section}>
                <h2 style={styles.sectionTitle}>Profile</h2>
                <div style={styles.profileBar}>
                  {profile.avatar && (
                    <Image src={profile.avatar} alt="Avatar" style={styles.avatar} width={48} height={48} />
                  )}
                  <div style={styles.profileInfo}>
                    <h3 style={{ margin: 0, color: '#d4d4d4' }}>{profile.username}</h3>
                    <p style={{ margin: '0.2rem 0', color: '#9cdcfe' }}>
                      Status: {profile.status}
                    </p>
                    <p style={{ margin: '0.2rem 0', color: '#9cdcfe' }}>
                      Joined: {new Date(profile.joined * 1000).toLocaleDateString()}
                    </p>
                    <div style={styles.ratingsContainer}>
                      {["chess_rapid", "chess_blitz", "chess_bullet"].map((key) => {
                        const label = key.split("_")[1];
                        const rating = stats?.[key]?.last?.rating;
                        return (
                          <div key={key} style={styles.ratingItem}>
                            <span style={{ textTransform: "capitalize" }}>{label}:</span>{" "}
                            <span>{rating ?? "N/A"}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* Rating Chart */}
            {ratingData && (
              <div id="rating-section" style={styles.section}>
                <h2 style={styles.sectionTitle}>Rating History</h2>
                <RatingChart ratingMap={ratingData} />
              </div>
            )}
            {/* Winrate Pie Charts */}
            {winrateMap && (
              <div id="winrate-section" style={styles.section}>
                <h2 style={styles.sectionTitle}>Win Rates</h2>
                <WinratePieCharts winrateMap={winrateMap} />
              </div>
            )}
            {/* Openings Table */}
            {openingsStats && (
              <div id="openings-section" style={styles.section}>
                <h2 style={styles.sectionTitle}>Openings</h2>
                <OpeningsTable openingsStats={openingsStats} />
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Status Bar at the very bottom, spanning full width */}
      <div style={styles.statusBar}>
        <span>
          {profile
            ? <>
                <span style={{ color: '#d4d4d4' }}>
                  User: <b>{profile.username}</b>
                </span>
                {typeof games.length === 'number' && games.length > 0 && (
                  <span style={{ color: '#d4d4d4', marginLeft: 16 }}>
                    Games: <b>{games.length}</b>
                  </span>
                )}
                {profile.status && (
                  <span style={{ color: '#d4d4d4', marginLeft: 16 }}>
                    Status: <b>{profile.status}</b>
                  </span>
                )}
                {profile.country && (
                  <span style={{ color: '#d4d4d4', marginLeft: 16 }}>
                    Country: <b>{profile.country.split('/').pop().toUpperCase()}</b>
                  </span>
                )}
              </>
            : "Enter a username to view stats"}
        </span>
      </div>
    </div>
  );
}

function extractRatingHistoryByTimeControl(games, username) {
  const ratingMap = { rapid: [], blitz: [], bullet: [] };

  games.forEach((game) => {
    const timeClass = game.time_class;
    if (!["rapid", "blitz", "bullet"].includes(timeClass)) return;

    const isWhite = game.white.username.toLowerCase() === username.toLowerCase();
    const rating = isWhite ? game.white.rating : game.black.rating;
    const timestamp = game.end_time * 1000;
    if (rating && timestamp) {
      ratingMap[timeClass].push({
        date: new Date(timestamp).toISOString().split("T")[0],
        rating,
      });
    }
  });

  for (const key of Object.keys(ratingMap)) {
    ratingMap[key].sort((a, b) => new Date(a.date) - new Date(b.date));
    const unique = [];
    const seen = new Set();
    for (let i = ratingMap[key].length - 1; i >= 0; i--) {
      if (!seen.has(ratingMap[key][i].date)) {
        unique.unshift(ratingMap[key][i]);
        seen.add(ratingMap[key][i].date);
      }
    }
    ratingMap[key] = unique;
  }

  return ratingMap;
}

function extractWinrateByTimeControl(games, username) {
  const data = {
    rapid: { wins: 0, draws: 0, losses: 0, total: 0 },
    blitz: { wins: 0, draws: 0, losses: 0, total: 0 },
    bullet: { wins: 0, draws: 0, losses: 0, total: 0 },
  };

  games.forEach((game) => {
    const timeClass = game.time_class;
    if (!["rapid", "blitz", "bullet"].includes(timeClass)) return;

    const playerIsWhite = game.white.username.toLowerCase() === username.toLowerCase();
    let result = playerIsWhite ? game.white.result : game.black.result;

    const drawResults = ["draw", "stalemate", "agreed", "repetition", "timevsinsufficient", "insufficient"];

    data[timeClass].total++;

    if (result === "win") {
      data[timeClass].wins++;
    } else if (drawResults.includes(result)) {
      data[timeClass].draws++;
    } else {
      data[timeClass].losses++;
    }
  });

  const resultPercent = {};
  for (const tc of Object.keys(data)) {
    const d = data[tc];
    if (d.total === 0) {
      resultPercent[tc] = { wins: 0, draws: 0, losses: 0, total: 0 };
    } else {
      resultPercent[tc] = {
        wins: ((d.wins / d.total) * 100).toFixed(2),
        draws: ((d.draws / d.total) * 100).toFixed(2),
        losses: ((d.losses / d.total) * 100).toFixed(2),
        total: d.total,
      };
    }
  }
  return resultPercent;
}

function countOpenings(games) {
  const counts = {};

  for (const game of games) {
    const moves = game.moves;
    const opening = findOpening(moves);

    if (!counts[opening.name]) {
      counts[opening.name] = 1;
    } else {
      counts[opening.name]++;
    }
  }

  return counts;
}

function getAllDates(ratingMap) {
  const dateSet = new Set();
  Object.values(ratingMap).forEach((arr) =>
    arr.forEach((point) => dateSet.add(point.date))
  );
  return Array.from(dateSet).sort((a, b) => new Date(a) - new Date(b));
}

function buildDatasets(ratingMap, labels, valueKey = "rating") {
  function mapValues(arr) {
    const map = {};
    arr.forEach((obj) => {
      map[obj.date] = obj[valueKey];
    });
    return map;
  }

  const rapidMap = mapValues(ratingMap.rapid);
  const blitzMap = mapValues(ratingMap.blitz);
  const bulletMap = mapValues(ratingMap.bullet);

  function fillData(map) {
    return labels.map((date) => (map[date] !== undefined ? map[date] : null));
  }

  const colors = {
    rapid: { border: "#007acc", background: "rgba(0, 122, 204, 0.5)" },
    blitz: { border: "#00cc74", background: "rgba(0, 204, 116, 0.5)" },
    bullet: { border: "#ff5555", background: "rgba(255, 85, 85, 0.5)" },
  };

  return [
    {
      label: "Rapid",
      data: fillData(rapidMap),
      borderColor: colors.rapid.border,
      backgroundColor: colors.rapid.background,
      tension: 0.3,
      spanGaps: true,
    },
    {
      label: "Blitz",
      data: fillData(blitzMap),
      borderColor: colors.blitz.border,
      backgroundColor: colors.blitz.background,
      tension: 0.3,
      spanGaps: true,
    },
    {
      label: "Bullet",
      data: fillData(bulletMap),
      borderColor: colors.bullet.border,
      backgroundColor: colors.bullet.background,
      tension: 0.3,
      spanGaps: true,
    },
  ];
}

function RatingChart({ ratingMap }) {
  if (
    !ratingMap ||
    (!ratingMap.rapid.length &&
      !ratingMap.blitz.length &&
      !ratingMap.bullet.length)
  )
    return <p style={{ textAlign: "center", color: "#999" }}>No rating data available.</p>;

  const labels = getAllDates(ratingMap);
  const datasets = buildDatasets(ratingMap, labels, "rating");

  const chartData = {
    labels,
    datasets,
  };

  const options = {
    responsive: true,
    plugins: {
      title: { display: true, text: "Rating History by Time Control", color: '#d4d4d4' },
      legend: { position: "top", labels: { color: '#d4d4d4' } },
      tooltip: { mode: "index", intersect: false },
      datalabels: false,
      background: "transparent",
      chartArea: { backgroundColor: "transparent" },
    },
    layout: { padding: 0 },
    interaction: {
      mode: "nearest",
      axis: "x",
      intersect: false,
    },
    scales: {
      y: {
        beginAtZero: false,
        title: { display: true, text: "Rating", color: '#d4d4d4' },
        ticks: { color: '#d4d4d4' },
        grid: { color: "#3c3c3c" },
      },
      x: {
        title: { display: true, text: "Date", color: '#d4d4d4' },
        ticks: { color: '#d4d4d4' },
        grid: { color: "#3c3c3c" },
      },
    },
  };

  return (
    <div style={{ background: "transparent", borderRadius: "4px", padding: '1rem' }}>
      <Line data={chartData} options={options} />
    </div>
  );
}

function WinratePieCharts({ winrateMap }) {
  if (!winrateMap)
    return <p style={{ textAlign: "center", color: "#999" }}>No win rate data available.</p>;

  const chartDataByTimeControl = (timeControl) => {
    const wdl = winrateMap[timeControl];
    return {
      labels: ["Wins", "Draws", "Losses"],
      datasets: [
        {
          data: [Number(wdl.wins), Number(wdl.draws), Number(wdl.losses)],
          backgroundColor: ["#00cc74", "#d7ba7d", "#ff5555"],
          borderColor: "#3c3c3c",
          borderWidth: 1,
        },
      ],
    };
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "bottom",
        labels: { color: "#d4d4d4" },
      },
      datalabels: {
        color: "#d4d4d4",
        formatter: (value) => value.toFixed(1) + "%",
      },
      title: {
        display: false,
        color: "#d4d4d4",
        font: { size: 16 },
      },
      background: "transparent",
      chartArea: { backgroundColor: "transparent" },
    },
  };

  return (
    <div style={{ display: "flex", justifyContent: "space-around", gap: "2rem", flexWrap: 'wrap' }}>
      {["rapid", "blitz", "bullet"].map((tc) => {
        const totalGames = winrateMap[tc]?.total || 0;
        return (
          <div key={tc} style={{ width: "200px", textAlign: "center", background: "transparent", borderRadius: "4px" }}>
            <h3 style={{ textTransform: "capitalize", marginBottom: "0.25rem", color: "#d4d4d4" }}>
              {tc} - {totalGames} {totalGames === 1 ? "game" : "games"}
            </h3>
            <Pie data={chartDataByTimeControl(tc)} options={options} />
          </div>
        );
      })}
    </div>
  );
}

function OpeningsTable({ openingsStats }) {
  function getFirstPawnMove(openingName) {
    const ecoEntry = ecoData.find(
      (o) => o.name && o.name.toLowerCase() === openingName.toLowerCase()
    );
    if (ecoEntry && ecoEntry.moves) {
      const firstMove = ecoEntry.moves.trim().split(" ")[0];
      if (/^[a-h][3-4]$/.test(firstMove)) return firstMove;
    }
    if (/king'?s pawn/i.test(openingName) || /italian/i.test(openingName) || /ruy lopez/i.test(openingName) || /sicilian/i.test(openingName) || /french/i.test(openingName) || /caro[- ]?kann/i.test(openingName) || /scandinavian/i.test(openingName) || /petrov/i.test(openingName)) {
      return "e4";
    }
    if (/queen'?s pawn/i.test(openingName) || /queen'?s gambit/i.test(openingName) || /slav/i.test(openingName) || /nimzo/i.test(openingName) || /grunfeld/i.test(openingName) || /catalan/i.test(openingName) || /tarrasch/i.test(openingName)) {
      return "d4";
    }
    if (/english/i.test(openingName)) return "c4";
    if (/bird/i.test(openingName)) return "f4";
    return "other";
  }

  const rowsWhite = [];
  const rowsBlack = [];

  for (const [name, stats] of Object.entries(openingsStats)) {
    if (stats.white && stats.white.total > 0) {
      rowsWhite.push({
        name,
        wins: stats.white.wins,
        draws: stats.white.draws,
        losses: stats.white.losses,
        total: stats.white.total,
        firstMove: getFirstPawnMove(name),
      });
    }
    if (stats.black && stats.black.total > 0) {
      rowsBlack.push({
        name,
        wins: stats.black.wins,
        draws: stats.black.draws,
        losses: stats.black.losses,
        total: stats.black.total,
        firstMove: getFirstPawnMove(name),
      });
    }
  }

  function groupByFirstMove(rows) {
    const groups = {};
    for (const row of rows) {
      const key = row.firstMove || "other";
      if (!groups[key]) groups[key] = [];
      groups[key].push(row);
    }
    for (const key in groups) {
      groups[key].sort((a, b) => b.total - a.total);
    }
    return groups;
  }

  const groupedWhite = groupByFirstMove(rowsWhite);
  const groupedBlack = groupByFirstMove(rowsBlack);

  function OpeningsDropdown({ groups, colorLabel }) {
    const groupKeys = Object.keys(groups);
    const defaultKey = groupKeys.includes("e4") ? "e4" : groupKeys[0] || "";
    const [selected, setSelected] = useState(defaultKey);
    const [showCount, setShowCount] = useState(10);

    useEffect(() => {
      setShowCount(10);
    }, [selected]);

    if (!selected || !groups[selected] || groups[selected].length === 0) {
      return <p style={{ color: "#d4d4d4" }}>No data for {colorLabel}.</p>;
    }

    const rows = groups[selected];
    const displayRows = rows.slice(0, showCount);

    return (
      <div style={{ marginBottom: "2rem", background: "transparent", borderRadius: "4px", padding: "1rem" }}>
        <label style={{ color: "#d4d4d4", fontWeight: "bold", marginRight: 8 }}>
          Opening:
        </label>
        <select
          value={selected}
          onChange={e => {
            setSelected(e.target.value);
          }}
          style={{
            marginBottom: "1rem",
            padding: "0.3rem",
            borderRadius: 4,
            background: "#3c3c3c",
            color: "#d4d4d4",
            fontWeight: 600,
            border: "1px solid #3c3c3c",
            outline: "none",
          }}
        >
          {groupKeys.map(key => (
            <option key={key} value={key} style={{ background: "#3c3c3c", color: "#d4d4d4" }}>
              {key === "e4"
                ? "King's Pawn (e4)"
                : key === "d4"
                ? "Queen's Pawn (d4)"
                : key === "c4"
                ? "English (c4)"
                : key === "f4"
                ? "Bird's (f4)"
                : "Other"}
            </option>
          ))}
        </select>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            color: "#d4d4d4",
            backgroundColor: "transparent",
            marginBottom: "2rem",
            borderRadius: "4px",
            overflow: "hidden",
            border: "1px solid #3c3c3c",
          }}
        >
          <thead>
            <tr>
              <th style={{ borderBottom: "1px solid #3c3c3c", padding: "0.5rem" }}>Name</th>
              <th style={{ borderBottom: "1px solid #3c3c3c", padding: "0.5rem" }}>Wins</th>
              <th style={{ borderBottom: "1px solid #3c3c3c", padding: "0.5rem" }}>Draws</th>
              <th style={{ borderBottom: "1px solid #3c3c3c", padding: "0.5rem" }}>Losses</th>
              <th style={{ borderBottom: "1px solid #3c3c3c", padding: "0.5rem" }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {displayRows.map(({ name, wins, draws, losses, total }) => (
              <tr key={colorLabel + name}>
                <td style={{ borderBottom: "1px solid #3c3c3c", padding: "0.5rem" }}>
                  {name}
                </td>
                <td style={{ borderBottom: "1px solid #3c3c3c", padding: "0.5rem", color: "#00cc74", fontWeight: "bold", textAlign: "center" }}>
                  {wins}
                </td>
                <td style={{ borderBottom: "1px solid #3c3c3c", padding: "0.5rem", color: "#d7ba7d", fontWeight: "bold", textAlign: "center" }}>
                  {draws}
                </td>
                <td style={{ borderBottom: "1px solid #3c3c3c", padding: "0.5rem", color: "#ff5555", fontWeight: "bold", textAlign: "center" }}>
                  {losses}
                </td>
                <td style={{ borderBottom: "1px solid #3c3c3c", padding: "0.5rem", textAlign: "center" }}>
                  {total}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length > showCount && (
          <button
            onClick={() => setShowCount(c => c + 10)}
            style={styles.button}
          >
            Show More
          </button>
        )}
        {showCount >= rows.length && rows.length > 10 && (
          <button
            onClick={() => setShowCount(10)}
            style={styles.button}
          >
            Show Less
          </button>
        )}
      </div>
    );
  }

  if (
    Object.values(groupedWhite).every(arr => arr.length === 0) &&
    Object.values(groupedBlack).every(arr => arr.length === 0)
  ) {
    return (
      <div style={{ maxWidth: 900, margin: "auto", padding: "1rem", color: "#d4d4d4" }}>
        <h2 style={styles.sectionTitle}>Openings Played Breakdown</h2>
        <p>No opening data found in your games.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: "auto", padding: "1rem", background: "transparent", borderRadius: "4px" }}>
      <h2 style={styles.sectionTitle}>Openings Played Breakdown</h2>
      <div style={{ marginTop: "2rem" }}>
        <h3 style={{ color: "#d4d4d4" }}>As White</h3>
        <OpeningsDropdown groups={groupedWhite} colorLabel="White" />
        <h3 style={{ color: "#d4d4d4" }}>As Black</h3>
        <OpeningsDropdown groups={groupedBlack} colorLabel="Black" />
      </div>
    </div>
  );
}

function extractEcoFromPGN(pgn) {
  const match = pgn && pgn.match(/\[ECO\s+"(.*?)"\]/);
  return match ? match[1] : "?";
}

function extractMovesFromPGN(pgn) {
  const movesSection = pgn.replace(/\[.*\]\n?/g, "").trim();
  return movesSection
    .replace(/\d+\.(\.\.)?/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getOpeningByEco(ecoCode) {
  return ecoData.find(o => o.eco === ecoCode) || {
    eco: "?",
    name: "Unknown Opening",
    moves: "",
  };
}

const styles = {
  vscodeShell: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: '#1e1e1e',
    fontFamily: `'Fira Code', monospace`,
    color: '#d4d4d4',
  },
  tabBar: {
    height: '28px',
    backgroundColor: '#252526',
    display: 'flex',
    alignItems: 'center',
    paddingLeft: '8px',
    borderBottom: '1px solid #3c3c3c',
  },
  tab: {
    backgroundColor: '#252526',
    padding: '4px 10px',
    border: '1px solid #3c3c3c',
    borderBottom: 'none',
    borderTopLeftRadius: '4px',
    borderTopRightRadius: '4px',
    fontSize: '0.85rem',
    color: '#d4d4d4',
  },
  tabActive: {
    backgroundColor: '#1e1e1e',
    padding: '4px 10px',
    border: '1px solid #3c3c3c',
    borderBottom: 'none',
    borderTopLeftRadius: '4px',
    borderTopRightRadius: '4px',
    fontSize: '0.85rem',
    color: '#d4d4d4',
  },
  mainArea: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
    minHeight: 0,
  },
  sidebar: {
    width: '240px',
    backgroundColor: '#252526',
    padding: '1rem',
    borderRight: '1px solid #3c3c3c',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  sidebarHeading: {
    fontSize: '1rem',
    color: '#ccc',
    marginBottom: '0.5rem',
  },
  editorArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: '1.5rem',
    position: 'relative',
    minHeight: 0,
  },
  editorContent: {
    flex: '1 1 auto',
    overflowY: 'auto',
  },
  statusBar: {
    height: '24px',
    background: '#3c3c3c',
    color: '#d4d4d4',
    display: 'flex',
    alignItems: 'center',
    padding: '0 10px',
    fontSize: '12px',
    userSelect: 'none',
    borderTop: '1px solid #252526',
    width: '100%',
    flexShrink: 0,
    position: 'relative',
    zIndex: 2,
  },
  section: {
    marginBottom: '2rem',
    background: '#252526',
    padding: '1rem',
    borderRadius: '4px',
    border: '1px solid #3c3c3c',
  },
  sectionTitle: {
    fontSize: '1.5rem',
    marginBottom: '1rem',
    color: '#d4d4d4',
    fontWeight: 700,
  },
  inputContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    alignItems: 'stretch',
  },
  input: {
    padding: '8px 12px',
    fontSize: '0.9rem',
    border: '1px solid #3c3c3c',
    borderRadius: '4px',
    backgroundColor: '#1e1e1e',
    color: '#d4d4d4',
    outline: 'none',
    fontFamily: `'Fira Code', monospace`,
  },
  button: {
    backgroundColor: '#007acc',
    border: 'none',
    color: '#d4d4d4',
    fontWeight: 600,
    padding: '8px 16px',
    fontSize: '0.9rem',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  progressContainer: {
    width: '100%',
    height: '8px',
    backgroundColor: '#3c3c3c',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#007acc',
    transition: 'width 0.3s ease',
  },
  error: {
    backgroundColor: 'rgba(255, 85, 85, 0.2)',
    color: '#ff5555',
    padding: '12px 16px',
    borderRadius: '4px',
    textAlign: 'center',
    fontWeight: 600,
    fontSize: '0.9rem',
  },
  profileBar: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
    padding: '1rem',
    borderRadius: '4px',
    border: '1px solid #3c3c3c',
    gap: '1rem',
  },
  avatar: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    marginRight: '0.5rem',
    border: '2px solid #007acc',
  },
  profileInfo: {
    display: 'flex',
    flexDirection: 'column',
    color: '#d4d4d4',
  },
  ratingsContainer: {
    marginTop: '0.5rem',
    display: 'flex',
    gap: '0.5rem',
    fontSize: '0.85rem',
    color: '#d4d4d4',
  },
  ratingItem: {
    backgroundColor: '#007acc',
    color: '#d4d4d4',
    padding: '0.2rem 0.6rem',
    borderRadius: '4px',
    fontWeight: 600,
  },
};