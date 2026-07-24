import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import confetti from 'canvas-confetti';

delete L.Icon.Default.prototype._getIconUrl;

const triggerHaptic = (type) => {
  if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
    if (type === 'success') {
      window.navigator.vibrate(50);
    } else if (type === 'error') {
      window.navigator.vibrate([100, 50, 100]);
    }
  }
};

const playSound = (type) => {
  const sounds = {
    correct: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3',
    wrong: 'https://assets.mixkit.co/active_storage/sfx/2955/2955-preview.mp3'
  };

  if (sounds[type]) {
    const audio = new Audio(sounds[type]);
    audio.volume = 0.4;
    audio.play().catch(() => {});
  }
};

const CONTINENT_BOUNDS = {
  "Europe": { center: [54, 15], zoom: 4 },
  "Asia-Pacific": { center: [15, 105], zoom: 2.8 },
  "Americas": { center: [10, -80], zoom: 2.5 },
  "Africa": { center: [2, 20], zoom: 3 }
};

const COUNTRY_DETAILS = {
  // --- TIER 1 (Kolay) ---
  "United States": { code: "us", capital: "Washington, D.C.", continent: "Americas", tier: 1 },
  "Canada": { code: "ca", capital: "Ottawa", continent: "Americas", tier: 1 },
  "Brazil": { code: "br", capital: "Brasília", continent: "Americas", tier: 1 },
  "China": { code: "cn", capital: "Beijing", continent: "Asia-Pacific", tier: 1 },
  "Russia": { code: "ru", capital: "Moscow", continent: "Europe", tier: 1 },
  "Australia": { code: "au", capital: "Canberra", continent: "Asia-Pacific", tier: 1 },
  "India": { code: "in", capital: "New Delhi", continent: "Asia-Pacific", tier: 1 },
  "France": { code: "fr", capital: "Paris", continent: "Europe", tier: 1 },
  "Germany": { code: "de", capital: "Berlin", continent: "Europe", tier: 1 },
  "Italy": { code: "it", capital: "Rome", continent: "Europe", tier: 1 },
  "United Kingdom": { code: "gb", capital: "London", continent: "Europe", tier: 1 },
  "Japan": { code: "jp", capital: "Tokyo", continent: "Asia-Pacific", tier: 1 },
  "Egypt": { code: "eg", capital: "Cairo", continent: "Africa", tier: 1 },
  "Turkey": { code: "tr", capital: "Ankara", continent: "Asia-Pacific", tier: 1 },
  "Argentina": { code: "ar", capital: "Buenos Aires", continent: "Americas", tier: 1 },

  // --- TIER 2 (Orta) ---
  "Spain": { code: "es", capital: "Madrid", continent: "Europe", tier: 2 },
  "Mexico": { code: "mx", capital: "Mexico City", continent: "Americas", tier: 2 },
  "South Africa": { code: "za", capital: "Pretoria", continent: "Africa", tier: 2 },
  "Saudi Arabia": { code: "sa", capital: "Riyadh", continent: "Asia-Pacific", tier: 2 },
  "Colombia": { code: "co", capital: "Bogotá", continent: "Americas", tier: 2 },
  "Sweden": { code: "se", capital: "Stockholm", continent: "Europe", tier: 2 },
  "Norway": { code: "no", capital: "Oslo", continent: "Europe", tier: 2 },
  "Poland": { code: "pl", capital: "Warsaw", continent: "Europe", tier: 2 },
  "Ukraine": { code: "ua", capital: "Kyiv", continent: "Europe", tier: 2 },
  "Iran": { code: "ir", capital: "Tehran", continent: "Asia-Pacific", tier: 2 },
  "South Korea": { code: "kr", capital: "Seoul", continent: "Asia-Pacific", tier: 2 },
  "Indonesia": { code: "id", capital: "Jakarta", continent: "Asia-Pacific", tier: 2 },
  "Thailand": { code: "th", capital: "Bangkok", continent: "Asia-Pacific", tier: 2 },
  "Nigeria": { code: "ng", capital: "Abuja", continent: "Africa", tier: 2 },
  "Algeria": { code: "dz", capital: "Algiers", continent: "Africa", tier: 2 },
  "Chile": { code: "cl", capital: "Santiago", continent: "Americas", tier: 2 },

  // --- TIER 3 (Zor) ---
  "Palestine": { code: "ps", capital: "Jerusalem", continent: "Asia-Pacific", tier: 3 },
  "Nicaragua": { code: "ni", capital: "Managua", continent: "Americas", tier: 3 },
  "Peru": { code: "pe", capital: "Lima", continent: "Americas", tier: 3 },
  "Venezuela": { code: "ve", capital: "Caracas", continent: "Americas", tier: 3 },
  "Ecuador": { code: "ec", capital: "Quito", continent: "Americas", tier: 3 },
  "Finland": { code: "fi", capital: "Helsinki", continent: "Europe", tier: 3 },
  "Greece": { code: "gr", capital: "Athens", continent: "Europe", tier: 3 },
  "Portugal": { code: "pt", capital: "Lisbon", continent: "Europe", tier: 3 },
  "Ireland": { code: "ie", capital: "Dublin", continent: "Europe", tier: 3 },
  "Romania": { code: "ro", capital: "Bucharest", continent: "Europe", tier: 3 },
  "Vietnam": { code: "vn", capital: "Hanoi", continent: "Asia-Pacific", tier: 3 },
  "Philippines": { code: "ph", capital: "Manila", continent: "Asia-Pacific", tier: 3 },
  "Pakistan": { code: "pk", capital: "Islamabad", continent: "Asia-Pacific", tier: 3 },
  "Kazakhstan": { code: "kz", capital: "Astana", continent: "Asia-Pacific", tier: 3 },
  "Iraq": { code: "iq", capital: "Baghdad", continent: "Asia-Pacific", tier: 3 },
  "Morocco": { code: "ma", capital: "Rabat", continent: "Africa", tier: 3 },
  "Kenya": { code: "ke", capital: "Nairobi", continent: "Africa", tier: 3 },
  "Ethiopia": { code: "et", capital: "Addis Ababa", continent: "Africa", tier: 3 },
  "New Zealand": { code: "nz", capital: "Wellington", continent: "Asia-Pacific", tier: 3 },

  // --- TIER 4 (Çok Zor) ---
  "Bolivia": { code: "bo", capital: "Sucre", continent: "Americas", tier: 4 },
  "Paraguay": { code: "py", capital: "Asunción", continent: "Americas", tier: 4 },
  "Uruguay": { code: "uy", capital: "Montevideo", continent: "Americas", tier: 4 },
  "Jordan": { code: "jo", capital: "Amman", continent: "Asia-Pacific", tier: 4 },
  "Lebanon": { code: "lb", capital: "Beirut", continent: "Asia-Pacific", tier: 4 },
  "Syria": { code: "sy", capital: "Damascus", continent: "Asia-Pacific", tier: 4 }
};

