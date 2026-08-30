"use client"
import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { generateAIResponse, formatINR, type FcityProperty } from "@/utils/fcityAIEngine"
import { onFcityAIOpen } from "@/utils/fcityAIBus"

interface ChatMessage {
   role: "user" | "ai";
   text: string;
   properties?: FcityProperty[];
}

const WELCOME_MESSAGE: ChatMessage = {
   role: "ai",
   text: "Hi \uD83D\uDC4B I'm FCITY AI. I can help you discover verified plots, compare locations and find opportunities based on your budget.",
};

const SUGGESTED_PROMPTS = [
   "Find plots in Future City",
   "Best investment areas",
   "Properties under ₹50L",
   "Show verified plots",
];

const typeIcon = (type?: string): string => {
   switch (type) {
      case "Plot":
      case "Land":
      case "Corporate Land":
         return "fa-map-location-dot";
      case "Villa":
         return "fa-house-chimney";
      case "Apartment":
         return "fa-building";
      case "Commercial":
         return "fa-shop";
      default:
         return "fa-location-dot";
   }
};

const FcityAIWidget = () => {
   const [open, setOpen] = useState(false);
   const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
   const [input, setInput] = useState("");
   const [typing, setTyping] = useState(false);
   const bodyRef = useRef<HTMLDivElement>(null);

   // Let the header CTA / hero link / anything else open this widget.
   useEffect(() => {
      return onFcityAIOpen((prefill) => {
         setOpen(true);
         if (prefill) {
            // slight delay so the panel is mounted/visible before we "type"
            setTimeout(() => send(prefill), 300);
         }
      });
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, []);

   useEffect(() => {
      if (bodyRef.current) {
         bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
      }
   }, [messages, typing, open]);

   const send = (question: string) => {
      const trimmed = question.trim();
      if (!trimmed || typing) return;
      setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
      setInput("");
      setTyping(true);
      // Simulated "thinking" delay — this is the seam where a real LLM/API
      // call will eventually replace generateAIResponse().
      setTimeout(() => {
         const response = generateAIResponse(trimmed);
         setMessages((prev) => [...prev, { role: "ai", text: response.text, properties: response.properties }]);
         setTyping(false);
      }, 700 + Math.random() * 400);
   };

   return (
      <>
         <button
            type="button"
            aria-label={open ? "Close FCITY AI assistant" : "Open FCITY AI assistant"}
            className={`fcity-ai-fab d-flex align-items-center justify-content-center ${open ? "is-open" : ""}`}
            onClick={() => setOpen((v) => !v)}
         >
            <i className={`fa-regular ${open ? "fa-xmark" : "fa-sparkles"}`}></i>
         </button>

         <div className={`fcity-ai-panel ${open ? "is-open" : ""}`}>
            <div className="fcity-ai-panel-header d-flex align-items-center">
               <span className="fcity-ai-avatar d-flex align-items-center justify-content-center">
                  <i className="fa-regular fa-sparkles"></i>
               </span>
               <div className="ms-2">
                  <div className="fw-500">FCITY AI Advisor</div>
                  <div className="fcity-ai-subtitle">Property intelligence, on demand</div>
               </div>
               <button type="button" aria-label="Close" className="fcity-ai-close ms-auto" onClick={() => setOpen(false)}>
                  <i className="fa-regular fa-xmark"></i>
               </button>
            </div>

            <div className="fcity-ai-body" ref={bodyRef}>
               {messages.map((m, i) => (
                  <div key={i} className={`fcity-ai-row ${m.role}`}>
                     <div className="fcity-ai-bubble">{m.text}</div>
                     {m.properties && m.properties.length > 0 && (
                        <div className="fcity-ai-cards">
                           {m.properties.map((p) => (
                              <div key={p.id} className="fcity-ai-card">
                                 <div className="d-flex align-items-start">
                                    <span className="fcity-ai-card-icon d-flex align-items-center justify-content-center">
                                       <i className={`fa-regular ${typeIcon(p.property_type)}`}></i>
                                    </span>
                                    <div className="ms-2 flex-grow-1">
                                       <div className="fcity-ai-card-title">{p.title}</div>
                                       <div className="fcity-ai-card-meta">{p.address}</div>
                                    </div>
                                 </div>
                                 <div className="fcity-ai-card-tags">
                                    {p.property_type && <span className="tag-type">{p.property_type}</span>}
                                    {p.verification_status && (
                                       <span className={`tag-verify ${p.verification_status === "Verified" ? "is-verified" : ""}`}>
                                          {p.verification_status === "Verified" ? "\u2713 " : ""}{p.verification_status}
                                       </span>
                                    )}
                                    {typeof p.trust_score === "number" && <span className="tag-trust">Trust {p.trust_score}</span>}
                                 </div>
                                 <div className="d-flex align-items-center justify-content-between mt-2">
                                    <strong className="fcity-ai-card-price">{formatINR(p.price)}</strong>
                                    <Link href="/listing_05" className="fcity-ai-card-cta">View Property</Link>
                                 </div>
                              </div>
                           ))}
                        </div>
                     )}
                  </div>
               ))}

               {typing && (
                  <div className="fcity-ai-row ai">
                     <div className="fcity-ai-bubble fcity-ai-typing">
                        <span></span><span></span><span></span>
                     </div>
                  </div>
               )}

               {messages.length === 1 && !typing && (
                  <ul className="style-none fcity-ai-chips d-flex flex-wrap">
                     {SUGGESTED_PROMPTS.map((q, i) => (
                        <li key={i}><button type="button" onClick={() => send(q)}>{q}</button></li>
                     ))}
                  </ul>
               )}
            </div>

            <form
               className="fcity-ai-input d-flex align-items-center"
               onSubmit={(e) => { e.preventDefault(); send(input); }}
            >
               <input
                  type="text"
                  placeholder="Ask about a location, budget or property..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
               />
               <button type="submit" aria-label="Send">
                  <i className="bi bi-arrow-up-right"></i>
               </button>
            </form>
            <div className="fcity-ai-footer-note">
               Prefer a human advisor? <Link href="/contact">Contact our team.</Link>
            </div>
         </div>

         <style jsx>{`
            .fcity-ai-fab {
               position: fixed;
               right: 24px;
               bottom: 24px;
               width: 58px;
               height: 58px;
               border-radius: 50%;
               border: none;
               background: #1c1c1c;
               color: #f3ecd8;
               font-size: 20px;
               box-shadow: 0 12px 30px rgba(20, 20, 10, 0.28);
               z-index: 1050;
               cursor: pointer;
               transition: transform 0.25s ease, background 0.25s ease;
            }
            .fcity-ai-fab:hover { transform: translateY(-2px); background: #c19a4b; color: #1c1c1c; }
            .fcity-ai-fab.is-open { background: #c19a4b; color: #1c1c1c; }

            .fcity-ai-panel {
               position: fixed;
               right: 24px;
               bottom: 96px;
               width: 380px;
               max-width: calc(100vw - 32px);
               height: 560px;
               max-height: calc(100vh - 140px);
               background: #fff;
               border-radius: 18px;
               border: 1px solid #ecebe3;
               box-shadow: 0 24px 60px rgba(20, 20, 10, 0.22);
               display: flex;
               flex-direction: column;
               overflow: hidden;
               z-index: 1049;
               opacity: 0;
               transform: translateY(16px) scale(0.98);
               pointer-events: none;
               transition: opacity 0.22s ease, transform 0.22s ease;
            }
            .fcity-ai-panel.is-open {
               opacity: 1;
               transform: translateY(0) scale(1);
               pointer-events: auto;
            }

            .fcity-ai-panel-header {
               padding: 16px 16px;
               border-bottom: 1px solid #f0efe6;
               background: #faf9f3;
            }
            .fcity-ai-avatar {
               width: 34px;
               height: 34px;
               border-radius: 50%;
               background: #1c1c1c;
               color: #c19a4b;
               flex: 0 0 auto;
            }
            .fcity-ai-subtitle { font-size: 12px; opacity: 0.65; }
            .fcity-ai-close {
               border: none;
               background: transparent;
               font-size: 16px;
               opacity: 0.6;
               cursor: pointer;
            }
            .fcity-ai-close:hover { opacity: 1; }

            .fcity-ai-body {
               flex: 1 1 auto;
               overflow-y: auto;
               padding: 16px;
               background: #fff;
            }

            .fcity-ai-row { margin-bottom: 14px; display: flex; flex-direction: column; }
            .fcity-ai-row.user { align-items: flex-end; }
            .fcity-ai-row.ai { align-items: flex-start; }

            .fcity-ai-bubble {
               max-width: 88%;
               padding: 10px 14px;
               border-radius: 14px;
               font-size: 14px;
               line-height: 1.5;
            }
            .fcity-ai-row.ai .fcity-ai-bubble { background: #f3f1e7; color: #262620; border-bottom-left-radius: 4px; }
            .fcity-ai-row.user .fcity-ai-bubble { background: #1c1c1c; color: #fff; border-bottom-right-radius: 4px; }

            .fcity-ai-typing { display: flex; gap: 4px; align-items: center; }
            .fcity-ai-typing span {
               width: 6px; height: 6px; border-radius: 50%;
               background: #999; display: inline-block;
               animation: fcity-blink 1.2s infinite ease-in-out;
            }
            .fcity-ai-typing span:nth-child(2) { animation-delay: 0.2s; }
            .fcity-ai-typing span:nth-child(3) { animation-delay: 0.4s; }
            @keyframes fcity-blink { 0%, 80%, 100% { opacity: 0.25; } 40% { opacity: 1; } }

            .fcity-ai-chips { margin-top: 8px; }
            .fcity-ai-chips li { margin: 0 8px 8px 0; }
            .fcity-ai-chips button {
               border: 1px solid #ddd7c4;
               background: #fff;
               border-radius: 30px;
               padding: 7px 14px;
               font-size: 12.5px;
               color: #444;
               cursor: pointer;
               transition: all 0.2s ease;
            }
            .fcity-ai-chips button:hover { background: #f3f1e7; border-color: #c19a4b; }

            .fcity-ai-cards { margin-top: 8px; width: 100%; display: flex; flex-direction: column; gap: 8px; }
            .fcity-ai-card {
               border: 1px solid #ecebe3;
               border-radius: 12px;
               padding: 12px;
               background: #fff;
               width: 100%;
            }
            .fcity-ai-card-icon {
               width: 30px; height: 30px; border-radius: 8px;
               background: #eef0e6; color: #6b7d52; flex: 0 0 auto; font-size: 13px;
            }
            .fcity-ai-card-title { font-size: 13.5px; font-weight: 500; color: #1c1c1c; }
            .fcity-ai-card-meta { font-size: 12px; opacity: 0.65; }
            .fcity-ai-card-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
            .fcity-ai-card-tags span {
               font-size: 11px; padding: 3px 8px; border-radius: 20px;
               background: #f3f1e7; color: #555;
            }
            .tag-verify.is-verified { background: rgba(0,181,121,0.12); color: #00B579; }
            .fcity-ai-card-price { font-size: 14px; color: #1c1c1c; }
            .fcity-ai-card-cta {
               font-size: 12px; font-weight: 500; color: #c19a4b;
               text-decoration: underline;
            }

            .fcity-ai-input {
               border-top: 1px solid #f0efe6;
               padding: 10px 12px;
               background: #fff;
            }
            .fcity-ai-input input {
               flex: 1 1 auto;
               border: none;
               outline: none;
               font-size: 13.5px;
               padding: 8px 6px;
               background: transparent;
            }
            .fcity-ai-input button {
               border: none;
               background: #1c1c1c;
               color: #fff;
               width: 34px;
               height: 34px;
               border-radius: 50%;
               flex: 0 0 auto;
               cursor: pointer;
            }
            .fcity-ai-input button:hover { background: #c19a4b; color: #1c1c1c; }

            .fcity-ai-footer-note {
               font-size: 11px;
               text-align: center;
               opacity: 0.6;
               padding: 6px 0 12px;
            }
            .fcity-ai-footer-note :global(a) { color: #c19a4b; text-decoration: underline; }

            @media (max-width: 575px) {
               .fcity-ai-panel {
                  right: 12px;
                  left: 12px;
                  bottom: 88px;
                  width: auto;
                  max-width: none;
                  height: calc(100vh - 120px);
               }
               .fcity-ai-fab { right: 16px; bottom: 16px; }
            }
         `}</style>
      </>
   )
}

export default FcityAIWidget
