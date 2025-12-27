import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabaseClient'
import { useParams, useLocation } from 'react-router-dom'

// --- CONFIG: BAD WORDS (English + Romaji) ---
const BAD_WORDS_EXACT = [
  "fuck", "shit", "asshole", "bitch", "dumb", "stupid", "idiot", "sex", "porn", "dick", "pussy",
  "shine", "oppai", "baka", "ahou", "kuso", "hentai", "shi-ne", "kill", "die", "sex"
]
const BAD_WORDS_PARTIAL = ["馬鹿", "バカ", "死ね", "殺す", "キモい", "ウザい", "詐欺", "暴力"]

const checkProfanity = (text) => {
  if (!text) return false
  const lowerText = text.toLowerCase()
  // Check Japanese characters
  if (BAD_WORDS_PARTIAL.some(w => lowerText.includes(w))) return true
  // Check English/Romaji tokens
  const tokens = lowerText.split(/[^a-z0-9]+/)
  return tokens.some(token => BAD_WORDS_EXACT.includes(token))
}

// --- LOADING SCREEN (LiveQ Branding) ---
function ModernLoader() {
  return (
    <div className="bg-black h-[100dvh] w-full flex flex-col items-center justify-center relative overflow-hidden text-white">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-900/40 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="relative z-10 flex flex-col items-center space-y-6">
        <div className="relative">
             <span className="block w-12 h-12 border-4 border-zinc-800 border-t-indigo-500 rounded-full animate-spin"></span>
        </div>
        <div className="flex flex-col items-center">
            <h2 className="text-2xl font-black tracking-tighter">LiveQ</h2>
            <p className="text-zinc-500 text-[10px] font-mono mt-2 animate-pulse tracking-widest">イベントに接続中...</p>
        </div>
      </div>
    </div>
  )
}

// --- SUB COMPONENTS ---

