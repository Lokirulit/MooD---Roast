import { useState, useEffect, useRef } from 'react'

const API = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-sonnet-4-20250514'

async function callClaude(system, messages, max_tokens = 900) {
  const res = await fetch(API, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL, max_tokens, system, messages }),
  })
  const data = await res.json()
  return data.content?.map(b => b.text || '').join('') || ''
}

const STYLES_MAP = {
  classic: 'Classic standup comedy. Setup + punchline format.',
  rap: 'RAP with rhymes and flow! Real rap bars, slang, rhythm. Format like rap lyrics with line breaks.',
  poem: 'Funny POEM or limerick with rhymes! Poetic and silly.',
  short: 'SUPER SHORT — 1-2 sentences MAX. One devastating punchline.',
  scary: 'HORROR villain monologue. Dramatic, spooky, darkly funny.',
  musical: 'MUSICAL THEATRE style! Broadway song with [stage directions in brackets].',
}

function buildSysPrompt(persona, kidGender, ageGroup, intensity, style, lang) {
  const pMap = {
    girl: 'GIRL/WOMAN. References: drama, selfies, situationships, skincare, toxic friends.',
    guy: 'GUY/MAN. References: gym, rizz fails, gaming, ghosting, bro culture.',
    kid_boy: 'BOY under 13. Wholesome silly ONLY. Minecraft, football, homework, veggies. NO adult.',
    kid_girl: 'GIRL under 13. Wholesome silly ONLY. BFFs, unicorns, slime, diary, dance. NO adult.',
  }
  const ageMap = ['7-12 years — very clean, playful, silly only', '13-17 years — edgy but clean, Gen Z ok', '18+ adult — no limits, very spicy ok']
  const intMap = ['VERY GENTLE, barely teasing', 'MEDIUM — punchy but friendly', 'MAXIMUM SAVAGE — destroy them comedically']
  const langLine = lang === 'uk' ? 'ВАЖЛИВО: Відповідай ВИКЛЮЧНО українською мовою.'
    : lang === 'en' ? 'Respond in English only.'
    : 'Respond in Russian. If user wrote Ukrainian, respond in Ukrainian.'
  const key = persona === 'kid' ? 'kid_' + (kidGender || 'boy') : persona
  return `You are Roast Master 3000 — brutally funny standup comedian AI.
PERSONA: ${pMap[key]}
AGE: ${ageMap[ageGroup ?? 2]}
INTENSITY: ${intMap[intensity ?? 1]}
STYLE: ${STYLES_MAP[style || 'classic']}
${langLine}
- Funny dramatic mood name fitting the style
- Roast based on mood + persona + style + intensity
- Savage but wholesome closer
- Emojis everywhere
- Never hurtful
JSON only, no markdown: {"mood_name":"...","mood_emoji":"X","roast":"...","savage_closer":"...","vibe_score":5}`
}

function buildChatPrompt(persona, kidGender, style, lang) {
  const langLine = lang === 'uk' ? 'Respond in Ukrainian.' : lang === 'en' ? 'Respond in English.' : 'Respond in Russian/Ukrainian matching user.'
  const sh = { classic: 'Classic standup.', rap: 'Keep RAP style rhymes.', poem: 'Keep POEM style.', short: 'Keep it SHORT 1-2 sentences.', scary: 'Keep HORROR style.', musical: 'Keep MUSICAL style.' }
  if (persona === 'kid') return `Roast Master 3000 battle kid under 13. 100% wholesome. ${sh[style] || ''} ${langLine} Short punchy.`
  if (persona === 'girl') return `Roast Master 3000 battle WOMAN. Escalate funny. ${sh[style] || ''} ${langLine} Short punchy.`
  return `Roast Master 3000 battle GUY. Bro-energy. ${sh[style] || ''} ${langLine} Short punchy.`
}

function genCode() { return Math.random().toString(36).substring(2, 7).toUpperCase() }
function saveRoom(r) { try { localStorage.setItem('mr_' + r.code, JSON.stringify(r)) } catch {} }
function loadRoom(c) { try { return JSON.parse(localStorage.getItem('mr_' + c)) } catch { return null } }

