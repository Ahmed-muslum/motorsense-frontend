// ==============================================================================
// MotorSense v14.0 — Diagnostic MCSA Pompes HP · Station de Pompage
// Projet de fin d'études · Génie Électrique
//
// REDESIGN UI: Phosphor Graphite Theme — IBM Plex Mono + Barlow Condensed
// ==============================================================================
import { useState, useEffect, useRef, useCallback } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea } from "recharts";

const T = {
  bg:           "#dfe2e8",
  panel:        "#060b12",
  panel2:       "#091018",
  panel3:       "#0c1420",
  border:       "#99a5b0",
  borderHi:     "#1a3550",
  borderGlow:   "#00d4ff18",
  accent:       "#00d4ff",
  accentDim:    "#0099cc",
  accentBright: "#40e8ff",
  accentGlow:   "#00d4ff10",
  green:        "#00ff9d",
  greenBright:  "#30ffa8",
  red:          "#ff2d55",
  redBright:    "#ff5575",
  orange:       "#ff7240",
  orangeBright: "#ff9060",
  yellow:       "#ffe040",
  yellowBright: "#ffec70",
  blue:         "#4488ff",
  blueBright:   "#66aaff",
  purple:       "#cc55ff",
  purpleBright: "#dd88ff",
  teal:         "#00ffcc",
  muted:        "#0f2030",
  mutedHi:      "#2a4a65",
  text:         "#c8e8f8",
  textDim:      "#3a6080",
  textHi:       "#e8f8ff",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;700&family=Barlow:wght@300;400;500;600;700&family=Barlow+Condensed:wght@400;500;600;700;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { background: ${T.bg}; scroll-behavior: smooth; }
  body { background: ${T.bg}; color: ${T.text}; font-family: 'Barlow', system-ui, sans-serif; font-size: 13px; line-height: 1.6; -webkit-font-smoothing: antialiased; overflow-x: hidden; }
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: ${T.bg}; }
  ::-webkit-scrollbar-thumb { background: ${T.accent}35; border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: ${T.accent}65; }

  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.2; } }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes fadeInUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  @keyframes barSweep { from { transform: scaleX(0); } to { transform: scaleX(1); } }
  @keyframes scanline { 0% { transform: translateY(-100%); } 100% { transform: translateY(100vh); } }
  @keyframes shimmer { 0%,100%{opacity:.5} 50%{opacity:1} }
  @keyframes borderGlow { 0%,100%{box-shadow:0 0 0 1px ${T.accent}10} 50%{box-shadow:0 0 0 1px ${T.accent}30,0 0 20px ${T.accent}15} }

  .card-hover { transition: border-color 0.25s ease, box-shadow 0.25s ease, transform 0.18s ease; }
  .card-hover:hover { border-color: ${T.accent}28 !important; box-shadow: 0 0 0 1px ${T.accent}12, 0 16px 48px #00000075; transform: translateY(-1px); }
  
  .action-btn { transition: all 0.18s cubic-bezier(0.4,0,0.2,1); cursor: pointer; font-family: 'IBM Plex Mono', monospace; }
  .action-btn:hover { filter: brightness(1.18); }
  .action-btn:active { transform: scale(0.97) !important; }
  
  .tab-btn { transition: all 0.2s cubic-bezier(0.4,0,0.2,1); font-family: 'Barlow Condensed', sans-serif; letter-spacing: 0.06em; font-weight: 600; }
  .tab-btn:hover { filter: brightness(1.15); }
  
  .mono { font-family: 'IBM Plex Mono', monospace; }
  .condensed { font-family: 'Barlow Condensed', sans-serif; }
  
  .grid-bg {
    background-image: 
      linear-gradient(${T.accent}04 1px, transparent 1px),
      linear-gradient(90deg, ${T.accent}04 1px, transparent 1px);
    background-size: 40px 40px;
  }

  .param-input {
    background: ${T.panel};
    border: 1px solid ${T.border};
    color: ${T.accent};
    border-radius: 8px;
    padding: 8px 12px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12px;
    width: 100%;
    transition: border-color 0.18s ease, box-shadow 0.18s ease;
  }
  .param-input:focus { outline: none; border-color: ${T.accent}55; box-shadow: 0 0 0 3px ${T.accent}10; background: ${T.panel2}; }
  .param-input::placeholder { color: ${T.muted}; }
  
  input { color-scheme: dark; }
  select { color-scheme: dark; cursor: pointer; }
  select option { background: ${T.panel2}; color: ${T.text}; }

  .sev-bar { animation: barSweep 0.6s cubic-bezier(0.16, 1, 0.3, 1) both; transform-origin: left; }

  /* Scanline */
  .scanline::after {
    content: "";
    position: fixed;
    top: 0; left: 0; right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, ${T.accent}18, transparent);
    animation: scanline 10s linear infinite;
    pointer-events: none;
    z-index: 9999;
  }

  /* Noise texture overlay */
  .noise-overlay::before {
    content: "";
    position: fixed;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
    pointer-events: none;
    z-index: 0;
    opacity: 0.4;
  }
