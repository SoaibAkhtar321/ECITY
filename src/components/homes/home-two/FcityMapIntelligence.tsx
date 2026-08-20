"use client"
import { useState } from "react"

interface MarkerType {
   id: number;
   name: string;
   x: number; // percentage
   y: number; // percentage
   highlight?: boolean;
}

const markers: MarkerType[] = [
   { id: 1, name: "Future City", x: 50, y: 46, highlight: true },
   { id: 2, name: "Mucherla", x: 42, y: 40 },
   { id: 3, name: "Maheshwaram", x: 34, y: 30 },
   { id: 4, name: "Kandukur", x: 58, y: 42 },
   { id: 5, name: "Kadthal", x: 46, y: 60 },
   { id: 6, name: "Yacharam", x: 62, y: 58 },
   { id: 7, name: "Tukkuguda", x: 30, y: 52 },
   { id: 8, name: "Adibatla", x: 22, y: 44 },
   { id: 9, name: "Bongloor", x: 66, y: 34 },
   { id: 10, name: "Ibrahimpatnam", x: 70, y: 50 },
   { id: 11, name: "Shamshabad", x: 20, y: 24 },
   { id: 12, name: "Kothur", x: 30, y: 20 },
   { id: 13, name: "Shadnagar", x: 20, y: 12 },
   { id: 14, name: "Farooqnagar", x: 38, y: 14 },
]

const FcityMapIntelligence = () => {
   const [active, setActive] = useState<MarkerType>(markers[0]);

   return (
      <div className="fcity-map-intel position-relative z-1 mt-150 xl-mt-120 md-mt-80">
         <div className="container">
            <div className="title-one text-center mb-50 lg-mb-30 wow fadeInUp">
               <h2 className="font-garamond">FCITY Property Intelligence</h2>
               <p className="fs-22 mt-xs">Southern Hyderabad&apos;s growth corridors, centred on Future City.</p>
            </div>

            <div className="map-frame position-relative wow fadeInUp">
               <svg viewBox="0 0 500 340" className="map-svg" xmlns="http://www.w3.org/2000/svg">
                  <rect width="500" height="340" fill="#f4f2e9" />
                  {/* corridor lines */}
                  <path d="M40 260 C160 220, 260 200, 460 90" stroke="#c9a76b" strokeWidth="4" fill="none" opacity="0.6" />
                  <text x="330" y="120" fontSize="11" fill="#8a6d2f" opacity="0.8">NH-44 / Bangalore Highway</text>
                  <path d="M250 30 C240 120, 260 220, 300 320" stroke="#9bab7c" strokeWidth="3" fill="none" opacity="0.55" strokeDasharray="6 5" />
                  <text x="255" y="60" fontSize="11" fill="#5f7245" opacity="0.8">ORR</text>
                  <path d="M60 90 C180 150, 280 190, 420 230" stroke="#9bab7c" strokeWidth="3" fill="none" opacity="0.4" strokeDasharray="6 5" />
                  <text x="70" y="82" fontSize="11" fill="#5f7245" opacity="0.8">SH-19</text>

                  {/* airport marker */}
                  <g transform="translate(90,95)">
                     <circle r="5" fill="#7a8fa6" />
                     <text x="10" y="4" fontSize="11" fill="#5a6b7d">Hyderabad Airport</text>
                  </g>

                  {markers.map((m) => (
                     <g key={m.id} transform={`translate(${(m.x / 100) * 500}, ${(m.y / 100) * 340})`} style={{ cursor: "pointer" }} onClick={() => setActive(m)}>
                        <circle r={m.highlight ? 9 : 6} fill={m.highlight ? "#c19a4b" : active.id === m.id ? "#8a6d2f" : "#3f7a52"} stroke="#fff" strokeWidth="2" />
                        {m.highlight && <circle r="16" fill="none" stroke="#c19a4b" strokeWidth="1.5" opacity="0.55" />}
                     </g>
                  ))}
               </svg>

               <div className="intel-panel">
                  <div className="intel-title fw-500">FCITY PROPERTY INTELLIGENCE</div>
                  <div className="intel-location fs-20 fw-500 mt-2">{active.name}</div>
                  <ul className="style-none intel-stats mt-3">
                     <li><span>Verified Opportunities</span><strong>{12 + (active.id % 5) * 4}</strong></li>
                     <li><span>Growth Corridor</span><strong>Southern Hyderabad</strong></li>
                     <li><span>Airport Distance</span><strong>{18 + (active.id % 6) * 3} km</strong></li>
                     <li><span>ORR Distance</span><strong>{4 + (active.id % 4) * 2} km</strong></li>
                  </ul>
                  <div className="intel-disclaimer fs-12 opacity-65 mt-3">Demo / Prototype data for illustration only.</div>
               </div>

               <div className="map-hint fs-14 opacity-65">Tap a marker to explore the corridor</div>
            </div>
         </div>

         <style jsx>{`
            .map-frame {
               position: relative;
               background: #fff;
               border: 1px solid #ecebe3;
               border-radius: 16px;
               padding: 18px;
               box-shadow: 0 20px 50px rgba(20, 20, 10, 0.06);
            }
            .map-svg {
               width: 100%;
               height: auto;
               border-radius: 10px;
            }
            .intel-panel {
               position: absolute;
               top: 28px;
               left: 28px;
               background: rgba(255, 255, 255, 0.92);
               backdrop-filter: blur(6px);
               border: 1px solid #ecebe3;
               border-radius: 12px;
               padding: 18px 22px;
               width: 240px;
               box-shadow: 0 12px 30px rgba(20, 20, 10, 0.08);
            }
            .intel-title {
               font-size: 11px;
               letter-spacing: 1px;
               color: #8a6d2f;
            }
            .intel-stats li {
               display: flex;
               justify-content: space-between;
               font-size: 13px;
               padding: 4px 0;
               border-bottom: 1px dashed #eee;
            }
            .intel-stats li:last-child {
               border-bottom: none;
            }
            .map-hint {
               text-align: center;
               margin-top: 14px;
            }
            @media (max-width: 767px) {
               .intel-panel {
                  position: static;
                  width: 100%;
                  margin-top: 16px;
               }
            }
         `}</style>
      </div>
   )
}

export default FcityMapIntelligence
