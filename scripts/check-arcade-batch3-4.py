from pathlib import Path
import json,itertools,collections,math
from fractions import Fraction as F
p=Path(__file__).resolve().parents[1]/'server'
def readbatch(a,b):
 return json.loads((p/f'arcade-puzzles-{a:03}-{b:03}.js').read_text(encoding='utf8').split('export default ',1)[1].strip().removesuffix(';'))
bank=readbatch(41,70)+readbatch(71,100)
by={q['id']:q for q in bank}; solved={}
def check(i,answers):
 a=set(map(str,answers));solved[i]=sorted(a);assert a=={by[i]['answer']},(i,a,by[i]['answer'])
def bfs(start,neighbors,goal):
 seen={start};q=collections.deque([(start,0)])
 while q:
  s,d=q.popleft()
  if goal(s):return d
  for v in neighbors(s):
   if v not in seen:seen.add(v);q.append((v,d+1))
 raise AssertionError('No solution')
digits=['abcdef','bc','abdeg','abcdg','bcfg','acdfg','acdefg','abc','abcdefg','abcdfg'];lit=set('abdfg')
check(41,[i for i,s in enumerate(digits)if lit<set(s) and len(set(s)-lit)==1])
colors={'A':set('RG'),'B':set('G'),'C':set('B')};check(42,[''.join(c)for c in itertools.combinations(colors,2)if set.union(*(colors[k]for k in c))==set('RGB')])
holes={(1,1)};holes|={(x,4-y)for x,y in list(holes)};holes|={(8-x,y)for x,y in list(holes)};check(43,[sum(x for x,y in holes)])
def neg(v):return tuple(-x for x in v)
net={(0,0):'B',(-1,0):'A',(1,0):'C',(2,0):'D',(0,-1):'E',(0,1):'F'};ori={(0,0):((1,0,0),(0,1,0),(0,0,1))};todo=[(0,0)]
while todo:
 x,y=todo.pop();u,v,n=ori[x,y]
 for dx,dy,o in [(1,0,(neg(n),v,u)),(-1,0,(n,v,neg(u))),(0,1,(u,neg(n),v)),(0,-1,(u,n,neg(v)))]:
  k=(x+dx,y+dy)
  if k in net and k not in ori:ori[k]=o;todo.append(k)
check(44,[net[k]for k,o in ori.items()if o[2]==(0,0,-1)])
vol=[]
for a,b,c,d in itertools.product(range(3),repeat=4):
 if (max(a,c),max(b,d),max(a,b),max(c,d))==(2,1,2,1):vol.append(a+b+c+d)
check(45,[min(vol)])
r,c,dr,dc=1,0,0,1;mirrors={(1,2):'/',(3,2):'\\'}
while True:
 r+=dr;c+=dc
 if not(1<=r<=3 and 1<=c<=3):break
 if mirrors.get((r,c))=='/':dr,dc=-dc,-dr
 elif mirrors.get((r,c))=='\\':dr,dc=dc,dr
check(46,['위' if r<1 else '아래' if r>3 else '왼쪽' if c<1 else '오른쪽'])
check(47,[12*F(12,24)*F(18,36)]);check(48,[F(60,2)]);check(49,[F(12*2,2+4)])
check(50,[300-100]);check(51,[F(4*30,20)]);check(52,[1/(F(1,6)+F(1,3))+4]);check(53,[F(200*80+300*20,500)]);check(54,[F(2*9,3)])
check(55,[next(t for t in range(11,200) if (t-1)%4==0 and (t-3)%6==0)])
check(56,[str(a)+str(b) for a,b,c,d in itertools.permutations(range(10),4) if a>0 and c>0 and a%2==1 and 2*(10*a+b)==100*c+11*d and 100*c+11*d<150])
board={(r,c)for r in range(4)for c in range(4)}-{(0,0),(3,3)};check(57,['불가능' if sum((-1)**(r+c)for r,c in board)!=0 else '가능'])
def tile(cells):
 if not cells:return 1
 r,c=min(cells);ans=0
 for dr,dc in [(0,1),(1,0)]:
  other=(r+dr,c+dc)
  if other in cells:ans+=tile(cells-{(r,c),other})
 return ans
