"use client";

import React, { useState, useEffect, useCallback } from "react";
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
import { findOpening, ecoData } from "../lib/openings";

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
  const [profile, setProfile] = useState(null); // Add profile state
  const [stats, setStats] = useState(null); // <-- add stats state
  const [openingsStats, setOpeningsStats] = useState(null);

  useEffect(() => {
    if (error) setError(null);
  }, [username]);

  // Add this useEffect to remove body margin
  useEffect(() => {
    document.body.style.margin = "0";
    return () => {
      document.body.style.margin = "";
    };
  }, []);

  // Helper to only increase loading progress
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
    setStats(null); // reset stats
    setOpeningsStats(null);

    try {
      // Fetch profile data
      const profileRes = await axios.get(
        `https://api.chess.com/pub/player/${username.toLowerCase()}`
      );
      setProfile(profileRes.data);

      // Fetch stats data (ratings)
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
        setLoadingProgressUp(100); // finish progress
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

  // Compute opening stats from all games
  function computeOpeningStats(games, username) {
    const stats = {};
    // ECO code validation: A00-E99
    const isValidEco = (eco) => eco && /^[A-E][0-9]{2}$/.test(eco);

    // Extract opening name and ECO from chess.com URL
    const extractFromUrl = (url) => {
      if (!url || !url.includes("chess.com/openings/")) return { name: null, eco: null };
      const match = url.match(/openings\/([A-Za-z0-9-]+)(?:-\d\..*)?$/);
      if (!match) return { name: null, eco: null };
      const name = match[1]
        .replace(/-/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
      // Attempt to extract ECO (e.g., "C50-Italian-Game" -> "C50")
      const ecoMatch = match[1].match(/^([A-E][0-9]{2})-/);
      const eco = ecoMatch && isValidEco(ecoMatch[1]) ? ecoMatch[1] : null;
      return { name, eco };
    };

    // Temporary ECO mapping for common openings (expanded for better fallback)
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
      // Existing and additional mappings as needed
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
      const opening = findOpening(moves); // Use findOpening which checks all ecoA-E.json for both name and eco code
      const urlInfo = extractFromUrl(game.eco);

      // Use opening.eco and opening.name from findOpening (which checks all ecoA-E)
      const eco = isValidEco(opening.eco)
        ? opening.eco
        : isValidEco(urlInfo.eco)
        ? urlInfo.eco
        : isValidEco(game.eco)
        ? game.eco
        : ecoFallbackMap[opening.name] || ecoFallbackMap[urlInfo.name] || "N/A";

      // Use opening.name if not "Unknown Opening", else urlInfo.name, else "Unknown Opening"
      const name =
        opening.name !== "Unknown Opening"
          ? opening.name
          : urlInfo.name || "Unknown Opening";

      // Debug: Log moves, opening, and ECO (sample 1% of games)
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
    <div style={styles.page}>
      <h1 style={styles.title}>Stats Viewer</h1>

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
              loadingProgress > 0 && loadingProgress < 100 ? "#ccc" : "#2563eb",
          }}
        >
          Search
        </button>
      </div>

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

      {/* Profile Bar */}
      {profile && (
        <div style={styles.profileBar}>
          {profile.avatar && (
            <img src={profile.avatar} alt="Avatar" style={styles.avatar} />
          )}
          <div style={styles.profileInfo}>
            <h2 style={{ margin: 0 }}>{profile.username}</h2>
            <p style={{ margin: 0 }}>Status: {profile.status}</p>
            <p style={{ margin: 0 }}>
              Joined: {new Date(profile.joined * 1000).toLocaleDateString()}
            </p>

            {/* Ratings from stats */}
            <div style={styles.ratingsContainer}>
              {["chess_rapid", "chess_blitz", "chess_bullet"].map((key) => {
                // map key like chess_rapid -> Rapid for display
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
      )}

      {ratingData && (
        <div style={styles.chartContainer}>
          <RatingChart ratingMap={ratingData} />
        </div>
      )}

      {winrateMap && (
        <div style={{ ...styles.chartContainer, marginTop: "2rem" }}>
          <WinratePieCharts winrateMap={winrateMap} />
        </div>
      )}

      {openingsStats && (
        <div style={{ ...styles.chartContainer, marginTop: "2rem" }}>
          <OpeningsTable openingsStats={openingsStats} />
        </div>
      )}
    </div>
  );
}

// Extract rating history for line chart
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

// Extract winrate including draws for pie charts
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

    // Normalize draws: chess.com can have "draw", "stalemate", "agreed", "repetition" etc.
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

  // Convert counts to percentages
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

// Count most played openings
function countOpenings(games) {
  const counts = {};

  for (const game of games) {
    const moves = game.moves; // this should be a string like "e4 e5 Nf3 Nc6"
    const opening = findOpening(moves);

    if (!counts[opening.name]) {
      counts[opening.name] = 1;
    } else {
      counts[opening.name]++;
    }
  }

  return counts;
}

// Helpers for line chart
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
    rapid: { border: "rgb(37 99 235)", background: "rgba(37, 99, 235, 0.5)" },
    blitz: { border: "rgb(16 185 129)", background: "rgba(16, 185, 129, 0.5)" },
    bullet: { border: "rgb(239 68 68)", background: "rgba(239, 68, 68, 0.5)" },
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

// Rating Line Chart (no data labels)
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
      title: { display: true, text: "Rating History by Time Control" },
      legend: { position: "top" },
      tooltip: { mode: "index", intersect: false },
      datalabels: false, // Disable data labels here
      // Set chart area background color
      background: "#2f2f2f", // match page background
      chartArea: {
        backgroundColor: "#2f2f2f"
      }
    },
    layout: {
      padding: 0,
    },
    interaction: {
      mode: "nearest",
      axis: "x",
      intersect: false,
    },
    scales: {
      y: {
        beginAtZero: false,
        title: { display: true, text: "Rating" },
        ticks: { color: "#f9c0d9" },
        grid: { color: "#444" }
      },
      x: {
        title: { display: true, text: "Date" },
        ticks: { color: "#f9c0d9" },
        grid: { color: "#444" }
      },
    },
  };

  return (
    <div style={{ background: "#2f2f2f", borderRadius: "20px" }}>
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
          backgroundColor: ["#22c55e", "#facc15", "#ef4444"], // green, yellow, red
          borderColor: "#000",
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
        labels: { color: "#fff" },
      },
      datalabels: {
        color: "#fff",
        formatter: (value) => value.toFixed(1) + "%",
      },
      title: {
        display: false,
        color: "#fff",
        font: { size: 16 },
      },
      // Set chart area background color for Pie
      background: "#2f2f2f",
      chartArea: {
        backgroundColor: "#2f2f2f"
      }
    },
  };

  return (
    <div style={{ display: "flex", justifyContent: "space-around", gap: "2rem" }}>
      {["rapid", "blitz", "bullet"].map((tc) => {
        const totalGames = winrateMap[tc]?.total || 0;
        return (
          <div key={tc} style={{ width: "200px", textAlign: "center", background: "#2f2f2f", borderRadius: "20px" }}>
            <h3 style={{ textTransform: "capitalize", marginBottom: "0.25rem", color: "#f9c0d9" }}>
              {tc} - {totalGames} {totalGames === 1 ? "game" : "games"}
            </h3>
            <Pie data={chartDataByTimeControl(tc)} options={options} />
          </div>
        );
      })}
    </div>
  );
}

