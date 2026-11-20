import os,time,json,socket,subprocess,tempfile,urllib.request,websocket
from pathlib import Path
root=Path(__file__).resolve().parents[1]
bank=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {ARCADE_PUZZLES} from './server/arcade-puzzles.js';process.stdout.write(JSON.stringify(ARCADE_PUZZLES));"],cwd=root).decode('utf8'))
with socket.socket() as s:s.bind(('127.0.0.1',0));port=s.getsockname()[1]
with tempfile.TemporaryDirectory(prefix='mia-arcade100-test-') as data:
 env={**os.environ,'PORT':str(port),'DATA_DIR':data,'DATABASE_URL':'','NODE_ENV':'test'}
 def start():
  p=subprocess.Popen(['node','server/index.js'],cwd=root,env=env,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,creationflags=getattr(subprocess,'CREATE_NO_WINDOW',0))
  for _ in range(100):
   try:urllib.request.urlopen(f'http://127.0.0.1:{port}/',timeout=.3);return p
   except Exception:time.sleep(.1)
  p.terminate();raise AssertionError('test server did not start')
 p=start();ws=None
 try:
  def connect():
   w=websocket.create_connection(f'ws://127.0.0.1:{port}/socket.io/?EIO=4&transport=websocket',timeout=10);assert w.recv().startswith('0');w.send('40')
   while not w.recv().startswith('40'):pass
   return w
  seq=0
  def call(event,*args):
   global seq
   seq+=1;ws.send('42'+str(seq)+json.dumps([event,*args],ensure_ascii=False))
   while True:
    r=ws.recv()
    if r=='2':ws.send('3');continue
    if r.startswith('43'+str(seq)+'['):return json.loads(r[2+len(str(seq)):])[0]
  ws=connect();login=call('hello',{'v':4,'name':'백문제검증','look':{}});assert 'account'in login,login;account=login['account']
  assert 'error'in call('arcade:question',100)
  for q in bank:
   view=call('arcade:question',q['id']);assert 'answer'not in view['puzzle']
   result=call('arcade:answer',{'id':q['id'],'answer':q['answer']});assert result.get('correct'),(q['id'],result)
   assert result['state']['percent']==q['id']
   assert bool(result['state']['badge'])==(q['id']==100)
   assert bool(result.get('rewarded'))==(q['id']==100)
   if q['id']in [40,70,99,100]:print('Verified actual server clears:',q['id'],flush=True)
   time.sleep(.72)
  ws.close();p.terminate();p.wait(timeout=10)
  profiles=json.loads((Path(data)/'profiles.json').read_text(encoding='utf8'));pf=profiles[account['name']]
  assert pf['arcade']['cleared']==100 and pf['items']['mask_bighead']==1
  awarded=pf['arcade']['rewardGrantedAt']
  p=start();ws=connect();call('hello',{'v':4,'name':account['name'],'acct':account,'look':{}})
  view=call('arcade:open');assert view['puzzle']['id']==100 and view['state']['percent']==100 and view['state']['badge']
  result=call('arcade:answer',{'id':100,'answer':bank[-1]['answer']});assert result['correct'] and not result['rewarded']
  assert 'error'in call('arcade:question',101)
  assert call('arcade:question',13)['puzzle']['id']==13
  print('PASS: 100 real socket clears, final badge/reward, saved disk, server restart, account resume, replay and no double reward.',flush=True)
 finally:
  if ws:ws.close()
  p.terminate();p.wait(timeout=10)
