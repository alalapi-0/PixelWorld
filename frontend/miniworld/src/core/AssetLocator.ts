export type AssetSource = 'user' | 'external' | 'builtin';

const sharedAssetMap = import.meta.glob('@sharedAssets/**/*', {
  eager: true,
  as: 'url',
}) as Record<string, string>;

const externalAssetMap = import.meta.glob('../assets_external/**/*', {
  eager: true,
  as: 'url',
}) as Record<string, string>;

const buildAssetMap = import.meta.glob('../../assets/build/**/*', {
  eager: true,
  as: 'url',
}) as Record<string, string>;

const builtinAssetMap = import.meta.glob('../assets/**/*', {
  eager: true,
  as: 'url',
}) as Record<string, string>;

type LookupEntry = {
  source: AssetSource;
  map: Record<string, string>;
};

const LOOKUP_ORDER: LookupEntry[] = [
  { source: 'user', map: sharedAssetMap },
  { source: 'external', map: externalAssetMap },
  { source: 'external', map: buildAssetMap },
  { source: 'builtin', map: builtinAssetMap },
];

function normalise(path: string): string {
  return path.replace(/\\/g, '/');
}

function stripRelative(path: string): string {
  const normalised = normalise(path);
  return normalised.replace(/^\.\//, '').replace(/^\//, '');
}

export interface LocatedAsset {
  url: string;
  source: AssetSource;
  key: string;
}

export function findAsset(relativePath: string): LocatedAsset | null {
  const target = stripRelative(relativePath);
  for (const entry of LOOKUP_ORDER) {
    const match = Object.entries(entry.map).find(([key]) => normalise(key).endsWith(target));
    if (match) {
      return {
        url: match[1],
        source: entry.source,
        key: normalise(match[0]),
      };
    }
  }
  return null;
}

export function listAssets(): LocatedAsset[] {
  return LOOKUP_ORDER.flatMap((entry) =>
    Object.entries(entry.map).map(([key, url]) => ({
      url,
      source: entry.source,
      key: normalise(key),
    }))
  );
}
