"""Build the red, navy, and white resume from the supplied style reference."""
from pathlib import Path
import pymupdf as fitz

ROOT = Path(__file__).resolve().parents[1]
original = fitz.open(ROOT / 'scripts/resources/Thavon_Resume.original.pdf')
doc = fitz.open()
p = doc.new_page(width=595.5, height=842.25)
NAVY = (0.0157, 0.102, 0.251)
RED = (0.82, 0.018, 0.075)
WHITE = (1, 1, 1)
p.draw_rect(p.rect, color=None, fill=WHITE)
p.draw_rect(fitz.Rect(0, 0, 220, 842.25), color=None, fill=NAVY)

def curve(points, fill):
    s = p.new_shape()
    s.draw_bezier(*[fitz.Point(*pt) for pt in points[:4]])
    for pt in points[4:]:
        s.draw_line(s.last_point, fitz.Point(*pt))
    s.finish(fill=fill, color=None, closePath=True)
    s.commit()

# Curved ribbons stay outside the text columns.
def top_ribbon():
    # Both edges use cubic curves; straight closure stays outside the page.
    navy = p.new_shape()
    navy.draw_line((220, -2), (606, -2))
    navy.draw_line((606, -2), (606, 36))
    navy.draw_bezier((606, 36), (488, -5), (387, 11), (220, 10))
    navy.finish(fill=NAVY, color=None, closePath=True)
    navy.commit()
    red = p.new_shape()
    red.draw_bezier((350, 15), (451, 7), (535, 17), (606, 47))
    red.draw_line((606, 47), (606, 74))
    red.draw_bezier((606, 74), (537, 27), (454, 16), (350, 15))
    red.finish(fill=RED, color=None, closePath=True)
    red.commit()

top_ribbon()
curve([(220, 831), (355, 834), (486, 742), (606, 713), (606, 852), (220, 852)], RED)
curve([(220, 837), (358, 838), (484, 765), (606, 739), (606, 852), (220, 852)], WHITE)
curve([(220, 842), (358, 843), (484, 773), (606, 747), (606, 852), (220, 852)], NAVY)

def text(x, y, value, size=10.5, bold=False, color=NAVY, width=None, leading=None):
    font = 'hebo' if bold else 'helv'
    leading = leading or size * 1.25
    lines = []
    for para in value.split('\n'):
        line = ''
        for word in para.split():
            test = (line + ' ' + word).strip()
            if width and fitz.get_text_length(test, fontname=font, fontsize=size) > width and line:
                lines.append(line)
                line = word
            else:
                line = test
        lines.append(line)
    for line in lines:
        p.insert_text((x, y), line, fontsize=size, fontname=font, color=color)
        y += leading
    return y

def heading(x, y, title, sidebar=False):
    size = 20 if sidebar else 22
    if sidebar:
        size = min(size, 160 / fitz.get_text_length(title, fontname='hebo', fontsize=1))
    text(x, y, title, size, True, WHITE if sidebar else RED)
    end = 188 if sidebar else x + fitz.get_text_length(title, fontname='hebo', fontsize=size)
    p.draw_line((x, y + 8), (end, y + 8), color=RED, width=1.5)

# Portrait with a white mat and red offset frame.
p.draw_rect(fitz.Rect(58, 44, 171, 179), color=None, fill=RED)
p.draw_rect(fitz.Rect(54, 40, 167, 175), color=None, fill=WHITE)
p.insert_image(fitz.Rect(58, 44, 163, 171), stream=original.extract_image(91)['image'])

heading(30, 211, 'PERSONAL DETAIL', True)
for y, label, value in [(237, 'Gender:', 'Male'), (253, 'Nationality:', 'Laos'), (269, 'Marital status:', 'Single')]:
    text(30, y, label, 10.5, True, WHITE)
    offset = fitz.get_text_length(label + ' ', fontname='hebo', fontsize=10.5)
    text(30 + offset, y, value, 10.5, color=WHITE)

heading(30, 307, 'MY CONTACT', True)
def vector_icon(rect, paths):
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">{paths}</svg>'
    with fitz.open(stream=svg.encode(), filetype='svg') as icon:
        with fitz.open(stream=icon.convert_to_pdf(), filetype='pdf') as vector:
            p.show_pdf_page(fitz.Rect(rect), vector, 0)

def envelope(x, y):
    vector_icon((28, 410, 46, 428), '<g fill="none" stroke="white" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4.5" width="20" height="15" rx="1"/><path d="m3 6 9 7 9-7M3 18l6-6m12 6-6-6"/></g>')
def pin(x, y):
    vector_icon((28, 334, 46, 355), '<path fill="white" fill-rule="evenodd" d="M12 1.5a8 8 0 0 0-8 8c0 5.8 8 13 8 13s8-7.2 8-13a8 8 0 0 0-8-8Zm0 4.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7Z"/>')
vector_icon((28, 384, 46, 402), '<circle cx="12" cy="12" r="10.6" fill="none" stroke="white" stroke-width="1.5"/><path transform="translate(3 3) scale(.75)" fill="white" d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.61 21 3 13.39 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1.02z"/>')
text(53, 397, '+856 20 99 306 412', 10.5, color=WHITE)
envelope(30, 360)
text(53, 422, 'thavonptml@gmail.com', 10, color=WHITE)
pin(30, 386)
text(53, 344, 'Parkhaed Village,\nNaxaythong District,\nVientiane Capital, Laos', 10.5, color=WHITE, leading=14)
linkedin_svg = (ROOT / 'src/assets/LinkedIn.svg').read_text().replace('#FFF', '#041A40').replace('#007EBB', '#FFFFFF')
with fitz.open(stream=linkedin_svg.encode(), filetype='svg') as icon:
    with fitz.open(stream=icon.convert_to_pdf(), filetype='pdf') as vector:
        p.show_pdf_page(fitz.Rect(29, 433, 46, 450), vector, 0)
