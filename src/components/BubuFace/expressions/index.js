import { DEFAULTS, DEFINITIONS } from './definitions.js';

export const EXPRESSIONS = Object.fromEntries(
  DEFINITIONS.map((definition) => [definition.key, { ...DEFAULTS, ...definition }]),
);

export const EXPRESSION_NAMES = DEFINITIONS.map((definition) => definition.key);

export function getExpression(key) {
  return EXPRESSIONS[key] || EXPRESSIONS.neutral;
}
