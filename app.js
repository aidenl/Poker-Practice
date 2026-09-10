const ranks = ['A','K','Q','J','T','9','8','7','6','5','4','3','2'];
const suits = [{symbol:'♥',color:'heart'},{symbol:'♦',color:'diamond'},{symbol:'♠',color:'spade'},{symbol:'♣',color:'club'}];
const allPairs = new Set(ranks.map(rank=>rank+rank));
const withPairs = hands => new Set([...allPairs,...hands]);
const earlyOpenHands = withPairs(['AJs','AQs','AKs','AQo','AKo','KQs','QJs','JTs','T9s','98s']);
const middleOpenHands = withPairs([
  'A9s','ATs','AJs','AQs','AKs','KTs','KJs','KQs','QTs','QJs','J9s','JTs',
  'T8s','T9s','97s','98s','87s','76s','65s','AJo','AQo','AKo','KJo','KQo'
]);
const cutoffOpenHands = withPairs([
  'A2s','A3s','A4s','A5s','A6s','A7s','A8s','A9s','ATs','AJs','AQs','AKs',
  'K7s','K8s','K9s','KTs','KJs','KQs','Q8s','Q9s','QTs','QJs',
  'J8s','J9s','JTs','T7s','T8s','T9s','97s','98s','86s','87s','75s','76s','64s','65s','54s',
  'A2o','A3o','A4o','A5o','A6o','A7o','A8o','A9o','ATo','AJo','AQo','AKo',
  'K9o','KTo','KJo','KQo','QTo','QJo','JTo','T9o','T8o','98o','87o'
]);
const buttonOpenHands = withPairs([
  'A2s','A3s','A4s','A5s','A6s','A7s','A8s','A9s','ATs','AJs','AQs','AKs',
  'K2s','K3s','K4s','K5s','K6s','K7s','K8s','K9s','KTs','KJs','KQs',
  'Q4s','Q5s','Q6s','Q7s','Q8s','Q9s','QTs','QJs',
  'J7s','J8s','J9s','JTs','T7s','T8s','T9s','97s','98s','86s','87s','75s','76s','64s','65s','54s',
  'A2o','A3o','A4o','A5o','A6o','A7o','A8o','A9o','ATo','AJo','AQo','AKo',
  'K7o','K8o','K9o','KTo','KJo','KQo','Q8o','Q9o','QTo','QJo',
  'J8o','J9o','JTo','T8o','T9o','98o','97o','87o','76o','65o','54o'
]);
function rangeFromMatrix(rows){
  const hands=[];
  rows.forEach((row,i)=>[...row].forEach((cell,j)=>{
    if(cell!=='X') return;
    if(i===j) hands.push(ranks[i]+ranks[i]);
    else if(j>i) hands.push(ranks[i]+ranks[j]+'s');
    else hands.push(ranks[j]+ranks[i]+'o');
  }));
  return new Set(hands);
}
const mttRanges = {
  'UTG': rangeFromMatrix(['XXXXXXXXXXXX.','XXXXXX.......','XXXXXX.......','X..XX........','....XX.......','.....X.......','......X......','.......X.....','........X....','.............','.............','.............','.............']),
  'UTG+1': rangeFromMatrix(['XXXXXXXXXXXX.','XXXXXXX......','XXXXXX.......','X..XXX.......','X...XXX......','.....XX......','......X......','.......X.....','........X....','.........X...','.............','.............','.............']),
  'UTG+2': rangeFromMatrix(['XXXXXXXXXXXXX','XXXXXXX......','XXXXXX.......','XX.XXX.......','XX..XXX......','.....XX......','......X......','.......XX....','........X....','.........X...','..........X..','.............','.............']),
  'LJ': rangeFromMatrix(['XXXXXXXXXXXXX','XXXXXXXXX....','XXXXXX.......','XXXXXXX......','XXX.XXX......','X....XX......','......XX.....','.......XX....','........X....','.........X...','..........X..','...........X.','.............']),
  'HJ': rangeFromMatrix(['XXXXXXXXXXXXX','XXXXXXXXXXX..','XXXXXXX......','XXXXXXX......','XXXXXXXX.....','X....XXX.....','X.....XX.....','.......XX....','........XX...','.........XX..','..........X..','...........X.','............X']),
  'CO': rangeFromMatrix(['XXXXXXXXXXXXX','XXXXXXXXXXXXX','XXXXXXXXXX...','XXXXXXXX.....','XXXXXXXXX....','XXXXXXXXX....','X.....XXX....','X......XXX...','X.......XX...','X........XX..','..........X..','...........X.','............X']),
  'BTN': rangeFromMatrix(['XXXXXXXXXXXXX','XXXXXXXXXXXXX','XXXXXXXXXXXXX','XXXXXXXXXXXX.','XXXXXXXXXXXX.','XXXXXXXXXX...','XXXXXXXXXX...','XX..XXXXXXX..','XX......XXX..','XX.......XXX.','X.........XX.','X..........X.','X...........X'])
};
const mttSmallBlind = {
  raise: rangeFromMatrix(['...RRR...R...','..RRR........','R.R.R........','R..R.R.....RR','.R..R....RR..','........R....','....RR.......','...R..R.R....','.RR.......R..','...........RR','.............','.............','.............'].map(row=>row.replaceAll('R','X'))),
  call: rangeFromMatrix(['CCC...CCC.CCC','CC...CCCCCCCC','.C.C.CCCCCCCC','.CC.C.CCCCC..','C.C.CCCCC..CC','CCCCCCCC.CCCC','CCCC..CC.CCCC','CCC.CC.C.CCCC','C..CCCCCCC.CC','CCCCCCCCCCCRR'.replaceAll('R','.'),'CCCCC...CCCRC'.replaceAll('R','.'),'CCCCC.....CC','CCCC........C'].map(row=>row.replaceAll('C','X')))
};
const mttSmallBlindOverrides = {
  call: new Set(['JTo','76s','32s']),
  raise: new Set(['TT','86s','75s','43s']),
  fold: new Set(['43o'])
};
const cashPositions = ['UTG','UTG+1','LJ','HJ','CO','BTN'];
const mttPositions = ['UTG','UTG+1','UTG+2','LJ','HJ','CO','BTN','SB'];
const app = { game:'mtt', position:'UTG', mode:'fixed', randomPositions:new Set(mttPositions), correct:0, attempts:0, hand:null, cards:[], mistakes:[] };
const $ = (s) => document.querySelector(s);

