import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface Particle {
  id: number;
  size: number;
  left: number;
  top: number;
  delay: number;
  duration: number;
}

const HomePage: React.FC = () => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    const generateParticles = () => {
      const newParticles: Particle[] = [];
      for (let i = 0; i < 20; i++) {
        newParticles.push({
          id: i,
          size: Math.random() * 8 + 4,
          left: Math.random() * 100,
          top: Math.random() * 100,
          delay: Math.random() * 6,
          duration: Math.random() * 6 + 6,
        });
      }
      setParticles(newParticles);
    };

    generateParticles();
    setTimeout(() => setIsLoaded(true), 100);
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.3),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(120,119,198,0.3),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(255,119,198,0.3),transparent_50%)]"></div>
        {particles.map(p => (
          <div
            key={p.id}
            className="absolute rounded-full bg-white/20 backdrop-blur-sm animate-pulse"
            style={{
              width: `${p.size}px`,
              height: `${p.size}px`,
              left: `${p.left}%`,
              top: `${p.top}%`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              transform: `translateY(${Math.sin(p.id) * 20}px)`
            }}
          />
        ))}
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        <header className={`text-center py-16 px-6 transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="max-w-4xl mx-auto">
            <div className="relative inline-block mb-8">
              <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-purple-200 drop-shadow-2xl">
                QRPresence
              </h1>
              <div className="absolute -top-4 -right-4 w-16 h-16 border-4 border-blue-400/60 rounded-xl animate-spin-slow">
                <div className="w-full h-full grid grid-cols-3 grid-rows-3 gap-1 p-2">
                  {[...Array(9)].map((_, i) => (
                    <div key={i} className={`${[0,1,2,3,5,6,7,8].includes(i) ? 'bg-blue-400/80' : 'bg-transparent'} rounded-sm`} />
                  ))}
                </div>
              </div>
            </div>
            <p className="text-xl md:text-2xl text-white/90 font-light leading-relaxed max-w-3xl mx-auto">
              Your smart solution for seamless student registration and real-time attendance tracking
            </p>
          </div>
        </header>

        <main className="flex-1 px-6 pb-16">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            {[{
              title: 'Student Registration',
              desc: 'Effortlessly register new students and manage their profiles with our intuitive dashboard. Streamline administrative tasks with automated validation and secure data storage.',
              link: '/register',
              iconColor: 'from-blue-500 to-purple-600',
              borderColor: 'from-blue-400 to-purple-500',
              hoverText: 'text-blue-300'
            }, {
              title: 'User Login',
              desc: 'Access your personalized dashboard to view attendance records, manage sessions, and track academic progress. Secure authentication ensures your data stays protected.',
              link: '/Login',
              iconColor: 'from-emerald-500 to-teal-600',
              borderColor: 'from-emerald-400 to-teal-500',
              hoverText: 'text-emerald-300'
            }].map((card, i) => (
              <div key={i} className={`group transition-all duration-700 delay-${i * 200} ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                <div className="relative h-full">
                  <div className={`absolute inset-0 bg-gradient-to-r ${card.iconColor}/30 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 scale-110`}></div>
                  <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 h-full hover:bg-white/15 transition-all duration-500 group-hover:-translate-y-2 shadow-2xl">
                    <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${card.borderColor} rounded-t-3xl transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500`}></div>
                    <div className={`w-20 h-20 bg-gradient-to-br ${card.iconColor} rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <h2 className={`text-3xl font-bold text-white mb-4 group-hover:${card.hoverText} transition-colors duration-300`}>
                      {card.title}
                    </h2>
                    <p className="text-white/80 mb-8 text-lg leading-relaxed">{card.desc}</p>
                    <Link to={card.link} className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-white/30 to-white/10 border border-white/20 text-white font-semibold rounded-xl hover:bg-white/30 hover:border-white/50 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl">
                      <span>{card.title === 'User Login' ? 'Login to Dashboard' : 'Register New User'}</span>
                      <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>

        <footer className={`text-center py-8 px-6 transition-all duration-1000 delay-600 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="max-w-4xl mx-auto bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <p className="text-white/70 text-lg">&copy; 2025 QRPresence. All rights reserved.</p>
            <p className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-300 font-medium mt-2">Empowering education through innovative technology</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default HomePage;
