import assert from 'node:assert/strict';
import {createCoasterTrack} from '../public/js/coaster-track.js';
import {mountainGroundHeight,inArea,TERRACE,SUMMIT} from '../public/js/mountain-layout.js';
const track=createCoasterTrack();let minUp=1,maxTurn=0,clearance=Infinity,nearSummit=false;
for(let i=0;i<track.points.length;i++){const p=track.points[i],f=track.at(track.cum[i]);if(p.x>59&&p.z>-78&&p.z<-53)minUp=Math.min(minUp,f.up.y);maxTurn=Math.max(maxTurn,track.frames[i].angleTo(track.frames[(i+1)%track.frames.length]));if(p.z<-38)clearance=Math.min(clearance,p.y-mountainGroundHeight(p.x,p.z));if(p.z<-128&&p.y>55)nearSummit=true;assert(Math.abs(f.right.dot(f.up))<1e-7);assert(Math.abs(f.t.length()-1)<1e-7);}
assert(minUp<-.98,'loop must invert the train');assert(maxTurn<.2,'orientation must remain continuous, including the lap seam');assert(clearance>3,'track must clear mountain rocks');assert(nearSummit,'track must reach the mountain');
for(const seconds of [-1,0,track.lap,1234567890])assert(Number.isFinite(track.at(track.frontS(seconds)).p.y));
assert(inArea(0,-126,SUMMIT));assert(inArea(0,-83,TERRACE));
console.log(`PASS: 360 loop (up.y=${minUp.toFixed(3)}), mountain clearance ${clearance.toFixed(1)}m, ${track.length.toFixed(0)}m continuous track and closed orientation.`);
