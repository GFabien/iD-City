sw = require('stopword');
const oldString = 'je suis très interresé par cette information, j\'aime partir à la plage'.split(' ');
const newString = sw.removeStopwords(oldString,sw.fr);
console.log(newString);
