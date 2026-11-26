(()=>{'use strict';const KEY='midas-admin-draft-v1',base=window.MIDAS_INITIAL||[];let members=base;try{let saved=localStorage.getItem(KEY);if(saved)members=JSON.parse(saved)}catch{}const $=id=>document.getElementById(id);let current=null,preparedFile=null,prepareToken=0;function safeName(s){return String(s).replace(/[<>"'&]/g,c=>({'<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','&':'&amp;'}[c]))}function ordered(a){return [...a].sort((x,y)=>x.name.localeCompare(y.name,'ko'))}function render(){let query=$('search').value.trim().toLocaleLowerCase();let list=ordered(members).filter(m=>(m.name+' '+m.company+' '+m.category).toLocaleLowerCase().includes(query));$('count').textContent= list.length+'명'+(query?' 검색됨':'');$('empty').hidden=!!list.length;$('gallery').innerHTML='';for(let m of list){let cell=document.createElement('article');cell.className='tile';let b=document.createElement('button');b.className='thumb';b.type='button';b.setAttribute('aria-label',m.name+' 명함 보기');if(m.image){let img=document.createElement('img');img.src=m.image;img.alt=m.name+' 명함';b.append(img)}else{b.innerHTML='<div class="placeholder"><span class="tag">BNI MIDAS</span><span class="monogram">'+safeName(m.name.slice(0,1))+'</span><span class="empty-label">'+safeName(m.name)+'</span><span class="empty-sub">명함 사진 등록 전</span></div>'}b.onclick=()=>openModal(m);cell.append(b);let h=document.createElement('h3');h.textContent=m.name;let p=document.createElement('p');p.textContent=m.category;cell.append(h,p);$('gallery').append(cell)}}function openModal(m){current=m;preparedFile=null;const token=++prepareToken;$('modalName').textContent=m.name;$('modalCategory').textContent=m.company+' · '+m.category;if(m.image){$('modalImg').src=m.image;$('modalImg').style.display='block';$('downloadBtn').disabled=false}else{$('modalImg').removeAttribute('src');$('modalImg').style.display='none';$('downloadBtn').disabled=true}$('modal').hidden=false;setHelp('카톡·앱 공유는 지원되는 휴대폰에서 명함 이미지를 직접 보낼 수 있습니다. 문자 공유는 명함 링크를 전송합니다.');$('smsBtn').href='sms:?body='+encodeURIComponent(shareText(m)+'\n'+shareUrl(m));$('shareBtn').disabled=!!m.image;$('shareBtn').textContent=m.image?'사진 준비 중…':'카톡·앱 공유';if(m.image)prepareImage(m,token);document.body.style.overflow='hidden'}function close(){ ++prepareToken;preparedFile=null;$('modal').hidden=true;document.body.style.overflow='';current=null}function download(){if(!current?.image)return;let a=document.createElement('a');a.href=current.image;a.download=(current.name+'_프로필명함.jpg');document.body.append(a);a.click();a.remove()}function shareUrl(m){const u=new URL(window.location.href);u.searchParams.set('member',m.id);u.hash='';return u.href}
function shareText(m){return 'BNI 미다스 챕터 | '+m.name+' ('+m.category+') 프로필 명함'}
function setHelp(message){$('shareHelp').textContent=message}
async function prepareImage(m,token){
  try{
    const response=await fetch(m.image);
    if(!response.ok)throw Error('명함 이미지 처리 실패');
    const blob=await response.blob();
    if(token!==prepareToken||current?.id!==m.id)return;
    preparedFile=new File([blob],m.name+'_BNI_명함.'+(blob.type==='image/png'?'png':'jpg'),{type:blob.type||'image/jpeg'});
    $('shareBtn').disabled=false;
    $('shareBtn').textContent='사진 저장·공유';
    setHelp('사진 공유 버튼을 누르면 지원되는 휴대폰에서 카카오톡·메시지 등 공유 앱을 선택할 수 있습니다.');
  }catch(e){
    if(token!==prepareToken)return;
    $('shareBtn').disabled=false;
    $('shareBtn').textContent='카톡·앱 공유';
    setHelp('사진 공유 준비에 실패했습니다. 다운로드 후 갤러리에서 공유하거나 링크를 공유할 수 있습니다.');
  }
}
function share(){
  if(!current)return;
  const m=current;
  if(!navigator.share){
    setHelp('이 브라우저는 사진 공유 메뉴를 지원하지 않습니다. 다운로드한 사진을 갤러리에서 공유하세요.');
    return;
  }
  let payload={title:shareText(m),text:shareText(m),url:shareUrl(m)};
  if(preparedFile&&typeof navigator.canShare==='function'){
    try{
      if(navigator.canShare({files:[preparedFile]})){
        payload={title:shareText(m),files:[preparedFile]};
      }else{
        setHelp('이 브라우저는 이미지 파일 직접 공유를 지원하지 않아 명함 링크를 공유합니다.');
      }
    }catch(e){}
  }
  // 클릭 이벤트 중에 바로 호출해야 브라우저의 사용자 동작 권한이 유지됩니다.
  try{
    const action=navigator.share(payload);
    Promise.resolve(action).then(()=>{
      setHelp(payload.files?'사진을 공유 앱에 전달했습니다.':'명함 링크를 공유했습니다.');
    }).catch(e=>{
      if(e?.name!=='AbortError')setHelp('공유 메뉴를 열 수 없습니다. 다른 브라우저에서 시도하거나 사진을 내려받아 갤러리에서 공유하세요.');
    });
  }catch(e){
    setHelp('공유 메뉴를 열 수 없습니다. 사진을 내려받은 뒤 갤러리에서 공유해 주세요.');
  }
}
$('search').addEventListener('input',render);$('modalClose').onclick=close;$('closeBtn').onclick=close;$('downloadBtn').onclick=download;$('shareBtn').onclick=share;$('modal').addEventListener('click',e=>{if(e.target===$('modal'))close()});document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});render();try{let memberId=new URL(location.href).searchParams.get('member');if(memberId){let matching=members.find(m=>String(m.id)===memberId);if(matching)openModal(matching)}}catch{}})();