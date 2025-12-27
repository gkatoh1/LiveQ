import { useState } from 'react'
import { supabase } from './supabaseClient'

export default function Admin() {
  const [authorized, setAuthorized] = useState(false)
  const [events, setEvents] = useState([])

  const login = (e) => {
    e.preventDefault()
    if (e.target.pass.value === 'admin123') {
      setAuthorized(true)
      fetchEvents()
    } else {
      alert("パスワードが違います")
    }
  }

  async function fetchEvents() {
    const { data } = await supabase.from('events').select('*').order('created_at', {ascending: false})
    if (data) setEvents(data)
  }

  const createEvent = async (e) => {
    e.preventDefault()
    const name = e.target.name.value
    const slug = e.target.slug.value
    const password = e.target.password.value

    if (!name || !slug || !password) return alert("全ての項目を入力してください")

    const { data, error } = await supabase.from('events').insert({ 
      name, 
      slug, 
      admin_password: password
    }).select().single()

    if (error) return alert("エラー: " + error.message)
    
    setEvents([data, ...events])
    e.target.reset()
  }

  if (!authorized) return (
    <div className="h-screen bg-black flex items-center justify-center">
      <form onSubmit={login} className="bg-zinc-900 p-8 rounded-xl w-full max-w-sm border border-zinc-800">
        <h1 className="text-white mb-6 font-bold text-2xl text-center">全体管理者</h1>
        <input name="pass" type="password" placeholder="パスワード (admin123)" className="w-full p-3 rounded bg-black border border-zinc-700 text-white mb-4" />
        <button className="bg-blue-600 text-white px-4 py-3 rounded-xl font-bold w-full">ログイン</button>
      </form>
    </div>
  )

  return (
    <div className="min-h-screen bg-black text-white p-8 font-sans">
      <h1 className="text-3xl font-bold mb-8">イベント管理 (マスター)</h1>
      
      <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 mb-8">
        <h2 className="font-bold mb-4 text-xl">新規イベント作成</h2>
        <form onSubmit={createEvent} className="flex flex-col gap-4">
          <input name="name" placeholder="イベント名" className="bg-black p-3 rounded border border-zinc-700 text-white" />
          <input name="slug" placeholder="URL ID" className="bg-black p-3 rounded border border-zinc-700 text-white" />
          <input name="password" placeholder="管理者パスワード" className="bg-black p-3 rounded border border-zinc-700 text-white" />
          <button className="bg-green-600 px-6 py-3 rounded font-bold hover:bg-green-500 text-white">作成</button>
        </form>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.map(evt => (
          <div key={evt.id} className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
            <h3 className="text-xl font-bold mb-1 text-white">{evt.name}</h3>
            <p className="text-zinc-500 text-sm">ID: {evt.slug}</p>
            <p className="text-zinc-500 text-sm mb-4">Pass: {evt.admin_password}</p>
            <a href={`/admin/${evt.slug}`} target="_blank" className="block w-full bg-blue-600 text-white text-center py-2 rounded font-bold text-sm hover:bg-blue-500">
              管理画面へ移動
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}