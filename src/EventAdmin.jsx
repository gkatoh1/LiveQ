import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from './supabaseClient'
import { downloadStyledQr } from './utils/qrGenerator'

// --- 0. SHARED LOADER COMPONENT ---
function ModernLoader() {
  return (
    <div className="bg-black h-[100dvh] w-full flex flex-col items-center justify-center relative overflow-hidden text-white">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-900/40 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="relative z-10 flex flex-col items-center space-y-6">
        <div className="relative"><span className="block w-12 h-12 border-4 border-zinc-800 border-t-indigo-500 rounded-full animate-spin"></span></div>
        <div className="flex flex-col items-center">
            <img src="/logo.png" alt="LiveQ" className="h-12 w-auto object-contain mb-2" />
            <p className="text-zinc-500 text-[10px] font-mono animate-pulse tracking-widest">管理画面を読み込み中...</p>
        </div>
      </div>
    </div>
  )
}

// --- 1. SUB COMPONENTS ---

function ModerationPanel({ eventId }) {
  const [alerts, setAlerts] = useState([])
  useEffect(() => {
    const fetchAlerts = async () => {
      const { data } = await supabase.from('admin_notifications').select('*').eq('event_id', eventId).order('created_at', { ascending: false })
      if (data) setAlerts(data)
    }
    fetchAlerts()
    const ch = supabase.channel('admin_mod_panel').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'admin_notifications', filter: `event_id=eq.${eventId}` }, (payload) => setAlerts(prev => [payload.new, ...prev])).subscribe()
    return () => supabase.removeChannel(ch)
  }, [eventId])
  const handleBan = async (userId, notificationId) => {
    if (!confirm("本当にこのユーザーをBANしますか？")) return
    await supabase.from('profiles').update({ is_banned: true }).eq('id', userId)
    await supabase.from('admin_notifications').delete().eq('id', notificationId)
    setAlerts(prev => prev.filter(a => a.id !== notificationId))
    alert("ユーザーをBANしました")
  }
  const handleDismiss = async (id) => { await supabase.from('admin_notifications').delete().eq('id', id); setAlerts(prev => prev.filter(a => a.id !== id)) }
  return (
    <div className="space-y-4 pb-20">
      <h2 className="text-xl md:text-2xl font-bold mb-4 text-red-400 flex items-center gap-2">🚨 違反報告 <span className="text-sm font-normal text-zinc-500">(Realtime)</span></h2>
      {alerts.length === 0 && <p className="text-zinc-500 bg-zinc-900 p-8 rounded-xl text-center">現在、報告はありません。</p>}
      {alerts.map(alert => (
        <div key={alert.id} className="bg-red-900/20 border border-red-500/50 p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-in slide-in-from-top-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1"><span className="font-bold text-red-300 truncate">{alert.nickname}</span><span className="text-xs text-red-500/70 font-mono">ID:{alert.user_id.slice(0,4)}</span></div>
            <p className="text-white text-sm break-all">発言: <span className="bg-black/50 px-2 py-0.5 rounded text-yellow-400">{alert.content}</span></p>
            <p className="text-[10px] text-zinc-500 mt-1">{new Date(alert.created_at).toLocaleString()}</p>
          </div>
          <div className="flex gap-2 w-full md:w-auto"><button onClick={() => handleDismiss(alert.id)} className="flex-1 md:flex-none px-4 py-3 md:py-2 rounded border border-zinc-600 text-zinc-400 hover:bg-zinc-800 text-sm font-bold">無視</button><button onClick={() => handleBan(alert.user_id, alert.id)} className="flex-1 md:flex-none px-4 py-3 md:py-2 rounded bg-red-600 text-white font-bold hover:bg-red-500 shadow-lg text-sm">BAN実行</button></div>
        </div>
      ))}
    </div>
  )
}