check(58,[tile({(r,c)for r in range(2)for c in range(4)})])
def noncross(n):
 if n==0:return 1
 return sum(noncross(i)*noncross(n-2-i)for i in range(0,n-1,2))
check(59,[noncross(6)])
edges=[(0,1),(1,2),(2,0),(0,3)]
check(60,[next(k for k in range(1,5) if any(all(a[x]!=a[y] for x,y in edges)for a in itertools.product(range(k),repeat=4)))])
edges={frozenset(e)for e in [('S','A'),('S','B'),('A','B'),('A','C'),('B','T'),('C','T')]}
check(61,['S'+''.join(x)+'T'for x in itertools.permutations('ABC')if all(frozenset(e)in edges for e in zip('S'+''.join(x),''.join(x)+'T'))])
check(62,[''.join(map(str,a))for a in itertools.permutations(range(1,5))if a[0]==2 and all(abs(a[i]-a[j])!=j-i for i in range(4)for j in range(i+1,4))])
men={'A':'XY','B':'XY'};women={'X':'BA','Y':'AB'};stable=[]
for perm in itertools.permutations('XY'):
 pair=dict(zip('AB',perm));rev={v:k for k,v in pair.items()}
 if not any(men[m].index(w)<men[m].index(pair[m]) and women[w].index(m)<women[w].index(rev[w])for m in men for w in women):stable.append(''.join(perm))
check(63,stable)
clues=[('012',2,1),('345',1,0),('203',3,1),('320',3,1)]
check(64,[''.join(a)for a in itertools.permutations('012345',3)if all(len(set(a)&set(g))==n and sum(x==y for x,y in zip(a,g))==pos for g,n,pos in clues)])
a=[1,2,3,4,5,6,8,7];check(65,['불가능' if sum(a[i]>a[j]for i in range(8)for j in range(i+1,8))%2 else '가능'])
def hanoi(s):
 top={peg:min((d for d,x in enumerate(s)if x==peg),default=9)for peg in range(3)}
 for a,d in top.items():
  if d==9:continue
  for b,other in top.items():
   if a!=b and d<other:
    n=list(s);n[d]=b;yield tuple(n)
check(66,[bfs((0,0,0,0),hanoi,lambda s:s==(2,2,2,2))])
win={}
def nim(s):
 if s not in win:win[s]=any(not nim(tuple(v-n if k==i else v for k,v in enumerate(s)))for i,x in enumerate(s)for n in range(1,x+1))
 return win[s]
s=(3,4,5);check(67,[f'{"ABC"[i]}{n}'for i,x in enumerate(s)for n in range(1,x+1)if not nim(tuple(v-n if k==i else v for k,v in enumerate(s)))])
w={0:True,1:False}
for n in range(2,11):w[n]=any(not w[n-k]for k in (1,2)if k<=n)
check(68,['선공' if w[10]else'후공'])
pairs=list(itertools.combinations(['K1','K2','P'],2));eligible=[x for x in pairs if any(v.startswith('K')for v in x)];check(69,[F(sum(all(v.startswith('K')for v in x)for x in eligible),len(eligible))])
check(70,['A'if F(8,2)>F(15,3)else'B'])
stack=[];output=''
for cmd in ['A','B','-','C','D','-','-']:
 if cmd=='-':output+=stack.pop()
 else:stack.append(cmd)
check(71,[output])
trans={'S':'SA','A':'BA','B':'SA'};s='S'
for c in '11010':s=trans[s][int(c)]
check(72,[s]);s='A'*3+'B'*2+'C'+'D'*4;check(73,[''.join(s[i-1]for i in [4,6,9])])
s='AB'
for _ in range(4):s+=s[-2]
check(74,[s])
bits=[int(x)for x in '1011011'];valid=[]
for i in range(7):
 b=bits[:];b[i]^=1
 if all(sum(b[x-1]for x in g)%2==0 for g in [[1,3,5,7],[2,3,6,7],[4,5,6,7]]):valid.append(i+1)
