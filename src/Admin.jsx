import { useState } from 'react'
import { supabase } from './supabaseClient'
import { Link } from 'react-router-dom'

// --- SHARED LOADER (Adapted for Dashboard) ---
function ModernLoader() {
  return (
    <div className="w-full h-96 flex flex-col items-center justify-center relative overflow-hidden text-white bg-zinc-900/30 rounded-3xl border border-zinc-800/50">
      {/* Gradient Blob */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-indigo-900/20 blur-[100px] rounded-full pointer-events-none"></div>
      
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center space-y-6">
        <div className="relative"><span className="block w-12 h-12 border-4 border-zinc-800 border-t-indigo-500 rounded-full animate-spin"></span></div>
        <div className="flex flex-col items-center">
            <img src="/logo.png" alt="LiveQ" className="h-10 w-auto object-contain mb-2" />
            <p className="text-zinc-500 text-[10px] font-mono animate-pulse tracking-widest">イベント情報を取得中...</p>
        </div>
      </div>
    </div>
  )
}

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)

  // --- NEW EVENT FORM STATE (For You) ---
  const [newSlug, setNewSlug] = useState('')
  const [newName, setNewName] = useState('')
  const [newPass, setNewPass] = useState('')

  // 1. LOGIN CHECK (Hardcoded for you)
  const handleLogin = (e) => {
    e.preventDefault()
    // CHANGE THIS TO YOUR SECRET PASSWORD
    if (password === 'hirochan63') { 
      setIsAuthenticated(true)
      fetchEvents()
    } else {
      alert('パスワードが違います')
    }
  }

  // 2. FETCH ALL EVENTS
  const fetchEvents = async () => {
    setLoading(true)
    // We select ALL events. 
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) console.error(error)
    else setEvents(data || [])
    setLoading(false)
  }

  // 3. CREATE EVENT (Master Override)
  const createEvent = async (e) => {
    e.preventDefault()
    if (!newSlug || !newName || !newPass) return alert('全ての項目を入力してください')

    // --- PROTECT RESERVED ROUTES ---
    // If someone names an event "master", it breaks the routing. Block it here.
    const reservedSlugs = ['master', 'admin', 'dashboard', 'demopage', 'login', 'signup', 'assets']
    if (reservedSlugs.includes(newSlug.toLowerCase())) {
        return alert(`スラッグ "${newSlug}" はシステム予約語のため使用できません。別の名前を使ってください。`)
    }

    // Get your own user ID to attach to the event (optional)
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase.from('events').insert({
      owner_id: user?.id, 
      slug: newSlug,
      name: newName,
      password: newPass,
      enable_chat: true,
      enable_questions: true,
      enable_welcome: true,
      welcome_message: "Welcome!"
    })

    if (error) {
      alert('エラー: ' + error.message)
    } else {
      alert('イベントを作成しました！')
      setNewSlug(''); setNewName(''); setNewPass('')
      fetchEvents()
    }
  }

  // 4. DELETE EVENT (Simple Confirmation)
  const deleteEvent = async (id, name) => {
      // CHANGED: Just a simple Yes/No confirm now
      if (!confirm(`【警告】イベント「${name}」を削除しますか？\n関連データは全て消去されます。`)) return
      
      const { error } = await supabase.from('events').delete().eq('id', id);
      
      if (error) alert("削除失敗: " + error.message)
      else {
          alert("削除しました");
          fetchEvents();
      }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0A051E] flex flex-col items-center justify-center p-6 text-white font-sans">
        <div className="w-full max-w-sm bg-zinc-900/80 p-8 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-xl">
          <div className="flex justify-center mb-6">
             <img src="/logo.png" alt="LiveQ" className="h-12 w-auto object-contain" />
          </div>
          <h2 className="text-xl font-bold text-center mb-1">Master Admin</h2>
          <p className="text-zinc-500 text-xs text-center mb-8">全イベント管理ダッシュボード</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="パスワード" 
              className="w-full bg-black/50 border border-zinc-700 p-4 rounded-xl text-white focus:border-indigo-500 outline-none transition-colors"
            />
            <button className="w-full bg-indigo-600 py-4 rounded-xl font-bold hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20">
              ログイン
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-end mb-12 border-b border-zinc-800 pb-6">
          <div className="flex items-center gap-4">
             <img src="/logo.png" alt="LiveQ" className="h-8 w-auto opacity-80" />
             <h1 className="text-3xl font-bold">Master Dashboard</h1>
          </div>
          <button onClick={() => setIsAuthenticated(false)} className="text-zinc-500 hover:text-white text-sm">ログアウト</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* LEFT: CREATE FORM */}
          <div className="lg:col-span-1">
            <div className="bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800 sticky top-6">
              <h2 className="text-xl font-bold mb-6 text-indigo-400">🔥 新規イベント作成</h2>
              <form onSubmit={createEvent} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-zinc-500 ml-1 block mb-1">イベント名</label>
                  <input value={newName} onChange={e=>setNewName(e.target.value)} className="w-full bg-black p-3 rounded-xl border border-zinc-700 focus:border-indigo-500 outline-none" placeholder="例: 定例ミーティング" />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-500 ml-1 block mb-1">URLスラッグ (英数字)</label>
                  <div className="flex items-center bg-black rounded-xl border border-zinc-700 overflow-hidden focus-within:border-indigo-500">
                    <span className="pl-3 text-zinc-500 text-sm">liveq.netlify.app/</span>
                    <input value={newSlug} onChange={e=>setNewSlug(e.target.value)} className="flex-1 bg-transparent p-3 outline-none" placeholder="meeting-01" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-500 ml-1 block mb-1">管理者パスワード</label>
                  <input value={newPass} onChange={e=>setNewPass(e.target.value)} className="w-full bg-black p-3 rounded-xl border border-zinc-700 focus:border-indigo-500 outline-none" placeholder="安全なパスワード" />
                </div>
                <button className="w-full bg-indigo-600 py-3 rounded-xl font-bold mt-2 hover:bg-indigo-500 active:scale-95 transition-all">作成する</button>
              </form>
            </div>
          </div>

          {/* RIGHT: EVENT LIST */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold mb-6 text-zinc-400">開催中のイベント ({events.length})</h2>
            
            {loading ? <ModernLoader /> : (
              <div className="space-y-4">
                {events.map(ev => (
                  <div key={ev.id} className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-zinc-700 transition-colors group">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">{ev.name}</h3>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs font-mono text-zinc-500">
                        <span>SLUG: /{ev.slug}</span>
                        <span>PASS: {ev.password}</span>
                        <span className="text-zinc-300">開催日: {ev.event_date || '未設定'}</span>
                        <span>作成: {new Date(ev.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto mt-4 md:mt-0">
                      <Link to={`/admin/${ev.slug}`} target="_blank" className="flex-1 md:flex-none px-5 py-2 bg-zinc-800 hover:bg-white hover:text-black rounded-lg text-sm font-bold transition-all text-center">
                        管理
                      </Link>
                      <button onClick={() => deleteEvent(ev.id, ev.name)} className="px-3 py-2 text-zinc-600 hover:text-red-500 hover:bg-red-900/20 rounded-lg transition-colors border border-zinc-800 hover:border-red-500/30" title="削除">
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
                {events.length === 0 && <p className="text-zinc-600 text-center py-10">イベントがまだありません</p>}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}