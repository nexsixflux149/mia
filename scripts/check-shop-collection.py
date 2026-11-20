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
 (Path(data)/'profiles.json').write_text(json.dumps({'꾸미기검증':{'xp':0,'coins':2000,'items':{},'equip':{'wings':'','mount':'','costume':'','gold':'','mask':'','tail':'','horn':''}}},ensure_ascii=False),encoding='utf8')
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
  ws=connect();login=call('hello',{'v':4,'name':'꾸미기검증','look':{}})
  def profile_until(predicate):
   for _ in range(200):
    packet=ws.recv()
    if packet=='2':ws.send('3');continue
    if packet.startswith('42'):
     msg=json.loads(packet[2:])
     if msg[0]=='profile' and predicate(msg[1]):return msg[1]
   raise AssertionError('Profile not received')
  specs=[('costume_lolita','costume',180),('costume_lolita_white','costume',180),('costume_lolita_black','costume',180),('head_giantbow','horn',90),('costume_sentai','costume',200),('cape_grand','wings',160),('head_axe','horn',80),('mask_waterdeer','mask',150)]
  for id,kind,price in specs:
   assert login['shop'][id]['price']==price
   ws.send('42'+json.dumps(['shop:buy',id]));pf=profile_until(lambda p:p['items'].get(id)==1)
   ws.send('42'+json.dumps(['shop:equip',{'id':id,'on':True}]));pf=profile_until(lambda p:p['equip'].get(kind)==id)
   ws.send('42'+json.dumps(['shop:equip',{'id':id,'on':False}]));pf=profile_until(lambda p:not p['equip'].get(kind))
  assert pf['coins']==780,pf['coins']
  ws.close();p.terminate();p.wait(timeout=10);p=start();ws=connect()
  call('hello',{'v':4,'name':login['name'],'acct':login['account'],'look':{}})
  pf=profile_until(lambda p:all(p['items'].get(id)==1 for id,kind,price in specs))
  assert pf['coins']==780
  print('PASS: 8 shop purchases, exact coin deduction, server equip/unequip, inventory persistence after restart.')

 finally:
  if ws:ws.close()
  p.terminate();p.wait(timeout=10)