function ChatTab({ session, eventId, isBanned, isMock }) {
  const [msgs, setMsgs] = useState([])
  const [txt, setTxt] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    if (isMock) { setMsgs([{ id: 1, nickname: 'System', content: 'デモチャットを開始しました' }]); return }

    supabase.from('messages').select('*').eq('event_id', eventId).order('created_at', {ascending:true})
      .then(({data}) => { if(data) setMsgs(data); setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "auto" }), 100) })
    
    const channelName = `chat_${eventId}_${Date.now()}`
    const ch = supabase.channel(channelName).on('postgres_changes', {event:'INSERT', schema:'public', table:'messages', filter:`event_id=eq.${eventId}`}, p => {
        setMsgs(c => [...c, p.new])
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100)
    }).subscribe()

    return () => supabase.removeChannel(ch)
  }, [eventId, isMock])

  const send = async () => {
    if (!txt.trim() || isBanned) return
    if (isMock) { setMsgs(p => [...p, {id: Date.now(), nickname: 'You', content: txt}]); setTxt(''); return }
    if (checkProfanity(txt)) {
      const { data: user } = await supabase.from('profiles').select('nickname').eq('id', session.user.id).single()
      await supabase.from('admin_notifications').insert({ event_id: eventId, user_id: session.user.id, nickname: user?.nickname || 'Guest', content: txt })
      setTxt(''); alert("⚠️ 不適切な表現が含まれているため、管理者に報告されました。"); return
    }
    const { data: user } = await supabase.from('profiles').select('nickname').eq('id', session.user.id).single()
    const { error } = await supabase.from('messages').insert({ event_id: eventId, user_id: session.user.id, nickname: user?.nickname || 'Guest', content: txt })
    if (!error) setTxt('')
  }
  const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) { e.preventDefault(); send() } }

  return (
    <div className="flex flex-col h-full relative">
      <div className="flex-1 overflow-y-auto p-4 space-y-2 pb-24">
        {msgs.map(m => (
          <div key={m.id} className="bg-zinc-900 p-2 rounded-lg break-all animate-in fade-in slide-in-from-bottom-1">
            <span className="font-bold text-indigo-400 text-xs">{m.nickname}: </span>
            <span className="text-sm">{m.content}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-black/95 border-t border-zinc-800 flex gap-2 z-20">
        <input disabled={isBanned} value={txt} onChange={e => setTxt(e.target.value)} onKeyDown={handleKeyDown} className="flex-1 bg-zinc-900 text-white p-2 rounded border border-zinc-700 outline-none focus:border-indigo-500" placeholder={isBanned ? "制限中" : "メッセージ..."} />
        <button disabled={isBanned} onClick={send} className="bg-indigo-600 px-4 rounded-xl font-bold text-sm">送信</button>
      </div>
    </div>
  )
}

function QuestionsListTab({ session, eventId, isBanned, isMock }) {
  const [qs, setQs] = useState([])
  const [filter, setFilter] = useState('newest') 

  useEffect(() => {
    if (isMock) { setQs([{ id: 1, nickname: 'Demo', content: 'デモ質問です', likes: 10, dislikes: 0 }]); return }
    const fetchQs = async () => { const { data } = await supabase.from('questions').select('*').eq('event_id', eventId).eq('is_hidden', false); if (data) setQs(data) }
    fetchQs()
    const channelName = `qs_${eventId}_${Date.now()}`
    const ch = supabase.channel(channelName).on('postgres_changes', { event: '*', schema: 'public', table: 'questions', filter: `event_id=eq.${eventId}` }, fetchQs).subscribe()
    return () => supabase.removeChannel(ch)
  }, [eventId, isMock])

  const handleVote = async (q, type) => {
    if (isMock || isBanned || q.user_id === session.user.id) return
    const { error } = await supabase.from('question_votes').insert({ question_id: q.id, user_id: session.user.id, vote_type: type })
    if (error && error.code === '23505') return alert("既に投票済みです")
    const update = type === 'like' ? { likes: q.likes + 1 } : { dislikes: q.dislikes + 1 }
    let hide = false
    if (type === 'dislike' && (q.dislikes + 1) >= (q.likes + 2)) hide = true
    await supabase.from('questions').update({ ...update, is_hidden: hide }).eq('id', q.id)
  }

  const sortedQs = [...qs].sort((a,b) => {
    if (filter === 'newest') return new Date(b.created_at || 0) - new Date(a.created_at || 0)
    return (b.likes - b.dislikes) - (a.likes - a.dislikes)
  })

  return (
    <div className="flex flex-col h-full bg-black text-white p-4 overflow-hidden">
      <div className="flex gap-2 mb-4 bg-zinc-900 p-1 rounded-lg shrink-0 border border-zinc-800">
        <button onClick={() => setFilter('newest')} className={`flex-1 py-1 rounded text-sm ${filter==='newest'?'bg-zinc-700 font-bold':'text-zinc-500'}`}>新着順</button>
        <button onClick={() => setFilter('top')} className={`flex-1 py-1 rounded text-sm ${filter==='top'?'bg-zinc-700 font-bold':'text-zinc-500'}`}>人気順</button>
      </div>
      <div className="flex-1 overflow-y-auto space-y-3 pb-4">
        {sortedQs.map(q => (
          <div key={q.id} className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 animate-in zoom-in-95">
            <p className="text-xs font-bold text-zinc-500 mb-1">{q.nickname}</p>
            <p className="text-lg mb-4 break-all leading-tight">{q.content}</p>
            <div className="flex gap-3">
              <button onClick={() => handleVote(q, 'like')} className="bg-zinc-800 px-4 py-2 rounded-xl text-green-400 text-sm border border-zinc-700">👍 {q.likes}</button>
              <button onClick={() => handleVote(q, 'dislike')} className="bg-zinc-800 px-4 py-2 rounded-xl text-red-400 text-sm border border-zinc-700">👎 {q.dislikes}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SubmitQuestionTab({ session, eventId, limit, isBanned, isMock }) {
  const [txt, setTxt] = useState('')
  const [loading, setLoading] = useState(false)
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (isMock) return
    const checkCount = async () => {
      const { count } = await supabase.from('questions').select('*', { count: 'exact', head: true }).eq('user_id', session.user.id).eq('event_id', eventId)
      setCount(count || 0)
    }
    checkCount()
  }, [])
  const hasRemaining = (limit - count) > 0

  const submit = async () => {
    if (!txt.trim() || isBanned || loading || !hasRemaining) return
    if (isMock) { setTxt(''); alert("Mock送信完了"); return }

    setLoading(true)
    if (checkProfanity(txt)) {
      const { data: user } = await supabase.from('profiles').select('nickname').eq('id', session.user.id).single()
      await supabase.from('admin_notifications').insert({ event_id: eventId, user_id: session.user.id, nickname: user?.nickname || 'Guest', content: txt })
      setLoading(false); setTxt(''); alert("⚠️ 質問は管理者の確認待ち、または不適切な表現が含まれているため表示されません。"); return
    }
    const { data: user } = await supabase.from('profiles').select('nickname').eq('id', session.user.id).single()
    const { error } = await supabase.from('questions').insert({ event_id: eventId, user_id: session.user.id, nickname: user?.nickname || 'Guest', content: txt })
    setLoading(false)
    if (!error) { setTxt(''); setCount(c => c + 1); alert("送信しました") }
  }

  return (
    <div className="h-full bg-black text-white p-6 flex flex-col justify-center max-w-md mx-auto overflow-y-auto">
      <h2 className="text-2xl font-bold mb-2">質問を投稿する</h2>
      <div className={`mb-4 font-bold text-sm ${hasRemaining ? 'text-indigo-400' : 'text-red-500'}`}>{hasRemaining ? `あと ${limit - count} 件質問できます` : '質問の上限に達しました'}</div>
      <textarea disabled={isBanned || !hasRemaining} value={txt} onChange={e => setTxt(e.target.value)} className="bg-zinc-900 text-white p-4 rounded-2xl h-40 mb-6 text-lg border border-zinc-700 focus:border-indigo-500 outline-none" placeholder="匿名で質問できます..." />
      <button onClick={submit} disabled={loading || isBanned || !hasRemaining} className="bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg active:scale-95 transition-all disabled:opacity-50">送信</button>
    </div>
  )
}

function MiniPollResults({ poll, isMock }) {
  const [livePoll, setLivePoll] = useState(poll)
  useEffect(() => {
    if(isMock) return
    setLivePoll(poll)
    const ch = supabase.channel(`mini_poll_${poll.id}_${Date.now()}`)
      .on('postgres_changes', {event:'UPDATE', schema:'public', table:'polls', filter:`id=eq.${poll.id}`}, (payload) => setLivePoll(payload.new))
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [poll.id, isMock])
  const total = livePoll.options.reduce((acc, opt) => acc + (opt.count || 0), 0) || 1
  return (
    <div className="bg-zinc-900 p-4 border-b border-indigo-900/50 shadow-lg animate-in fade-in slide-in-from-top-2 z-20">
      <div className="flex justify-between items-center mb-2"><h3 className="font-bold text-white text-sm">📊 ライブ投票</h3><span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded animate-pulse">LIVE</span></div>
      <p className="text-white font-bold mb-3 text-sm">{livePoll.question}</p>
      <div className="space-y-2">
        {livePoll.options.map((opt, i) => {
          const count = opt.count || 0; const pct = Math.round((count / total) * 100)
          return (<div key={i} className="text-xs"><div className="flex justify-between text-zinc-300 mb-1"><span>{opt.label}</span><span>{pct}%</span></div><div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden"><div className="h-full bg-indigo-500 transition-all duration-500" style={{width: `${pct}%`}}></div></div></div>)
        })}
      </div>
    </div>
  )
}

function PollOverlay({ poll, onVote }) {
  if (!poll) return null
  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-8 animate-in fade-in backdrop-blur-sm">
      {poll.type === 'entry' && <span className="text-yellow-500 font-bold mb-2 uppercase tracking-widest text-xs">Welcome Poll</span>}
      {poll.type === 'live' && <span className="text-red-500 font-bold mb-2 uppercase tracking-widest text-xs animate-pulse">Live Poll</span>}
      <h2 className="text-2xl font-bold text-white mb-10 text-center leading-snug">{poll.question}</h2>
      <div className="w-full max-w-sm space-y-4">
        {poll.options.map((opt, i) => (
          <button key={i} onClick={() => onVote(poll.id, i)} className="w-full bg-indigo-600 text-white p-5 rounded-2xl font-bold text-xl active:scale-95 transition-all shadow-lg shadow-indigo-900/20">{typeof opt === 'string' ? opt : opt.label}</button>
        ))}
      </div>
    </div>
  )
}

// --- MAIN APP ---
export default function UserView() {
  const { slug } = useParams()
  const location = useLocation()
  const isMock = new URLSearchParams(location.search).get('mock') === 'true'

  const [session, setSession] = useState(null)
  const [event, setEvent] = useState(null)
  const [view, setView] = useState('loading')
  const [tab, setTab] = useState('') 
  
  const [activePoll, setActivePoll] = useState(null)
  const [votedPolls, setVotedPolls] = useState(new Set())
  const [showThanks, setShowThanks] = useState(false)
  const [isBanned, setIsBanned] = useState(false)

  const activePollRef = useRef(null)
  const resetCountRef = useRef(0)
  
  useEffect(() => { activePollRef.current = activePoll }, [activePoll])

  // --- MOCK MODE ---
  useEffect(() => {
    if (isMock) {
        setSession({ user: { id: 'mock-user' } })
        setEvent({ id: 999, name: "LiveQ Demo", enable_chat: true, enable_questions: true, question_limit: 5 })
        setView('app')
        setTab('chat')
    }
  }, [isMock])

  // --- SAFE WAKE UP ---
  useEffect(() => {
    let lastTime = Date.now()
    const handleVisibilityChange = () => {
      const now = Date.now()
      if (document.visibilityState === 'visible' && !isMock) {
         if (now - lastTime > 5000) {
            console.log("LiveQ woke up. Reloading...")
            supabase.removeAllChannels().then(() => window.location.reload())
         }
      } else {
         lastTime = now 
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange)
  }, [isMock])

  // --- LOAD DATA ---
  async function loadEvent(userId) {
    await supabase.removeAllChannels()

    const { data, error } = await supabase.from('events').select('*').eq('slug', slug).single()
    if (error || !data) return setView('error')
    
    resetCountRef.current = data.reset_count

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single()
    if (!profile) { await supabase.auth.signOut(); setView('join'); return }
    if (profile.is_banned) setIsBanned(true)

    setEvent(data)
    
    const channelName = `event_main_${Date.now()}`
    const eventChannel = supabase.channel(channelName)
      .on('postgres_changes', {event:'UPDATE', schema:'public', table:'events', filter:`id=eq.${data.id}`}, 
        (payload) => {
          const newEvent = payload.new
          setEvent(newEvent)
          if (newEvent.reset_count > resetCountRef.current) { handleKick(); return }
          if (newEvent.active_poll_id) { fetchPoll(newEvent.active_poll_id) } 
          else { 
             const currentPoll = activePollRef.current;
             if (currentPoll && currentPoll.id !== newEvent.entry_poll_id) setActivePoll(null)
          }
        }
      )
      .subscribe((status) => {
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') window.location.reload()
      })

    const profileChannel = supabase.channel(`profile_${Date.now()}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, 
        (payload) => { if (payload.new.id === userId) setIsBanned(payload.new.is_banned) }
      ).subscribe()

    if (data.enable_chat) setTab('chat')
    else if (data.enable_questions) setTab('questions')
    else setTab('none')
    
    setView('app')
    
    if (data.active_poll_id) fetchPoll(data.active_poll_id)
    else if (data.entry_poll_id) fetchPoll(data.entry_poll_id)

    return () => {
      supabase.removeChannel(eventChannel)
      supabase.removeChannel(profileChannel)
    }
  }

  // --- INITIAL CHECK ---
  useEffect(() => {
    if (isMock) return;

    // Fetch event FIRST so join() works
    const init = async () => {
        const { data: ev } = await supabase.from('events').select('*').eq('slug', slug).single()
        if (ev) setEvent(ev)

        const { data: auth } = await supabase.auth.getSession()
        setSession(auth.session)
        if (!auth.session) setView('join')
        else loadEvent(auth.session.user.id)
    }
    init()
  }, [slug, isMock])

  const fetchPoll = async (id) => {
    const { data } = await supabase.from('polls').select('*').eq('id', id).single()
    if (data) setActivePoll(data)
  }

  const handleKick = async () => { await supabase.auth.signOut(); setSession(null); setView('join'); alert("再ログインしてください") }

  // --- JOIN (ENGLISH ONLY + UNIQUE + PROFANITY) ---
  const join = async (e) => {
    e.preventDefault(); 
    const nick = e.target.nick.value.trim(); 
    if (!nick) return

    // 1. English Only Check (Allow letters, numbers, spaces, dots, underscores, hyphens)
    if (!/^[a-zA-Z0-9\s\-_.]+$/.test(nick)) {
        alert("ニックネームは英数字のみ使用可能です")
        return
    }

    // 2. Bad Word Check
    if (checkProfanity(nick)) {
        alert("そのニックネームは使用できません")
        return
    }

    // 3. Unique Check
    const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('nickname', nick)
        .eq('event_id', event.id) 
        .limit(1)

    if (existing && existing.length > 0) {
        alert("そのニックネームは、このイベントですでに使用されています")
        return
    }

    const { data, error } = await supabase.auth.signInAnonymously()
    if (error) return alert("接続エラー")
    
    await supabase.from('profiles').upsert({ 
        id: data.user.id, 
        nickname: nick, 
        event_id: event.id 
    })

    setSession(data.session)
    window.location.reload()
  }

  const handlePollVote = async (pollId, idx) => {
    if (isMock) { setVotedPolls(prev => new Set(prev).add(pollId)); setShowThanks(true); setTimeout(() => setShowThanks(false), 3000); return }
    if (activePoll) {
        const newOptions = [...activePoll.options]
        if (typeof newOptions[idx] === 'object') newOptions[idx].count = (newOptions[idx].count || 0) + 1
        await supabase.from('polls').update({ options: newOptions }).eq('id', pollId)
    }
    setVotedPolls(prev => new Set(prev).add(pollId))
    setShowThanks(true)
    setTimeout(() => setShowThanks(false), 3000)
  }

  if (view === 'loading') return <ModernLoader />
  if (view === 'error') return <div className="bg-black h-screen text-white flex items-center justify-center font-bold">イベントが見つかりません</div>
  if (view === 'join') {
    return (
      <div className="bg-black h-screen text-white flex flex-col items-center justify-center p-8">
        <h1 className="text-4xl font-black mb-2 text-center tracking-tighter">LiveQ</h1>
        <p className="text-zinc-500 mb-10 text-center font-mono text-sm">{slug}</p>
        <form onSubmit={join} className="w-full max-w-sm space-y-4">
          <input name="nick" className="w-full bg-zinc-900 p-5 rounded-2xl text-center text-white font-bold border border-zinc-700 outline-none focus:border-indigo-500" placeholder="Nickname" required maxLength={15} />
          <button className="w-full bg-indigo-600 p-5 rounded-2xl font-bold text-lg active:scale-95 transition-all shadow-lg shadow-indigo-900/20">参加する</button>
        </form>
      </div>
    )
  }

  const showOverlay = activePoll && !votedPolls.has(activePoll.id)
  const showResults = activePoll && votedPolls.has(activePoll.id) && event.active_poll_id === activePoll.id

  return (
    <div className="fixed inset-0 flex flex-col bg-black text-white font-sans overflow-hidden max-w-lg mx-auto border-x border-zinc-900 shadow-2xl">
      {isBanned && <div className="bg-red-600 text-white p-2 text-center text-xs font-bold uppercase tracking-widest flex-none z-[60]">Account Banned</div>}
      <div className="flex-none bg-zinc-900 z-10">
        <div className="p-4 flex justify-between items-center border-b border-zinc-800">
           <h1 className="font-bold truncate max-w-[200px] text-zinc-100">{event.name}</h1>
           <span className="text-xs bg-zinc-900 text-zinc-500 px-2 py-1 rounded border border-zinc-800">{session?.user?.id.slice(0,4)}</span>
        </div>
        {(event.enable_chat || event.enable_questions) && (
          <div className="flex h-12 border-b border-zinc-900">
            {event.enable_chat && <button onClick={() => setTab('chat')} className={`flex-1 font-bold text-sm transition-all ${tab==='chat'?'text-indigo-400 bg-zinc-900/50':'text-zinc-500'}`}>チャット</button>}
            {event.enable_questions && <><button onClick={() => setTab('questions')} className={`flex-1 font-bold text-sm transition-all ${tab==='questions'?'text-indigo-400 bg-zinc-900/50':'text-zinc-500'}`}>質問一覧</button><button onClick={() => setTab('ask')} className={`flex-1 font-bold text-sm transition-all ${tab==='ask'?'text-indigo-400 bg-zinc-900/50':'text-zinc-500'}`}>質問する</button></>}
          </div>
        )}
        {showResults && <MiniPollResults poll={activePoll} />}
      </div>
      <div className="flex-1 relative overflow-hidden">
        <div className="h-full overflow-y-auto">
          {tab === 'chat' && event.enable_chat && <ChatTab session={session} eventId={event.id} isBanned={isBanned} />}
          {tab === 'questions' && event.enable_questions && <QuestionsListTab session={session} eventId={event.id} isBanned={isBanned} />}
          {tab === 'ask' && event.enable_questions && <SubmitQuestionTab session={session} eventId={event.id} limit={event.question_limit} isBanned={isBanned} />}
          {tab === 'none' && <div className="flex h-full items-center justify-center text-zinc-600 font-bold px-10 text-center">このイベントの機能は無効化されています</div>}
        </div>
      </div>
      {isBanned && <div className="absolute inset-0 bg-black/95 text-red-500 font-bold flex flex-col items-center justify-center z-[200] p-8 text-center animate-in fade-in"><h2 className="text-4xl mb-4">🚫 BANNED</h2><p className="text-white">アカウントが停止されました。</p></div>}
      {showOverlay && !isBanned && <PollOverlay poll={activePoll} onVote={handlePollVote} />}
      {showThanks && (<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-green-600 text-white px-8 py-4 rounded-2xl z-[70] animate-out fade-out duration-1000 shadow-xl font-bold">投票しました！</div>)}
    </div>
  )
}