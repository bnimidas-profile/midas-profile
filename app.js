(()=>{'use strict';const KEY='midas-admin-draft-v1',base=window.MIDAS_INITIAL||[];let members=base;try{let saved=localStorage.getItem(KEY);if(saved)members=JSON.parse(saved)}catch{}const $=id=>document.getElementById(id);let current=null,preparedFile=null,prepareToken=0;function safeName(s){return String(s).replace(/[<>"'&]/g,c=>({'<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','&':'&amp;'}[c]))}function ordered(a){return [...a].sort((x,y)=>x.name.localeCompare(y.name,'ko'))}function render(){let query=$('search').value.trim().toLocaleLowerCase();let list=ordered(members).filter(m=>(m.name+' '+m.company+' '+m.category).toLocaleLowerCase().includes(query));$('count').textContent= list.length+'명'+(query?' 검색됨':'');$('empty').hidden=!!list.length;$('gallery').innerHTML='';for(let m of list){let cell=document.createElement('article');cell.className='tile';let b=document.createElement('button');b.className='thumb';b.type='button';b.setAttribute('aria-label',m.name+' 명함 보기');if(m.image){let img=document.createElement('img');img.src=m.image;img.alt=m.name+' 명함';b.append(img)}else{b.innerHTML='<div class="placeholder"><span class="tag">BNI MIDAS</span><span class="monogram">'+safeName(m.name.slice(0,1))+'</span><span class="empty-label">'+safeName(m.name)+'</span><span class="empty-sub">명함 사진 등록 전</span></div>'}b.onclick=()=>openModal(m);cell.append(b);let h=document.createElement('h3');h.textContent=m.name;let p=document.createElement('p');p.textContent=m.category;cell.append(h,p);$('gallery').append(cell)}}function openModal(m){
  current=m;preparedFile=null;const token=++prepareToken;
  $('modalName').textContent=m.name;
  $('modalCategory').textContent=m.company+' · '+m.category;
  if(m.image){$('modalImg').src=m.image;$('modalImg').style.display='block';$('downloadBtn').disabled=false}
  else{$('modalImg').removeAttribute('src');$('modalImg').style.display='none';$('downloadBtn').disabled=true}
  $('modal').hidden=false;
  $('shareBtn').disabled=true;
  $('shareBtn').textContent=m.image?'명함 사진 준비 중…':'사진 미등록';
  setHelp(m.image?'사진을 공유할 수 있도록 준비하고 있습니다.':'등록된 명함 사진이 없습니다.');
  if(m.image)prepareImage(m,token);
  document.body.style.overflow='hidden'
}
function close(){ ++prepareToken;preparedFile=null;$('modal').hidden=true;document.body.style.overflow='';current=null}function download(){if(!current?.image)return;let a=document.createElement('a');a.href=current.image;a.download=(current.name+'_프로필명함.jpg');document.body.append(a);a.click();a.remove()}function shareUrl(m){const u=new URL(window.location.href);u.searchParams.set('member',m.id);u.hash='';return u.href}
function shareText(m){return 'BNI 미다스 챕터 | '+m.name+' ('+m.category+') 프로필 명함'}
function setHelp(message){$('shareHelp').textContent=message}
async function prepareImage(m,token){
  try{
    let data=m.image;
    let blob;
    if(data.startsWith('data:')){
      const parts=data.match(/^data:([^;,]+)?;base64,(.*)$/s);
      if(!parts)throw new Error('지원되지 않는 이미지');
      const raw=atob(parts[2]), bytes=new Uint8Array(raw.length);
      for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);
      blob=new Blob([bytes],{type:parts[1]||'image/jpeg'});
    }else{
      const response=await fetch(data);
      if(!response.ok)throw new Error('이미지를 읽을 수 없습니다');
      blob=await response.blob();
    }
    if(token!==prepareToken||current?.id!==m.id)return;
    const mime=blob.type==='image/png'?'image/png':'image/jpeg';
    preparedFile=new File([blob],m.name+'_BNI_명함.'+(mime==='image/png'?'png':'jpg'),{type:mime});
    $('shareBtn').disabled=false;
    $('shareBtn').textContent='카톡·문자로 사진 공유';
    setHelp('버튼을 누른 뒤 공유 목록에서 카카오톡 또는 메시지를 선택하세요. 링크나 설명 없이 명함 사진만 전달합니다.');
  }catch(e){
    if(token!==prepareToken)return;
    $('shareBtn').disabled=true;
    $('shareBtn').textContent='사진 공유 불가';
    setHelp('이 브라우저에서는 명함 이미지 준비에 실패했습니다. 다운로드 후 갤러리에서 사진을 공유하세요.');
  }
}
function share(){
  if(!current?.image||!preparedFile)return;
  if(typeof navigator.share!=='function'){
    setHelp('현재 브라우저에는 사진 직접 공유 기능이 없습니다. 다운로드한 뒤 갤러리에서 사진을 선택하고 공유하세요.');
    return;
  }
  const payload={files:[preparedFile]};
  try{
    // 일부 브라우저는 canShare()가 없어도 share()가 동작합니다.
    // canShare가 명확히 false를 반환한 경우에만 네이티브 파일 공유를 중단합니다.
    if(typeof navigator.canShare==='function' && !navigator.canShare(payload)){
      setHelp('현재 브라우저에서는 사진 파일 직접 공유가 제한됩니다. 크롬으로 열거나 다운로드 후 갤러리에서 공유하세요.');
      return;
    }
    // 파일만 공유하고 텍스트/URL을 넣지 않습니다. 클릭 이벤트 내에서 즉시 실행합니다.
    const promise=navigator.share(payload);
    Promise.resolve(promise).then(()=>{
      setHelp('사진을 공유했습니다.');
    }).catch(e=>{
      if(e?.name!=='AbortError')setHelp('사진 공유가 열리지 않았습니다. 크롬이나 삼성 인터넷에서 다시 시도하거나 다운로드 후 갤러리에서 공유하세요.');
    });
  }catch(e){
    setHelp('공유창을 열 수 없습니다. 다운로드 후 갤러리에서 공유하세요.');
  }
}
$('search').addEventListener('input',render);$('modalClose').onclick=close;$('closeBtn').onclick=close;$('downloadBtn').onclick=download;$('shareBtn').onclick=share;$('modal').addEventListener('click',e=>{if(e.target===$('modal'))close()});document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});render();try{let memberId=new URL(location.href).searchParams.get('member');if(memberId){let matching=members.find(m=>String(m.id)===memberId);if(matching)openModal(matching)}}catch{}})();