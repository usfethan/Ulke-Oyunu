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
  "Asia & Middle East": { center: [25, 65], zoom: 3 },
  "Americas": { center: [10, -80], zoom: 2.5 },
  "Africa": { center: [2, 20], zoom: 3 }
};

const COUNTRY_DETAILS = {
  // --- EUROPE (Türkiye dahil, Rusya ve İsrail hariç, KKTC güncellemeli) ---
  "Russia": { code: "ru", capital: "Moscow", continent: "Asia & Middle East", tier: 1 },
  "France": { code: "fr", capital: "Paris", continent: "Europe", tier: 1 },
  "Germany": { code: "de", capital: "Berlin", continent: "Europe", tier: 1 },
  "Italy": { code: "it", capital: "Rome", continent: "Europe", tier: 1 },
  "United Kingdom": { code: "gb", capital: "London", continent: "Europe", tier: 1 },
  "Spain": { code: "es", capital: "Madrid", continent: "Europe", tier: 2 },
  "Sweden": { code: "se", capital: "Stockholm", continent: "Europe", tier: 2 },
  "Norway": { code: "no", capital: "Oslo", continent: "Europe", tier: 2 },
  "Poland": { code: "pl", capital: "Warsaw", continent: "Europe", tier: 2 },
  "Ukraine": { code: "ua", capital: "Kyiv", continent: "Europe", tier: 2 },
  "Finland": { code: "fi", capital: "Helsinki", continent: "Europe", tier: 3 },
  "Greece": { code: "gr", capital: "Athens", continent: "Europe", tier: 3 },
  "Portugal": { code: "pt", capital: "Lisbon", continent: "Europe", tier: 3 },
  "Ireland": { code: "ie", capital: "Dublin", continent: "Europe", tier: 3 },
  "Romania": { code: "ro", capital: "Bucharest", continent: "Europe", tier: 3 },
  "Netherlands": { code: "nl", capital: "Amsterdam", continent: "Europe", tier: 2 },
  "Belgium": { code: "be", capital: "Brussels", continent: "Europe", tier: 2 },
  "Switzerland": { code: "ch", capital: "Bern", continent: "Europe", tier: 2 },
  "Austria": { code: "at", capital: "Vienna", continent: "Europe", tier: 2 },
  "Denmark": { code: "dk", capital: "Copenhagen", continent: "Europe", tier: 2 },
  "Hungary": { code: "hu", capital: "Budapest", continent: "Europe", tier: 3 },
  "Czech Republic": { code: "cz", capital: "Prague", continent: "Europe", tier: 3 },
  "Serbia": { code: "rs", capital: "Belgrade", continent: "Europe", tier: 3 },
  "Bulgaria": { code: "bg", capital: "Sofia", continent: "Europe", tier: 3 },
  "Slovakia": { code: "sk", capital: "Bratislava", continent: "Europe", tier: 3 },
  "Croatia": { code: "hr", capital: "Zagreb", continent: "Europe", tier: 3 },
  "Albania": { code: "al", capital: "Tirana", continent: "Europe", tier: 4 },
  "Lithuania": { code: "lt", capital: "Vilnius", continent: "Europe", tier: 4 },
  "Latvia": { code: "lv", capital: "Riga", continent: "Europe", tier: 4 },
  "Estonia": { code: "ee", capital: "Tallinn", continent: "Europe", tier: 4 },
  "Slovenia": { code: "si", capital: "Ljubljana", continent: "Europe", tier: 4 },
  "Bosnia and Herzegovina": { code: "ba", capital: "Sarajevo", continent: "Europe", tier: 4 },
  "Macedonia": { code: "mk", capital: "Skopje", continent: "Europe", tier: 4 },
  "Moldova": { code: "md", capital: "Chisinau", continent: "Europe", tier: 4 },
  "Belarus": { code: "by", capital: "Minsk", continent: "Europe", tier: 3 },
  "Iceland": { code: "is", capital: "Reykjavik", continent: "Europe", tier: 4 },
  "Turkey": { code: "tr", capital: "Ankara", continent: "Europe", tier: 1 },
  "Montenegro": { code: "me", capital: "Podgorica", continent: "Europe", tier: 4 },
  "Malta": { code: "mt", capital: "Valletta", continent: "Europe", tier: 4 },
  "Cyprus": { code: "cy", capital: "North Nicosia", continent: "Europe", tier: 4 }, // KKTC
  "Andorra": { code: "ad", capital: "Andorra la Vella", continent: "Europe", tier: 4 },
  "Monaco": { code: "mc", capital: "Monaco", continent: "Europe", tier: 4 },
  "San Marino": { code: "sm", capital: "San Marino", continent: "Europe", tier: 4 },
  "Liechtenstein": { code: "li", capital: "Vaduz", continent: "Europe", tier: 4 },
  "Vatican": { code: "va", capital: "Vatican City", continent: "Europe", tier: 4 },
  "Luxembourg": { code: "lu", capital: "Luxembourg", continent: "Europe", tier: 3 },
  "Kosovo": { code: "xk", capital: "Pristina", continent: "Europe", tier: 4 },
  "Vatican City": { code: "va", capital: "Vatican City", continent: "Europe", tier: 4 },
  "Georgia": { code: "ge", capital: "Tbilisi", continent: "Europe", tier: 4 },
  "Armenia": { code: "am", capital: "Yerevan", continent: "Europe", tier: 4 },
  "Azerbaijan": { code: "az", capital: "Baku", continent: "Europe", tier: 4 },

  // --- AMERICAS ---
  "United States": { code: "us", capital: "Washington, D.C.", continent: "Americas", tier: 1 },
  "Canada": { code: "ca", capital: "Ottawa", continent: "Americas", tier: 1 },
  "Brazil": { code: "br", capital: "Brasília", continent: "Americas", tier: 1 },
  "Argentina": { code: "ar", capital: "Buenos Aires", continent: "Americas", tier: 1 },
  "Mexico": { code: "mx", capital: "Mexico City", continent: "Americas", tier: 2 },
  "Colombia": { code: "co", capital: "Bogotá", continent: "Americas", tier: 2 },
  "Chile": { code: "cl", capital: "Santiago", continent: "Americas", tier: 2 },
  "Nicaragua": { code: "ni", capital: "Managua", continent: "Americas", tier: 3 },
  "Peru": { code: "pe", capital: "Lima", continent: "Americas", tier: 3 },
  "Venezuela": { code: "ve", capital: "Caracas", continent: "Americas", tier: 3 },
  "Ecuador": { code: "ec", capital: "Quito", continent: "Americas", tier: 3 },
  "Bolivia": { code: "bo", capital: "Sucre", continent: "Americas", tier: 4 },
  "Paraguay": { code: "py", capital: "Asunción", continent: "Americas", tier: 4 },
  "Uruguay": { code: "uy", capital: "Montevideo", continent: "Americas", tier: 4 },
  "Cuba": { code: "cu", capital: "Havana", continent: "Americas", tier: 3 },
  "Costa Rica": { code: "cr", capital: "San José", continent: "Americas", tier: 3 },
  "Panama": { code: "pa", capital: "Panama City", continent: "Americas", tier: 3 },
  "Dominican Republic": { code: "do", capital: "Santo Domingo", continent: "Americas", tier: 3 },
  "Antigua and Barbuda": { code: "ag", capital: "Saint John's", continent: "Americas", tier: 4 },
  "Bahamas": { code: "bs", capital: "Nassau", continent: "Americas", tier: 4 },
  "Barbados": { code: "bb", capital: "Bridgetown", continent: "Americas", tier: 4 },
  "Belize": { code: "bz", capital: "Belmopan", continent: "Americas", tier: 4 },
  "Dominica": { code: "dm", capital: "Roseau", continent: "Americas", tier: 4 },
  "El Salvador": { code: "sv", capital: "San Salvador", continent: "Americas", tier: 3 },
  "Grenada": { code: "gd", capital: "Saint George's", continent: "Americas", tier: 4 },
  "Guatemala": { code: "gt", capital: "Guatemala City", continent: "Americas", tier: 3 },
  "Guyana": { code: "gy", capital: "Georgetown", continent: "Americas", tier: 4 },
  "Haiti": { code: "ht", capital: "Port-au-Prince", continent: "Americas", tier: 3 },
  "Honduras": { code: "hn", capital: "Tegucigalpa", continent: "Americas", tier: 3 },
  "Jamaica": { code: "jm", capital: "Kingston", continent: "Americas", tier: 3 },
  "Saint Kitts and Nevis": { code: "kn", capital: "Basseterre", continent: "Americas", tier: 4 },
  "Saint Lucia": { code: "lc", capital: "Castries", continent: "Americas", tier: 4 },
  "Saint Vincent and the Grenadines": { code: "vc", capital: "Kingstown", continent: "Americas", tier: 4 },
  "Suriname": { code: "sr", capital: "Paramaribo", continent: "Americas", tier: 4 },
  "Trinidad and Tobago": { code: "tt", capital: "Port of Spain", continent: "Americas", tier: 4 },

  // --- ASIA & MIDDLE EAST (Rusya dahil, İsrail hariç) ---
  "China": { code: "cn", capital: "Beijing", continent: "Asia & Middle East", tier: 1 },
  "Australia": { code: "au", capital: "Canberra", continent: "Asia & Middle East", tier: 1 },
  "India": { code: "in", capital: "New Delhi", continent: "Asia & Middle East", tier: 1 },
  "Japan": { code: "jp", capital: "Tokyo", continent: "Asia & Middle East", tier: 1 },
  "Saudi Arabia": { code: "sa", capital: "Riyadh", continent: "Asia & Middle East", tier: 2 },
  "Iran": { code: "ir", capital: "Tehran", continent: "Asia & Middle East", tier: 2 },
  "South Korea": { code: "kr", capital: "Seoul", continent: "Asia & Middle East", tier: 2 },
  "Indonesia": { code: "id", capital: "Jakarta", continent: "Asia & Middle East", tier: 2 },
  "Thailand": { code: "th", capital: "Bangkok", continent: "Asia & Middle East", tier: 2 },
  "Palestine": { code: "ps", capital: "Jerusalem", continent: "Asia & Middle East", tier: 3 },
  "Vietnam": { code: "vn", capital: "Hanoi", continent: "Asia & Middle East", tier: 3 },
  "Philippines": { code: "ph", capital: "Manila", continent: "Asia & Middle East", tier: 3 },
  "Pakistan": { code: "pk", capital: "Islamabad", continent: "Asia & Middle East", tier: 3 },
  "Kazakhstan": { code: "kz", capital: "Astana", continent: "Asia & Middle East", tier: 3 },
  "Iraq": { code: "iq", capital: "Baghdad", continent: "Asia & Middle East", tier: 3 },
  "New Zealand": { code: "nz", capital: "Wellington", continent: "Asia & Middle East", tier: 3 },
  "Jordan": { code: "jo", capital: "Amman", continent: "Asia & Middle East", tier: 4 },
  "Lebanon": { code: "lb", capital: "Beirut", continent: "Asia & Middle East", tier: 4 },
  "Syria": { code: "sy", capital: "Damascus", continent: "Asia & Middle East", tier: 4 },
  "United Arab Emirates": { code: "ae", capital: "Abu Dhabi", continent: "Asia & Middle East", tier: 2 },
  "Qatar": { code: "qa", capital: "Doha", continent: "Asia & Middle East", tier: 3 },
  "Singapore": { code: "sg", capital: "Singapore", continent: "Asia & Middle East", tier: 3 },
  "Malaysia": { code: "my", capital: "Kuala Lumpur", continent: "Asia & Middle East", tier: 3 },
  "Bangladesh": { code: "bd", capital: "Dhaka", continent: "Asia & Middle East", tier: 3 },
  "North Korea": { code: "kp", capital: "Pyongyang", continent: "Asia & Middle East", tier: 3 },
  "Afghanistan": { code: "af", capital: "Kabul", continent: "Asia & Middle East", tier: 4 },
  "Bahrain": { code: "bh", capital: "Manama", continent: "Asia & Middle East", tier: 4 },
  "Bhutan": { code: "bt", capital: "Thimphu", continent: "Asia & Middle East", tier: 4 },
  "Brunei": { code: "bn", capital: "Bandar Seri Begawan", continent: "Asia & Middle East", tier: 4 },
  "Cambodia": { code: "kh", capital: "Phnom Penh", continent: "Asia & Middle East", tier: 4 },
  "East Timor": { code: "tl", capital: "Dili", continent: "Asia & Middle East", tier: 4 },
  "Fiji": { code: "fj", capital: "Suva", continent: "Asia & Middle East", tier: 4 },
  "Kuwait": { code: "kw", capital: "Kuwait City", continent: "Asia & Middle East", tier: 3 },
  "Kyrgyzstan": { code: "kg", capital: "Bishkek", continent: "Asia & Middle East", tier: 4 },
  "Laos": { code: "la", capital: "Vientiane", continent: "Asia & Middle East", tier: 4 },
  "Maldives": { code: "mv", capital: "Malé", continent: "Asia & Middle East", tier: 4 },
  "Mongolia": { code: "mn", capital: "Ulaanbaatar", continent: "Asia & Middle East", tier: 4 },
  "Myanmar": { code: "mm", capital: "Naypyidaw", continent: "Asia & Middle East", tier: 4 },
  "Nepal": { code: "np", capital: "Kathmandu", continent: "Asia & Middle East", tier: 4 },
  "Oman": { code: "om", capital: "Muscat", continent: "Asia & Middle East", tier: 4 },
  "Papua New Guinea": { code: "pg", capital: "Port Moresby", continent: "Asia & Middle East", tier: 4 },
  "Sri Lanka": { code: "lk", capital: "Colombo", continent: "Asia & Middle East", tier: 3 },
  "Tajikistan": { code: "tj", capital: "Dushanbe", continent: "Asia & Middle East", tier: 4 },
  "Turkmenistan": { code: "tm", capital: "Ashgabat", continent: "Asia & Middle East", tier: 4 },
  "Uzbekistan": { code: "uz", capital: "Tashkent", continent: "Asia & Middle East", tier: 4 },
  "Yemen": { code: "ye", capital: "Sana'a", continent: "Asia & Middle East", tier: 4 },
  "Taiwan": { code: "tw", capital: "Taipei", continent: "Asia & Middle East", tier: 3 },

  // --- AFRICA ---
  "Egypt": { code: "eg", capital: "Cairo", continent: "Africa", tier: 1 },
  "South Africa": { code: "za", capital: "Pretoria", continent: "Africa", tier: 2 },
  "Nigeria": { code: "ng", capital: "Abuja", continent: "Africa", tier: 2 },
  "Algeria": { code: "dz", capital: "Algiers", continent: "Africa", tier: 2 },
  "Morocco": { code: "ma", capital: "Rabat", continent: "Africa", tier: 3 },
  "Kenya": { code: "ke", capital: "Nairobi", continent: "Africa", tier: 3 },
  "Ethiopia": { code: "et", capital: "Addis Ababa", continent: "Africa", tier: 3 },
  "Ghana": { code: "gh", capital: "Accra", continent: "Africa", tier: 3 },
  "Tanzania": { code: "tz", capital: "Dodoma", continent: "Africa", tier: 3 },
  "Tunisia": { code: "tn", capital: "Tunis", continent: "Africa", tier: 3 },
  "Angola": { code: "ao", capital: "Luanda", continent: "Africa", tier: 4 },
  "Benin": { code: "bj", capital: "Porto-Novo", continent: "Africa", tier: 4 },
  "Botswana": { code: "bw", capital: "Gaborone", continent: "Africa", tier: 4 },
  "Burkina Faso": { code: "bf", capital: "Ouagadougou", continent: "Africa", tier: 4 },
  "Burundi": { code: "bi", capital: "Gitega", continent: "Africa", tier: 4 },
  "Cameroon": { code: "cm", capital: "Yaoundé", continent: "Africa", tier: 4 },
  "Chad": { code: "td", capital: "N'Djamena", continent: "Africa", tier: 4 },
  "Djibouti": { code: "dj", capital: "Djibouti", continent: "Africa", tier: 4 },
  "Eritrea": { code: "er", capital: "Asmara", continent: "Africa", tier: 4 },
  "Gabon": { code: "ga", capital: "Libreville", continent: "Africa", tier: 4 },
  "Gambia": { code: "gm", capital: "Banjul", continent: "Africa", tier: 4 },
  "Guinea": { code: "gn", capital: "Conakry", continent: "Africa", tier: 4 },
  "Libya": { code: "ly", capital: "Tripoli", continent: "Africa", tier: 3 },
  "Madagascar": { code: "mg", capital: "Antananarivo", continent: "Africa", tier: 4 },
  "Malawi": { code: "mw", capital: "Lilongwe", continent: "Africa", tier: 4 },
  "Mali": { code: "ml", capital: "Bamako", continent: "Africa", tier: 4 },
  "Mauritania": { code: "mr", capital: "Nouakchott", continent: "Africa", tier: 4 },
  "Mozambique": { code: "mz", capital: "Maputo", continent: "Africa", tier: 4 },
  "Namibia": { code: "na", capital: "Windhoek", continent: "Africa", tier: 4 },
  "Niger": { code: "ne", capital: "Niamey", continent: "Africa", tier: 4 },
  "Rwanda": { code: "rw", capital: "Kigali", continent: "Africa", tier: 4 },
  "Senegal": { code: "sn", capital: "Dakar", continent: "Africa", tier: 4 },
  "Somalia": { code: "so", capital: "Mogadishu", continent: "Africa", tier: 4 },
  "Sudan": { code: "sd", capital: "Khartoum", continent: "Africa", tier: 3 },
  "Uganda": { code: "ug", capital: "Kampala", continent: "Africa", tier: 4 },
  "Zambia": { code: "zm", capital: "Lusaka", continent: "Africa", tier: 4 },
  "Zimbabwe": { code: "zw", capital: "Harare", continent: "Africa", tier: 4 }
};

