const fs=require('fs'),vm=require('vm'),assert=require('assert');
const data=JSON.parse(fs.readFileSync(__dirname+'/../data/laws.json','utf8'));
function element(name){
  const listeners={};const el={name,value:'',hidden:false,innerHTML:'',textContent:'',dataset:{},style:{},firstChild:{textContent:''},
    setAttribute(){},getAttribute(){},addEventListener(name,cb){listeners[name]=cb},fire(name,v){listeners[name]?.({target:{value:v}})},
    focus(){},select(){},blur(){},scrollIntoView(){},closest(){return null},classList:{add(){},remove(){},toggle(){},contains(){return false}},
    querySelector(){return element('child')},querySelectorAll(){return []}
  };
  return el;
}
const cache=new Map(),get=(name)=>{if(!cache.has(name))cache.set(name,element(name));return cache.get(name)};
const document={querySelector:get,querySelectorAll:()=>[],body:{dataset:{}},addEventListener(){},createElement:()=>element('textarea')};
const context={window:{PROVINCE_LAWS:data},document,location:{protocol:'file:',search:'',href:'file:///test'},navigator:{clipboard:{writeText:async()=>{}}},history:{replaceState(){}},URLSearchParams,setTimeout,clearTimeout,console,localStorage:{getItem(){return null},setItem(){}}};
vm.runInNewContext(fs.readFileSync(__dirname+'/../assets/app.js','utf8'),context);
const input=get('#searchInput'),grid=get('#resultsGrid'),count=get('#resultCount');
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  for(const [q,wants] of [
    ['Поворотник',['Статья 8.1','Пункт 9.1']],
    ['Доккументы',['Статья 5.1','Статья 5.2']],
    ['Парава',['Статья 5.1']],
    ['Встречка',['Статья 9.1','Статья 9.2']],
    ['КоАП 11.1',['Статья 11.1']],
    ['ФЗоП 4.8',['Пункт 4.8']],
    ['не пропустил пешехода',['Статья 15.4']]
  ]){
    input.fire('input',q);await sleep(200);
    for(const want of wants)assert(grid.innerHTML.includes(want),`«${q}» не содержит «${want}». Было: ${grid.innerHTML.slice(0,600)}`);
    console.log('OK',q,'=>',count.textContent);
  }
})().catch(e=>{console.error(e);process.exitCode=1});
