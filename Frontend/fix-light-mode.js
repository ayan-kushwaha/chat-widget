#!/usr/bin/env node

/**
 * Final light mode fix for UserProfileDrawer
 * Fixes remaining text colors in stats, titles, and icons
 */

const fs = require('fs');

const filePath = 'c:\\Users\\Aryan\\my\\cluaiz\\Frontend\\src\\app\\dashboard\\ai-studio\\memory\\UserProfileDrawer.tsx';

const replacements = [
    // Stats numbers - should be darker in light mode
    { from: /text-slate-500 dark:text-white/g, to: 'text-slate-900 dark:text-white' },

    // Small labels that are too light
    { from: /text-slate-400 dark:text-slate-600 dark:text-slate-400/g, to: 'text-slate-600 dark:text-slate-400' },

    // Filter view label
    { from: /text-slate-400 dark:text-slate-600 dark:text-slate-400 uppercase/g, to: 'text-slate-600 dark:text-slate-400 uppercase' },
];

try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    replacements.forEach(({ from, to }) => {
        if (content.match(from)) {
            content = content.replace(from, to);
            modified = true;
            console.log(`✅ Replaced: ${from} → ${to}`);
        }
    });

    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('\n✅ UserProfileDrawer text colors fixed!');
    } else {
        console.log('⏭️  No changes needed');
    }
} catch (error) {
    console.error('❌ Error:', error.message);
}
