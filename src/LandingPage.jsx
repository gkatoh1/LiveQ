import { Link } from 'react-router-dom'

// ==========================================
// 1. COMPONENT: PHONE VIDEO (MASTER)
// ==========================================
function MasterVideo({ 
  src, 
  width = "238px",    
  height = "449px",   
  scale = 1.45,        
  y = "-37px",
  roundness = "30px"
}) {
  return (
    <div 
      className="relative z-10 mx-auto overflow-hidden shadow-2xl shadow-black/50 border border-white/10 group-hover:scale-105 transition-transform duration-700 ease-out bg-black"
      style={{ 
        width: width, 
        height: height, 
        borderRadius: roundness 
      }}
    >
       <video 
         src={src}
         autoPlay 
         loop 
         muted 
         playsInline 
         className="w-full h-full object-cover"
         style={{ transform: `scale(${scale}) translateY(${y})` }}
       />
       <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent pointer-events-none"></div>
    </div>
  )
}

// ==========================================
// 2. COMPONENT: LAPTOP VIDEO (ADMIN)
// ==========================================
function LaptopVideo({ 
  src,
  maxWidth = "800px",  
  scale = 1.0,        
  y = "0%"            
}) {
  const isImage = src.endsWith('.jpg') || src.endsWith('.png') || src.endsWith('.jpeg');

  return (
    <div 
      className="relative mx-auto w-full group px-2 sm:px-0"
      style={{ maxWidth: maxWidth }}
    >
      {/* Top Lid */}
      <div className="relative bg-[#1a1a1a] rounded-t-[0.5rem] sm:rounded-t-[1rem] p-[2%] shadow-2xl border-t border-x border-white/10 transition-transform duration-700 group-hover:translate-y-[-5px]">
         <div className="absolute top-[4%] left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-black rounded-full ring-1 ring-white/10 z-20"></div>
         
         <div className="relative overflow-hidden rounded-[2px] sm:rounded-[4px] aspect-[16/10] bg-black">
            {isImage ? (
               <img 
                 src={src} 
                 alt="Admin Dashboard" 
                 className="w-full h-full object-cover"
                 style={{ transform: `scale(${scale}) translateY(${y})` }}
               />
            ) : (
               <video 
                 src={src} 
                 autoPlay loop muted playsInline 
                 className="w-full h-full object-cover" 
                 style={{ transform: `scale(${scale}) translateY(${y})` }}
               />
            )}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none"></div>
         </div>
      </div>
      {/* Bottom Base */}
      <div className="relative h-2 sm:h-4 bg-[#252525] rounded-b-[0.5rem] sm:rounded-b-[1rem] shadow-[0_20px_50px_rgba(0,0,0,0.6)] border-b border-x border-white/5 mx-[2px]">
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 sm:w-24 h-1 bg-[#151515] rounded-b-md"></div>
      </div>
    </div>
  )
}

// ==========================================
// 3. COMPONENT: PROJECTOR SCREEN
// ==========================================
function ProjectorScreen({ 
  src,
  maxWidth = "900px",
  scale = 1.0,
  y = "0%"
}) {
  return (
    <div 
      className="relative mx-auto w-full group perspective-[2000px] px-2 sm:px-0"
      style={{ maxWidth: maxWidth }}
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[80%] bg-green-500/20 blur-[120px] rounded-full pointer-events-none animate-pulse-slow"></div>

      <div className="relative bg-black p-[4px] sm:p-[6px] shadow-2xl shadow-green-900/20 ring-1 ring-white/10">
         <div className="relative aspect-video bg-black overflow-hidden border border-white/5">
            <video 
              src={src} 
              autoPlay loop muted playsInline 
              className="w-full h-full object-cover opacity-95 brightness-110"
              style={{ transform: `scale(${scale}) translateY(${y})` }}
            />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none mix-blend-overlay"></div>
         </div>
      </div>

      <div className="absolute -bottom-12 left-0 right-0 h-12 bg-gradient-to-b from-green-500/10 to-transparent blur-xl transform scale-y-[-1] opacity-30"></div>
    </div>
  )
}

// ==========================================
// 4. COMPONENT: FEATURE SECTION (PHONE)
// ==========================================
function FeatureSection({ 
  title, description, src, align = 'left', color = 'indigo'
}) {
  const isLeft = align === 'left'
  const colorMap = {
    indigo: 'bg-indigo-600/30',
    purple: 'bg-purple-600/30',
    green:  'bg-emerald-600/30',
    blue:   'bg-blue-600/30',
    red:    'bg-rose-600/30',
  }
  const glowColor = colorMap[color] || colorMap.indigo

  return (
    <div className="py-16 md:py-24 relative overflow-hidden">
      <div className={`max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center gap-12 md:gap-32 ${isLeft ? '' : 'md:flex-row-reverse'}`}>
        <div className="flex-1 text-center md:text-left z-10 min-w-0">
          <h3 className="text-3xl md:text-5xl font-black mb-4 md:mb-6 tracking-tight leading-tight text-white drop-shadow-lg md:break-keep">
            {title}
          </h3>
          <p className="text-lg md:text-xl text-indigo-100/70 leading-relaxed font-medium">
            {description}
          </p>
        </div>
        <div className="flex-1 flex justify-center relative group w-full">
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[500px] blur-[80px] rounded-full pointer-events-none transition-opacity duration-700 ${glowColor}`}></div>
          <MasterVideo src={src} />
        </div>
      </div>
    </div>
  )
}

// ==========================================
// 5. MAIN LANDING PAGE
// ==========================================
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0A051E] text-white font-sans selection:bg-indigo-500 selection:text-white overflow-x-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-[#0A051E] to-[#0A051E]">
      
      {/* NAVBAR */}
      <nav className="fixed top-0 w-full z-50 bg-[#0A051E]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          
          <Link to="/" className="flex items-center">
             <img src="/logo.png" alt="LiveQ" className="h-7 w-auto object-contain" />
          </Link>

          <div className="flex items-center gap-6">
             {/* LOGIN BUTTON (Sets mode=login) */}
             <Link to="/admin?mode=login" className="text-sm font-bold text-indigo-200 hover:text-white transition-colors">
               ログイン
             </Link>

             {/* CTA BUTTON (Sets mode=signup) */}
             <Link to="/admin?mode=signup" className="text-sm font-bold bg-indigo-600 text-white px-5 py-2 rounded-full hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-900/30">
               無料で始める
             </Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[600px] bg-indigo-600/20 blur-[130px] rounded-full pointer-events-none opacity-60"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 border border-indigo-400/30 bg-indigo-400/10 text-indigo-200 px-4 py-1.5 rounded-full text-xs font-bold mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700 cursor-default">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse shadow-[0_0_10px_rgba(129,140,248,0.5)]"></span>
            アプリDL不要・登録不要
          </div>
          
          <h1 className="text-5xl md:text-8xl font-black tracking-tighter mb-6 leading-[0.9] animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100 text-white drop-shadow-2xl md:break-keep">
            そのイベントに、<br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 animate-gradient-x">熱狂を実装する。</span>
          </h1>
          
          <p className="text-lg md:text-xl text-indigo-200/80 mb-10 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200 md:break-keep">
            QRコードをかざすだけで、会場がひとつに。<br className="hidden md:block" />
            質問、投票、リアクション。すべてがリアルタイム。
          </p>
          
          {/* HERO BUTTONS */}
          <div className="flex flex-row gap-3 sm:gap-4 justify-center items-center animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300 w-full max-w-md mx-auto sm:max-w-none">
            {/* Primary (Signup) */}
            <Link 
              to="/admin?mode=signup" 
              className="flex-1 sm:flex-none w-auto px-4 py-3 sm:px-10 sm:py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-full text-base sm:text-lg hover:scale-105 transition-transform shadow-xl shadow-indigo-900/50 flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <span>🚀</span> 無料で始める
            </Link>

            {/* Secondary */}
            <Link 
              to="/demopage" 
              className="flex-1 sm:flex-none w-auto px-4 py-3 sm:px-10 sm:py-4 bg-white/5 border border-white/10 text-white font-bold rounded-full text-base sm:text-lg hover:bg-white/10 transition-colors backdrop-blur-sm flex items-center justify-center whitespace-nowrap"
            >
              デモを試す
            </Link>
          </div>

        </div>
      </section>

      {/* ... [Features and other sections same as before] ... */}
      <FeatureSection 
        title="0.1秒の熱狂共有。"
        description="ラグのないリアルタイムチャットで、会場のボルテージを可視化。言葉にならない感情もスタンプで直感的に。"
        src="/chat.mp4" color="indigo" align="left"
      />
      <FeatureSection 
        title="会場の総意が一瞬で。"
        description="「AかBか？」迷った時は会場に聞きましょう。ライブ投票機能を使えば、参加者全員が意思決定に参加できます。"
        src="/poll.mp4" color="purple" align="right"
      />
      <FeatureSection 
        title="本当に聞きたいことを。"
        description="限られた質疑応答の時間。匿名投稿と「いいね」機能で、会場全体が最も関心を持っている質問をあぶり出します。"
        src="/questions.mp4" color="green" align="left"
      />
      <FeatureSection 
        title="心理的ハードル ゼロ。"
        description="手を挙げる勇気は要りません。ログインも要りません。QRコードを読み込むだけ。誰でも、今すぐ、参加できます。"
        src="/ask.mp4" color="blue" align="right"
      />
      <FeatureSection 
        title="荒らし対策も完璧に。"
        description="AIによる不適切ワードの自動ブロックに加え、管理画面からワンタップで特定のユーザーを追放（BAN）できます。"
        src="/ban.mp4" color="red" align="left"
      />

      {/* --- ADMIN SECTION --- */}
      <section className="py-24 px-6 border-t border-white/5 relative bg-black/20">
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl h-[600px] bg-indigo-900/10 blur-[120px] rounded-full pointer-events-none opacity-50"></div>

         <div className="max-w-7xl mx-auto text-center relative z-10">
            <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tight text-white md:break-keep">
               直感的な<span className="text-indigo-400">管理画面</span>
            </h2>
            <p className="text-lg md:text-xl text-indigo-200/60 mb-12 max-w-2xl mx-auto md:break-keep">
               マニュアルは不要です。直感的なUIで、イベントの進行をスムーズに。<br className="hidden md:block" />
               PCはもちろん、タブレットからも操作可能です。
            </p>
            
            <LaptopVideo 
              src="/admin.jpg" 
              maxWidth="800px" 
              scale={0.95} 
              y="0%" 
            />
         </div>
      </section>

      {/* --- PROJECTOR SECTION --- */}
      <section className="py-24 px-6 border-t border-white/5 relative bg-[#050505]">
         <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row items-center gap-12 md:gap-24">
               
               <div className="flex-1 text-center md:text-left min-w-0">
                  <div className="inline-block bg-green-500/10 text-green-400 px-3 py-1 rounded-full text-xs font-bold mb-4 border border-green-500/20">
                     📺 会場スクリーンモード
                  </div>
                  <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tight leading-tight text-white md:break-keep">
                     会場を<br className="hidden md:block"/>
                     <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">ジャックしよう。</span>
                  </h2>
                  <p className="text-lg text-indigo-200/60 leading-relaxed mb-8 md:break-keep">
                     プロジェクター専用のデザインも標準装備。<br className="hidden md:block"/>
                     URLを開くだけで、コメントや投票結果が<br className="hidden md:block"/>
                     美しくアニメーション表示されます。
                  </p>
                  <Link to="/projector/demo" target="_blank" className="inline-flex items-center gap-2 text-green-400 font-bold hover:text-green-300 transition-colors">
                     実際のスクリーン画面を見る <span className="text-lg">→</span>
                  </Link>
               </div>

               <div className="flex-[1.5] w-full">
                  <ProjectorScreen 
                    src="/projector.mp4" 
                    maxWidth="900px"
                    scale={1.35} 
                    y="-10%"  
                  />
               </div>

            </div>
         </div>
      </section>

      {/* --- FOOTER CTA --- */}
      <section className="py-32 px-6 text-center relative overflow-hidden">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-900/30 blur-[150px] rounded-full pointer-events-none opacity-60"></div>
        
        <div className="relative z-10 max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-6xl font-black mb-8 tracking-tighter text-white md:break-keep">
                さあ、イベントを始めよう。
            </h2>
            <div className="flex justify-center gap-8 mb-12 text-indigo-200/60 font-mono text-sm">
                <span>✓ 初期費用 0円</span>
                <span>✓ クレカ登録不要</span>
                <span>✓ 即日利用可能</span>
            </div>
            {/* CTA (Signup) */}
            <Link to="/admin?mode=signup" className="inline-block px-12 py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-full text-xl hover:scale-105 transition-transform shadow-xl shadow-indigo-900/50">
                無料でイベントを作成
            </Link>
            <p className="mt-12 text-indigo-400/40 text-xs">© 2025 liveq.netlify.app</p>
        </div>
      </section>

    </div>
  )
}