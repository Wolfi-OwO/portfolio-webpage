# Builds career variants B (horizontal) and C (compact rows) from the snapshot of variant A, so all three share the page shell and picker.
import os
os.chdir(os.path.dirname(os.path.abspath(__file__)) + '/..')
src=open('career-v7-a.html').read()
a=src.index('<div class="pw">'); z=src.index('</main>',a)
head,tail=src[:a],src[z:]
E=[('Volksschule','Volksschule Völkendorf','2013-09','2017-07',None),('AHS-Unterstufe','Peraugymnasium','2017-09','2021-07','_shared/logos/perau.png'),('Reife- und Diplomprüfung — Computer/Information Technology Administration and Management','HTL Villach','2021-09','2026-06','_shared/logos/htl-villach.png')]
W=[('Technischer IT-Support','2023-08','2023-08','_shared/logos/infineon.png','Infineon Technologies'),('Softwareingenieur:in','2024-07','2024-07','_shared/logos/infineon.png','Infineon Technologies'),('Softwareingenieur:in','2025-07','2025-08','_shared/logos/infineon.png','Infineon Technologies'),('Softwareingenieur:in','2026-07','2026-10','_shared/logos/infineon.png','Infineon Technologies'),('Soldat','2026-10',None,'_shared/logos/bundesheer.png','Österreichisches Bundesheer')]
LOGO='_shared/logos/infineon.png'
mo=lambda s:int(s[:4])*12+int(s[5:])-1
T0,T1=mo('2013-09'),mo('2026-10')+1
pct=lambda m:(m-T0)/(T1-T0)*100
xr=lambda m:(T1-m)/(T1-T0)*100  # mirrored: today at the left, oldest at the right
end=lambda z:(mo(z) if z else T1-1)+1
def img(l,cls=''): return '<img src="%s" alt="">'%l if l else '<span class="ini">VV</span>'
def lbl(a,z): return a+((' – '+z) if z and z!=a else ('' if z else ' – now'))
yrs=''.join('<span style="left:%s%%">%d</span>'%(max(xr(y*12+12),0),y) for y in range(2014,2027))+''.join('<em style="left:%s%%;width:%s%%">%s</em>'%(xr(m+1),100/(T1-T0),'JFMAMJJASOND'[m%12]) for m in range(T0,T1))
def bar(t,o,a,z,logo):
    l=xr(end(z)); r=xr(mo(a))
    return '<div class="gb" style="left:%s%%;width:%s%%">%s<span><b>%s</b><em>%s</em></span></div>'%(l,r-l,img(logo),t,o)
pins=''.join('<div class="gp" style="left:%s%%"><img src="%s" alt=""><small>%s<br>%s</small></div>'%((xr(mo(a))+xr(end(z)))/2,logo,t,lbl(a,z)) for t,a,z,logo,org in W)
CSSB="""<style>.gantt{position:relative;margin-top:26px;overflow-x:auto}.gantt>*{min-width:3000px}.gy{position:relative;height:44px;border-bottom:1px dashed var(--line)}.gy em{position:absolute;bottom:0;text-align:center;font:500 .55rem/18px 'JetBrains Mono',monospace;font-style:normal;color:var(--muted);border-left:1px solid color-mix(in srgb,var(--line) 60%,transparent)}.gy span{position:absolute;font:500 .7rem 'JetBrains Mono',monospace;color:var(--muted);transform:translateX(-50%)}.gl{margin-top:22px}.gl small{display:block;color:var(--accent);letter-spacing:.14em;text-transform:uppercase;margin-bottom:8px}.gtrack{position:relative;height:96px}.gtrack.pins{height:130px;margin-top:26px}.gb{position:absolute;top:0;height:96px;display:flex;align-items:center;gap:12px;padding:0 16px;border-radius:var(--r,22px);border:1px solid color-mix(in srgb,var(--accent) 40%,var(--line));background:linear-gradient(90deg,color-mix(in srgb,var(--accent) 18%,var(--surface)),color-mix(in srgb,var(--accent) 5%,var(--surface)));overflow:hidden}.gb img{width:44px;height:44px;border-radius:12px;background:#fff;padding:7px;flex:none}.gb b{display:block;font-size:.9rem;line-height:1.25}.gb em{font-style:normal;color:var(--muted);font-size:.8rem}.gp{position:absolute;top:0;transform:translateX(-50%);text-align:center;width:92px}.gp img{width:44px;height:44px;border-radius:50%;background:#fff;padding:7px;border:2px solid var(--accent)}.ini{display:inline-grid;place-items:center;width:44px;height:44px;border-radius:12px;background:#fff;color:#111;font:700 .8rem monospace;flex:none}.gp small{display:block;margin:6px 0 0;font-size:.66rem;line-height:1.3;color:var(--muted);letter-spacing:0;text-transform:none}.gp::before{content:'';position:absolute;left:50%;top:-26px;height:26px;border-left:2px solid var(--accent)}</style>"""
B='<div class="pw"><div class="page" style="padding:0;max-width:1100px"><div class="gantt"><div class="gy">'+yrs+'</div><div class="gl"><small class="mono">Education</small><div class="gtrack">'+bar(*E[0])+bar(*E[1])+bar(*E[2])+'</div></div><div class="gl"><small class="mono">Work</small><div class="gtrack pins">'+pins+'</div></div></div></div></div>'+CSSB
open('career-v7-b.html','w').write(head+B+tail)
rows=[(t,o,a,z,l,'education') for t,o,a,z,l in E]+[(t,org,a,z,logo,'work') for t,a,z,logo,org in W]
rows.sort(key=lambda r:r[2],reverse=True)
R=''
for t,o,a,z,l,k in rows:
    L=xr(end(z)); Rr=xr(mo(a))
    R+='<div class="cr">%s<div class="ct"><b>%s</b><em>%s · %s</em></div><div class="cb"><i class="%s" style="left:%s%%;width:%s%%"></i></div></div>'%(img(l),t,o,lbl(a,z),k,L,max(Rr-L,1.4))
CSSC="""<style>.cl{margin-top:24px;display:grid;gap:10px}.cax{display:flex;justify-content:space-between;padding-left:55%;font:500 .7rem 'JetBrains Mono',monospace;color:var(--muted)}.cr{display:grid;grid-template-columns:44px minmax(0,1fr) 45%;gap:14px;align-items:center;padding:12px 14px;border:1px solid var(--line);border-radius:var(--r-s,16px);background:var(--surface)}.ini{display:inline-grid;place-items:center;width:44px;height:44px;border-radius:12px;background:#fff;color:#111;font:700 .8rem monospace}.cr img{width:44px;height:44px;border-radius:12px;background:#fff;padding:7px}.ct b{display:block;font-size:.9rem;line-height:1.25}.ct em{font-style:normal;color:var(--muted);font-size:.78rem}.cb{position:relative;height:14px;border-radius:99px;background:var(--surface-2)}.cb i{position:absolute;top:0;bottom:0;border-radius:99px}.cb i.education{background:var(--accent)}.cb i.work{background:var(--live)}@media(max-width:640px){.cr{grid-template-columns:36px 1fr}.cb{grid-column:1/-1}.cax{display:none}}</style>"""
C='<div class="pw"><div class="page" style="padding:0;max-width:1000px"><div class="cl"><div class="cax"><span>today</span><span>2024</span><span>2021</span><span>2018</span><span>2013</span></div>'+R+'</div></div></div>'+CSSC
open('career-v7-c.html','w').write(head+C+tail)
