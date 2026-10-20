'use strict';
const DAY=86400000;
function schedule(previous={},rating,now=Date.now()){
  if(!['again','hard','good'].includes(rating))throw Error('Invalid rating');
  const prior=Number.isFinite(previous.interval)&&previous.interval>0?previous.interval:0;
  const repetitions=Number.isInteger(previous.repetitions)?previous.repetitions:0;
  // Conservative day-based SRS: wrong answers reset the interval; good answers grow it.
  const interval=rating==='again'?1:rating==='hard'?Math.max(1,Math.ceil((prior||1)*1.5)):(repetitions===0?2:Math.max(3,Math.ceil((prior||2)*2)));
  return {repetitions:repetitions+1,interval,lastRating:rating,lastReviewed:new Date(now).toISOString(),dueAt:new Date(now+interval*DAY).toISOString()};
}
function summary(words,progress={},now=Date.now()){
  const counts={total:words.length,new:0,due:0,learning:0,scheduled:0};
  for(const word of words){const p=progress[word.id];if(!p){counts.new++;continue;}if(!Number.isFinite(Date.parse(p.dueAt))||Date.parse(p.dueAt)<=now)counts.due++;else if(p.lastRating==='again'||p.lastRating==='hard')counts.learning++;else counts.scheduled++;}
  return counts;
}
module.exports={schedule,summary};