function ChatManager({ eventId }) {
  const [msgs, setMsgs] = useState([])
  useEffect(() => { loadMsgs(); const ch = supabase.channel('admin_chat_mgr').on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `event_id=eq.${eventId}` }, loadMsgs).subscribe(); return () => supabase.removeChannel(ch) }, [eventId])
  const loadMsgs = async () => { const { data } = await supabase.from('messages').select('*').eq('event_id', eventId).order('created_at', { ascending: false }).limit(50); if(data) setMsgs(data) }
  const deleteMsg = async (id) => { if(confirm("削除しますか？")) await supabase.from('messages').delete().eq('id', id) }
  const clearAll = async () => { if(confirm("⚠️ 本当に全てのチャット履歴を削除しますか？")) await supabase.from('messages').delete().eq('event_id', eventId) }
  return (
    <div className="space-y-4 pb-20">
      <div className="flex justify-between items-center mb-2"><h2 className="text-xl md:text-2xl font-bold text-blue-400">💬 チャット管理</h2><button onClick={clearAll} className="bg-red-900/30 text-red-300 border border-red-800 px-3 py-1 rounded text-xs hover:bg-red-900">履歴全消去</button></div>
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 h-[60vh] overflow-y-auto">
        {msgs.map(m => (<div key={m.id} className="p-3 border-b border-zinc-800 flex justify-between items-start hover:bg-zinc-800/50"><div className="min-w-0 pr-2"><span className="text-xs text-zinc-500 font-bold block mb-0.5">{m.nickname}</span><span className="text-zinc-300 text-sm break-all">{m.content}</span></div><button onClick={() => deleteMsg(m.id)} className="text-zinc-500 hover:text-red-500 p-2">✕</button></div>))}
        {msgs.length === 0 && <div className="p-8 text-zinc-600 text-center">メッセージはありません</div>}
      </div>
    </div>
  )
}

function QuestionManager({ eventId }) {
  const [qs, setQs] = useState([])
  useEffect(() => { loadQs(); const ch = supabase.channel('admin_qs_mgr').on('postgres_changes', { event: '*', schema: 'public', table: 'questions', filter: `event_id=eq.${eventId}` }, loadQs).subscribe(); return () => supabase.removeChannel(ch) }, [eventId])
  const loadQs = async () => { const { data } = await supabase.from('questions').select('*').eq('event_id', eventId).order('created_at', { ascending: false }); if(data) setQs(data) }
  const deleteQ = async (id) => { if(confirm("削除しますか？")) await supabase.from('questions').delete().eq('id', id) }
  const clearAll = async () => { if(confirm("⚠️ 本当に全ての質問を削除しますか？")) await supabase.from('questions').delete().eq('event_id', eventId) }
  return (
    <div className="space-y-4 pb-20">
      <div className="flex justify-between items-center mb-2"><h2 className="text-xl md:text-2xl font-bold text-green-400">❓ 質問管理</h2><button onClick={clearAll} className="bg-red-900/30 text-red-300 border border-red-800 px-3 py-1 rounded text-xs hover:bg-red-900">全消去</button></div>
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 h-[60vh] overflow-y-auto">
        {qs.map(q => (<div key={q.id} className="p-3 border-b border-zinc-800 flex justify-between items-start hover:bg-zinc-800/50"><div className="min-w-0 pr-2"><div className="text-xs text-zinc-500 font-bold mb-1">{q.nickname} <span className="ml-2 bg-zinc-800 px-1.5 rounded">👍{q.likes}</span></div><div className="text-zinc-300 text-sm break-all">{q.content}</div></div><button onClick={() => deleteQ(q.id)} className="text-zinc-500 hover:text-red-500 p-2">✕</button></div>))}
        {qs.length === 0 && <div className="p-8 text-zinc-600 text-center">質問はありません</div>}
      </div>
    </div>
  )
}

