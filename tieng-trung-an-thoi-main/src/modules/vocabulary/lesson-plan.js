'use strict';
/** Deterministic lessons from the editable vocabulary bank. No HSK certification is implied. */
function buildLessons(catalog, progress = {}, size = 5) {
  const items = Array.isArray(catalog.vocabulary) ? catalog.vocabulary : [];
  const categories = Array.isArray(catalog.categories) ? catalog.categories : [];
  const now = Date.now();
  return categories.flatMap(category => {
    const words = items.filter(w => w.category === category.id);
    const lessons = [];
    for (let start = 0; start < words.length; start += size) {
      const part = words.slice(start, start + size);
      const reviewed = part.filter(w => Boolean(progress[w.id])).length;
      const due = part.filter(w => progress[w.id] && Number.isFinite(Date.parse(progress[w.id].dueAt)) && Date.parse(progress[w.id].dueAt) <= now).length;
      lessons.push({id:`${category.id}-${Math.floor(start/size)+1}`,categoryId:category.id,categoryTitle:category.title,title:`Bài ${Math.floor(start/size)+1}`,wordIds:part.map(w=>w.id),total:part.length,reviewed,due,completed:reviewed===part.length});
    }
    return lessons;
  });
}
module.exports = {buildLessons};