const getCountryCode = (name) => COUNTRY_DETAILS[name]?.code || null;

const createFlagIcon = (code) => L.divIcon({
  className: 'custom-flag-marker',
  html: `<div style="width: 28px; height: 18px; border-radius: 3px; overflow: hidden; border: 1.5px solid #fff; box-shadow: 0 2px 5px rgba(0,0,0,0.5);"><img src="https://flagcdn.com/w80/${code}.png" style="width: 100%; height: 100%; object-fit: cover;" /></div>`,
  iconSize: [28, 18],
  iconAnchor: [14, 9]
});

const createTargetIcon = () => L.divIcon({
  className: 'custom-target-marker',
  html: `<div style="width: 36px; height: 36px; border-radius: 50%; background: rgba(239, 68, 68, 0.4); border: 2.5px solid #ef4444; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 15px #ef4444;" class="animate-pulse"><div style="width: 10px; height: 10px; border-radius: 50%; background: #fef08a;"></div></div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18]
});

function MapFocusHandler({ gameMode, continent, gameState, targetCenter }) {
  const map = useMap();
  
  useEffect(() => {
    setTimeout(() => { map.invalidateSize(); }, 100);

    if (gameState === 'revealed' && targetCenter) {
      map.flyTo(targetCenter, 4, { duration: 1.5 });
    } else if (gameMode === 'relax' && CONTINENT_BOUNDS[continent]) {
      const { center, zoom } = CONTINENT_BOUNDS[continent];
      map.setView(center, zoom, { animate: true, duration: 1 });
    } else if (gameState === 'playing' && gameMode === 'challenge') {
      map.setView([20, 0], 2, { animate: true, duration: 1 });
    }
  }, [map, gameMode, continent, gameState, targetCenter]);

  return null;
}

export default function App() {
  const [screen, setScreen] = useState('menu'); // 'menu', 'game', 'leaderboard'
  const [gameMode, setGameMode] = useState('challenge');
  const [selectedContinentFilter, setSelectedContinentFilter] = useState('Europe');

  const [countriesData, setCountriesData] = useState(null);
  const [targetCountry, setTargetCountry] = useState(null);
  const [targetCenter, setTargetCenter] = useState(null);
  const [correctCountries, setCorrectCountries] = useState({});
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [highScore, setHighScore] = useState(() => parseInt(localStorage.getItem('geo_high_score') || '0', 10));
  
  // Liderlik Tablosu Verileri
  const [leaderboard, setLeaderboard] = useState(() => {
    const saved = localStorage.getItem('geo_leaderboard');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      { name: "GeoKing", score: 450, level: 8 },
      { name: "AtlasPro", score: 380, level: 7 },
      { name: "GlobalExplorer", score: 290, level: 5 },
      { name: "Navigator", score: 210, level: 4 },
      { name: "Traveler", score: 150, level: 3 }
    ];
  });
  const [playerNameInput, setPlayerNameInput] = useState('');
  const [scoreSaved, setScoreSaved] = useState(false);

  const [questionLives, setQuestionLives] = useState(3);
  const [timeLeft, setTimeLeft] = useState(20);
  const [activeHint, setActiveHint] = useState(null);
  const [highlightedContinent, setHighlightedContinent] = useState(null);
  
  const [gameState, setGameState] = useState('playing'); 
  const [toastMessage, setToastMessage] = useState(null);

  // Reklam & Çıkış Onayı
  const [isAdPlaying, setIsAdPlaying] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [adTimer, setAdTimer] = useState(5);
  const adIntervalRef = useRef(null);

  const askedCountriesRef = useRef([]);
  const gameStateRef = useRef(gameState);
  const targetCountryRef = useRef(targetCountry);

  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { targetCountryRef.current = targetCountry; }, [targetCountry]);

  useEffect(() => {
    fetch('https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.features) {
          const palestineTargets = ["israel", "west bank", "gaza strip", "gaza"];
          const palestineCoords = [];
          const otherFeatures = [];

          data.features.forEach((f) => {
            const name = f.properties.name ? f.properties.name.toLowerCase() : '';
            if (palestineTargets.includes(name)) {
              if (f.geometry.type === "Polygon") {
                palestineCoords.push(f.geometry.coordinates);
              } else if (f.geometry.type === "MultiPolygon") {
                palestineCoords.push(...f.geometry.coordinates);
              }
            } else {
              otherFeatures.push(f);
            }
          });

          if (palestineCoords.length > 0) {
            const mergedPalestine = {
              type: "Feature",
              properties: { name: "Palestine" },
              geometry: {
                type: "MultiPolygon",
                coordinates: palestineCoords
              }
            };
            data.features = [...otherFeatures, mergedPalestine];
          }
        }
        setCountriesData(data);
      })
      .catch((err) => console.error('Map Load Error:', err));
  }, []);

  useEffect(() => {
    if (screen !== 'game' || gameState !== 'playing' || !targetCountry || gameMode === 'relax' || isAdPlaying || showExitConfirm) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          triggerHaptic('error');
          setGameState('gameover');
          setScoreSaved(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [screen, gameState, targetCountry, gameMode, isAdPlaying, showExitConfirm]);

  const saveScoreToLeaderboard = () => {
    if (!playerNameInput.trim() || scoreSaved) return;
    const newEntry = { name: playerNameInput.trim().slice(0, 12), score, level };
    const updated = [...leaderboard, newEntry].sort((a, b) => b.score - a.score).slice(0, 10);
    
    setLeaderboard(updated);
    localStorage.setItem('geo_leaderboard', JSON.stringify(updated));
    setScoreSaved(true);
    triggerHaptic('success');
  };

  const getTotalCountForMode = () => {
    if (gameMode === 'relax') {
      return Object.values(COUNTRY_DETAILS).filter(c => c.continent === selectedContinentFilter).length;
    }
    return Object.keys(COUNTRY_DETAILS).length;
  };

  const startGame = (mode, continent = 'Europe') => {
    setGameMode(mode);
    setSelectedContinentFilter(continent);
    setScore(0);
    setLevel(1);
    setCorrectCountries({});
    setScoreSaved(false);
    askedCountriesRef.current = [];
    setScreen('game');
    pickNewTarget(null, mode, continent, 1);
  };

  const getTierForLevel = (currentLevel) => {
    if (currentLevel >= 7) return 4;
    if (currentLevel >= 5) return 3;
    if (currentLevel >= 3) return 2;
    return 1;
  };

  const pickNewTarget = (featuresList, mode = gameMode, continentFilter = selectedContinentFilter, currentLevel = level) => {
    const list = featuresList || (countriesData && countriesData.features);
    if (!list || list.length === 0) return;

    let validCountries = list.filter((f) => COUNTRY_DETAILS[f.properties.name]);

    if (mode === 'relax') {
      validCountries = validCountries.filter((f) => COUNTRY_DETAILS[f.properties.name]?.continent === continentFilter);
    } else if (mode === 'challenge') {
      const targetTier = getTierForLevel(currentLevel);
      let tierFiltered = validCountries.filter((f) => COUNTRY_DETAILS[f.properties.name]?.tier === targetTier);
      if (tierFiltered.length > 0) validCountries = tierFiltered;
    }

    let unasked = validCountries.filter((f) => !askedCountriesRef.current.includes(f.properties.name));

    if (unasked.length === 0 && mode === 'challenge') {
      unasked = list.filter((f) => COUNTRY_DETAILS[f.properties.name] && !askedCountriesRef.current.includes(f.properties.name));
    }

    if (unasked.length === 0) {
      setGameState('victory');
      setScoreSaved(false);
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
      return;
    }

    const selected = unasked[Math.floor(Math.random() * unasked.length)];
    const newTarget = selected.properties.name;

    askedCountriesRef.current = [...askedCountriesRef.current, newTarget];

    try {
      const layer = L.geoJSON(selected);
      const center = layer.getBounds().getCenter();
      setTargetCenter([center.lat, center.lng]);
    } catch (e) {}

    setTargetCountry(newTarget);
    setQuestionLives(3);
    
    if (mode === 'challenge') {
      const calculatedTime = Math.max(7, 21 - currentLevel * 2);
      setTimeLeft(calculatedTime);
    } else {
      setTimeLeft(20);
    }

    setActiveHint(null);
    setHighlightedContinent(null);
    setGameState('playing');
    setToastMessage(null);
  };

  const handleCorrectAnswer = (countryFeature) => {
    playSound('correct');
    triggerHaptic('success');

    const countryName = countryFeature.properties.name;
    const newScore = score + (questionLives * 10);
    
    const nextCorrectCount = Object.keys(correctCountries).length + 1;
    const newLevel = Math.floor(nextCorrectCount / 5) + 1;

    setScore(newScore);
    setLevel(newLevel);

    if (newScore > highScore) {
      setHighScore(newScore);
      localStorage.setItem('geo_high_score', newScore.toString());
    }

    const code = getCountryCode(countryName);
    if (code && targetCenter) {
      setCorrectCountries((prev) => ({
        ...prev,
        [countryName]: { code, lat: targetCenter[0], lng: targetCenter[1] }
      }));
    }

    const totalCount = getTotalCountForMode();

    if (nextCorrectCount >= totalCount) {
      setGameState('victory');
      setScoreSaved(false);
      confetti({ particleCount: 200, spread: 100, origin: { y: 0.5 } });
    } else {
      setGameState('result');
      confetti({ particleCount: 50, spread: 50, origin: { y: 0.8 } });
    }
  };

  const handleWrongClick = (clickedName) => {
    playSound('wrong');
    triggerHaptic('error');

    if (gameMode === 'relax') {
      setToastMessage(`Oops! That was ${clickedName}`);
      setTimeout(() => setToastMessage(null), 2000);
      return;
    }

    setQuestionLives((prev) => {
      const next = prev - 1;
      if (next <= 0) {
        setGameState('gameover');
        setScoreSaved(false);
        return 0;
      }
      setToastMessage(`Wrong! That was ${clickedName}`);
      setTimeout(() => setToastMessage(null), 2000);
      return next;
    });
  };

  const useCapitalHint = () => {
    if (score < 10) {
      triggerHaptic('error');
      setToastMessage("Need at least 10 pts for Capital!");
      setTimeout(() => setToastMessage(null), 2000);
      return;
    }
    const details = COUNTRY_DETAILS[targetCountry];
    if (!details) return;

    triggerHaptic('success');
    setActiveHint(`Capital: ${details.capital}`);
    setScore((s) => Math.max(0, s - 10));
  };

  const startAdForContinentHint = () => {
    setIsAdPlaying(true);
    setAdTimer(5);

    adIntervalRef.current = setInterval(() => {
      setAdTimer((prev) => {
        if (prev <= 1) {
          clearInterval(adIntervalRef.current);
          setIsAdPlaying(false);
          
          const details = COUNTRY_DETAILS[targetCountry];
          if (details) {
            setActiveHint(`Region: ${details.continent}`);
            setHighlightedContinent(details.continent);
            triggerHaptic('success');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleAttemptCloseAd = () => {
    if (adIntervalRef.current) clearInterval(adIntervalRef.current);
    setShowExitConfirm(true);
  };

  const resumeAd = () => {
    setShowExitConfirm(false);
    triggerHaptic('success');
    
    adIntervalRef.current = setInterval(() => {
      setAdTimer((prev) => {
        if (prev <= 1) {
          clearInterval(adIntervalRef.current);
          setIsAdPlaying(false);
          
          const details = COUNTRY_DETAILS[targetCountry];
          if (details) {
            setActiveHint(`Region: ${details.continent}`);
            setHighlightedContinent(details.continent);
            triggerHaptic('success');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const confirmCancelAd = () => {
    setShowExitConfirm(false);
    setIsAdPlaying(false);
    triggerHaptic('error');
    setToastMessage("Ad skipped! Hint locked.");
    setTimeout(() => setToastMessage(null), 2500);
  };

  const restartGame = () => {
    setScore(0);
    setLevel(1);
    setCorrectCountries({});
    setScoreSaved(false);
    askedCountriesRef.current = [];
    pickNewTarget(null, gameMode, selectedContinentFilter, 1);
  };

  const getCountryStyle = (feature) => {
    const name = feature.properties.name;
    const details = COUNTRY_DETAILS[name];

    if (correctCountries[name]) {
      return { fillColor: '#10b981', fillOpacity: 0.8, weight: 1.5, color: '#34d399' };
    }

    if (gameState === 'revealed' && name?.toLowerCase() === targetCountry?.toLowerCase()) {
      return { fillColor: '#ef4444', fillOpacity: 0.9, weight: 2.5, color: '#fef08a' };
    }

    if (highlightedContinent) {
      if (details && details.continent === highlightedContinent) {
        return { fillColor: '#0284c7', fillOpacity: 0.5, weight: 2, color: '#38bdf8' };
      } else {
        return { fillColor: '#0f172a', fillOpacity: 0.1, weight: 0.5, color: '#334155' };
      }
    }

    return { fillColor: '#1e293b', weight: 1, color: '#475569', fillOpacity: 0.3 };
  };

  const totalCountries = getTotalCountForMode();
  const foundCountriesCount = Object.keys(correctCountries).length;

  // --- LİDERLİK EKRANI ---
  if (screen === 'leaderboard') {
    return (
      <div className="flex flex-col h-screen w-screen bg-slate-950 text-white p-6 justify-between select-none">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setScreen('menu')}
            className="bg-slate-800 hover:bg-slate-700 text-xs font-bold px-3 py-2 rounded-xl border border-slate-700 transition"
          >
            ← Back
          </button>
          <h1 className="text-lg font-black text-amber-400 tracking-wider">TOP PLAYERS 🏆</h1>
          <div className="w-10"></div>
        </div>

        <div className="flex-1 overflow-y-auto my-4 no-scrollbar flex flex-col gap-2 max-w-xs mx-auto w-full">
          {leaderboard.map((item, index) => (
            <div
              key={index}
              className={`flex items-center justify-between p-3 rounded-2xl border ${
                index === 0
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                  : index === 1
                  ? 'bg-slate-900 border-slate-700 text-slate-200'
                  : index === 2
                  ? 'bg-amber-900/10 border-amber-800/30 text-amber-600'
                  : 'bg-slate-900/50 border-slate-800 text-slate-400'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="font-black text-sm w-5 text-center">
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                </span>
                <span className="font-bold text-xs truncate max-w-[110px]">{item.name}</span>
              </div>
              <div className="flex items-center gap-3">
                {item.level && <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded-md text-amber-400">Lvl {item.level}</span>}
                <span className="font-black text-xs text-emerald-400">{item.score} pts</span>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center max-w-xs mx-auto w-full">
          <button
            onClick={() => setScreen('menu')}
            className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl border border-slate-700 text-xs transition"
          >
            MAIN MENU 🏠
          </button>
        </div>
      </div>
    );
  }

  // --- ANA MENÜ ---
  if (screen === 'menu') {
    return (
      <div className="flex flex-col h-screen w-screen bg-slate-950 text-white p-6 justify-between select-none">
        <div className="text-center mt-4">
          <div className="text-4xl mb-1.5 animate-bounce">🌍</div>
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-sky-400 tracking-wider">
            GEO MASTER
          </h1>
          <p className="text-xs text-slate-400 mt-1">Learn Regions • Master The World</p>
        </div>

        <div className="flex flex-col gap-3.5 max-w-xs mx-auto w-full">
          {/* CHALLENGE MODE EN ÜSTTE */}
          <button
            onClick={() => startGame('challenge')}
            className="bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 p-4 rounded-2xl font-black shadow-xl text-left relative overflow-hidden active:scale-95 transition border border-amber-400/30"
          >
            <div className="flex items-center justify-between">
              <span className="text-base text-white">CHALLENGE MODE 🏆</span>
              <span className="text-[9px] bg-black/30 text-amber-200 px-2 py-0.5 rounded-full border border-amber-300/30">Main Mode</span>
            </div>
            <div className="text-[10px] text-amber-100 font-normal mt-1">Level Up Every 5 Countries • Global High Score</div>
          </button>

          {/* LİDERLİK TABLOSU BUTONU */}
          <button
            onClick={() => setScreen('leaderboard')}
            className="bg-slate-900 hover:bg-slate-800 border border-amber-500/30 p-3.5 rounded-2xl flex items-center justify-between active:scale-95 transition shadow-lg"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-lg">👑</span>
              <div className="text-left">
                <span className="text-xs font-black text-amber-400 block">LEADERBOARD</span>
                <span className="text-[10px] text-slate-400">See top global rankings</span>
              </div>
            </div>
            <span className="text-xs text-slate-500">➔</span>
          </button>

          {/* RELAX MODE ALT KISIMDA */}
          <div className="bg-slate-900 border border-sky-500/30 p-4 rounded-2xl shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-sky-400 uppercase tracking-wide">RELAX MODE (CONTINENTS)</span>
              <span className="text-[9px] bg-sky-950 text-sky-300 px-2 py-0.5 rounded-full border border-sky-800">No Timer</span>
            </div>
            <p className="text-[10px] text-slate-400 mb-3">Explore and master continent maps at your own pace.</p>
            <div className="grid grid-cols-2 gap-2">
              {['Europe', 'Asia-Pacific', 'Americas', 'Africa'].map((cont) => (
                <button
                  key={cont}
                  onClick={() => startGame('relax', cont)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold py-2.5 px-1 rounded-xl border border-slate-700 active:scale-95 transition text-center truncate"
                >
                  {cont}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="text-center bg-slate-900 border border-slate-800 py-3 rounded-2xl max-w-xs mx-auto w-full">
          <span className="text-[10px] text-slate-500 block uppercase tracking-widest">BEST SCORE</span>
          <span className="text-lg font-black text-amber-400">{highScore} PTS</span>
        </div>
      </div>
    );
  }

  // --- OYUN EKRANI ---
  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-white overflow-hidden select-none">
      {isAdPlaying && (
        <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md z-[2000] flex flex-col items-center justify-center p-6 text-center">
          <button
            onClick={handleAttemptCloseAd}
            className="absolute top-6 right-6 bg-slate-800 hover:bg-rose-600 text-white font-bold w-10 h-10 rounded-full border border-slate-700 flex items-center justify-center text-sm transition"
          >
            ✕
          </button>

          <div className="bg-slate-900 border border-amber-500/30 p-6 rounded-3xl max-w-xs w-full shadow-2xl flex flex-col items-center">
            <div className="text-4xl mb-3 animate-pulse">🎬</div>
            <h3 className="text-sm font-black text-amber-400 mb-1 uppercase tracking-wider">AD PLAYING</h3>
            <p className="text-[11px] text-slate-400 mb-5">Please wait for the video to finish to get your region hint.</p>

            <div className="w-16 h-16 border-4 border-amber-400 border-t-transparent rounded-full animate-spin flex items-center justify-center mb-4">
              <span className="text-base font-black text-white">{adTimer}s</span>
            </div>

            <p className="text-[9px] text-rose-400 font-bold">⚠️ If you close the ad, you won't get the hint!</p>
          </div>
        </div>
      )}

      {showExitConfirm && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-[2100] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/40 rounded-3xl p-6 w-full max-w-xs text-center shadow-2xl">
            <div className="text-4xl mb-2">⚠️</div>
            <h3 className="text-base font-black text-rose-400 mb-1">ARE YOU SURE?</h3>
            <p className="text-xs text-slate-300 mb-6">If you skip the video, you won't get your region hint!</p>
            
            <div className="flex flex-col gap-2.5">
              <button
                onClick={resumeAd}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-xl text-xs active:scale-95 transition shadow-lg"
              >
                CONTINUE WATCHING ▶
              </button>
              <button
                onClick={confirmCancelAd}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs active:scale-95 transition border border-slate-700"
              >
                QUIT & SKIP ✕
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="flex items-center justify-between px-3 py-2 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 z-20 shadow-md">
        <button
          onClick={() => setScreen('menu')}
          className="text-xs font-bold text-slate-400 hover:text-white bg-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-700 active:scale-95 transition"
        >
          🏠
        </button>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {gameMode === 'challenge' ? (
            <div className="bg-amber-500/10 border border-amber-500/40 px-2 py-1 rounded-xl text-center">
              <span className="text-[8px] text-amber-400 block font-bold leading-none">LVL</span>
              <span className="text-xs font-black text-amber-300">{level}</span>
            </div>
          ) : (
            <div className="bg-slate-800 px-2 py-1 rounded-xl border border-slate-700 text-center">
              <span className="text-[8px] text-slate-400 block font-semibold leading-none">PROG</span>
              <span className="text-xs font-bold text-sky-400">
                {foundCountriesCount}/{totalCountries}
              </span>
            </div>
          )}

          {gameMode !== 'relax' && (
            <div className="bg-slate-800 px-2 py-1 rounded-xl border border-slate-700 text-center">
              <span className="text-[8px] text-slate-400 block font-semibold leading-none">TIME</span>
              <span className={`text-xs font-bold ${timeLeft <= 5 ? 'text-rose-400 animate-pulse' : 'text-sky-400'}`}>
                {timeLeft}s
              </span>
            </div>
          )}

          {gameMode !== 'relax' && (
            <div className="bg-slate-800 px-2 py-1 rounded-xl border border-slate-700 text-center">
              <span className="text-[8px] text-slate-400 block font-semibold leading-none">LIVES</span>
              <span className="text-xs text-rose-400 font-bold">{'❤️'.repeat(questionLives)}</span>
            </div>
          )}

          <div className="bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-700 text-center">
            <span className="text-[8px] text-slate-400 block font-semibold leading-none">TARGET</span>
            <span className="text-xs font-extrabold text-yellow-400 max-w-[100px] truncate block">
              {targetCountry || '...'}
            </span>
          </div>

          <div className="bg-slate-800 px-2 py-1 rounded-xl border border-slate-700 text-center">
            <span className="text-[8px] text-slate-400 block font-semibold leading-none">SCORE</span>
            <span className="text-xs font-bold text-emerald-400">{score}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full h-full relative bg-slate-900">
        {toastMessage && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[900] bg-rose-500 text-white font-bold px-4 py-1.5 rounded-full shadow-lg text-xs border border-rose-400 animate-bounce text-center whitespace-nowrap">
            ⚠️ {toastMessage}
          </div>
        )}

        {activeHint && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[900] bg-amber-500 text-slate-950 font-black px-4 py-1.5 rounded-full shadow-lg text-xs border border-amber-300 text-center whitespace-nowrap">
            💡 {activeHint}
          </div>
        )}

        <MapContainer center={[20, 0]} zoom={2} zoomControl={false} scrollWheelZoom={true} className="w-full h-full">
          <MapFocusHandler gameMode={gameMode} continent={selectedContinentFilter} gameState={gameState} targetCenter={targetCenter} />
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png" />
          
          {countriesData && (
            <GeoJSON
              key={`${targetCountry}-${gameState}-${Object.keys(correctCountries).length}-${highlightedContinent}`}
              data={countriesData}
              style={getCountryStyle}
              onEachFeature={(feature, layer) => {
                layer.on({
                  click: () => {
                    if (gameStateRef.current !== 'playing') return;
                    if (feature.properties.name?.toLowerCase() === targetCountryRef.current?.toLowerCase()) {
                      handleCorrectAnswer(feature);
                    } else {
                      handleWrongClick(feature.properties.name);
                    }
                  }
                });
              }}
            />
          )}

          {Object.entries(correctCountries).map(([name, item]) => (
            <Marker key={name} position={[item.lat, item.lng]} icon={createFlagIcon(item.code)} interactive={false} />
          ))}

          {gameState === 'revealed' && targetCenter && (
            <Marker position={targetCenter} icon={createTargetIcon()} interactive={false} />
          )}
        </MapContainer>

        {gameState === 'playing' && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[800] bg-slate-900/90 border border-slate-700/80 backdrop-blur-md rounded-2xl px-3 py-2 flex items-center gap-2 shadow-2xl w-[90%] max-w-xs justify-center">
            <button
              onClick={useCapitalHint}
              className="flex-1 flex items-center justify-center gap-1 bg-slate-800 hover:bg-slate-700 active:scale-95 text-amber-400 text-[11px] font-bold py-2 rounded-xl border border-slate-600 transition"
            >
              🏛️ Capital (-10)
            </button>
            <button
              onClick={startAdForContinentHint}
              className="flex-1 flex items-center justify-center gap-1 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 active:scale-95 text-white text-[11px] font-bold py-2 rounded-xl border border-sky-400/30 transition shadow-md"
            >
              🎬 Region (Watch Ad)
            </button>
          </div>
        )}

        {gameState === 'result' && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 w-full max-w-xs text-center shadow-2xl">
              <div className="text-4xl mb-2">🎉</div>
              <h2 className="text-xl font-black text-emerald-400 mb-1">EXCELLENT!</h2>
              <p className="text-xs text-slate-300 mb-5">You found <span className="text-yellow-400 font-bold">{targetCountry}</span>!</p>
              <button
                onClick={() => pickNewTarget(null)}
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold rounded-2xl shadow-lg active:scale-95 transition text-sm"
              >
                NEXT COUNTRY ➔
              </button>
            </div>
          </div>
        )}

        {gameState === 'victory' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md z-[1000] flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-6 w-full max-w-xs text-center shadow-2xl">
              <div className="text-4xl mb-2 animate-bounce">🏆</div>
              <h2 className="text-lg font-black text-amber-400 mb-1">REGION MASTERED!</h2>
              <p className="text-[11px] text-slate-300 mb-3">Score: <span className="text-emerald-400 font-bold">{score} PTS</span></p>

              {!scoreSaved ? (
                <div className="flex flex-col gap-2 mb-4">
                  <input
                    type="text"
                    placeholder="Enter your name"
                    value={playerNameInput}
                    onChange={(e) => setPlayerNameInput(e.target.value)}
                    maxLength={12}
                    className="bg-slate-950 border border-slate-700 text-xs text-center py-2 rounded-xl text-white outline-none focus:border-amber-400"
                  />
                  <button
                    onClick={saveScoreToLeaderboard}
                    disabled={!playerNameInput.trim()}
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-black rounded-xl text-xs transition"
                  >
                    SAVE TO LEADERBOARD 🏅
                  </button>
                </div>
              ) : (
                <p className="text-[11px] text-emerald-400 font-bold mb-4">✓ Score saved successfully!</p>
              )}

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setScreen('leaderboard')}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold rounded-xl text-xs transition border border-slate-700"
                >
                  VIEW LEADERBOARD 👑
                </button>
                <button
                  onClick={() => setScreen('menu')}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition border border-slate-700"
                >
                  MAIN MENU 🏠
                </button>
              </div>
            </div>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md z-[1000] flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-rose-500/40 rounded-3xl p-6 w-full max-w-xs text-center shadow-2xl">
              <div className="text-3xl mb-1">💔</div>
              <h2 className="text-lg font-black text-rose-400 mb-1">GAME OVER</h2>
              <p className="text-[11px] text-slate-400 mb-3">Target was <span className="text-yellow-400 font-bold">{targetCountry}</span></p>

              <div className="flex justify-around bg-slate-950/60 p-2.5 rounded-2xl border border-slate-800 mb-3">
                <div>
                  <span className="text-[8px] text-slate-500 block uppercase font-bold">Score</span>
                  <span className="text-sm font-extrabold text-emerald-400">{score}</span>
                </div>
                {gameMode === 'challenge' && (
                  <>
                    <div className="w-[1px] bg-slate-800"></div>
                    <div>
                      <span className="text-[8px] text-slate-500 block uppercase font-bold">Level</span>
                      <span className="text-sm font-extrabold text-amber-400">{level}</span>
                    </div>
                  </>
                )}
                <div className="w-[1px] bg-slate-800"></div>
                <div>
                  <span className="text-[8px] text-slate-500 block uppercase font-bold">Best</span>
                  <span className="text-sm font-extrabold text-sky-400">{highScore}</span>
                </div>
              </div>

              {!scoreSaved && score > 0 ? (
                <div className="flex flex-col gap-2 mb-3">
                  <input
                    type="text"
                    placeholder="Enter your name"
                    value={playerNameInput}
                    onChange={(e) => setPlayerNameInput(e.target.value)}
                    maxLength={12}
                    className="bg-slate-950 border border-slate-700 text-xs text-center py-2 rounded-xl text-white outline-none focus:border-amber-400"
                  />
                  <button
                    onClick={saveScoreToLeaderboard}
                    disabled={!playerNameInput.trim()}
                    className="w-full py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-black rounded-xl text-xs transition"
                  >
                    SAVE SCORE 🏅
                  </button>
                </div>
              ) : scoreSaved ? (
                <p className="text-[10px] text-emerald-400 font-bold mb-3">✓ Saved to leaderboard!</p>
              ) : null}

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setGameState('revealed')}
                  className="w-full py-2.5 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs active:scale-95 transition border border-slate-700"
                >
                  SHOW LOCATION 📍
                </button>
                <button
                  onClick={restartGame}
                  className="w-full py-2.5 bg-rose-500 text-white font-bold rounded-xl text-xs active:scale-95 transition shadow-lg"
                >
                  PLAY AGAIN 🔄
                </button>
                <button
                  onClick={() => setScreen('leaderboard')}
                  className="w-full py-2 bg-slate-800 text-amber-300 font-bold rounded-xl text-xs active:scale-95 transition border border-slate-700"
                >
                  LEADERBOARD 👑
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}