function BannedUsersList({ eventId }) {
  const [bannedUsers, setBannedUsers] = useState([])
  const [manualName, setManualName] = useState('')
  const [status, setStatus] = useState('')
  const fetchBanned = async () => { const { data } = await supabase.from('profiles').select('*').eq('is_banned', true).eq('event_id', eventId); if (data) setBannedUsers(data) }
  useEffect(() => { fetchBanned() }, [eventId])
  const unbanUser = async (userId) => { if (!confirm("解除しますか？")) return; await supabase.from('profiles').update({ is_banned: false }).eq('id', userId); fetchBanned(); alert("解除しました") }
  const executeManualBan = async () => {
      if (!manualName.trim()) return
      setStatus('検索中...')
      const { data: targets } = await supabase.from('profiles').select('id, nickname').eq('event_id', eventId).ilike('nickname', manualName.trim())
      if (!targets || targets.length === 0) { setStatus('❌ ユーザーが見つかりません'); return }
      if (!confirm(`"${manualName}" に一致するユーザーが ${targets.length} 人見つかりました。全員BANしますか？`)) { setStatus(''); return }
      const targetIds = targets.map(u => u.id)
      await supabase.from('profiles').update({ is_banned: true }).in('id', targetIds)
      setStatus(`✅ ${targets.length} 人をBANしました`); setManualName(''); fetchBanned()
  }
  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center"><h2 className="text-xl md:text-2xl font-bold text-zinc-400">🚫 BANリスト</h2><button onClick={fetchBanned} className="text-sm text-blue-400 underline">更新</button></div>
      <div className="bg-red-900/10 border border-red-900/50 p-4 rounded-xl"><label className="text-xs font-bold text-red-400 uppercase tracking-widest mb-2 block">手動BAN (Manual Ban)</label><div className="flex gap-2"><input value={manualName} onChange={e => setManualName(e.target.value)} className="flex-1 bg-black border border-red-900/30 rounded-lg px-4 py-2 text-white placeholder-red-900/30 focus:outline-none focus:border-red-500" placeholder="ニックネームを入力..." /><button onClick={executeManualBan} className="bg-red-600 hover:bg-red-500 text-white font-bold px-4 py-2 rounded-lg transition-colors">BAN実行</button></div>{status && <p className="text-sm font-bold mt-2 text-red-300 animate-pulse">{status}</p>}</div>
      <div className="space-y-2">
          {bannedUsers.length === 0 && <p className="bg-zinc-900 p-8 rounded-xl text-center text-zinc-600">BAN中のユーザーはいません</p>}
          {bannedUsers.map(user => (<div key={user.id} className="bg-zinc-900 p-4 rounded-xl border border-zinc-700 flex justify-between items-center"><div><p className="font-bold text-white">{user.nickname || '名無し'}</p><p className="text-[10px] text-zinc-500 font-mono">ID: {user.id}</p></div><button onClick={() => unbanUser(user.id)} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-sm font-bold">解除</button></div>))}
      </div>
    </div>
  )
}

function PollManager({ eventId, event, refreshEvent }) {
  const [polls, setPolls] = useState([]); 
  const [q, setQ] = useState(''); 
  const [opts, setOpts] = useState(['','']);
  
  // Local state for instant UI updates (prevents lag)
  const [activePollId, setActivePollId] = useState(event.active_poll_id);
  const [entryPollId, setEntryPollId] = useState(event.entry_poll_id);

  // Sync local state when parent event updates (e.g. initial load)
  useEffect(() => {
    setActivePollId(event.active_poll_id);
    setEntryPollId(event.entry_poll_id);
  }, [event]);

  useEffect(() => { loadPolls() }, []);
  
  const loadPolls = () => { supabase.from('polls').select('*').eq('event_id', eventId).order('created_at', {ascending: false}).then(({data}) => setPolls(data||[])); }
  
  const createPoll = async () => { 
      if(!q || opts.some(o=>!o)) return; 
      await supabase.from('polls').insert({ event_id: eventId, question: q, options: opts.map(l=>({label:l,count:0})) }); 
      setQ(''); setOpts(['','']); loadPolls(); 
  }

  const deletePoll = async (pid) => { 
      if(!confirm("削除しますか？")) return; 
      
      // Safety: If deleting the active poll, unset it first
      if (activePollId === pid) {
          await supabase.from('events').update({ active_poll_id: null }).eq('id', eventId);
          setActivePollId(null);
      }
      if (entryPollId === pid) {
          await supabase.from('events').update({ entry_poll_id: null }).eq('id', eventId);
          setEntryPollId(null);
      }

      await supabase.from('polls').delete().eq('id', pid); 
      refreshEvent(); // Sync parent
      loadPolls(); 
  }

  const toggleEntry = async (pid) => { 
      const newValue = entryPollId === pid ? null : pid;
      setEntryPollId(newValue); // Instant UI update
      await supabase.from('events').update({ entry_poll_id: newValue }).eq('id', eventId); 
      refreshEvent(); 
  }

  const toggleLive = async (pid) => { 
      const newValue = activePollId === pid ? null : pid;
      setActivePollId(newValue); // Instant UI update
      await supabase.from('events').update({ active_poll_id: newValue }).eq('id', eventId); 
      refreshEvent(); 
  }

  const handleOpt = (i, v) => { const n=[...opts]; n[i]=v; setOpts(n) }

  return (
    <div className="pb-20">
      <h2 className="text-xl md:text-2xl font-bold mb-4">📊 投票管理</h2>
      <div className="bg-zinc-900 p-4 rounded-xl mb-6 border border-zinc-800 shadow-md">
        <h3 className="font-bold mb-3 text-sm text-zinc-400">新規作成</h3>
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="質問文を入力" className="w-full bg-black p-3 rounded-lg mb-3 border border-zinc-700 text-white"/>
        {opts.map((o,i)=>(<div key={i} className="flex gap-2 mb-2"><input value={o} onChange={e=>handleOpt(i,e.target.value)} placeholder={`選択肢 ${i+1}`} className="flex-1 bg-black p-3 rounded-lg border border-zinc-700 text-white"/>{opts.length>2 && <button onClick={()=>setOpts(opts.filter((_,x)=>x!==i))} className="text-zinc-500 px-3 text-xl">×</button>}</div>))}
        <div className="flex gap-3 mt-4"><button onClick={()=>setOpts([...opts,''])} className="flex-1 bg-zinc-800 text-zinc-300 font-bold py-3 rounded-lg border border-zinc-700">+ 選択肢</button><button onClick={createPoll} className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-lg shadow-lg active:scale-95 transition-transform">作成する</button></div>
      </div>
      <div className="space-y-4">
        {polls.map(p => (
            <div key={p.id} className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 flex flex-col gap-4">
                <div>
                    <p className="font-bold text-lg">{p.question}</p>
                    <p className="text-xs text-zinc-500 mt-1">{p.options && p.options.map(o => o.label).join(' / ')}</p>
                </div>
                <div className="flex gap-2 w-full">
                    <button 
                        onClick={()=>toggleEntry(p.id)} 
                        className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-colors ${entryPollId === p.id ? 'bg-yellow-500 border-yellow-500 text-black shadow-[0_0_10px_rgba(234,179,8,0.4)]' : 'bg-black border-zinc-700 text-zinc-400'}`}
                    >
                        {entryPollId === p.id ? '★ 参加時ON' : '参加時'}
                    </button>
                    <button 
                        onClick={()=>toggleLive(p.id)} 
                        className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-colors ${activePollId === p.id ? 'bg-red-600 border-red-600 text-white shadow-[0_0_10px_rgba(220,38,38,0.6)] animate-pulse' : 'bg-black border-zinc-700 text-zinc-400'}`}
                    >
                        {activePollId === p.id ? '● LIVE中' : 'LIVE'}
                    </button>
                    <button onClick={()=>deletePoll(p.id)} className="w-10 flex items-center justify-center rounded-lg bg-zinc-800 text-red-500 border border-zinc-700 hover:bg-zinc-700">🗑️</button>
                </div>
            </div>
        ))}
      </div>
    </div>
  )
}

// --- 2. MAIN ADMIN COMPONENT ---
export default function EventAdmin() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [event, setEvent] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [tab, setTab] = useState('polls')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true;

    const init = async () => {
        try {
            // 1. Wait for session check first
            const { data: { session } } = await supabase.auth.getSession();
            
            // 2. Fetch the event
            const { data, error } = await supabase.from('events').select('*').eq('slug', slug).maybeSingle()
            
            if (!mounted) return;

            if (error || !data) {
                setNotFound(true);
                setLoading(false);
                return;
            }

            setEvent(data);

            // 3. Auto-login if password matches in storage
            const savedPass = sessionStorage.getItem(`admin_pass_${slug}`);
            if (savedPass && savedPass === data.password) {
                setIsAuthenticated(true);
            }
            
            setLoading(false);

        } catch (e) {
            console.error(e);
            if(mounted) {
                setNotFound(true);
                setLoading(false);
            }
        }
    }

    init();
    return () => { mounted = false; }
  }, [slug])

  const handleLogin = (e) => { e.preventDefault(); if (event && passwordInput === event.password) { setIsAuthenticated(true); sessionStorage.setItem(`admin_pass_${slug}`, passwordInput) } else { alert("パスワードが違います") } }
  const handleLogout = () => { setIsAuthenticated(false); sessionStorage.removeItem(`admin_pass_${slug}`) }

  const toggleFeature = async (key) => {
    await supabase.from('events').update({ [key]: !event[key] }).eq('id', event.id)
    setEvent({...event, [key]: !event[key]})
  }

  const updateSettings = async (e) => {
    e.preventDefault()
    const password = e.target.password.value
    const limit = parseInt(e.target.limit.value)
    const welcome = e.target.welcome_message.value

    if (isNaN(limit)) return alert("数字を入力してください")
    
    const { error } = await supabase.from('events').update({ password, question_limit: limit, welcome_message: welcome }).eq('id', event.id)
    
    if (error) alert("エラー: " + error.message)
    else { 
        alert("設定を保存しました")
        sessionStorage.setItem(`admin_pass_${slug}`, password)
        setEvent({...event, password, question_limit: limit, welcome_message: welcome})
    }
  }

  const fullReset = async () => {
      if(!confirm("【危険】本当に全てのデータを削除しますか？\n(チャット、質問、投票設定などが消えます)")) return;
      const newCount = event.reset_count + 1
      await supabase.from('events').update({ reset_count: newCount, active_poll_id: null }).eq('id', event.id);
      await supabase.from('messages').delete().eq('event_id', event.id);
      await supabase.from('questions').delete().eq('event_id', event.id);
      await supabase.from('admin_notifications').delete().eq('event_id', event.id);
      await supabase.from('profiles').delete().eq('event_id', event.id);
      setEvent({ ...event, reset_count: newCount, active_poll_id: null })
      alert("リセット完了");
  }

  if (notFound) {
      return (
          <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
              <div className="text-center space-y-6 animate-in zoom-in-95 duration-500">
                  <div className="text-6xl animate-bounce">😢</div>
                  <h1 className="text-3xl font-bold">Event Not Found</h1>
                  <p className="text-zinc-500">このイベントは存在しないか、削除されました。</p>
                  <Link to="/admin" className="inline-block bg-zinc-800 px-8 py-4 rounded-xl font-bold hover:bg-zinc-700 transition-colors">
                      ダッシュボードに戻る
                  </Link>
              </div>
          </div>
      )
  }

  if (loading || !event) return <ModernLoader />

  if (!isAuthenticated) {
      return (
          <div className="h-[100dvh] bg-black text-white flex flex-col items-center justify-center p-6">
              <div className="w-full max-w-sm bg-zinc-900 p-8 rounded-2xl border border-zinc-800 shadow-2xl">
                  <img src="/logo.png" alt="LiveQ" className="h-12 w-auto object-contain mx-auto mb-4" />
                  <h1 className="text-2xl font-bold mb-2 text-center text-zinc-100">{event.name}</h1>
                  <p className="text-zinc-500 text-center mb-8 text-sm">管理者ログイン</p>
                  <form onSubmit={handleLogin} className="space-y-4">
                      <input type="password" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} placeholder="パスワード" className="w-full bg-black border border-zinc-700 p-4 rounded-xl text-white outline-none focus:border-blue-500 transition-colors" />
                      <button className="w-full bg-blue-600 py-4 rounded-xl font-bold text-lg hover:bg-blue-500 active:scale-95 transition-all">ログイン</button>
                  </form>
              </div>
          </div>
      )
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-zinc-800 pb-6">
            <div className="w-full md:w-auto">
                <div className="flex items-center gap-2 mb-1">
                    <Link to="/admin">
                        <img src="/logo.png" alt="LiveQ" className="h-6 w-auto object-contain" />
                    </Link>
                    <span className="text-blue-500 text-base md:text-lg font-bold">/ Admin</span>
                </div>
                <p className="text-zinc-500 text-xs">{event.name}</p>
                <div className="flex flex-wrap gap-4 text-sm mt-2">
                    <Link to={`/projector/${event.slug}`} target="_blank" className="text-blue-400 hover:text-blue-300">📽️ プロジェクター</Link>
                    <Link to={`/${event.slug}`} target="_blank" className="text-blue-400 hover:text-blue-300">📱 参加者ビュー</Link>
                    <button onClick={() => downloadStyledQr(event.slug, event.name)} className="text-green-400 hover:text-green-300 flex items-center gap-1">⬇️ QR保存</button>
                    <button onClick={handleLogout} className="text-zinc-500 hover:text-white">ログアウト</button>
                </div>
            </div>
            <div className="w-full md:w-auto">
                <button onClick={fullReset} className="w-full md:w-auto bg-red-900/40 text-red-400 border border-red-800 px-4 py-3 md:py-2 rounded-lg text-xs md:text-sm font-bold whitespace-nowrap hover:bg-red-900/60 transition-colors">
                    ⚠ 完全リセット
                </button>
            </div>
        </div>

        {/* --- GRID LAYOUT FOR TABS --- */}
        <div className="grid grid-cols-3 md:flex gap-2 mb-6 -mx-2 px-2 md:mx-0 md:px-0">
            {[{id: 'polls', label: '📊 投票'}, {id: 'chat', label: '💬 チャット'}, {id: 'qs', label: '❓ 質問'}, {id: 'mod', label: '🚨 違反'}, {id: 'banned', label: '🚫 BAN'}, {id: 'settings', label: '⚙️ 設定'}].map(t => (
                <button 
                    key={t.id} 
                    onClick={()=>setTab(t.id)} 
                    className={`
                        px-2 py-3 md:px-4 md:py-2.5 rounded-lg font-bold text-xs md:text-sm transition-colors flex items-center justify-center whitespace-nowrap
                        ${tab===t.id ? 'bg-blue-600 text-white' : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'}
                    `}
                >
                    {t.label}
                </button>
            ))}
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {tab === 'polls' && <PollManager eventId={event.id} event={event} refreshEvent={() => fetchEvent(false)} />}
            {tab === 'chat' && <ChatManager eventId={event.id} />}
            {tab === 'qs' && <QuestionManager eventId={event.id} />}
            {tab === 'mod' && <ModerationPanel eventId={event.id} />}
            {tab === 'banned' && <BannedUsersList eventId={event.id} />}

            {tab === 'settings' && (
                <div className="space-y-6 pb-20">
                    <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 shadow-lg">
                        <h3 className="font-bold mb-4 text-zinc-300">機能のON/OFF</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button onClick={()=>toggleFeature('enable_chat')} className={`p-4 rounded-xl border font-bold flex justify-between items-center transition-all ${event.enable_chat?'bg-green-900/20 border-green-500/50 text-green-400':'bg-black border-zinc-700 text-zinc-500'}`}>
                                <span>💬 チャット機能</span><span className={`text-xs px-2 py-1 rounded ${event.enable_chat?'bg-green-500 text-black':'bg-zinc-800 text-zinc-500'}`}>{event.enable_chat?'ON':'OFF'}</span>
                            </button>
                            <button onClick={()=>toggleFeature('enable_questions')} className={`p-4 rounded-xl border font-bold flex justify-between items-center transition-all ${event.enable_questions?'bg-green-900/20 border-green-500/50 text-green-400':'bg-black border-zinc-700 text-zinc-500'}`}>
                                <span>❓ 質問機能</span><span className={`text-xs px-2 py-1 rounded ${event.enable_questions?'bg-green-500 text-black':'bg-zinc-800 text-zinc-500'}`}>{event.enable_questions?'ON':'OFF'}</span>
                            </button>
                            
                            <button onClick={()=>toggleFeature('enable_welcome')} className={`p-4 rounded-xl border font-bold flex justify-between items-center transition-all ${event.enable_welcome?'bg-yellow-900/20 border-yellow-500/50 text-yellow-400':'bg-black border-zinc-700 text-zinc-500'}`}>
                                <span>👋 ウェルカム画面</span><span className={`text-xs px-2 py-1 rounded ${event.enable_welcome?'bg-yellow-500 text-black':'bg-zinc-800 text-zinc-500'}`}>{event.enable_welcome?'ON':'OFF'}</span>
                            </button>
                        </div>
                    </div>
                    
                    <form onSubmit={updateSettings} className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 shadow-lg space-y-6">
                        <h3 className="font-bold text-zinc-300">基本設定</h3>
                        <div>
                            <label className="block text-zinc-500 text-xs font-bold mb-2 uppercase tracking-wider">ウェルカムメッセージ</label>
                            <textarea name="welcome_message" defaultValue={event.welcome_message} className="w-full bg-black p-4 rounded-xl border border-zinc-700 text-white focus:border-blue-500 outline-none transition-colors h-24" placeholder="参加者に表示するメッセージを入力..." />
                        </div>
                        <div>
                            <label className="block text-zinc-500 text-xs font-bold mb-2 uppercase tracking-wider">管理者パスワード</label>
                            <input name="password" defaultValue={event.password} className="w-full bg-black p-4 rounded-xl border border-zinc-700 text-white focus:border-blue-500 outline-none transition-colors" />
                            <p className="text-zinc-600 text-xs mt-2">※ 変更すると、他の管理者は自動的にログアウトされます。</p>
                        </div>
                        <div>
                            <label className="block text-zinc-500 text-xs font-bold mb-2 uppercase tracking-wider">質問リミット (1人あたり)</label>
                            <input name="limit" type="number" defaultValue={event.question_limit} className="w-full bg-black p-4 rounded-xl border border-zinc-700 text-white focus:border-blue-500 outline-none transition-colors" />
                        </div>
                        <button className="w-full bg-blue-600 py-4 rounded-xl font-bold text-white hover:bg-blue-500 active:scale-95 transition-all shadow-lg">設定を保存</button>
                    </form>
                </div>
            )}
        </div>
      </div>
    </div>
  )
}