import os,time,json,socket,subprocess,tempfile,urllib.request,websocket
from pathlib import Path
root=Path(__file__).resolve().parents[1]
bank=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {ARCADE_PUZZLES} from './server/arcade-puzzles.js';process.stdout.write(JSON.stringify(ARCADE_PUZZLES));"],cwd=root).decode('utf8'))
with socket.socket() as s:s.bind(('127.0.0.1',0));port=s.getsockname()[1]
with tempfile.TemporaryDirectory(prefix='mia-arcade100-test-') as data:
 env={**os.environ,'PORT':str(port),'DATA_DIR':data,'DATABASE_URL':'','NODE_ENV':'test','ADMIN_PASSWORD':'local-integration-check-only'}
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
  ws=connect();admin=call('hello',{'v':4,'admin':'local-integration-check-only','look':{}})
  assert admin['admin']
  q=call('arcade:question',100);assert q['puzzle']['answer']=='DA21' and q['state']['preview']
  r=call('arcade:answer',{'id':100,'answer':'DA21'});assert r['correct'] and r['state']['cleared']==0
  st=call('admin:stats');assert st['arcade']['players']==0
  ws.close();time.sleep(.1)
  ws=connect();login=call('hello',{'v':4,'name':'집계검증','look':{}});account=login['account']
  assert 'error'in call('arcade:question',100)
  q=call('arcade:open');assert 'answer'not in q['puzzle']
  call('arcade:answer',{'id':1,'answer':'wrong'});time.sleep(.75)
  call('arcade:answer',{'id':1,'answer':'3'});ws.close()
  ws=connect();call('hello',{'v':4,'admin':'local-integration-check-only','look':{}})
  st=call('admin:stats')['arcade'];assert st['opens']==1 and st['attempts']==2 and st['solved']==1 and st['players']==1,st
  assert st['visitors']==1 and st['returned']==0
  disk=json.loads((Path(data)/'profiles.json').read_text(encoding='utf8'))
  assert any(p.get('items',{}).get('mask_bighead')==1 and p.get('arcade',{}).get('cleared',0)==0 for p in disk.values())
  print('PASS actual server: admin all-question answers, preview no progress, bighead inventory, ordinary lock/privacy, usage analytics exclude admin, return visitor denominator.')

 finally:
  if ws:ws.close()
  p.terminate();p.wait(timeout=10)