text(53, 446, 'LinkedIn:', 10.5, color=WHITE)
linkedin_url = 'https://www.linkedin.com/in/hei-thavon-2051b3274/'
for baseline, label in [(461, 'https://www.linkedin.com/'), (473, 'in/hei-thavon-2051b3274/')]:
    text(53, baseline, label, 9.5, color=WHITE)
    end = 53 + fitz.get_text_length(label, fontname='helv', fontsize=9.5)
    p.draw_line((53, baseline+2), (end, baseline+2), color=WHITE, width=.5)
    p.insert_link({'kind':fitz.LINK_URI, 'from':fitz.Rect(53,baseline-10,end,baseline+3), 'uri':linkedin_url})
vector_icon((28, 487, 46, 505), '<path fill="white" d="M7 6h10a4 4 0 0 1 3.8 2.8l1.1 6a2.7 2.7 0 0 1-4.5 2.5L15 15H9l-2.4 2.3a2.7 2.7 0 0 1-4.5-2.5l1.1-6A4 4 0 0 1 7 6Z"/><path d="M7 9v5m-2.5-2.5h5" fill="none" stroke="#041A40" stroke-width="1.5" stroke-linecap="round"/><circle cx="16" cy="10" r="1" fill="#041A40"/><circle cx="18.5" cy="12.5" r="1" fill="#041A40"/>')
text(53, 501, 'Game Portfolio', 10.5, color=WHITE)
p.draw_line((53,504), (121,504), color=WHITE, width=.5)
p.insert_link({'kind':fitz.LINK_URI, 'from':fitz.Rect(53,489,140,506), 'uri':'https://thavon91.github.io/web-portfolio/'})

heading(30, 540, 'EXPERTISE', True)
def bullet(y, value):
    p.draw_circle((34, y-3), 2.4, color=None, fill=RED)
    return text(47, y, value, 10.3, color=WHITE, width=154, leading=14)
y = 566
for item in ['Database Administrator', 'IT Technical Support', 'Digital Assistant: Server, Application, and Client', 'LAN, LIMS, and Core Banking', 'Game Developer']:
    y = bullet(y, item) + 7
heading(30, 706, 'LANGUAGE', True)
y = 732
for item in ['Native Lao', 'Advanced Thai', 'Intermediate English', 'Junior C++, SQL, and JavaScript']:
    y = bullet(y, item) + 7

x = 238
name = 'THAVON PHANTHAMALAY'
size = min(22, 335 / fitz.get_text_length(name, fontname='hebo', fontsize=1))
text(x, 73, name, size, True, RED)
p.draw_line((x,81),(574,81),color=RED,width=1)
text(x, 99, 'An IT technician with 5 years of experience\nin hardware and software systems', 11.5, width=336, leading=15)
heading(x, 151, 'ABOUT MYSELF')
text(x, 176, 'I am a person of self-motivation, positive relationships, and high responsibility. I can work in provincial countries and abroad. In my spare time, I enjoy exercising, listening to music, and learning languages. I also love using the internet to research information and new challenges for a prosperous future.', 10.3, width=335, leading=13)

heading(x, 264, 'EXPERIENCE')
entries = [
 ('2024 - Present, FINA Fintech x iQURi Tech', 'IT Core and Digital Banking System', 'https://finafintech.com/'),
 ('2021 - 2022, CBF Pharma Vientiane', 'IT LIMS Systems', 'https://cbfpharma.la/en/'),
 ('2019 - 2021, Occupation Health Checkup of Mittaphab Hospital', 'IT LIMS Support', 'https://www.facebook.com/healthcheckupcentre/'),
 ('22 August-22 November, 2018, Digital Classifieds Laos Sole', 'Digital Marketing Intern', 'https://www.yula.la/en'),
 ('01 May-30 July, 2017, Digital Monkey Laos', 'Digital Media Intern', 'https://www.digitalmonkey.la/'),
 ('2014 - 2018, Sabaidee Vientiane and Namphou Park Restaurants', 'Waiter', 'https://www.facebook.com/sabaideevientianelao/'),
]
y = 290
for title, role, url in entries:
    start = y
    y = text(x, y, title, 9.4, True, width=336, leading=12)
    p.insert_link({'kind':fitz.LINK_URI,'from':fitz.Rect(x,start-10,574,y-2),'uri':url})
    y = text(x, y, role, 10, leading=13) + 12

heading(x, 530, 'EDUCATION')
y = 556
for date, title, detail in [
 ('2014 - 2018', 'B.S in Information Technology', 'National University of Laos, Faculty of Engineering, Laos'),
 ('2007 - 2013', 'Lower and High Secondary Schools', 'Sanakham Village and Dongdok Village\nMonk High Secondary Schools'),
 ('2003 - 2007', 'Novice and Monk Buddhist Discipline', 'I left Lower Secondary School'),
 ('1998 - 2002', 'Primary School', 'Parkhaed Village Primary School'),
]:
    y = text(x, y, date, 10.5, True, leading=13)
    y = text(x, y, title, 10.5, True, leading=13)
    y = text(x, y, detail, 10, width=335, leading=13) + 17

doc.set_metadata({'title':'THAVON PHANTHAMALAY - Resume', 'author':'THAVON PHANTHAMALAY'})
target = ROOT / 'src/assets/pdf/Thavon_Resume.pdf'
doc.save(target, garbage=4, deflate=True)
preview = ROOT / 'tmp/pdfs/resume-styled.png'
preview.parent.mkdir(parents=True, exist_ok=True)
p.get_pixmap(matrix=fitz.Matrix(1.6,1.6)).save(preview)
print(target)
print(preview)
