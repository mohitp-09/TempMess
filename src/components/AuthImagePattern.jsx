import React from 'react';

const AuthImagePattern = ({ title, subtitle }) => {
  const getAnimationClass = (index) => {
    const animations = [
      'animate-slideInLeft',
      'animate-slideInRight',
      'animate-slideInUp',
      'animate-slideInDown',
      'animate-fadeIn',
      'animate-scaleIn',
      'animate-rotateIn'
    ];
    return animations[index % animations.length];
  };

  return (
    <div className="hidden lg:flex items-center justify-center bg-base-200 p-12 relative overflow-hidden">
      <div className="max-w-md text-center relative z-10">
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[...Array(9)].map((_, i) => (
            <div
              key={i}
              className={`
                aspect-square rounded-2xl bg-primary/10 border border-primary/20
                backdrop-blur-sm shadow-lg relative overflow-hidden
                transform transition-all duration-700 ease-out
                hover:scale-110 hover:rotate-2 hover:shadow-xl hover:border-primary/30
                hover:bg-primary/20 cursor-pointer
                animate-fadeInUp
                ${getAnimationClass(i)}
                ${i % 3 === 1 ? 'animate-bounce-slow' : ''}
                ${i % 4 === 0 ? 'animate-pulse-slow' : ''}
                ${i === 4 ? 'animate-spin-slow' : ''}
              `}
              style={{
                animationDelay: `${i * 150}ms`,
                animationFillMode: 'both'
              }}
            >
              {/* Inner gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl" />

              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent -translate-x-full animate-shimmer rounded-2xl" />

              {/* Corner accent */}
              <div className="absolute top-1 right-1 w-2 h-2 bg-accent/30 rounded-full animate-pulse" />
            </div>
          ))}
        </div>

        <div className="animate-fadeInUp" style={{ animationDelay: '1.2s', animationFillMode: 'both' }}>
          <h2 className="text-3xl font-bold mb-4 text-base-content tracking-tight">
            {title}
          </h2>
          <p className="text-base-content/70 text-lg leading-relaxed">
            {subtitle}
          </p>
        </div>

        {/* Floating decorative elements with theme colors */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary/20 rounded-full animate-float-slow" />
          <div className="absolute top-3/4 right-1/4 w-3 h-3 bg-secondary/20 rounded-full animate-float-delayed" />
          <div className="absolute bottom-1/3 left-1/3 w-1.5 h-1.5 bg-accent/20 rounded-full animate-float-fast" />
          <div
            className="absolute top-1/2 right-1/3 w-2.5 h-2.5 bg-neutral/15 rounded-full animate-float-slow"
            style={{ animationDelay: '3s' }}
          />
        </div>

        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-32 h-32 bg-primary rounded-full blur-3xl animate-pulse-slow" />
          <div
            className="absolute bottom-0 right-0 w-40 h-40 bg-secondary rounded-full blur-3xl animate-pulse-slow"
            style={{ animationDelay: '2s' }}
          />
        </div>
      </div>
    </div>
  );
};

export default AuthImagePattern;