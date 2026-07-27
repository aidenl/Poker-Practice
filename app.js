const ranks = ['A','K','Q','J','T','9','8','7','6','5','4','3','2'];
const suits = [{symbol:'♥',color:'red'},{symbol:'♦',color:'red'},{symbol:'♠',color:'black'},{symbol:'♣',color:'black'}];
const earlyOpenHands = new Set(['AJs','AQs','AKs','AQo','AKo','KQs','QJs','JTs','T9s','98s']);
const middleOpenHands = new Set([
  'A9s','ATs','AJs','AQs','AKs','KTs','KJs','KQs','QTs','QJs','J9s','JTs',
  'T8s','T9s','97s','98s','87s','76s','65s','AJo','AQo','AKo','KJo','KQo'
]);
const cutoffOpenHands = new Set([
  'A2s','A3s','A4s','A5s','A6s','A7s','A8s','A9s','ATs','AJs','AQs','AKs',
  'K7s','K8s','K9s','KTs','KJs','KQs','Q8s','Q9s','QTs','QJs',
  'J8s','J9s','JTs','T7s','T8s','T9s','97s','98s','86s','87s','75s','76s','64s','65s','54s',
  'A2o','A3o','A4o','A5o','A6o','A7o','A8o','A9o','ATo','AJo','AQo','AKo',
  'K9o','KTo','KJo','KQo','QTo','QJo','JTo','T9o','T8o','98o','87o'
]);
const buttonOpenHands = new Set([
  'A2s','A3s','A4s','A5s','A6s','A7s','A8s','A9s','ATs','AJs','AQs','AKs',
  'K2s','K3s','K4s','K5s','K6s','K7s','K8s','K9s','KTs','KJs','KQs',
  'Q4s','Q5s','Q6s','Q7s','Q8s','Q9s','QTs','QJs',
  'J7s','J8s','J9s','JTs','T7s','T8s','T9s','97s','98s','86s','87s','75s','76s','64s','65s','54s',
  'A2o','A3o','A4o','A5o','A6o','A7o','A8o','A9o','ATo','AJo','AQo','AKo',
  'K7o','K8o','K9o','KTo','KJo','KQo','Q8o','Q9o','QTo','QJo',
  'J8o','J9o','JTo','T8o','T9o','98o','97o','87o','76o','65o','54o'
]);
const positions = ['UTG','UTG+1','LJ','HJ','CO','BTN'];
const app = { position:'UTG', mode:'fixed', correct:0, attempts:0, hand:null, cards:[], mistakes:[] };
const $ = (s) => document.querySelector(s);

