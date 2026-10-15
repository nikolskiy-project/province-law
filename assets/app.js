'use strict';
(() => {
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const el = {
    search: $('#searchInput'), clear: $('#clearBtn'), dockSearch: $('#dockSearchInput'), dockClear: $('#dockClearBtn'), grid: $('#resultsGrid'),
    count: $('#resultCount'), title: $('#resultsTitle'), caption: $('#resultsCaption'),
    more: $('#moreBtn'), sort: $('#sortSelect'), sourceGrid: $('#sourceGrid'),
    notice: $('#dataNotice'), date: $('#dataDate'), toast: $('#toast')
  };
  const ORDER = ['koap','pdd','uk','fzop'];
  const STOP = new Set(['и','или','на','по','что','к','в','во','у','со','с','а','за','не','это','он','она','если','но','из','как','его','ее','я','мы','бы','же','ли','то','от','до','для','при','мне','машине','машина','авто']);
  const GROUPS = [
    {aliases:['поворотник','поворотники','поворотн','не показал поворот','забыл поворотник','не включил поворотник'], terms:['поворотник','указател поворот','сигнал поворот'], targets:['koap-8.1','pdd-9.1','pdd-9.2']},
    {aliases:['документ','документы','доккументы','документь','доки','нет документов','не показал документы'], terms:['документ','удостоверен','предъявлен документ'], targets:['koap-5.1','koap-5.2','pdd-2.1.1']},
    {aliases:['права','парава','водительские права','водительское удостоверение','в/у','нет прав','без прав','лишен прав'], terms:['права','водительск удостоверен','право управлен'], targets:['koap-5.1','pdd-2.1.1']},
    {aliases:['встречка','встречную','встречной','встречн','встречкаа','выезд на встречку','выехал на встречку'], terms:['встречк','встречн','встречного движен','встречную полос'], targets:['koap-9.1','koap-9.2','pdd-10.1','pdd-10.1.1']},
    {aliases:['кирпич','под кирпич','кирпичом','проезд под кирпич','знак въезд запрещен','въезд запрещен','въезд запрещён','запрещающий знак','проехал под знак','знак запрета въезда','проезд под запрещающий знак','знак 3.1'], terms:['дорожн знак','нарушение знаков','требован дорожн знаков','несоблюдение требований дорожн знаков'], targets:['koap-5.10']},
    {aliases:['сплошная','двойная сплошная','пересек сплошную','через сплошную','нарушение разметки'], terms:['разметк','нарушение знаков'], targets:['koap-5.10']},
    {aliases:['знаки','знак дорожный','дорожный знак','разметка'], terms:['дорожн знак','разметк','нарушение знаков'], targets:['koap-5.10']},
    {aliases:['парковка','парковался','припарковался','стоянка','бросил машину'], terms:['парковк','стоянк','остановк']},
    {aliases:['пешеход','пешеходка','зебра','пешеходный','пешеходный переход'], terms:['пешеход','зебр','переход']},
    {aliases:['не пропустил пешехода','не уступил пешеходу','сбил пешехода'], terms:['пешеход','уступ','не пропустил'], targets:['koap-15.4','pdd-14.1']},
    {aliases:['стоп линия','стоплиния','заехал за стоп линию','проехал стоп линию'], terms:['стоп лини','остановиться перед стоп линией'], targets:['koap-7.2','pdd-6.2']},
    {aliases:['скорость','превышение','спидинг','превысил скорость'], terms:['скорост','превышен']},
    {aliases:['светофор','красный','красный свет','проехал на красный','запрещающий сигнал светофора'], terms:['светофор','красный сигнал','красн'], targets:['koap-7.1']},
    {aliases:['мигалки','мигалка','маячки','сгу','сирена','спецсигналы','проблесковые маячки'], terms:['спецсигнал','маячк','сгу','проблесков','сирен']},
    {aliases:['фары','свет','ближний свет','без фар','выключил фары'], terms:['фар','ближн свет'], targets:['koap-6.4','pdd-8.1']},
    {aliases:['дтп','авария','врезался','попал в аварию'], terms:['дтп','авари','дорожно транспортн']},
    {aliases:['пьяный','нетрезвый','алкоголь','выпивший за рулем','алкогольное опьянение'], terms:['опьянен','алкогол','пьян'], targets:['koap-17.1.4']},
    {aliases:['погоня','преследование','уход от полиции','скрывается от полиции'], terms:['погон','преследован','уход от правоохран']},
    {aliases:['наручники','заковал'], terms:['наручник','спецсредств','физическ сил']},
    {aliases:['стрельба','огонь','стрелять','оружие','открыть огонь'], terms:['стрельб','огнестрельн','оружи']},
    {aliases:['обгон','обогнал','обгон запрещен','обгон в неположенном месте'], terms:['обгон','опережен'], targets:['koap-10.3']},
    {aliases:['оскорбил','оскорбление','мат','обматерил'], terms:['оскорбл','нецензурн']},
    {aliases:['неподчинение','неповиновение','отказ','не слушается полицию','не выполнил требование'], terms:['неподчинен','неповиновен','законн требован']},
    {aliases:['задний ход','ехал задом','сдал назад','двигался задним ходом'], terms:['задн ход','задним ходом'], targets:['koap-8.4','pdd-9.7','koap-14.3']},
    {aliases:['разворот','развернулся','разворачиваться','разворот запрещен'], terms:['разворот','разверн','запрещенный маневр'], targets:['koap-8.4','pdd-9.6']},
    {aliases:['помеха справа','правило правой руки','правая рука'], terms:['помех справа','правой руки'], targets:['pdd-9.5','pdd-14.4.2']},
    {aliases:['главная дорога','не уступил главной','уступи дорогу'], terms:['главн дорог','приоритет главной дороги'], targets:['koap-15.3','pdd-14.4.1']},
    {aliases:['госномер','госномера','без номера','без номеров','регистрационный знак','нет номеров'], terms:['регистрационн знак','без номер','госномер'], targets:['koap-5.3','pdd-2.1.2']},
    {aliases:['тонировка','затонированные стекла','тонировка передних стекол','темные стекла'], terms:['тонировк','светопропуск'], targets:['koap-5.4','fzop-2.34']},
    {aliases:['тротуар','по тротуару','движение по тротуару','обочина','по обочине','газон','по газону'], terms:['тротуар','обочин','газон'], targets:['koap-9.5']},
    {aliases:['оставил место дтп','уехал с места дтп','скрылся с места аварии'], terms:['покинул место дтп','скрылся с места дтп'], targets:['koap-16.1']},
    {aliases:['задолженность','неуплата','неуплаченные','неоплаченные','долги','долг по штрафам','штрафы'], terms:['неуплат штраф','неоплачен штраф','неуплачен штраф','штрафы на общую сумму','задолжен']}
  ];
  const norm = (s) => String(s ?? '').toLocaleLowerCase('ru-RU').normalize('NFKC').replace(/ё/g,'е').replace(/[«»“”]/g,' ').replace(/[‐‑–—-]/g,' ').replace(/[^a-zа-я0-9.]+/gi,' ').replace(/\s+/g,' ').trim();
  const h = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const icon = (name) => `<svg aria-hidden="true"><use href="#ic-${name}"></use></svg>`;
  function distance(a,b,cutoff=2) {
    if (a===b) return 0;
    if (Math.abs(a.length-b.length)>cutoff) return cutoff+1;
    let prev2=[], prev=[...Array(b.length+1)].map((_,i)=>i);
    for(let i=1;i<=a.length;i++){
      const curr=[i];
      let low=curr[0];
      for(let j=1;j<=b.length;j++){
        let cost=a[i-1]===b[j-1]?0:1;
        let d=Math.min(prev[j]+1,curr[j-1]+1,prev[j-1]+cost);
        if(i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1]) d=Math.min(d,prev2[j-2]+1);
        curr[j]=d;low=Math.min(low,d);
      }
      if(low>cutoff) return cutoff+1;
      prev2=prev;prev=curr;
    }
    return prev[b.length];
  }
  const similar=(a,b)=>a===b || (a.length>=4&&b.length>=4&&(a.startsWith(b)||b.startsWith(a))) || ((a.length>=5&&b.length>=5)&&distance(a,b,1)<=1);
  const MONEY_VALUE = /(?<!\d)(\d{1,3}(?:[ \u00a0\u202f.,]\d{3})+|\d{1,9})(?:\s*(тыс(?:яч(?:а|и|у)?)?\.?|млн\.?|к))?(?!\d)/gi;
  const FINE_WORD = /штраф(?:а|у|ом|е|ы|ов)?(?![а-яё])/gi;
  const RUBLES = /(?:руб(?:лей|ля(?:ми|х)?|ль|\.)?|₽)(?![а-яё])/i;
  function multiplier(s){
    if(!s)return 1;
    return /^млн/i.test(s)?1000000:1000;
  }
  function amountValue(s,unit){
    const numeric=Number(String(s).replace(/[\s\u00a0\u202f.,]/g,''));
    const value=numeric*multiplier(unit);
    return Number.isSafeInteger(value)&&value>=0 ? value : null;
  }
  function parseMoneyQuery(q){
    const original=String(q??'').toLowerCase().replace(/ё/g,'е').replace(/[\u00a0\u202f]/g,' ').trim();
    const penalty=/^(?:размер\s+штрафа|размер\s+наказания|наказание|взыскание)(?=\s|$)/i.test(original);
    const cleaned=original.replace(/(?:^|\s)(?:размер|наказание|взыскание|неуплаченных|неоплаченных|неуплата|задолженность|долг|долги|общая|сумма|штрафов|штрафа|штрафы|штраф|рублей|рубля|руб\.|руб|по|на|в)(?=\s|$)/gi,' ').replace(/₽/g,' ').replace(/\s+/g,' ').trim();
    const m=cleaned.match(/^(\d+(?:[\s.,]\d+)*)(?:\s*(тыс(?:яч(?:а|и|у)?)?\.?|млн\.?|к))?$/i);
    if(!m)return null;
    const n=amountValue(m[1],m[2]);
    return n!==null&&n>=1000 ? {value:n,kind:penalty?'penalty':'debt'} : null;
  }
  function parseFineQuery(q){return parseMoneyQuery(q)?.value??null;}
  function parseDebtRanges(row){
    const text=String(row.text||row.summary||'').replace(/[\u00a0\u202f]/g,' ').replace(/\s+/g,' ');
    const penaltyStart=text.search(/(?:^|[.!?;]\s*|\s)штраф\s*[-—–:]\s*\d/i);
    const offence=penaltyStart>=0?text.slice(0,penaltyStart):text;
    const match=offence.match(/(?:неуплат[а-яё]*\s+штраф[а-яё]*|неоплачен[а-яё]*\s+штраф[а-яё]*|неуплачен[а-яё]*\s+штраф[а-яё]*|задолженн?[а-яё]*\s+(?:по\s+)?штраф[а-яё]*|долг[а-яё]*\s+по\s+штраф[а-яё]*)[\s\S]{0,130}/i);
    if(!match)return [];
    const clause=match[0].split(/[.;](?!\d)/)[0];
    const numbers=[...clause.matchAll(MONEY_VALUE)].slice(0,2);
    if(!numbers.length)return [];
    const a=numbers[0],b=numbers[1];
    const before=clause.slice(0,a.index).toLowerCase();
    const between=b?clause.slice(a.index+a[0].length,b.index).toLowerCase():'';
    const range=!!b&&/(?:до|по|[-–—−…])/i.test(between);
    let ua=a[2]||'',ub=b?.[2]||'';
    if(range&&!ua&&ub)ua=ub;
    if(range&&!ua&& !ub && amountValue(a[1])<1000 && amountValue(b[1])>=1000)ua='тыс';
    const first=amountValue(a[1],ua);if(first===null)return [];
    if(range){
      const second=amountValue(b[1],ub);
      return second===null?[]:[{min:Math.min(first,second),max:Math.max(first,second),minInclusive:true,maxInclusive:true}];
    }
    if(/(?:более|свыше|выше|превышает|больше)\s*$/i.test(before))return [{min:first,max:Infinity,minInclusive:false,maxInclusive:false}];
    if(/(?:менее|меньше|ниже)\s*$/i.test(before))return [{min:0,max:first,minInclusive:true,maxInclusive:false}];
    if(/(?:не\s+менее|от)\s*$/i.test(before))return [{min:first,max:Infinity,minInclusive:true,maxInclusive:false}];
    if(/(?:не\s+более|до)\s*$/i.test(before))return [{min:0,max:first,minInclusive:true,maxInclusive:true}];
    return [];
  }
  function includesMoney(range,amount){
    return (amount>range.min||(amount===range.min&&range.minInclusive!==false)) &&
      (amount<range.max||(amount===range.max&&range.maxInclusive!==false));
  }
  function debtRangeLabel(r){
    if(r.min===0)return `${r.maxInclusive?'до':'менее'} ${fineFormat(r.max)} ₽`;
    if(r.max===Infinity)return `${r.minInclusive?'от':'более'} ${fineFormat(r.min)} ₽`;
    return `${fineFormat(r.min)}–${fineFormat(r.max)} ₽`;
  }
  function parseFineRanges(sanction){
    const s=String(sanction??'').replace(/[\u00a0\u202f]/g,' ').replace(/\s+/g,' ');
    const parts=[];
    for(const match of s.matchAll(FINE_WORD)){
      const start=match.index+match[0].length;
      const next=s.slice(start,start+210);
      const currency=next.match(RUBLES);
      let cutoff=currency?.index;
      if(currency){
        const suffix=next.slice(currency.index+currency[0].length);
        if(/^\s*(?:до|по|[-–—])\s*\d/i.test(suffix)){
          const secondCurrency=suffix.match(RUBLES);
          if(secondCurrency)cutoff=currency.index+currency[0].length+secondCurrency.index;
        }
      }
      let clause=currency?next.slice(0,cutoff):next.split(/[.;]|(?:\s+или\s+арест)|(?:\s+и\s+арест)/i)[0];
      const another=clause.search(FINE_WORD);
      if(another>=0)clause=clause.slice(0,another);
      const tokens=[...clause.matchAll(MONEY_VALUE)].slice(0,2);
      if(!tokens.length)continue;
      const first=tokens[0],second=tokens[1];
      const between=second?clause.slice(first.index+first[0].length,second.index):'';
      const range=!!second&&/(?:-|–|—|−|…|(?:^|\s)(?:до|по)(?:\s|$))/i.test(between);
      let firstUnit=first[2]||'',secondUnit=second?.[2]||'';
      if(range&&!firstUnit){
        if(secondUnit)firstUnit=secondUnit;
        else if(amountValue(first[1])<1000&&amountValue(second[1])>=1000)firstUnit='тыс';
      }
      const a=amountValue(first[1],firstUnit);
      if(a===null)continue;
      if(!currency&&a<1000)continue;
      if(range){
        const b=amountValue(second[1],secondUnit);
        if(b!==null)parts.push({min:Math.min(a,b),max:Math.max(a,b)});
      }else{
        const prefix=clause.slice(0,first.index);
        if(/(?:^|\s)до\s*$/i.test(prefix)||/(?:не\s+более|не\s+свыше)\s*$/i.test(prefix))parts.push({min:0,max:a});
        else if(/(?:^|\s)от\s*$/i.test(prefix)||/(?:не\s+менее)\s*$/i.test(prefix))parts.push({min:a,max:Infinity});
        else parts.push({min:a,max:a});
      }
    }
    return parts;
  }
  const fineFormat=n=>n===Infinity?'∞':n.toLocaleString('ru-RU');
  function fineRangeLabel(r){
    if(r.min===r.max)return `${fineFormat(r.min)} ₽`;
    if(r.min===0)return `до ${fineFormat(r.max)} ₽`;
    if(r.max===Infinity)return `от ${fineFormat(r.min)} ₽`;
    return `${fineFormat(r.min)}–${fineFormat(r.max)} ₽`;
  }
  let DATA={sources:{},items:[],mode:'starter'};
  let prepared=[];
  let filter='all', query='', sort='relevance', visible=30, timer=null, jumpTimer=null, hits=[], toastTimer, composing=false;
  const expandedCards=new Set();

  function fields(record){return {
    number:norm(record.number), title:norm(record.title), summary:norm(record.summary),
    tags:norm(record.tags), text:norm(String(record.text??'').replace(record.sanction||'',''))
  };}
  function tokensFor(q) {
    const cleaned=norm(q).replace(/^(?:статья|пункт|часть)\s+/,'').trim();
    const tokens=cleaned.split(' ').filter(t=>t.length>1&&!STOP.has(t));
    const groups=GROUPS.filter(g=>g.aliases.some(alias=>{
      const phrase=norm(alias);
      if(phrase.includes(' '))return cleaned===phrase||cleaned.includes(` ${phrase} `)||cleaned.startsWith(`${phrase} `)||cleaned.endsWith(` ${phrase}`);
      return tokens.some(t=>similar(t,phrase));
    }));
    const expanded=[...new Set(groups.flatMap(g=>g.terms.map(norm)))];
    return {cleaned,tokens,expanded,groups};
  }
  function wordMatch(field,term){
    if(!term)return false;
    if(field.includes(term))return true;
    if(term.includes(' ')){
      const parts=term.split(' ');
      return parts.length>1&&parts.every(p=>field.includes(p));
    }
    return field.split(' ').some(w=>w.length>3&&term.length>3&&(w.startsWith(term.slice(0,Math.max(4,term.length-2)))||similar(term,w)));
  }
  function searchScore(entry, terms) {
    if (!terms.cleaned) return 1;
    const f=entry._fields;
    const {cleaned,tokens,expanded,groups}=terms;
    if(/^(?:коап|пдд|ук|фзоп)\s*\d+(?:\.\d+)*$/.test(cleaned)) {
      const m=cleaned.match(/^(коап|пдд|ук|фзоп)\s*(.+)$/);
      const key=({коап:'koap',пдд:'pdd',ук:'uk',фзоп:'fzop'})[m[1]];
      return entry.source===key&&entry.number.startsWith(m[2])?1000:0;
    }
    if(/^\d+(?:\.\d+){1,3}$/.test(cleaned) && entry.number===cleaned) return 900;
    let score=0, core=0, matches=0;
    if (f.number===cleaned) score+=230;
    if(f.tags.includes(cleaned) && cleaned.length>=3) score+=100;
    if(f.title.includes(cleaned) && cleaned.length>=3) score+=90;
    if(f.summary.includes(cleaned) && cleaned.length>=3) score+=72;
    if(f.text.includes(cleaned) && cleaned.length>=4) score+=18;
    for(const t of tokens){
      let tscore=0;
      if(wordMatch(f.tags,t)) tscore=Math.max(tscore,55);
      if(wordMatch(f.title,t)) tscore=Math.max(tscore,49);
      if(wordMatch(f.summary,t)) tscore=Math.max(tscore,35);
      if(wordMatch(f.text,t)) tscore=Math.max(tscore,10);
      if(f.number===t) tscore=Math.max(tscore,200);
      if(tscore){score+=tscore;core+=tscore;matches++}
    }
    for(const t of expanded){
      let s=0;
      if(wordMatch(f.tags,t))s=31;
      else if(wordMatch(f.title,t))s=25;
      else if(wordMatch(f.summary,t))s=21;
      else if(wordMatch(f.text,t))s=6;
      score+=s;
    }
    for(const group of groups){
      if(group.targets?.includes(entry.id)){
        const direct=group.aliases.some(alias=>norm(alias)===cleaned);
        score+=direct?250:115;
      }
    }
    if(tokens.length>1){score*=0.6+0.4*matches/tokens.length}
    if(groups.length && core<13 && score<21) return 0;
    if(groups.some(g=>g.aliases.includes('права')) && groups.some(g=>g.aliases.some(a=>norm(a)===cleaned || tokens.some(t=>similar(t,norm(a)))))) {
      const licenseContext = /права|водительск.*удостовер|документ|пересдач|без прав|лишени.*прав/.test(f.tags+' '+f.title);
      if(!licenseContext) return 0;
    }
    return score>0?score:0;
  }
  function runSearch(){
    const money=parseMoneyQuery(query);
    const terms=money===null?tokensFor(query):null;
    hits=prepared.map(item=>{
      const ranges=money?.kind==='debt'?item._debtRanges:item._fineRanges;
      const score=money===null?searchScore(item,terms):(ranges.some(r=>includesMoney(r,money.value))?1000:0);
      return {...item,_score:score};
    }).filter(item=>item._score>0);
    hits.sort((a,b)=>b._score-a._score || ORDER.indexOf(a.source)-ORDER.indexOf(b.source) || compareNumber(a.number,b.number));
    visible=30;
    renderAll();
  }
  function compareNumber(a,b){
    const aa=a.split('.').map(Number),bb=b.split('.').map(Number);
    for(let i=0;i<Math.max(aa.length,bb.length);i++){
      const d=(aa[i]??-1)-(bb[i]??-1);if(d)return d;
    }return 0;
  }
  function highlight(value){
    if(parseMoneyQuery(query)!==null)return h(value);
    const q=tokensFor(query);
    let words=[...q.tokens];
    if(q.groups.length) words=[...words,...q.expanded.filter(x=>!x.includes(' '))];
    const escaped=h(value);
    const unique=[...new Set(words)].filter(x=>x.length>=3).sort((a,b)=>b.length-a.length).slice(0,9);
    if(!unique.length)return escaped;
    const alternation=unique.map(x=>x.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|');
    if(!alternation)return escaped;
    return escaped.replace(new RegExp(`(${alternation}[а-яa-z]{0,7})`,'gi'),'<mark>$1</mark>');
  }
  function renderSourceCards(){
    el.sourceGrid.innerHTML=ORDER.map(key=>{
      const src=DATA.sources[key], num=DATA.items.filter(x=>x.source===key).length;
      return `<a href="${h(src.url)}" target="_blank" rel="noopener noreferrer" class="source-card" title="Открыть документ на форуме"><span class="source-icon">${icon('file')}</span><span class="source-copy"><strong>${h(src.short)}</strong><span class="source-count">${num.toLocaleString('ru-RU')} ${plural(num,['пункт','пункта','пунктов'])}</span></span>${icon('link').replace('<svg ', '<svg class="source-external" ')}</a>`;
    }).join('');
  }
  const plural=(n,forms)=>forms[n%10===1&&n%100!==11?0:n%10>=2&&n%10<=4&&(n%100<12||n%100>14)?1:2];
  function sortedHits(){
    let rows=filter==='all' ? [...hits] : hits.filter(item=>item.source===filter);
    if(sort==='document') rows.sort((a,b)=>ORDER.indexOf(a.source)-ORDER.indexOf(b.source)||compareNumber(a.number,b.number));
    if(sort==='number') rows.sort((a,b)=>compareNumber(a.number,b.number)||ORDER.indexOf(a.source)-ORDER.indexOf(b.source));
    return rows;
  }
  function renderAll(){
    const nums=Object.fromEntries(ORDER.map(key=>[key,hits.filter(x=>x.source===key).length]));
    $('#filter-all').textContent=hits.length;
    ORDER.forEach(key=>{$(`#filter-${key}`).textContent=nums[key]});
    const rows=sortedHits();
    el.count.textContent=rows.length.toLocaleString('ru-RU');
    el.title.firstChild.textContent=query?'Результаты поиска ':'Все статьи ';
    const money=parseMoneyQuery(query);
    el.caption.textContent=money?money.kind==='debt'?`Неуплаченные штрафы: ${fineFormat(money.value)} ₽ · поиск по диапазонам задолженности`:`Наказание: ${fineFormat(money.value)} ₽ · поиск по размеру взыскания`:query?`Запрос: «${query}» · поиск по содержанию и синонимам`:'Введи нарушение, статью или общую сумму неуплаченных штрафов.';
    if(!rows.length){
      el.grid.innerHTML=`<div class="empty-state"><span class="empty-icon">${icon('search')}</span><strong>Совпадений не найдено</strong><p>${money!==null?'Для этой суммы задолженности или наказания подходящих статей в базе нет. Проверь полноту каталога.':'Попробуй другой признак нарушения или проверь выбранный документ.'}</p></div>`;
      el.more.hidden=true;return;
    }
    el.grid.innerHTML=rows.slice(0,visible).map((entry,i)=>renderCard(entry,i)).join('');
    el.more.hidden=rows.length<=visible;
    el.more.firstChild.textContent=`Показать ещё (${Math.min(30,rows.length-visible)}) `;
  }
  function renderCard(entry,i){
    const doc=DATA.sources[entry.source];
    const ref=entry.source==='fzop'?'Пункт':entry.source==='pdd'?'Пункт':'Статья';
    const isOpen=expandedCards.has(entry.id);
    return `<article class="law-card ${h(entry.source)} ${isOpen?'is-open':''}" data-id="${h(entry.id)}" style="animation-delay:${Math.min(i,12)*14}ms">
      <div class="law-meta"><div class="law-ref"><span class="law-type">${h(doc.short)}</span><span class="law-number">${ref} ${h(entry.number)}</span></div><span class="law-verified">${h(entry.chapter||'ИГРОВОЕ ПРАВО')}</span></div>
      <h3>${highlight(entry.title)}</h3><p class="law-summary">${highlight(entry.summary)}</p>
      ${entry.sanction?`<div class="law-sanction"><span>Наказание:</span> ${highlight(entry.sanction)}</div>`:''}
      ${entry._debtRanges.length?`<div class="fine-match debt-range">Неуплаченные штрафы: <strong>${h(entry._debtRanges.map(debtRangeLabel).join(', '))}</strong></div>`:''}
      ${parseMoneyQuery(query)?.kind==='penalty'&&entry._fineRanges.length?`<div class="fine-match">Размер наказания: ${h(entry._fineRanges.map(fineRangeLabel).join(', '))}</div>`:''}
      <div class="law-acts"><a href="${h(doc.url)}" target="_blank" rel="noopener noreferrer">${icon('link')} Оригинал</a><button type="button" class="copy-law" title="Скопировать короткую команду say" data-id="${h(entry.id)}">${icon('copy')} Копировать say</button><button type="button" class="view-detail" data-id="${h(entry.id)}" aria-expanded="${isOpen}" aria-controls="detail-${h(entry.id)}">Подробнее ${icon('chevron')}</button></div>
      <div class="law-detail" id="detail-${h(entry.id)}"><div class="law-detail-clip"><div class="law-detail-inner"><div class="law-detail-title">${icon('file')} ${entry.imported?'ТЕКСТ ИЗ ПЕРВОИСТОЧНИКА':'КРАТКОЕ СОДЕРЖАНИЕ'}</div><div class="law-detail-content">${highlight(entry.text)}</div>${entry.chapter?`<p class="law-detail-chapter">${h(entry.chapter)}</p>`:''}<div class="say-preview"><span>ФРАЗА ДЛЯ ЧАТА</span><code>${h(makeSay(entry))}</code></div></div></div></div>
    </article>`;
  }
  function notify(message){clearTimeout(toastTimer);el.toast.textContent=message;el.toast.classList.add('visible');toastTimer=setTimeout(()=>el.toast.classList.remove('visible'),2400)}
  function makeSay(row){
    const provided=String(row.say||'').replace(/^\s*\/?say\s+/i,'').trim();
    const description=(provided||String(row.summary||row.title||'').replace(/^\s*(?:Статья|Пункт)\s+\d+(?:\.\d+)*\.?(?:\s*)/i,''))
      .replace(/\s+/g,' ').replace(/[.!?;,]+$/,'').trim();
    const informal=description.charAt(0).toLocaleLowerCase('ru-RU')+description.slice(1);
    return `say ${row.number} ${informal}`;
  }
  async function copyLaw(id){
    const row=DATA.items.find(x=>x.id===id);if(!row)return;
    const phrase=makeSay(row);
    try{await navigator.clipboard.writeText(phrase);notify('Фраза для чата скопирована');}
    catch{const t=document.createElement('textarea');t.value=phrase;t.style.position='fixed';t.style.top='-100px';document.body.appendChild(t);t.select();const ok=document.execCommand('copy');t.remove();notify(ok?'Фраза для чата скопирована':'Не удалось скопировать');}
  }
  function updateAddress(){
    if(location.protocol==='file:'||location.protocol==='about:')return;
    const u=new URL(location.href);
    if(query)u.searchParams.set('q',query);else u.searchParams.delete('q');
    if(filter!=='all')u.searchParams.set('doc',filter);else u.searchParams.delete('doc');
    history.replaceState(null,'',u.pathname+u.search+u.hash);
  }
  function syncSearchInputs(value){
    el.search.value=value;
    el.dockSearch.value=value;
    el.clear.hidden=!value;
    el.dockClear.hidden=!value;
  }
  function scrollToResults(focusInput=false){
    clearTimeout(jumpTimer);
    if(typeof window.cancelPageInertia==='function')window.cancelPageInertia();
    const section=$('#results');
    if(!section)return;
    const reduced=typeof window.matchMedia==='function'&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    section.scrollIntoView({behavior:reduced?'instant':'smooth',block:'start'});
    if(focusInput){
      const desktop=typeof window.matchMedia==='function'&&window.matchMedia('(pointer:fine)').matches;
      if(desktop){
        el.dockSearch.focus({preventScroll:true});
        const end=el.dockSearch.value.length;
        if(typeof el.dockSearch.setSelectionRange==='function')el.dockSearch.setSelectionRange(end,end);
      }else if(document.activeElement===el.search){el.search.blur();}
    }
  }
  function scrollToSearch(){
    clearTimeout(jumpTimer);
    if(typeof window.cancelPageInertia==='function')window.cancelPageInertia();
    $('#search').scrollIntoView({behavior:'smooth',block:'start'});
    el.search.focus({preventScroll:true});
  }
  function focusSearch(){
    const results=$('#results');
    const onResults=typeof window.scrollY==='number'&&typeof results?.getBoundingClientRect==='function'&&results.getBoundingClientRect().top<170;
    const input=onResults?el.dockSearch:el.search;
    input.focus({preventScroll:onResults});
    input.select();
  }
  function setQuery(next,focus=false,fromHero=false){
    const value=String(next).slice(0,180);
    query=value.trim();
    syncSearchInputs(value);
    if(focus)el.search.focus();
    clearTimeout(timer);
    clearTimeout(jumpTimer);
    timer=setTimeout(()=>{runSearch();updateAddress();},80);
    if(fromHero&&query&&!composing){
      jumpTimer=setTimeout(()=>{
        if(document.activeElement===el.search&&query&&!composing){
          runSearch();updateAddress();scrollToResults(true);
        }
      },780);
    }
  }
  function submitSearch(){
    clearTimeout(timer);
    clearTimeout(jumpTimer);
    runSearch();
    updateAddress();
    scrollToResults(true);
  }
  function setFilter(next){
    if(next!=='all'&&!ORDER.includes(next))return;
    filter=next;$$('.filter-pill').forEach(btn=>{const sel=btn.dataset.source===filter;btn.classList.toggle('selected',sel);btn.setAttribute('aria-pressed',String(sel));});
    visible=30;renderAll();updateAddress();
  }
  function init(){
    if(!window.PROVINCE_LAWS?.items?.length){
      el.grid.innerHTML=`<div class="empty-state"><strong>Не удалось загрузить базу</strong><p>Файл data/laws.js отсутствует. Скачай весь проект вместе с папкой data и перезагрузи страницу.</p></div>`;
      el.sourceGrid.innerHTML='';el.date.textContent='База не загружена';return;
    }
    DATA=window.PROVINCE_LAWS;
    prepared=DATA.items.map(x=>({...x,_fields:fields(x),_fineRanges:parseFineRanges(x.sanction),_debtRanges:parseDebtRanges(x)}));
    renderSourceCards();
    const status=DATA.mode==='starter'?'стартовый каталог':DATA.mode==='mixed'?'частичный импорт':'полный каталог';
    el.date.textContent=`База: ${h(DATA.updatedAt||'неизвестно')} · ${status}`;
    el.notice.hidden=DATA.mode==='full';
    if(DATA.mode==='mixed'){
      const fallback=Object.entries(DATA.status||{}).filter(([_,val])=>val.status!=='full').map(([k])=>DATA.sources[k].short).join(', ');
      el.notice.querySelector('strong').textContent='Частично обновлённая база';
      el.notice.querySelector('p').textContent=`Для разделов ${fallback} используется сохранённый каталог. Обновление отключено.`;
    }
    el.grid.setAttribute('aria-busy','false');
    const params=new URLSearchParams(location.search);const initial=(params.get('q')||'').slice(0,180);
    if(initial) {query=initial;syncSearchInputs(initial);}
    const initialDoc=params.get('doc');
    if(ORDER.includes(initialDoc))setFilter(initialDoc);
    runSearch();
    if(initial&&location.hash!=='#search')setTimeout(()=>scrollToResults(false),100);
  }
  el.search.addEventListener('input', e=>setQuery(e.target.value,false,true));
  el.dockSearch.addEventListener('input',e=>setQuery(e.target.value));
  [el.search,el.dockSearch].forEach(input=>{
    input.addEventListener('compositionstart',()=>{composing=true;clearTimeout(jumpTimer)});
    input.addEventListener('compositionend',e=>{composing=false;setQuery(e.target.value,false,input===el.search)});
    input.addEventListener('keydown',e=>{
      if(e.key==='Enter'){
        e.preventDefault();
        submitSearch();
      }
      if(e.key==='Escape'){
        if(input.value)setQuery('');
        else input.blur();
      }
    });
  });
  $('#searchWrap').addEventListener('click',e=>{if(!e.target.closest('button'))el.search.focus();});
  $('#dockSearchWrap').addEventListener('click',e=>{if(!e.target.closest('button'))el.dockSearch.focus();});
  el.clear.addEventListener('click',()=>{setQuery('',true);el.search.focus();});
  el.dockClear.addEventListener('click',()=>{setQuery('');el.dockSearch.focus();});
  $$('.quick-chip').forEach(btn=>btn.addEventListener('click',()=>{
    setQuery(btn.dataset.query);
    submitSearch();
  }));
  $$('.filter-pill').forEach(btn=>btn.addEventListener('click',()=>setFilter(btn.dataset.source)));
  el.sort.addEventListener('change',e=>{sort=e.target.value;renderAll();});
  el.more.addEventListener('click',()=>{visible+=30;renderAll();});
  $('#backSearchBtn').addEventListener('click',scrollToSearch);
  $$('a[href="#search"]').forEach(link=>link.addEventListener('click',e=>{
    e.preventDefault();scrollToSearch();
  }));
  el.grid.addEventListener('click',e=>{
    const button=e.target.closest('button');if(!button)return;
    const id=button.dataset.id;if(!id)return;
    if(button.classList.contains('copy-law'))copyLaw(id);
    if(button.classList.contains('view-detail')){
      const card=button.closest('.law-card');const show=!card.classList.contains('is-open');
      card.classList.toggle('is-open',show);button.setAttribute('aria-expanded',String(show));
      if(show)expandedCards.add(id);else expandedCards.delete(id);
    }
  });
  document.addEventListener('keydown',e=>{
    const target=e.target;
    const editing=target instanceof Element&&!!target.closest('input, textarea, select, [contenteditable="true"]');
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){
      e.preventDefault();focusSearch();return;
    }
    if(!editing&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!e.shiftKey&&e.key==='/'){
      e.preventDefault();focusSearch();return;
    }
    if(e.key==='Tab'&&!e.shiftKey&&!e.altKey&&!e.ctrlKey&&!e.metaKey&&
      (document.activeElement===document.body||document.activeElement===document.documentElement)){
      e.preventDefault();focusSearch();
    }
  });
  init();
})();