const T = {
  ru: {
    title: 'MOOD ROAST', sub: 'AI знает твой вайб • и тебя поджарит',
    whoAreYou: 'Кто ты?', girl: 'Девушка', guy: 'Парень', kid: 'Ребёнок',
    boyOrGirl: '👶 Мальчик или девочка?', boy: 'Мальчик', kidgirl: 'Девочка',
    ageGroup: 'Возрастная группа', ages: ['7–12 лет 🧸', '13–17 лет 🎮', '18+ 🔥'],
    intensity: 'Жёсткость поджарки', intensityLevels: ['Мягкая 😇', 'Средняя 😏', 'ОГОНЬ! 🔥'],
    roastStyle: 'Стиль',
    styles: [
      { id: 'classic', label: 'Классика 🎤' }, { id: 'rap', label: 'Рэп 🎵' },
      { id: 'poem', label: 'Стихи 📝' }, { id: 'short', label: 'Короткая ⚔️' },
      { id: 'scary', label: 'Страшная 💀' }, { id: 'musical', label: 'Музыкальная 🎶' },
    ],
    howFeel: 'Как ты себя чувствуешь?',
    placeholder: "Напиши что угодно... 'я устал', 'жизнь боль', 'всё отлично'...",
    hint: 'Ctrl+Enter чтобы поджарить', roastBtn: '🎤 ПОДЖАРЬ МЕНЯ',
    chooseMF: '👆 ВЫБЕРИ МАЛЬЧИК / ДЕВОЧКА', roasting: '🔥 Поджариваю...',
    diagnosis: 'ДИАГНОЗ', chaosLevel: 'CHAOS LEVEL',
    copy: '📋 Копировать', copied: '✅ Скопировано!', again: '🔄 Снова',
    battle: '🥊 ОТВЕТИТЬ — НАЧАТЬ BATTLE!', battleSub: 'Думаешь сможешь поджарить AI в ответ? 😈',
    compete: '🏆 СОРЕВНОВАТЬСЯ С ДРУЗЬЯМИ', competeSub: 'Кто получит самый огненный roast?',
    replyPlaceholder: 'Ответь... Enter отправить',
    roastMaster: '🤖 ROAST MASTER', you: '🫵 ТЫ', froze: '💀 Завис от твоего ответа!',
    error: '💀 Roast Master сломался! Попробуй ещё раз.',
    createRoom: '🔥 СОЗДАТЬ КОМНАТУ', joinRoom: '🚪 ВОЙТИ В КОМНАТУ',
    back: '← Назад', yourName: 'Твоё имя / никнейм', namePlaceholder: 'Например: Макс, Огненный Дракон...',
    enterName: 'Введи своё имя!', createTitle: 'СОЗДАТЬ КОМНАТУ', createSub: 'Твой roast будет первым',
    yourRoast: 'Твой roast войдёт в комнату:', chaos: 'Chaos Level:', createBtn: '🚀 СОЗДАТЬ И ПРИГЛАСИТЬ!',
    joinTitle: 'ВОЙТИ В КОМНАТУ', roomCode: 'Код комнаты', codePlaceholder: 'Например: ABC12',
    joinBtn: '🚪 ВОЙТИ!', roomNotFound: 'Комната не найдена! Проверь код.',
    roomTitle: '🏆 ROAST BATTLE', codeLabel: 'КОД КОМНАТЫ', invite: '📤 Пригласить',
    participants: 'участник(ов)', alreadyVoted: 'Ты уже проголосовал', voteBtn: '🔥 Огонь!',
    itsYou: 'Это ты 🫵', exitRoom: '← Выйти из комнаты',
    footer: 'MOOD ROAST • поделись с другом 🔥',
    roastBattleTitle: 'ROAST BATTLE', roastBattleSub: 'Отвечай — AI жарит сильнее!',
    votes: 'голосов', changeLang: '🌐 Язык',
  },
  uk: {
    title: 'MOOD ROAST', sub: 'AI знає твій вайб • і тебе підсмажить',
    whoAreYou: 'Хто ти?', girl: 'Дівчина', guy: 'Хлопець', kid: 'Дитина',
    boyOrGirl: '👶 Хлопчик чи дівчинка?', boy: 'Хлопчик', kidgirl: 'Дівчинка',
    ageGroup: 'Вікова група', ages: ['7–12 років 🧸', '13–17 років 🎮', '18+ 🔥'],
    intensity: 'Жорсткість підсмажки', intensityLevels: ["М'яка 😇", 'Середня 😏', 'ВОГОНЬ! 🔥'],
    roastStyle: 'Стиль',
    styles: [
      { id: 'classic', label: 'Класика 🎤' }, { id: 'rap', label: 'Реп 🎵' },
      { id: 'poem', label: 'Вірш 📝' }, { id: 'short', label: 'Коротка ⚔️' },
      { id: 'scary', label: 'Страшна 💀' }, { id: 'musical', label: 'Музична 🎶' },
    ],
    howFeel: 'Як ти себе почуваєш?',
    placeholder: "Напиши що завгодно... 'я втомився', 'все чудово', 'хочу піцу'...",
    hint: 'Ctrl+Enter щоб підсмажити', roastBtn: '🎤 ПІДСМАЖ МЕНЕ',
    chooseMF: '👆 ОБЕРИ ХЛОПЧИК / ДІВЧИНКА', roasting: '🔥 Підсмажую...',
    diagnosis: 'ДІАГНОЗ', chaosLevel: 'CHAOS LEVEL',
    copy: '📋 Копіювати', copied: '✅ Скопійовано!', again: '🔄 Знову',
    battle: '🥊 ВІДПОВІСТИ — ПОЧАТИ BATTLE!', battleSub: 'Думаєш зможеш підсмажити AI у відповідь? 😈',
    compete: '🏆 ЗМАГАТИСЯ З ДРУЗЯМИ', competeSub: 'Хто отримає найогнянніший roast?',
    replyPlaceholder: 'Відповідай... Enter надіслати',
    roastMaster: '🤖 ROAST MASTER', you: '🫵 ТИ', froze: '💀 Завис від твоєї відповіді!',
    error: '💀 Roast Master зламався! Спробуй ще раз.',
    createRoom: '🔥 СТВОРИТИ КІМНАТУ', joinRoom: '🚪 УВІЙТИ В КІМНАТУ',
    back: '← Назад', yourName: "Твоє ім'я / нікнейм", namePlaceholder: 'Наприклад: Макс, Вогняний Дракон...',
    enterName: "Введи своє ім'я!", createTitle: 'СТВОРИТИ КІМНАТУ', createSub: 'Твій roast буде першим',
    yourRoast: 'Твій roast увійде до кімнати:', chaos: 'Chaos Level:', createBtn: '🚀 СТВОРИТИ І ЗАПРОСИТИ!',
    joinTitle: 'УВІЙТИ В КІМНАТУ', roomCode: 'Код кімнати', codePlaceholder: 'Наприклад: ABC12',
    joinBtn: '🚪 УВІЙТИ!', roomNotFound: 'Кімнату не знайдено! Перевір код.',
    roomTitle: '🏆 ROAST BATTLE', codeLabel: 'КОД КІМНАТИ', invite: '📤 Запросити',
    participants: 'учасник(ів)', alreadyVoted: 'Ти вже проголосував', voteBtn: '🔥 Вогонь!',
    itsYou: 'Це ти 🫵', exitRoom: '← Вийти з кімнати',
    footer: 'MOOD ROAST • поділись з другом 🔥',
    roastBattleTitle: 'ROAST BATTLE', roastBattleSub: 'Відповідай — AI смажить сильніше!',
    votes: 'голосів', changeLang: '🌐 Мова',
  },
  en: {
    title: 'MOOD ROAST', sub: 'AI knows your vibe • and will roast you',
    whoAreYou: 'Who are you?', girl: 'Girl', guy: 'Guy', kid: 'Kid',
    boyOrGirl: '👶 Boy or girl?', boy: 'Boy', kidgirl: 'Girl',
    ageGroup: 'Age group', ages: ['7–12 yrs 🧸', '13–17 yrs 🎮', '18+ 🔥'],
    intensity: 'Roast intensity', intensityLevels: ['Gentle 😇', 'Medium 😏', 'FIRE! 🔥'],
    roastStyle: 'Style',
    styles: [
      { id: 'classic', label: 'Classic 🎤' }, { id: 'rap', label: 'Rap 🎵' },
      { id: 'poem', label: 'Poem 📝' }, { id: 'short', label: 'Short ⚔️' },
      { id: 'scary', label: 'Scary 💀' }, { id: 'musical', label: 'Musical 🎶' },
    ],
    howFeel: 'How are you feeling?',
    placeholder: "Write anything... 'I'm tired', 'life is pain', 'all good'...",
    hint: 'Ctrl+Enter to roast', roastBtn: '🎤 ROAST ME',
    chooseMF: '👆 CHOOSE BOY / GIRL', roasting: '🔥 Roasting...',
    diagnosis: 'DIAGNOSIS', chaosLevel: 'CHAOS LEVEL',
    copy: '📋 Copy', copied: '✅ Copied!', again: '🔄 Again',
    battle: '🥊 FIRE BACK — START BATTLE!', battleSub: 'Think you can roast AI back? 😈',
    compete: '🏆 COMPETE WITH FRIENDS', competeSub: 'Who gets the most savage roast?',
    replyPlaceholder: 'Fire back... Enter to send',
    roastMaster: '🤖 ROAST MASTER', you: '🫵 YOU', froze: '💀 Froze from your reply!',
    error: '💀 Roast Master crashed! Try again.',
    createRoom: '🔥 CREATE ROOM', joinRoom: '🚪 JOIN ROOM',
    back: '← Back', yourName: 'Your name / nickname', namePlaceholder: 'E.g.: Max, Fire Dragon...',
    enterName: 'Enter your name!', createTitle: 'CREATE ROOM', createSub: 'Your roast goes in first',
    yourRoast: 'Your roast enters the room:', chaos: 'Chaos Level:', createBtn: '🚀 CREATE AND INVITE!',
    joinTitle: 'JOIN ROOM', roomCode: 'Room code', codePlaceholder: 'E.g.: ABC12',
    joinBtn: '🚪 JOIN!', roomNotFound: 'Room not found! Check the code.',
    roomTitle: '🏆 ROAST BATTLE', codeLabel: 'ROOM CODE', invite: '📤 Invite',
    participants: 'participant(s)', alreadyVoted: 'Already voted', voteBtn: '🔥 Fire!',
    itsYou: "That's you 🫵", exitRoom: '← Leave room',
    footer: 'MOOD ROAST • share with a friend 🔥',
    roastBattleTitle: 'ROAST BATTLE', roastBattleSub: 'Fire back — AI roasts harder!',
    votes: 'votes', changeLang: '🌐 Language',
  },
}

