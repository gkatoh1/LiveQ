import { QRCodeSVG } from 'qrcode.react'

// The "export default" here is crucial. Without it, the app crashes.
export default function BigQrOverlay({ url, onClose }) {
  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center cursor-pointer animate-in zoom-in-95 duration-300 backdrop-blur-md"
    >
      {/* Japanese Text */}
      <h2 className="text-5xl font-black text-white mb-2 tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">イベントに参加</h2>
      <p className="text-zinc-500 mb-8 font-bold">JOIN EVENT</p>
      
      <div className="p-4 bg-white rounded-3xl shadow-2xl">
        <QRCodeSVG value={url} size={300} />
      </div>

      <p className="text-3xl font-bold text-blue-400 mt-8 tracking-widest font-mono drop-shadow-lg">{url.replace(/^https?:\/\//, '')}</p>
      <p className="text-zinc-500 mt-8 text-sm uppercase tracking-widest animate-pulse">画面をタップして閉じる</p>
    </div>
  )
}