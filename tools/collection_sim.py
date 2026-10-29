"""Monte-Carlo of how fast the 48-squishy collection fills up (box odds, Rare guarantee, Spare Shelf levels, Sparkly 1 in 50).
Run: python3 tools/collection_sim.py   (numbers are quoted in the guide, section #collection)"""
import random, statistics as st
N={'C':16,'U':8,'R':8,'E':8,'L':8}; O=[('L',1),('E',6),('R',13),('U',25),('C',55)]
NEED={'C':11,'U':11,'R':7,'E':7,'L':5}
def run():
    cnt={}; spark=set(); pity=0; b=0; m={}
    ids=[(r,i) for r in N for i in range(N[r])]
    while True:
        b+=1; x=random.random()*100; r='C'
        for k,o in O:
            if x<o: r=k;break
            x-=o
        if pity>=9 and r in 'CU': r='R'
        pity = pity+1 if r in 'CU' else 0
        q=(r,random.randrange(N[r])); cnt[q]=cnt.get(q,0)+1
        if random.random()<1/50: spark.add(q)
        if cnt[q]>=NEED[r]: spark.add(q)
        if 'all' not in m and len(cnt)==48: m['all']=b
        if 'h' not in m and len(spark)>=24: m['h']=b
        if 'C' not in m and all(cnt.get(('C',i),0)>=11 or ('C',i) in spark for i in range(16)) : m['C']=b
        if len(spark)==48: m['spark']=b; return m
R=[run() for _ in range(150)]
for k in ['all','C','h','spark']:
    v=st.median([r[k] for r in R]); print(k, v, 'boxes', round(v*200/35/60,1),'h', round(v*200/35/30),'days@30min')
