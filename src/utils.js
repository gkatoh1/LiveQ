// ... (Keep the huge BANNED_WORDS list from before) ...
const BANNED_WORDS = [
  // --- ENGLISH ---
  "fuck", "shit", "bitch", "ass", "asshole", "bastard", "dick", "cunt", 
  "pussy", "cock", "whore", "slut", "douche", "crap", "damn", "piss", 
  "fag", "faggot", "nigger", "nigga", "retard", "spic", "kike", "chink",
  "dyke", "tranny", "motherfucker", "wanker", "bollocks", "twat", "prick", 
  "jerk", "idiot", "stupid", "dumb", "loser", "ugly", "fat", "hate", 
  "kill yourself", "kys", "die", "suicide", "rape", "sex", "nude", 
  "boobs", "penis", "vagina", "anal", "blowjob", "handjob", "rimjob",
  "scum", "trash", "filth", "shut up", "stfu", "wtf", "omg", 
  
  // --- JAPANESE ---
  "バカ", "ばか", "馬鹿",
  "アホ", "あほ", "阿呆",
  "死ね", "しね", "氏ね",
  "殺す", "ころす",
  "クズ", "くず",
  "カス", "かす",
  "うざい", "ウザい", "うざっ",
  "きもい", "キモい", "キモッ",
  "ブス", "ぶす",
  "デブ", "でぶ",
  "畜生", "ちくしょう",
  "クソ", "くそ", "糞",
  "ヤリマン", "やりまん",
  "ヤリチン", "やりちん",
  "キチガイ", "きちがい",
  "障害者", "ガイジ",
  "手帳持ち",
  "乞食", "こじき",
  "非国民",
  "売国奴",
  "シナ", "チョン",
  "てめえ", "テメェ",
  "きさま", "貴様",
  "ゴミ", "ごみ",
  "老害",
  "ゆとり",
  "陰キャ",
  "メンヘラ",
  "地獄",
  "変態", "へんたい",
  "エロ",
  "セックス",
  "レイプ",
  "マンコ", "まんこ",
  "チンコ", "ちんこ",
  "クリトリス",
  "オナニー",
  "童貞", "どうてい",
  "処女", "しょじょ",
  "やりたい",
  "フェラ",
  "パイズリ",
  "イく",
  "中出し",
  "ふざけるな", "ふざけんな",
  "黙れ", "だまれ",
  "くたばれ"
];

export function hasBadWords(text) {
  if (!text) return false;
  const lowerText = text.toLowerCase(); 
  return BANNED_WORDS.some(word => lowerText.includes(word));
}