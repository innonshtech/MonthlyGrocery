jest.mock('@react-native-async-storage/async-storage', () => {
  let store = {};
  return {
    getItem: jest.fn((key) => Promise.resolve(store[key] || null)),
    setItem: jest.fn((key, value) => {
      store[key] = value;
      return Promise.resolve(null);
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
      return Promise.resolve(null);
    }),
    clear: jest.fn(() => {
      store = {};
      return Promise.resolve(null);
    }),
    getAllKeys: jest.fn(() => Promise.resolve(Object.keys(store))),
    multiGet: jest.fn((keys) =>
      Promise.resolve(keys.map((k) => [k, store[k] || null]))
    ),
    multiSet: jest.fn((keyValuePairs) => {
      keyValuePairs.forEach(([k, v]) => {
        store[k] = v;
      });
      return Promise.resolve(null);
    }),
    multiRemove: jest.fn((keys) => {
      keys.forEach((k) => {
        delete store[k];
      });
      return Promise.resolve(null);
    }),
  };
});
