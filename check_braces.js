const fs = require('fs');
const content = fs.readFileSync('/Users/apple/Desktop/vristo-next-main/components/company/company-settings-form.tsx', 'utf8');
const lines = content.split('\n');
const start = 862;
const end = 1179;
let openBraces = 0;
let closeBraces = 0;
let openParens = 0;
let closeParens = 0;

for (let i = start - 1; i < end; i++) {
    const line = lines[i];
    openBraces += (line.match(/{/g) || []).length;
    closeBraces += (line.match(/}/g) || []).length;
    openParens += (line.match(/\(/g) || []).length;
    closeParens += (line.match(/\)/g) || []).length;
}

console.log(`Braces: { ${openBraces}, } ${closeBraces} (diff: ${openBraces - closeBraces})`);
console.log(`Parens: ( ${openParens}, ) ${closeParens} (diff: ${openParens - closeParens})`);