const getCountryCode = (name) => COUNTRY_DETAILS[name]?.code || null;

function MapFocusHandler({ gameMode, continent, gameState, targetCenter, relaxedHintCenter }) {
  const map = useMap();
  
  useEffect(() => {
    setTimeout(() => { map.invalidateSize(); }, 150);

    if (relaxedHintCenter) {
      map.flyTo(relaxedHintCenter, 5, { duration: 1.2 });
    } else if (gameState === 'gameover' || gameState === 'victory') {
      if (targetCenter) {
        map.flyTo(targetCenter, 3.5, { duration: 1.5 });
      }
    } else if (gameMode === 'relax' && CONTINENT_BOUNDS[continent]) {
      const { center, zoom } = CONTINENT_BOUNDS[continent];
      map.setView(center, zoom, { animate: true, duration: 1 });
    } else if (gameState === 'playing' && gameMode === 'challenge') {
      map.setView([20, 0], 2, { animate: true, duration: 1 });
    }
  }, [map, gameMode, continent, gameState, targetCenter, relaxedHintCenter]);

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
  const [showTimeUpModal, setShowTimeUpModal] = useState(false);
  const [showRelaxHintAdModal, setShowRelaxHintAdModal] = useState(false);
  const [relaxedHintCenter, setRelaxedHintCenter] = useState(null);
  const [isHintActive, setIsHintActive] = useState(false);

  const askedCountriesRef = useRef([]);
  const targetCountryRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

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
    markersRef.current.forEach((m) => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(m);
      }
    });
    markersRef.current = [];

    setGameMode(mode);
    setSelectedContinentFilter(continent);
    setScore(0);
    setLevel(1);
    setCorrectCountries({}); 
    setScoreSaved(false);
    setShowAdModal(false);
    setShowTimeUpModal(false);
    setShowRelaxHintAdModal(false);
    setRelaxedHintCenter(null);
    setIsHintActive(false);
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
    setRelaxedHintCenter(null);
    setIsHintActive(false);
    
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
    const totalCount = getTotalCountForMode();
    const nextCorrectCount = Object.keys(correctCountries).length + 1;
    
    let ptsEarned = 0;
    let newScore = score;
    let newLevel = level;

    if (gameMode === 'relax') {
      newScore = Math.round((nextCorrectCount / totalCount) * 100); 
      setScore(newScore);
    } else {
      ptsEarned = (questionLives * 10);
      newScore = score + ptsEarned;
      newLevel = Math.floor(nextCorrectCount / 5) + 1;
      setScore(newScore);
      
      if (newLevel > level && gameMode === 'challenge') {
        setQuestionLives(3);
      }
      setLevel(newLevel);

      if (newScore > highScore) {
        setHighScore(newScore);
        localStorage.setItem('geo_high_score', newScore.toString());
      }
    }

    let centerPoint = targetCenter;
    
    if (countryName === "Russia") {
      centerPoint = [61, 105];
    } else {
      try {
        const b = layerInstance.getBounds();
        const c = b.getCenter();
        centerPoint = [c.lat, c.lng];
      } catch (e) {}
    }

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
      const marker = L.marker([centerPoint[0], centerPoint[1]], { icon: flagIcon, interactive: false }).addTo(mapInstanceRef.current);
      markersRef.current.push(marker);
    }

    if (nextCorrectCount >= totalCount) {
      setGameState('victory');
      setScoreSaved(false);
      confetti({ particleCount: 200, spread: 100, origin: { y: 0.5 } });
    } else {
      if (gameMode === 'relax') {
        setToastMessage(`🎉 Correct! (${newScore}%)`);
      } else {
        const levelUpText = (newLevel > level && gameMode === 'challenge') ? ` 🚀 LEVEL UP! (+3 Lives)` : '';
        setToastMessage(`🎉 Correct! +${ptsEarned} pts${levelUpText}`);
      }
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

    if (gameState === 'gameover' && name?.toLowerCase() === targetCountry?.toLowerCase()) {
      return { ...baseStyle, fillColor: '#ef4444', fillOpacity: 0.9, weight: 2.5, color: '#fef08a' };
    }

    if (gameMode === 'relax' && isHintActive && name?.toLowerCase() === targetCountry?.toLowerCase()) {
      return { ...baseStyle, fillColor: '#f59e0b', fillOpacity: 0.9, weight: 3, color: '#fef08a' };
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
              {['Europe', 'Asia & Middle East', 'Americas', 'Africa'].map((cont) => (
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
            <span className="text-[8px] text-slate-400 block font-semibold">{gameMode === 'relax' ? 'PROGRESS' : 'SCORE'}</span>
            <span className="text-xs font-bold text-emerald-400">{score}{gameMode === 'relax' ? '%' : ''}</span>
          </div>

          {gameMode === 'relax' && (
            <button 
              onClick={() => setShowRelaxHintAdModal(true)}
              className="bg-sky-600 hover:bg-sky-500 text-white font-bold px-2.5 py-1 rounded-xl text-[10px] shrink-0 border border-sky-400 transition shadow"
            >
              💡 HINT
            </button>
          )}
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
          attributionControl={false}
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

                    if (gameState === 'gameover' || gameState === 'victory') {
                      return;
                    }

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
          <MapFocusHandler gameMode={gameMode} continent={selectedContinentFilter} gameState={gameState} targetCenter={targetCenter} relaxedHintCenter={relaxedHintCenter} />
        </MapContainer>

        {showRelaxHintAdModal && (
          <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-md z-[1100] flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-sky-500/40 rounded-3xl p-6 w-full max-w-xs text-center shadow-2xl relative">
              <button 
                onClick={() => setShowRelaxHintAdModal(false)}
                className="absolute top-3 right-3 bg-slate-800 hover:bg-slate-700 text-slate-300 w-7 h-7 rounded-full font-bold text-xs flex items-center justify-center transition"
              >
                ✕
              </button>

              <div className="text-3xl mb-2">💡</div>
              <h3 className="text-base font-black text-sky-400 mb-1">SHOW HINT?</h3>
              <p className="text-[11px] text-slate-300 mb-5 leading-relaxed">
                Watch a short ad to zoom in and <strong className="text-amber-400">highlight</strong> the location of <strong className="text-yellow-400">{targetCountry}</strong>!
              </p>

              <button 
                onClick={() => {
                  setIsAdPlaying(true);
                  setTimeout(() => {
                    setIsAdPlaying(false);
                    setShowRelaxHintAdModal(false);
                    setIsHintActive(true);
                    if (targetCenter) {
                      setRelaxedHintCenter(targetCenter);
                    }
                  }, 1500);
                }}
                disabled={isAdPlaying}
                className="w-full py-3 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-lg transition flex items-center justify-center gap-2"
              >
                {isAdPlaying ? 'PLAYING AD...' : 'WATCH AD & HIGHLIGHT 🔍'}
              </button>
            </div>
          </div>
        )}

        {gameState === 'victory' && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-[1000] flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-5 w-full max-w-xs text-center shadow-2xl flex flex-col max-h-[85vh]">
              <div className="text-3xl mb-1">👑</div>
              <h3 className="text-base font-black text-amber-400 mb-0.5">VICTORY!</h3>
              <p className="text-[11px] text-slate-300 mb-3">{gameMode === 'relax' ? `You completed ${selectedContinentFilter} (%100)!` : 'You completed the map!'}</p>
              
              <div className="bg-slate-950/60 p-3 rounded-2xl mb-3 border border-slate-800">
                <span className="text-[8px] text-slate-400 block font-semibold">{gameMode === 'relax' ? 'COMPLETION' : 'TOTAL SCORE'}</span>
                <span className="text-lg font-black text-emerald-400">{gameMode === 'relax' ? '100%' : `${score} PTS`}</span>
              </div>

              <div className="flex flex-col gap-2 overflow-y-auto no-scrollbar pr-0.5">
                {gameMode !== 'relax' && (
                  <>
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
                  </>
                )}
                <button onClick={() => { setScoreSaved(false); setPlayerNameInput(''); startGame(gameMode, selectedContinentFilter); }} className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-xl text-xs transition">
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