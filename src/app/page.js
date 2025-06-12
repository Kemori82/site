"use client";

import { useState, useEffect } from "react";
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

  useEffect(() => {
    if (error) setError(null);
  }, [username]);

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

    try {
      const archivesRes = await axios.get(
        `https://api.chess.com/pub/player/${username.toLowerCase()}/games/archives`
      );
      const archives = archivesRes.data.archives || [];
      setArchives(archives);
      setLoadingProgress(20);

      if (!archives.length) {
        setError("No game archives found for this user.");
        setLoadingProgress(0);
        return;
      }

      const gamesResponses = await Promise.all(
        archives.map(async (url, i) => {
          try {
            const res = await axios.get(url);
            setLoadingProgress(Math.min(25 + (i / archives.length) * 50, 75));
            return res.data.games || [];
          } catch {
            return [];
          }
        })
      );

      const allGames = gamesResponses.flat();
      setGames(allGames);
      setLoadingProgress(85);

      if (!allGames.length) {
        setError("No games found in the archives.");
        setLoadingProgress(0);
      } else {
        const ratingMap = extractRatingHistoryByTimeControl(
          allGames,
          username.toLowerCase()
        );
        setRatingData(ratingMap);

        const winrateMap = extractWinrateByTimeControl(allGames, username.toLowerCase());
        setWinrateMap(winrateMap);

        setLoadingProgress(100);
      }
    } catch (e) {
      setError("Failed to fetch data. Please check the username and try again.");
      console.error(e);
      setLoadingProgress(0);
    }
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
      },
      x: {
        title: { display: true, text: "Date" },
      },
    },
  };

  return <Line data={chartData} options={options} />;
}

// Pie charts for win/draw/loss with % labels and total games displayed
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
        labels: { color: "#000" },
      },
      datalabels: {
        color: "#000",
        formatter: (value) => value.toFixed(1) + "%",
      },
      title: {
        display: false,
        color: "#000",
        font: { size: 16 },
      },
    },
  };

  return (
    <div style={{ display: "flex", justifyContent: "space-around", gap: "2rem" }}>
      {["rapid", "blitz", "bullet"].map((tc) => {
        const totalGames = winrateMap[tc]?.total || 0;
        return (
          <div key={tc} style={{ width: "200px", textAlign: "center" }}>
            <h3 style={{ textTransform: "capitalize", marginBottom: "0.25rem" }}>
              {tc} - {totalGames} {totalGames === 1 ? "game" : "games"}
            </h3>
            <Pie data={chartDataByTimeControl(tc)} options={options} />
          </div>
        );
      })}
    </div>
  );
}

// Styles (CSS in JS)
const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(to bottom, #1f2937, #0f172a)",
    color: "#ffffff",
    fontFamily: "Arial, Helvetica, sans-serif",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "2rem",
  },
  title: {
    fontSize: "2rem",
    fontWeight: "bold",
    marginBottom: "2rem",
    textAlign: "center",
  },
  inputContainer: {
    display: "flex",
    gap: "1rem",
    marginBottom: "1rem",
    maxWidth: "500px",
    width: "100%",
  },
  input: {
    flex: 1,
    padding: "0.5rem",
    fontSize: "1rem",
    border: "1px solid #ccc",
    borderRadius: "4px",
  },
  button: {
    padding: "0.5rem 1rem",
    fontSize: "1rem",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
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
    backgroundColor: "#3b82f6",
    transition: "width 0.3s ease",
  },
  error: {
    color: "red",
    marginBottom: "1rem",
    textAlign: "center",
  },
  chartContainer: {
    backgroundColor: "#fff",
    color: "#000",
    padding: "1rem",
    borderRadius: "8px",
    maxWidth: "800px",
    width: "100%",
    boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
  },
};