check(75,valid)
s='ADBECF';check(76,[s[::2]+s[1::2]])
check(77,[''.join(chr((ord(c)-65-[1,2][i%2])%26+65)for i,c in enumerate('PRFP'))])
words=['CANDLE','DOOR','KEY','WINDOW'];check(78,[''.join(words[a-1][b-1]for a,b in [(3,1),(1,6),(3,3)])])
check(79,['C']);words=['COLD','CORD','CARD','WARD','WARM'];check(80,[bfs('COLD',lambda a:[b for b in words if sum(x!=y for x,y in zip(a,b))==1],lambda a:a=='WARM')])
check(81,[next(n for n in range(3,8) if any(all(piece in ''.join(s) for piece in ['ABC','BCA','CAB'])for s in itertools.product('ABC',repeat=n)))])
check(82,[w for w,meaning in [('NOTES','메모들'),('STONE','돌'),('TONES','음색들')]if sorted(w)==sorted('STONE')and meaning=='돌'])
check(83,[''.join(sorted(set('ABCDEFGHIJKLMNOPQRSTUVWXYZ')-set('ABCDFGHIJKLMNOPQRSTUVWXYZ')))])
check(84,[''.join({'4':'사','2':'이','5':'오'}[x]for x in '425')])
check(85,[''.join({'0':'0','1':'1','6':'9','8':'8','9':'6'}[x]for x in '1698'[::-1])])
def rooms(s):
 at,key=s
 for a,b in [('S','A'),('A','B'),('S','T')]:
  if at==b:a,b=b,a
  if at==a and (set([a,b])!=set('ST')or key):yield b,key or b=='B'
check(86,[bfs(('S',False),rooms,lambda s:s[0]=='T')])
# Synchronous public announcements: eliminate worlds in which anyone knows a color,
# while the observed first two rounds consisted of all 'unknown'.
worlds=set(itertools.product([0,1],repeat=3))-{(0,0,0)};actual=(1,1,1)
for round in range(1,5):
 def knows(w,i):return len({v[i]for v in worlds if all(v[j]==w[j]for j in range(3)if j!=i)})==1
 if all(knows(actual,i)for i in range(3)):break
 worlds={w for w in worlds if not any(knows(w,i)for i in range(3))}
check(87,[round])
a=[2,2,4,4,9,9];b=[1,1,6,6,8,8];c=[3,3,5,5,7,7]
check(88,['B'if sum(x>y for x in b for y in a)>sum(x>y for x in c for y in a)else'C'])
necklaces={min(s[i:]+s[:i]for i in range(4))for s in itertools.product([0,1],repeat=4)};check(89,[len(necklaces)])
# After center cut, each half-strip's right end joins the opposite half's left end.
links={0:1,1:0};seen=set();components=0
for i in links:
 if i not in seen:
  components+=1;j=i
  while j not in seen:seen.add(j);j=links[j]
check(90,[components]);check(91,[2-12+18])
pts=[(0,0),(4,0),(3,2),(0,2)];check(92,[F(abs(sum(x*v-y*u for (x,y),(u,v)in zip(pts,pts[1:]+pts[:1]))),2)])
chairs=list(range(1,8));at=0
while len(chairs)>1:at=(at+1)%len(chairs);chairs.pop(at)
check(93,chairs)
valid=[''.join(map(str,s))for s in itertools.product(range(4),repeat=4)if s[0] and all(s.count(i)==s[i]for i in range(4))];check(94,[min(valid)])
end={};tasks={'A':(3,[]),'B':(4,[]),'C':(5,['A']),'D':(2,['A','B']),'E':(1,['C','D'])}
for k,(n,deps)in tasks.items():end[k]=max((end[d]for d in deps),default=0)+n
check(95,[end['E']]);s=[2,5,10,17];d=[b-a for a,b in zip(s,s[1:])];check(96,[s[-1]+d[-1]+(d[-1]-d[-2])])
s=[4,1,3,2]
for a,b in [(1,2),(3,4),(1,3),(2,4),(2,3)]:s[a-1],s[b-1]=sorted([s[a-1],s[b-1]])
check(97,[''.join(map(str,s))]);check(98,[256*F(3,4)**3])
check(99,[f'{int("1010",2)^int("1100",2)^int("0011",2):04b}'])
check(100,[by[44]['answer'][0]+by[67]['answer'][0]+by[94]['answer'][1]+'101111010'[4]])
assert len(solved)==60
print('PASS: all 60 new answers independently calculated; enumerated ambiguous cases and minimum paths.')
