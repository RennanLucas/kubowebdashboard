const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, replacements) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    for (const [regex, replacement] of replacements) {
        content = content.replace(regex, replacement);
    }
    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${filePath}`);
    }
}

// 1. Fix catch (e: any)
const catchRegex = /catch\s*\(\s*([a-zA-Z0-9_]+)\s*:\s*any\s*\)/g;
const catchReplacement = 'catch ($1: unknown)';

// 2. Fix a: any, b: any in sorts
const sortRegex = /\.sort\(\(a:\s*any,\s*b:\s*any\)/g;
const sortReplacement = '.sort((a, b)';

// 3. Fix m: any in maps
const mapRegex = /\.map\(\(m:\s*any\)/g;
const mapReplacement = '.map((m)';
const mapRegex2 = /\.map\(\(p:\s*any\)/g;
const mapReplacement2 = '.map((p)';
const mapRegex3 = /\.map\(\(c:\s*any\)/g;
const mapReplacement3 = '.map((c)';
const mapRegex4 = /\.map\(\(item:\s*any\)/g;
const mapReplacement4 = '.map((item)';

const commonReplacements = [
    [catchRegex, catchReplacement],
    [sortRegex, sortReplacement],
    [mapRegex, mapReplacement],
    [mapRegex2, mapReplacement2],
    [mapRegex3, mapReplacement3],
    [mapRegex4, mapReplacement4],
];

function walk(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walk(fullPath);
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
            replaceInFile(fullPath, commonReplacements);
        }
    }
}

walk('./src');
walk('./supabase');
