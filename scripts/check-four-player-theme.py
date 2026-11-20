import os,time,json,socket,subprocess,tempfile,urllib.request,websocket
from pathlib import Path
root=Path(__file__).resolve().parents[1]
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
  clients=[];identities=[]
  for i in range(4):
   ws=connect();clients.append(ws);identities.append(call('hello',{'v':4,'name':'다중검증'+str(i),'look':{}}))
  ws=clients[0];ws.send('42'+json.dumps(['state:full']))
  def event(w,name,timeout=5):
   end=time.monotonic()+timeout
   while time.monotonic()<end:
    packet=w.recv()
    if packet=='2':w.send('3');continue
    if packet.startswith('42'):
     msg=json.loads(packet[2:])
     if msg[0]==name:return msg[1]
   raise AssertionError('Missing event '+name)
  state=event(ws,'state');
  while not state.get('f') or len(state['p'])!=4:state=event(ws,'state')
  assert len(state['p'])==4,len(state['p'])
  ws=clients[0]
  ws.send('42'+json.dumps(['move',{'x':0,'z':-118,'y':44,'ry':0}]))
  time.sleep(.3);ws.send('42'+json.dumps(['state:full']))
  state=event(ws,'state')
  while not state.get('f') or not any(row[0]==identities[0]['id'] and row[3]==44 for row in state['p']):state=event(ws,'state')
  link=call('party:link')
  for client in clients[1:]:client.send('42'+json.dumps(['party:joinCode',link['code']]))
  party=event(ws,'party')
  while len(party['members'])!=4:party=event(ws,'party')
  ws.send('42'+json.dumps(['party:start',{'scenario':'gwimun','chapter':0,'fear':2}]))
  for client in clients:event(client,'game:start')
  for i,client in enumerate(clients):client.send('42'+json.dumps(['move',{'x':i+1,'z':2,'y':0,'ry':.5,'anim':True}]))
  time.sleep(.3);ws.send('42'+json.dumps(['state:full']))
  state=event(ws,'state')
  while not state.get('f') or len(state['p'])!=4 or not all(row[1] in [1,2,3,4] for row in state['p']):state=event(ws,'state')
  print('PASS: four real socket clients enter one theme and exchange movement; summit height 44 preserved over server snapshots.')
  for client in clients:client.close()
 finally:
  if ws:ws.close()
  p.terminate();p.wait(timeout=10)
