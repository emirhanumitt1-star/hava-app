// ================================================================
//  Hava Durumu + Gizli Romantik Sayfa
//  Gizli sayfa: sol alttaki ☀️'ye 1.5 saniye içinde 3 kez dokun
// ================================================================

const API_URL = "https://api.open-meteo.com/v1/forecast";
const GEO_URL = "https://geocoding-api.open-meteo.com/v1/search";
const TZ = "Europe/Istanbul";

const $ = (id) => document.getElementById(id);

const weatherCodeInfo = {
  0:{d:"Açık güneşli",i:"☀️"},1:{d:"Genelde açık",i:"🌤️"},2:{d:"Parçalı bulutlu",i:"⛅"},
  3:{d:"Kapalı",i:"☁️"},45:{d:"Sisli",i:"🌫️"},48:{d:"Puslu",i:"🌫️"},
  51:{d:"Hafif yağmur Çisenti",i:"🌦️"},53:{d:"Çisenti",i:"🌦️"},55:{d:"Yoğun çisenti",i:"🌧️"},
  61:{d:"Hafif yağmur",i:"🌦️"},63:{d:"Yağmurlu",i:"🌧️"},65:{d:"Şiddetli yağmur",i:"🌧️"},
  71:{d:"Hafif kar",i:"🌨️"},73:{d:"Kar yağışlı",i:"❄️"},75:{d:"Yoğun kar",i:"❄️"},
  80:{d:"Hafif sağanak",i:"🌦️"},81:{d:"Sağanak yağış",i:"🌧️"},82:{d:"Şiddetli sağanak",i:"⛈️"},
  95:{d:"Gök gürültülü",i:"⛈️"},96:{d:"Dolulu fırtına",i:"⛈️"},99:{d:"Şiddetli dolu",i:"⛈️"}
};

function infoFor(code){ return weatherCodeInfo[code] || {d:"Bilinmiyor",i:"🌡️"}; }

function bgFor(code){
  if (code === 0 || code === 1) return "linear-gradient(180deg,#2b5876 0%,#4e79a7 100%)";
  if (code >= 61 && code <= 65) return "linear-gradient(180deg,#3a4a5e 0%,#5c7187 100%)";
  if (code >= 71 && code<= 75)  return "linear-gradient(180deg,#5d7a92 0%,#9fb4c4 100%)";
  if (code >= 95)               return "linear-gradient(180deg,#2c2e44 0%,#4a4e69 100%)";
  return "linear-gradient(180deg,#33506b 0%,#5d7a8f 100%)";
}

// ---------- Hava durumu ----------
let coords = null;
let cityName = localStorage.getItem("cityName") || "İstanbul";
let cityQuery = localStorage.getItem("cityQuery") || "Istanbul";