function handName(a,b){
  const ai=ranks.indexOf(a.rank), bi=ranks.indexOf(b.rank);
  if(ai===bi) return a.rank+a.rank;
  const high=ai<bi?a:b, low=ai<bi?b:a;
  return high.rank+low.rank+(a.suit.symbol===b.suit.symbol?'s':'o');
}
function currentRange(){
  if(app.position==='BTN') return buttonOpenHands;
  if(app.position==='CO') return cutoffOpenHands;
  return ['LJ','HJ'].includes(app.position) ? middleOpenHands : earlyOpenHands;
}
function shouldRaise(hand){ return hand.length===2 || currentRange().has(hand); }
function setPosition(position){
  app.position=position;
  $('#positionText').textContent=app.position;
  const markerClass={UTG:'utg','UTG+1':'utg1',LJ:'lj',HJ:'hj',CO:'co',BTN:'btn'}[app.position];
  $('#heroMarker').className='hero-marker '+markerClass;
  makeChart();
}
function setRandomPosition(){
  let position=app.position;
  while(position===app.position && positions.length>1) position=positions[Math.floor(Math.random()*positions.length)];
  setPosition(position);
}
function drawHand(){
  if(app.mode==='random') setRandomPosition();
  const cards=[];
  while(cards.length<2){
    const card={rank:ranks[Math.floor(Math.random()*ranks.length)],suit:suits[Math.floor(Math.random()*suits.length)]};
    if(!cards.some(c=>c.rank===card.rank && c.suit.symbol===card.suit.symbol)) cards.push(card);
  }
  app.hand=handName(cards[0],cards[1]);
  app.cards=cards;
  const handDisplay=$('#handDisplay');
  handDisplay.classList.remove('dealing');
  $('#handDisplay').innerHTML=cards.map(c=>`<div class="card ${c.suit.color}"><b>${c.rank}</b><span>${c.suit.symbol}</span></div>`).join('');
  // Force a fresh animation for every new deal, including consecutive correct answers.
  void handDisplay.offsetWidth;
  handDisplay.classList.add('dealing');
  const actions=$('#actions');
  actions.className='actions';
  actions.querySelectorAll('.action').forEach(button => {
    button.classList.remove('chosen','correct','wrong');
    button.blur();
  });
  $('#feedback').hidden=true;
}
function updateScore(){
  $('#correctCount').textContent=app.correct; $('#attemptCount').textContent=app.attempts;
  $('#accuracy').textContent=app.attempts ? Math.round(app.correct/app.attempts*100)+'%' : '—';
}
function renderHistory(){
  const list=$('#historyList');
  $('#historyCount').textContent=app.mistakes.length;
  $('#historyEmpty').hidden=app.mistakes.length>0;
  list.innerHTML=app.mistakes.map(item=>`<li class="history-item">
    <span class="history-position">${item.position}</span>
    <strong class="history-hand">${item.cards}</strong>
    <span class="history-answer"><small>정답</small>${item.answer}</span>
  </li>`).join('');
}
function answer(action){
  const raise=shouldRaise(app.hand), correct=(action==='raise')===raise;
  app.attempts++; if(correct) app.correct++;
  else {
    app.mistakes.unshift({
      position:app.position,
      cards:app.cards.map(card=>`<span class="suit-${card.suit.color==='red'?'red':'blue'}">${card.rank}${card.suit.symbol}</span>`).join(' · '),
      answer:raise?'RAISE':'FOLD'
    });
    renderHistory();
  }
  const actions=$('#actions'); actions.classList.add('locked');
  const chosen=$(`[data-action="${action}"]`); chosen.classList.add('chosen',correct?'correct':'wrong');
  $(`[data-action="${raise?'raise':'fold'}"]`).classList.add('correct');
  const feedback=$('#feedback'); feedback.hidden=false; feedback.className='feedback '+(correct?'':'incorrect');
  $('#feedbackIcon').textContent=correct?'✓':'×';
  $('#feedbackTitle').textContent=correct?'정답입니다!':'아쉽지만 다시 확인해 보세요.';
  $('#feedbackText').textContent=`${app.hand}은(는) ${raise?'레이즈':'폴드'}하는 핸드입니다.`;
  $('#nextHand').hidden=correct;
  updateScore();
  if(correct) setTimeout(drawHand, 425);
}
function togglePosition(){
  const next=(positions.indexOf(app.position)+1)%positions.length;
  setPosition(positions[next]);
}
function toggleMode(){
  app.mode=app.mode==='fixed'?'random':'fixed';
  const button=$('#modeToggle');
  const random=app.mode==='random';
  button.textContent=random?'RANDOM':'FIXED';
  button.classList.toggle('random',random);
  button.setAttribute('aria-pressed',random);
  $('#switchPosition').disabled=random;
  if(random) drawHand();
}
function makeChart(){
  const middle=['LJ','HJ'].includes(app.position);
  const cutoff=app.position==='CO';
  const button=app.position==='BTN';
  $('#rangePosition').textContent=button?'BTN':cutoff?'CO':middle?'LJ / HJ':'UTG / UTG+1';
  $('#rangeDescription').textContent=button
    ? '제공 차트의 파란 영역 · BTN 오픈 레인지'
    : cutoff
    ? '페어, 모든 A, K7s+, Q8s+, J8s+, T7s+, 97s+, 86s+, 75s+, 64s+, 54s, K9o+, QTo+, JTo+'
    : middle
    ? '페어, A9s+, KTs+, QTs+, J9s+, T8s+, 97s+, 87s, 76s, 65s, AJo+, KJo+'
    : '페어, AJs+, AQo+, KQs, QJs, JTs, T9s, 98s';
  $('#rangeGrid').innerHTML=ranks.flatMap((row,i)=>ranks.map((col,j)=>{
    let hand, pair=i===j;
    if(pair) hand=row+col;
    else if(j>i) hand=row+col+'s';
    else hand=col+row+'o';
    return `<div class="range-cell ${pair?'pair':''} ${shouldRaise(hand)?'open':''}">${hand}</div>`;
  })).join('');
}
document.querySelectorAll('.action').forEach(btn=>btn.addEventListener('click',()=>answer(btn.dataset.action)));
$('#nextHand').addEventListener('click',drawHand); $('#switchPosition').addEventListener('click',togglePosition); $('#modeToggle').addEventListener('click',toggleMode);
$('#chartButton').addEventListener('click',()=>{ makeChart(); $('#chartDialog').showModal(); }); $('#closeChart').addEventListener('click',()=>$('#chartDialog').close());
makeChart(); drawHand(); updateScore(); renderHistory();
