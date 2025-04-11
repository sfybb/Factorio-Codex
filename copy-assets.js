#!/bin/node

const fs = require("fs");
const path = require("path");

// Define source and destination paths
const filesToCopy = ["thumbnail.png", "changelog.txt", "info.json"];
const dirsToCopy = ["locale"];
const sourceDir = path.join(__dirname); // Current project root
const buildDir = path.join(__dirname, "build"); // Output directory

// Ensure build directory exists
if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true });
}

function copyDirectory(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }

    fs.readdirSync(src, { withFileTypes: true }).forEach(entry => {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyDirectory(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
            console.log(`✅ Copied ${srcPath} -> ${destPath}`);
        }
    });
}

// Copy files
filesToCopy.forEach(file => {
    const src = path.join(sourceDir, file);
    const dest = path.join(buildDir, file);
    fs.copyFileSync(src, dest);
    console.log(`Copied ${file} to build/`);
});

// Copy directories
dirsToCopy.forEach(dir => {
    const src = path.join(sourceDir, dir);
    const dest = path.join(buildDir, dir);
    copyDirectory(src, dest);
    console.log(`Copied ${dir}/ to build/`);
});