async function fetchWeather(){
  $("desc").textContent =
  "Yükleniyor..."; try {
    const url = `${API_URL}?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,relative_humidity_2m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("api");
    const data = await res.json();
    const c = data.current;
    const info = infoFor(c.weather_code);

    $("temp").textContent = `${Math.round(c.temperature_2m)}°`;
    $("desc").textContent = info.d;
    $("weatherIcon").textContent = info.i;
    $("humidity").textContent = `${c.relative_humidity_2m}%`;
    $("wind").textContent = `${Math.round(c.wind_speed_10m)} km/s`;
    $("feels").textContent = `${Math.round(c.apparent_temperature)}°`;
    $("cityName").textContent = cityName;
    $("bgGradient").style.background = bgFor(c.weather_code);

    // 5 günlük tahmin
    const daily = data.daily;
    const names = ["Paz","Pzt","Sal","Çar","Per","Cum","Cmt"];
    const today = new Date().getDay();
    $("forecast").innerHTML = daily.time.slice(0,5).map((t,i)=>{
      const fi = infoFor(daily.weather_code[i]);
      const label = i===0?"Bugün":names[(today+i)%7];
      return `<div class="forecast-day">
        <div class="f-day">${label}</div>
        <div class="f-icon">${fi.i}</div>
        <div class="f-temp">${Math.round(daily.temperature_2m_max[i])}° / ${Math.round(daily.temperature_2m_min[i])}°</div>
      </div>`;
    }).join("");
  } catch(e){
    $("desc").textContent = "Bağlantı hatası — tekrar deneyin";
  }
}

async function setCity(query){
  try{
    const res = await fetch(`${GEO_URL}?name=${encodeURIComponent(query)}&count=1&language=tr&format=json`);
    const data = await res.json();
    if (data.results && data.results[0]){
      const r = data.results[0];
      coords = { lat: r.latitude, lon: r.longitude };
      cityName = r.name;
      cityQuery = query;
      localStorage.setItem("cityName", cityName);
      localStorage.setItem("cityQuery", cityQuery);
      localStorage.setItem("coords", JSON.stringify(coords));
      fetchWeather();
      return true;
    }
  }catch(e){/* ağ hatası */}
  return false;
}

async function initLocation(){
  const saved = localStorage.getItem("coords");
  if (saved){ coords = JSON.parse(saved); }
  else {
    const ok = await setCity(cityQuery);
    if (!ok) coords = { lat: 41.0082, lon: 28.9784 }; // İstanbul varsayılan
  }
  $("cityName").textContent = cityName;
  fetchWeather();
}

// ---------- Şehir seçimi ----------
const dialog = $("cityDialog");
$("cityBtn").addEventListener("click", ()=>{
  $("cityInput").value = cityQuery;
  dialog.showModal();
  setTimeout(()=> $("cityInput").focus(), 100);
});
$("cityCancel").addEventListener("click", ()=> dialog.close());
$("cityOk").addEventListener("click", doCity);
$("cityInput").addEventListener("keydown", e=>{ if(e.key==="Enter"){ e.preventDefault(); doCity(); }});
function doCity(){
  const v = $("cityInput").value.trim();
  if (v){ setCity(v); }
  dialog.close();
}

// ================================================================
//  GİZLİ SAYFA — gezegenin 3 kez hızlı dokunuşunu algıla
// ================================================================
const SECRET_QUOTES = [
  "Güneş bugün hâlâ Senden daha parlak değil. 🌅",
  "Bulutların gerçeği: Sen gülünce hava değişiyor. ☁️",
  "Bu kalbin tahmini rüzgar hızı: Seninle sonsuz. 💨",
  "Nem yüzdesi %100 — çünkü gözüme baktığında:",
  "Sen her gün ateş bulutlu sıcaklığı: Benim yazım. 🌞",
  "Uzak mesafe yok bizde, nöbetimizde: Aynı gökyüzü. 🌌",
  "Sıcaklık dalgası uyarısı: Yanımda olunca. 🔥",
  "Bekleme listesinde kışın bile: Seni bekliyorum. 🤍",
  "Bütün şehirlere aynı saat: SENİ. ⏰",
  "Sıcaklığımız hava fiyatında: Pt değil. ☕"
];

let taps = 0, tapTimer = null, lastTapTime = 0;

$("secretTrigger").addEventListener("click", ()=>{
  const now = Date.now();
  // çok geç olduysa sayacı sıfırla (1.5 sn)
  if (now - lastTapTime > 1500){ taps = 0; }
  lastTapTime = now;
  taps++;

  // emoji her zaman görünür kalır; sadece hafif nabız efekti
  const el = $("secretTrigger");
  el.style.transform = "scale(1.35)";
  setTimeout(()=>{ el.style.transform = ""; }, 120);

  if (taps >= 3){
    taps = 0;
    el.style.transform = "";
    openSecret();
  } else {
    // çok uzun bekleme → sıfırla
    tapTimer = setTimeout(()=>{ taps = 0; }, 1600);
  }
});

function openSecret(){
  const page = $("secretPage");
  page.style.animation = "fadeIn 0.6s ease";
  $("secretPage").classList.add("active");
  startHearts();
  newRandomQuote();
  heartCount = 0;
  $("tapCounter").textContent = "0 kalp gönderildi";
}

function closeSecret(){
  $("secretPage").classList.remove("active");
  stopHearts();
}

// Tek dokunuş → hava durumuna geri dön
$("backBtn").addEventListener("click", closeSecret);

// Romantik alıntı
function newRandomQuote(){
  const q = SECRET_QUOTES[Math.floor(Math.random()*SECRET_QUOTES.length)];
  $("quote").textContent = q;
}

// Fotoğraf yoksa polaroid'i gizle (uygulama bozulmasın)
$("usPhoto").addEventListener("error", ()=>{
  $("polaroid").style.display = "none";
});

// Fotoğrafa dokun → kalp patlaması kaçıncı dokunuşta yeni söz
$("polaroid").addEventListener("click", (e)=>{
  burstHearts(e.clientX, e.clientY);
  heartCount++;
  $("tapCounter").textContent = `${heartCount} kalp gönderildi`;
  if (heartCount % 3 === 0) newRandomQuote();
});

// Kalp sayacı + patlama efekti
let heartCount = 0;
$("bigHeart").addEventListener("click", (e)=>{
  heartCount++;
  $("tapCounter").textContent = `${heartCount} kalp gönderildi`;
  burstHearts(e.clientX, e.clientY);
  if (heartCount % 5 === 0) newRandomQuote();
});

function burstHearts(x, y){
  const emojis = ["❤️","💖","💘","💗","✨"];
  for (let i=0; i<10; i++){
    const el = document.createElement("span");
    el.className = "burst-heart";
    el.textContent = emojis[Math.floor(Math.random()*emojis.length)];
    const angle = Math.random()*Math.PI*2;
    const dist = 60 + Math.random()*90;
    el.style.left = x+"px";
    el.style.top = y+"px";
    el.style.setProperty("--dx", `${Math.cos(angle)*dist}px`);
    el.style.setProperty("--dy", `${Math.sin(angle)*dist}px`);
    document.body.appendChild(el);
    setTimeout(()=> el.remove(), 1000);
  }
}

// Arka planda yüzen kalpler
let heartInterval = null;
function startHearts(){
  stopHearts();
  heartInterval = setInterval(spawnHeart, 450);
  for (let i=0;i<8;i++) setTimeout(spawnHeart, i*120);
}
function stopHearts(){ if (heartInterval) clearInterval(heartInterval); heartInterval = null; }

function spawnHeart(){
  const bg = $("heartsBg");
  const el = document.createElement("span");
  el.className = "floating-heart";
  el.textContent = ["❤️","💕","💖","🩷","✨"][Math.floor(Math.random()*5)];
  el.style.left = Math.random()*100+"vw";
  el.style.fontSize = (14 + Math.random()*18)+"px";
  el.style.animationDuration = (4 + Math.random()*5)+"s";
  bg.appendChild(el);
  setTimeout(()=> el.remove(), 9500);
}

// Android geri tuşu desteği (Capacitor)
document.addEventListener("backbutton", ()=>{}, false);
window.addEventListener("keydown", (e)=>{ if(e.key==="Escape" && $("secretPage").classList.contains("active")) closeSecret(); });

// ================================================================
//  OTA OTOMATİK GÜNCELLEME KONTROLÜ
// ================================================================
async function otaCheck(){
  try{
    if (!window.OTA_URL) return;
    const res = await fetch(window.OTA_URL + "version.json?ts=" + Date.now());
    if (!res.ok) return;
    const data = await res.json();
    const remote = Number(data.v);
    const shown = window.SHOWN_V || 1;
    const cached = Number(localStorage.getItem("ota_v") || 0);
    if (!remote || remote <= Math.max(shown, cached)) return;
    const js  = await (await fetch(window.OTA_URL + "app.js?ts=" + Date.now())).text();
    const css = await (await fetch(window.OTA_URL + "style.css?ts=" + Date.now())).text();
    localStorage.setItem("ota_js", js);
    localStorage.setItem("ota_css", css);
    localStorage.setItem("ota_v", String(remote));
    localStorage.setItem("ota_updated_at", new Date().toLocaleString("tr-TR"));
    location.reload(); // yeni sürümle yeniden başlat
  }catch(e){ /* internetsiz — sorun değil, kurulu sürüm çalışır */ }
}
otaCheck();

// Şu anki sürümü gizli sayfada göster (doğrulama için)
const verTag = document.createElement("span");
verTag.textContent = "v" + (window.SHOWN_V || window.BUNDLE_V);
verTag.style.cssText = "font-size:11px;opacity:0.6;margin-top:14px;";
document.querySelector(".secret-main").appendChild(verTag);

// Başlat
initLocation();
