import { useState, useEffect, useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'

// ==========================================
// 0. MOCK DATA
// ==========================================
const NAMES = ["Kenji", "Ayaka", "Taro_Dev", "Guest_01", "DesignPro", "Sarah", "M.Tanaka", "Anonymous", "TechLead", "Rina", "S.Suzuki"]

const TALK_SHOW_CHAT = [
  "音声クリアです！🔊", "その視点は新しいですね", "アーカイブ配信はありますか？", 
  "具体例があれば知りたいです", "メモ必須の内容だ...", "質問送りました！", 
  "確かに、それが一番の課題かも", "ゲストの方の話、説得力あります", 
  "資料の共有は後ほどありますか？", "なるほど🤔", "今の話、すごく共感しました", 
  "時間配分バッチリですね", "勉強になります！", "次のセッションも楽しみ"
]

const TALK_SHOW_QS = [
  { id: 1, nickname: "駆け出しエンジニア", content: "未経験からそのキャリアを築くために、最初に学ぶべきことは何だとお考えですか？", likes: 156, created_at: Date.now() - 10000 },
  { id: 2, nickname: "PM志望", content: "チームの意見が割れたとき、最終的な意思決定の基準にしているものはありますか？", likes: 98, created_at: Date.now() - 20000 },
  { id: 3, nickname: "匿名", content: "失敗談があれば教えてください。そこからどうリカバリーしましたか？", likes: 72, created_at: Date.now() - 30000 },
  { id: 4, nickname: "DesignLead", content: "お気に入りの生産性向上ツールや書籍があればシェアしていただきたいです。", likes: 45, created_at: Date.now() - 40000 },
  { id: 5, nickname: "Guest", content: "今後の業界のトレンドについて、個人的な予想を聞かせてください。", likes: 23, created_at: Date.now() - 50000 }
]

const MOCK_POLLS = [
    { id: 1, question: "次回の開催地はどこがいい？", options: [{label:"東京", count:10}, {label:"大阪", count:5}, {label:"オンライン", count:20}] },
    { id: 2, question: "現在、職業は？", options: [{label:"エンジニア", count:0}, {label:"デザイナー", count:0}, {label:"学生", count:0}] }
]

const MOCK_ALERTS = [
    { id: 101, nickname: "Spam_Bot_99", user_id: "u_8821", content: "副業で月収100万！詳しくはこちら http://spam.link...", created_at: Date.now() }
]

const MOCK_BANNED = [
    { id: "ban_1", nickname: "Troll_User_01", user_id: "u_9999", created_at: Date.now() }
]

// ==========================================
// 1. AUDIENCE VIEW COMPONENTS (PHONE)
// ==========================================

function DemoChatTab() {
  const [msgs, setMsgs] = useState([{ id: 0, nickname: "System", content: "トークセッションを開始しました" }])

  useEffect(() => {
    const i = setInterval(() => {
      setMsgs(prev => {
        const n = [...prev, { id: Date.now(), nickname: NAMES[Math.floor(Math.random() * NAMES.length)], content: TALK_SHOW_CHAT[Math.floor(Math.random() * TALK_SHOW_CHAT.length)] }]
        if(n.length>12) n.shift() 
        return n
      })
    }, 2000)
    return () => clearInterval(i)
  }, [])

  return (
    <div className="flex flex-col h-full relative">
      <div className="flex-1 overflow-hidden p-4 space-y-2 pb-24">
        {msgs.map((m, i) => (
          <div key={i} className="bg-zinc-900 p-2 rounded-lg break-all animate-in fade-in slide-in-from-bottom-1">
            <span className="font-bold text-indigo-400 text-xs">{m.nickname}: </span>
            <span className="text-sm text-white">{m.content}</span>
          </div>
        ))}
        <div className="absolute bottom-16 left-0 right-0 h-12 bg-gradient-to-t from-black to-transparent pointer-events-none"></div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-black/95 border-t border-zinc-800 flex gap-2 z-20">
        <input disabled className="flex-1 bg-zinc-900 text-white p-2 rounded border border-zinc-700 outline-none" placeholder="メッセージ..." />
        <button disabled className="bg-indigo-600 px-4 rounded-xl font-bold text-sm text-white opacity-50">送信</button>
      </div>
    </div>
  )
}

function DemoQuestionsListTab() {
  return (
    <div className="flex flex-col h-full bg-black text-white p-4 overflow-hidden">
      <div className="flex gap-2 mb-4 bg-zinc-900 p-1 rounded-lg shrink-0 border border-zinc-800">
        <button className="flex-1 py-1 rounded text-sm bg-zinc-700 font-bold">人気順</button>
        <button className="flex-1 py-1 rounded text-sm text-zinc-500">新着順</button>
      </div>
      <div className="flex-1 overflow-hidden space-y-3 pb-4 relative">
        {TALK_SHOW_QS.map(q => (
          <div key={q.id} className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
            <p className="text-xs font-bold text-zinc-500 mb-1">{q.nickname}</p>
            <p className="text-lg mb-4 break-all leading-tight text-white">{q.content}</p>
            <div className="flex gap-3">
              <button className="bg-zinc-800 px-4 py-2 rounded-xl text-green-400 text-sm border border-zinc-700 flex items-center gap-2">👍 {q.likes}</button>
            </div>
          </div>
        ))}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black to-transparent pointer-events-none"></div>
      </div>
    </div>
  )
}

function DemoSubmitQuestionTab() {
  return (
    <div className="h-full bg-black text-white p-6 flex flex-col justify-center max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-2">質問を投稿する</h2>
      <div className="mb-4 font-bold text-sm text-indigo-400">あと 2 件質問できます</div>
      <textarea className="bg-zinc-900 text-white p-4 rounded-2xl h-40 mb-6 text-lg border border-zinc-700 outline-none" placeholder="デモモードのため送信できません..." disabled />
      <button disabled className="bg-zinc-800 text-zinc-500 py-4 rounded-2xl font-bold text-lg cursor-not-allowed">送信 (Demo)</button>
    </div>
  )
}

function PhoneView() {
  const [tab, setTab] = useState('chat')
  return (
    <div className="w-[340px] xs:w-[375px] h-[650px] xs:h-[700px] bg-black border-[8px] xs:border-[12px] border-zinc-800 rounded-[2.5rem] xs:rounded-[3rem] shadow-2xl overflow-hidden relative flex flex-col ring-1 ring-white/10 mx-auto">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 xs:h-7 bg-zinc-800 rounded-b-2xl z-50"></div>
      <div className="flex-none bg-zinc-900 z-10 pt-8">
        <div className="p-4 flex justify-between items-center border-b border-zinc-800">
          <h1 className="font-bold truncate text-zinc-100">LiveQ Demo</h1>
          <span className="text-xs bg-zinc-900 text-zinc-500 px-2 py-1 rounded border border-zinc-800">Demo</span>
        </div>
        <div className="flex h-12 border-b border-zinc-900">
          <button onClick={()=>setTab('chat')} className={`flex-1 font-bold text-sm ${tab==='chat'?'text-indigo-400 bg-zinc-900/50':'text-zinc-500'}`}>チャット</button>
          <button onClick={()=>setTab('questions')} className={`flex-1 font-bold text-sm ${tab==='questions'?'text-indigo-400 bg-zinc-900/50':'text-zinc-500'}`}>質問一覧</button>
          <button onClick={()=>setTab('ask')} className={`flex-1 font-bold text-sm ${tab==='ask'?'text-indigo-400 bg-zinc-900/50':'text-zinc-500'}`}>質問する</button>
        </div>
      </div>
      <div className="flex-1 relative overflow-hidden bg-black">
        {tab === 'chat' && <DemoChatTab />}
        {tab === 'questions' && <DemoQuestionsListTab />}
        {tab === 'ask' && <DemoSubmitQuestionTab />}
      </div>
    </div>
  )
}

// ==========================================
// 2. ADMIN VIEW COMPONENTS (DUMMY)
// ==========================================

function DummyPollManager() {
    return (
        <div className="h-full overflow-hidden">
             <h2 className="text-xl font-bold mb-4">📊 投票管理</h2>
             <div className="bg-zinc-900 p-4 rounded-xl mb-4 border border-zinc-800 shadow-md opacity-75">
                <h3 className="font-bold mb-2 text-xs text-zinc-400">新規作成 (デモ)</h3>
                <input placeholder="質問文" disabled className="w-full bg-black p-2 rounded mb-2 border border-zinc-700 text-zinc-500 text-sm"/>
                <div className="flex gap-2"><input disabled placeholder="選択肢 1" className="flex-1 bg-black p-2 rounded border border-zinc-700 text-zinc-500 text-sm"/></div>
             </div>
             <div className="space-y-3">
                {MOCK_POLLS.map(p => (
                    <div key={p.id} className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 flex flex-col gap-3">
                        <div>
                            <p className="font-bold">{p.question}</p>
                            <p className="text-xs text-zinc-500 mt-1">{p.options.map(o=>o.label).join(' / ')}</p>
                        </div>
                        <div className="flex gap-2 w-full">
                            <button className="flex-1 py-2 rounded text-xs font-bold border bg-black border-zinc-700 text-zinc-400">参加時</button>
                            <button className="flex-1 py-2 rounded text-xs font-bold border bg-black border-zinc-700 text-zinc-400">LIVE</button>
                            <button className="w-8 flex items-center justify-center rounded bg-zinc-800 text-red-500 border border-zinc-700">🗑️</button>
                        </div>
                    </div>
                ))}
             </div>
        </div>
    )
}

function DummyChatManager() {
    return (
        <div className="space-y-4 h-full overflow-hidden relative">
            <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-bold text-blue-400">💬 チャット管理</h2>
                <button className="bg-red-900/30 text-red-300 border border-red-800 px-3 py-1 rounded text-xs">削除</button>
            </div>
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
                {TALK_SHOW_CHAT.slice(0,5).map((msg, i) => (
                    <div key={i} className="p-3 border-b border-zinc-800 flex justify-between items-start">
                        <div className="min-w-0 pr-2">
                            <span className="text-xs text-zinc-500 font-bold block mb-0.5">{NAMES[i % NAMES.length]}</span>
                            <span className="text-zinc-300 text-sm break-all">{msg}</span>
                        </div>
                        <button className="text-zinc-500 hover:text-red-500 p-2">✕</button>
                    </div>
                ))}
                <div className="p-2 text-center text-zinc-600 text-xs">...他 12件</div>
            </div>
        </div>
    )
}

function DummyQuestionManager() {
    return (
        <div className="space-y-4 h-full overflow-hidden">
            <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-bold text-green-400">❓ 質問管理</h2>
                <button className="bg-red-900/30 text-red-300 border border-red-800 px-3 py-1 rounded text-xs">削除</button>
            </div>
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
                {TALK_SHOW_QS.slice(0,3).map(q => (
                    <div key={q.id} className="p-3 border-b border-zinc-800 flex justify-between items-start">
                        <div className="min-w-0 pr-2">
                            <div className="text-xs text-zinc-500 font-bold mb-1">{q.nickname} <span className="ml-2 bg-zinc-800 px-1.5 rounded">👍{q.likes}</span></div>
                            <div className="text-zinc-300 text-sm break-all">{q.content}</div>
                        </div>
                        <button className="text-zinc-500 hover:text-red-500 p-2">✕</button>
                    </div>
                ))}
            </div>
        </div>
    )
}

function DummyModerationPanel() {
    return (
        <div className="space-y-4 h-full overflow-hidden">
            <h2 className="text-xl font-bold mb-4 text-red-400 flex items-center gap-2">🚨 違反報告</h2>
            {MOCK_ALERTS.map(alert => (
                <div key={alert.id} className="bg-red-900/20 border border-red-500/50 p-4 rounded-xl flex flex-col gap-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-red-300 truncate text-sm">{alert.nickname}</span>
                            <span className="text-xs text-red-500/70 font-mono">ID:{alert.user_id}</span>
                        </div>
                        <p className="text-white text-sm break-all bg-black/50 p-2 rounded">{alert.content}</p>
                    </div>
                    <div className="flex gap-2 w-full">
                        <button className="flex-1 px-4 py-2 rounded border border-zinc-600 text-zinc-400 text-xs font-bold">無視</button>
                        <button className="flex-1 px-4 py-2 rounded bg-red-600 text-white font-bold text-xs">BAN</button>
                    </div>
                </div>
            ))}
            <p className="text-zinc-500 text-center text-xs mt-4">これ以上の報告はありません</p>
        </div>
    )
}

function DummyBannedList() {
    return (
        <div className="space-y-6 h-full overflow-hidden">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-zinc-400">🚫 BANリスト</h2>
                <button className="text-xs text-blue-400 underline">更新</button>
            </div>
            <div className="space-y-2">
                {MOCK_BANNED.map(user => (
                    <div key={user.id} className="bg-zinc-900 p-4 rounded-xl border border-zinc-700 flex justify-between items-center">
                        <div>
                            <div className="flex items-center gap-2">
                                <p className="font-bold text-white text-sm">{user.nickname}</p>
                                <span className="bg-red-500/20 text-red-400 text-[10px] px-2 rounded">BANNED</span>
                            </div>
                            <p className="text-[10px] text-zinc-500 font-mono">ID: {user.user_id}</p>
                        </div>
                        <button className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-bold opacity-80">解除</button>
                    </div>
                ))}
            </div>
        </div>
    )
}

function AdminView() {
    const [tab, setTab] = useState('polls')

    return (
        <div className="bg-black border border-zinc-800 rounded-3xl overflow-hidden w-full max-w-5xl h-[600px] md:h-auto md:aspect-video mx-auto shadow-2xl flex flex-col relative">
            {/* Header */}
            <div className="p-4 md:p-6 border-b border-zinc-800 bg-zinc-900/50 shrink-0">
                <div className="flex justify-between items-center mb-4 md:mb-6">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold mb-1">LiveQ <span className="text-blue-500 text-base md:text-lg">/ Admin</span></h1>
                        <p className="text-zinc-500 text-xs">Demo Event 2025</p>
                    </div>
                    <div className="flex gap-2">
                        <button className="bg-zinc-800 px-3 py-1 rounded text-xs text-zinc-400">ログアウト</button>
                    </div>
                </div>
                {/* Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                     {[{id: 'polls', label: '📊 投票'}, {id: 'chat', label: '💬 チャット'}, {id: 'qs', label: '❓ 質問'}, {id: 'mod', label: '🚨 違反'}, {id: 'banned', label: '🚫 BAN'}].map(t => (
                        <button key={t.id} onClick={()=>setTab(t.id)} className={`px-3 md:px-4 py-2 rounded-lg font-bold text-xs md:text-sm whitespace-nowrap transition-colors ${tab===t.id?'bg-blue-600 text-white':'bg-black text-zinc-400 border border-zinc-800'}`}>
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content - NO SCROLL */}
            <div className="flex-1 p-4 md:p-6 bg-black overflow-hidden relative">
                {tab === 'polls' && <DummyPollManager />}
                {tab === 'chat' && <DummyChatManager />}
                {tab === 'qs' && <DummyQuestionManager />}
                {tab === 'mod' && <DummyModerationPanel />}
                {tab === 'banned' && <DummyBannedList />}
            </div>
        </div>
    )
}

// ==========================================
// 4. MAIN PAGE CONTROLLER
// ==========================================

export default function DemoPage() {
    
    // Smooth Scroll Function
    const scrollToSection = (id) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-indigo-500 selection:text-white pb-32">
            
            {/* --- NAVIGATION HEADER --- */}
            <div className="fixed top-0 left-0 right-0 bg-black/80 backdrop-blur-md border-b border-white/10 z-[100] h-16 flex items-center justify-center overflow-x-auto">
                <div className="flex gap-2 md:gap-4 px-4 min-w-max">
                    <button onClick={() => scrollToSection('audience')} className="px-4 md:px-6 py-2 rounded-full text-xs md:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-900/50 active:scale-95">
                        📱 参加者
                    </button>
                    <button onClick={() => scrollToSection('moderator')} className="px-4 md:px-6 py-2 rounded-full text-xs md:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-900/50 active:scale-95">
                        💻 主催者
                    </button>
                </div>
            </div>

            <div className="max-w-6xl mx-auto pt-24 md:pt-32 px-4 md:px-6">
                
                {/* 1. AUDIENCE SECTION */}
                <div id="audience" className="min-h-[90vh] flex flex-col items-center justify-center mb-32">
                    <div className="text-center mb-8 md:mb-12">
                        <span className="text-indigo-400 font-bold tracking-widest text-xs uppercase mb-2 block">Step 1</span>
                        <h2 className="text-3xl md:text-5xl font-black mb-4">参加者ビュー</h2>
                        <p className="text-zinc-500 text-sm md:text-base">スマホでQRコードを読み込むと、<br/>登録なしでこの画面が開きます。</p>
                    </div>
                    <PhoneView />
                </div>

                {/* 2. MODERATOR SECTION */}
                <div id="moderator" className="min-h-[90vh] flex flex-col justify-center mb-32 pt-20 border-t border-zinc-900">
                    <div className="text-center mb-8 md:mb-12">
                        <span className="text-blue-400 font-bold tracking-widest text-xs uppercase mb-2 block">Step 2</span>
                        <h2 className="text-3xl md:text-5xl font-black mb-4">主催者管理画面</h2>
                        <p className="text-zinc-500 text-sm md:text-base">PCやタブレットから、<br/>イベントの進行をコントロールします。</p>
                    </div>
                    <AdminView />
                </div>

            </div>
        </div>
    )
}