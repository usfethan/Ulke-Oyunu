import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
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
  "Asia-Pacific": { center: [15, 105], zoom: 3 },
  "Americas": { center: [10, -80], zoom: 2.5 },
  "Africa": { center: [2, 20], zoom: 3 }
};

const COUNTRY_DETAILS = {
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
  "Bolivia": { code: "bo", capital: "Sucre", continent: "Americas", tier: 4 },
  "Paraguay": { code: "py", capital: "Asunción", continent: "Americas", tier: 4 },
  "Uruguay": { code: "uy", capital: "Montevideo", continent: "Americas", tier: 4 },
  "Jordan": { code: "jo", capital: "Amman", continent: "Asia-Pacific", tier: 4 },
  "Lebanon": { code: "lb", capital: "Beirut", continent: "Asia-Pacific", tier: 4 },
  "Syria": { code: "sy", capital: "Damascus", continent: "Asia-Pacific", tier: 4 }
};

const getCountryCode = (name) => COUNTRY_DETAILS[name]?.code || null;

function MapFocusHandler({ gameMode, continent, gameState, targetCenter }) {
  const map = useMap();
  
  useEffect(() => {
    setTimeout(() => { map.invalidateSize(); }, 150);

    if (gameState === 'revealed' || gameState === 'gameover' || gameState === 'victory') {
      if (targetCenter) {
        map.flyTo(targetCenter, 3.5, { duration: 1.5 });
      }
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
  const [screen, setScreen] = useState('menu');
  const [gameMode, setGameMode] = useState('challenge');
  const [selectedContinentFilter, setSelectedContinentFilter] = useState('Europe');

  const [countriesData, setCountriesData] = useState(null);
  const [targetCountry, setTargetCountry] = useState(null);
  const [targetCenter, setTargetCenter] = useState(null);
  const [correctCountries, setCorrectCountries] = useState({});
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [highScore, setHighScore] = useState(() => parseInt(localStorage.getItem('geo_high_score') || '0', 10));
  
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
  const [highlightedContinent, setHighlightedContinent] = useState(null);
  
  const [gameState, setGameState] = useState('playing'); 
  const [toastMessage, setToastMessage] = useState(null);

  const [isAdPlaying, setIsAdPlaying] = useState(false);
  const [showAdModal, setShowAdModal] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const askedCountriesRef = useRef([]);
  const targetCountryRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    targetCountryRef.current = targetCountry;
  }, [targetCountry]);

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
    if (screen !== 'game' || gameState !== 'playing' || !targetCountry || gameMode === 'relax' || isAdPlaying || showAdModal || showExitConfirm) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          triggerHaptic('error');
          setShowAdModal(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [screen, gameState, targetCountry, gameMode, isAdPlaying, showAdModal, showExitConfirm]);

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
    setShowAdModal(false);
    askedCountriesRef.current = [];
    setQuestionLives(3);
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
    
    if (mode === 'challenge') {
      const calculatedTime = Math.max(7, 21 - currentLevel * 2);
      setTimeLeft(calculatedTime);
    } else {
      setTimeLeft(20);
    }

    setHighlightedContinent(null);
    setGameState('playing');
    setToastMessage(null);
  };

  const handleCorrectAnswer = (countryFeature, layerInstance) => {
    playSound('correct');
    triggerHaptic('success');

    const countryName = countryFeature.properties.name;
    const newScore = score + (questionLives * 10);
    
    const nextCorrectCount = Object.keys(correctCountries).length + 1;
    const newLevel = Math.floor(nextCorrectCount / 5) + 1;

    setScore(newScore);
    
    // Eğer seviye atlandıysa canları full'le (3 yap)
    if (newLevel > level) {
      setQuestionLives(3);
    }
    
    setLevel(newLevel);

    if (newScore > highScore) {
      setHighScore(newScore);
      localStorage.setItem('geo_high_score', newScore.toString());
    }

    let centerPoint = targetCenter;
    try {
      const b = layerInstance.getBounds();
      const c = b.getCenter();
      centerPoint = [c.lat, c.lng];
    } catch (e) {}

    const code = getCountryCode(countryName);
    if (code && centerPoint && mapInstanceRef.current) {
      setCorrectCountries((prev) => ({
        ...prev,
        [countryName]: { code, lat: centerPoint[0], lng: centerPoint[1] }
      }));

      const flagIcon = L.divIcon({
        className: 'custom-flag-marker',
        html: `<div style="font-size: 20px; text-align: center; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.8));">
                 <img src="https://flagcdn.com/w40/${code.toLowerCase()}.png" style="width: 24px; border-radius: 3px; border: 1px solid rgba(255,255,255,0.4);" />
               </div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });
      L.marker([centerPoint[0], centerPoint[1]], { icon: flagIcon, interactive: false }).addTo(mapInstanceRef.current);
    }

    const totalCount = getTotalCountForMode();

    if (nextCorrectCount >= totalCount) {
      setGameState('victory');
      setScoreSaved(false);
      confetti({ particleCount: 200, spread: 100, origin: { y: 0.5 } });
    } else {
      const levelUpText = newLevel > level ? ` 🚀 LEVEL UP! (+3 Lives)` : '';
      setToastMessage(`🎉 Correct! +${questionLives * 10} pts${levelUpText}`);
      confetti({ particleCount: 40, spread: 40, origin: { y: 0.7 } });
      
      setTimeout(() => {
        setToastMessage(null);
        pickNewTarget();
      }, 1200);
    }
  };

  const handleWrongClick = (clickedName) => {
    playSound('wrong');
    triggerHaptic('error');

    if (gameMode === 'relax') {
      setToastMessage(`❌ That was ${clickedName}`);
      setTimeout(() => setToastMessage(null), 1500);
      return;
    }

    setQuestionLives((prev) => {
      const next = prev - 1;
      if (next <= 0) {
        setShowAdModal(true);
        return 0;
      }
      setToastMessage(`❌ Wrong! That was ${clickedName}`);
      setTimeout(() => setToastMessage(null), 1500);
      return next;
    });
  };

  const handleWatchAd = () => {
    setIsAdPlaying(true);
    setTimeout(() => {
      setIsAdPlaying(false);
      setShowAdModal(false);
      setQuestionLives(3);
    }, 1500);
  };

  const handleCloseAdModal = () => {
    setShowAdModal(false);
    setGameState('gameover');
    setScoreSaved(false);
  };

  const getCountryStyle = (feature) => {
    const name = feature.properties.name;
    const details = COUNTRY_DETAILS[name];

    const baseStyle = {
      weight: 1,
      color: '#475569',
      fillOpacity: 0.3,
      className: 'leaflet-interactive pointer-events-auto'
    };

    if (correctCountries[name]) {
      return { ...baseStyle, fillColor: '#10b981', fillOpacity: 0.8, weight: 1.5, color: '#34d399' };
    }

    if (gameState === 'revealed' && name?.toLowerCase() === targetCountry?.toLowerCase()) {
      return { ...baseStyle, fillColor: '#ef4444', fillOpacity: 0.9, weight: 2.5, color: '#fef08a' };
    }

    if (highlightedContinent) {
      if (details && details.continent === highlightedContinent) {
        return { ...baseStyle, fillColor: '#0284c7', fillOpacity: 0.5, weight: 2, color: '#38bdf8' };
      } else {
        return { ...baseStyle, fillColor: '#0f172a', fillOpacity: 0.1, weight: 0.5, color: '#334155' };
      }
    }

    return { ...baseStyle, fillColor: '#1e293b' };
  };

  const totalCountries = getTotalCountForMode();
  const foundCountriesCount = Object.keys(correctCountries).length;

  if (screen === 'leaderboard') {
    return (
      <div className="flex flex-col h-screen w-screen bg-slate-950 text-white p-6 justify-between select-none">
        <div className="flex items-center justify-between">
          <button onClick={() => setScreen('menu')} className="bg-slate-800 hover:bg-slate-700 text-xs font-bold px-3 py-2 rounded-xl border border-slate-700 transition">
            ← Back
          </button>
          <h1 className="text-lg font-black text-amber-400 tracking-wider">TOP PLAYERS 🏆</h1>
          <div className="w-10"></div>
        </div>

        <div className="flex-1 overflow-y-auto my-4 no-scrollbar flex flex-col gap-2 max-w-xs mx-auto w-full">
          {leaderboard.map((item, index) => (
            <div key={index} className={`flex items-center justify-between p-3 rounded-2xl border ${index === 0 ? 'bg-amber-500/10 border-amber-500/40 text-amber-300' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
              <div className="flex items-center gap-3">
                <span className="font-black text-sm w-5 text-center">{index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}</span>
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
          <button onClick={() => setScreen('menu')} className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl border border-slate-700 text-xs transition">
            MAIN MENU 🏠
          </button>
        </div>
      </div>
    );
  }

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
          <button onClick={() => startGame('challenge')} className="bg-gradient-to-r from-amber-500 to-rose-600 p-4 rounded-2xl font-black shadow-xl text-left border border-amber-400/30">
            <div className="flex items-center justify-between">
              <span className="text-base text-white">CHALLENGE MODE 🏆</span>
              <span className="text-[9px] bg-black/30 text-amber-200 px-2 py-0.5 rounded-full">Main Mode</span>
            </div>
            <div className="text-[10px] text-amber-100 font-normal mt-1">Level Up Every 5 Countries • Global High Score</div>
          </button>

          <button onClick={() => setScreen('leaderboard')} className="bg-slate-900 border border-amber-500/30 p-3.5 rounded-2xl flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-2.5">
              <span className="text-lg">👑</span>
              <div className="text-left">
                <span className="text-xs font-black text-amber-400 block">LEADERBOARD</span>
                <span className="text-[10px] text-slate-400">See top global rankings</span>
              </div>
            </div>
            <span className="text-xs text-slate-500">➔</span>
          </button>

          <div className="bg-slate-900 border border-sky-500/30 p-4 rounded-2xl shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-sky-400 uppercase tracking-wide">RELAX MODE</span>
              <span className="text-[9px] bg-sky-950 text-sky-300 px-2 py-0.5 rounded-full">No Timer</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {['Europe', 'Asia-Pacific', 'Americas', 'Africa'].map((cont) => (
                <button key={cont} onClick={() => startGame('relax', cont)} className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold py-2.5 px-1 rounded-xl border border-slate-700 text-center truncate">
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

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-white overflow-hidden select-none">
      <header className="flex items-center justify-between px-2 py-2 pt-12 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 z-20 shadow-md gap-1">
        <button onClick={() => setScreen('menu')} className="text-xs font-bold text-slate-400 bg-slate-800 px-2 py-1.5 rounded-xl border border-slate-700 shrink-0">
          🏠
        </button>

        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          {gameMode === 'challenge' ? (
            <div className="bg-amber-500/10 border border-amber-500/40 px-1.5 py-1 rounded-xl text-center shrink-0">
              <span className="text-[8px] text-amber-400 block font-bold">LVL</span>
              <span className="text-xs font-black text-amber-300">{level}</span>
            </div>
          ) : (
            <div className="bg-slate-800 px-1.5 py-1 rounded-xl border border-slate-700 text-center shrink-0">
              <span className="text-[8px] text-slate-400 block font-semibold">PROG</span>
              <span className="text-xs font-bold text-sky-400">{foundCountriesCount}/{totalCountries}</span>
            </div>
          )}

          {gameMode !== 'relax' && (
            <div className="bg-slate-800 px-1.5 py-1 rounded-xl border border-slate-700 text-center shrink-0">
              <span className="text-[8px] text-slate-400 block font-semibold">TIME</span>
              <span className={`text-xs font-bold ${timeLeft <= 5 ? 'text-rose-400 animate-pulse' : 'text-sky-400'}`}>{timeLeft}s</span>
            </div>
          )}

          {gameMode !== 'relax' && (
            <div className="bg-slate-800 px-1.5 py-1 rounded-xl border border-slate-700 text-center shrink-0">
              <span className="text-[8px] text-slate-400 block font-semibold">LIVES</span>
              <span className="text-[11px] text-rose-400 font-bold tracking-tighter">{'❤️'.repeat(questionLives)}</span>
            </div>
          )}

          <div className="bg-slate-800 px-2 py-1 rounded-xl border border-slate-700 text-center shrink-0 max-w-[100px]">
            <span className="text-[8px] text-slate-400 block font-semibold">TARGET</span>
            <span className="text-xs font-extrabold text-yellow-400 truncate block">{targetCountry || '...'}</span>
          </div>

          <div className="bg-slate-800 px-1.5 py-1 rounded-xl border border-slate-700 text-center shrink-0">
            <span className="text-[8px] text-slate-400 block font-semibold">SCORE</span>
            <span className="text-xs font-bold text-emerald-400">{score}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full h-full relative bg-slate-900">
        {toastMessage && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[900] bg-emerald-600 text-white font-bold px-4 py-2 rounded-2xl shadow-2xl text-xs border border-emerald-400 animate-bounce text-center whitespace-nowrap">
            {toastMessage}
          </div>
        )}

        <MapContainer 
          center={[20, 0]} 
          zoom={2} 
          zoomControl={false} 
          scrollWheelZoom={true} 
          style={{ width: '100%', height: '100%', background: '#090d16' }}
          ref={(map) => {
            if (map) mapInstanceRef.current = map;
          }}
        >
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png" maxZoom={19} />
          {countriesData && (
            <GeoJSON
              key={targetCountry}
              data={countriesData}
              style={getCountryStyle}
              onEachFeature={(feature, layer) => {
                const countryName = feature.properties.name;

                if (correctCountries[countryName]) {
                  const countryCode = correctCountries[countryName].code;
                  const latLng = [correctCountries[countryName].lat, correctCountries[countryName].lng];
                  if (countryCode && mapInstanceRef.current) {
                    try {
                      const flagIcon = L.divIcon({
                        className: 'custom-flag-marker',
                        html: `<div style="font-size: 20px; text-align: center; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.8));">
                                 <img src="https://flagcdn.com/w40/${countryCode.toLowerCase()}.png" style="width: 24px; border-radius: 3px; border: 1px solid rgba(255,255,255,0.4);" />
                               </div>`,
                        iconSize: [24, 24],
                        iconAnchor: [12, 12]
                      });
                      L.marker(latLng, { icon: flagIcon, interactive: false }).addTo(mapInstanceRef.current);
                    } catch (e) {}
                  }
                }

                layer.on({
                  mousedown: (e) => {
                    L.DomEvent.stopPropagation(e);
                  },
                  touchstart: (e) => {
                    L.DomEvent.stopPropagation(e);
                  },
                  click: (e) => {
                    L.DomEvent.stopPropagation(e);
                    L.DomEvent.preventDefault(e);

                    const clickedName = feature.properties.name;
                    const currentTarget = targetCountryRef.current;

                    if (clickedName?.toLowerCase() === currentTarget?.toLowerCase()) {
                      handleCorrectAnswer(feature, layer);
                    } else {
                      handleWrongClick(clickedName);
                    }
                  }
                });
              }}
            />
          )}
          <MapFocusHandler gameMode={gameMode} continent={selectedContinentFilter} gameState={gameState} targetCenter={targetCenter} />
        </MapContainer>

        {gameState === 'gameover' && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-[1000] flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-rose-500/45 rounded-3xl p-5 w-full max-w-xs text-center shadow-2xl flex flex-col max-h-[85vh]">
              <div className="text-3xl mb-1">💔</div>
              <h3 className="text-base font-black text-rose-400 mb-0.5">GAME OVER</h3>
              <p className="text-[11px] text-slate-300 mb-3">Target was <span className="font-bold text-yellow-400">{targetCountry}</span></p>
              
              <div className="grid grid-cols-3 gap-2 bg-slate-950/60 p-2.5 rounded-2xl mb-3 border border-slate-800">
                <div>
                  <span className="text-[8px] text-slate-400 block font-semibold">SCORE</span>
                  <span className="text-xs font-black text-emerald-400">{score}</span>
                </div>
                <div>
                  <span className="text-[8px] text-slate-400 block font-semibold">LEVEL</span>
                  <span className="text-xs font-black text-amber-400">{level}</span>
                </div>
                <div>
                  <span className="text-[8px] text-slate-400 block font-semibold">BEST</span>
                  <span className="text-xs font-black text-sky-400">{highScore}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2 overflow-y-auto no-scrollbar pr-0.5">
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={playerNameInput}
                  onChange={(e) => setPlayerNameInput(e.target.value)}
                  maxLength={12}
                  disabled={scoreSaved}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-center text-white focus:outline-none focus:border-amber-400"
                />
                <button onClick={saveScoreToLeaderboard} disabled={scoreSaved || !playerNameInput.trim()} className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-slate-950 font-black rounded-xl text-xs transition">
                  {scoreSaved ? 'SAVED ✓' : 'SAVE SCORE 🥇'}
                </button>
                <button onClick={() => setGameState('revealed')} className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl border border-slate-700 text-xs transition">
                  SHOW LOCATION 📍
                </button>
                <button onClick={() => { setScoreSaved(false); setPlayerNameInput(''); startGame(gameMode, selectedContinentFilter); }} className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition">
                  PLAY AGAIN 🔄
                </button>
                <button onClick={() => setScreen('leaderboard')} className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs border border-slate-700 transition">
                  LEADERBOARD 👑
                </button>
              </div>
            </div>
          </div>
        )}

        {showAdModal && (
          <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-md z-[1100] flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-xs text-center shadow-2xl relative">
              <button 
                onClick={handleCloseAdModal}
                className="absolute top-3 right-3 bg-slate-800 hover:bg-slate-700 text-slate-300 w-7 h-7 rounded-full font-bold text-xs flex items-center justify-center transition"
              >
                ✕
              </button>

              <div className="text-3xl mb-2">🎬</div>
              <h3 className="text-base font-black text-emerald-400 mb-1">CONTINUE GAME?</h3>
              <p className="text-[11px] text-slate-300 mb-5 leading-relaxed">
                Watch a short ad to get <strong className="text-emerald-400">+3 Lives</strong> and keep your score and level going!
              </p>

              <button 
                onClick={handleWatchAd}
                disabled={isAdPlaying}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-lg transition flex items-center justify-center gap-2"
              >
                {isAdPlaying ? 'PLAYING AD...' : 'WATCH AD & GET +3 LIVES 🚀'}
              </button>
            </div>
          </div>
        )}

        {gameState === 'revealed' && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] bg-slate-900/95 border border-slate-700 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md">
            <span className="text-xs text-slate-300">Viewing location of <strong className="text-yellow-400">{targetCountry}</strong></span>
            <button onClick={() => { setScoreSaved(false); setPlayerNameInput(''); startGame(gameMode, selectedContinentFilter); }} className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition">
              Play Again 🔄
            </button>
          </div>
        )}

        {gameState === 'victory' && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-[1000] flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-5 w-full max-w-xs text-center shadow-2xl flex flex-col max-h-[85vh]">
              <div className="text-3xl mb-1">👑</div>
              <h3 className="text-base font-black text-amber-400 mb-0.5">VICTORY!</h3>
              <p className="text-[11px] text-slate-300 mb-3">You completed the map!</p>
              
              <div className="bg-slate-950/60 p-3 rounded-2xl mb-3 border border-slate-800">
                <span className="text-[8px] text-slate-400 block font-semibold">TOTAL SCORE</span>
                <span className="text-lg font-black text-emerald-400">{score} PTS</span>
              </div>

              <div className="flex flex-col gap-2 overflow-y-auto no-scrollbar pr-0.5">
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={playerNameInput}
                  onChange={(e) => setPlayerNameInput(e.target.value)}
                  maxLength={12}
                  disabled={scoreSaved}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-center text-white focus:outline-none focus:border-amber-400"
                />
                <button onClick={saveScoreToLeaderboard} disabled={scoreSaved || !playerNameInput.trim()} className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-slate-950 font-black rounded-xl text-xs transition">
                  {scoreSaved ? 'SAVED ✓' : 'SAVE SCORE 🥇'}
                </button>
                <button onClick={() => { setScoreSaved(false); setPlayerNameInput(''); startGame(gameMode, selectedContinentFilter); }} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition">
                  PLAY AGAIN 🔄
                </button>
                <button onClick={() => setScreen('leaderboard')} className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs border border-slate-700 transition">
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