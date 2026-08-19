const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const inputHtml = path.resolve(__dirname, '../supabase_database_operations_flow.html');
const outputPdf = path.resolve(__dirname, '../supabase_database_operations_flow.pdf');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

console.log('Converting HTML to PDF...');
console.log('Input:', inputHtml);
console.log('Output:', outputPdf);

const child = spawn(chromePath, [
  '--headless=new',
  '--disable-gpu',
  '--no-sandbox',
  '--print-to-pdf=' + outputPdf,
  '--no-pdf-header-footer',
  'file:///' + inputHtml.replace(/\\/g, '/')
]);

child.on('exit', (code) => {
  console.log('Chrome exited with code:', code);
  console.log('PDF Output exists:', fs.existsSync(outputPdf));
  if (fs.existsSync(outputPdf)) {
    const stats = fs.statSync(outputPdf);
    console.log('PDF File Size:', (stats.size / 1024).toFixed(2), 'KB');
  }
});
