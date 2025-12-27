import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabaseClient'

// Helper: Generate nice colors for dark mode
const getUsernameColor = (name) => {
  const colors = [
    'text-red-400', 'text-orange-400', 'text-amber-400', 
    'text-green-400', 'text-emerald-400', 'text-teal-400', 
    'text-cyan-400', 'text-sky-400', 'text-blue-400', 
    'text-indigo-400', 'text-violet-400', 'text-purple-400', 
    'text-fuchsia-400', 'text-pink-400', 'text-rose-400'
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

export default function Chat({ session }) {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const messagesEndRef = useRef(null)

  useEffect(() => {
    getMessages()
    const channel = supabase
      .channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        setMessages((current) => [...current, payload.new])
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function getMessages() {
    const { data } = await supabase.from('messages').select('*').order('created_at', { ascending: true })
    if (data) setMessages(data)
  }

  async function sendMessage(e) {
    e.preventDefault()
    if (!newMessage.trim()) return

    const { data: profile } = await supabase.from('profiles').select('nickname').eq('id', session.user.id).single()

    await supabase.from('messages').insert({
      user_id: session.user.id,
      nickname: profile.nickname,
      content: newMessage
    })
    setNewMessage('')
  }

  return (
    // CONTAINER: Pure Black
    <div className="flex flex-col h-[100dvh] w-full overflow-hidden bg-black font-sans text-sm relative">
      
      {/* HEADER: Dark Glass */}
      <div className="px-4 py-3 bg-black/80 backdrop-blur-md border-b border-white/10 sticky top-0 z-10 shrink-0 flex justify-between items-center">
        <h2 className="font-bold text-zinc-300 tracking-wider uppercase text-[11px]">LIVE CHAT</h2>
        <div className="flex items-center gap-2 px-2 py-1 bg-zinc-900 rounded-md border border-white/5">
           <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
           <span className="text-zinc-400 text-[10px] font-medium tracking-wide">ON AIR</span>
        </div>
      </div>

      {/* MESSAGES AREA: Twitch Style (Dark) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1 bg-black">
        {messages.map((msg) => {
          const isMe = msg.user_id === session.user.id
          
          return (
            <div key={msg.id} className={`break-words leading-relaxed py-0.5 px-2 -mx-2 rounded hover:bg-white/5 transition-colors ${isMe ? 'bg-white/5' : ''}`}>
              
              {/* Username (Colored) */}
              <span className={`font-bold text-[13px] mr-1.5 ${getUsernameColor(msg.nickname || 'Guest')}`}>
                {msg.nickname}
              </span>
              
              {/* Separator */}
              <span className="text-zinc-600 mr-1.5 text-xs">:</span>

              {/* Message Content (White) */}
              <span className="text-zinc-200 text-[15px] font-normal">
                {msg.content}
              </span>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT AREA: Floating Dark Bar */}
      <form onSubmit={sendMessage} className="p-3 bg-black border-t border-white/10 pb-safe shrink-0">
        <div className="relative">
          <input
            className="w-full bg-zinc-900 text-white text-base p-3 pr-12 rounded-xl border border-transparent focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 placeholder-zinc-600 transition-all font-medium appearance-none"
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="メッセージを送信..."
            maxLength={200}
          />
          
          <button 
            type="submit" 
            disabled={!newMessage.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-zinc-400 hover:text-purple-400 disabled:opacity-30 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 004.832 9.25h6.11a.75.75 0 010 1.5h-6.11a1.5 1.5 0 00-1.14.965L2.28 16.636a.75.75 0 00.926.94 60.519 60.519 0 0014.39-7.936.75.75 0 000-1.28A60.517 60.517 0 003.105 2.289z" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  )
}