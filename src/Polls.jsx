import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabaseClient'

export default function Polls({ session }) {
  const [poll, setPoll] = useState(null)
  const [hasVoted, setHasVoted] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  
  // FIX: Use a Ref to track the current ID so the Realtime listener 
  // can read the latest ID without needing to restart the listener.
  const pollIdRef = useRef(null)

  useEffect(() => {
    checkActivePoll()

    const channel = supabase
      .channel('public:polls')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'polls' }, (payload) => {
        if (payload.new.active) {
          setPoll(payload.new)
          pollIdRef.current = payload.new.id // Update Ref
          setHasVoted(false)
          setIsVisible(true)
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'polls' }, (payload) => {
        // FIX: Only hide if the UPDATE event is for the CURRENT poll.
        // Ignores "turn off" commands for old/other polls.
        if (!payload.new.active && payload.new.id === pollIdRef.current) {
          setIsVisible(false)
          setTimeout(() => {
            setPoll(null)
            pollIdRef.current = null
          }, 300)
        }
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  async function checkActivePoll() {
    const { data } = await supabase.from('polls').select('*').eq('active', true).maybeSingle()
    if (data) {
      setPoll(data)
      pollIdRef.current = data.id // Update Ref
      setIsVisible(true)
    }
  }

  async function handleVote(optionIndex) {
    if (!poll) return

    await supabase.from('votes').insert({
      poll_id: poll.id,
      option_index: optionIndex,
      user_id: session.user.id
    })

    setHasVoted(true)

    // LOGIC: Show "Thank You" screen for 5 seconds, THEN dissolve
    setTimeout(() => {
      setIsVisible(false)
    }, 5000)
  }

  if (!poll) return null

  return (
    <div 
      className={`fixed bottom-20 left-4 right-4 z-50 transition-all duration-500 ease-in-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
      }`}
    >
      {/* Dark Glass Card (Apple Dark Mode) */}
      <div className="bg-zinc-900/90 backdrop-blur-xl border border-white/10 p-5 rounded-[24px] shadow-2xl">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-white font-bold text-lg leading-tight tracking-tight">{poll.question}</h3>
          <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ml-3 shrink-0 shadow-sm animate-pulse">
            LIVE
          </span>
        </div>

        {/* Options */}
        <div className="space-y-2.5">
          {hasVoted ? (
            // Success State (The "End Screen")
            <div className="text-center py-6 bg-white/5 rounded-xl border border-white/5 animate-in fade-in duration-300">
              <div className="inline-flex items-center justify-center w-8 h-8 bg-blue-500/20 text-blue-400 rounded-full mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-blue-400 font-bold text-sm">投票しました</p>
              <p className="text-zinc-500 text-xs mt-1">結果はスクリーンをご覧ください</p>
            </div>
          ) : (
            // Vote Buttons (Dark)
            poll.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => handleVote(idx)}
                className="w-full text-left p-4 rounded-xl bg-zinc-800/50 hover:bg-zinc-700 border border-white/5 hover:border-blue-500/50 transition-all active:scale-[0.98] group"
              >
                <span className="text-zinc-200 text-[15px] font-medium group-hover:text-white transition-colors">
                  {opt}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}