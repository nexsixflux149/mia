import json,itertools,collections,math
from pathlib import Path
p=Path(__file__).resolve().parents[1]/'server/arcade-puzzles-021-040.js'
bank=json.loads(p.read_text(encoding='utf8').split('export default ',1)[1].strip().removesuffix(';')); by={q['id']:q for q in bank}
def expect(i,answers):
 assert set(map(str,answers))=={by[i]['answer']},(i,answers,by[i]['answer'])
def subsets(items):
 for n in range(len(items)+1):yield from itertools.combinations(items,n)
def bfs(start,neighbors,goal):
 seen={start};queue=collections.deque([(start,0)])
 while queue:
  s,d=queue.popleft()
  if goal(s):return d
  for nxt in neighbors(s):
   if nxt not in seen:seen.add(nxt);queue.append((nxt,d+1))
 raise AssertionError('No solution')
expect(21,[1+max(sum(a) for a in itertools.product(range(9),repeat=3) if max(a)<2)])
expect(22,[len(set(range(12))|set(range(8,17)))])
expect(23,[next(n for n in range(10) if 2**n>=16)])
edges=[('S','A',2),('S','B',5),('A','B',1),('A','T',7),('B','T',2)]
routes=[]
def walk(path,cost):
 if path[-1]=='T':routes.append((cost,path));return
 for a,b,w in edges:
  if path[-1]==b:a,b=b,a
  if path[-1]==a and b not in path:walk(path+b,cost+w)
walk('S',0);expect(24,[path for cost,path in routes if cost==min(x[0] for x in routes)])
ends=[]
def euler(at,edges):
 if not edges:ends.append(at)
 for i,(a,b) in enumerate(edges):
  if at in (a,b):euler(b if at==a else a,edges[:i]+edges[i+1:])
euler('A',[('A','B'),('B','C'),('C','A'),('A','D')]);expect(25,ends)
flows=[]
for sa,sb,at,bt,ab in itertools.product(range(5),range(4),range(3),range(5),range(2)):
 if sa==at+ab and sb+ab==bt:flows.append(at+bt)
expect(26,[max(flows)])
edges=[('A','B',1),('B','C',2),('C','D',3),('A','C',5),('B','D',6),('A','D',8)]
costs=[]
for sub in subsets(edges):
 seen={'A'}
 for _ in range(4):
  for a,b,w in sub:
   if a in seen or b in seen:seen|={a,b}
 if len(seen)==4:costs.append(sum(w for a,b,w in sub))
expect(27,[min(costs)])
allowed={'A':{1,2},'B':{2},'C':{1,3}}
expect(28,[''.join(order) for order in itertools.permutations('ABC') if all(i in allowed[k] for i,k in enumerate(order,1))])
jobs={'A':(1,4),'B':(3,5),'C':(4,6),'D':(5,7),'E':(6,8)}
valid=[]
for sub in subsets(list(jobs)):
 times=[jobs[k] for k in sub]
 if all(b<=c or d<=a for (a,b),(c,d) in itertools.combinations(times,2)):valid.append(''.join(sub))
expect(29,[s for s in valid if len(s)==max(map(len,valid))])
tools={'A':{1,2,3},'B':{3,4},'C':{4,5,6},'D':{1,5},'E':{2,6}}
valid=[''.join(sub) for sub in subsets(list(tools)) if set().union(*(tools[k] for k in sub))==set(range(1,7))]
expect(30,[s for s in valid if len(s)==min(map(len,valid))])
packs={'A':(2,3),'B':(3,5),'C':(4,6),'D':(5,7)}
valid=[(sum(packs[k][1] for k in sub),''.join(sub)) for sub in subsets(list(packs)) if sum(packs[k][0] for k in sub)<=7]
expect(31,[s for value,s in valid if value==max(v for v,s in valid)])
def runs(row):return [len(list(g)) for k,g in itertools.groupby(row) if k]
valid=[]
for bits in itertools.product([0,1],repeat=9):
 if [runs(bits[i:i+3]) for i in (0,3,6)]==[[1,1],[3],[1]] and [runs(bits[i::3]) for i in range(3)]==[[2],[2],[2]]:valid.append(''.join(map(str,bits)))
expect(32,valid)
valid=[]
for bits in itertools.product([0,1],repeat=4):
 if [bits[i]+bits[i+1] for i in range(3)]==[1,2,1]:valid.append(''.join(str(2*i+1) for i,v in enumerate(bits) if v))
expect(33,valid)
valid=[]
for rows in itertools.product(list(itertools.permutations([1,2,3])),repeat=3):
 if rows[0]!=(1,2,3)or rows[1][0]!=2 or rows[2][2]!=2:continue
 if all(len({rows[r][c] for r in range(3)})==3 for c in range(3)):valid.append(''.join(map(str,rows[1])))
expect(34,valid)
def seen(row):return sum(v>max(row[:i],default=0) for i,v in enumerate(row))
expect(35,[''.join(map(str,a)) for a in itertools.permutations(range(1,5)) if a[0]==2 and a[1]<a[2] and seen(a)==3 and seen(a[::-1])==1])
def jug(s):
 a,b=s;x=min(a,3-b);y=min(b,5-a)
 return [(5,b),(a,3),(0,b),(a,0),(a-x,b+x),(a+y,b-y)]
expect(36,[bfs((0,0),jug,lambda s:s[0]==4)])
def cross(s):
 for cargo in [None,1,2,3]:
  if cargo and s[cargo]!=s[0]:continue
  n=list(s);n[0]^=1
  if cargo:n[cargo]^=1
  if any(n[a]==n[b]!=n[0] for a,b in [(1,2),(2,3)]):continue
  yield tuple(n)
expect(37,[bfs((0,0,0,0),cross,lambda s:all(s))])
def ice(s):
 for dr,dc in [(1,0),(-1,0),(0,1),(0,-1)]:
  r,c=s
  while 1<=r+dr<=4 and 1<=c+dc<=4 and (r+dr,c+dc)not in [(1,3),(3,2)]:r+=dr;c+=dc
  if (r,c)!=s:yield r,c
expect(38,[bfs((1,1),ice,lambda s:s==(4,4))])
top,bot,front,back,right,left='AFBECD'
for direction in 'FRF':
 if direction=='F':top,front,bot,back=back,top,front,bot
 else:top,right,bot,left=left,top,right,bot
expect(39,[top])
states={frozenset([1,2,4])}
for _ in range(2):
 states={frozenset((s-{i,i+d})|{i+2*d}) for s in states for i in s for d in [-1,1] if i+d in s and 1<=i+2*d<=5 and i+2*d not in s}
expect(40,[''.join(map(str,sorted({next(iter(s)) for s in states if len(s)==1})))])
assert len({x['principle']for x in bank})==20
print('PASS: independently solved 20 new puzzles. Exhaustive path/assignment/board/state checks where applicable. No claim of 1,000 distinct principles.')
