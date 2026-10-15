'use strict';
const assert=require('assert'),fs=require('fs'),vm=require('vm');
const data=JSON.parse(fs.readFileSync(__dirname+'/../data/laws.json','utf8'));
let clipboard='';
function element(key){
  const listeners={};const state=new Set();
  return {key,value:'',textContent:'',innerHTML:'',hidden:false,dataset:{},style:{},firstChild:{textContent:''},
    classList:{add(s){state.add(s)},remove(s){state.delete(s)},toggle(s,b){if(b)state.add(s);else state.delete(s)},contains(s){return state.has(s)}},
    addEventListener(event,listener){listeners[event]=listener},fire(event,e){listeners[event]?.(e)},setAttribute(){},
    focus(){},select(){},blur(){},scrollIntoView(){},querySelector(){return element('nested')},querySelectorAll(){return []}
  };
}
const cache=new Map(),get=key=>{if(!cache.has(key))cache.set(key,element(key));return cache.get(key)};
const document={querySelector:get,querySelectorAll:()=>[],addEventListener(){},createElement:()=>element('textarea'),body:{appendChild(){}}};
const context={window:{PROVINCE_LAWS:data},document,location:{protocol:'file:',search:'',href:'file:///test'},navigator:{clipboard:{writeText:async value=>{clipboard=value}}},history:{replaceState(){}},URLSearchParams,setTimeout,clearTimeout,console};
vm.runInNewContext(fs.readFileSync(__dirname+'/../assets/app.js','utf8'),context);
const input=get('#searchInput'),grid=get('#resultsGrid'),caption=get('#resultsCaption');
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function search(q){input.fire('input',{target:{value:q}});await sleep(110);return grid.innerHTML}
const has=(page,number)=>page.includes('data-id="koap-'+number+'"');
(async()=>{
  for(const q of ['70000','70 000','70.000','70,000','70 000 штрафов','70.000 штрафов','70 тыс.','70 000 неуплаченных штрафов','общая сумма штрафов 70000']){
    const page=await search(q);
    assert(has(page,'17.5'),`«${q}» не находит 17.5`);
    assert(!has(page,'17.4')&&!has(page,'17.6'),`«${q}» ошибочно показывает другой порог`);
    assert(caption.textContent.includes('Неуплаченные штрафы'),`Не выбрана семантика долга: ${q}`);
    console.log('OK:',q,'→ КоАП 17.5');
  }
  for(const [q,expected,notExpected] of [
    ['10 000','17.4',['17.5','17.6']],['49 999','17.4',['17.5','17.6']],
    ['50 001','17.5',['17.4','17.6']],['100 000','17.5',['17.6']],
    ['100 001','17.6',['17.5','17.4']],['150.000','17.6',['17.5','17.4']],
    ['5000',null,['17.4','17.5','17.6']]
  ]){
    const page=await search(q);
    if(expected)assert(has(page,expected),`${q} — нет ${expected}`);
    notExpected.forEach(n=>assert(!has(page,n),`${q} — ошибочно есть ${n}`));
    console.log('OK:',q,'→',expected||'нет долга');
  }
  const threshold=await search('50000');
  assert(has(threshold,'17.4')&&has(threshold,'17.5'),'Точка пересечения двух интервалов должна возвращать обе статьи');
  const num=await search('17.5');
  assert(has(num,'17.5'),'Номер статьи не должен восприниматься как сумма');
  const page=await search('70000');
  const phrase='say 17.5 управление транспортным средством с неуплаченными штрафами на общую сумму от 50.000 до 100.000 рублей';
  assert(page.includes(phrase),'В раскрываемом блоке нет фразы для копирования');
  const button={dataset:{id:'koap-17.5'},classList:{contains:name=>name==='copy-law'}};
  grid.fire('click',{target:{closest:()=>button}});
  await sleep(30);
  assert.strictEqual(clipboard,phrase,'Кнопка копирует не ту фразу');
  await search('штрафы');
  function open(id){
    const cls=new Set();const btn={dataset:{id},classList:{contains:n=>n==='view-detail'},setAttribute(){},closest:()=>({classList:{contains:n=>cls.has(n),toggle:(n,b)=>{if(b)cls.add(n);else cls.delete(n)}}})};
    grid.fire('click',{target:{closest:()=>btn}});
  }
  open('koap-17.4');open('koap-17.5');
  get('#sortSelect').fire('change',{target:{value:'number'}});
  assert(grid.innerHTML.includes('law-card koap is-open" data-id="koap-17.4"'),'Первая карточка должна остаться раскрытой');
  assert(grid.innerHTML.includes('law-card koap is-open" data-id="koap-17.5"'),'Вторая карточка должна остаться раскрытой');
  console.log('OK: copy phrase, independent expansion, sorting persistence');
})().catch(e=>{console.error(e);process.exitCode=1});
