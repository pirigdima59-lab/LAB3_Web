import { Command } from 'commander';
import fs from 'node:fs';

const program = new Command();

program
  .name('orders')
  .description('CLI-програма для роботи із замовленнями інтернет-магазину')
  .version('1.0.0', '-V, --version', 'показати версію програми')
  .helpOption('-h, --help', 'показати довідку')
  .option('-f, --file <path>', 'шлях до JSON-файлу з замовленнями', 'data.json');

function fail(message) {
  console.error(`Помилка: ${message}`);
  process.exit(1);
}

function loadOrders() {
  const path = program.opts().file;
  let raw;
  try {
    raw = fs.readFileSync(path, 'utf8');
  } catch {
    fail(`не вдалося прочитати файл "${path}"`);
  }
  try {
    return JSON.parse(raw);
  } catch {
    fail(`файл "${path}" містить некоректний JSON`);
  }
}

program.parse();
