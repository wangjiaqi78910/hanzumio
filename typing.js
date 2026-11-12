// 汉字打字练习：看释义，按词写出拼音或汉字。
// 题目按级别从 typing-data/hsk*.js 按需加载（由 tools/typing-data 里的脚本从 HSK 词表生成）。
(() => {
  'use strict';

  const LEVELS = ['1', '2', '3', '4', '5', '6', '7-9'];
  const STORE_KEY = 'hanzumio-typing-v3';
  const DATA = window.HANZUMIO_TYPING_LEVELS = window.HANZUMIO_TYPING_LEVELS || {};
  const HAN = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/;

  // ---------- 界面文字 ----------
  const STR = {
    zh: {
      title: '汉字打字', mode: '输入方式', modePy: '拼音', modeHz: '汉字', settings: '设置',
      count: '第 {n} 题 / 共 {t} 题', prevLine: '上一题',
      statOk: '已答对', statBad: '已答错', statAcc: '正确率',
      prevQ: '上一题', reveal: '看答案', submit: '提交', next: '下一题', skip: '跳过', retry: '再练一遍',
      typeFirst: '先写答案再提交。',
      allRight: '全对！', summary: '{n} 个词对了 {ok} 个', sumTone: '声调不对 {k} 个', sumBad: '写错或没写 {k} 个',
      imeHint: '汉字模式要用中文输入法打字；没有输入法的话，可以换成拼音模式。',
      pyImeHint: '拼音模式请用英文键盘，不要用中文输入法选字。',
      slotPy: '第 {i} 个词，{n} 个音节', slotHz: '第 {i} 个词，{n} 个字',
      stOk: '正确', stTone: '声调不对', stBad: '写错了', stEmpty: '没写', stShown: '看了答案',
      done: 'HSK {lv} 这一级练完了！', doneSum: '答对 {ok} 题，答错 {bad} 题。', noWrong: 'HSK {lv} 还没有错题。',
      restart: '从头再来', practiceWrong: '练错题', showAll: '练全部', retryLoad: '重新加载',
      level: '级别', onlyWrong: '只练错题', shuffle: '打乱顺序', tones: '声调（拼音模式）', toneReq: '必须写（用数字标调，如 ni3）', toneOpt: '可以不写（像输入法一样只打字母）',
      hint: '提示', hintNone: '不提示', hintCross: '在空格上方提示（拼音模式显示汉字，汉字模式显示拼音）', hintCards: '显示词卡（词性、拼音、释义）',
      meaning: '释义语言', reset: '清空记录', resetAsk: '清空这个浏览器里的打字练习记录？', close: '完成',
      helpTitle: '怎么输入', note: '练习记录只保存在这个浏览器里，不会上传。',
      loading: '正在加载 HSK {lv} 的题目…', loadError: 'HSK {lv} 的题目加载失败，请检查网络后重试。', focusWord: '本题词',
      play: '朗读', autoPlay: '题目出现时自动朗读（有录音的句子）',
      help: [
        '每道题是一句话：看它的意思，按词把中文写出来。句子来自 HSK 词汇的例句和一问一答，问句和答句是前后两道题，顶上的「上一题」就是它的上文。有录音的句子会自动朗读，按 Ctrl 或喇叭按钮可以重听。标点和数字已经填好，不用打。',
        '拼音模式：像输入法一样只打字母就行，可以连着打（woshixuesheng），字母会自动分到后面的空格里，按空格也能跳到下一个词；在最后一个词按空格或回车提交。想练声调可以用数字标调，打 ni3 会变成 nǐ，轻声不用标；ü 用 v 打，lv4 会变成 lǜ；儿化 nar、naer、nar3 都行。提交后每个词下面会显示带声调的拼音。',
        '汉字模式：用电脑或手机自带的中文输入法。输入法选字时按的空格和回车留给输入法，不会跳词。一次打出好几个词也可以，多出来的字会自动排到后面的空格里。',
        '绿色是对的，黄色是拼音对了但声调不对，红色是写错或没写。按 Esc 可以看当前这个词的答案，提交后点「再练一遍」只重写错的词。觉得难可以在设置里打开提示或词卡。',
      ],
    },
    en: {
      title: 'Chinese Typing', mode: 'Input', modePy: 'Pinyin', modeHz: 'Hanzi', settings: 'Settings',
      count: 'Question {n} of {t}', prevLine: 'Previous',
      statOk: 'Correct', statBad: 'Wrong', statAcc: 'Accuracy',
      prevQ: 'Back', reveal: 'Show word', submit: 'Check', next: 'Next', skip: 'Skip', retry: 'Try again',
      typeFirst: 'Type an answer before checking.',
      allRight: 'All correct!', summary: '{ok} of {n} words right', sumTone: '{k} with the wrong tone', sumBad: '{k} wrong or blank',
      imeHint: 'Hanzi mode needs a Chinese input method. If you do not have one, switch to Pinyin mode.',
      pyImeHint: 'In Pinyin mode, type with a Latin keyboard rather than a Chinese input method.',
      slotPy: 'Word {i}, {n} syllables', slotHz: 'Word {i}, {n} characters',
      stOk: 'correct', stTone: 'wrong tone', stBad: 'wrong', stEmpty: 'blank', stShown: 'answer shown',
      done: 'You have finished HSK {lv}!', doneSum: '{ok} right, {bad} wrong.', noWrong: 'No mistakes in HSK {lv} to practise yet.',
      restart: 'Start again', practiceWrong: 'Practise mistakes', showAll: 'Practise all', retryLoad: 'Reload',
      level: 'Level', onlyWrong: 'Mistakes only', shuffle: 'Shuffle', tones: 'Tones (Pinyin mode)', toneReq: 'Required (type tone numbers, e.g. ni3)', toneOpt: 'Optional (letters only, like an input method)',
      hint: 'Hints', hintNone: 'None', hintCross: 'Above each blank (characters in Pinyin mode, pinyin in Hanzi mode)', hintCards: 'Word cards (part of speech, pinyin, meaning)',
      meaning: 'Meaning in', reset: 'Clear progress', resetAsk: 'Clear your typing progress in this browser?', close: 'Done',
      helpTitle: 'How to type', note: 'Your progress is kept only in this browser and is never uploaded.',
      loading: 'Loading HSK {lv}…', loadError: 'Could not load HSK {lv}. Check your connection and try again.', focusWord: 'Word',
      play: 'Listen', autoPlay: 'Play the recording when a question appears (sentences that have one)',
      help: [
        'Each question is one sentence: read its meaning and type the Chinese word by word. The sentences come from HSK vocabulary examples and short Q&As; a question and its answer are two consecutive items, and the “Previous” line at the top gives you the context. Sentences with a recording play automatically; press Ctrl or the speaker button to hear it again. Punctuation and numbers are filled in for you.',
        'Pinyin mode: just type the letters, like in a Chinese input method. You can type straight through (woshixuesheng) and the letters flow into the next blanks, or press Space to move to the next word; on the last word, Space or Enter checks the answer. To practise tones, type them as numbers — ni3 becomes nǐ, neutral tones stay bare; type ü as v (lv4 → lǜ); erhua as nar, naer or nar3. After checking, the pinyin with tone marks is shown under every word.',
        'Hanzi mode: use the Chinese input method on your computer or phone. Space and Enter pressed while picking characters stay with the input method and never skip a word. You can type several words at once; extra characters flow into the next blanks.',
        'Green is right, amber means the pinyin is right but the tone is not, red is wrong or blank. Press Esc to see the answer for the current word. After checking, “Try again” clears only the words you missed. If it is too hard, turn on hints or word cards in Settings.',
      ],
    },
    ko: {
      title: '중국어 타자', mode: '입력 방식', modePy: '병음', modeHz: '한자', settings: '설정',
      count: '{t}문제 중 {n}번째', prevLine: '이전 문제',
      statOk: '맞힘', statBad: '틀림', statAcc: '정답률',
      prevQ: '이전 문제', reveal: '답 보기', submit: '제출', next: '다음 문제', skip: '건너뛰기', retry: '다시 하기',
      typeFirst: '답을 입력한 뒤에 제출하세요.',
      allRight: '모두 정답!', summary: '{n}개 단어 중 {ok}개 정답', sumTone: '성조 오류 {k}개', sumBad: '오답·미입력 {k}개',
      imeHint: '한자 모드는 중국어 입력기로 입력해야 해요. 입력기가 없으면 병음 모드로 바꾸세요.',
      pyImeHint: '병음 모드에서는 중국어 입력기 대신 영문 자판으로 입력하세요.',
      slotPy: '{i}번째 단어, {n}음절', slotHz: '{i}번째 단어, {n}글자',
      stOk: '정답', stTone: '성조 오류', stBad: '오답', stEmpty: '미입력', stShown: '답 확인',
      done: 'HSK {lv}을(를) 다 풀었어요!', doneSum: '{ok}문제 맞히고 {bad}문제 틀렸어요.', noWrong: 'HSK {lv}에는 아직 틀린 문제가 없어요.',
      restart: '처음부터', practiceWrong: '틀린 문제 풀기', showAll: '전체 풀기', retryLoad: '다시 불러오기',
      level: '급수', onlyWrong: '틀린 문제만', shuffle: '순서 섞기', tones: '성조 (병음 모드)', toneReq: '반드시 입력 (숫자로 표시, 예: ni3)', toneOpt: '생략 가능 (입력기처럼 글자만 입력)',
      hint: '힌트', hintNone: '없음', hintCross: '빈칸 위에 표시 (병음 모드는 한자, 한자 모드는 병음)', hintCards: '단어 카드 (품사, 병음, 뜻)',
      meaning: '뜻 언어', reset: '기록 지우기', resetAsk: '이 브라우저에 저장된 타자 연습 기록을 지울까요?', close: '완료',
      helpTitle: '입력 방법', note: '연습 기록은 이 브라우저에만 저장되며 업로드되지 않아요.',
      loading: 'HSK {lv} 문제를 불러오는 중…', loadError: 'HSK {lv} 문제를 불러오지 못했어요. 연결을 확인하고 다시 시도하세요.', focusWord: '단어',
      play: '듣기', autoPlay: '문제가 나오면 자동으로 녹음 재생 (녹음이 있는 문장)',
      help: [
        '한 문제는 한 문장이에요. 뜻을 보고 중국어를 단어별로 입력하세요. 문장은 HSK 단어의 예문과 짧은 문답에서 가져왔고, 질문과 대답은 앞뒤 두 문제로 나와요. 맨 위의 ‘이전 문제’ 줄이 바로 앞 문맥이에요. 녹음이 있는 문장은 자동으로 재생되고, Ctrl이나 스피커 버튼으로 다시 들을 수 있어요. 문장 부호와 숫자는 미리 채워져 있어요.',
        '병음 모드: 중국어 입력기처럼 알파벳만 입력하면 돼요. 이어서 쳐도(woshixuesheng) 글자가 다음 빈칸으로 자동으로 넘어가고, 스페이스로 다음 단어로 갈 수도 있어요. 마지막 단어에서 스페이스나 엔터를 누르면 제출돼요. 성조를 연습하려면 숫자로 입력하세요. ni3을 치면 nǐ로 바뀌고, 경성은 숫자를 붙이지 않아요. ü는 v로 입력해요(lv4 → lǜ). 얼화는 nar, naer, nar3 모두 돼요. 제출하면 단어마다 성조가 표시된 병음이 보여요.',
        '한자 모드: 컴퓨터나 휴대폰의 중국어 입력기를 쓰세요. 글자를 고를 때 누르는 스페이스와 엔터는 입력기가 처리하므로 단어를 건너뛰지 않아요. 여러 단어를 한 번에 입력해도 남는 글자는 다음 빈칸으로 넘어가요.',
        '초록색은 정답, 노란색은 병음은 맞지만 성조가 틀린 것, 빨간색은 틀렸거나 비워 둔 단어예요. Esc를 누르면 지금 단어의 답을 볼 수 있어요. 제출한 뒤 ‘다시 하기’를 누르면 틀린 단어만 다시 써요. 어려우면 설정에서 힌트나 단어 카드를 켜 보세요.',
      ],
    },
  };
  const POS = {
    n: ['名词', 'noun', '명사'], v: ['动词', 'verb', '동사'], a: ['形容词', 'adj.', '형용사'], d: ['副词', 'adv.', '부사'],
    r: ['代词', 'pron.', '대명사'], m: ['数词', 'number', '수사'], q: ['量词', 'measure', '양사'], p: ['介词', 'prep.', '개사'],
    c: ['连词', 'conj.', '접속사'], u: ['助词', 'particle', '조사'], mv: ['能愿动词', 'modal', '조동사'], i: ['叹词', 'interj.', '감탄사'],
    o: ['拟声词', 'onomat.', '의성어'], af: ['词缀', 'affix', '접사'], ci: ['成语', 'idiom', '성어'], x: ['短语', 'phrase', '표현'],
  };
  const UI_TAG = { zh: 'zh-Hans', en: 'en', ko: 'ko' };
  const UI_IDX = { zh: 0, en: 1, ko: 2 };
  const PY_TAG = 'zh-Latn-pinyin';

  // ---------- 拼音工具 ----------
  const TONE_MARKS = {
    a: 'āáǎà', e: 'ēéěè', i: 'īíǐì', o: 'ōóǒò', u: 'ūúǔù', 'ü': 'ǖǘǚǜ',
    A: 'ĀÁǍÀ', E: 'ĒÉĚÈ', I: 'ĪÍǏÌ', O: 'ŌÓǑÒ', U: 'ŪÚǓÙ', 'Ü': 'ǕǗǙǛ',
  };
  const MARK_INFO = {}; // 带调字母 → [不带调字母, 声调]
  for (const base in TONE_MARKS) [...TONE_MARKS[base]].forEach((ch, k) => { MARK_INFO[ch] = [base, k + 1]; });
  const LETTERS = 'a-zA-ZüÜ' + Object.keys(MARK_INFO).join('');
  const RUN_DIGIT = new RegExp(`([${LETTERS}]+)([0-5])`, 'g');
  // 一串字母末尾的那个音节（声母 + 韵腹 + 韵尾）
  const LAST_SYL = /(?:zh|ch|sh|[bpmfdtnlgkhjqxrzcsyw])?[aeiouü]+(?:ng|n|r)?$/;
  // 一、不、个 常见变调都算对
  const LENIENT = { '一': [1, 2, 4], '不': [2, 4], '个': [4, 5] };

  const stripMarks = s => [...s].map(ch => (MARK_INFO[ch] ? MARK_INFO[ch][0] : ch)).join('');
  const toneOf = syl => { for (const ch of syl) if (MARK_INFO[ch]) return MARK_INFO[ch][1]; return 5; };

  function markSyllable(syl, tone) {
    const base = stripMarks(syl);
    if (!(tone >= 1 && tone <= 4)) return base;
    const low = base.toLowerCase();
    let idx = low.search(/[ae]/);
    if (idx < 0) idx = low.indexOf('ou');
    if (idx < 0) for (let k = low.length - 1; k >= 0; k--) if ('iouü'.includes(low[k])) { idx = k; break; }
    if (idx < 0) return base;
    return base.slice(0, idx) + TONE_MARKS[base[idx]][tone - 1] + base.slice(idx + 1);
  }

  // 输入时把 ni3 变成 nǐ，v 变成 ü
  function liveConvert(str) {
    const s = str.replace(/u:/g, 'ü').replace(/U:/g, 'Ü').replace(/v/g, 'ü').replace(/V/g, 'Ü');
    return s.replace(RUN_DIGIT, (m, run, d) => {
      const hit = stripMarks(run).toLowerCase().match(LAST_SYL);
      if (!hit) return m;
      return run.slice(0, hit.index) + markSyllable(run.slice(hit.index), +d);
    });
  }

  function joinPinyin(sylls) {
    return sylls.map((s, k) => (k > 0 && /^[aeoāáǎàēéěèōóǒò]/i.test(s) ? "'" + s : s)).join('');
  }

  // 数据里的拼音按字用 - 隔开：xué-sheng；儿化的「儿」是 r
  function parseExpected(sylStr, hz) {
    const chars = [...hz];
    return sylStr.split('-').map((tok, k) => {
      const alts = tok.split('/');
      const acc = new Set(alts.map(toneOf));
      (LENIENT[chars[k]] || []).forEach(x => acc.add(x));
      const b = stripMarks(alts[0]).toLowerCase();
      return { b, t: toneOf(alts[0]), acc, disp: alts[0], er: b === 'r' };
    });
  }

  // 把用户输入拆成字母（附带声调符号）和数字
  function parseUser(str) {
    const out = [];
    const s = str.normalize('NFC').toLowerCase().replace(/u:/g, 'ü').replace(/v/g, 'ü');
    for (const ch of s) {
      if (/[\s'’‘`·-]/.test(ch)) continue;
      if (/[0-5]/.test(ch)) { out.push({ d: ch === '0' ? 5 : +ch }); continue; }
      const m = MARK_INFO[ch];
      out.push(m ? { c: m[0], t: m[1] } : { c: ch });
    }
    // j q x y 后面的 ü 写作 u
    for (let k = 1; k < out.length; k++) if (out[k].c === 'ü' && /^[jqxy]$/.test(out[k - 1].c || '')) out[k].c = 'u';
    return out;
  }

  // 按正确答案的音节逐个对齐；拼写对不上返回 null，否则返回每个音节写的声调（没写为 null）
  function alignPinyin(user, syl) {
    let i = 0;
    const tones = [];
    for (let k = 0; k < syl.length; k++) {
      const s = syl[k];
      let tone = null;
      if (s.er) {
        // 儿化：r、er 都行；后面的数字属于前一个音节（nar3）
        const u = user[i];
        if (u && u.c === 'e' && user[i + 1] && user[i + 1].c === 'r') i += 2;
        else if (u && u.c === 'r') i += 1;
        else return null;
        if (user[i] && user[i].d !== undefined) {
          if (k > 0 && tones[k - 1] == null) tones[k - 1] = user[i].d;
          i++;
        }
        tones.push(5);
        continue;
      }
      for (const letter of s.b) {
        const u = user[i];
        if (!u || u.d !== undefined || u.c !== letter) return null;
        if (u.t && tone == null) tone = u.t;
        i++;
      }
      if (user[i] && user[i].d !== undefined) { tone = user[i].d; i++; }
      tones.push(tone);
    }
    return i === user.length ? tones : null;
  }

  function gradePinyin(value, syl, toneReq) {
    const tones = alignPinyin(parseUser(value), syl);
    if (!tones) return 'wrong';
    const toneBad = tones.some((u, k) => {
      const s = syl[k];
      if (u == null) return toneReq && s.t !== 5 && !s.acc.has(5);
      return !s.acc.has(u);
    });
    return toneBad ? 'tone' : 'ok';
  }

  const cleanHz = v => v.normalize('NFC').replace(/[\s\p{P}\p{S}]/gu, '');
  const hasHan = v => HAN.test(v);

  // ---------- 题库 ----------
  function loadLevel(lv) {
    if (DATA[lv]) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = `typing-data/hsk${lv}.js`;
      s.async = true;
      s.onload = () => (DATA[lv] ? resolve() : reject(new Error('empty')));
      s.onerror = () => { s.remove(); reject(new Error('load')); };
      document.head.append(s);
    });
  }

  function makeWord(hz, sylStr, dict) {
    const syl = parseExpected(sylStr, hz);
    const e = dict[`${hz}|${sylStr.replace(/-/g, '').toLowerCase()}`] || dict[hz];
    return { hz, syl, py: joinPinyin(syl.map(x => x.disp)), pos: e ? e[1] : '', gloss: { en: e ? e[2] : '', ko: e ? e[3] : '' } };
  }

  function parseItem(raw, dict) {
    const [id, kind, head, lines] = raw;
    return {
      id, kind, head,
      lines: lines.map(([w, p, en, ko]) => {
        const toks = w.split(' ');
        const pys = p ? p.split(' ') : [];
        let pi = 0;
        const words = toks.map(tk => (HAN.test(tk) ? makeWord(tk, pys[pi++] || '', dict) : { fixed: tk }));
        return { words, en, ko, zh: toks.join('') };
      }),
    };
  }

  // ---------- 存储 ----------
  function load() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch (e) { return {}; }
  }
  function save() {
    try {
      if (queue[qi]) positions[settings.level] = keyOf(queue[qi]);
      localStorage.setItem(STORE_KEY, JSON.stringify({ settings, results, pos: positions, seeds }));
    } catch (e) { /* 浏览器不让存时照常练习 */ }
  }

  function defaults() {
    const nav = ((navigator.languages && navigator.languages[0]) || navigator.language || 'en').toLowerCase();
    const ui = nav.startsWith('ko') ? 'ko' : nav.startsWith('zh') ? 'zh' : 'en';
    return { ui, mean: ui === 'ko' ? 'ko' : 'en', mode: 'py', level: '1', onlyWrong: false, shuffle: false, toneReq: false, hint: 'cross', autoPlay: true };
  }
  function sanitize(s) {
    const d = defaults();
    const pick = (v, ok, dv) => (ok.includes(v) ? v : dv);
    return {
      ui: pick(s.ui, ['zh', 'en', 'ko'], d.ui),
      mean: pick(s.mean, ['en', 'ko'], d.mean),
      mode: pick(s.mode, ['py', 'hz'], d.mode),
      level: pick(s.level, LEVELS, d.level),
      onlyWrong: s.onlyWrong === true,
      shuffle: s.shuffle === true,
      toneReq: s.toneReq === true,
      hint: pick(s.hint, ['none', 'cross', 'cards'], d.hint),
      autoPlay: s.autoPlay !== false,
    };
  }

  // ---------- 状态 ----------
  const saved = load();
  const settings = sanitize(saved.settings || {});
  const results = saved.results && typeof saved.results === 'object' ? saved.results : {};
  const positions = saved.pos && typeof saved.pos === 'object' ? saved.pos : {};
  const seeds = saved.seeds && typeof saved.seeds === 'object' ? saved.seeds : {};
  let queue = [];
  let qi = 0;
  let state = 'loading'; // loading | error | typing | checked | done | empty
  let cur = null;
  let prev = null;
  let lastGrades = null;
  let loadSeq = 0;

  const $ = id => document.getElementById(id);
  const dlg = $('settings');
  const form = $('setForm');

  function t(key, vars) {
    let s = STR[settings.ui][key];
    if (s == null) s = STR.en[key];
    return vars ? s.replace(/\{(\w+)\}/g, (_, k) => vars[k]) : s;
  }
  function span(text, cls, lang) {
    const e = document.createElement('span');
    if (cls) e.className = cls;
    if (lang) e.lang = lang;
    e.textContent = text;
    return e;
  }
  function el(tag, cls) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    return e;
  }
  function meaningOf(line) {
    const other = settings.mean === 'en' ? 'ko' : 'en';
    if (line[settings.mean]) return [line[settings.mean], settings.mean];
    if (line[other]) return [line[other], other];
    return ['', ''];
  }

  function mulberry32(a) {
    return () => {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let x = Math.imul(a ^ (a >>> 15), 1 | a);
      x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
      return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    };
  }
  function shuffled(arr, seed) {
    const a = arr.slice();
    const rnd = mulberry32(seed);
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // ---------- 朗读 ----------
  // 录音放在 <AUDIO_BASE>hsk<级别>/<题目id>-<行号>.mp3；没有文件的句子不显示按钮。
  // 默认是仓库里的 audio/；录音放在别的服务器时，在 typing.html 里引入 typing.js 之前设置
  // window.HANZUMIO_AUDIO_BASE = 'https://example.com/hanzumio-audio/'
  const AUDIO_BASE = (typeof window.HANZUMIO_AUDIO_BASE === 'string' && window.HANZUMIO_AUDIO_BASE) || 'audio/';
  const audioMissing = new Set();
  function audioUrl(key) {
    const [id, li] = key.split(':');
    return `${AUDIO_BASE}hsk${settings.level}/${id}-${li}.mp3`;
  }
  function stopAudio() {
    if (cur && cur.audio) { cur.audio.pause(); cur.audio = null; }
  }
  function setupAudio(key, btn) {
    if (audioMissing.has(key)) { btn.hidden = true; return null; }
    const a = new Audio();
    a.preload = 'auto';
    a.addEventListener('error', () => { audioMissing.add(key); btn.hidden = true; if (cur && cur.audio === a) cur.audio = null; });
    a.src = audioUrl(key);
    return a;
  }
  function play() {
    if (!cur || !cur.audio) return;
    cur.audio.currentTime = 0;
    cur.audio.play().catch(() => { /* 浏览器要求先有点击才能自动播放 */ });
  }
  const SPEAKER = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M4 9v6h4l5 4V5L8 9H4z"/><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12"/></svg>';

  // ---------- 界面 ----------
  function applyI18n() {
    document.documentElement.lang = UI_TAG[settings.ui];
    document.title = `${t('title')} · Hanzumio`;
    document.querySelectorAll('[data-i18n]').forEach(e => { e.textContent = t(e.dataset.i18n); });
    document.querySelectorAll('[data-i18n-aria]').forEach(e => e.setAttribute('aria-label', t(e.dataset.i18nAria)));
    const help = $('helpBody');
    help.textContent = '';
    STR[settings.ui].help.forEach(p => { const e = document.createElement('p'); e.textContent = p; help.append(e); });
    document.querySelectorAll('#modeSeg button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === settings.mode)));
    document.querySelectorAll('#uiSeg button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.ui === settings.ui)));
  }

  // 一题一句：对话的问句和答句是前后两道题；打乱顺序时按整组对话打乱，问句仍在答句前面
  const keyOf = e => `${e[0][0]}:${e[1]}`;
  function buildQueue() {
    const lv = settings.level;
    let items = DATA[lv] ? DATA[lv].items : [];
    if (settings.shuffle) {
      if (!seeds[lv]) seeds[lv] = Math.floor(Math.random() * 2147483647) + 1;
      items = shuffled(items, seeds[lv]);
    }
    const all = [];
    items.forEach(raw => raw[3].forEach((l, li) => all.push([raw, li])));
    queue = settings.onlyWrong ? all.filter(e => results[keyOf(e)] === 'bad') : all;
  }

  function start(preferId, focus) {
    const lv = settings.level;
    const seq = ++loadSeq;
    prev = null;
    if (!DATA[lv]) showLoading(lv);
    loadLevel(lv).then(() => {
      if (seq !== loadSeq) return;
      buildQueue();
      if (!queue.length) { showDone(true); return; }
      let i = preferId ? queue.findIndex(e => keyOf(e) === preferId) : -1;
      if (i < 0) i = queue.findIndex(e => !results[keyOf(e)]);
      qi = i < 0 ? 0 : i;
      renderQuestion(focus);
    }, () => { if (seq === loadSeq) showError(lv); });
  }

  function showLoading(lv) {
    stopAudio();
    state = 'loading';
    cur = null;
    queue = [];
    $('done').hidden = true;
    $('actions').hidden = true;
    $('quiz').hidden = false;
    $('focus').hidden = true;
    $('cards').hidden = true;
    $('feedback').textContent = '';
    const box = $('lines');
    box.textContent = '';
    const p = el('p', 'loading');
    p.textContent = t('loading', { lv });
    box.append(p);
    renderMeta();
    renderPrev();
  }

  function showError(lv) {
    state = 'error';
    cur = null;
    queue = [];
    $('quiz').hidden = true;
    $('actions').hidden = true;
    $('done').hidden = false;
    $('doneTitle').textContent = t('loadError', { lv });
    $('doneSum').textContent = '';
    $('btnRestart').hidden = true;
    $('btnPracticeWrong').hidden = true;
    $('btnShowAll').hidden = true;
    $('btnRetryLoad').hidden = false;
    renderMeta();
    $('doneTitle').focus();
  }

  function renderQuestion(focus = true) {
    const [raw, li] = queue[qi];
    const item = parseItem(raw, DATA[settings.level].words);
    const py = settings.mode === 'py';
    stopAudio();
    state = 'typing';
    lastGrades = null;
    cur = { item, li, key: keyOf(queue[qi]), items: [], lines: [], recorded: false, firstOk: null, focus: 0, audio: null };
    $('done').hidden = true;
    $('quiz').hidden = false;
    $('actions').hidden = false;
    $('focus').hidden = true;
    $('quiz').classList.remove('cards-top');

    const box = $('lines');
    box.textContent = '';
    [item.lines[li]].forEach(line => {
      const lineEl = el('div', 'line');
      const prow = el('div', 'prompt-row');
      const playBtn = el('button', 'play');
      playBtn.type = 'button';
      playBtn.innerHTML = SPEAKER;
      playBtn.setAttribute('aria-label', `${t('play')} (Ctrl)`);
      playBtn.title = `${t('play')} (Ctrl)`;
      playBtn.addEventListener('click', () => { play(); if (state === 'typing') focusSlot(cur.focus || 0); });
      cur.audio = setupAudio(cur.key, playBtn);
      const prompt = el('p', 'prompt');
      prow.append(playBtn, prompt);
      const slots = el('div', 'slots');
      slots.setAttribute('role', 'group');
      line.words.forEach(w => {
        const slot = el('div', 'slot');
        const hint = span('', 'hint', py ? 'zh-Hans' : PY_TAG);
        const ans = span('', 'ans');
        if (w.fixed) {
          const content = /[\p{L}\p{N}]/u.test(w.fixed);
          slot.className = content ? 'slot punct fixed' : 'slot punct';
          if (!content) slot.setAttribute('aria-hidden', 'true');
          slot.append(hint, span(w.fixed, 'pch', 'zh-Hans'), ans);
          slots.append(slot);
          return;
        }
        const i = cur.items.length;
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'slot-in';
        input.dataset.i = i;
        input.lang = py ? PY_TAG : 'zh-Hans';
        input.autocomplete = 'off';
        input.spellcheck = false;
        input.setAttribute('autocapitalize', 'none');
        input.setAttribute('autocorrect', 'off');
        input.setAttribute('enterkeyhint', 'done');
        input.style.width = py ? `${Math.max(3, w.py.length) + 1.4}ch` : `${w.syl.length * 1.05 + 0.9}em`;
        slot.append(hint, input, ans);
        slots.append(slot);
        cur.items.push({ w, el: input, slot, hint, ans, revealed: false });
      });
      lineEl.append(prow, slots);
      box.append(lineEl);
      cur.lines.push({ line, prompt, slots });
    });
    refreshPrompts();
    refreshSlotLabels();
    refreshHints();
    $('feedback').textContent = '';
    $('feedback').classList.remove('good');
    if (settings.hint !== 'cards') { $('cards').hidden = true; $('cards').textContent = ''; }
    renderMeta();
    renderPrev();
    renderActions();
    save();
    if (focus && cur.items[0]) cur.items[0].el.focus({ preventScroll: true });
    if (settings.autoPlay) play();
  }

  function refreshPrompts() {
    if (!cur) return;
    cur.lines.forEach(({ line, prompt }) => {
      const [text, lang] = meaningOf(line);
      prompt.textContent = text || '…';
      if (lang) prompt.lang = lang; else prompt.removeAttribute('lang');
    });
  }

  function refreshHints() {
    if (!cur) return;
    const py = settings.mode === 'py';
    const cross = settings.hint === 'cross';
    cur.lines.forEach(l => l.slots.classList.toggle('with-hint', cross));
    cur.items.forEach(it => { it.hint.textContent = cross ? (py ? it.w.hz : it.w.py) : ''; });
    const top = settings.hint === 'cards';
    $('quiz').classList.toggle('cards-top', top);
    if (state === 'typing') {
      if (top) renderCards(false);
      else { $('cards').hidden = true; $('cards').textContent = ''; }
    }
  }

  function stateLabel(g) {
    return t({ ok: 'stOk', tone: 'stTone', wrong: 'stBad', empty: 'stEmpty', shown: 'stShown' }[g]);
  }

  function refreshSlotLabels() {
    if (!cur) return;
    const key = settings.mode === 'py' ? 'slotPy' : 'slotHz';
    cur.items.forEach((it, k) => {
      let label = t(key, { i: k + 1, n: it.w.syl.length });
      if (lastGrades) label += ` · ${stateLabel(lastGrades[k])}`;
      it.el.setAttribute('aria-label', label);
    });
  }

  function renderMeta() {
    const lv = settings.level;
    $('levelTag').textContent = `HSK ${lv.replace('-', '–')}`;
    $('count').textContent = queue.length && (state === 'typing' || state === 'checked') ? t('count', { n: qi + 1, t: queue.length }) : '';
    const ok = queue.filter(e => results[keyOf(e)] === 'ok').length;
    const bad = queue.filter(e => results[keyOf(e)] === 'bad').length;
    const pct = queue.length ? Math.round(((ok + bad) / queue.length) * 100) : 0;
    $('pct').textContent = queue.length ? `${pct}%` : '';
    $('barFill').style.width = `${pct}%`;
    $('statOkN').textContent = ok;
    $('statBadN').textContent = bad;
    $('statAccN').textContent = ok + bad ? `${Math.round((ok / (ok + bad)) * 100)}%` : '–';
  }

  function renderPrev() {
    const p = $('prevLine');
    if (!prev) { p.hidden = true; return; }
    p.hidden = false;
    p.textContent = '';
    const [mean, lang] = meaningOf(prev.line);
    p.append(span(t('prevLine'), 'lbl'), span(prev.zh, '', 'zh-Hans'), ' ',
      span(prev.ok ? '✓' : '✗', `mark ${prev.ok ? 'ok' : 'bad'}`), ' ', span(mean, 'mean', lang || undefined));
  }

  function renderActions() {
    const typing = state === 'typing';
    $('btnReveal').hidden = !typing;
    $('btnSubmit').hidden = !typing;
    $('btnSkip').hidden = !typing;
    $('btnRetry').hidden = typing;
    $('btnNext').hidden = typing;
    $('btnPrev').disabled = qi === 0;
  }

  // ---------- 输入 ----------
  function focusSlot(j, atStart) {
    const it = cur && cur.items[j];
    if (!it) return;
    it.el.focus();
    const p = atStart ? 0 : it.el.value.length;
    try { it.el.setSelectionRange(p, p); } catch (e) { /* 某些输入框不支持 */ }
  }

  function nextOpen(j) {
    let k = j + 1;
    while (k < cur.items.length && cur.items[k].revealed) k++;
    return k < cur.items.length ? k : -1;
  }

  // 拼音模式里出现空格（手机键盘、粘贴整句）：按空格分到后面的空格里
  function distributePy(i) {
    const items = cur.items;
    const parts = items[i].el.value.split(/\s+/);
    const trailing = parts[parts.length - 1] === '';
    const tokens = parts.filter(Boolean);
    items[i].el.value = tokens.length ? liveConvert(tokens[0]) : '';
    let j = i;
    for (const p of tokens.slice(1)) {
      const k = nextOpen(j);
      if (k < 0) { items[j].el.value += liveConvert(p); continue; }
      items[k].el.value = liveConvert(p);
      j = k;
    }
    const k = trailing ? nextOpen(j) : -1;
    focusSlot(k >= 0 ? k : j);
  }

  // 拼音模式连着打（像输入法那样 woshixuesheng）：这个空格的词已经打完、后面还有字母时，把多出来的送到下一个空格
  function splitAfterWord(value, syl) {
    const chars = [...value];
    let i = 0;
    const skip = () => { while (i < chars.length && /[\s'’]/.test(chars[i])) i++; };
    const baseOf = ch => (MARK_INFO[ch] ? MARK_INFO[ch][0] : ch).toLowerCase().replace('v', 'ü');
    for (const s of syl) {
      if (s.er) {
        skip();
        if (baseOf(chars[i] || '') === 'e' && baseOf(chars[i + 1] || '') === 'r') i += 2;
        else if (baseOf(chars[i] || '') === 'r') i += 1;
        else return null;
      } else {
        for (const letter of s.b) {
          skip();
          if (i >= chars.length || baseOf(chars[i]) !== letter) return null;
          i++;
        }
      }
      if (i < chars.length && /[0-5]/.test(chars[i])) i++;
    }
    const rest = chars.slice(i).join('');
    if (!rest || !/^[a-zA-ZüÜ]/.test(rest)) return null;
    return [chars.slice(0, i).join(''), rest];
  }

  function overflowPy(i) {
    const items = cur.items;
    let j = i;
    for (;;) {
      const it = items[j];
      const parts = splitAfterWord(it.el.value, it.w.syl);
      const k = nextOpen(j);
      if (!parts || k < 0) return j;
      it.el.value = parts[0];
      items[k].el.value = liveConvert(parts[1]) + items[k].el.value;
      j = k;
    }
  }

  // 汉字模式：一次打出的字比这个词多时，把多出来的字排到后面的空格
  function spillHz(i) {
    const items = cur.items;
    let j = i;
    for (;;) {
      const it = items[j];
      const chars = [...cleanHz(it.el.value)];
      const need = it.w.syl.length;
      const k = nextOpen(j);
      if (chars.length <= need || k < 0) return j;
      it.el.value = chars.slice(0, need).join('');
      items[k].el.value = chars.slice(need).join('') + items[k].el.value;
      j = k;
    }
  }

  function handleInput(i) {
    const it = cur.items[i];
    const input = it.el;
    if (settings.mode === 'py') {
      if (/\s/.test(input.value)) { distributePy(i); return; }
      const v = input.value;
      const conv = liveConvert(v);
      if (conv !== v) {
        const caret = liveConvert(v.slice(0, input.selectionStart)).length;
        input.value = conv;
        try { input.setSelectionRange(caret, caret); } catch (e) { /* 忽略 */ }
      }
      const last = overflowPy(i);
      if (last !== i) focusSlot(last);
      return;
    }
    if (/\s/.test(input.value)) {
      input.value = input.value.replace(/\s+/g, '');
      const k = nextOpen(i);
      if (k >= 0) focusSlot(k);
      return;
    }
    if (/[A-Za-z]/.test(input.value) || !hasHan(input.value)) return;
    const last = spillHz(i);
    const lit = cur.items[last];
    const k = nextOpen(last);
    if (k >= 0 && [...cleanHz(lit.el.value)].length >= lit.w.syl.length) focusSlot(k);
    else if (last !== i) focusSlot(last);
  }

  function reveal(i) {
    if (state !== 'typing' || !cur) return;
    const it = cur.items[i];
    if (!it || it.revealed) return;
    it.el.value = settings.mode === 'py' ? it.w.py : it.w.hz;
    it.el.readOnly = true;
    it.revealed = true;
    it.slot.classList.add('shown');
    const k = nextOpen(i);
    focusSlot(k >= 0 ? k : i);
  }

  // ---------- 判分 ----------
  function grade(it) {
    if (it.revealed) return 'shown';
    const v = it.el.value;
    if (!v.trim()) return 'empty';
    if (settings.mode === 'py') return gradePinyin(v, it.w.syl, settings.toneReq);
    return cleanHz(v) === it.w.hz ? 'ok' : 'wrong';
  }

  function nudge() {
    const s = $('lines');
    s.classList.remove('nudge');
    void s.offsetWidth;
    s.classList.add('nudge');
  }

  function check() {
    if (state !== 'typing' || !cur) return;
    const items = cur.items;
    if (items.every(it => !it.revealed && !it.el.value.trim())) {
      $('feedback').textContent = t('typeFirst');
      nudge();
      focusSlot(0);
      return;
    }
    const grades = items.map(grade);
    const allOk = grades.every(g => g === 'ok');
    if (!cur.recorded) {
      results[cur.key] = allOk ? 'ok' : 'bad';
      cur.recorded = true;
      cur.firstOk = allOk;
    }
    state = 'checked';
    lastGrades = grades;
    showGrades();
    renderActions();
    renderMeta();
    save();
    const a = document.activeElement;
    if (!a || a === document.body || a.hidden || a.closest('[hidden]')) $('btnNext').focus();
  }

  function showGrades() {
    const py = settings.mode === 'py';
    cur.lines.forEach(l => l.slots.classList.add('checked'));
    cur.items.forEach((it, k) => {
      const g = lastGrades[k];
      it.slot.classList.remove('ok', 'tone', 'bad', 'shown');
      it.slot.classList.add(g === 'ok' ? 'ok' : g === 'tone' ? 'tone' : 'bad');
      if (g === 'shown') it.slot.classList.add('shown');
      it.slot.classList.toggle('focus', it.w.hz === cur.item.head);
      it.el.readOnly = true;
      it.ans.textContent = '';
      if (py) {
        // 不写声调也算对，所以提交后每个词都显示带声调的拼音
        it.ans.append(span(it.w.hz, '', 'zh-Hans'), span(it.w.py, '', PY_TAG));
      } else {
        if (g !== 'ok' && g !== 'shown') it.ans.append(span(it.w.hz, '', 'zh-Hans'));
        it.ans.append(span(it.w.py, '', PY_TAG));
      }
    });
    refreshSlotLabels();

    const n = lastGrades.length;
    const ok = lastGrades.filter(g => g === 'ok').length;
    const tone = lastGrades.filter(g => g === 'tone').length;
    const fb = $('feedback');
    let text = ok === n ? t('allRight')
      : [t('summary', { ok, n }), tone && t('sumTone', { k: tone }), n - ok - tone && t('sumBad', { k: n - ok - tone })].filter(Boolean).join(' · ');
    const typed = cur.items.filter((it, k) => lastGrades[k] !== 'shown').map(it => it.el.value);
    if (py && typed.some(hasHan)) text += ` ${t('pyImeHint')}`;
    if (!py && typed.some(v => /[A-Za-z]/.test(v))) text += ` ${t('imeHint')}`;
    fb.textContent = text;
    fb.classList.toggle('good', ok === n);

    const head = cur.item.head;
    const e = DATA[settings.level].words[head];
    const f = $('focus');
    f.textContent = '';
    const b = document.createElement('b');
    b.lang = 'zh-Hans';
    b.textContent = head;
    f.append(span(t('focusWord')), b);
    if (e && e[0]) f.append(' ', span(e[0], '', PY_TAG));
    f.hidden = false;
    renderCards(true);
  }

  function renderCards(graded) {
    const box = $('cards');
    box.textContent = '';
    const idx = UI_IDX[settings.ui];
    cur.items.forEach((it, k) => {
      const g = graded ? lastGrades[k] : null;
      const card = document.createElement('div');
      card.className = 'card' + (g ? (g === 'ok' ? ' ok' : g === 'tone' ? ' tone' : ' bad') : '') + (it.w.hz === cur.item.head ? ' focus' : '');
      card.append(
        span(POS[it.w.pos] ? POS[it.w.pos][idx] : '', 'pos'),
        span(it.w.hz, 'hz', 'zh-Hans'),
        span(it.w.py, 'py', PY_TAG),
        span(it.w.gloss[settings.mean] || it.w.gloss[settings.mean === 'en' ? 'ko' : 'en'] || '', 'gl', settings.mean),
      );
      box.append(card);
    });
    box.hidden = false;
  }

  function retry() {
    if (state !== 'checked') return;
    state = 'typing';
    cur.items.forEach((it, k) => {
      it.slot.classList.remove('ok', 'tone', 'bad', 'shown', 'focus');
      it.ans.textContent = '';
      it.el.readOnly = false;
      it.revealed = false;
      if (lastGrades[k] !== 'ok') it.el.value = '';
    });
    const firstMiss = lastGrades.findIndex(g => g !== 'ok');
    lastGrades = null;
    cur.lines.forEach(l => l.slots.classList.remove('checked'));
    refreshSlotLabels();
    $('focus').hidden = true;
    refreshHints();
    $('feedback').textContent = '';
    $('feedback').classList.remove('good');
    renderActions();
    focusSlot(firstMiss < 0 ? 0 : firstMiss);
  }

  // ---------- 换题 ----------
  function leave() {
    prev = cur && cur.recorded ? { zh: cur.item.lines[cur.li].zh, line: cur.item.lines[cur.li], ok: cur.firstOk } : null;
  }
  function next() {
    if (!queue.length || !cur) return;
    leave();
    if (qi < queue.length - 1) { qi++; renderQuestion(); } else showDone(false);
  }
  function back() {
    if (qi <= 0 || !cur) return;
    leave();
    qi--;
    renderQuestion();
  }

  function showDone(empty) {
    stopAudio();
    state = empty ? 'empty' : 'done';
    cur = null;
    $('quiz').hidden = true;
    $('actions').hidden = true;
    $('done').hidden = false;
    renderMeta();
    renderPrev();
    const lv = settings.level;
    const ok = queue.filter(e => results[keyOf(e)] === 'ok').length;
    const bad = queue.filter(e => results[keyOf(e)] === 'bad').length;
    $('doneTitle').textContent = empty ? t('noWrong', { lv }) : t('done', { lv });
    $('doneSum').textContent = empty ? '' : t('doneSum', { ok, bad });
    $('btnRestart').hidden = empty;
    $('btnPracticeWrong').hidden = settings.onlyWrong || !bad;
    $('btnShowAll').hidden = !settings.onlyWrong;
    $('btnRetryLoad').hidden = true;
    $('doneTitle').focus();
  }

  // ---------- 键盘 ----------
  document.addEventListener('keydown', e => {
    if (e.isComposing || e.keyCode === 229 || dlg.open) return;
    if (e.key === 'Control') { if (!e.repeat) play(); return; }
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const target = e.target;
    const inSlot = target.classList && target.classList.contains('slot-in');
    if (state === 'checked') {
      if ((e.key === 'Enter' || e.key === ' ') && (inSlot || target === document.body)) {
        e.preventDefault();
        if (!e.repeat) next();
      }
      return;
    }
    if (state !== 'typing' || !inSlot) return;
    const i = +target.dataset.i;
    const n = cur.items.length;
    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        if (!e.repeat) check();
        break;
      case ' ':
        e.preventDefault();
        if (e.repeat) break;
        if (i < n - 1) focusSlot(i + 1); else check();
        break;
      case 'Backspace':
        if ((target.readOnly || target.value === '') && i > 0) { e.preventDefault(); focusSlot(i - 1); }
        break;
      case 'ArrowLeft':
        if (target.selectionStart === 0 && target.selectionEnd === 0 && i > 0) { e.preventDefault(); focusSlot(i - 1); }
        break;
      case 'ArrowRight':
        if (target.selectionStart === target.value.length && i < n - 1) { e.preventDefault(); focusSlot(i + 1, true); }
        break;
      case 'Escape':
        e.preventDefault();
        reveal(i);
        break;
      default:
    }
  });

  const linesEl = $('lines');
  linesEl.addEventListener('input', e => {
    if (!e.target.classList.contains('slot-in') || state !== 'typing' || e.isComposing) return;
    handleInput(+e.target.dataset.i);
  });
  linesEl.addEventListener('compositionend', e => {
    const input = e.target;
    if (!input.classList.contains('slot-in')) return;
    // 有的浏览器先发 input 再发 compositionend，这里补一次
    setTimeout(() => { if (state === 'typing' && document.activeElement === input) handleInput(+input.dataset.i); }, 0);
  });
  linesEl.addEventListener('focusin', e => {
    if (cur && e.target.classList.contains('slot-in')) cur.focus = +e.target.dataset.i;
  });

  // ---------- 按钮 ----------
  $('btnSubmit').addEventListener('click', check);
  $('btnNext').addEventListener('click', next);
  $('btnSkip').addEventListener('click', next);
  $('btnPrev').addEventListener('click', back);
  $('btnRetry').addEventListener('click', retry);
  $('btnReveal').addEventListener('click', () => {
    if (!cur) return;
    const i = cur.items[cur.focus] && !cur.items[cur.focus].revealed ? cur.focus : cur.items.findIndex(it => !it.revealed);
    reveal(i);
  });
  $('btnRestart').addEventListener('click', () => { prev = null; qi = 0; renderQuestion(); });
  $('btnPracticeWrong').addEventListener('click', () => { settings.onlyWrong = true; save(); start(null, true); });
  $('btnShowAll').addEventListener('click', () => { settings.onlyWrong = false; save(); start(null, true); });
  $('btnRetryLoad').addEventListener('click', () => start(positions[settings.level], true));
  $('levelTag').addEventListener('click', () => { syncForm(); dlg.showModal(); });

  document.querySelectorAll('#modeSeg button').forEach(b => b.addEventListener('click', () => {
    if (settings.mode === b.dataset.mode) return;
    settings.mode = b.dataset.mode;
    applyI18n();
    save();
    if (state === 'typing' || state === 'checked') renderQuestion();
  }));
  document.querySelectorAll('#uiSeg button').forEach(b => b.addEventListener('click', () => {
    settings.ui = b.dataset.ui;
    refreshAll();
    save();
  }));

  function refreshAll() {
    applyI18n();
    if (state === 'done' || state === 'empty') { showDone(state === 'empty'); return; }
    if (state === 'error') { showError(settings.level); return; }
    if (state === 'loading') { showLoading(settings.level); return; }
    renderMeta();
    renderPrev();
    refreshPrompts();
    refreshHints();
    if (state === 'checked') showGrades(); else refreshSlotLabels();
  }

  // ---------- 设置 ----------
  function syncForm() {
    form.level.value = settings.level;
    form.shuffle.checked = settings.shuffle;
    form.onlyWrong.checked = settings.onlyWrong;
    form.hint.value = settings.hint;
    form.autoPlay.checked = settings.autoPlay;
    form.tone.value = settings.toneReq ? 'req' : 'opt';
    form.mean.value = settings.mean;
  }
  $('openSettings').addEventListener('click', () => { syncForm(); dlg.showModal(); });
  form.addEventListener('change', e => {
    const name = e.target.name;
    if (name === 'level' || name === 'onlyWrong' || name === 'shuffle') {
      settings.level = form.level.value;
      settings.onlyWrong = form.onlyWrong.checked;
      settings.shuffle = form.shuffle.checked;
      save();
      start(name === 'level' ? positions[settings.level] : null, false);
      return;
    }
    if (name === 'tone') settings.toneReq = form.tone.value === 'req';
    else if (name === 'hint') { settings.hint = form.hint.value; refreshHints(); }
    else if (name === 'autoPlay') settings.autoPlay = form.autoPlay.checked;
    else if (name === 'mean') { settings.mean = form.mean.value; refreshAll(); }
    save();
  });
  $('btnReset').addEventListener('click', () => {
    if (!window.confirm(t('resetAsk'))) return;
    Object.keys(results).forEach(k => { delete results[k]; });
    Object.keys(positions).forEach(k => { delete positions[k]; });
    prev = null;
    save();
    start(null, false);
  });
  dlg.addEventListener('close', () => {
    if (state === 'typing' && cur) focusSlot(cur.focus || 0);
    else if (state === 'checked') $('btnNext').focus();
  });

  // ---------- 开始 ----------
  applyI18n();
  start(positions[settings.level], true);
})();
