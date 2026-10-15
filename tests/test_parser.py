import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from update_laws import content_lines,parse_sections

def test_basic():
 html='''<body><header>Статья 999.9. Меню</header><article class="ipsComment" data-commentid="1"><div data-role="commentContent"><p>Глава 8. Маневрирование</p><p>Статья 8.1. Поворот без указателя. Штраф - 5.000 рублей.</p><p>Статья 8.2. Перестроение без преимущества. Штраф - 20.000 рублей.</p></div></article><footer>Статья 888.8. Подвал</footer></body>'''
 entries=parse_sections(content_lines(html),'koap')
 assert len(entries)==2, entries
 assert entries[0]['number']=='8.1'
 assert 'Поворот' in entries[0]['text']
 html2='<article data-commentid="1"><div data-role="commentContent"><p>9. Начало движения</p><p>9.1. Перед началом движения водитель включает указатель поворота.</p><p>9.2. Сигнал следует подавать заранее.</p></div></article>'
 entries=parse_sections(content_lines(html2),'pdd')
 assert len(entries)==2,entries
 html3='<article data-commentid="1"><div data-role="commentContent"><p>Глава II.</p><p>[2.3] Сотрудник обязан представиться.</p><p>[Исключение: погоня.]</p><p>[4.8] Открытие огня после 5 минут погони.</p></div></article>'
 entries=parse_sections(content_lines(html3),'fzop')
 assert len(entries)==2,entries
 assert entries[0]['number']=='2.3'
 assert 'Исключение' in entries[0]['text']
 print('parser smoke test passed')
if __name__=='__main__': test_basic()
