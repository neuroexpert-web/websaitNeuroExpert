import React from 'react';

const AnimatedGradientBackground = ({ visible = true, className = '' }) => {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 w-full h-full overflow-hidden transition-opacity duration-700 ease-out ${
        visible ? 'opacity-100' : 'opacity-0'
      } ${className}`}
    >
      {/* Base dark gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0e1a] via-[#1a1f2e] to-[#0b0f17]" />
      
      {/* Animated gradient layer 1 - Cyan */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          background: 'radial-gradient(ellipse at 30% 40%, rgba(125, 211, 252, 0.25) 0%, transparent 60%)',
          animation: 'float1 18s ease-in-out infinite'
        }}
      />
      
      {/* Animated gradient layer 2 - Purple */}
      <div 
        className="absolute inset-0 opacity-25"
        style={{
          background: 'radial-gradient(ellipse at 70% 70%, rgba(118, 75, 162, 0.3) 0%, transparent 55%)',
          animation: 'float2 20s ease-in-out infinite'
        }}
      />
      
      {/* Animated gradient layer 3 - Blue accent */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.2) 0%, transparent 70%)',
          animation: 'float3 22s ease-in-out infinite'
        }}
      />
      
      {/* Subtle noise texture overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' /%3E%3C/svg%3E")',
          backgroundSize: '200px 200px'
        }}
      />
      
      {/* Gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f17] via-transparent to-[#0b0f17]/50 opacity-60" />
      
      {/* CSS animations */}
      <style>{`
        @keyframes float1 {
          0%, 100% { 
            transform: translate(0%, 0%) scale(1);
            opacity: 0.3;
          }
          33% { 
            transform: translate(-15%, 15%) scale(1.15);
            opacity: 0.35;
          }
          66% { 
            transform: translate(10%, -10%) scale(0.95);
            opacity: 0.25;
          }
        }
        
        @keyframes float2 {
          0%, 100% { 
            transform: translate(0%, 0%) scale(1);
            opacity: 0.25;
          }
          33% { 
            transform: translate(12%, -12%) scale(1.1);
            opacity: 0.3;
          }
          66% { 
            transform: translate(-8%, 8%) scale(0.9);
            opacity: 0.2;
          }
        }
        
        @keyframes float3 {
          0%, 100% { 
            transform: translate(0%, 0%) scale(1) rotate(0deg);
            opacity: 0.2;
          }
          50% { 
            transform: translate(-5%, 5%) scale(1.2) rotate(5deg);
            opacity: 0.25;
          }
        }
      `}</style>
    </div>
  );
};

export default AnimatedGradientBackground;
