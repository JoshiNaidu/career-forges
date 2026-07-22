#!/usr/bin/env node

/**
 * Manual Update Control Script
 * 
 * Usage:
 *   node update-control.js enable       (allow updates)
 *   node update-control.js disable      (block all updates)
 *   node update-control.js version 0.2.3 (release specific version)
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const REPO = 'JoshiNaidu/career-forges';
const RELEASE_API = `https://api.github.com/repos/${REPO}/releases/latest`;

function fetchLatestRelease() {
  return new Promise((resolve, reject) => {
    https.get(RELEASE_API, {
      headers: { 'User-Agent': 'Node.js' }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function disableUpdates() {
  console.log('📌 Creating disabled update manifest...');
  
  const manifest = {
    version: "999.99.99",  // Higher than any real version to prevent updates
    notes: "Updates are currently disabled",
    pub_date: new Date().toISOString(),
    platforms: {
      "windows-x86_64": {
        signature: "disabled",
        url: "https://github.com/JoshiNaidu/career-forges/releases"
      }
    }
  };
  
  fs.writeFileSync('latest.json', JSON.stringify(manifest, null, 2));
  console.log('✅ Updates disabled. latest.json updated.');
}

async function enableUpdates(version) {
  console.log('📌 Fetching latest release...');
  
  const release = await fetchLatestRelease();
  const releaseAsset = release.assets.find(a => a.name === 'latest.json');
  
  if (!releaseAsset) {
    console.error('❌ latest.json not found in release assets');
    process.exit(1);
  }
  
  console.log(`✅ Enabling updates for version ${release.tag_name}`);
  
  // Download latest.json from release
  const downloadUrl = releaseAsset.browser_download_url;
  https.get(downloadUrl, {
    headers: { 'User-Agent': 'Node.js' }
  }, (res) => {
    res.pipe(fs.createWriteStream('latest.json'));
    res.on('end', () => {
      console.log('✅ Updates enabled with latest.json from release');
    });
  });
}

const command = process.argv[2];

if (command === 'disable') {
  disableUpdates().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });
} else if (command === 'enable') {
  enableUpdates().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });
} else {
  console.log(`
Usage:
  node update-control.js disable     - Block all app updates
  node update-control.js enable      - Allow app updates
  
This creates/updates latest.json which apps check for updates.
`);
}
