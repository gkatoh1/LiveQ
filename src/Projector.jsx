import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { QRCodeSVG } from 'qrcode.react'
import { useParams } from 'react-router-dom'
import BigQrOverlay from './components/BigQrOverlay'

// --- 0. SHARED LOADER COMPONENT ---
function ModernLoader() {
  return (
    <div className="bg-black h-[100dvh] w-full flex flex-col items-center justify-center relative overflow-hidden text-white">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-900/40 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="relative z-10 flex flex-col items-center space-y-6">
        <div className="relative"><span className="block w-12 h-12 border-4 border-zinc-800 border-t-indigo-500 rounded-full animate-spin"></span></div>
        <div className="flex flex-col items-center">
            <img src="/logo.png" alt="LiveQ" className="h-12 w-auto object-contain mb-2" />
            <p className="text-zinc-500 text-[10px] font-mono animate-pulse tracking-widest">プロジェクター接続中...</p>
        </div>
      </div>
    </div>
  )
}

// --- SUB-COMPONENT: LIVE POLL ---
function LivePollOverlay({ pollId }) {
  const [poll, setPoll] = useState(null)

  useEffect(() => {
    const fetchPoll = async () => {
      const { data } = await supabase.from('polls').select('*').eq('id', pollId).single()
      if (data) setPoll(data)
    }
    fetchPoll()

    const ch = supabase.channel(`poll_projector_${pollId}`)
      .on('postgres_changes', {event:'UPDATE', schema:'public', table:'polls', filter:`id=eq.${pollId}`}, 
      (payload) => setPoll(payload.new))
      .subscribe()

    return () => supabase.removeChannel(ch)
  }, [pollId])

  if (!poll) return null

  const total = poll.options.reduce((sum, opt) => sum + (opt.count || 0), 0) || 1

  return (
    <div className="absolute inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-12 animate-in fade-in duration-500 backdrop-blur-sm">
      <div className="w-full max-w-5xl">
        <h2 className="text-5xl font-black text-white mb-8 text-center leading-tight drop-shadow-2xl">{poll.question}</h2>
        <p className="text-zinc-500 text-center mb-12 text-xl font-bold uppercase tracking-[0.3em]">現在の投票結果 (Live Results)</p>
        <div className="space-y-6">
           {poll.options.map((opt, i) => {
             const count = opt.count || 0
             const pct = Math.round((count / total) * 100)
             return (
               <div key={i} className="w-full">
                 <div className="flex justify-between items-end text-3xl font-bold mb-2 text-white">
                   <span>{opt.label}</span>
                   <span className="text-blue-400 font-mono">{pct}%</span>
                 </div>
                 <div className="w-full bg-zinc-900 rounded-full h-10 overflow-hidden border border-zinc-700 shadow-inner relative">
                   <div className="h-full bg-gradient-to-r from-blue-700 to-cyan-500 transition-all duration-700 ease-out shadow-[0_0_30px_rgba(59,130,246,0.6)] relative" style={{ width: `${pct}%`, minWidth: count > 0 ? '10px' : '0' }}>
                     <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/20"></div>
                   </div>
                 </div>
                 <p className="text-right text-zinc-500 mt-1 text-lg font-mono">{count} 票</p>
               </div>
             )
           })}
        </div>
        <div className="mt-16 text-center">
            <div className="inline-block px-8 py-3 bg-zinc-900 rounded-full border border-zinc-700 text-zinc-400 font-mono text-xl shadow-lg">
                総投票数: <span className="text-white font-bold">{poll.options.reduce((a,b)=>a+(b.count||0),0)}</span>
            </div>
        </div>
      </div>
    </div>
  )
}

