#!/usr/bin/env python3
"""Построение статического поискового индекса по четырём публичным темам форума.

Запуск: python scripts/update_laws.py
Офлайн-импорт: python scripts/update_laws.py --input-dir imports
Форумный HTML не загружается в браузере посетителя: данные заранее извлекаются в JSON.
"""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
from pathlib import Path
import json
import re
import sys
import time

import requests
from bs4 import BeautifulSoup, NavigableString

ROOT = Path(__file__).resolve().parents[1]
DATA_FILE = ROOT / 'data' / 'laws.json'
MINIMUMS = {'koap': 75, 'pdd': 90, 'uk': 35, 'fzop': 65}
CRITICAL = {
    'koap': {'5.1', '8.1', '9.1', '11.1', '17.4', '17.5', '17.6'},
    'pdd': {'9.1', '10.1', '13.3'},
    'uk': {'4.1', '5.8'},
    'fzop': {'2.3', '4.8'},
}
ARTICLE_RE = re.compile(r'^Статья\s+(\d+(?:\.\d+){1,3})\s*\.\s*(.*)$', re.I)
PDD_RE = re.compile(r'^(\d+(?:\.\d+){1,3})\s*\.\s+(.+)$')
FZOP_RE = re.compile(r'^\[(\d+(?:\.\d+)*)\]\s*(.*)$')
CHAPTER_RE = re.compile(r'^\s*(?:(?:Глава\s+(?:[IVX]+|\d+))|(?:\d+\.\s+[^\d]))', re.I)


def normalize_line(s: str) -> str:
    return re.sub(r'\s+', ' ', s.replace('\xa0', ' ')).strip()


def content_lines(raw_html: str) -> list[str]:
    soup = BeautifulSoup(raw_html, 'html.parser')
    # Invision Community: текст самой первой записи в теме, не меню сайта и не ответы.
    post = (soup.select_one('article[data-commentid]') or
            soup.select_one('article.ipsComment') or
            soup.select_one('[data-role="commentContent"]') or
            soup.select_one('div.cPost') or
            soup)
    body = (post.select_one('[data-role="commentContent"]') or
            post.select_one('.ipsType_richText') or
            post.select_one('.cPost_contentWrap') or
            post)
    for element in body.select('script, style, nav, .ipsSpoiler_header, .ipsEmbedded, .ipsQuote, blockquote'):
        element.decompose()
    for br in list(body.find_all('br')):
        br.replace_with(NavigableString('\n'))
    for element in list(body.find_all(['p', 'div', 'li', 'h2', 'h3', 'h4', 'tr', 'section'])):
        element.insert_before(NavigableString('\n'))
        element.insert_after(NavigableString('\n'))
    text = body.get_text(' ', strip=False).replace('\r', '')
    text = re.sub(r'(?<=\.)\s+(?=Статья\s+\d+\.)', '\n', text)
    lines = [normalize_line(x) for x in text.splitlines()]
    return [x for x in lines if x and x not in ('Спойлер', '***')]


def parse_sections(lines: list[str], source: str) -> list[dict]:
    pattern = ARTICLE_RE if source in ('koap', 'uk') else PDD_RE if source == 'pdd' else FZOP_RE
    sections = []
    current = None
    chapter = ''
    started = False
    for line in lines:
        # Заголовки глав не воспринимаем как статьи, но запоминаем для карточек.
        if CHAPTER_RE.match(line) and (line.lower().startswith('глава ') or
                                       (source == 'pdd' and re.match(r'^\d+\.\s+\D', line))):
            chapter = line[:130]
        match = pattern.match(line)
        if match:
            num, rest = match.group(1), match.group(2)
            # FZoP пункты первого раздела иногда оформлены только [1], [2] и т.д.
            if source == 'fzop' and not rest:
                continue
            if current:
                sections.append(current)
            current = {'number':num, 'parts':[rest] if rest else [], 'chapter':chapter}
            started = True
        elif current and started:
            if line in ('Поделиться сообщением', 'Ссылка на сообщение', 'Эта тема закрыта для публикации ответов.'):
                break
            if len(line) <= 140 and line.startswith(('Изменено ', 'Последняя редакция:', 'Принят:')):
                continue
            current['parts'].append(line)
    if current:
        sections.append(current)

    output = []
    seen = set()
    for sec in sections:
        num = sec['number']
        if num in seen:
            continue
        seen.add(num)
        text = normalize_line(' '.join(sec['parts']))
        if len(text) < 8:
            continue
        text = text[:15000]
        sentence = re.split(r'(?<=[.!?])\s+(?=[А-ЯЁ])', text)[0]
        sentence = re.sub(r'\s*(?:Штраф|Арест сроком|Предупреждение или штраф|Предупреждение\.)\b.*$', '', sentence, flags=re.I)
        sentence = sentence[:155].rstrip(' ,;:.')
        sanction = ''
        if source in ('koap', 'uk'):
            sanction_match = re.search(r'\b(?:Предупреждение|Штраф|Арест\s+сроком|Административный\s+арест)\b', text, flags=re.I)
            if sanction_match:
                # Деление по точке с пробелом, не по разрядам 20.000.
                tail = text[sanction_match.start():]
                sanction = re.split(r'(?<!\d)\.\s+(?=[А-ЯЁ])', tail, maxsplit=1)[0][:230].strip()
        output.append({'id':f'{source}-{num}', 'source':source, 'number':num,
                       'title':sentence or f'Пункт {num}', 'summary':sentence or text[:170],
                       'text':text, 'sanction':sanction, 'tags':'', 'chapter':sec['chapter'], 'imported':True})
    return output