`;

// ── Constants OWON ──────────────────────────────────────────────────────────
const ADC_STEP     = 0.78125;
const OWON_MV_TO_A = 1 / 1000;

// ── DSP Utilities ────────────────────────────────────────────────────────────
function nextPow2(n) { let p = 1; while (p < n) p <<= 1; return p; }

function hannWindow(signal) {
  const N = signal.length;
  return signal.map((v,i) => v * 0.5 * (1 - Math.cos(2*Math.PI*i/(N-1))));
}

function bitReversal(re, im, N) {
  let j = 0;
  for (let i = 1; i < N; i++) {
    let bit = N >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) { [re[i],re[j]]=[re[j],re[i]]; [im[i],im[j]]=[im[j],im[i]]; }
  }
}

function fftInPlace(re, im) {
  const N = re.length;
  bitReversal(re, im, N);
  for (let len=2; len<=N; len<<=1) {
    const half=len>>1, angStep=-2*Math.PI/len;
    const wRe=Math.cos(angStep), wIm=Math.sin(angStep);
    for (let i=0; i<N; i+=len) {
      let cRe=1, cIm=0;
      for (let k=0; k<half; k++) {
        const uRe=re[i+k], uIm=im[i+k];
        const vRe=re[i+k+half]*cRe-im[i+k+half]*cIm;
        const vIm=re[i+k+half]*cIm+im[i+k+half]*cRe;
        re[i+k]=uRe+vRe; im[i+k]=uIm+vIm;
        re[i+k+half]=uRe-vRe; im[i+k+half]=uIm-vIm;
        const nRe=cRe*wRe-cIm*wIm; cIm=cRe*wIm+cIm*wRe; cRe=nRe;
      }
    }
  }
}

function computeFFT(signal) {
  const windowed = hannWindow(signal);
  const Nfft = nextPow2(windowed.length) * 4;
  const re = new Float64Array(Nfft);
  const im = new Float64Array(Nfft);
  for (let i=0; i<windowed.length; i++) re[i]=windowed[i];
  fftInPlace(re, im);
  const half = Nfft >> 1;
  const mag = new Float64Array(half);
  for (let k=0; k<half; k++) mag[k]=Math.sqrt(re[k]*re[k]+im[k]*im[k])*2/Nfft;
  return { mag, delta_f: null, Nfft };
}

function getAmpAtFreq(mag, freq, delta_f, win=4) {
  if (freq <= 0) return 0;
  const k = Math.round(freq / delta_f);
  let max = 0;
  for (let i=Math.max(0,k-win); i<=Math.min(mag.length-1,k+win); i++) {
    if (mag[i] > max) max = mag[i];
  }
  return max;
}

function detectFs(samples, fe, fsHint=0) {
  const N = Math.min(nextPow2(Math.min(samples.length, 32768)), samples.length);
  const sl = samples.slice(0, N);
  const mean = sl.reduce((a,b)=>a+b,0)/N;
  const c = sl.map(v=>v-mean);
  const Nfft = nextPow2(N);
  const re = new Float64Array(Nfft); const im = new Float64Array(Nfft);
  const win = hannWindow(c);
  for (let i=0; i<win.length; i++) re[i]=win[i];
  fftInPlace(re, im);
  const mag = new Float64Array(Nfft>>1);
  const delta_f = fe/Nfft;
  for (let k=0; k<mag.length; k++) mag[k]=Math.sqrt(re[k]*re[k]+im[k]*im[k])*2/Nfft;
  const searchPeak = (fc, bw=5) => {
    const lo=Math.max(0,Math.floor((fc-bw)/delta_f)), hi=Math.min(mag.length-1,Math.ceil((fc+bw)/delta_f));
    let bk=lo, ba=0;
    for (let k=lo; k<=hi; k++) if (mag[k]>ba){ba=mag[k];bk=k;}
    return { freq: +(bk*delta_f).toFixed(2), amp: ba };
  };
  if (fsHint > 0) {
    const p = searchPeak(fsHint, 5);
    return { fs: +p.freq, grid: fsHint+"Hz (manuel)", confidence: 100 };
  }
  const p50=searchPeak(50), p60=searchPeak(60);
  const dom = p50.amp>=p60.amp ? {...p50,grid:"50Hz"} : {...p60,grid:"60Hz"};
  const noise = Array.from(mag).reduce((s,v)=>s+v,0)/mag.length;
  const valid = dom.amp > noise*6;
  return { fs: valid ? +dom.freq.toFixed(2) : 50, grid: valid?dom.grid:"unknown", confidence: valid?Math.round(dom.amp/(dom.amp+(p50.amp>=p60.amp?p60.amp:p50.amp)+1e-12)*100):0 };
}

function buildTimeSeries(samples, fe, maxPts=4000) {
  const step = Math.max(1, Math.floor(samples.length/maxPts));
  const out = [];
  for (let i=0; i<samples.length; i+=step) out.push({t:+(i/fe).toFixed(5), I:+samples[i].toFixed(4)});
  return out;
}

function buildFFTSpectrum(samples, fe, fs) {
  const MAX_FFT = 131072;
  const sl = samples.length > MAX_FFT ? samples.slice(0, MAX_FFT) : samples;
  let mean = 0;
  for (let i=0;i<sl.length;i++) mean+=sl[i];
  mean /= sl.length;
  const centered = [];
  for (let i=0;i<sl.length;i++) centered.push(sl[i]-mean);
  const Nfft = nextPow2(centered.length) * 4;
  const delta_f = fe/Nfft;
  const re = new Float64Array(Nfft); const im = new Float64Array(Nfft);
  const win = hannWindow(centered);
  for (let i=0; i<win.length; i++) re[i]=win[i];
  fftInPlace(re, im);
  const mag = new Float64Array(Nfft>>1);
  for (let k=0; k<mag.length; k++) mag[k]=Math.sqrt(re[k]*re[k]+im[k]*im[k])*2/Nfft;
  const maxHz = Math.min(3000, fe/2);
  const kMax = Math.floor(maxHz/delta_f);
  const freqs = [];
  for (let k=0; k<=Math.min(kMax, mag.length-1); k++) freqs.push({f:+(k*delta_f).toFixed(2), amp:+mag[k].toFixed(7)});
  const A_fs = getAmpAtFreq(mag, fs, delta_f, 5);
  return { mag, delta_f, freqs, A_fs };
}

function findRealPeak(mag, delta_f, fTheory, searchBw) {
  if (fTheory <= 0) return { f: fTheory, amp: 0 };
  const bwBins = Math.max(3, Math.round(searchBw / delta_f));
  const kCenter = Math.round(fTheory / delta_f);
  const lo = Math.max(0, kCenter - bwBins);
  const hi = Math.min(mag.length - 1, kCenter + bwBins);
  let bestK = kCenter, bestAmp = 0;
  for (let k = lo; k <= hi; k++) {
    if (mag[k] > bestAmp) { bestAmp = mag[k]; bestK = k; }
  }
  return { f: +(bestK * delta_f).toFixed(3), amp: bestAmp };
}

function extractPeaks(mag, delta_f, fMin, fMax, topN=10) {
  const lo = Math.max(0, Math.floor(fMin/delta_f));
  const hi = Math.min(mag.length-1, Math.ceil(fMax/delta_f));
  const peaks = [];
  for (let k=lo+1; k<hi-1; k++) {
    if (mag[k]>mag[k-1] && mag[k]>mag[k+1]) {
      peaks.push({ f:+(k*delta_f).toFixed(3), amp:mag[k] });
    }
  }
  peaks.sort((a,b)=>b.amp-a.amp);
  return peaks.slice(0, topN);
}

function analyzeBands(mag, delta_f, fe, fs, fr, NL, Nb_r, Nb_b, A_fs) {
  const maxFreq = fe / 2;
  const bandSize = 500;
  const nbBands = Math.ceil(maxFreq / bandSize);
  const bands = [];
  const g = Math.max(0.001, Math.min(0.1, 1 - fr/(fs/Math.round(fs/fr))));
  const faultFreqs = [];
  for (let k=1;k<=3;k++) for (const s of [-1,+1]) {
    const f=fs+s*k*NL*fr; if(f>0) faultFreqs.push({f,name:"Turbine",formula:`fs${s>0?"+":"-"}${k}·NL·fr`});
  }
  for (let k=1;k<=3;k++) for (const s of [-1,+1]) {
    const f=fs+s*k*0.6*Nb_r*fr; if(f>0) faultFreqs.push({f,name:"Roulement Int.",formula:`fs${s>0?"+":"-"}${k}×0.6·Nb·fr`});
  }
  for (let k=1;k<=3;k++) for (const s of [-1,+1]) {
    const f=fs+s*k*0.4*Nb_r*fr; if(f>0) faultFreqs.push({f,name:"Roulement Ext.",formula:`fs${s>0?"+":"-"}${k}×0.4·Nb·fr`});
  }
  for (let k=1;k<=5;k++) for (const s of [-1,+1]) {
    const f=fs+s*k*fr; if(f>0) faultFreqs.push({f,name:"Désalignement",formula:`fs${s>0?"+":"-"}${k}·fr`});
  }
  for (const s of [-1,+1]) {
    const f=fs+s*Nb_b*fr; if(f>0) faultFreqs.push({f,name:"RSH",formula:`fs${s>0?"+":"-"}Nb_b·fr`});
  }
  for (let k=1;k<=2;k++) for (const s of [-1,+1]) {
    const f=fs+s*2*k*g*fs; if(f>0) faultFreqs.push({f,name:"RBFH",formula:`fs${s>0?"+":"-"}${2*k}g·fs`});
  }
  for (let b=0; b<nbBands; b++) {
    const fMin = b * bandSize;
    const fMax = Math.min((b+1) * bandSize, maxFreq);
    const peaks = extractPeaks(mag, delta_f, fMin, fMax, 8);
    const matches = [];
    for (const peak of peaks) {
      if (A_fs <= 0) continue;
      const ratio = +(peak.amp / A_fs * 100).toFixed(3);
      if (ratio < 0.1) continue;
      let bestMatch = null, bestDist = Infinity;
      for (const ff of faultFreqs) {
        if (ff.f < fMin || ff.f > fMax) continue;
        const dist = Math.abs(peak.f - ff.f);
        if (dist < bestDist && dist < 5) { bestDist = dist; bestMatch = ff; }
      }
      matches.push({ f: peak.f, amp: +peak.amp.toFixed(6), ratio, matched: bestMatch ? bestMatch.name : null, formula: bestMatch ? bestMatch.formula : null, dist: bestMatch ? +bestDist.toFixed(3) : null });
    }
    const maxRatio = matches.length > 0 ? Math.max(...matches.map(m=>m.ratio)) : 0;
    const status = maxRatio < 1 ? {label:"Normal",icon:"🟢",color:T.green}
                 : maxRatio < 5 ? {label:"Surveillance",icon:"🟡",color:T.yellow}
                 : {label:"Critique",icon:"🔴",color:T.red};
    bands.push({ fMin, fMax, peaks: matches, maxRatio: +maxRatio.toFixed(3), ...status });
  }
  return { bands, g: +(g).toFixed(4) };
}

function computeFaultAnalysis(mag, delta_f, fs, fr, NL, Nb_r, Nb_b, fe=50000) {
  const A_fs = getAmpAtFreq(mag, fs, delta_f, 5);
  const g = (Math.round(fs/fr*fr) !== 0) ? Math.max(0.001, Math.min(0.1, 1 - fr/(fs/Math.round(fs/fr)))) : 0.03;
  const searchBw = Math.max(delta_f * 5, 2);

  const getRatio = (freq) => {
    if (freq <= 0 || A_fs <= 0) return 0;
    const peak = findRealPeak(mag, delta_f, Math.abs(freq), searchBw);
    return +(peak.amp / A_fs * 100).toFixed(3);
  };

  const getRealFreq = (freq) => {
    if (freq <= 0) return freq;
    return findRealPeak(mag, delta_f, Math.abs(freq), searchBw).f;
  };

  const classify = (ratio) => {
    if (ratio < 1)  return { label:"Normal",      color:T.green,  level:0, icon:"🟢" };
    if (ratio < 5)  return { label:"Surveillance", color:T.yellow, level:1, icon:"🟡" };
    return              { label:"Critique",     color:T.red,    level:2, icon:"🔴" };
  };

  const calcConfidence = (freqs, threshold=0.5) => {
    const confirmed = freqs.filter(f => f.ratio >= threshold);
    const orders = [...new Set(confirmed.map(f => f.v || 1))];
    const n = orders.length;
    if (n >= 3) return 95;
    if (n === 2) return 70;
    if (n === 1) return 40;
    return 0;
  };

  const defauts = [];
  const feMax = fe / 2;

  const buildFaultFreqs = (label_fn, freq_fn, vMin=1, vMax=5) => {
    const freqs = [];
    for (let v=vMin; v<=vMax; v++) {
      for (const sign of [-1,+1]) {
        const fTh = Math.abs(freq_fn(v, sign));
        if (fTh > 0 && fTh <= feMax) {
          const searchBw = Math.max(delta_f * 3, fTh * 0.02);
          const peak = findRealPeak(mag, delta_f, fTh, searchBw);
          const ratio = A_fs > 0 ? +(peak.amp / A_fs * 100).toFixed(3) : 0;
          if (ratio > 0.01) {
            freqs.push({ label:label_fn(v,sign), f:peak.f, fTh:+fTh.toFixed(2), ratio, v });
          }
        }
      }
    }
    freqs.sort((a,b)=>b.ratio-a.ratio);
    return freqs.slice(0, 20);
  };

  // 1. Turbine — v=1..5, k=1..3
  const turbineFreqs = [];
  for (let k=1; k<=3; k++) {
    turbineFreqs.push(...buildFaultFreqs(
      (v,s)=>`${v}·fs${s>0?"+":"-"}${k}·NL·fr`,
      (v,s)=>Math.abs(v*fs + s*k*NL*fr),
      1, 5
    ));
  }
  turbineFreqs.sort((a,b)=>b.ratio-a.ratio);
  const turbineTop = turbineFreqs.slice(0,20);
  const turbineMax = turbineTop.length ? turbineTop[0].ratio : 0;
  const turbineConf = calcConfidence(turbineTop);
  defauts.push({ name:"Turbine", icon:"⚙️", formula:"v·fs ± k·NL·fr", color:T.teal, freqs:turbineTop, maxRatio:turbineMax, confidence:turbineConf, ...classify(turbineMax) });

  // 2. Roulement intérieur — v=1..5, k=1..3
  const bagintFreqs = [];
  for (let k=1; k<=3; k++) {
    bagintFreqs.push(...buildFaultFreqs(
      (v,s)=>`${v}·fs${s>0?"+":"-"}${k}×0.6·Nb·fr`,
      (v,s)=>Math.abs(v*fs + s*k*0.6*Nb_r*fr),
      1, 5
    ));
  }
  bagintFreqs.sort((a,b)=>b.ratio-a.ratio);
  const bagintTop = bagintFreqs.slice(0,20);
  const bagintMax = bagintTop.length ? bagintTop[0].ratio : 0;
  const bagintConf = calcConfidence(bagintTop);
  defauts.push({ name:"Roulement Intérieur", icon:"🔩", formula:"v·fs ± k×0.6·Nb·fr", color:T.blue, freqs:bagintTop, maxRatio:bagintMax, confidence:bagintConf, ...classify(bagintMax) });

  // 3. Roulement extérieur — v=1..5, k=1..3
  const bagextFreqs = [];
  for (let k=1; k<=3; k++) {
    bagextFreqs.push(...buildFaultFreqs(
      (v,s)=>`${v}·fs${s>0?"+":"-"}${k}×0.4·Nb·fr`,
      (v,s)=>Math.abs(v*fs + s*k*0.4*Nb_r*fr),
      1, 5
    ));
  }
  bagextFreqs.sort((a,b)=>b.ratio-a.ratio);
  const bagextTop = bagextFreqs.slice(0,20);
  const bagextMax = bagextTop.length ? bagextTop[0].ratio : 0;
  const bagextConf = calcConfidence(bagextTop);
  defauts.push({ name:"Roulement Extérieur", icon:"🔩", formula:"v·fs ± k×0.4·Nb·fr", color:T.purple, freqs:bagextTop, maxRatio:bagextMax, confidence:bagextConf, ...classify(bagextMax) });

  // 4. Désalignement — v=40..100, k=1 ثابت
  const desaligFreqs = buildFaultFreqs(
    (v,s)=>`${v}·fs${s>0?"+":"-"}1·fr`,
    (v,s)=>Math.abs(v*fs + s*1*fr),
    40, 100
  );
  desaligFreqs.sort((a,b)=>b.ratio-a.ratio);
  const desaligTop = desaligFreqs.slice(0,20);
  const desaligMax = desaligTop.length ? desaligTop[0].ratio : 0;
  const desaligConf = calcConfidence(desaligTop);
  defauts.push({ name:"Désalignement", icon:"↔️", formula:"v·fs ± k·fr (k=1)", color:T.orange, freqs:desaligTop, maxRatio:desaligMax, confidence:desaligConf, ...classify(desaligMax) });

  // 5. EFH — v=1..5, k=1 ثابت
  const efhFreqs = buildFaultFreqs(
    (v,s)=>`${v}·fs${s>0?"+":"-"}1·fr (EFH)`,
    (v,s)=>Math.abs(v*fs + s*1*fr),
    1, 5
  );
  efhFreqs.sort((a,b)=>b.ratio-a.ratio);
  const efhTop = efhFreqs.slice(0,20);
  const efhMax = efhTop.length ? efhTop[0].ratio : 0;
  const efhConf = calcConfidence(efhTop);
  defauts.push({ name:"Excentricité (EFH)", icon:"🔄", formula:"v·fs ± k·fr (k=1)", color:T.accent, freqs:efhTop, maxRatio:efhMax, confidence:efhConf, ...classify(efhMax) });

  // 6. RSH — v=1..5, k=1
  const rshFreqs = buildFaultFreqs(
    (v,s)=>`${v}·fs${s>0?"+":"-"}Nb_b·fr`,
    (v,s)=>Math.abs(v*fs + s*Nb_b*fr),
    1, 5
  );
  rshFreqs.sort((a,b)=>b.ratio-a.ratio);
  const rshTop = rshFreqs.slice(0,20);
  const rshMax = rshTop.length ? rshTop[0].ratio : 0;
  const rshConf = calcConfidence(rshTop);
  defauts.push({ name:"RSH (Encoches)", icon:"🧲", formula:"v·fs ± Nb_b·fr", color:T.green, freqs:rshTop, maxRatio:rshMax, confidence:rshConf, ...classify(rshMax) });

  // 7. RBFH — v=1..5, k=1..2
  const rbfhFreqs = [];
  for (let k=1; k<=2; k++) {
    rbfhFreqs.push(...buildFaultFreqs(
      (v,s)=>`${v}·fs${s>0?"+":"-"}${2*k}·g·fs`,
      (v,s)=>Math.abs(v*fs + s*2*k*g*fs),
      1, 5
    ));
  }
  rbfhFreqs.sort((a,b)=>b.ratio-a.ratio);
  const rbfhTop = rbfhFreqs.slice(0,20);
  const rbfhMax = rbfhTop.length ? rbfhTop[0].ratio : 0;
  const rbfhConf = calcConfidence(rbfhTop);
  defauts.push({ name:"RBFH (Cassure barres)", icon:"💥", formula:"v·fs ± 2k·g·fs", color:T.red, freqs:rbfhTop, maxRatio:rbfhMax, confidence:rbfhConf, ...classify(rbfhMax) });

  return { defauts, A_fs: +A_fs.toFixed(6), g: +g.toFixed(4) };
}

// ── CSV Parser ──────────────────────────────────────────────────────────────
function parseSamples(text) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  let owonMode=false, iaMode=false, dataStart=0, ch1Col=1, iaCol=1, timeCol=0;
  for (let i=0; i<Math.min(15,lines.length); i++) {
    const lower = lines[i].toLowerCase();
    if (lower.includes("time_s") && lower.includes("ia")) {
      iaMode=true; dataStart=i+1;
      const headers=lines[i].split(",");
      timeCol=headers.findIndex(h=>h.trim().toLowerCase()==="time_s");
      iaCol=headers.findIndex(h=>h.trim().toLowerCase()==="ia");
      if (timeCol<0) timeCol=0;
      if (iaCol<0) iaCol=1;
      break;
    }
    if (lower.includes("ch1_voltage") || (lower.includes("ch1") && lines[i].includes(","))) {
      owonMode=true; dataStart=i+1;
      const headers=lines[i].split(",");
      ch1Col=headers.findIndex(h=>h.toLowerCase().includes("ch1"));
      if (ch1Col<0) ch1Col=1;
      break;
    }
  }
  const samples=[];
  let dtSum=0, dtCount=0, prevTime=null;
  for (let i=dataStart; i<lines.length; i++) {
    const parts=lines[i].split(/[,;\t]/);
    if (iaMode) {
      const t=parseFloat(parts[timeCol]?.trim());
      if (!isNaN(t)) {
        if (prevTime!==null && dtCount<200) { dtSum+=(t-prevTime); dtCount++; }
        prevTime=t;
      }
      const v=parseFloat(parts[iaCol]?.trim());
      if (!isNaN(v)&&isFinite(v)) samples.push(v);
    } else if (owonMode) {
      if (i===dataStart && parts.length>0) {
        const t0=parseFloat(parts[0]);
        if (!isNaN(t0)) prevTime=t0;
      } else if (prevTime!==null && dtCount<100) {
        const t=parseFloat(parts[0]);
        if (!isNaN(t)) { dtSum+=(t-prevTime); dtCount++; prevTime=t; }
      }
      const rawMv=parseFloat(parts[ch1Col]?.trim());
      if (isNaN(rawMv)||!isFinite(rawMv)) continue;
      const cleanMv=Math.round(rawMv/ADC_STEP)*ADC_STEP;
      const amp=cleanMv*OWON_MV_TO_A;
      if (!isNaN(amp)&&isFinite(amp)) samples.push(amp);
    } else {
      const v=parseFloat(parts[0]?.trim());
      if (!isNaN(v)&&isFinite(v)) samples.push(v);
    }
  }
  const fe_est = dtCount>5 ? Math.round(1/(dtSum/dtCount)) : 50000;
  return { samples, fe_est: Math.max(1000, Math.min(200000, fe_est)) };
}

// ── UI Components ────────────────────────────────────────────────────────────
function Card({ children, style={}, color, noHover=false }) {
  const c = color||T.accent;
  return (
    <div className={noHover?"":"card-hover"} style={{
      background: `linear-gradient(160deg, ${T.panel} 0%, ${T.panel2} 100%)`,
      border: `1px solid ${T.border}`,
      borderRadius: 14,
      padding: 20,
      position: "relative",
      overflow: "hidden",
      ...style,
    }}>
      {/* Top glow line */}
      <div style={{position:"absolute",top:0,left:20,right:20,height:"1px",background:`linear-gradient(90deg,transparent,${c}50,transparent)`,pointerEvents:"none"}}/>
      {/* Left accent bar */}
      <div style={{position:"absolute",top:12,left:0,width:3,height:"calc(100% - 24px)",background:`linear-gradient(180deg,${c}90,${c}20)`,borderRadius:"0 3px 3px 0"}}/>
      <div style={{paddingLeft:14}}>{children}</div>
    </div>
  );
}

function Label({ children, color }) {
  const c = color||T.accent;
  return (
    <div style={{
      color: c,
      fontSize: 10,
      fontFamily: "'Barlow Condensed', sans-serif",
      fontWeight: 700,
      letterSpacing: "0.12em",
      marginBottom: 16,
      textTransform: "uppercase",
      display: "flex",
      alignItems: "center",
      gap: 10,
    }}>
      <div style={{width:4,height:4,borderRadius:"50%",background:c,flexShrink:0,boxShadow:`0 0 6px ${c}`}}/>
      {children}
      <div style={{flex:1,height:"1px",background:`linear-gradient(90deg,${c}30,transparent)`}}/>
    </div>
  );
}

function RatioBar({ ratio, color }) {
  const pct = Math.min(100, ratio*5);
  return (
    <div style={{height:6,borderRadius:3,background:`${T.borderHi}`,overflow:"hidden",minWidth:80}}>
      <div className="sev-bar" style={{
        height:"100%", borderRadius:3, width:`${pct}%`, background:color,
        boxShadow: ratio>=5 ? `0 0 8px ${color}80` : ratio>=1 ? `0 0 4px ${color}60` : "none"
      }}/>
    </div>
  );
}

function SeverityBadge({ label, color }) {
  return (
    <div style={{
      display:"inline-flex", alignItems:"center", gap:5,
      padding:"3px 10px", borderRadius:20,
      background:`${color}14`, border:`1px solid ${color}40`,
    }}>
      <div style={{width:5,height:5,borderRadius:"50%",background:color,boxShadow:`0 0 4px ${color}`}}/>
      <span style={{color,fontSize:9,fontWeight:700,fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:"0.1em"}}>{label.toUpperCase()}</span>
    </div>
  );
}

// ── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("mcsa13");
  const [splash, setSplash] = useState(true);
  const [splashOut, setSplashOut] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Enter" && splash && !splashOut) {
        setSplashOut(true);
        setTimeout(() => setSplash(false), 600);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [splash, splashOut]);

  const [params, setParams] = useState({ fs:0, fr:19.89, NL:7, Nb_r:8, Nb_b:28, ct:1 });
  const [draft, setDraft] = useState({ fs:0, fr:19.89, NL:7, Nb_r:8, Nb_b:28, ct:1 });
  const paramsChanged = JSON.stringify(draft) !== JSON.stringify(params);

  const [fileA, setFileA] = useState(null);
  const [fftA, setFftA]   = useState(null);
  const [timeA, setTimeA] = useState(null);
  const [faultA, setFaultA] = useState(null);
  const [bandsA, setBandsA] = useState(null);
  const [bandsB, setBandsB] = useState(null);
  const [gridA, setGridA]   = useState(null);
  const [loadingA, setLoadingA] = useState(false);

  const [fileB, setFileB] = useState(null);
  const [fftB, setFftB]   = useState(null);
  const [timeB, setTimeB] = useState(null);
  const [faultB, setFaultB] = useState(null);
  const [loadingB, setLoadingB] = useState(false);

  const [activeFile, setActiveFile] = useState("A");
  const [error, setError] = useState("");

  const [aiReport, setAiReport] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [sessionName, setSessionName] = useState("");

  const buildPDFandOpen = (report) => {
    const name = sessionName || "";
    const date = new Date().toLocaleString("fr-FR");
    const globalLvl = Math.max(...faultA.defauts.map(d=>d.level));
    const globalLabel = globalLvl===0?"NORMAL":globalLvl===1?"SURVEILLANCE":"CRITIQUE";
    const globalColor = globalLvl===0?"#00ff9d":globalLvl===1?"#ffe040":"#ff2d55";

    const faultRows = faultA.defauts.map(d=>
      `<tr style="border-bottom:1px solid #1a3550;">
        <td style="padding:10px 14px;">${d.icon} <span style="color:${d.color};font-weight:700;">${d.name}</span></td>
        <td style="padding:10px 14px;font-family:monospace;font-size:11px;color:#3a6080;">${d.formula}</td>
        <td style="padding:10px 14px;font-family:monospace;font-weight:700;font-size:16px;color:${d.color};">${d.maxRatio}%</td>
        <td style="padding:10px 14px;"><span style="background:${d.color}22;border:1px solid ${d.color}55;border-radius:12px;padding:3px 12px;color:${d.color};font-size:11px;font-weight:700;">${d.label.toUpperCase()}</span></td>
        <td style="padding:10px 14px;"><div style="background:#0c1420;border-radius:4px;height:8px;width:120px;"><div style="height:100%;width:${Math.min(100,d.maxRatio*5)}%;background:${d.color};border-radius:4px;"></div></div></td>
      </tr>`
    ).join("");

    const critSection = faultA.defauts.filter(d=>d.level>=1).length>0
      ? faultA.defauts.filter(d=>d.level>=1).map(d=>
          `<div style="background:${d.color}0a;border-left:4px solid ${d.color};border-radius:8px;padding:12px 16px;margin-bottom:10px;">
            <div style="font-weight:700;color:${d.color};margin-bottom:4px;">${d.icon} ${d.name} — ${d.maxRatio}% (${d.label})</div>
            <div style="color:#3a6080;font-size:11px;font-family:monospace;">${d.formula}</div>
            <div style="margin-top:6px;">${d.freqs.filter(f=>f.ratio>=1).slice(0,5).map(f=>`<span style="display:inline-block;background:${d.color}15;border-radius:5px;padding:2px 8px;margin:2px;font-family:monospace;font-size:10px;color:${d.color};">${f.f}Hz (${f.ratio}%)</span>`).join("")}</div>
          </div>`
        ).join("")
      : `<div style="background:#00ff9d0a;border:1px solid #00ff9d30;border-radius:8px;padding:14px 20px;color:#00ff9d;font-weight:700;">&#10003; Aucun défaut critique — Moteur en état normal</div>`;

    const aiSection = report
      ? `<div style="page-break-before:always;padding-top:40px;">
          <h2 style="font-size:13px;letter-spacing:0.12em;color:#ffe040;margin-bottom:18px;border-bottom:1px solid #ffe04030;padding-bottom:8px;">&#10024; RAPPORT IA — DIAGNOSTIC CLAUDE</h2>
          <div style="color:#c8e8f8;font-size:13px;line-height:2;white-space:pre-wrap;">${report.replace(/\*\*([^*]+)\*\*/g,"<strong style='color:#e8f8ff;'>$1</strong>")}</div>
        </div>`
      : "";

    const paramGrid = [
      {l:"Fe — Échantillonnage", v:`${fileA?.fe ? fileA.fe.toLocaleString() : "auto"} Hz`},
      {l:"fs — Alimentation",    v:`${fftA?.fs||params.fs} Hz`},
      {l:"fr — Rotation rotor", v:`${params.fr} Hz`},
      {l:"g — Glissement",      v:`${faultA.g}`},
      {l:"A_fs — Fondamentale", v:`${faultA.A_fs.toExponential(3)} A`},
      {l:"NL — Pales turbine",  v:`${params.NL}`},
      {l:"Nb — Billes roulmt.", v:`${params.Nb_r}`},
      {l:"Nb — Barres rotoriq.",v:`${params.Nb_b}`},
    ].map(({l,v})=>`<div style="background:#060b12;border:1px solid #0f2030;border-radius:8px;padding:10px 14px;"><div style="color:#3a6080;font-size:9px;font-family:monospace;margin-bottom:4px;">${l.toUpperCase()}</div><div style="color:#00d4ff;font-family:monospace;font-weight:700;font-size:14px;">${v}</div></div>`).join("");

    const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/><title>MotorSense — Rapport MCSA</title>
