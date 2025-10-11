import buildIndex from '../../assets/build/index.json';

const buildAssetMap = import.meta.glob('../../assets/build/**/*', {
  eager: true,
  as: 'url',
}) as Record<string, string>;

type BuildIndexSection = Record<string, string[]>;

type BuildIndex = {
  images?: BuildIndexSection;
  audio?: BuildIndexSection;
};

const canonicalToUrl = new Map<string, string>();
const aliasToCanonical = new Map<string, string>();

function normalise(path: string): string {
  return path.replace(/\\/g, '/').replace(/^\.\/+/, '').replace(/^\/+/, '');
}

function registerAlias(alias: string, canonical: string): void {
  aliasToCanonical.set(normalise(alias), canonical);
}

function registerCanonical(canonical: string, url: string): void {
  const key = normalise(canonical);
  canonicalToUrl.set(key, url);
  registerAlias(key, key);
  registerAlias(`assets/build/${key}`, key);
  registerAlias(`./assets/build/${key}`, key);
  if (key.startsWith('images/')) {
    registerAlias(`images:${key.split('/', 2)[1]}`, key);
  }
  if (key.startsWith('audio/')) {
    registerAlias(`audio:${key.split('/', 2)[1]}`, key);
  }
}

Object.entries(buildAssetMap).forEach(([key, url]) => {
  const stripped = key.replace('../../assets/build/', '');
  registerCanonical(stripped, url);
});

function registerIndexSection(section?: BuildIndexSection): void {
  if (!section) {
    return;
  }
  Object.values(section).forEach((entries) => {
    entries.forEach((entry) => {
      registerAlias(entry, normalise(entry));
      registerAlias(`assets/build/${entry}`, normalise(entry));
    });
  });
}

const typedIndex = buildIndex as BuildIndex;
registerIndexSection(typedIndex.images);
registerIndexSection(typedIndex.audio);

export function resolve(pathFromIndex: string): string {
  const normalised = normalise(pathFromIndex);
  const canonical = aliasToCanonical.get(normalised) ?? normalised;
  const direct = canonicalToUrl.get(canonical);
  if (direct) {
    return direct;
  }
  const fallback = canonicalToUrl.get(aliasToCanonical.get(`assets/build/${canonical}`) ?? canonical);
  if (fallback) {
    return fallback;
  }
  return canonical.startsWith('http') ? canonical : `assets/${canonical}`;
}
