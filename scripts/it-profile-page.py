"""Second-page professional statement, executed by the IT resume generator."""
doc[0].insert_text((533, 820), '1 / 2', fontsize=8, fontname='helv', color=WHITE)
p2 = doc.new_page(width=595.5, height=842.25)
p2.draw_rect(p2.rect, color=None, fill=WHITE)
p2.draw_rect(fitz.Rect(-2, -2, 606, 104), color=None, fill=NAVY)
p2.draw_rect(fitz.Rect(-2, 104, 606, 108), color=None, fill=RED)
p2.insert_text((44, 53), 'THAVON PHANTHAMALAY', fontsize=23, fontname='hebo', color=WHITE)
p2.insert_text((44, 78), 'IT PROFESSIONAL', fontsize=12, fontname='hebo', color=WHITE)
p2.insert_text((44, 144), 'PROFESSIONAL STATEMENT', fontsize=16, fontname='hebo', color=RED)

paragraphs = [
    "Science in computer and community service has fascinated me since I was a young boy. Born and raised by technology and others, I have been inspired to live for information technology and people. Moreover, I thoroughly enjoy tasks that require membership responsibility and leadership skills. I am very eager to combine these skills with my interest in technology management and an emphasis on gathering development.",
    "I graduated from the National University of Laos, Faculty of Engineering, where the undergraduate curriculum in information technology introduced me to a wide variety of engineering subjects and provided me with a strong footing in the theoretical concepts of computer science. In my final proposal, I and two other friends completed a bachelor's degree together on the topic of an assessment system for outstanding teachers. Our final project has helped develop a convenient and detailed evaluation of the outstanding teachers using the information technology system to help, and that project has earned us a certificate of honor for developing an outstanding system.",
    "Following my internships at Digital Monkey Laos and Digital Classifieds Laos, I worked at Occupation Health Checkup at Mittaphab Hospital in IT for 2 years. There I learned about the Laboratory Information Management System (LIMS), patient registration, IT support, and working as a professional across the country of Laos, which was very exciting and challenging.",
    "Shortly after, I desired to level up my career at CBF Pharma. I was responsible for the IT system: setting up workstations with computer devices, configuring software functions, maintaining and ensuring the security of local networks, liaising with the LIMS Vietnam team, providing onsite service, and making remote calls for LIMS users in hospitals in Mahosot, Child, and Luangprabang. After a year, it was with a heavy heart that I submitted my resignation letter for personal reasons. Although I enjoyed my time, I felt that I had different goals from the company; it was time for me to move on to the next chapter of my life.",
    "For a while, I took a gap year to take a break from work. Through that time, I lived with my family, improved my skills in language studies, and researched technologies to find my dream job.",
    "A year following a break from an IT role, I jumped back and revised everything. I started working at IQURI Tech as a core banking system administrator for FINA Fintech. My role is to configure the systems' software, support the product's functionality, test digital software, monitor issues and solve them on the systems, train end users, run batch and backup databases, work closely with the project manager, liaise with application vendors, and provide ongoing support to the relevant business to prepare a new environment for development.",
    "Overall, I am very intense about adopting and learning new technologies in order to understand different computer concepts, because many companies need the concept of computer science. Besides, I feel I am responsible for making a big move in this field, and this job will give me a big chance to be someone who is wanted by the high-tech generation. Maybe this is a new thing for me; I need time to understand and work. I believe my qualifications and your needs would be an excellent fit. I will be happy to provide any further information or documents if required. I look forward to your positive response.",
]
body = '\n\n'.join(paragraphs)
box = fitz.Rect(44, 164, 551.5, 765)
for font_size in (10.5, 10.25, 10, 9.75):
    shape = p2.new_shape()
    spare = shape.insert_textbox(box, body, fontsize=font_size, fontname='helv', color=NAVY, lineheight=1.28, align=fitz.TEXT_ALIGN_JUSTIFY)
    if spare >= 0:
        shape.commit()
        break
else:
    raise ValueError('Professional statement does not fit on page two.')
p2.draw_line((44, 801), (551, 801), color=RED, width=1)
p2.insert_text((44, 820), 'THAVON PHANTHAMALAY  |  IT PROFESSIONAL', fontsize=8, fontname='helv', color=NAVY)
p2.insert_text((533, 820), '2 / 2', fontsize=8, fontname='helv', color=NAVY)
(ROOT / 'tmp/pdfs').mkdir(parents=True, exist_ok=True)
p2.get_pixmap(matrix=fitz.Matrix(1.6, 1.6)).save(ROOT / 'tmp/pdfs/it-profile-page.png')
print(f'Statement font size: {font_size}; remaining space: {spare:.1f} pt')
p = doc[0]