function handName(a,b){
  const ai=ranks.indexOf(a.rank), bi=ranks.indexOf(b.rank);
  if(ai===bi) return a.rank+a.rank;
  const high=ai<bi?a:b, low=ai<bi?b:a;
  return high.rank+low.rank+(a.suit.symbol===b.suit.symbol?'s':'o');
}
function currentRange(){
  if(app.game==='mtt') return app.position==='SB' ? mttSmallBlind.raise : mttRanges[app.position];
  if(app.position==='BTN') return buttonOpenHands;
  if(app.position==='CO') return cutoffOpenHands;
  return ['LJ','HJ'].includes(app.position) ? middleOpenHands : earlyOpenHands;
}
function shouldRaise(hand){ return currentRange().has(hand); }
function correctAction(hand){
  if(app.game==='mtt' && app.position==='SB') {
    if(mttSmallBlindOverrides.call.has(hand)) return 'call';
    if(mttSmallBlindOverrides.raise.has(hand)) return 'raise';
    if(mttSmallBlindOverrides.fold.has(hand)) return 'fold';
  }
  if(app.game==='mtt' && app.position==='SB' && mttSmallBlind.call.has(hand)) return 'call';
  return shouldRaise(hand) ? 'raise' : 'fold';
}
function activePositions(){ return app.game==='mtt' ? mttPositions : cashPositions; }
function setPosition(position){
  app.position=position;
  $('#positionText').textContent=app.position;
  const markerClass=app.game==='mtt'
    ? {UTG:'mtt-utg','UTG+1':'mtt-utg1','UTG+2':'mtt-utg2',LJ:'mtt-lj',HJ:'mtt-hj',CO:'mtt-co',BTN:'mtt-btn',SB:'mtt-sb'}[app.position]
    : {UTG:'utg','UTG+1':'utg1',LJ:'lj',HJ:'hj',CO:'co',BTN:'btn'}[app.position];
  $('#heroMarker').className='hero-marker '+markerClass;
  makeChart();
}
function setRandomPosition(){
  let position=app.position;
  const positions=activePositions().filter(item=>app.randomPositions.has(item));
  while(position===app.position && positions.length>1) position=positions[Math.floor(Math.random()*positions.length)];
  setPosition(position);
}
function randomCards(){
  const cards=[];
  while(cards.length<2){
    const card={rank:ranks[Math.floor(Math.random()*ranks.length)],suit:suits[Math.floor(Math.random()*suits.length)]};
    if(!cards.some(c=>c.rank===card.rank && c.suit.symbol===card.suit.symbol)) cards.push(card);
  }
  return cards;
}
function cardsForHand(hand){
  const first=hand[0], second=hand[1];
  const firstSuit=suits[Math.floor(Math.random()*suits.length)];
  if(first===second){
    const otherSuits=suits.filter(suit=>suit.symbol!==firstSuit.symbol);
    return [{rank:first,suit:firstSuit},{rank:second,suit:otherSuits[Math.floor(Math.random()*otherSuits.length)]}];
  }
  if(hand[2]==='s') return [{rank:first,suit:firstSuit},{rank:second,suit:firstSuit}];
  const otherSuits=suits.filter(suit=>suit.symbol!==firstSuit.symbol);
  return [{rank:first,suit:firstSuit},{rank:second,suit:otherSuits[Math.floor(Math.random()*otherSuits.length)]}];
}
function drawHand(){
  if(app.mode==='random') setRandomPosition();
  const raiseHands=[...currentRange()];
  const prioritizeRaiseRange=app.position!=='SB' && Math.random()<0.25;
  const cards=prioritizeRaiseRange && raiseHands.length
    ? cardsForHand(raiseHands[Math.floor(Math.random()*raiseHands.length)])
    : randomCards();
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
  const expected=correctAction(app.hand), correct=action===expected;
  app.attempts++; if(correct) app.correct++;
  else {
    app.mistakes.unshift({
      position:app.position,
      cards:app.cards.map(card=>`<span class="suit-${card.suit.color}">${card.rank}${card.suit.symbol}</span>`).join(' · '),
      answer:expected.toUpperCase()
    });
    renderHistory();
  }
  const actions=$('#actions'); actions.classList.add('locked');
  const chosen=$(`[data-action="${action}"]`); chosen.classList.add('chosen',correct?'correct':'wrong');
  $(`[data-action="${expected}"]`).classList.add('correct');
  const feedback=$('#feedback'); feedback.hidden=false; feedback.className='feedback '+(correct?'':'incorrect');
  $('#feedbackIcon').textContent=correct?'✓':'×';
  $('#feedbackTitle').textContent=correct?'정답입니다!':'아쉽지만 다시 확인해 보세요.';
  $('#feedbackText').textContent=`${app.hand}은(는) ${expected==='raise'?'레이즈':expected==='call'?'콜':'폴드'}하는 핸드입니다.`;
  $('#nextHand').hidden=correct;
  updateScore();
  if(correct) setTimeout(drawHand, 425);
}
function togglePosition(){
  const positions=activePositions();
  const next=(positions.indexOf(app.position)+1)%positions.length;
  setPosition(positions[next]);
}
function setGame(game){
  app.game=game;
  const isMtt=game==='mtt';
  document.querySelector('.poker-table').classList.toggle('mtt',isMtt);
  document.querySelectorAll('[data-game]').forEach(button=>button.classList.toggle('active',button.dataset.game===game));
  document.querySelector('header .eyebrow').textContent=isMtt?"NO LIMIT HOLD'EM · MTT · 75 BB · 9 HANDED":"NO LIMIT HOLD'EM · CASH · 8 HANDED";
  const labels=isMtt
    ? {'left':'UTG','upper-left':'UTG+1','top':'UTG+2','upper-right':'LJ','right':'HJ','bottom-right':'CO','bottom':'BTN','bottom-left':'SB'}
    : {'left':'UTG','upper-left':'UTG+1','top':'LJ','upper-right':'HJ','right':'CO','bottom-right':'BTN','bottom':'SB','bottom-left':'BB'};
  Object.entries(labels).forEach(([seat,label])=>document.querySelector(`[data-seat="${seat}"]`).textContent=label);
  app.randomPositions=new Set(activePositions());
  updateRandomPositionButton();
  setPosition('UTG');
  drawHand();
}
function toggleMode(){
  app.mode=app.mode==='fixed'?'random':'fixed';
  const button=$('#modeToggle');
  const random=app.mode==='random';
  button.textContent=random?'RANDOM':'FIXED';
  button.classList.toggle('random',random);
  button.setAttribute('aria-pressed',random);
  $('#switchPosition').disabled=random;
  $('#randomPositions').hidden=!random;
  if(random) drawHand();
}
function updateRandomPositionButton(){
  const count=app.randomPositions.size;
  $('#randomPositions').textContent=count===activePositions().length?'전체 자리':`${count}개 자리`;
}
function renderPositionOptions(){
  $('#positionOptions').innerHTML=activePositions().map(position=>`<button class="position-option ${app.randomPositions.has(position)?'selected':''}" data-random-position="${position}">${position}</button>`).join('');
  document.querySelectorAll('[data-random-position]').forEach(button=>button.addEventListener('click',()=>{
    const position=button.dataset.randomPosition;
    if(app.randomPositions.has(position) && app.randomPositions.size===1) return;
    app.randomPositions.has(position) ? app.randomPositions.delete(position) : app.randomPositions.add(position);
    renderPositionOptions();
    updateRandomPositionButton();
  }));
}
function makeChart(){
  if(app.game==='mtt'){
    $('#rangePosition').textContent=`MTT · 75 BB · ${app.position}`;
    const smallBlind=app.position==='SB';
    $('#rangeLegend').className='legend mtt';
    $('#rangeLegend').innerHTML=smallBlind?'<i></i> 빨간색 Raise · 초록색 Call':'<i></i> 빨간 핸드만 레이즈';
    $('#rangeDescription').textContent='75BB · 9인 테이블 RFI · 빨간 핸드만 레이즈';
    $('#rangeGrid').innerHTML=ranks.flatMap((row,i)=>ranks.map((col,j)=>{
      let hand;
      if(i===j) hand=row+col; else if(j>i) hand=row+col+'s'; else hand=col+row+'o';
      const action=correctAction(hand);
      return `<div class="range-cell ${i===j?'pair':''} ${action==='raise'?'open mtt-open':action==='call'?'mtt-call':''}">${hand}</div>`;
    })).join('');
    return;
  }
  const middle=['LJ','HJ'].includes(app.position);
  $('#rangeLegend').className='legend';
  $('#rangeLegend').innerHTML='<i></i> 파란 핸드만 레이즈';
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
$('#nextHand').addEventListener('click',drawHand); $('#switchPosition').addEventListener('click',togglePosition); $('#modeToggle').addEventListener('click',toggleMode); $('#randomPositions').addEventListener('click',()=>{renderPositionOptions(); $('#positionDialog').showModal();}); $('#closePositions').addEventListener('click',()=>$('#positionDialog').close()); $('#selectAllPositions').addEventListener('click',()=>{app.randomPositions=new Set(activePositions());renderPositionOptions();updateRandomPositionButton();}); document.querySelectorAll('[data-game]').forEach(button=>button.addEventListener('click',()=>setGame(button.dataset.game)));
$('#chartButton').addEventListener('click',()=>{ makeChart(); $('#chartDialog').showModal(); }); $('#closeChart').addEventListener('click',()=>$('#chartDialog').close());
setGame('mtt'); updateScore(); renderHistory();
