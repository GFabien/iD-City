const convert = require('xml-js');

const xml = require('fs').readFileSync('./export_proposal_2018_09_27_10_52_38.xml', 'utf8');
const options = {
    ignoreComment: true,
    alwaysChildren: true,
    compact: true
};
const articles = convert.xml2js(xml, options).datas.data;
