import React, { useEffect, useRef } from 'react';

const metrics = [
  { value: "2KB", label: "Peso do script" },
  { value: "< 50ms", label: "Latência" },
  { value: "99.9%", label: "Uptime" },
  { value: "LGPD", label: "Conformidade" },
  { value: "0", label: "Cookies invasivos" },
];

export default function TrustBar() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      });
    }, { threshold: 0.1 });
    
    if (barRef.current) {
      observer.observe(barRef.current);
    }
    
    return () => observer.disconnect();
  }, []);

  return (
    <div className="w-full relative z-10 px-4 md:px-6 mt-12 md:mt-16 mb-8">
      <div 
        ref={barRef}
        className="max-w-5xl mx-auto glass-panel reveal-scroll fade-up rounded-2xl p-6 md:p-8 border border-white/5 bg-black/40 backdrop-blur-md"
      >
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 md:gap-4 divide-y md:divide-y-0 md:divide-x divide-white/10 text-center">
          {metrics.map((metric, idx) => (
            <div key={idx} className={`flex flex-col items-center justify-center pt-4 md:pt-0 ${idx === 0 ? 'pt-0' : ''}`}>
              <div className="text-2xl md:text-3xl font-bold primary-text-gradient mb-1">
                {metric.value}
              </div>
              <div className="text-sm text-gray-400 font-medium">
                {metric.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
