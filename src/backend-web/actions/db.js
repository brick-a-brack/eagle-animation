import { openDB } from 'idb';

// Shared IndexedDB opener for every web backend store. This replaces Dexie
// (issue #584): owning the open/upgrade path ourselves means schema upgrades
// can no longer hang silently, and a failed open never permanently bricks the
// context.
//
// We never hardcode a schema version. Dexie left these databases at arbitrary
// IndexedDB versions (its version numbering is an implementation detail — one
// project was found at version 51), so forcing a fixed number risks a
// downgrade `VersionError`. Instead we open at whatever version currently
// exists, and only bump to `current + 1` (running `upgrade`) when the store
// layout actually needs work — decided by `needsUpgrade(db)`. Once the layout is
// correct, `needsUpgrade` returns false and the version stays put forever.
//
// These databases are opened from BOTH the page and the Service Worker, so a
// schema upgrade on one side would otherwise be blocked forever by the other
// side's open connection — the `blocking` handler makes each connection step
// aside and reopen lazily afterwards.
export const createDbAccessor = (name, { needsUpgrade, upgrade }) => {
  let dbPromise = null;

  const lifecycle = () => ({
    blocked() {
      console.warn(`[${name}] open blocked by another connection holding an older version`);
    },
    blocking() {
      // Another connection (page ⇄ Service Worker) wants to upgrade. Close this
      // one so it isn't blocked, and drop the cached promise so the next access
      // transparently reopens at the new version.
      console.warn(`[${name}] closing so another connection can upgrade`);
      const closing = dbPromise;
      dbPromise = null;
      closing?.then((db) => db.close()).catch(() => {});
    },
    terminated() {
      console.error(`[${name}] connection terminated unexpectedly`);
      dbPromise = null;
    },
  });

  const open = async () => {
    // Open at the current version (undefined → no forced version → never a
    // VersionError, whatever value Dexie left behind).
    let db = await openDB(name, undefined, lifecycle());
    if (needsUpgrade(db)) {
      const nextVersion = db.version + 1;
      db.close();
      db = await openDB(name, nextVersion, { upgrade, ...lifecycle() });
    }
    return db;
  };

  return () => {
    if (!dbPromise) {
      dbPromise = open().catch((err) => {
        // Never cache a rejected open promise: reset it so the next call can
        // retry instead of the database staying dead for this context's lifetime.
        dbPromise = null;
        console.error(`[${name}] open failed`, err?.name, err?.message);
        throw err;
      });
    }
    return dbPromise;
  };
};
