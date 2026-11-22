const assert = require('node:assert/strict');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { pathToFileURL } = require('node:url');
const { build } = require('esbuild');

// storage.ts 直接 import 了 React / ahooks / hox 以及无后缀的 ./editorSettings，
// Node 的 ESM 解析拿不到，所以先用 esbuild 打成一个临时 ESM 文件再动态 import。
let storageModulePromise;
function loadStorage() {
  storageModulePromise ??= (async () => {
    const outfile = path.join(os.tmpdir(), `ztools-quicklinks-storage-${process.pid}.mjs`);
    await build({
      entryPoints: [path.join(__dirname, '..', 'src', 'storage.ts')],
      bundle: true,
      format: 'esm',
      platform: 'node',
      outfile,
      logLevel: 'silent',
    });
    return import(pathToFileURL(outfile).href);
  })();
  return storageModulePromise;
}

/** 装一个假的 ztools.dbStorage，返回底层 Map 便于断言写入结果。 */
function installFakeDb(initial = {}) {
  const store = new Map(Object.entries(initial));
  globalThis.window = {
    ztools: {
      dbStorage: {
        getItem: key => (store.has(key) ? store.get(key) : null),
        setItem: (key, value) => {
          store.set(key, value);
        },
        removeItem: (key) => {
          store.delete(key);
        },
      },
    },
  };
  return store;
}

function codeBookmark(value) {
  return { id: 'quick_code', name: 'main.ts', value, type: 'code' };
}

test('validates links, snippets and code bookmarks', async () => {
  const { validateQuickLinks } = await loadStorage();

  assert.equal(validateQuickLinks([]), true);
  assert.equal(validateQuickLinks([
    { id: 'quick_1', name: '官网', value: 'https://example.com', type: 'link' },
    { id: 'quick_2', name: '片段', value: 'console.log(1)', type: 'snippet' },
    { id: 'quick_3', name: '主文件', value: 'C:\\project\\src\\main.ts:12:3', type: 'code', editorId: 'vscode' },
    { id: 'quick_4', name: '无类型', value: 'https://example.com/plain' },
  ]), true);

  assert.equal(validateQuickLinks([codeBookmark('/Users/demo/project/main.ts')]), true);
  assert.equal(validateQuickLinks([codeBookmark('/Users/demo/project/main.ts:1')]), true);
  assert.equal(validateQuickLinks([codeBookmark('\\\\server\\share\\main.ts:9')]), true);
});

test('rejects corrupted item payloads instead of rendering them', async () => {
  const { validateQuickLinks } = await loadStorage();

  for (const corrupted of [
    null,
    'not-an-array',
    { id: 'quick_1', name: 'a', value: 'b' },
    [null],
    [{ value: 'b' }],
    [{ name: 1, value: 'b' }],
    [{ name: 'a', value: 2 }],
    [{ name: 'a', value: 'b', type: 'unknown' }],
    [{ name: 'a', value: 'b', editorId: 3 }],
    [codeBookmark('relative/path.ts:1')],
    [codeBookmark('/Users/demo/main.ts:0')],
    [codeBookmark('')],
  ]) {
    assert.equal(validateQuickLinks(corrupted), false, `should reject ${JSON.stringify(corrupted)}`);
  }
});

test('validates group payloads and drops anything missing structural fields', async () => {
  const { validateQuickLinksGroups } = await loadStorage();

  const valid = { id: 'group_1', name: '工作', color: '#1677ff', type: 'default', createTime: 1, updateTime: 2 };
  assert.equal(validateQuickLinksGroups([]), true);
  assert.equal(validateQuickLinksGroups([valid]), true);
  assert.equal(validateQuickLinksGroups([{ ...valid, type: 'remote', remoteUrl: 'https://example.com/g.json' }]), true);

  for (const corrupted of [
    null,
    {},
    [null],
    [{ ...valid, id: undefined }],
    [{ ...valid, color: 1 }],
    [{ ...valid, type: 'unknown' }],
    [{ ...valid, createTime: '1' }],
    [{ ...valid, updateTime: undefined }],
  ]) {
    assert.equal(validateQuickLinksGroups(corrupted), false, `should reject ${JSON.stringify(corrupted)}`);
  }
});

test('reading storage falls back to an empty list when persisted data is corrupted', async () => {
  const { getQuickLinksData, getQuickLinksGroupsData, QUICK_LINKS_STORAGE_KEY, QUICK_LINKS_GROUPS_STORAGE_KEY } = await loadStorage();

  installFakeDb({ [QUICK_LINKS_STORAGE_KEY]: [{ name: 'only-name' }], [QUICK_LINKS_GROUPS_STORAGE_KEY]: 'broken' });
  assert.deepEqual(getQuickLinksData(), []);
  assert.deepEqual(getQuickLinksGroupsData(), []);

  const items = [{ id: 'quick_1', name: '官网', value: 'https://example.com', type: 'link' }];
  installFakeDb({ [QUICK_LINKS_STORAGE_KEY]: items });
  assert.deepEqual(getQuickLinksData(), items);
});

test('writing storage round-trips through dbStorage and fails loudly without a host', async () => {
  const { setQuickLinksData, getQuickLinksData, QUICK_LINKS_STORAGE_KEY } = await loadStorage();

  const store = installFakeDb();
  const items = [{ id: 'quick_1', name: '官网', value: 'https://example.com' }];
  setQuickLinksData(items);
  assert.deepEqual(store.get(QUICK_LINKS_STORAGE_KEY), items);
  assert.deepEqual(getQuickLinksData(), items);

  globalThis.window = {};
  assert.throws(() => setQuickLinksData(items), /请在 ZTools 中保存内容/);
});

test('selected group defaults to all and persists the last choice', async () => {
  const { getSelectedGroupId, setSelectedGroupId } = await loadStorage();

  const store = installFakeDb();
  assert.equal(getSelectedGroupId(), 'all');
  setSelectedGroupId('group_1');
  assert.equal(store.get('quickLinksSelectedGroup'), 'group_1');
  assert.equal(getSelectedGroupId(), 'group_1');
});

test('remote group cache survives a round-trip and defaults to empty', async () => {
  const { getRemoteGroupCache, setRemoteGroupCache } = await loadStorage();

  installFakeDb();
  assert.deepEqual(getRemoteGroupCache(), {});

  const cache = { group_1: { data: [{ name: '官网', value: 'https://example.com' }], timestamp: 1700000000000 } };
  setRemoteGroupCache(cache);
  assert.deepEqual(getRemoteGroupCache(), cache);
});
