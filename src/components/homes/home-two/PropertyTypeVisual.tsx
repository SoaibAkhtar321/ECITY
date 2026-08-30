"use client"

// Renders a type-correct visual for property cards.
// Plot / Land / Corporate Land use a stylised aerial-parcel illustration
// instead of a stock interior/exterior photo, since the template's photo
// library only contains house/villa imagery. Villa / Apartment / Commercial
// keep using real photography (handled by the caller).

type PropertyType = "Land" | "Plot" | "Villa" | "Apartment" | "Commercial" | "Corporate Land";

const PropertyTypeVisual = ({ type }: { type: PropertyType }) => {

   const isLarge = type === "Corporate Land" || type === "Land";
   const plotCount = isLarge ? 9 : 6;

   return (
      <div className="property-type-visual position-relative w-100 h-100 d-flex align-items-center justify-content-center overflow-hidden">
         <svg viewBox="0 0 400 260" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
            <rect width="400" height="260" fill="#eef0e6" />
            {/* base terrain tone */}
            <rect width="400" height="260" fill="url(#terrain)" opacity="0.6" />
            <defs>
               <linearGradient id="terrain" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#e4ead8" />
                  <stop offset="100%" stopColor="#cfd9bd" />
               </linearGradient>
            </defs>

            {/* access road */}
            <rect x="0" y="118" width="400" height="24" fill="#c9a76b" opacity="0.55" />
            <line x1="0" y1="130" x2="400" y2="130" stroke="#ffffff" strokeDasharray="10 8" strokeWidth="2" opacity="0.8" />

            {/* plot grid */}
            {Array.from({ length: plotCount }).map((_, i) => {
               const cols = isLarge ? 3 : 3;
               const col = i % cols;
               const row = Math.floor(i / cols);
               const w = 108;
               const h = 46;
               const gap = 10;
               const startX = 14 + col * (w + gap);
               const startY = row === 0 ? 20 : 152 + (row - 1) * (h + gap);
               return (
                  <rect
                     key={i}
                     x={startX}
                     y={startY}
                     width={w}
                     height={h}
                     fill={i % 3 === 0 ? "#b7c9a0" : "#c7d6ae"}
                     stroke="#8fa377"
                     strokeWidth="1.5"
                     rx="2"
                  />
               );
            })}

            {/* highlighted / featured plot */}
            <rect x="14" y="20" width="108" height="46" fill="none" stroke="#c19a4b" strokeWidth="3" rx="2" />
         </svg>

         <div className="visual-badge position-absolute d-flex align-items-center">
            <i className="fa-regular fa-map-location-dot me-2"></i>
            <span>{type === "Corporate Land" ? "Aerial Land Parcel" : type === "Land" ? "Open Land" : "Plotted Layout"}</span>
         </div>

         <style jsx>{`
            .property-type-visual {
               min-height: 220px;
               background: #eef0e6;
            }
            .visual-badge {
               bottom: 14px;
               left: 14px;
               background: rgba(20, 30, 15, 0.72);
               color: #fff;
               font-size: 13px;
               font-weight: 500;
               padding: 6px 12px;
               border-radius: 30px;
               letter-spacing: 0.2px;
            }
         `}</style>
      </div>
   )
}

export default PropertyTypeVisual