const C = {
  card: { width: '100%', maxWidth: 480, background: '#111', borderRadius: 16, border: '1px solid #1f1f1f', padding: '1.25rem' },
  lbl: { fontSize: '.7rem', fontWeight: 700, color: '#9ca3af', letterSpacing: '.12em', textTransform: 'uppercase', display: 'block', marginBottom: '.5rem' },
  pb: (on) => ({ flex: 1, padding: '.6rem .25rem', borderRadius: 10, cursor: 'pointer', fontSize: '.78rem', fontWeight: 700, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.15rem', transition: 'all .15s', background: on ? 'rgba(249,115,22,.12)' : '#141414', border: `${on ? '2px' : '1px'} solid ${on ? '#f97316' : '#2a2a2a'}`, color: on ? '#f97316' : '#9ca3af' }),
  seg: (on) => ({ flex: 1, padding: '.5rem .25rem', borderRadius: 8, cursor: 'pointer', fontSize: '.72rem', fontWeight: 700, border: `${on ? '2px' : '1px'} solid ${on ? '#f97316' : '#2a2a2a'}`, background: on ? 'rgba(249,115,22,.1)' : '#141414', color: on ? '#f97316' : '#9ca3af', transition: 'all .15s', textAlign: 'center' }),
  ta: { background: '#141414', border: '1px solid #2a2a2a', color: '#f5f5f5', borderRadius: 10, padding: '.75rem', fontSize: '.93rem', fontFamily: 'inherit', resize: 'none', width: '100%', lineHeight: 1.6, outline: 'none' },
  rbtn: (on) => ({ width: '100%', border: 'none', padding: '.9rem', borderRadius: 10, cursor: on ? 'pointer' : 'not-allowed', fontFamily: "'Bebas Neue',sans-serif", fontSize: '1.3rem', letterSpacing: '.08em', transition: 'all .2s', background: on ? 'linear-gradient(135deg,#f97316,#ef4444)' : '#1f1f1f', color: on ? 'white' : '#555', boxShadow: on ? '0 0 24px rgba(249,115,22,.3)' : 'none' }),
  sbtn: { background: 'transparent', border: '1px solid #2a2a2a', color: '#9ca3af', padding: '.5rem .9rem', borderRadius: 8, cursor: 'pointer', fontSize: '.78rem', fontWeight: 700 },
  purple: { width: '100%', background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: 'white', border: 'none', padding: '.8rem', borderRadius: 10, cursor: 'pointer', fontFamily: "'Bebas Neue',sans-serif", fontSize: '1.1rem', letterSpacing: '.08em' },
  teal: { width: '100%', background: 'linear-gradient(135deg,#0f766e,#0891b2)', color: 'white', border: 'none', padding: '.8rem', borderRadius: 10, cursor: 'pointer', fontFamily: "'Bebas Neue',sans-serif", fontSize: '1.1rem', letterSpacing: '.08em' },
}

function VibeBar({ score, label }) {
  const bc = score < 4 ? '#4ade80' : score < 7 ? '#facc15' : '#ef4444'
  return (
    <div style={{ marginTop: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.68rem', color: '#9ca3af', marginBottom: '.25rem' }}>
        <span>{label}</span><span style={{ color: bc, fontWeight: 700 }}>{score}/10</span>
      </div>
      <div style={{ background: '#1f1f1f', borderRadius: 999, height: 7, overflow: 'hidden' }}>
        <div style={{ width: `${score * 10}%`, height: '100%', background: `linear-gradient(90deg,#f97316,${bc})`, borderRadius: 999, transition: 'width 1.2s cubic-bezier(.34,1.56,.64,1)' }} />
      </div>
    </div>
  )
}

function LangScreen({ onSelect }) {
  const LANGS = [
    { id: 'ru', flag: '🇷🇺', label: 'Русский' },
    { id: 'uk', flag: '🇺🇦', label: 'Українська' },
    { id: 'en', flag: '🇬🇧', label: 'English' },
  ]
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', gap: '2rem', position: 'relative', zIndex: 1 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', lineHeight: 1, marginBottom: '.5rem' }}>🔥</div>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 'clamp(3rem,12vw,6rem)', letterSpacing: '.05em', lineHeight: .9, background: 'linear-gradient(135deg,#fff 0%,#f97316 55%,#ef4444 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>MOOD ROAST</div>
      </div>
      <div style={{ width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
        {LANGS.map(l => (
          <button key={l.id} onClick={() => onSelect(l.id)}
            style={{ background: '#111', border: '1px solid #2a2a2a', color: '#f5f5f5', padding: '1rem', borderRadius: 14, cursor: 'pointer', fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.75rem', transition: 'border-color .15s, color .15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#f97316'; e.currentTarget.style.color = '#f97316' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = '#f5f5f5' }}>
            <span style={{ fontSize: '1.5rem' }}>{l.flag}</span>{l.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function BattleChat({ persona, kidGender, style, lang, initialRoast, t, onExit }) {
  const [hist, setHist] = useState([{ r: 'a', text: initialRoast }])
  const [inp, setInp] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [hist, loading])

  const send = async () => {
    if (!inp.trim() || loading) return
    const msg = inp.trim(); setInp('')
    const nh = [...hist, { r: 'u', text: msg }]
    setHist(nh); setLoading(true)
    try {
      const raw = await callClaude(buildChatPrompt(persona, kidGender, style, lang), nh.map(m => ({ role: m.r === 'a' ? 'assistant' : 'user', content: m.text })), 400)
      setHist(h => [...h, { r: 'a', text: raw.trim() || '💀' }])
    } catch { setHist(h => [...h, { r: 'a', text: t.froze }]) }
    finally { setLoading(false) }
  }

  return (
    <div style={{ width: '100%', maxWidth: 480, background: '#0e0e0e', border: '1px solid #1f1f1f', borderRadius: 16, overflow: 'hidden' }}>
      <div style={{ background: 'linear-gradient(135deg,#1a0a2e,#120820)', borderBottom: '1px solid #2d1a4a', padding: '.8rem 1rem', display: 'flex', alignItems: 'center', gap: '.5rem' }}>
        <span style={{ fontSize: '1.2rem' }}>🥊</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: '1rem', color: '#a78bfa', letterSpacing: '.08em' }}>{t.roastBattleTitle}</div>
          <div style={{ fontSize: '.62rem', color: '#6b7280' }}>{t.roastBattleSub}</div>
        </div>
        <button onClick={onExit} style={{ background: 'transparent', border: '1px solid #2a2a2a', color: '#6b7280', padding: '.25rem .55rem', borderRadius: 6, cursor: 'pointer', fontSize: '.75rem' }}>✕</button>
      </div>
      <div style={{ padding: '.75rem', maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
        {hist.map((m, i) => (
          <div key={i} style={{ maxWidth: '87%', padding: '.6rem .85rem', borderRadius: m.r === 'a' ? '12px 12px 12px 3px' : '12px 12px 3px 12px', background: m.r === 'a' ? 'linear-gradient(135deg,#1a0f2a,#1f1020)' : 'linear-gradient(135deg,#1a0a0a,#2a1010)', border: `1px solid ${m.r === 'a' ? '#3d1a5a' : '#5a1a1a'}`, color: m.r === 'a' ? '#e5e7eb' : '#fde8d8', fontSize: '.87rem', lineHeight: 1.7, whiteSpace: 'pre-wrap', alignSelf: m.r === 'a' ? 'flex-start' : 'flex-end' }}>
            <div style={{ fontSize: '.6rem', fontWeight: 700, marginBottom: '.2rem', color: m.r === 'a' ? '#a78bfa' : '#f97316' }}>{m.r === 'a' ? t.roastMaster : t.you}</div>
            {m.text}
          </div>
        ))}
        {loading && (
          <div style={{ maxWidth: '87%', padding: '.6rem .85rem', borderRadius: '12px 12px 12px 3px', background: 'linear-gradient(135deg,#1a0f2a,#1f1020)', border: '1px solid #3d1a5a', alignSelf: 'flex-start' }}>
            <div style={{ fontSize: '.6rem', fontWeight: 700, marginBottom: '.25rem', color: '#a78bfa' }}>{t.roastMaster}</div>
            <div style={{ display: 'flex', gap: 4 }}>
              {[1,2,3].map(n => <div key={n} className={`d${n}`} style={{ width: 6, height: 6, background: '#a78bfa', borderRadius: '50%' }} />)}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div style={{ padding: '.6rem', borderTop: '1px solid #1a1a1a', display: 'flex', gap: '.4rem', alignItems: 'flex-end' }}>
        <textarea style={{ ...C.ta, flex: 1, resize: 'none' }} rows={2} placeholder={t.replyPlaceholder}
          value={inp} onChange={e => setInp(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }} />
        <button onClick={send} disabled={loading || !inp.trim()}
          style={{ background: inp.trim() && !loading ? 'linear-gradient(135deg,#f97316,#ef4444)' : '#1f1f1f', border: 'none', color: inp.trim() && !loading ? 'white' : '#444', padding: '.65rem .9rem', borderRadius: 10, cursor: inp.trim() && !loading ? 'pointer' : 'not-allowed', fontSize: '1rem', flexShrink: 0 }}>🔥</button>
      </div>
    </div>
  )
}

function FriendRoom({ myResult, t, onClose }) {
  const [mode, setMode] = useState('menu')
  const [code, setCode] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [room, setRoom] = useState(null)
  const [myEntry, setMyEntry] = useState(null)
  const [error, setError] = useState('')
  const [voted, setVoted] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const pollRef = useRef(null)
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current) }, [])

  const startPoll = (c) => {
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(() => { const r = loadRoom(c); if (r) setRoom({ ...r }) }, 2000)
  }
  const createRoom = () => {
    if (!nameInput.trim()) { setError(t.enterName); return }
    const nc = genCode()
    const entry = { name: nameInput.trim(), result: myResult, votes: 0, id: Date.now() }
    const nr = { code: nc, entries: [entry] }
    saveRoom(nr); setCode(nc); setRoom(nr); setMyEntry(entry); setMode('room'); startPoll(nc)
  }
  const joinRoom = () => {
    if (!nameInput.trim()) { setError(t.enterName); return }
    const c = joinCode.trim().toUpperCase()
    const ex = loadRoom(c)
    if (!ex) { setError(t.roomNotFound); return }
    const entry = { name: nameInput.trim(), result: myResult, votes: 0, id: Date.now() }
    ex.entries.push(entry); saveRoom(ex); setCode(c); setRoom(ex); setMyEntry(entry); setMode('room'); startPoll(c)
  }
  const vote = (id) => {
    if (voted) return
    const r = loadRoom(code); if (!r) return
    r.entries = r.entries.map(e => e.id === id ? { ...e, votes: (e.votes || 0) + 1 } : e)
    saveRoom(r); setRoom({ ...r }); setVoted(true)
  }
  const winner = room?.entries?.length ? [...room.entries].sort((a, b) => (b.votes || 0) - (a.votes || 0))[0] : null

  if (mode === 'menu') return (
    <div style={C.card}>
      <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
        <div style={{ fontSize: '2rem' }}>🏆</div>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: '1.6rem', color: '#f97316', marginTop: '.2rem' }}>ROAST BATTLE</div>
        <div style={{ color: '#6b7280', fontSize: '.72rem', marginTop: '.2rem' }}>{t.competeSub}</div>
      </div>
      <span style={C.lbl}>{t.yourName}</span>
      <input value={nameInput} onChange={e => setNameInput(e.target.value)} placeholder={t.namePlaceholder}
        style={{ ...C.ta, padding: '.65rem .85rem', marginBottom: '.75rem' }} />
      {error && <div style={{ color: '#ef4444', fontSize: '.75rem', marginBottom: '.5rem' }}>{error}</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
        <button style={C.rbtn(true)} onClick={() => { setError(''); setMode('create') }}>{t.createRoom}</button>
        <button style={C.teal} onClick={() => { setError(''); setMode('join') }}>{t.joinRoom}</button>
        <button style={C.sbtn} onClick={onClose}>{t.back}</button>
      </div>
    </div>
  )
  if (mode === 'create') return (
    <div style={C.card}>
      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: '1.4rem', color: '#f97316' }}>{t.createTitle}</div>
        <div style={{ color: '#6b7280', fontSize: '.72rem' }}>{t.createSub}</div>
      </div>
      <span style={C.lbl}>{t.yourName}</span>
      <input value={nameInput} onChange={e => setNameInput(e.target.value)} placeholder={t.namePlaceholder}
        style={{ ...C.ta, padding: '.65rem .85rem', marginBottom: '.75rem' }} />
      <div style={{ background: '#141414', borderRadius: 10, padding: '.8rem', marginBottom: '1rem', border: '1px solid #2a2a2a' }}>
        <div style={{ color: '#6b7280', fontSize: '.67rem', marginBottom: '.2rem' }}>{t.yourRoast}</div>
        <div style={{ color: '#f97316', fontWeight: 700 }}>{myResult.mood_emoji} {myResult.mood_name}</div>
        <div style={{ color: '#6b7280', fontSize: '.72rem', marginTop: '.15rem' }}>{t.chaos} {myResult.vibe_score}/10</div>
      </div>
      {error && <div style={{ color: '#ef4444', fontSize: '.75rem', marginBottom: '.5rem' }}>{error}</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
        <button style={C.rbtn(true)} onClick={createRoom}>{t.createBtn}</button>
        <button style={C.sbtn} onClick={() => setMode('menu')}>{t.back}</button>
      </div>
    </div>
  )
  if (mode === 'join') return (
    <div style={C.card}>
      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: '1.4rem', color: '#0891b2' }}>{t.joinTitle}</div>
      </div>
      <span style={C.lbl}>{t.yourName}</span>
      <input value={nameInput} onChange={e => setNameInput(e.target.value)} placeholder={t.namePlaceholder}
        style={{ ...C.ta, padding: '.65rem .85rem', marginBottom: '.75rem' }} />
      <span style={C.lbl}>{t.roomCode}</span>
      <input value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} placeholder={t.codePlaceholder}
        style={{ ...C.ta, padding: '.65rem .85rem', textTransform: 'uppercase', letterSpacing: '.15em', fontSize: '1.1rem', fontWeight: 700, marginBottom: '.75rem' }} />
      {error && <div style={{ color: '#ef4444', fontSize: '.75rem', marginBottom: '.5rem' }}>{error}</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
        <button style={C.teal} onClick={joinRoom}>{t.joinBtn}</button>
        <button style={C.sbtn} onClick={() => setMode('menu')}>{t.back}</button>
      </div>
    </div>
  )
  return (
    <div style={{ width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
      <div style={{ background: 'linear-gradient(135deg,#141414,#1a0f0a)', border: '1px solid #2d1a0a', borderRadius: 16, padding: '1rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,#f97316,#ef4444,transparent)' }} />
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: '1.8rem', color: '#f97316' }}>{t.roomTitle}</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.75rem', marginTop: '.4rem' }}>
          <div style={{ background: '#1f1f1f', borderRadius: 8, padding: '.4rem .9rem', border: '1px solid #2a2a2a' }}>
            <div style={{ color: '#6b7280', fontSize: '.58rem', letterSpacing: '.12em', textTransform: 'uppercase' }}>{t.codeLabel}</div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: '1.6rem', color: '#f97316', letterSpacing: '.15em' }}>{code}</div>
          </div>
          <button onClick={() => navigator.clipboard.writeText(code)} style={C.sbtn}>{t.invite}</button>
        </div>
        <div style={{ color: '#6b7280', fontSize: '.68rem', marginTop: '.4rem' }}>{room?.entries?.length || 0} {t.participants}</div>
      </div>
      {room?.entries?.map(entry => {
        const isMe = myEntry && entry.id === myEntry.id
        const isWin = winner && entry.id === winner.id && entry.votes > 0
        const bc = entry.result.vibe_score >= 7 ? '#ef4444' : entry.result.vibe_score >= 4 ? '#facc15' : '#4ade80'
        return (
          <div key={entry.id} style={{ background: isWin ? 'linear-gradient(135deg,#1a1200,#1f1500)' : '#111', border: `1px solid ${isWin ? '#f59e0b' : isMe ? '#f97316' : '#1f1f1f'}`, borderRadius: 14, padding: '1rem', position: 'relative', overflow: 'hidden' }}>
            {isWin && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,#f59e0b,transparent)' }} />}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                <span style={{ fontSize: '1.3rem' }}>{entry.result.mood_emoji}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '.88rem', color: isMe ? '#f97316' : '#f5f5f5' }}>{entry.name} {isMe ? '(me)' : ''} {isWin ? '👑' : ''}</div>
                  <div style={{ color: '#6b7280', fontSize: '.68rem' }}>{entry.result.mood_name}</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: '1.4rem', color: isWin ? '#f59e0b' : '#f97316' }}>{entry.votes || 0}</div>
                <div style={{ color: '#6b7280', fontSize: '.6rem' }}>{t.votes}</div>
              </div>
            </div>
            <div style={{ color: '#9ca3af', fontSize: '.8rem', lineHeight: 1.65, marginBottom: '.4rem', whiteSpace: 'pre-wrap' }}>{entry.result.roast}</div>
            <div style={{ color: '#6b7280', fontSize: '.7rem', fontStyle: 'italic', marginBottom: '.5rem' }}>"{entry.result.savage_closer}"</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '.65rem', color: '#6b7280' }}>Chaos: <span style={{ color: bc, fontWeight: 700 }}>{entry.result.vibe_score}/10</span></div>
              {!isMe && !voted && <button onClick={() => vote(entry.id)} style={{ background: 'linear-gradient(135deg,#f97316,#ef4444)', color: 'white', border: 'none', padding: '.3rem .8rem', borderRadius: 7, cursor: 'pointer', fontSize: '.75rem', fontWeight: 700 }}>{t.voteBtn}</button>}
              {voted && !isMe && <span style={{ color: '#374151', fontSize: '.68rem' }}>{t.alreadyVoted}</span>}
              {isMe && <span style={{ color: '#f97316', fontSize: '.7rem' }}>{t.itsYou}</span>}
            </div>
          </div>
        )
      })}
      <button onClick={onClose} style={{ ...C.sbtn, width: '100%', textAlign: 'center' }}>{t.exitRoom}</button>
    </div>
  )
}