// --- MAIN COMPONENT ---
export default function Projector() {
  const { slug } = useParams()
  const [event, setEvent] = useState(null)
  const [chat, setChat] = useState([])
  const [qs, setQs] = useState([])
  const [status, setStatus] = useState('connecting')
  const [showBigQr, setShowBigQr] = useState(false)

  const refreshChat = async (id) => {
    const { data } = await supabase.from('messages').select('*').eq('event_id', id).order('created_at', {ascending:true}).limit(50)
    if (data) setChat(data)
  }
  const refreshQs = async (id) => {
    const { data } = await supabase.from('questions').select('*').eq('event_id', id).eq('is_hidden', false)
    if (data) setQs(data)
  }

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((e) => {
        console.error(`Error attempting to enable full-screen mode: ${e.message} (${e.name})`);
      });
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  }

  useEffect(() => {
    let channel;
    const init = async () => {
      const { data } = await supabase.from('events').select('*').eq('slug', slug).single()
      if (!data) return
      setEvent(data)
      refreshChat(data.id)
      refreshQs(data.id)

      channel = supabase.channel('projector_main')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `event_id=eq.${data.id}` }, (p) => setChat(prev => [...prev, p.new].slice(-50)))
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages', filter: `event_id=eq.${data.id}` }, () => refreshChat(data.id))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'questions', filter: `event_id=eq.${data.id}` }, () => refreshQs(data.id))
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'events', filter: `id=eq.${data.id}` }, (p) => setEvent(p.new))
        .subscribe((subStatus) => {
          if (subStatus === 'SUBSCRIBED') setStatus('online')
          else {
             setStatus('offline')
             setTimeout(() => { if(status !== 'online') init() }, 2000)
          }
        })
    }
    init()
    return () => { if(channel) supabase.removeChannel(channel) }
  }, [slug])

  // --- REPLACED LOADING TEXT WITH COMPONENT ---
  if (!event) return <ModernLoader />

  const topQs = [...qs].sort((a,b) => (b.likes - b.dislikes) - (a.likes - a.dislikes)).slice(0, 5)
  const newestQs = [...qs].sort((a,b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5)
  const fullUrl = `${window.location.origin}/${event.slug}`

  return (
    <div className="h-screen bg-black text-white p-6 flex flex-col font-sans overflow-hidden relative group">
      
      {/* --- OVERLAYS --- */}
      {showBigQr && <BigQrOverlay url={fullUrl} onClose={() => setShowBigQr(false)} />}
      {event.active_poll_id && <LivePollOverlay pollId={event.active_poll_id} />}

      {/* --- CONTROL BAR (TOP MIDDLE) --- */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 flex items-center gap-3 z-40 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        
        {/* Status Indicator */}
        <div className="flex items-center gap-2 px-3 py-2 bg-zinc-900/90 rounded-full border border-zinc-800 backdrop-blur-sm">
          <div className={`w-2 h-2 rounded-full ${status === 'online' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
          <span className="text-[10px] text-zinc-400 uppercase font-black tracking-widest">{status === 'online' ? 'ONLINE' : 'OFFLINE'}</span>
        </div>

        {/* Join Event Button */}
        <button 
          onClick={() => setShowBigQr(true)}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-900/90 rounded-full border border-zinc-800 hover:bg-zinc-700 transition-colors text-[10px] font-bold text-zinc-300 uppercase tracking-widest cursor-pointer backdrop-blur-sm"
        >
          📱 QR CODE
        </button>

        {/* Full Screen Button */}
        <button 
          onClick={toggleFullScreen}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-900/90 rounded-full border border-zinc-800 hover:bg-zinc-700 transition-colors text-[10px] font-bold text-zinc-300 uppercase tracking-widest cursor-pointer backdrop-blur-sm"
        >
          ⛶ Full Screen
        </button>
      </div>


      {/* --- HEADER --- */}
      <div className="flex justify-between items-center mb-4 pb-2 border-b border-zinc-800 shrink-0">
        <div>
          <h1 className="text-5xl font-black tracking-tighter mb-1">{event.name}</h1>
          <p className="text-xl text-zinc-500 font-mono">URL: <span className="text-blue-400 font-bold">{window.location.host}/{event.slug}</span></p>
        </div>
        <div className="bg-white p-2 rounded-2xl"><QRCodeSVG value={fullUrl} size={100} /></div>
      </div>

      {/* --- MAIN CONTENT GRID --- */}
      <div className="flex-1 flex gap-4 overflow-hidden justify-center">
        {event.enable_chat && (
          <div className="flex-1 max-w-2xl rounded-[30px] p-5 border border-zinc-800 flex flex-col h-full relative overflow-hidden bg-zinc-900/30">
            <h2 className="text-2xl font-bold mb-4 text-blue-400 flex items-center gap-3 relative z-20">ライブチャット</h2>
            <div className="flex-1 overflow-hidden flex flex-col justify-end space-y-3 relative">
                <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black via-black/80 to-transparent z-10 pointer-events-none"></div>
                {chat.map(m => (
                  <div key={m.id} className="animate-in fade-in slide-in-from-bottom-2 duration-300 relative z-0">
                    <div className="bg-zinc-800/50 p-2 rounded-lg border border-zinc-700/30 inline-block max-w-full break-all">
                        <span className="font-bold text-blue-400 mr-2 text-sm">{m.nickname}:</span>
                        <span className="text-base text-zinc-100 font-medium">{m.content}</span>
                    </div>
                  </div>
                ))}
                {chat.length === 0 && <p className="text-zinc-700 text-lg italic">メッセージ待機中...</p>}
            </div>
          </div>
        )}

        {event.enable_questions && (
          <>
            <div className="flex-1 max-w-xl rounded-[30px] p-5 border border-zinc-800 flex flex-col h-full bg-zinc-900/30">
              <h2 className="text-2xl font-bold mb-4 text-green-400">最新の質問</h2>
              <div className="space-y-3">
                  {newestQs.map(q => (
                    <div key={q.id} className="bg-zinc-900/80 p-3 rounded-2xl border border-zinc-700/50 animate-in zoom-in-95 duration-500 shadow-md">
                      <p className="text-lg leading-snug font-medium mb-1 break-all">{q.content}</p>
                      <p className="text-xs text-zinc-500">— {q.nickname}</p>
                    </div>
                  ))}
                  {newestQs.length === 0 && <p className="text-zinc-700 text-lg italic">質問待機中...</p>}
              </div>
            </div>
            <div className="flex-1 max-w-xl rounded-[30px] p-5 border border-zinc-800 flex flex-col h-full bg-zinc-900/30">
              <h2 className="text-2xl font-bold mb-4 text-yellow-400">注目の質問</h2>
              <div className="space-y-3">
                  {topQs.map(q => (
                    <div key={q.id} className="bg-gradient-to-br from-zinc-800 to-zinc-900 p-3 rounded-2xl border border-yellow-500/30 animate-in zoom-in-95 duration-500 shadow-sm">
                      <div className="flex justify-between items-start gap-3">
                        <p className="text-lg leading-snug font-medium flex-1 break-all">{q.content}</p>
                        <div className="bg-yellow-500 text-black px-2 py-0.5 rounded-lg font-black text-base shadow-lg shrink-0">★ {q.likes - q.dislikes}</div>
                      </div>
                      <p className="text-xs text-zinc-500 mt-2">— {q.nickname}</p>
                    </div>
                  ))}
                  {topQs.length === 0 && <p className="text-zinc-700 text-lg italic">投票待機中...</p>}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}