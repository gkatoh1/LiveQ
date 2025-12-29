import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { downloadStyledQr } from './utils/qrGenerator'

// --- SHARED LOADER COMPONENT ---
function ModernLoader() {
  return (
    <div className="bg-black h-[100dvh] w-full flex flex-col items-center justify-center relative overflow-hidden text-white">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-900/40 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="relative z-10 flex flex-col items-center space-y-6">
        <div className="relative"><span className="block w-12 h-12 border-4 border-zinc-800 border-t-indigo-500 rounded-full animate-spin"></span></div>
        <div className="flex flex-col items-center">
            <img src="/logo.png" alt="LiveQ" className="h-12 w-auto object-contain mb-2" />
            <p className="text-zinc-500 text-[10px] font-mono animate-pulse tracking-widest">読み込み中...</p>
        </div>
      </div>
    </div>
  )
}

export default function OrganizerDashboard() {
  const navigate = useNavigate()
  const location = useLocation()
  
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [myEvent, setMyEvent] = useState(null)
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(() => {
    const params = new URLSearchParams(location.search)
    return params.get('mode') === 'signup'
  })
  const [authMsg, setAuthMsg] = useState('')

  const [newName, setNewName] = useState('')
  const [newSlug, setNewSlug] = useState('')
  const [newPass, setNewPass] = useState('')
  const [newDate, setNewDate] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchMyEvent(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) fetchMyEvent(session.user.id)
      else { setMyEvent(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('mode') === 'signup') setIsSignUp(true)
    if (params.get('mode') === 'login') setIsSignUp(false)
  }, [location.search])

  const fetchMyEvent = async (userId) => {
    setLoading(true)
    const { data } = await supabase.from('events').select('*').eq('owner_id', userId).maybeSingle()
    setMyEvent(data)
    setLoading(false)
  }

  const translateError = (msg) => {
    if (msg.includes("Invalid login credentials")) return "メールアドレスまたはパスワードが間違っています。"
    if (msg.includes("User already registered")) return "このメールアドレスは既に登録されています。"
    if (msg.includes("Password should be at least")) return "パスワードは6文字以上にしてください。"
    return "エラーが発生しました: " + msg
  }

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    setAuthMsg('')
    
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: { emailRedirectTo: `${window.location.origin}/admin` }
      })
      if (error) setAuthMsg(translateError(error.message))
      else setAuthMsg("確認メールを送信しました！メール内のリンクをクリックしてください。")
      setLoading(false)
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
          setAuthMsg(translateError(error.message))
          setLoading(false)
      }
    }
  }

  const createEvent = async (e) => {
    e.preventDefault()
    if (!newName || !newSlug || !newPass || !newDate) return alert("全ての項目を入力してください")
    if (!/^[a-zA-Z0-9-_]+$/.test(newSlug)) return alert("URLスラッグは英数字とハイフンのみ使用できます")

    const { error } = await supabase.from('events').insert({
      owner_id: session.user.id,
      name: newName,
      slug: newSlug,
      password: newPass,
      event_date: newDate,
      enable_chat: true,
      enable_questions: true,
      enable_welcome: true,
      question_limit: 9999,
      welcome_message: `Welcome to ${newName}!`
    })

    if (error) {
      alert("作成エラー: " + translateError(error.message))
    } else {
      fetchMyEvent(session.user.id)
    }
  }

  const deleteEvent = async () => {
    if (!confirm("イベントを削除しますか？\n関連データは全て消去されます。")) return
    const { error } = await supabase.from('events').delete().eq('id', myEvent.id)
    if (error) alert(error.message)
    else setMyEvent(null)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/admin')
  }

  const customStyles = `
    input:-webkit-autofill,
    input:-webkit-autofill:hover, 
    input:-webkit-autofill:focus, 
    input:-webkit-autofill:active {
        -webkit-box-shadow: 0 0 0 30px black inset !important;
        -webkit-text-fill-color: white !important;
        transition: background-color 5000s ease-in-out 0s;
    }
    input[type="date"]::-webkit-datetime-edit-month-field:focus,
    input[type="date"]::-webkit-datetime-edit-day-field:focus,
    input[type="date"]::-webkit-datetime-edit-year-field:focus {
        background: transparent !important;
        color: white !important;
        outline: none !important;
    }
    input[type="date"]:focus {
        outline: none !important; 
        border-color: #6366f1 !important;
    }
    /* Placeholder trick for date inputs */
    input[type="date"]:invalid::-webkit-datetime-edit {
        color: #71717a; /* zinc-500 */
    }
  `

  if (loading) {
      return <ModernLoader />
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-[#0A051E] flex flex-col items-center justify-center p-6 text-white font-sans">
        <style>{customStyles}</style>

        <div className="w-full max-w-sm bg-zinc-900/80 p-8 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-xl">
          
          <div className="flex justify-center mb-8">
             <img src="/logo.png" alt="LiveQ" className="h-12 w-auto object-contain" />
          </div>

          <div className="flex bg-black p-1 rounded-xl mb-8 border border-zinc-700">
             <button 
                onClick={() => {setIsSignUp(true); setAuthMsg('')}}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${isSignUp ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
             >
                新規登録
             </button>
             <button 
                onClick={() => {setIsSignUp(false); setAuthMsg('')}}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${!isSignUp ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
             >
                ログイン
             </button>
          </div>
          
          <form onSubmit={handleAuth} className="space-y-4">
            <input 
              type="email" required value={email} onChange={e=>setEmail(e.target.value)} 
              placeholder="メールアドレス" 
              className="w-full bg-black/50 border border-zinc-700 p-4 rounded-xl text-white outline-none focus:border-indigo-500 transition-colors placeholder-zinc-600"
            />
            <input 
              type="password" required value={password} onChange={e=>setPassword(e.target.value)} 
              placeholder="パスワード" 
              className="w-full bg-black/50 border border-zinc-700 p-4 rounded-xl text-white outline-none focus:border-indigo-500 transition-colors placeholder-zinc-600"
            />
            <button disabled={loading} className="w-full bg-indigo-600 py-4 rounded-xl font-bold hover:bg-indigo-500 transition-all active:scale-95 shadow-lg shadow-indigo-500/20">
              {loading ? '処理中...' : (isSignUp ? 'アカウント作成' : 'ログインする')}
            </button>
          </form>
          
          {authMsg && <p className="text-center text-sm text-yellow-400 mt-6 bg-yellow-900/20 p-3 rounded-lg border border-yellow-500/20">{authMsg}</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <style>{customStyles}</style>

        <div className="flex justify-between items-center mb-12 border-b border-zinc-800 pb-6">
          <div className="flex items-center gap-4">
             <img src="/logo.png" alt="LiveQ" className="h-8 w-auto opacity-80" />
             <h1 className="text-2xl font-bold hidden md:block">Organizer Dashboard</h1>
          </div>
          <button onClick={handleLogout} className="text-zinc-500 hover:text-white text-sm bg-zinc-900 px-4 py-2 rounded-lg border border-zinc-800">ログアウト</button>
        </div>

        {myEvent && (
          <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 p-8 rounded-3xl relative overflow-hidden group animate-in zoom-in-95 duration-300">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                <img src="/logo.png" className="h-32 w-auto" />
             </div>
             
             <div className="relative z-10">
                <span className="inline-block bg-green-500/20 text-green-400 text-xs font-bold px-3 py-1 rounded-full mb-4 border border-green-500/30">Active Event</span>
                <h2 className="text-4xl font-black mb-2">{myEvent.name}</h2>
                <p className="text-zinc-500 font-mono mb-8 text-lg">liveq.netlify.app/{myEvent.slug}</p>

                <div className="flex flex-wrap gap-4">
                   <Link to={`/admin/${myEvent.slug}`} className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-indigo-900/20 transition-all text-lg active:scale-95">
                      管理画面を開く
                   </Link>
                   
                   <Link to={`/${myEvent.slug}`} target="_blank" className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-4 rounded-xl font-bold border border-zinc-700 transition-all text-lg active:scale-95">
                      📱 参加者ビュー
                   </Link>
                   
                   <Link to={`/projector/${myEvent.slug}`} target="_blank" className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-4 rounded-xl font-bold border border-zinc-700 transition-all text-lg active:scale-95">
                      📽️ プロジェクター
                   </Link>
                   
                   <button 
                      onClick={() => downloadStyledQr(myEvent.slug, myEvent.name)} 
                      className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-4 rounded-xl font-bold border border-zinc-700 transition-all text-lg active:scale-95 flex items-center justify-center"
                   >
                      ⬇️ QR保存
                   </button>
                </div>

                <div className="mt-12 pt-8 border-t border-zinc-800 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                   <div className="text-zinc-600 text-xs">
                      開催日: {myEvent.event_date}<br/>
                      ※ データ整理のため、開催日の3日後に自動削除されます
                   </div>
                   <button onClick={deleteEvent} className="text-red-500 hover:text-red-400 text-sm font-bold underline bg-red-900/10 px-4 py-2 rounded hover:bg-red-900/20 transition-colors">
                      イベントを削除して新しく作成
                   </button>
                </div>
             </div>
          </div>
        )}

        {!myEvent && (
          <div className="max-w-xl mx-auto bg-zinc-900/50 p-8 rounded-3xl border border-zinc-800 animate-in slide-in-from-bottom-4">
             <h2 className="text-2xl font-bold mb-6 text-center">新規イベント作成</h2>
             <form onSubmit={createEvent} className="space-y-6">
                <div>
                   <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase">イベント名</label>
                   <input value={newName} onChange={e=>setNewName(e.target.value)} className="w-full bg-black p-4 rounded-xl border border-zinc-700 focus:border-indigo-500 outline-none transition-colors" placeholder="例: 定例ミーティング" />
                </div>
                <div>
                   <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase">URLスラッグ (英数字)</label>
                   <div className="flex items-center bg-black rounded-xl border border-zinc-700 overflow-hidden focus-within:border-indigo-500 transition-colors">
                      <span className="pl-4 text-zinc-500 text-sm">liveq.netlify.app/</span>
                      <input value={newSlug} onChange={e=>setNewSlug(e.target.value)} className="flex-1 bg-transparent p-4 outline-none" placeholder="meeting-01" />
                   </div>
                </div>
                {/* CHANGED: grid-cols-1 for mobile, md:grid-cols-2 for desktop */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                      <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase">開催日</label>
                      <input 
                        type="date" 
                        required // Required for pseudo-class styling
                        value={newDate} 
                        onChange={e=>setNewDate(e.target.value)}
                        onClick={(e) => e.target.showPicker && e.target.showPicker()}
                        onKeyDown={(e) => e.preventDefault()}
                        className="w-full bg-black p-4 rounded-xl border border-zinc-700 focus:border-indigo-500 outline-none text-white [color-scheme:dark] transition-colors cursor-pointer caret-transparent" 
                      />
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase">管理者パスワード</label>
                      <input value={newPass} onChange={e=>setNewPass(e.target.value)} className="w-full bg-black p-4 rounded-xl border border-zinc-700 focus:border-indigo-500 outline-none transition-colors" placeholder="password" />
                   </div>
                </div>
                <button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 py-4 rounded-xl font-bold text-lg hover:scale-[1.02] transition-transform shadow-xl shadow-indigo-900/30 text-white active:scale-95">
                   イベントを作成
                </button>
                <p className="text-center text-xs text-zinc-600">※ フリープランは1人1イベントまで作成可能です。</p>
             </form>
          </div>
        )}

      </div>
    </div>
  )
}