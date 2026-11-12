// 汉字打字练习：看释义，按词写出拼音或汉字。
(() => {
  'use strict';

  const DATA = window.HANZUMIO_TYPING;
  const STORE_KEY = 'hanzumio-typing-v1';

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
      done: '这一组练完了！', doneSum: '答对 {ok} 题，答错 {bad} 题。', noWrong: '还没有错题。',
      restart: '从头再来', practiceWrong: '练错题', showAll: '练全部',
      level: '级别', all: '全部', onlyWrong: '只练错题', tones: '声调（拼音模式）', toneReq: '必须写', toneOpt: '可以不写',
      hint: '在空格上方显示提示', hintNote: '拼音模式显示汉字，汉字模式显示拼音。', meaning: '释义语言',
      reset: '清空记录', resetAsk: '清空这个浏览器里的打字练习记录？', close: '完成',
      helpTitle: '怎么输入', note: '练习记录只保存在这个浏览器里，不会上传。',
      help: [
        '拼音模式：用数字标声调，打 ni3 会变成 nǐ；轻声不用标；ü 用 v 打，lv4 会变成 lǜ。按空格到下一个词，在最后一个词按空格或回车提交。',
        '汉字模式：用电脑或手机自带的中文输入法。输入法选字时按的空格和回车留给输入法，不会跳词。一次打出好几个词也可以，多出来的字会自动排到后面的空格里。',
        '绿色是对的，黄色是拼音对了但声调不对，红色是写错或没写。按 Esc 可以看当前这个词的答案，提交后点「再练一遍」只重写错的词。',
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
      done: 'You have finished this set!', doneSum: '{ok} right, {bad} wrong.', noWrong: 'No mistakes to practise yet.',
      restart: 'Start again', practiceWrong: 'Practise mistakes', showAll: 'Practise all',
      level: 'Level', all: 'All', onlyWrong: 'Mistakes only', tones: 'Tones (Pinyin mode)', toneReq: 'Required', toneOpt: 'Optional',
      hint: 'Show a hint above each blank', hintNote: 'Pinyin mode shows the characters; Hanzi mode shows the pinyin.', meaning: 'Meaning in',
      reset: 'Clear progress', resetAsk: 'Clear your typing progress in this browser?', close: 'Done',
      helpTitle: 'How to type', note: 'Your progress is kept only in this browser and is never uploaded.',
      help: [
        'Pinyin mode: type tones as numbers — ni3 becomes nǐ; leave neutral tones bare; type ü as v, so lv4 becomes lǜ. Space moves to the next word; on the last word, Space or Enter checks the sentence.',
        'Hanzi mode: use the Chinese input method on your computer or phone. Space and Enter pressed while picking characters stay with the input method and never skip a word. You can type several words at once; extra characters flow into the next blanks.',
        'Green is right, amber means the pinyin is right but the tone is not, red is wrong or blank. Press Esc to see the answer for the current word. After checking, “Try again” clears only the words you missed.',
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
      done: '이 세트를 다 풀었어요!', doneSum: '{ok}문제 맞히고 {bad}문제 틀렸어요.', noWrong: '아직 틀린 문제가 없어요.',
      restart: '처음부터', practiceWrong: '틀린 문제 풀기', showAll: '전체 풀기',
      level: '급수', all: '전체', onlyWrong: '틀린 문제만', tones: '성조 (병음 모드)', toneReq: '반드시 입력', toneOpt: '생략 가능',
      hint: '빈칸 위에 힌트 보기', hintNote: '병음 모드에서는 한자를, 한자 모드에서는 병음을 보여 줘요.', meaning: '뜻 언어',
      reset: '기록 지우기', resetAsk: '이 브라우저에 저장된 타자 연습 기록을 지울까요?', close: '완료',
      helpTitle: '입력 방법', note: '연습 기록은 이 브라우저에만 저장되며 업로드되지 않아요.',
      help: [
        '병음 모드: 성조는 숫자로 입력하세요. ni3을 치면 nǐ로 바뀌고, 경성은 숫자를 붙이지 않아도 돼요. ü는 v로 입력해요(lv4 → lǜ). 스페이스를 누르면 다음 단어로 가고, 마지막 단어에서 스페이스나 엔터를 누르면 제출돼요.',
        '한자 모드: 컴퓨터나 휴대폰의 중국어 입력기를 쓰세요. 글자를 고를 때 누르는 스페이스와 엔터는 입력기가 처리하므로 단어를 건너뛰지 않아요. 여러 단어를 한 번에 입력해도 남는 글자는 다음 빈칸으로 넘어가요.',
        '초록색은 정답, 노란색은 병음은 맞지만 성조가 틀린 것, 빨간색은 틀렸거나 비워 둔 단어예요. Esc를 누르면 지금 단어의 답을 볼 수 있어요. 제출한 뒤 ‘다시 하기’를 누르면 틀린 단어만 다시 써요.',
      ],
    },
  };
  const POS = {
    n: ['名词', 'noun', '명사'], v: ['动词', 'verb', '동사'], a: ['形容词', 'adj.', '형용사'], d: ['副词', 'adv.', '부사'],
    r: ['代词', 'pron.', '대명사'], m: ['数词', 'number', '수사'], q: ['量词', 'measure', '양사'], p: ['介词', 'prep.', '개사'],
    c: ['连词', 'conj.', '접속사'], u: ['助词', 'particle', '조사'], mv: ['能愿动词', 'modal', '조동사'], x: ['常用语', 'phrase', '표현'],
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

  function parseExpected(py, hz) {
    const chars = [...hz];
    return py.trim().split(/\s+/).map((tok, k) => {
      const alts = tok.split('/');
      const acc = new Set(alts.map(toneOf));
      (LENIENT[chars[k]] || []).forEach(x => acc.add(x));
      return { b: stripMarks(alts[0]).toLowerCase(), t: toneOf(alts[0]), acc, disp: alts[0] };
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
    for (const s of syl) {
      let tone = null;
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
  const hasHan = v => /\p{Script=Han}/u.test(v);

  // ---------- 题库 ----------
  function makeWord([hz, py, pos, en, ko]) {
    const syl = parseExpected(py, hz);
    const g = en ? [en, ko] : DATA.gloss[hz] || ['', ''];
    return { hz, pos, syl, py: joinPinyin(syl.map(x => x.disp)), gloss: { en: g[0], ko: g[1] } };
  }
  const SENTENCES = DATA.sentences.map(s => ({
    id: s.id, lv: s.lv, en: s.en, ko: s.ko,
    words: s.w.map(tok => (tok.length === 1 ? { punct: tok[0] } : makeWord(tok))),
  }));
  const sentenceText = s => s.words.map(w => w.punct || w.hz).join('');

  // ---------- 存储 ----------
  function load() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch (e) { return {}; }
  }
  function save() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ settings, results, pos: queue[qi] ? queue[qi].id : null }));
    } catch (e) { /* 浏览器不让存时照常练习 */ }
  }

  function defaults() {
    const nav = ((navigator.languages && navigator.languages[0]) || navigator.language || 'en').toLowerCase();
    const ui = nav.startsWith('ko') ? 'ko' : nav.startsWith('zh') ? 'zh' : 'en';
    return { ui, mean: ui === 'ko' ? 'ko' : 'en', mode: 'py', level: 'all', onlyWrong: false, toneReq: true, hint: false };
  }
  function sanitize(s) {
    const d = defaults();
    const pick = (v, ok, dv) => (ok.includes(v) ? v : dv);
    return {
      ui: pick(s.ui, ['zh', 'en', 'ko'], d.ui),
      mean: pick(s.mean, ['en', 'ko'], d.mean),
      mode: pick(s.mode, ['py', 'hz'], d.mode),
      level: pick(s.level, ['all', '1', '2', '3'], d.level),
      onlyWrong: s.onlyWrong === true,
      toneReq: s.toneReq !== false,
      hint: s.hint === true,
    };
  }

  // ---------- 状态 ----------
  const saved = load();
  const settings = sanitize(saved.settings || {});
  const results = saved.results && typeof saved.results === 'object' ? saved.results : {};
  let queue = [];
  let qi = 0;
  let state = 'typing'; // typing | checked | done | empty
  let cur = null;
  let prev = null;
  let lastGrades = null;

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

  function buildQueue() {
    queue = SENTENCES.filter(s => (settings.level === 'all' || String(s.lv) === settings.level)
      && (!settings.onlyWrong || results[s.id] === 'bad'));
  }

  function start(preferId, focus) {
    buildQueue();
    if (!queue.length) { showDone(true); return; }
    let i = preferId ? queue.findIndex(s => s.id === preferId) : -1;
    if (i < 0) i = queue.findIndex(s => !results[s.id]);
    qi = i < 0 ? 0 : i;
    renderQuestion(focus);
  }

  function renderQuestion(focus = true) {
    const s = queue[qi];
    const py = settings.mode === 'py';
    state = 'typing';
    lastGrades = null;
    cur = { s, items: [], recorded: false, firstOk: null, focus: 0 };
    $('done').hidden = true;
    $('quiz').hidden = false;
    $('actions').hidden = false;

    const slots = $('slots');
    slots.textContent = '';
    slots.classList.remove('checked');
    slots.classList.toggle('with-hint', settings.hint);
    s.words.forEach(w => {
      const slot = document.createElement('div');
      const hint = span('', 'hint', py ? 'zh-Hans' : PY_TAG);
      const ans = span('', 'ans');
      if (w.punct) {
        slot.className = 'slot punct';
        slot.setAttribute('aria-hidden', 'true');
        slot.append(hint, span(w.punct, 'pch', 'zh-Hans'), ans);
        slots.append(slot);
        return;
      }
      const i = cur.items.length;
      const el = document.createElement('input');
      el.type = 'text';
      el.className = 'slot-in';
      el.dataset.i = i;
      el.lang = py ? PY_TAG : 'zh-Hans';
      el.autocomplete = 'off';
      el.spellcheck = false;
      el.setAttribute('autocapitalize', 'none');
      el.setAttribute('autocorrect', 'off');
      el.setAttribute('enterkeyhint', 'done');
      el.style.width = py ? `${Math.max(3, w.py.length) + 1.4}ch` : `${w.syl.length * 1.05 + 0.9}em`;
      slot.className = 'slot';
      slot.append(hint, el, ans);
      slots.append(slot);
      cur.items.push({ w, el, slot, hint, ans, revealed: false });
    });
    refreshSlotLabels();
    refreshHints();
    $('feedback').textContent = '';
    $('feedback').classList.remove('good');
    $('cards').hidden = true;
    $('cards').textContent = '';
    refreshPrompt();
    renderMeta();
    renderPrev();
    renderActions();
    save();
    if (focus && cur.items[0]) cur.items[0].el.focus({ preventScroll: true });
  }

  function refreshPrompt() {
    if (!cur) return;
    $('prompt').textContent = cur.s[settings.mean];
    $('prompt').lang = settings.mean;
  }

  function refreshHints() {
    if (!cur) return;
    const py = settings.mode === 'py';
    $('slots').classList.toggle('with-hint', settings.hint);
    cur.items.forEach(it => { it.hint.textContent = settings.hint ? (py ? it.w.hz : it.w.py) : ''; });
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
    const s = queue[qi];
    $('levelTag').textContent = s && state !== 'empty' ? `HSK ${s.lv}` : '';
    $('count').textContent = queue.length && state !== 'empty' ? t('count', { n: qi + 1, t: queue.length }) : '';
    const ok = queue.filter(x => results[x.id] === 'ok').length;
    const bad = queue.filter(x => results[x.id] === 'bad').length;
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
    p.append(span(t('prevLine'), 'lbl'), span(sentenceText(prev.s), '', 'zh-Hans'), ' ',
      span(prev.ok ? '✓' : '✗', `mark ${prev.ok ? 'ok' : 'bad'}`), ' ', span(prev.s[settings.mean], 'mean', settings.mean));
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
    const el = it.el;
    if (settings.mode === 'py') {
      if (/\s/.test(el.value)) { distributePy(i); return; }
      const v = el.value;
      const conv = liveConvert(v);
      if (conv !== v) {
        const caret = liveConvert(v.slice(0, el.selectionStart)).length;
        el.value = conv;
        try { el.setSelectionRange(caret, caret); } catch (e) { /* 忽略 */ }
      }
      return;
    }
    if (/\s/.test(el.value)) {
      el.value = el.value.replace(/\s+/g, '');
      const k = nextOpen(i);
      if (k >= 0) focusSlot(k);
      return;
    }
    if (/[A-Za-z]/.test(el.value) || !hasHan(el.value)) return;
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
    const s = $('slots');
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
      results[cur.s.id] = allOk ? 'ok' : 'bad';
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
    $('slots').classList.add('checked');
    cur.items.forEach((it, k) => {
      const g = lastGrades[k];
      it.slot.classList.remove('ok', 'tone', 'bad', 'shown');
      it.slot.classList.add(g === 'ok' ? 'ok' : g === 'tone' ? 'tone' : 'bad');
      if (g === 'shown') it.slot.classList.add('shown');
      it.el.readOnly = true;
      it.ans.textContent = '';
      if (py) {
        it.ans.append(span(it.w.hz, '', 'zh-Hans'));
        if (g !== 'ok' && g !== 'shown') it.ans.append(span(it.w.py, '', PY_TAG));
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
    renderCards();
  }

  function renderCards() {
    const box = $('cards');
    box.textContent = '';
    const idx = UI_IDX[settings.ui];
    cur.items.forEach((it, k) => {
      const g = lastGrades[k];
      const card = document.createElement('div');
      card.className = `card ${g === 'ok' ? 'ok' : g === 'tone' ? 'tone' : 'bad'}`;
      card.append(
        span(POS[it.w.pos] ? POS[it.w.pos][idx] : '', 'pos'),
        span(it.w.hz, 'hz', 'zh-Hans'),
        span(it.w.py, 'py', PY_TAG),
        span(it.w.gloss[settings.mean], 'gl', settings.mean),
      );
      box.append(card);
    });
    box.hidden = false;
  }

  function retry() {
    if (state !== 'checked') return;
    state = 'typing';
    cur.items.forEach((it, k) => {
      it.slot.classList.remove('ok', 'tone', 'bad', 'shown');
      it.ans.textContent = '';
      it.el.readOnly = false;
      it.revealed = false;
      if (lastGrades[k] !== 'ok') it.el.value = '';
    });
    const firstMiss = lastGrades.findIndex(g => g !== 'ok');
    lastGrades = null;
    $('slots').classList.remove('checked');
    refreshSlotLabels();
    $('cards').hidden = true;
    $('feedback').textContent = '';
    $('feedback').classList.remove('good');
    renderActions();
    focusSlot(firstMiss < 0 ? 0 : firstMiss);
  }

  // ---------- 换题 ----------
  function leave() {
    prev = cur && cur.recorded ? { s: cur.s, ok: cur.firstOk } : null;
  }
  function next() {
    if (!queue.length) return;
    leave();
    if (qi < queue.length - 1) { qi++; renderQuestion(); } else showDone(false);
  }
  function back() {
    if (qi <= 0) return;
    leave();
    qi--;
    renderQuestion();
  }

  function showDone(empty) {
    state = empty ? 'empty' : 'done';
    cur = null;
    $('quiz').hidden = true;
    $('actions').hidden = true;
    $('done').hidden = false;
    renderMeta();
    renderPrev();
    const ok = queue.filter(x => results[x.id] === 'ok').length;
    const bad = queue.filter(x => results[x.id] === 'bad').length;
    $('doneTitle').textContent = empty ? t('noWrong') : t('done');
    $('doneSum').textContent = empty ? '' : t('doneSum', { ok, bad });
    $('btnRestart').hidden = empty;
    $('btnPracticeWrong').hidden = settings.onlyWrong || !bad;
    $('btnShowAll').hidden = !settings.onlyWrong;
    $('doneTitle').focus();
  }

  // ---------- 键盘 ----------
  document.addEventListener('keydown', e => {
    if (e.isComposing || e.keyCode === 229 || dlg.open) return;
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const el = e.target;
    const inSlot = el.classList && el.classList.contains('slot-in');
    if (state === 'checked') {
      if ((e.key === 'Enter' || e.key === ' ') && (inSlot || el === document.body)) {
        e.preventDefault();
        if (!e.repeat) next();
      }
      return;
    }
    if (state !== 'typing' || !inSlot) return;
    const i = +el.dataset.i;
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
        if ((el.readOnly || el.value === '') && i > 0) { e.preventDefault(); focusSlot(i - 1); }
        break;
      case 'ArrowLeft':
        if (el.selectionStart === 0 && el.selectionEnd === 0 && i > 0) { e.preventDefault(); focusSlot(i - 1); }
        break;
      case 'ArrowRight':
        if (el.selectionStart === el.value.length && i < n - 1) { e.preventDefault(); focusSlot(i + 1, true); }
        break;
      case 'Escape':
        e.preventDefault();
        reveal(i);
        break;
      default:
    }
  });

  const slotsEl = $('slots');
  slotsEl.addEventListener('input', e => {
    if (!e.target.classList.contains('slot-in') || state !== 'typing' || e.isComposing) return;
    handleInput(+e.target.dataset.i);
  });
  slotsEl.addEventListener('compositionend', e => {
    const el = e.target;
    if (!el.classList.contains('slot-in')) return;
    // 有的浏览器先发 input 再发 compositionend，这里补一次
    setTimeout(() => { if (state === 'typing' && document.activeElement === el) handleInput(+el.dataset.i); }, 0);
  });
  slotsEl.addEventListener('focusin', e => {
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
  $('btnRestart').addEventListener('click', () => { qi = 0; renderQuestion(); });
  $('btnPracticeWrong').addEventListener('click', () => { settings.onlyWrong = true; save(); start(null, true); });
  $('btnShowAll').addEventListener('click', () => { settings.onlyWrong = false; save(); start(null, true); });

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
    renderMeta();
    renderPrev();
    refreshPrompt();
    refreshHints();
    if (state === 'checked') showGrades(); else refreshSlotLabels();
  }

  // ---------- 设置 ----------
  function syncForm() {
    form.level.value = settings.level;
    form.onlyWrong.checked = settings.onlyWrong;
    form.tone.value = settings.toneReq ? 'req' : 'opt';
    form.hint.checked = settings.hint;
    form.mean.value = settings.mean;
  }
  $('openSettings').addEventListener('click', () => { syncForm(); dlg.showModal(); });
  form.addEventListener('change', e => {
    const name = e.target.name;
    if (name === 'level' || name === 'onlyWrong') {
      settings.level = form.level.value;
      settings.onlyWrong = form.onlyWrong.checked;
      prev = null;
      start(null, false);
    } else if (name === 'tone') {
      settings.toneReq = form.tone.value === 'req';
    } else if (name === 'hint') {
      settings.hint = form.hint.checked;
      refreshHints();
    } else if (name === 'mean') {
      settings.mean = form.mean.value;
      refreshAll();
    }
    save();
  });
  $('btnReset').addEventListener('click', () => {
    if (!window.confirm(t('resetAsk'))) return;
    Object.keys(results).forEach(k => { delete results[k]; });
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
  start(saved.pos, true);
})();