def download(url: str) -> str:
    session = requests.Session()
    headers = {
        'User-Agent':'Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0',
        'Accept':'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language':'ru-RU,ru;q=0.9,en-US;q=0.6',
    }
    last = None
    for attempt in range(3):
        try:
            response = session.get(url, headers=headers, timeout=35)
            response.raise_for_status()
            response.encoding = response.apparent_encoding if response.encoding is None else response.encoding
            if len(response.content) < 15000:
                raise ValueError(f'Слишком маленькая страница: {len(response.content)} байт')
            return response.text
        except (requests.RequestException, ValueError) as err:
            last = err
            if attempt < 2:
                time.sleep(2 * (attempt + 1))
    raise RuntimeError(f'Не удалось загрузить форум: {last}')


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--input-dir', type=Path, help='HTML-файлы koap.html, pdd.html, uk.html, fzop.html вместо онлайн-загрузки')
    parser.add_argument('--strict', action='store_true', help='Завершиться с ошибкой при неполном импорте')
    args = parser.parse_args()

    old = json.loads(DATA_FILE.read_text(encoding='utf-8'))
    sources = old['sources']
    old_by_source = {key:[r for r in old['items'] if r['source'] == key] for key in sources}
    old_by_id = {row['id']:row for row in old['items']}
    assembled, statuses = [], {}
    success = 0
    for key, meta in sources.items():
        try:
            if args.input_dir:
                path = args.input_dir / f'{key}.html'
                html = path.read_text(encoding='utf-8')
            else:
                html = download(meta['url'])
            parsed = parse_sections(content_lines(html), key)
            numbers = {entry['number'] for entry in parsed}
            missing = CRITICAL[key] - numbers
            if len(parsed) < MINIMUMS[key] or missing:
                raise ValueError(f'Ненадёжный разбор: получено {len(parsed)}, минимум {MINIMUMS[key]}, отсутствуют {sorted(missing)}')
            # Для знакомых статей сохраняем короткое, проверенное описание и бытовые синонимы,
            # но всегда подставляем полный свежий текст для поиска и цитирования.
            for row in parsed:
                prior = old_by_id.get(row['id'])
                if prior and prior.get('tags'):
                    row['tags'] = prior['tags']
                    row['title'] = prior['title']
                if prior and prior.get('say'):
                    row['say'] = prior['say']
                if key in ('koap', 'uk') and not row['sanction'] and prior:
                    row['sanction'] = prior.get('sanction', '')
            assembled.extend(parsed)
            success += 1
            statuses[key] = {'status':'full', 'count':len(parsed)}
            print(f'✓ {meta["short"]}: {len(parsed)} пунктов')
        except Exception as err:
            fallback = old_by_source[key]
            assembled.extend(fallback)
            statuses[key] = {'status':'starter' if old.get('mode') == 'starter' else 'cached', 'count':len(fallback), 'error':str(err)[:180]}
            print(f'! {meta["short"]}: {err}. Сохранено {len(fallback)} прежних записей.', file=sys.stderr)

    if not success:
        print('Обновление не выполнено: сохранён исходный JSON.', file=sys.stderr)
        return 1
    result = {'schema':1, 'mode':'full' if success == 4 else 'mixed',
              'updatedAt':datetime.now(timezone.utc).strftime('%Y-%m-%d'),
              'sources':sources, 'status':statuses, 'items':assembled}
    temp = DATA_FILE.with_suffix('.json.tmp')
    temp.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    temp.replace(DATA_FILE)
    (DATA_FILE.parent/'laws.js').write_text('window.PROVINCE_LAWS = '+json.dumps(result,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8')
    print(f'✓ Индекс: {len(assembled)} пунктов. Режим: {result["mode"]}')
    if args.strict and success < 4:
        return 1
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
