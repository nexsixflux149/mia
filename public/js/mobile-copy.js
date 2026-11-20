export function withoutDesktopHints(text){
 return String(text)
  .replace(/\s*[·|]\s*단축키\s*:[^\n]*/g,'')
  .replace(/단축키\s*[1-9A-Z](?:\s*~\s*[1-9])?/g,'')
  .replace(/\s*\((?:[BCEFGHIJMNQRTVXZ]|Esc|Escape|Space|Enter)(?:\s*:[^)]*)?\)/g,'')
  .replace(/\b(?:[BCEFGHIJMNQRTVXZ])\s*[:：]\s*[^·!\n]+\s*[·]?\s*/g,'')
  .replace(/\b(?:E|N)\s*(?:키로|키를|키|로|으로)\s*/g,'')
  .replace(/\b(?:WASD|W A S D)\s*이동\s*[·]?\s*/g,'')
  .replace(/우클릭/g,'길게 누르기').replace(/좌클릭/g,'누르기');
}
// Covers server toasts, innerHTML-built shop cards and buttons added after opening a popup.
export function installMobileCopy(){
 const originals=new WeakMap(),titles=new WeakMap();
 const mobile=()=>document.body.classList.contains('mobile');
 function update(node){
  if(node.nodeType!==3||node.parentElement?.closest('script,style,textarea,input,#chatLog,.chat-line,.rank-names,.bn,.an'))return;
  const old=originals.get(node),current=node.nodeValue;
  const original=old&&current===old.shown?old.original:current;
  const shown=mobile()?withoutDesktopHints(original):original;
  originals.set(node,{original,shown});if(current!==shown)node.nodeValue=shown;
 }
 function title(e){if(!e.hasAttribute('title'))return;const v=e.title,old=titles.get(e),original=old&&v===old.shown?old.original:v,shown=mobile()?withoutDesktopHints(original):original;titles.set(e,{original,shown});if(v!==shown)e.title=shown;}
 function scan(root){if(root.nodeType===3){update(root);return;}if(root.nodeType!==1)return;title(root);root.querySelectorAll('[title]').forEach(title);const walk=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);while(walk.nextNode())update(walk.currentNode);}
 const refresh=()=>scan(document.body);
 new MutationObserver(records=>{for(const record of records){if(record.type==='attributes')title(record.target);else if(record.type==='characterData')update(record.target);else for(const node of record.addedNodes)scan(node);}}).observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['title']});
 new MutationObserver(refresh).observe(document.body,{attributes:true,attributeFilter:['class']});
 refresh();return refresh;
}
