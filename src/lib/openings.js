import ecoA from './eco/ecoA.json';
import ecoB from './eco/ecoB.json';
import ecoC from './eco/ecoC.json';
import ecoD from './eco/ecoD.json';
import ecoE from './eco/ecoE.json';

export const ecoData = [
  ...ecoA.openings,
  ...ecoB.openings,
  ...ecoC.openings,
  ...ecoD.openings,
  ...ecoE.openings
];

// Removed duplicate/partial findOpening function to fix syntax error

// Find the *longest* matching opening by moves (most specific)
export function findOpening(gameMovesOrEcoOrName) {
  if (!gameMovesOrEcoOrName) {
    return { eco: "N/A", name: "Unknown Opening", moves: "" };
  }

  // Try to match by moves (PGN string or normalized moves string)
  if (typeof gameMovesOrEcoOrName === "string") {
    let normalizedGameMoves;
    if (gameMovesOrEcoOrName.match(/\d+\./)) {
      normalizedGameMoves = parsePGNMoves(gameMovesOrEcoOrName);
    } else {
      normalizedGameMoves = gameMovesOrEcoOrName.trim().toLowerCase().replace(/\s+/g, " ");
    }
    let bestMatch = null;
    let bestLength = 0;
    for (const opening of ecoData) {
      if (!opening.moves) continue;
      const openingMoves = opening.moves;
      const openingArr = openingMoves.split(" ");
      const gameArr = normalizedGameMoves.split(" ");
      let match = true;
      for (let i = 0; i < openingArr.length; i++) {
        if (gameArr[i] !== openingArr[i]) {
          match = false;
          break;
        }
      }
      if (match && openingArr.length > bestLength) {
        bestMatch = opening;
        bestLength = openingArr.length;
      }
    }
    if (bestMatch) {
      return { eco: bestMatch.eco, name: bestMatch.name, moves: bestMatch.moves };
    }
  }

  // Try to match by ECO code
  if (typeof gameMovesOrEcoOrName === "string" && /^[A-E][0-9]{2}$/.test(gameMovesOrEcoOrName)) {
    const found = ecoData.find(o => o.eco === gameMovesOrEcoOrName);
    if (found) return { eco: found.eco, name: found.name, moves: found.moves };
  }

  // Try to match by name (case-insensitive)
  if (typeof gameMovesOrEcoOrName === "string") {
    const found = ecoData.find(
      o => o.name && o.name.toLowerCase() === gameMovesOrEcoOrName.toLowerCase()
    );
    if (found) return { eco: found.eco, name: found.name, moves: found.moves };
  }

  return { eco: "N/A", name: "Unknown Opening", moves: "" };
}