export default function App() {
  const [lang, setLang] = useState(null)
  const [text, setText] = useState('')
  const [persona, setPersona] = useState(null)
  const [kidGender, setKidGender] = useState(null)
  const [ageGroup, setAgeGroup] = useState(2)
  const [intensity, setIntensity] = useState(1)
  const [style, setStyle] = useState('classic')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [screen, setScreen] = useState('main')
  const [flames, setFlames] = useState([])
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setFlames(Array.from({ length: 7 }, (_, i) => ({ id: i, left: `${8 + i * 13}%`, delay: `${i * 0.7}s`, size: `${1.2 + (i % 3) * 0.7}rem` })))
  }, [])

  if (!lang) return (
    <>
      {flames.map(f => <div key={f.id} className="flame" style={{ left: f.left, animationDelay: f.delay, fontSize: f.size }}>🔥</div>)}
      <LangScreen onSelect={setLang} />
    </>
  )

  const t = T[lang]
  const PERSONAS = [{ id: 'girl', e: '👩', l: t.girl }, { id: 'guy', e: '👦', l: t.guy }, { id: 'kid', e: '🧒', l: t.kid }]
  const KIDS = [{ id: 'boy', e: '👦', l: t.boy }, { id: 'girl', e: '👧', l: t.kidgirl }]
  const needsKid = persona === 'kid' && !kidGender
  const canRoast = !!(text.trim() && persona && !needsKid)

  const doRoast = async () => {
    if (!canRoast || loading) return
    setLoading(true); setResult(null); setError(''); setScreen('main')
    try {
      const raw = await callClaude(buildSysPrompt(persona, kidGender, ageGroup, intensity, style, lang), [{ role: 'user', content: text }])
      setResult(JSON.parse(raw.replace(/```json|```/g, '').trim()))
    } catch { setError(t.error) }
    finally { setLoading(false) }
  }

  const reset = () => { setResult(null); setText(''); setScreen('main') }
  const copy = () => {
    navigator.clipboard.writeText(`🔥 MOOD ROAST 🔥\n\n${result.mood_emoji} ${result.mood_name}\n\n${result.roast}\n\n${result.savage_closer}`)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      {flames.map(f => <div key={f.id} className="flame" style={{ left: f.left, animationDelay: f.delay, fontSize: f.size }}>🔥</div>)}
      <div style={{ minHeight: '100vh', padding: '1.5rem 1rem 5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.85rem', position: 'relative', zIndex: 1 }}>

        <div style={{ width: '100%', maxWidth: 480, display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={() => { setLang(null); setResult(null); setScreen('main') }}
            style={{ background: 'transparent', border: '1px solid #2a2a2a', color: '#6b7280', padding: '.3rem .75rem', borderRadius: 7, cursor: 'pointer', fontSize: '.75rem', fontWeight: 700 }}>
            {t.changeLang}
          </button>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.8rem', lineHeight: 1, marginBottom: '.3rem' }}>🔥</div>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 'clamp(2.8rem,10vw,5rem)', letterSpacing: '.05em', lineHeight: .9, background: 'linear-gradient(135deg,#fff 0%,#f97316 55%,#ef4444 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{t.title}</div>
          <div style={{ color: '#6b7280', fontSize: '.75rem', marginTop: '.35rem', letterSpacing: '.1em', textTransform: 'uppercase' }}>{t.sub}</div>
        </div>

        {screen === 'main' && !result && (
          <div style={C.card}>
            <span style={C.lbl}>{t.whoAreYou}</span>
            <div style={{ display: 'flex', gap: '.5rem', marginBottom: persona === 'kid' ? '.75rem' : '1rem' }}>
              {PERSONAS.map(p => (
                <button key={p.id} style={C.pb(persona === p.id)} onClick={() => { setPersona(p.id); if (p.id !== 'kid') setKidGender(null) }}>
                  <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>{p.e}</span>{p.l}
                </button>
              ))}
            </div>
            {persona === 'kid' && (
              <div style={{ background: 'rgba(249,115,22,.05)', border: '1px solid rgba(249,115,22,.2)', borderRadius: 10, padding: '.75rem', marginBottom: '1rem' }}>
                <div style={{ color: '#f97316', fontSize: '.68rem', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '.4rem' }}>{t.boyOrGirl}</div>
                <div style={{ display: 'flex', gap: '.5rem' }}>
                  {KIDS.map(g => (
                    <button key={g.id} style={C.pb(kidGender === g.id)} onClick={() => setKidGender(g.id)}>
                      <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>{g.e}</span>{g.l}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <span style={C.lbl}>{t.ageGroup}</span>
            <div style={{ display: 'flex', gap: '.4rem', marginBottom: '1rem' }}>
              {t.ages.map((a, i) => <button key={i} style={C.seg(ageGroup === i)} onClick={() => setAgeGroup(i)}>{a}</button>)}
            </div>
            <span style={C.lbl}>{t.intensity}</span>
            <div style={{ display: 'flex', gap: '.4rem', marginBottom: '1rem' }}>
              {t.intensityLevels.map((lv, i) => <button key={i} style={C.seg(intensity === i)} onClick={() => setIntensity(i)}>{lv}</button>)}
            </div>
            <span style={C.lbl}>{t.roastStyle}</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.4rem', marginBottom: '1rem' }}>
              {t.styles.map(s => (
                <button key={s.id} style={{ ...C.seg(style === s.id), flex: 'none' }} onClick={() => setStyle(s.id)}>{s.label}</button>
              ))}
            </div>
            <span style={C.lbl}>{t.howFeel}</span>
            <textarea style={C.ta} rows={4} placeholder={t.placeholder}
              value={text} onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && e.ctrlKey && doRoast()}
              onFocus={e => { e.target.style.borderColor = '#f97316' }}
              onBlur={e => { e.target.style.borderColor = '#2a2a2a' }} />
            <div style={{ fontSize: '.65rem', color: '#374151', textAlign: 'right', margin: '.25rem 0 .75rem' }}>{t.hint}</div>
            <button style={C.rbtn(canRoast && !loading)} onClick={doRoast} disabled={loading || !canRoast}>
              {loading ? t.roasting : needsKid ? t.chooseMF : t.roastBtn}
            </button>
          </div>
        )}

        {error && <div style={{ color: '#ef4444', fontSize: '.85rem', textAlign: 'center', maxWidth: 480 }}>{error}</div>}

        {result && screen === 'main' && (
          <div style={{ width: '100%', maxWidth: 480, background: 'linear-gradient(135deg,#141414,#1a0f0a)', border: '1px solid #2d1a0a', borderRadius: 16, padding: '1.25rem', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,#f97316,#ef4444,transparent)' }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '.5rem' }}>
              <span style={{ background: 'rgba(249,115,22,.15)', border: '1px solid rgba(249,115,22,.3)', color: '#f97316', fontSize: '.63rem', fontWeight: 700, padding: '.2rem .6rem', borderRadius: 6 }}>
                {t.styles.find(s => s.id === style)?.label}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '1rem' }}>
              <div style={{ fontSize: '2.3rem', filter: 'drop-shadow(0 0 8px rgba(249,115,22,.5))' }}>{result.mood_emoji}</div>
              <div>
                <div style={{ color: '#6b7280', fontSize: '.62rem', fontWeight: 700, letterSpacing: '.2em', textTransform: 'uppercase' }}>{t.diagnosis}</div>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: '1.3rem', color: '#f97316', letterSpacing: '.05em', lineHeight: 1.1 }}>{result.mood_name}</div>
              </div>
            </div>
            <div style={{ color: '#e5e7eb', fontSize: '.93rem', lineHeight: 1.8, marginBottom: '1rem', whiteSpace: 'pre-wrap' }}>{result.roast}</div>
            <div style={{ borderLeft: '3px solid #f97316', paddingLeft: '.85rem', color: '#f9a26c', fontStyle: 'italic', fontSize: '.88rem', lineHeight: 1.6, marginBottom: '1rem' }}>{result.savage_closer}</div>
            <VibeBar score={result.vibe_score} label={t.chaosLevel} />
            <div style={{ display: 'flex', gap: '.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
              <button style={C.sbtn} onClick={copy}>{copied ? t.copied : t.copy}</button>
              <button style={C.sbtn} onClick={reset}>{t.again}</button>
            </div>
            <button onClick={() => setScreen('battle')} style={{ ...C.purple, marginTop: '.85rem' }}>{t.battle}</button>
            <div style={{ color: '#374151', fontSize: '.63rem', textAlign: 'center', marginTop: '.2rem' }}>{t.battleSub}</div>
            <button onClick={() => setScreen('room')} style={{ ...C.teal, marginTop: '.5rem' }}>{t.compete}</button>
            <div style={{ color: '#374151', fontSize: '.63rem', textAlign: 'center', marginTop: '.2rem' }}>{t.competeSub}</div>
          </div>
        )}

        {screen === 'battle' && result && (
          <BattleChat persona={persona} kidGender={kidGender} style={style} lang={lang}
            initialRoast={`${result.roast}\n\n${result.savage_closer}`}
            t={t} onExit={() => setScreen('main')} />
        )}
        {screen === 'room' && result && (
          <FriendRoom myResult={result} t={t} onClose={() => setScreen('main')} />
        )}

        <div style={{ color: '#374151', fontSize: '.68rem', letterSpacing: '.1em' }}>{t.footer}</div>
      </div>
    </>
  )
}
