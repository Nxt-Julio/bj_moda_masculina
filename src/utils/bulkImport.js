import { parsePriceToCents } from './formatters';
import { buildTaxonomyFields } from '../data/catalogTaxonomy';

function parseActive(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return true;

  const truthy = new Set(['sim', 'true', '1', 'ativo', 'yes']);
  const falsy = new Set(['nao', 'false', '0', 'inativo', 'no']);

  if (truthy.has(normalized)) return true;
  if (falsy.has(normalized)) return false;

  throw new Error(`Valor de ativo invalido: "${value}". Use sim ou nao.`);
}

function splitLine(line) {
  if (line.includes('|')) {
    return line.split('|').map((item) => item.trim());
  }

  if (line.includes(';')) {
    return line.split(';').map((item) => item.trim());
  }

  throw new Error('Cada linha precisa usar "|" ou ";" como separador.');
}

export function parseProductsBulkInput(input) {
  const rawLines = String(input || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!rawLines.length) {
    throw new Error('Cole pelo menos uma linha para importar.');
  }

  const products = [];

  rawLines.forEach((line, index) => {
    const columns = splitLine(line);

    if (columns.length < 4) {
      throw new Error(`Linha ${index + 1} invalida. Use: nome | url | preco | estoque | descricao | ativo | grupo | subgrupo`);
    }

    const [name, imageUrl, priceText, stockText, description = '', activeText = 'sim', groupSlug = '', subgroupSlug = ''] = columns;
    const priceCents = parsePriceToCents(priceText);
    const stock = Number(stockText);
    const taxonomy = buildTaxonomyFields({ groupSlug, subgroupSlug, fallbackText: `${name} ${description} ${imageUrl}` });

    if (!name) {
      throw new Error(`Linha ${index + 1}: nome obrigatorio.`);
    }

    if (!imageUrl) {
      throw new Error(`Linha ${index + 1}: URL da imagem obrigatoria.`);
    }

    if (priceCents === null) {
      throw new Error(`Linha ${index + 1}: preco invalido.`);
    }

    if (!Number.isInteger(stock) || stock < 0) {
      throw new Error(`Linha ${index + 1}: estoque invalido.`);
    }

    if (!taxonomy.groupSlug || !taxonomy.subgroupSlug) {
      throw new Error(`Linha ${index + 1}: informe grupo e subgrupo validos.`);
    }

    products.push({
      name: name.trim(),
      imageUrl: imageUrl.trim(),
      priceCents,
      stock,
      description: description.trim(),
      active: parseActive(activeText),
      groupSlug: taxonomy.groupSlug,
      groupName: taxonomy.groupName,
      subgroupSlug: taxonomy.subgroupSlug,
      subgroupName: taxonomy.subgroupName,
    });
  });

  return products;
}