<style>*{box-sizing:border-box;margin:0;padding:0;}body{background:#020408;color:#c8e8f8;font-family:'Segoe UI',Arial,sans-serif;font-size:13px;line-height:1.6;}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}.no-print{display:none!important;}}.page{max-width:920px;margin:0 auto;padding:48px 56px;}table{border-collapse:collapse;}</style>
</head><body><div class="page">

<div style="border-bottom:1px solid #0f2030;padding-bottom:28px;margin-bottom:32px;display:flex;justify-content:space-between;align-items:flex-start;">
  <div>
    <div style="font-weight:900;font-size:32px;letter-spacing:0.08em;">MOTOR<span style="color:#00d4ff;">SENSE</span></div>
    <div style="font-family:monospace;font-size:9px;letter-spacing:0.2em;color:#3a6080;margin-top:4px;">RAPPORT DE DIAGNOSTIC MCSA · v14</div>
    <div style="margin-top:14px;color:#3a6080;font-size:11px;font-family:monospace;">Station OTHMEN GUEDIRI · El Oued, Algérie</div>
    ${name ? `<div style="color:#ff7240;font-size:12px;font-family:monospace;margin-top:4px;">${name}</div>` : ""}
  </div>
  <div style="text-align:right;">
    <div style="background:${globalColor}15;border:1px solid ${globalColor}50;border-radius:12px;padding:10px 22px;">
      <div style="color:${globalColor};font-weight:900;font-size:18px;letter-spacing:0.12em;">${globalLabel}</div>
    </div>
    <div style="color:#3a6080;font-size:10px;font-family:monospace;margin-top:8px;">${date}</div>
  </div>
</div>

<div style="margin-bottom:28px;">
  <h2 style="font-size:12px;letter-spacing:0.14em;color:#00d4ff;margin-bottom:14px;border-bottom:1px solid #00d4ff15;padding-bottom:7px;">① PARAMÈTRES</h2>
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;">${paramGrid}</div>
</div>

<div style="margin-bottom:28px;">
  <h2 style="font-size:12px;letter-spacing:0.14em;color:#00d4ff;margin-bottom:14px;border-bottom:1px solid #00d4ff15;padding-bottom:7px;">② TABLEAU DES DÉFAUTS — A_défaut / A_fs × 100%</h2>
  <table style="width:100%;background:#060b12;border:1px solid #0f2030;border-radius:8px;overflow:hidden;">
    <thead><tr style="background:#091018;border-bottom:1px solid #1a3550;">
      <th style="padding:9px 14px;text-align:left;font-size:9px;letter-spacing:0.12em;color:#3a6080;">DÉFAUT</th>
      <th style="padding:9px 14px;text-align:left;font-size:9px;letter-spacing:0.12em;color:#3a6080;">FORMULE</th>
      <th style="padding:9px 14px;text-align:left;font-size:9px;letter-spacing:0.12em;color:#3a6080;">RATIO</th>
      <th style="padding:9px 14px;text-align:left;font-size:9px;letter-spacing:0.12em;color:#3a6080;">STATUT</th>
      <th style="padding:9px 14px;text-align:left;font-size:9px;letter-spacing:0.12em;color:#3a6080;">BARRE</th>
    </tr></thead>
    <tbody>${faultRows}</tbody>
  </table>
</div>

<div style="margin-bottom:28px;">
  <h2 style="font-size:12px;letter-spacing:0.14em;color:#00d4ff;margin-bottom:14px;border-bottom:1px solid #00d4ff15;padding-bottom:7px;">③ SYNTHÈSE</h2>
  ${critSection}
</div>

${aiSection}

<div style="margin-top:48px;padding-top:14px;border-top:1px solid #0f2030;display:flex;justify-content:space-between;align-items:center;">
  <div style="font-weight:900;font-size:13px;letter-spacing:0.08em;">MOTOR<span style="color:#00d4ff;">SENSE</span></div>
  <div style="color:#3a6080;font-size:9px;font-family:monospace;">Diagnostic MCSA · Génie Électrique · Univ. Mohamed Khider, Biskra</div>
  <div style="color:#3a6080;font-size:9px;font-family:monospace;">${date}</div>
</div>
</div>

<div class="no-print" style="position:fixed;bottom:24px;right:24px;display:flex;gap:10px;z-index:999;">
  <button onclick="window.print()" style="background:#00d4ff;color:#020408;border:none;border-radius:10px;padding:12px 28px;font-weight:900;font-size:14px;cursor:pointer;">🖨 IMPRIMER / PDF</button>
  <button onclick="window.close()" style="background:#0f2030;color:#3a6080;border:1px solid #1a3550;border-radius:10px;padding:12px 18px;font-size:12px;cursor:pointer;">✕</button>
</div>
</body></html>`;

    const win = window.open("","_blank");
    if(win){win.document.write(html);win.document.close();}
  };

  const generateFullReport = async () => {
    if (!faultA) return;
    setPdfLoading(true);
    setAiError("");
    // Step 1: generate AI report
    const summary = faultA.defauts.map(d=>`${d.name}: ratio_max=${d.maxRatio}% → ${d.label}`).join("\n");
    const prompt = `Tu es un expert en diagnostic de moteurs électriques par MCSA (Motor Current Signature Analysis).
Analyse les résultats suivants d'un moteur asynchrone (pompe centrifuge, Station de Déminéralisation OTHMEN GUEDIRI, El Oued, Algérie):

Paramètres: fs=${params.fr ? fftA?.fs : 50}Hz, fr=${params.fr}Hz, g=${faultA.g} (glissement)
A_fs (amplitude fondamentale) = ${faultA.A_fs} A

Résultats des défauts (ratio = A_défaut/A_fs × 100%):
${summary}

Seuils appliqués: <1% Normal | 1-5% Surveillance | >5% Critique

Génère un rapport de diagnostic en FRANÇAIS avec:
1. **Résumé de l'état du moteur**
2. **Analyse détaillée** des défauts détectés (ratio > 1%)
3. **Défauts critiques** (ratio > 5%) avec recommandations immédiates
4. **Actions préventives** recommandées
5. **Conclusion**

Sois précis et scientifique. Utilise les chiffres exacts.`;
    let report = "";
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ model:"claude-sonnet-4-6", max_tokens:1000, messages:[{role:"user",content:prompt}] }),
      });
      if (!res.ok) { const err=await res.json().catch(()=>({})); throw new Error(err?.error?.message||`HTTP ${res.status}`); }
      const data = await res.json();
      report = data.content?.[0]?.text||"Réponse vide.";
      setAiReport(report);
    } catch(e) {
      setAiError(e.message);
      setPdfLoading(false);
      return;
    }
    // Step 2: open PDF
    buildPDFandOpen(report);
    setPdfLoading(false);
  };

  // ── History ──────────────────────────────────────────────────────────────
  const HIST_KEY = "motorsense_v14_history";
  const loadHistory = () => { try { const h = localStorage.getItem(HIST_KEY); return h ? JSON.parse(h) : []; } catch { return []; } };
  const [history, setHistory] = useState(loadHistory);
  const [histTab, setHistTab] = useState(null); // id of session being compared
  const saveToHistory = (entry) => {
    const h = loadHistory();
    const next = [entry, ...h].slice(0, 20); // keep last 20
    try { localStorage.setItem(HIST_KEY, JSON.stringify(next)); } catch {}
    setHistory(next);
  };

  const [xMinTime, setXMinTime] = useState(0);
  const [xMaxTime, setXMaxTime] = useState(10);
  const [yMinTime, setYMinTime] = useState("");
  const [yMaxTime, setYMaxTime] = useState("");
  const [xMinFFT, setXMinFFT] = useState(0);
  const [yMinFFT, setYMinFFT] = useState("");
  const [yMaxFFT, setYMaxFFT] = useState("");
  const [zoomTimeLeft, setZoomTimeLeft] = useState(null);
  const [zoomTimeRight, setZoomTimeRight] = useState(null);
  const [zoomTimeDomain, setZoomTimeDomain] = useState(null);
  const [isDraggingTime, setIsDraggingTime] = useState(false);
  const [zoomFFTLeft, setZoomFFTLeft] = useState(null);
  const [zoomFFTRight, setZoomFFTRight] = useState(null);
  const [zoomFFTDomain, setZoomFFTDomain] = useState(null);
  const [isDraggingFFT, setIsDraggingFFT] = useState(false);
  const [xMaxFFT, setXMaxFFT] = useState(25000);

  const activeFFT   = activeFile==="A" ? fftA : fftB;
  const activeFault = activeFile==="A" ? faultA : faultB;
  const activeBands = activeFile==="A" ? bandsA : bandsB;
  const activeTime  = activeFile==="A" ? timeA : timeB;
  const activeGrid  = activeFile==="A" ? gridA : null;
  const activeInfo  = activeFile==="A" ? fileA : fileB;
  const activeColor = activeFile==="A" ? T.teal : T.purple;

  const analyzeFile = useCallback(async (text, slot) => {
    const { samples: rawSamples, fe_est } = parseSamples(text);
    if (rawSamples.length < 100) throw new Error("Fichier trop court (min 100 points)");
    const ct = draft.ct > 0 ? draft.ct : 1;
    const samples = ct !== 1 ? rawSamples.map(v => v / ct) : rawSamples;
    const { fr, NL, Nb_r, Nb_b } = draft;
    const fe_used = fe_est;
    const gridInfo = detectFs(samples, fe_used, draft.fs > 0 ? draft.fs : 0);
    const fs_used  = gridInfo.fs;
    const timeSeries = buildTimeSeries(samples, fe_used);
    const { mag, delta_f, freqs, A_fs } = buildFFTSpectrum(samples, fe_used, fs_used);
    const faultResult = computeFaultAnalysis(mag, delta_f, fs_used, fr, NL, Nb_r, Nb_b, fe_used);
    let sMin=Infinity, sMax=-Infinity;
    for (let i=0;i<samples.length;i++){if(samples[i]<sMin)sMin=samples[i];if(samples[i]>sMax)sMax=samples[i];}
    const info = { totalSamples:samples.length, dur:+(samples.length/fe_used).toFixed(3), fe:fe_used, min:+sMin.toFixed(3), max:+sMax.toFixed(3) };
    if (slot==="A") {
      setGridA(gridInfo);
      setTimeA(timeSeries);
      setFftA({ freqs, delta_f, fs:fs_used, fr });
      setFaultA(faultResult);
      const bandsResult = analyzeBands(mag, delta_f, fe_used, fs_used, fr, NL, Nb_r, Nb_b, faultResult.A_fs);
      setBandsA(bandsResult);
      setFileA(info);
      setActiveFile("A");
      // Save to history
      saveToHistory({
        id: Date.now(),
        date: new Date().toLocaleString("fr-FR"),
        params: { ...draft },
        fault: faultResult,
        info,
        grid: gridInfo,
      });
    } else {
      setTimeB(timeSeries);
      setFftB({ freqs, delta_f, fs:fs_used, fr });
      setFaultB(faultResult);
      setBandsB(analyzeBands(mag, delta_f, fe_used, fs_used, fr, NL, Nb_r, Nb_b, faultResult.A_fs));
      setFileB(info);
      setActiveFile("B");
    }
  }, [params]);

  const handleUpload = (slot) => (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (slot==="A") setLoadingA(true); else setLoadingB(true);
    setError("");
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try { await analyzeFile(ev.target.result, slot); }
      catch(err) { setError(err.message); }
      finally { if(slot==="A") setLoadingA(false); else setLoadingB(false); }
    };
    reader.readAsText(file);
    e.target.value="";
  };

  const callAI = async () => {
    if (!faultA) return;
    setAiLoading(true); setAiReport(""); setAiError("");
    const summary = faultA.defauts.map(d=>`${d.name}: ratio_max=${d.maxRatio}% → ${d.label}`).join("\n");
    const prompt = `Tu es un expert en diagnostic de moteurs électriques par MCSA (Motor Current Signature Analysis).
Analyse les résultats suivants d'un moteur asynchrone (pompe centrifuge, Station de Déminéralisation OTHMEN GUEDIRI, El Oued, Algérie):

Paramètres: fs=${params.fr ? fftA?.fs : 50}Hz, fr=${params.fr}Hz, g=${faultA.g} (glissement)
A_fs (amplitude fondamentale) = ${faultA.A_fs} A

Résultats des défauts (ratio = A_défaut/A_fs × 100%):
${summary}

Seuils appliqués: <1% Normal | 1-5% Surveillance | >5% Critique

Génère un rapport de diagnostic en FRANÇAIS avec:
1. **Résumé de l'état du moteur**
2. **Analyse détaillée** des défauts détectés (ratio > 1%)
3. **Défauts critiques** (ratio > 5%) avec recommandations immédiates
4. **Actions préventives** recommandées
5. **Conclusion**

Sois précis et scientifique. Utilise les chiffres exacts.`;
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1000, messages:[{role:"user",content:prompt}] }),
      });
      if (!res.ok) { const err=await res.json().catch(()=>({})); throw new Error(err?.error?.message||`HTTP ${res.status}`); }
      const data = await res.json();
      setAiReport(data.content?.[0]?.text||"Réponse vide.");
    } catch(e) { setAiError(e.message); }
    setAiLoading(false);
  };

  const globalSeverity = activeFault ? Math.max(...activeFault.defauts.map(d=>d.level)) : -1;
  const criticalDefauts = activeFault ? activeFault.defauts.filter(d=>d.level>=1) : [];

  const inputStyle = (c=T.accent) => ({
    width:"100%", background:T.panel, border:`1px solid ${T.border}`, color:c,
    borderRadius:8, padding:"7px 11px", fontSize:12,
    fontFamily:"'IBM Plex Mono',monospace", transition:"border-color 0.2s, box-shadow 0.2s",
    outline:"none",
  });

  const chartInputStyle = (c=T.teal) => ({
    width:70, background:T.panel2, color:c, border:`1px solid ${T.border}`,
    borderRadius:6, padding:"3px 7px", fontSize:10, fontFamily:"'IBM Plex Mono',monospace",
  });

  return (
    <>
      <style>{css}</style>

      {/* ═══ SPLASH SCREEN ═══ */}
      {splash && (
        <div style={{
          position:"fixed", inset:0, zIndex:9999,
          background:T.bg,
          display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center",
          transition:"opacity 0.6s ease, transform 0.6s cubic-bezier(0.4,0,0.2,1)",
          opacity: splashOut ? 0 : 1,
          transform: splashOut ? "scale(1.04)" : "scale(1)",
          pointerEvents: splashOut ? "none" : "auto",
        }}>
          {/* Grid bg */}
          <div style={{position:"absolute",inset:0,backgroundImage:`linear-gradient(${T.accent}04 1px,transparent 1px),linear-gradient(90deg,${T.accent}04 1px,transparent 1px)`,backgroundSize:"40px 40px"}}/>
          {/* Glow */}
          <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:600,height:600,background:`radial-gradient(circle,${T.accent}08 0%,transparent 65%)`,pointerEvents:"none"}}/>

          <div style={{position:"relative",textAlign:"center",animation:"fadeIn 1s ease"}}>
            {/* Rings */}
            {[120,200,290].map((s,i)=>(
              <div key={i} style={{
                position:"absolute",top:"50%",left:"50%",
                width:s,height:s,transform:"translate(-50%,-50%)",
                borderRadius:"50%",
                border:`1px solid ${T.accent}${["30","18","0c"][i]}`,
                animation:`pulse ${2.5+i*0.5}s ease infinite`,
              }}/>
            ))}

            {/* Icon */}
            <div style={{
              width:64,height:64,borderRadius:16,margin:"0 auto 32px",
              background:`linear-gradient(135deg,${T.accent}20,${T.accent}08)`,
              border:`1px solid ${T.accent}50`,
              display:"flex",alignItems:"center",justifyContent:"center",
              boxShadow:`0 0 40px ${T.accent}25`,
              position:"relative",
            }}>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="12" stroke={T.accent} strokeWidth="1.5" strokeOpacity="0.5"/>
                <circle cx="16" cy="16" r="7"  stroke={T.accent} strokeWidth="1.5" strokeOpacity="0.7"/>
                <circle cx="16" cy="16" r="3"  fill={T.accent} fillOpacity="0.9"/>
                <line x1="16" y1="4"  x2="16" y2="9"  stroke={T.accent} strokeWidth="1.5" strokeOpacity="0.6"/>
                <line x1="28" y1="16" x2="23" y2="16" stroke={T.accent} strokeWidth="1.5" strokeOpacity="0.6"/>
                <line x1="16" y1="28" x2="16" y2="23" stroke={T.accent} strokeWidth="1.5" strokeOpacity="0.6"/>
                <line x1="4"  y1="16" x2="9"  y2="16" stroke={T.accent} strokeWidth="1.5" strokeOpacity="0.6"/>
              </svg>
              <div style={{position:"absolute",top:-3,right:-3,width:10,height:10,borderRadius:"50%",background:T.accent,boxShadow:`0 0 10px ${T.accent}`,animation:"pulse 2s infinite"}}/>
            </div>

            {/* Title */}
            <div style={{
              fontFamily:"'Barlow Condensed',sans-serif",
              fontWeight:800, fontSize:52, letterSpacing:"0.08em",
              color:T.textHi, lineHeight:1, marginBottom:10,
            }}>
              MOTOR<span style={{color:T.accent}}>SENSE</span>
            </div>

            {/* Subtitle */}
            <div style={{
              fontFamily:"'IBM Plex Mono',monospace",
              fontSize:11, letterSpacing:"0.2em",
              color:T.textDim, marginBottom:52,
            }}>
            </div>

            {/* Enter prompt */}
            <div style={{
              display:"flex",alignItems:"center",gap:10,justifyContent:"center",
              animation:"shimmer 2s ease infinite",
            }}>
              <div style={{height:"1px",width:40,background:`linear-gradient(90deg,transparent,${T.accent}50)`}}/>
              <div style={{
                fontFamily:"'IBM Plex Mono',monospace",
                fontSize:10, letterSpacing:"0.18em",
                color:T.accent, opacity:0.7,
              }}>
                APPUYEZ SUR <kbd style={{
                  background:`${T.accent}15`,border:`1px solid ${T.accent}40`,
                  borderRadius:5,padding:"2px 8px",color:T.accent,
                  fontFamily:"'IBM Plex Mono',monospace",fontSize:10,
                }}>ENTER</kbd> POUR COMMENCER
              </div>
              <div style={{height:"1px",width:40,background:`linear-gradient(90deg,${T.accent}50,transparent)`}}/>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MAIN APP ═══ */}
      <div style={{
        transition:"opacity 0.4s ease",
        opacity: splash && !splashOut ? 0 : 1,
        pointerEvents: splash ? "none" : "auto",
      }}>
      <div className="scanline noise-overlay" style={{minHeight:"100vh",background:T.bg,padding:0,direction:"ltr",position:"relative"}}>
        <div className="grid-bg" style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0}}/>
        {/* Ambient glow top-left */}
        <div style={{position:"fixed",top:-200,left:-200,width:600,height:600,background:`radial-gradient(circle,${T.accent}06 0%,transparent 70%)`,pointerEvents:"none",zIndex:0}}/>
        <div style={{position:"relative",zIndex:1}}>

        {/* ═══ HEADER ═══ */}
        <header style={{
          display:"flex", justifyContent:"space-between", alignItems:"center",
          padding:"0 32px", height:60,
          background:`linear-gradient(180deg,${T.panel} 0%,${T.panel2}cc 100%)`,
          borderBottom:`1px solid ${T.border}`,
          position:"sticky", top:0, zIndex:100,
          backdropFilter:"blur(12px)",
        }}>
          {/* Shimmer line */}
          <div style={{position:"absolute",top:0,left:0,right:0,height:"1px",background:`linear-gradient(90deg,transparent 0%,${T.accent}40 30%,${T.accent}80 50%,${T.accent}40 70%,transparent 100%)`,animation:"shimmer 4s ease infinite"}}/>

          {/* Logo */}
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <div style={{width:36,height:36,borderRadius:8,background:`linear-gradient(135deg,${T.accent}18,${T.accent}06)`,border:`1px solid ${T.accent}40`,display:"flex",alignItems:"center",justifyContent:"center",position:"relative",flexShrink:0}}>
              {/* Motor coil icon */}
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="8" stroke={T.accent} strokeWidth="1" strokeOpacity="0.4"/>
                <circle cx="10" cy="10" r="5" stroke={T.accent} strokeWidth="1" strokeOpacity="0.6"/>
                <circle cx="10" cy="10" r="2.5" fill={T.accent} fillOpacity="0.8"/>
                <line x1="10" y1="2" x2="10" y2="5" stroke={T.accent} strokeWidth="1" strokeOpacity="0.5"/>
                <line x1="18" y1="10" x2="15" y2="10" stroke={T.accent} strokeWidth="1" strokeOpacity="0.5"/>
                <line x1="10" y1="18" x2="10" y2="15" stroke={T.accent} strokeWidth="1" strokeOpacity="0.5"/>
                <line x1="2" y1="10" x2="5" y2="10" stroke={T.accent} strokeWidth="1" strokeOpacity="0.5"/>
              </svg>
              <div style={{position:"absolute",bottom:3,right:3,width:5,height:5,borderRadius:"50%",background:T.accent,animation:"pulse 2.5s infinite",boxShadow:`0 0 6px ${T.accent}`}}/>
            </div>
            <div>
              <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:800,fontSize:18,color:T.textHi,letterSpacing:"0.08em",lineHeight:1}}>
                MOTOR<span style={{color:T.accent}}>SENSE</span>
              </div>
              <div style={{color:T.mutedHi,fontSize:9,fontFamily:"'IBM Plex Mono',monospace",letterSpacing:"0.2em",marginTop:2}}>MCSA · v14 · DIAGNOSTIC</div>
            </div>
          </div>

          {/* Center status */}
          {activeFault && (
            <div style={{display:"flex",alignItems:"center",gap:10,background:`${T.panel3}`,border:`1px solid ${activeColor}28`,borderRadius:10,padding:"6px 16px"}}>
              <div style={{width:7,height:7,borderRadius:"50%",background:activeColor,animation:"pulse 2s infinite",boxShadow:`0 0 8px ${activeColor}`}}/>
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:activeColor}}>
                {activeInfo?.totalSamples?.toLocaleString()} pts · {activeInfo?.dur}s · fs={activeFFT?.fs}Hz · fr={activeFFT?.fr}Hz
              </div>
              <div style={{width:"1px",height:14,background:T.border}}/>
              <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:12,letterSpacing:"0.1em",
                color:globalSeverity===0?T.green:globalSeverity===1?T.yellow:T.red}}>
                {globalSeverity===0?"● NORMAL":globalSeverity===1?"▲ SURVEILLANCE":"■ CRITIQUE"}
              </div>
            </div>
          )}

          {/* Right meta */}
          <div style={{textAlign:"right",fontFamily:"'IBM Plex Mono',monospace"}}>
            <div style={{color:T.mutedHi,fontSize:9,letterSpacing:"0.1em"}}>HANNING · FFT×4 · 7 DÉFAUTS</div>
            <div style={{fontSize:9,letterSpacing:"0.08em",marginTop:3}}>
              {criticalDefauts?.length>0
                ? <span style={{color:T.red,fontWeight:700}}>{criticalDefauts.length} DÉFAUT(S) DÉTECTÉ(S)</span>
                : <span style={{color:T.green}}>AUCUN DÉFAUT</span>}
            </div>
          </div>
        </header>

        <main style={{padding:"28px 36px 0"}}>

        {/* ─── TABS ─── */}
        <div style={{display:"flex",gap:6,marginBottom:24,padding:"4px",background:T.panel,borderRadius:12,border:`1px solid ${T.border}`,width:"fit-content"}}>
          {[
            {k:"mcsa13",  l:"Analyse MCSA",  icon:"📡", c:T.teal},
            {k:"pdf",     l:"Rapport Complet", icon:"⚡", c:T.orange},
            {k:"history", l:"Historique",    icon:"🕘", c:T.blue},
          ].map(({k,l,icon,c})=>(
            <button key={k} onClick={()=>setTab(k)} className="tab-btn" style={{
              background: tab===k ? `linear-gradient(135deg,${c}22,${c}0a)` : "transparent",
              color: tab===k ? c : T.mutedHi,
              border: tab===k ? `1px solid ${c}40` : "1px solid transparent",
              borderRadius: 9,
              padding: "8px 20px",
              cursor: "pointer",
              fontSize: 12,
              display:"flex", alignItems:"center", gap:7,
            }}>
              <span style={{fontSize:13}}>{icon}</span>
              <span>{l}</span>
            </button>
          ))}
        </div>

        {/* ═══ TAB: MCSA ═══ */}
        {tab==="mcsa13" && (
          <div style={{animation:"fadeIn 0.4s cubic-bezier(0.16,1,0.3,1)"}}>

            {/* Row 1: Params + Upload */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:18}}>

              {/* Paramètres moteur */}
              <Card color={T.teal}>
                <Label color={T.teal}>Paramètres Moteur</Label>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  {[
                    {key:"fs",   label:"fs — Statorique / Alimentation (Hz)", step:1, hint:"Ex: 35 (0=auto)"},
                    {key:"fr",   label:"fr — Rotation rotor (Hz)",      step:0.01, hint:"Ex: 19.89"},
                    {key:"NL",   label:"NL — Pales turbine",            step:1,    hint:"Ex: 7"},
                    {key:"Nb_r", label:"Nb — Billes roulement",         step:1,    hint:"Ex: 8"},
                    {key:"Nb_b", label:"Nb — Barres rotoriques",        step:1,    hint:"Ex: 28"},
                    {key:"ct",   label:"CT — Ratio capteur courant (÷)",step:1,    hint:"Ex: 100"},
                  ].map(({key,label,step,hint})=>(
                    <div key={key} style={{gridColumn: key==="fs"?"span 2":"auto"}}>
                      <div style={{color:T.mutedHi,fontSize:9,fontFamily:"'IBM Plex Mono',monospace",letterSpacing:"0.06em",marginBottom:5}}>{label}</div>
                      <input type="number" step={step} value={draft[key]}
                        onChange={e=>setDraft(p=>({...p,[key]:+e.target.value}))}
                        placeholder={hint}
                        style={{...inputStyle(T.teal), border:`1px solid ${T.teal}30`}}/>
                    </div>
                  ))}
                </div>
                <div style={{marginTop:14,display:"flex",gap:10,alignItems:"center"}}>
                  <button onClick={()=>setParams({...draft})} className="action-btn" style={{
                    flex:1,
                    background: paramsChanged ? `linear-gradient(135deg,${T.teal}25,${T.teal}0d)` : T.panel2,
                    color: paramsChanged ? T.teal : T.mutedHi,
                    border: `1px solid ${paramsChanged ? T.teal+"50" : T.border}`,
                    borderRadius: 10, padding:"10px 0", fontWeight:700, fontSize:12,
                    fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:"0.08em",
                    boxShadow: paramsChanged ? `0 0 20px ${T.teal}18` : "none",
                  }}>
                    {paramsChanged ? "▶  Appliquer les paramètres" : "✓  Paramètres appliqués"}
                  </button>
                </div>
                {draft.fr > 0 && (
                  <div style={{marginTop:12,padding:"8px 14px",background:`${T.accent}07`,border:`1px solid ${T.accent}15`,borderRadius:9,fontSize:10,color:T.mutedHi,fontFamily:"'IBM Plex Mono',monospace"}}>
                    g (glissement) calculé auto · f_sync ≈ {+((draft.fs||50)/Math.round((draft.fs||50)/draft.fr)*Math.round((draft.fs||50)/draft.fr)).toFixed(2)} Hz
                  </div>
                )}
              </Card>

              {/* Upload */}
              <Card color={T.teal}>
                <Label color={T.teal}>Charger fichiers CSV (OWON)</Label>
                <div style={{display:"flex",flexDirection:"column",gap:12}}>
                  {[["A",T.teal,"Fichier principal",fileA,loadingA],["B",T.purple,"Fichier comparaison (optionnel)",fileB,loadingB]].map(([slot,color,hint,info,loading])=>(
                    <div key={slot}>
                      <input type="file" accept=".csv,.txt" id={`inp-${slot}`} style={{display:"none"}} onChange={handleUpload(slot)}/>
                      <div onClick={()=>document.getElementById(`inp-${slot}`).click()}
                        style={{
                          border:`2px dashed ${info ? color+"70" : color+"35"}`,
                          borderRadius:12,padding:"14px 18px",textAlign:"center",cursor:"pointer",
                          background:`linear-gradient(135deg,${color}05,${color}02)`,
                          display:"flex",alignItems:"center",gap:14,
                          transition:"all 0.2s ease",
                        }}>
                        <div style={{width:34,height:34,borderRadius:10,background:`${color}15`,border:`1px solid ${color}35`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                          {loading
                            ? <div style={{width:14,height:14,border:`2px solid ${color}40`,borderTopColor:color,borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
                            : <span style={{color,fontWeight:800,fontSize:14,fontFamily:"'Barlow Condensed',sans-serif"}}>{slot}</span>}
                        </div>
                        <div style={{textAlign:"left",flex:1}}>
                          <div style={{color,fontWeight:600,fontSize:12,fontFamily:"'Barlow Condensed',sans-serif"}}>
                            {info ? `✓ ${info.totalSamples?.toLocaleString()} pts · ${info.dur}s` : hint}
                          </div>
                          <div style={{color:T.mutedHi,fontSize:9,fontFamily:"'IBM Plex Mono',monospace",marginTop:2}}>
                            {info?"Cliquer pour recharger":"Cliquer pour charger"}
                          </div>
                        </div>
                        {info && slot==="A" && activeGrid && (
                          <div style={{padding:"4px 10px",borderRadius:7,background:`${T.accent}12`,border:`1px solid ${T.accent}30`,color:T.accent,fontSize:9,fontFamily:"'IBM Plex Mono',monospace"}}>
                            fs={activeGrid.fs}Hz ({activeGrid.confidence}%)
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {fftB && (
                  <div style={{marginTop:12,display:"flex",gap:8}}>
                    {[["A",T.teal],["B",T.purple]].map(([s,c])=>(
                      <button key={s} onClick={()=>setActiveFile(s)} style={{
                        flex:1,
                        background: activeFile===s ? `${c}18` : "transparent",
                        color: activeFile===s ? c : T.mutedHi,
                        border: `1px solid ${activeFile===s ? c+"45" : T.border}`,
                        borderRadius: 9, padding:"7px", cursor:"pointer",
                        fontSize:12, fontWeight:activeFile===s?700:400,
                        fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:"0.06em",
                        transition:"all 0.2s",
                      }}>
                        Fichier {s}
                      </button>
                    ))}
                  </div>
                )}

                {error && (
                  <div style={{marginTop:12,padding:"10px 14px",background:`${T.red}08`,border:`1px solid ${T.red}30`,borderRadius:10,color:T.red,fontSize:11}}>
                    ⚠ {error}
                  </div>
                )}
              </Card>
            </div>

            {/* Row 2: Results */}
            {activeFault && activeFFT && (
              <>
                {/* ① I(t) + FFT */}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>

                  {/* I(t) */}
                  <Card color={activeColor}>
                    <Label color={activeColor}>① Signal I(t) — Courant statorique</Label>
                    <div style={{display:"flex",flexWrap:"wrap",alignItems:"center",gap:8,marginBottom:10}}>
                      {[
                        {l:"X min (s)",v:xMinTime,sv:setXMinTime,step:0.1},
                        {l:"X max (s)",v:xMaxTime,sv:setXMaxTime,step:0.1},
                        {l:"Y min (A)",v:yMinTime,sv:setYMinTime,step:1,ph:true},
                        {l:"Y max (A)",v:yMaxTime,sv:setYMaxTime,step:1,ph:true},
                      ].map(({l,v,sv,step,ph})=>(
                        <span key={l} style={{display:"flex",alignItems:"center",gap:4}}>
                          <span style={{color:T.mutedHi,fontSize:9,fontFamily:"'IBM Plex Mono',monospace"}}>{l}:</span>
                          <input type="number" step={step} value={v} placeholder={ph?"auto":undefined}
                            onChange={e=>sv(ph?e.target.value:+e.target.value)}
                            style={chartInputStyle(activeColor)}/>
                        </span>
                      ))}
                    </div>
                    {zoomTimeDomain && (
                      <button onClick={()=>setZoomTimeDomain(null)} style={{fontSize:9,background:`${T.red}12`,color:T.red,border:`1px solid ${T.red}30`,borderRadius:6,padding:"2px 10px",cursor:"pointer",marginBottom:6,fontFamily:"'IBM Plex Mono',monospace"}}>↩ Reset Zoom</button>
                    )}
                    <div style={{height:200,userSelect:"none"}}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={activeTime.filter(p=>p.t<=(zoomTimeDomain?zoomTimeDomain[1]:xMaxTime)&&p.t>=(zoomTimeDomain?zoomTimeDomain[0]:xMinTime))}
                          margin={{top:4,right:10,bottom:0,left:0}}
                          onMouseDown={e=>{if(e?.activeLabel!=null){setZoomTimeLeft(+e.activeLabel);setIsDraggingTime(true);}}}
                          onMouseMove={e=>{if(isDraggingTime&&e?.activeLabel!=null)setZoomTimeRight(+e.activeLabel);}}
                          onMouseUp={()=>{
                            if(isDraggingTime&&zoomTimeLeft!==null&&zoomTimeRight!==null&&zoomTimeLeft!==zoomTimeRight){
                              const [l,r]=zoomTimeLeft<zoomTimeRight?[zoomTimeLeft,zoomTimeRight]:[zoomTimeRight,zoomTimeLeft];
                              setZoomTimeDomain([l,r]);
                            }
                            setIsDraggingTime(false);setZoomTimeLeft(null);setZoomTimeRight(null);
                          }}>
                          <CartesianGrid strokeDasharray="2 5" stroke={`${T.border}70`}/>
                          <XAxis dataKey="t" tick={{fill:T.mutedHi,fontSize:8}} tickFormatter={v=>`${v}s`} domain={zoomTimeDomain||[xMinTime,xMaxTime]}/>
                          <YAxis tick={{fill:T.mutedHi,fontSize:8}} tickFormatter={v=>`${v}A`} domain={[yMinTime!==""?+yMinTime:"auto", yMaxTime!==""?+yMaxTime:"auto"]}/>
                          <Tooltip contentStyle={{background:T.panel2,border:`1px solid ${T.borderHi}`,borderRadius:10,fontSize:10}} formatter={v=>[`${v} A`,"I(t)"]} labelFormatter={l=>`t = ${l} s`}/>
                          <Line type="monotone" dataKey="I" stroke={activeColor} strokeWidth={1.2} dot={false} isAnimationActive={false}/>
                          {isDraggingTime&&zoomTimeLeft!==null&&zoomTimeRight!==null&&(
                            <ReferenceArea x1={zoomTimeLeft} x2={zoomTimeRight} fill={activeColor} fillOpacity={0.12}/>
                          )}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div style={{display:"flex",gap:18,marginTop:10}}>
                      {[{l:"I_min",v:`${activeInfo?.min} A`,c:T.accent},{l:"I_max",v:`${activeInfo?.max} A`,c:T.accent},{l:"N pts",v:activeInfo?.totalSamples?.toLocaleString(),c:T.mutedHi},{l:"Durée",v:`${activeInfo?.dur}s`,c:T.mutedHi}].map(({l,v,c})=>(
                        <div key={l} style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10}}>
                          <span style={{color:T.mutedHi}}>{l}: </span><span style={{color:c}}>{v}</span>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* FFT Spectrum */}
                  <Card color={activeColor}>
                    <Label color={activeColor}>② Spectre FFT — Hanning · Zero-pad ×4</Label>
                    <div style={{display:"flex",flexWrap:"wrap",alignItems:"center",gap:8,marginBottom:10}}>
                      {[
                        {l:"X min (Hz)",v:xMinFFT,sv:setXMinFFT,step:1},
                        {l:"X max (Hz)",v:xMaxFFT,sv:setXMaxFFT,step:1},
                        {l:"Y min",v:yMinFFT,sv:setYMinFFT,step:0.0001,ph:true},
                        {l:"Y max",v:yMaxFFT,sv:setYMaxFFT,step:0.0001,ph:true},
                      ].map(({l,v,sv,step,ph})=>(
                        <span key={l} style={{display:"flex",alignItems:"center",gap:4}}>
                          <span style={{color:T.mutedHi,fontSize:9,fontFamily:"'IBM Plex Mono',monospace"}}>{l}:</span>
                          <input type="number" step={step} value={v} placeholder={ph?"auto":undefined}
                            onChange={e=>sv(ph?e.target.value:+e.target.value)}
                            style={chartInputStyle(activeColor)}/>
                        </span>
                      ))}
                    </div>
                    {zoomFFTDomain && (
                      <button onClick={()=>setZoomFFTDomain(null)} style={{fontSize:9,background:`${T.red}12`,color:T.red,border:`1px solid ${T.red}30`,borderRadius:6,padding:"2px 10px",cursor:"pointer",marginBottom:6,fontFamily:"'IBM Plex Mono',monospace"}}>↩ Reset Zoom</button>
                    )}
                    <div style={{height:200,userSelect:"none"}}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={activeFFT.freqs.filter(p=>p.f<=(zoomFFTDomain?zoomFFTDomain[1]:xMaxFFT)&&p.f>=(zoomFFTDomain?zoomFFTDomain[0]:xMinFFT))}
                          margin={{top:4,right:10,bottom:0,left:0}}
                          onMouseDown={e=>{if(e?.activeLabel!=null){setZoomFFTLeft(+e.activeLabel);setIsDraggingFFT(true);}}}
                          onMouseMove={e=>{if(isDraggingFFT&&e?.activeLabel!=null)setZoomFFTRight(+e.activeLabel);}}
                          onMouseUp={()=>{
                            if(isDraggingFFT&&zoomFFTLeft!==null&&zoomFFTRight!==null&&zoomFFTLeft!==zoomFFTRight){
                              const [l,r]=zoomFFTLeft<zoomFFTRight?[zoomFFTLeft,zoomFFTRight]:[zoomFFTRight,zoomFFTLeft];
                              setZoomFFTDomain([l,r]);
                            }
                            setIsDraggingFFT(false);setZoomFFTLeft(null);setZoomFFTRight(null);
                          }}>
                          <CartesianGrid strokeDasharray="2 5" stroke={`${T.border}70`}/>
                          <XAxis dataKey="f" tick={{fill:T.mutedHi,fontSize:8}} tickFormatter={v=>`${v}Hz`} domain={zoomFFTDomain||[xMinFFT,xMaxFFT]}/>
                          <YAxis tick={{fill:T.mutedHi,fontSize:8}} tickFormatter={v=>v.toExponential(1)} domain={[yMinFFT!==""?+yMinFFT:"auto", yMaxFFT!==""?+yMaxFFT:"auto"]}/>
                          <Tooltip contentStyle={{background:T.panel2,border:`1px solid ${T.borderHi}`,borderRadius:10,fontSize:10}} formatter={v=>[v.toExponential(3),"Magnitude"]} labelFormatter={l=>`f = ${l} Hz`}/>
                          <Line type="monotone" dataKey="amp" stroke={activeColor} strokeWidth={1.2} dot={false} isAnimationActive={false}/>
                          <ReferenceLine x={activeFFT.fs} stroke={T.yellow} strokeDasharray="4 3" label={{value:`fs=${activeFFT.fs}Hz`,fill:T.yellow,fontSize:8,position:"top"}}/>
                          <ReferenceLine x={activeFFT.fr} stroke={T.green} strokeDasharray="3 3" label={{value:`fr=${activeFFT.fr}Hz`,fill:T.green,fontSize:8,position:"top"}}/>
                          {isDraggingFFT&&zoomFFTLeft!==null&&zoomFFTRight!==null&&(
                            <ReferenceArea x1={zoomFFTLeft} x2={zoomFFTRight} fill={activeColor} fillOpacity={0.12}/>
                          )}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div style={{display:"flex",gap:18,marginTop:10}}>
                      {[{l:"A_fs",v:activeFault.A_fs.toExponential(3),c:T.yellow},{l:"fs",v:`${activeFFT.fs} Hz`,c:T.yellow},{l:"fr",v:`${activeFFT.fr} Hz`,c:T.green},{l:"g",v:activeFault.g,c:T.orange}].map(({l,v,c})=>(
                        <div key={l} style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10}}>
                          <span style={{color:T.mutedHi}}>{l}: </span><span style={{color:c}}>{v}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>

                {/* FFT Overlay A vs B */}
                {fftA && fftB && (
                  <Card color={T.purple} style={{marginBottom:16}}>
                    <Label color={T.purple}>② Comparaison Spectres FFT — Fichier A vs Fichier B</Label>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                      <span style={{color:T.mutedHi,fontSize:9,fontFamily:"'IBM Plex Mono',monospace"}}>X min (Hz):</span>
                      <input type="number" min={0} step={1} value={xMinFFT} onChange={e=>setXMinFFT(+e.target.value)} style={chartInputStyle(T.purple)}/>
                      <span style={{color:T.mutedHi,fontSize:9,fontFamily:"'IBM Plex Mono',monospace",marginLeft:8}}>X max (Hz):</span>
                      <input type="number" step={1} value={xMaxFFT} onChange={e=>setXMaxFFT(+e.target.value)} style={chartInputStyle(T.purple)}/>
                    </div>
                    <div style={{display:"flex",gap:16,marginBottom:8}}>
                      <div style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:20,height:2,background:T.teal,borderRadius:2}}/><span style={{color:T.teal,fontSize:9,fontFamily:"'IBM Plex Mono',monospace"}}>Fichier A</span></div>
                      <div style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:20,height:2,background:T.purple,borderRadius:2}}/><span style={{color:T.purple,fontSize:9,fontFamily:"'IBM Plex Mono',monospace"}}>Fichier B</span></div>
                    </div>
                    <div style={{height:220}}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart margin={{top:4,right:10,bottom:0,left:0}}>
                          <CartesianGrid strokeDasharray="2 5" stroke={`${T.border}70`}/>
                          <XAxis dataKey="f" type="number" domain={[0,xMaxFFT]} tick={{fill:T.mutedHi,fontSize:8}} tickFormatter={v=>`${v}Hz`} allowDuplicatedCategory={false}/>
                          <YAxis tick={{fill:T.mutedHi,fontSize:8}} tickFormatter={v=>v.toExponential(1)} domain={["auto","auto"]}/>
                          <Tooltip contentStyle={{background:T.panel2,border:`1px solid ${T.borderHi}`,borderRadius:10,fontSize:10}} formatter={(v,n)=>[v.toExponential(3),n]} labelFormatter={l=>`f = ${l} Hz`}/>
                          <Line data={fftA.freqs.filter(p=>p.f<=xMaxFFT)} type="monotone" dataKey="amp" name="Fichier A" stroke={T.teal} strokeWidth={1.2} dot={false} isAnimationActive={false}/>
                          <Line data={fftB.freqs.filter(p=>p.f<=xMaxFFT)} type="monotone" dataKey="amp" name="Fichier B" stroke={T.purple} strokeWidth={1.2} dot={false} isAnimationActive={false} strokeDasharray="4 2"/>
                          <ReferenceLine x={fftA.fs} stroke={T.yellow} strokeDasharray="4 3" label={{value:`fs=${fftA.fs}Hz`,fill:T.yellow,fontSize:8,position:"top"}}/>
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                )}

                {/* ③ Bandes 500Hz */}
                {activeBands && (
                  <Card color={activeColor} style={{marginBottom:16}}>
                    <Label color={activeColor}>③ Analyse par bandes de 500 Hz — Détection des pics réels</Label>
                    <div style={{display:"flex",flexDirection:"column",gap:10,marginTop:6}}>
                      {activeBands.bands.filter(b=>b.peaks.length>0).map((band,bi)=>(
                        <div key={bi} style={{background:T.panel2,borderRadius:10,padding:"12px 16px",border:`1px solid ${band.color}30`}}>
                          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                            <span style={{fontSize:13}}>{band.icon}</span>
                            <span style={{color:band.color,fontWeight:700,fontSize:11,fontFamily:"'IBM Plex Mono',monospace"}}>
                              {band.fMin} – {band.fMax} Hz
                            </span>
                            <span style={{color:band.color,fontSize:9,background:`${band.color}18`,borderRadius:5,padding:"1px 8px",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:600,letterSpacing:"0.06em"}}>{band.label.toUpperCase()}</span>
                            <span style={{color:T.mutedHi,fontSize:9,marginLeft:"auto",fontFamily:"'IBM Plex Mono',monospace"}}>ratio_max: {band.maxRatio}%</span>
                          </div>
                          <div style={{display:"flex",flexDirection:"column",gap:3}}>
                            {band.peaks.map((pk,pi)=>(
                              <div key={pi} style={{display:"flex",alignItems:"center",gap:6,fontSize:9,fontFamily:"'IBM Plex Mono',monospace"}}>
                                <span style={{color:T.accent,minWidth:60}}>f={pk.f} Hz</span>
                                <span style={{color:T.mutedHi,minWidth:60}}>ratio={pk.ratio}%</span>
                                {pk.matched
                                  ? <span style={{color:T.yellow}}>→ {pk.matched} ({pk.formula}, Δf={pk.dist}Hz)</span>
                                  : <span style={{color:T.muted}}>→ non identifié</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {/* ④ Fault Analysis Table */}
                <Card color={activeColor} style={{marginBottom:16}}>
                  <Label color={activeColor}>④ Analyse des Défauts — Ratio A_défaut / A_fs</Label>

                  {/* Legend */}
                  <div style={{display:"flex",gap:14,marginBottom:16,padding:"10px 14px",background:T.panel2,borderRadius:10,flexWrap:"wrap",alignItems:"center"}}>
                    {[[T.green,"< 1%","Normal"],[T.yellow,"1–5%","Surveillance"],[T.red,"> 5%","Critique"]].map(([c,range,l])=>(
                      <div key={l} style={{display:"flex",alignItems:"center",gap:6}}>
                        <div style={{width:8,height:8,borderRadius:"50%",background:c,boxShadow:`0 0 5px ${c}`}}/>
                        <span style={{color:c,fontSize:10,fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,letterSpacing:"0.05em"}}>{l}</span>
                        <span style={{color:T.mutedHi,fontSize:9,fontFamily:"'IBM Plex Mono',monospace"}}>{range}</span>
                      </div>
                    ))}
                    <div style={{marginLeft:"auto",color:T.mutedHi,fontSize:9,fontFamily:"'IBM Plex Mono',monospace"}}>Ratio = A_défaut / A_fs × 100%</div>
                  </div>

                  {/* Table header */}
                  <div style={{display:"grid",gridTemplateColumns:"190px 1fr 100px 110px 120px 90px 90px",gap:8,padding:"7px 14px",marginBottom:8,background:T.panel2,borderRadius:9,color:T.mutedHi,fontSize:9,fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:"0.12em",fontWeight:600}}>
                    <span>DÉFAUT</span><span>FORMULE</span><span>RATIO MAX</span><span>STATUT</span><span>BARRE</span><span>CONFIANCE</span><span>FRÉQUENCES</span>
                  </div>

                  {activeFault.defauts.map((d,i) => (
                    <div key={i} style={{marginBottom:5,borderRadius:11,background:`${d.color}05`,border:`1px solid ${d.color}${d.level>0?"40":"18"}`,animation:"fadeInUp 0.3s ease both",animationDelay:`${i*45}ms`,overflow:"hidden"}}>
                      <div style={{display:"grid",gridTemplateColumns:"190px 1fr 100px 110px 120px 90px 90px",gap:8,padding:"11px 14px",alignItems:"center"}}>
                        <div style={{display:"flex",alignItems:"center",gap:7}}>
                          <span style={{fontSize:15}}>{d.icon}</span>
                          <span style={{color:d.color,fontWeight:700,fontSize:11,fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:"0.04em"}}>{d.name}</span>
                        </div>
                        <span style={{color:T.mutedHi,fontSize:9,fontFamily:"'IBM Plex Mono',monospace"}}>{d.formula}</span>
                        <span style={{color:d.color,fontWeight:700,fontSize:14,fontFamily:"'IBM Plex Mono',monospace"}}>{d.maxRatio}%</span>
                        <SeverityBadge label={d.label} color={d.color}/>
                        <RatioBar ratio={d.maxRatio} color={d.color}/>
                        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
                          <span style={{
                            color: d.confidence>=70?T.green:d.confidence>=40?T.yellow:T.mutedHi,
                            fontWeight:700,fontSize:12,fontFamily:"'IBM Plex Mono',monospace"
                          }}>{d.confidence}%</span>
                          <span style={{color:T.mutedHi,fontSize:8,fontFamily:"'Barlow Condensed',sans-serif"}}>
                            {d.confidence>=70?"CONFIRMÉ":d.confidence>=40?"POSSIBLE":"FAIBLE"}
                          </span>
                        </div>
                        <span style={{color:T.mutedHi,fontSize:9,fontFamily:"'IBM Plex Mono',monospace"}}>{d.freqs.length} raies</span>
                      </div>
                      {d.level > 0 && d.freqs.filter(f=>f.ratio>=0.1).length > 0 && (
                        <div style={{padding:"0 14px 14px"}}>
                          {/* Table header */}
                          <div style={{display:"grid",gridTemplateColumns:"1fr 130px 130px 90px 160px",gap:6,padding:"5px 12px",marginBottom:4,background:T.panel3,borderRadius:7,color:T.mutedHi,fontSize:8,fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:"0.1em",fontWeight:700}}>
                            <span>EXPRESSION</span>
                            <span>VALEUR CALCULÉE</span>
                            <span>VALEUR RÉELLE</span>
                            <span>AMPLITUDE</span>
                            <span>REMARQUES</span>
                          </div>
                          {d.freqs.filter(f=>f.ratio>=0.1).map((f,j)=>{
                            const rowColor = f.ratio>=5?T.red:f.ratio>=1?T.yellow:T.green;
                            const rowLabel = f.ratio>=5?"Critique":f.ratio>=1?"Surveillance":"Normal";
                            return (
                              <div key={j} style={{display:"grid",gridTemplateColumns:"1fr 130px 130px 90px 160px",gap:6,padding:"6px 12px",marginBottom:3,borderRadius:7,background:`${rowColor}08`,border:`1px solid ${rowColor}20`,alignItems:"center"}}>
                                <span style={{color:T.mutedHi,fontSize:9,fontFamily:"'IBM Plex Mono',monospace"}}>{f.label}</span>
                                <span style={{color:T.textDim,fontSize:9,fontFamily:"'IBM Plex Mono',monospace"}}>{f.fTh} Hz</span>
                                <span style={{color:d.color,fontWeight:700,fontSize:9,fontFamily:"'IBM Plex Mono',monospace"}}>{f.f} Hz</span>
                                <span style={{color:rowColor,fontWeight:700,fontSize:10,fontFamily:"'IBM Plex Mono',monospace",background:`${rowColor}18`,borderRadius:5,padding:"1px 7px",textAlign:"center"}}>{f.ratio}%</span>
                                <span style={{color:rowColor,fontSize:9,fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,letterSpacing:"0.04em"}}>{rowLabel === "Critique" ? `⚠ Défaut sévère — ${d.name}` : rowLabel === "Surveillance" ? `⚡ Défaut possible — ${d.name}` : "✓ Normal"}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </Card>

                {/* Comparison A vs B */}
                {faultA && faultB && (
                  <Card color={T.purple} style={{marginBottom:16}}>
                    <Label color={T.purple}>⑤ Comparaison Fichier A vs Fichier B</Label>
                    <div style={{display:"grid",gridTemplateColumns:"190px 1fr 1fr 1fr",gap:8,padding:"7px 14px",marginBottom:8,background:T.panel2,borderRadius:9,color:T.mutedHi,fontSize:9,fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:"0.1em",fontWeight:600}}>
                      <span>DÉFAUT</span><span>Fichier A</span><span>Fichier B</span><span>ÉVOLUTION</span>
                    </div>
                    {faultA.defauts.map((da,i) => {
                      const db = faultB.defauts[i];
                      const delta = +(db.maxRatio - da.maxRatio).toFixed(3);
                      const trend = delta > 0.5 ? {l:"↑ Dégradation",c:T.red} : delta < -0.5 ? {l:"↓ Amélioration",c:T.green} : {l:"→ Stable",c:T.mutedHi};
                      return (
                        <div key={i} style={{display:"grid",gridTemplateColumns:"190px 1fr 1fr 1fr",gap:8,padding:"9px 14px",marginBottom:4,borderRadius:9,background:`${trend.c}06`,border:`1px solid ${trend.c}20`,alignItems:"center"}}>
                          <div style={{display:"flex",alignItems:"center",gap:6}}>
                            <span style={{fontSize:13}}>{da.icon}</span>
                            <span style={{color:da.color,fontWeight:600,fontSize:10,fontFamily:"'Barlow Condensed',sans-serif"}}>{da.name}</span>
                          </div>
                          <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10}}>
                            <span style={{color:da.color,fontWeight:700}}>{da.maxRatio}%</span>
                            <span style={{color:T.mutedHi,marginLeft:5}}>{da.label}</span>
                          </div>
                          <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10}}>
                            <span style={{color:db.color,fontWeight:700}}>{db.maxRatio}%</span>
                            <span style={{color:T.mutedHi,marginLeft:5}}>{db.label}</span>
                          </div>
                          <span style={{color:trend.c,fontWeight:700,fontSize:10,fontFamily:"'IBM Plex Mono',monospace"}}>{delta>0?"+":""}{delta}% {trend.l}</span>
                        </div>
                      );
                    })}
                  </Card>
                )}
              </>
            )}

            {/* Empty state */}
            {!activeFault && (
              <Card noHover style={{textAlign:"center",padding:56,marginBottom:16}}>
                <div style={{fontSize:44,marginBottom:18,opacity:0.7}}>📡</div>
                <div style={{color:T.textHi,fontWeight:700,fontSize:16,marginBottom:10,fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:"0.04em"}}>Chargez un fichier CSV pour démarrer l'analyse</div>
                <div style={{color:T.mutedHi,fontSize:12}}>Saisissez les paramètres moteur (fr, NL, Nb) puis chargez votre fichier OWON CSV</div>
              </Card>
            )}
          </div>
        )}

        {/* ═══ TAB: IA Report ═══ */}
        {tab==="pdf" && (
          <div style={{animation:"fadeIn 0.4s cubic-bezier(0.16,1,0.3,1)",maxWidth:820}}>

            <Card style={{marginBottom:18,border:`1px solid ${T.orange}25`}}>
              <Label color={T.orange}>⚡ Rapport Complet — AI + PDF en une seule étape</Label>
              <div style={{color:T.mutedHi,fontSize:12,marginBottom:20,lineHeight:1.8}}>
                Génère automatiquement le diagnostic AI puis ouvre le PDF complet.
                {!faultA && <span style={{color:T.red,marginLeft:8}}>Chargez d'abord un fichier CSV dans l'onglet MCSA.</span>}
              </div>

              {/* Session name */}
              <div style={{marginBottom:18}}>
                <div style={{color:T.mutedHi,fontSize:9,fontFamily:"'IBM Plex Mono',monospace",letterSpacing:"0.06em",marginBottom:6}}>NOM DE LA SESSION (optionnel)</div>
                <input type="text" value={sessionName} onChange={e=>setSessionName(e.target.value)}
                  placeholder="Ex: Pompe 3 Couloir 1 · Avant réparation"
                  style={{width:"100%",background:T.panel,border:`1px solid ${T.orange}30`,color:T.textHi,borderRadius:10,padding:"10px 14px",fontSize:12,fontFamily:"'IBM Plex Mono',monospace",outline:"none"}}/>
              </div>

              {/* Fault preview */}
              {faultA && (
                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:20}}>
                  {faultA.defauts.map((d,i)=>(
                    <div key={i} style={{background:`linear-gradient(135deg,${d.color}0e,${d.color}05)`,border:`1px solid ${d.color}30`,borderRadius:11,padding:"12px 14px"}}>
                      <div style={{color:T.mutedHi,fontSize:9,marginBottom:5,fontFamily:"'IBM Plex Mono',monospace"}}>{d.icon} {d.name}</div>
                      <div style={{color:d.color,fontFamily:"'IBM Plex Mono',monospace",fontSize:16,fontWeight:700}}>{d.maxRatio}%</div>
                      <div style={{marginTop:4}}><SeverityBadge label={d.label} color={d.color}/></div>
                    </div>
                  ))}
                </div>
              )}

              {/* Steps indicator */}
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20,padding:"12px 16px",background:T.panel2,borderRadius:10,border:`1px solid ${T.border}`}}>
                {[
                  {n:"①",l:"Analyse MCSA",ok:!!faultA,c:T.teal},
                  {n:"→",l:"",ok:true,c:T.border},
                  {n:"②",l:"Génération AI",ok:!!aiReport,c:T.yellow},
                  {n:"→",l:"",ok:true,c:T.border},
                  {n:"③",l:"Export PDF",ok:false,c:T.orange},
                ].map(({n,l,ok,c},i)=>(
                  n==="→"
                    ? <div key={i} style={{color:T.border,fontSize:16}}>→</div>
                    : <div key={i} style={{display:"flex",alignItems:"center",gap:6}}>
                        <div style={{width:22,height:22,borderRadius:"50%",background:ok?`${c}25`:"transparent",border:`1px solid ${ok?c:T.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:ok?c:T.mutedHi,fontFamily:"'IBM Plex Mono',monospace"}}>{n}</div>
                        <span style={{color:ok?c:T.mutedHi,fontSize:10,fontFamily:"'Barlow Condensed',sans-serif",fontWeight:ok?700:400,letterSpacing:"0.04em"}}>{l}</span>
                      </div>
                ))}
                {aiReport && <span style={{marginLeft:"auto",color:T.green,fontSize:9,fontFamily:"'IBM Plex Mono',monospace"}}>✓ AI prêt</span>}
              </div>

              {/* Main button */}
              <div style={{textAlign:"center"}}>
                <button onClick={generateFullReport} disabled={pdfLoading||!faultA} className="action-btn" style={{
                  background: pdfLoading||!faultA ? T.panel2 : `linear-gradient(135deg,${T.orange}28,${T.orange}0e)`,
                  color: pdfLoading||!faultA ? T.mutedHi : T.orange,
                  border: `1px solid ${pdfLoading||!faultA ? T.border : T.orange+"50"}`,
                  borderRadius:14, padding:"16px 64px", fontWeight:800, fontSize:16,
                  fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:"0.1em",
                  display:"inline-flex", alignItems:"center", gap:12,
                  boxShadow: !pdfLoading&&faultA ? `0 0 32px ${T.orange}18` : "none",
                }}>
                  {pdfLoading
                    ? <><div style={{width:18,height:18,border:`2px solid ${T.orange}40`,borderTopColor:T.orange,borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/> توليد التقرير…</>
                    : <>⚡ توليد التقرير الكامل</>}
                </button>
                <div style={{color:T.textDim,fontSize:10,fontFamily:"'IBM Plex Mono',monospace",marginTop:10}}>
                  يولّد AI تلقائياً ثم يفتح PDF · Ctrl+P للحفظ
                </div>
              </div>
            </Card>

            {aiError && (
              <Card style={{marginBottom:16,background:`${T.red}06`,border:`1px solid ${T.red}28`}}>
                <div style={{color:T.red,fontWeight:700,fontSize:12,marginBottom:5,fontFamily:"'Barlow Condensed',sans-serif"}}>خطأ</div>
                <div style={{color:T.mutedHi,fontSize:11}}>{aiError}</div>
              </Card>
            )}

            {aiReport && (
              <Card style={{border:`1px solid ${T.yellow}20`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
                  <Label color={T.yellow}>✓ تقرير AI — تم التوليد</Label>
                  <button onClick={()=>buildPDFandOpen(aiReport)} style={{background:`${T.orange}10`,color:T.orange,border:`1px solid ${T.orange}30`,borderRadius:8,padding:"6px 16px",cursor:"pointer",fontSize:10,fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,letterSpacing:"0.06em"}}>
                    📄 إعادة فتح PDF
                  </button>
                </div>
                <div style={{borderLeft:`3px solid ${T.yellow}40`,paddingLeft:20,color:T.text,fontSize:13,lineHeight:2,whiteSpace:"pre-wrap",fontFamily:"'Barlow',sans-serif"}}>
                  {aiReport.split(/(\*\*[^*]+\*\*)/).map((part,i)=>
                    part.startsWith("**")&&part.endsWith("**")
                      ? <strong key={i} style={{color:T.textHi,fontWeight:700}}>{part.slice(2,-2)}</strong>
                      : <span key={i}>{part}</span>
                  )}
                </div>
                <div style={{marginTop:18,paddingTop:14,borderTop:`1px solid ${T.border}`,color:T.mutedHi,fontSize:9,fontFamily:"'IBM Plex Mono',monospace"}}>
                  Généré par Claude · MotorSense v14 · Station OTHMEN GUEDIRI, El Oued
                </div>
              </Card>
            )}
          </div>
        )}

        {/* ═══ TAB: HISTORIQUE ═══ */}
        {tab==="history" && (
          <div style={{animation:"fadeIn 0.4s cubic-bezier(0.16,1,0.3,1)"}}>

            {/* Header row */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
              <div>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:800,fontSize:20,color:T.textHi,letterSpacing:"0.04em"}}>
                  Historique des analyses
                </div>
                <div style={{color:T.textDim,fontSize:11,fontFamily:"'IBM Plex Mono',monospace",marginTop:3}}>
                  {history.length} session{history.length!==1?"s":""} sauvegardée{history.length!==1?"s":""}
                </div>
              </div>
              {history.length>0 && (
                <button onClick={()=>{try{localStorage.removeItem(HIST_KEY);}catch{}setHistory([]);setHistTab(null);}} style={{
                  background:`${T.red}10`,border:`1px solid ${T.red}25`,color:T.red,
                  borderRadius:8,padding:"6px 14px",cursor:"pointer",
                  fontSize:10,fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,letterSpacing:"0.06em",
                }}>✕ Effacer l'historique</button>
              )}
            </div>

            {history.length===0 ? (
              <Card noHover style={{textAlign:"center",padding:56}}>
                <div style={{fontSize:40,marginBottom:16,opacity:0.5}}>🕘</div>
                <div style={{color:T.textHi,fontWeight:700,fontSize:15,fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:"0.04em",marginBottom:8}}>
                  Aucune session enregistrée
                </div>
                <div style={{color:T.textDim,fontSize:11}}>
                  Chargez un fichier CSV dans l'onglet MCSA pour démarrer.
                </div>
              </Card>
            ) : (
              <div style={{display:"grid",gridTemplateColumns:"320px 1fr",gap:16,alignItems:"start"}}>

                {/* Session list */}
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {history.map((s,i)=>{
                    const maxLvl = Math.max(...s.fault.defauts.map(d=>d.level));
                    const lvlColor = maxLvl===0?T.green:maxLvl===1?T.yellow:T.red;
                    const lvlLabel = maxLvl===0?"Normal":maxLvl===1?"Surveillance":"Critique";
                    const isActive = histTab===s.id;
                    return (
                      <div key={s.id} onClick={()=>setHistTab(isActive?null:s.id)}
                        className="card-hover"
                        style={{
                          background: isActive?`${T.blue}10`:T.panel,
                          border:`1px solid ${isActive?T.blue+"50":T.border}`,
                          borderRadius:12,padding:"14px 16px",cursor:"pointer",
                          boxShadow: isActive?`0 0 20px ${T.blue}15`:"none",
                          transition:"all 0.2s ease",
                        }}>
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                          <div style={{display:"flex",alignItems:"center",gap:8}}>
                            <div style={{
                              fontFamily:"'Barlow Condensed',sans-serif",fontWeight:800,
                              fontSize:11,color:T.mutedHi,letterSpacing:"0.1em",
                            }}>#{history.length-i}</div>
                            <div style={{color:T.textHi,fontFamily:"'IBM Plex Mono',monospace",fontSize:10}}>{s.date}</div>
                          </div>
                          <div style={{
                            background:`${lvlColor}15`,border:`1px solid ${lvlColor}35`,
                            borderRadius:6,padding:"2px 8px",
                            color:lvlColor,fontSize:9,fontWeight:700,
                            fontFamily:"'Barlow Condensed',sans-serif",
                          }}>{lvlLabel}</div>
                        </div>
                        <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
                          <span style={{color:T.textDim,fontSize:9,fontFamily:"'IBM Plex Mono',monospace"}}>
                            fs={s.grid?.fs}Hz · fr={s.params.fr}Hz
                          </span>
                          <span style={{color:T.textDim,fontSize:9,fontFamily:"'IBM Plex Mono',monospace"}}>
                            {s.info.totalSamples?.toLocaleString()} pts · {s.info.dur}s
                          </span>
                        </div>
                        {/* Mini fault bars */}
                        <div style={{marginTop:10,display:"flex",flexDirection:"column",gap:4}}>
                          {s.fault.defauts.filter(d=>d.level>0).map((d,j)=>(
                            <div key={j} style={{display:"flex",alignItems:"center",gap:8}}>
                              <div style={{color:d.color,fontSize:9,fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,width:90,flexShrink:0}}>{d.name}</div>
                              <div style={{flex:1,height:3,background:T.panel3,borderRadius:2,overflow:"hidden"}}>
                                <div style={{height:"100%",width:`${Math.min(d.maxRatio*8,100)}%`,background:d.color,borderRadius:2,boxShadow:`0 0 4px ${d.color}`}}/>
                              </div>
                              <div style={{color:d.color,fontSize:9,fontFamily:"'IBM Plex Mono',monospace",fontWeight:700,width:36,textAlign:"right"}}>{d.maxRatio}%</div>
                            </div>
                          ))}
                          {s.fault.defauts.every(d=>d.level===0) && (
                            <div style={{color:T.green,fontSize:9,fontFamily:"'IBM Plex Mono',monospace"}}>✓ Tous les défauts normaux</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Comparison panel */}
                <div>
                  {histTab ? (() => {
                    const sel = history.find(s=>s.id===histTab);
                    const cur = faultA;
                    if (!sel) return null;
                    return (
                      <div style={{display:"flex",flexDirection:"column",gap:12}}>
                        {/* Header */}
                        <Card color={T.blue}>
                          <Label color={T.blue}>Comparaison — Session #{history.length - history.findIndex(s=>s.id===histTab)} vs Session actuelle</Label>
                          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginTop:4}}>
                            {[
                              {label:"Session sélectionnée", s:sel, color:T.blue},
                              {label:"Session actuelle",      s:cur?{fault:cur,grid:faultA?{fs:fftA?.fs}:null,params,info:fileA}:null, color:T.teal},
                            ].map(({label,s,color})=>(
                              <div key={label} style={{background:`${color}08`,border:`1px solid ${color}20`,borderRadius:10,padding:"10px 14px"}}>
                                <div style={{color,fontSize:9,fontFamily:"'IBM Plex Mono',monospace",letterSpacing:"0.1em",marginBottom:6}}>{label.toUpperCase()}</div>
                                {s ? (
                                  <>
                                    <div style={{color:T.textHi,fontSize:11,fontFamily:"'IBM Plex Mono',monospace"}}>
                                      fs={s.grid?.fs}Hz · fr={s.params?.fr||params.fr}Hz
                                    </div>
                                    {s.info && <div style={{color:T.textDim,fontSize:10,marginTop:2}}>{s.info.totalSamples?.toLocaleString()} pts · {s.info.dur}s</div>}
                                  </>
                                ) : (
                                  <div style={{color:T.textDim,fontSize:10}}>Aucune analyse chargée</div>
                                )}
                              </div>
                            ))}
                          </div>
                        </Card>

                        {/* Fault comparison table */}
                        <Card>
                          <div style={{display:"grid",gridTemplateColumns:"160px 1fr 1fr 120px",gap:8,padding:"7px 14px",marginBottom:8,background:T.panel2,borderRadius:9,color:T.mutedHi,fontSize:9,fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:"0.12em",fontWeight:600}}>
                            <span>DÉFAUT</span>
                            <span style={{color:T.blue}}>SESSION #{history.length - history.findIndex(s=>s.id===histTab)}</span>
                            <span style={{color:T.teal}}>ACTUELLE</span>
                            <span>ÉVOLUTION</span>
                          </div>
                          {sel.fault.defauts.map((da,i)=>{
                            const db = cur?.defauts?.[i];
                            const delta = db ? +(db.maxRatio - da.maxRatio).toFixed(3) : null;
                            const trend = delta===null ? {l:"—",c:T.mutedHi}
                              : delta>0.5 ? {l:`+${delta}% ↑`,c:T.red}
                              : delta<-0.5 ? {l:`${delta}% ↓`,c:T.green}
                              : {l:`${delta>=0?"+":""}${delta}% →`,c:T.mutedHi};
                            return (
                              <div key={i} style={{display:"grid",gridTemplateColumns:"160px 1fr 1fr 120px",gap:8,padding:"9px 14px",marginBottom:4,borderRadius:9,background:`${da.color}05`,border:`1px solid ${da.color}18`,alignItems:"center"}}>
                                <div style={{display:"flex",alignItems:"center",gap:6}}>
                                  <span style={{fontSize:13}}>{da.icon}</span>
                                  <span style={{color:da.color,fontWeight:700,fontSize:10,fontFamily:"'Barlow Condensed',sans-serif"}}>{da.name}</span>
                                </div>
                                <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10}}>
                                  <span style={{color:da.color,fontWeight:700}}>{da.maxRatio}%</span>
                                  <span style={{color:T.mutedHi,marginLeft:6,fontSize:9}}>{da.label}</span>
                                </div>
                                <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10}}>
                                  {db ? <><span style={{color:db.color,fontWeight:700}}>{db.maxRatio}%</span><span style={{color:T.mutedHi,marginLeft:6,fontSize:9}}>{db.label}</span></> : <span style={{color:T.mutedHi}}>—</span>}
                                </div>
                                <span style={{color:trend.c,fontWeight:700,fontSize:10,fontFamily:"'IBM Plex Mono',monospace"}}>{trend.l}</span>
                              </div>
                            );
                          })}
                        </Card>
                      </div>
                    );
                  })() : (
                    <Card noHover style={{textAlign:"center",padding:40}}>
                      <div style={{fontSize:32,marginBottom:12,opacity:0.4}}>👈</div>
                      <div style={{color:T.textDim,fontSize:12,fontFamily:"'IBM Plex Mono',monospace"}}>
                        Sélectionnez une session pour la comparer avec l'analyse actuelle.
                      </div>
                    </Card>
                  )}
                </div>

              </div>
            )}
          </div>
        )}



        </main>
        </div>
      </div>
      </div>
    </>
  );
}
