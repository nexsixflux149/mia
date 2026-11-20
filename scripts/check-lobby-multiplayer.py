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
  clients=[];identities=[]
  for i in range(12):
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
  while not state.get('f') or len(state['p'])!=12:state=event(ws,'state')
  assert len(state['p'])==12,len(state['p'])
  # A socket may stay connected while its phone app is in the background.
  hidden=identities[2]['id'];clients[2].send('42'+json.dumps(['presence',False]))
  assert event(clients[0],'player:leave')==hidden
  time.sleep(.5);clients[0].send('42'+json.dumps(['state:full']))
  snapshot=event(clients[0],'state')
  while not snapshot.get('f') or hidden in [p[0] for p in snapshot['p']]:snapshot=event(clients[0],'state')
  clients[2].send('42'+json.dumps(['presence',True]))
  time.sleep(.5);clients[0].send('42'+json.dumps(['state:full']))
  snapshot=event(clients[0],'state')
  while not snapshot.get('f') or hidden not in [p[0] for p in snapshot['p']]:snapshot=event(clients[0],'state')
  print('PASS: background socket removed immediately; foreground returns same avatar identity.')
  # Drain stale state events before forcing a new authoritative snapshot.
  departed=identities[-1]['id'];clients[-1].close();clients.pop()
  left=event(ws,'player:leave');assert left==departed,(left,departed)
  time.sleep(.5);ws.send('42'+json.dumps(['state:full']))
  state=event(ws,'state')
  while not state.get('f') or departed in [p[0]for p in state['p']]:state=event(ws,'state')
  assert departed not in [p[0]for p in state['p']]
  a=event(clients[0],'lobby:santa');b=event(clients[1],'lobby:santa')
  # Independent sockets may contain older queued ticks; compare values from a stationary patrol interval.
  assert all(isinstance(v,(int,float))for v in [a['x'],a['z'],b['x'],b['z']])
  assert a['mode'] in ['patrol','follow'] and b['mode'] in ['patrol','follow']
  snapshots=[{json.dumps(a,sort_keys=True)},{json.dumps(b,sort_keys=True)}]
  for _ in range(20):
   for i in range(2):snapshots[i].add(json.dumps(event(clients[i],'lobby:santa'),sort_keys=True))
  assert snapshots[0]&snapshots[1], 'Clients did not receive any identical authoritative Santa tick'

  # Same-account takeover must remove/replace the old socket, without creating a thirteenth avatar.
  ws=connect();clients.append(ws);again=call('hello',{'v':4,'name':identities[1]['name'],'acct':identities[1]['account'],'look':{}})
  assert again['id']==identities[1]['id']
  print('PASS: 12 simultaneous clients; disconnect leave event; full snapshot excludes departed; server Santa broadcast; same-account replacement keeps player identity.')
  for w in clients:
   try:w.close()
   except Exception:pass

 finally:
  if ws:ws.close()
  p.terminate();p.wait(timeout=10)
