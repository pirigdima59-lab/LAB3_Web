import { Command } from 'commander';
import fs from 'node:fs';

const program = new Command();

program
  .name('orders')
  .description('CLI-програма для роботи із замовленнями інтернет-магазину')
  .version('1.0.0', '-V, --version', 'показати версію програми')
  .helpOption('-h, --help', 'показати довідку')
  .option('-f, --file <path>', 'шлях до JSON-файлу з замовленнями', 'data.json');

const errorTranslations = [
  [/^error: missing required argument '(.+)'/, (m) => `відсутній обов'язковий аргумент '${m[1]}'`],
  [/^error: unknown option '(.+)'/, (m) => `невідома опція '${m[1]}'`],
  [/^error: unknown command '(.+)'/, (m) => `невідома команда '${m[1]}'`],
  [/^error: option '(.+)' argument missing/, (m) => `для опції '${m[1]}' не вказано значення`],
  [/^error: too many arguments/, () => 'забагато аргументів'],
];

program.configureOutput({
  outputError: (str) => {
    const text = str.trim();
    for (const [re, build] of errorTranslations) {
      const m = text.match(re);
      if (m) {
        console.error(`Помилка: ${build(m)}`);
        return;
      }
    }
    console.error(`Помилка: ${text.replace(/^error: /, '')}`);
  },
});

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


function findOrder(orders, id) {
  const order = orders.find((o) => o.id === id);
  if (!order) fail(`замовлення з id "${id}" не знайдено`);
  return order;
}

program
  .command('list')
  .description('показати список замовлень')
  .option('-l, --limit <n>', 'максимальна кількість замовлень у списку')
  .action((options) => {
    const orders = loadOrders();
    let limit = orders.length;
    if (options.limit !== undefined) {
      limit = Number(options.limit);
      if (!Number.isInteger(limit) || limit < 1) {
        fail('--limit має бути додатним цілим числом');
      }
    }
    for (const o of orders.slice(0, limit)) {
      console.log(`${o.id}  ${o.orderDate}  ${o.customerName}  ${o.status}`);
    }
  });

program
  .command('show')
  .description('показати одне замовлення цілком')
  .argument('<id>', 'id замовлення, наприклад ord001')
  .action((id) => {
    console.log(JSON.stringify(findOrder(loadOrders(), id), null, 2));
  });

program
  .command('get')
  .description('показати значення поля замовлення')
  .argument('<id>', 'id замовлення, наприклад ord001')
  .argument('<path>', 'шлях до поля через крапку, наприклад deliveryAddress.city')
  .action((id, path) => {
    let value = findOrder(loadOrders(), id);
    for (const key of path.split('.')) {
      if (value === null || typeof value !== 'object' || !(key in value)) {
        fail(`поле "${path}" не знайдено`);
      }
      value = value[key];
    }
    console.log(typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value));
  });

program.parse();
