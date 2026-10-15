'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const base=path.join(__dirname,'..');
const data=JSON.parse(fs.readFileSync(path.join(base,'data/laws.json'),'utf8'));
function element(){const listeners={};return {value:'',textContent:'',innerHTML:'',hidden:false,dataset:{},style:{},firstChild:{textContent:''},classList:{add(){},remove(){},toggle(){},contains(){return false}},setAttribute(){},addEventListener(name,callback){listeners[name]=callback},fire(name,value){listeners[name]?.({target:{value}})},focus(){},select(){},blur(){},scrollIntoView(){},querySelector(){return element()}};}
const elements=new Map(), get=s=>{if(!elements.has(s))elements.set(s,element());return elements.get(s)};
const document={querySelector:get,querySelectorAll:()=>[],addEventListener(){}}, context={window:{PROVINCE_LAWS:data},document,location:{protocol:'file:',search:'',href:'file:///index.html'},navigator:{clipboard:{writeText:async()=>{}}},history:{replaceState(){}},URLSearchParams,setTimeout,clearTimeout,console};
vm.runInNewContext(fs.readFileSync(path.join(base,'assets/app.js'),'utf8'),context);
function firstId(html){return (html.match(/<article class="law-card[^\"]*" data-id="([^"]+)"/)||[])[1]}
async function search(q){get('#searchInput').fire('input',q);await new Promise(r=>setTimeout(r,105));return get('#resultsGrid').innerHTML}
(async()=>{
  for(const q of ['кирпич','под кирпич','проезд под кирпич','запрещающий знак','въезд запрещён','проезд под запрещающий знак']){
    const result=await search(q);assert.equal(firstId(result),'koap-5.10',q);console.log('OK:',q,'→ КоАП 5.10');
  }
  for(const [q,id] of [
    ['доккументы','koap-5.1'],['парава','koap-5.1'],
    ['сплошная','koap-5.10'],['стоплиния','koap-7.2'],
    ['красный свет','koap-7.1'],['помеха справа','pdd-14.4.2'],
    ['сдал назад','koap-8.4'],['госномера','koap-5.3'],
    ['тонировка','koap-5.4'],['не пропустил пешехода','koap-15.4'],
    ['уехал с места дтп','koap-16.1']
  ]){
    const result=await search(q);assert.equal(firstId(result),id,q);console.log('OK:',q,'→',id);
  }
  let html=await search('70 000');assert.equal(firstId(html),'koap-17.5','Долг не должен ломаться');
  console.log('OK: debt 70000 → КоАП 17.5');
})().catch(e=>{console.error(e);process.exitCode=1});