// Openings Table
function OpeningsTable({ openingsStats }) {
  // Group openings by first pawn move (e4, d4, c4, f4, etc.)
  function getFirstPawnMove(openingName) {
    // Try to infer from opening name or use ecoData to get moves
    const ecoEntry = ecoData.find(
      (o) => o.name && o.name.toLowerCase() === openingName.toLowerCase()
    );
    if (ecoEntry && ecoEntry.moves) {
      const firstMove = ecoEntry.moves.trim().split(" ")[0];
      // Only return pawn moves (e4, d4, c4, f4, etc.)
      if (/^[a-h][3-4]$/.test(firstMove)) return firstMove;
    }
    // Fallback: try to guess from name
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

  // Compute separate stats for White and Black, only include rows with total > 0
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

  // Group by first pawn move
  function groupByFirstMove(rows) {
    const groups = {};
    for (const row of rows) {
      const key = row.firstMove || "other";
      if (!groups[key]) groups[key] = [];
      groups[key].push(row);
    }
    // Sort each group by total games
    for (const key in groups) {
      groups[key].sort((a, b) => b.total - a.total);
    }
    return groups;
  }

  const groupedWhite = groupByFirstMove(rowsWhite);
  const groupedBlack = groupByFirstMove(rowsBlack);

  // Dropdown component for each color
  function OpeningsDropdown({ groups, colorLabel }) {
    // Default to "e4" (King's Pawn) if present, else first group
    const groupKeys = Object.keys(groups);
    const defaultKey = groupKeys.includes("e4") ? "e4" : groupKeys[0] || "";
    const [selected, setSelected] = useState(defaultKey);
    const [showAll, setShowAll] = useState(false);

    if (!selected || !groups[selected] || groups[selected].length === 0) {
      return <p style={{ color: "#fff" }}>No data for {colorLabel}.</p>;
    }

    const rows = groups[selected];
    const displayRows = showAll ? rows : rows.slice(0, 10);

    return (
      <div style={{ marginBottom: "2rem", background: "#2f2f2f", borderRadius: "20px", padding: "1rem" }}>
        <label style={{ color: "#fff", fontWeight: "bold", marginRight: 8 }}>
          Opening:
        </label>
        <select
          value={selected}
          onChange={e => {
            setSelected(e.target.value);
            setShowAll(false); // reset to first 10 on group change
          }}
          style={{
            marginBottom: "1rem",
            padding: "0.3rem",
            borderRadius: 4,
            background: "#f9c0d9",
            color: "#2f2f2f",
            fontWeight: 600,
            border: "none",
            outline: "none"
          }}
        >
          {groupKeys.map(key => (
            <option key={key} value={key} style={{ background: "#f9c0d9", color: "#2f2f2f" }}>
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
            color: "#fff",
            backgroundColor: "#2f2f2f",
            marginBottom: "2rem",
            borderRadius: "12px",
            overflow: "hidden"
          }}
        >
          <thead>
            <tr>
              <th style={{ borderBottom: "1px solid #444", padding: "0.5rem" }}>Name</th>
              <th style={{ borderBottom: "1px solid #444", padding: "0.5rem" }}>Wins</th>
              <th style={{ borderBottom: "1px solid #444", padding: "0.5rem" }}>Draws</th>
              <th style={{ borderBottom: "1px solid #444", padding: "0.5rem" }}>Losses</th>
              <th style={{ borderBottom: "1px solid #444", padding: "0.5rem" }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {displayRows.map(({ name, wins, draws, losses, total }) => (
              <tr key={colorLabel + name}>
                <td style={{ borderBottom: "1px solid #444", padding: "0.5rem" }}>
                  {name}
                </td>
                <td style={{ borderBottom: "1px solid #444", padding: "0.5rem", color: "#22c55e", fontWeight: "bold", textAlign: "center" }}>
                  {wins}
                </td>
                <td style={{ borderBottom: "1px solid #444", padding: "0.5rem", color: "#a3e635", fontWeight: "bold", textAlign: "center" }}>
                  {draws}
                </td>
                <td style={{ borderBottom: "1px solid #444", padding: "0.5rem", color: "#ef4444", fontWeight: "bold", textAlign: "center" }}>
                  {losses}
                </td>
                <td style={{ borderBottom: "1px solid #444", padding: "0.5rem", textAlign: "center" }}>
                  {total}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length > 10 && (
          <button
            onClick={() => setShowAll(v => !v)}
            style={{
              background: "#8b5cf6",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              padding: "0.5rem 1.2rem",
              fontWeight: 600,
              cursor: "pointer",
              margin: "0 auto",
              display: "block"
            }}
          >
            {showAll ? "Show Less" : "Show More"}
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
      <div style={{ maxWidth: 900, margin: "auto", padding: "1rem", color: "#fff" }}>
        <h1>Openings Played Breakdown</h1>
        <p>No opening data found in your games.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: "auto", padding: "1rem", background: "#2f2f2f", borderRadius: "20px" }}>
      <h1>Openings Played Breakdown</h1>
      <div style={{ marginTop: "2rem" }}>
        <h2>As White</h2>
        <OpeningsDropdown groups={groupedWhite} colorLabel="White" />
        <h2>As Black</h2>
        <OpeningsDropdown groups={groupedBlack} colorLabel="Black" />
      </div>
    </div>
  );
}

// Extract ECO code from PGN string
function extractEcoFromPGN(pgn) {
  const match = pgn && pgn.match(/\[ECO\s+"(.*?)"\]/);
  return match ? match[1] : "?";
}

// Extract moves from PGN string
function extractMovesFromPGN(pgn) {
  const movesSection = pgn.replace(/\[.*\]\n?/g, "").trim(); // remove headers
  return movesSection
    .replace(/\d+\.(\.\.)?/g, "") // remove move numbers
    .replace(/\s+/g, " ") // normalize spaces
    .trim();
}

// Helper to get opening by ECO code from ecoData
function getOpeningByEco(ecoCode) {
  return ecoData.find(o => o.eco === ecoCode) || {
    eco: "?",
    name: "Unknown Opening",
    moves: "",
  };
}

// Styles (CSS in JS)
const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #2f2f2f, #000000)",
    color: "#f9c0d9",
    fontFamily: "'Inter', Arial, Helvetica, sans-serif",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "2rem",
    transition: "background 0.4s, color 0.4s",
  },
  title: {
    fontSize: "2rem",
    fontWeight: "bold",
    marginBottom: "2rem",
    textAlign: "center",
    letterSpacing: "0.05em",
    color: "inherit",
  },
  inputContainer: {
    display: "flex",
    gap: "1rem",
    marginBottom: "1rem",
    maxWidth: "500px",
    width: "100%",
    alignItems: "center",
    background: "rgba(255,182,193,0.1)",
    borderRadius: "12px",
    padding: "12px 16px",
  },
  input: {
    flex: 1,
    padding: "12px 16px",
    fontSize: "1rem",
    border: "1px solid transparent",
    borderRadius: "12px",
    backgroundColor: "rgba(255,182,193,0.2)",
    color: "inherit",
    outline: "none",
    transition: "background-color 0.3s, border-color 0.3s",
  },
  button: {
    backgroundColor: "#8b5cf6",
    border: "none",
    color: "#fff",
    fontWeight: 600,
    padding: "12px 24px",
    fontSize: "1rem",
    borderRadius: "12px",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    transition: "background-color 0.3s",
  },
  progressContainer: {
    width: "100%",
    maxWidth: "500px",
    height: "10px",
    backgroundColor: "#555",
    borderRadius: "5px",
    overflow: "hidden",
    marginBottom: "1rem",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#8b5cf6",
    transition: "width 0.3s ease",
  },
  error: {
    backgroundColor: "rgba(255,0,0,0.15)",
    color: "#ff4f4f",
    padding: "16px 24px",
    borderRadius: "20px",
    textAlign: "center",
    fontWeight: 600,
    fontSize: "1.1rem",
    marginBottom: "1rem",
    boxShadow: "0 2px 8px rgba(255,0,0,0.2)",
  },
  chartContainer: {
    backgroundColor: "rgba(255,182,193,0.1)",
    color: "#f9c0d9",
    padding: "1rem",
    borderRadius: "20px",
    maxWidth: "800px",
    width: "100%",
    boxShadow: "0 4px 12px rgba(139,92,246,0.2)",
    marginBottom: "2rem",
  },
  profileBar: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "rgba(255,182,193,0.1)",
    padding: "1rem",
    borderRadius: "20px",
    marginBottom: "2rem",
    maxWidth: "800px",
    width: "100%",
    boxShadow: "0 4px 12px rgba(139,92,246,0.2)",
    gap: "1rem",
  },
  avatar: {
    width: "64px",
    height: "64px",
    borderRadius: "50%",
    marginRight: "1rem",
  },
  profileInfo: {
    display: "flex",
    flexDirection: "column",
    color: "inherit",
  },
  ratingsContainer: {
    marginTop: "0.5rem",
    display: "flex",
    gap: "1rem",
    fontSize: "0.9rem",
    color: "#f9c0d9",
  },
  ratingItem: {
    backgroundColor: "#8b5cf6",
    color: "#fff",
    padding: "0.2rem 0.6rem",
    borderRadius: "8px",
    fontWeight: 600,
  },
  openingsContainer: {
    marginTop: "2rem",
    maxWidth: "800px",
    width: "100%",
  },
  openingsTitle: {
    fontSize: "1.5rem",
    marginBottom: "1rem",
    color: "inherit",
    fontWeight: 700,
  },
  openingsList: {
    listStyleType: "none",
    padding: 0,
    margin: 0,
    color: "#f9c0d9",
    background: "rgba(139,92,246,0.05)",
    borderRadius: "12px",
    border: "1px solid rgba(139,92,246,0.2)",
    maxHeight: "300px",
    overflowY: "auto",
  },
  openingItem: {
    backgroundColor: "rgba(139,92,246,0.1)",
    padding: "10px 16px",
    borderBottom: "1px solid rgba(139,92,246,0.1)",
    display: "flex",
    justifyContent: "space-between",
    fontSize: "0.95rem",
    fontWeight: 600,
    color: "inherit",
  },
  openingPercent: {
    color: "#fff",
    fontWeight: "bold",
  },
};
