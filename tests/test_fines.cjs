const fs = require('fs'), vm = require('vm'), assert = require('assert');
const original = JSON.parse(fs.readFileSync(__dirname + '/../data/laws.json', 'utf8'));
const data = structuredClone(original);
const fixtures = [
  ['range-dash', 'Штраф от 50 000 до 100 000 руб.'],
  ['range-thousands', 'Штраф от 50 до 100 тысяч рублей.'],
  ['range-dotted', 'Штраф 50.000–100.000 руб.'],
  ['range-short', 'Штраф 50–100 000 руб.'],
  ['range-explicit', 'Штраф от 50 тыс. до 100 тыс. руб.'],
  ['range-two-rubles', 'Штраф от 50 000 руб. до 100 000 руб.'],
  ['exact', 'Штраф 70 000 руб.'],
  ['cap', 'Штраф до 50 000 руб. или арест на 70 лет.'],
  ['minimum', 'Штраф от 80 000 руб.'],
  ['other-years', 'Штраф 30 000 руб. с лишением прав на 70 лет.'],
  ['no-money', 'Арест сроком 70 лет.'],
];
for (const [id, sanction] of fixtures) data.items.push({id:'koap-test-'+id, source:'koap', number:'77.'+(fixtures.findIndex(f=>f[0]===id)+1), title:'Тестовый состав '+id, summary:'Проверка поиска по штрафам', text:'Описание нарушения. '+sanction, sanction, tags:''});
function element(name) {
  const listeners = {};
  return {name, value:'', hidden:false, innerHTML:'', textContent:'', dataset:{},style:{}, firstChild:{textContent:''},
    setAttribute(){}, addEventListener(event,callback){listeners[event]=callback},
    fire(event,value){listeners[event]?.({target:{value}})}, focus(){},select(){},blur(){},scrollIntoView(){},
    classList:{add(){},remove(){},toggle(){},contains(){return false}},querySelector(){return element('child')}, querySelectorAll(){return []}
  };
}
const cache=new Map(), get=key=>{if(!cache.has(key))cache.set(key,element(key));return cache.get(key)};
const document={querySelector:get,querySelectorAll:()=>[],body:{dataset:{}},addEventListener(){}};
const context={document,window:{PROVINCE_LAWS:data},location:{protocol:'file:',search:'',href:'file:///test'},navigator:{clipboard:{writeText:async()=>{}}},history:{replaceState(){}},URLSearchParams,setTimeout,clearTimeout,console,localStorage:{getItem(){return null}}};
vm.runInNewContext(fs.readFileSync(__dirname+'/../assets/app.js','utf8'),context);
const input=get('#searchInput'),grid=get('#resultsGrid'),count=get('#resultCount'),caption=get('#resultsCaption');
async function search(q){input.fire('input',q);await new Promise(r=>setTimeout(r,135));return grid.innerHTML}
(async()=>{
  for(const q of ['наказание 70000','наказание 70 000','наказание 70.000','наказание 70,000','размер штрафа 70 000 рублей','взыскание 70 тыс.']) {
    const page=await search(q);
    for(const want of ['range-dash','range-thousands','range-dotted','range-short','range-explicit','range-two-rubles','test-exact']) {
      assert(page.includes(want),`Запрос ${q} не нашёл ${want}`);
    }
    for(const unwanted of ['test-cap','test-minimum','test-other-years','test-no-money']) {
      assert(!page.includes(unwanted),`Запрос ${q} ошибочно нашёл ${unwanted}`);
    }
    assert(caption.textContent.includes('по размеру взыскания'),q);
    console.log('OK',q,`→ ${count.textContent} подходящих записей`);
  }
  assert((await search('наказание 30 000')).includes('test-cap'));
  assert((await search('наказание 90000')).includes('test-minimum'));
  assert(!(await search('наказание 50000')).includes('test-minimum'));
  assert((await search('5.1')).includes('Статья 5.1'));
  assert(!(await search('наказание 700')).includes('test-exact'));
  assert(!(await search('70 000 штрафов')).includes('test-exact'));
  assert((await search('поворотник')).includes('Статья 8.1'));
  console.log('OK границы диапазонов, номер статьи и обычный поиск');
})().catch(e=>{console.error(e);process.exitCode=1});
