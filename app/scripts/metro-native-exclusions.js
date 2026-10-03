/**
 * Patterns for metro-config exclusionList() — each must match the FULL path
 * (exclusionList appends `$`). Substring-only rules like /android/ never match.
 */
const NATIVE_TREE_EXCLUSIONS = [
  /.*[/\\]android([/\\].*)?/,
  /.*[/\\]ios([/\\].*)?/,
  /.*[/\\]\.gradle([/\\].*)?/,
  /.*[/\\]\.cxx([/\\].*)?/,
];

module.exports = { NATIVE_TREE_EXCLUSIONS };
