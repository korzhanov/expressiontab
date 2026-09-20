/**
 * Удаление URL из dial: bookmark(s) + history.
 * Иначе «кольцо»: сняли закладку → остаётся history (или наоборот) → снова в индексе.
 */

export type DeleteDialChrome = {
  bookmarks?: {
    remove: (id: string, cb?: () => void) => void;
    search: (
      query: string | { url?: string; query?: string },
      cb: (results: { id?: string; url?: string }[]) => void
    ) => void;
  };
  history?: {
    deleteUrl: (details: { url: string }, cb?: () => void) => void;
  };
};

function asPromise(run: (done: () => void) => void): Promise<void> {
  return new Promise((resolve) => {
    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      resolve();
    };
    try {
      run(done);
    } catch {
      done();
    }
    // API без callback / mock — не висим
    setTimeout(done, 0);
  });
}

/** Снять все закладки с этим URL + запись history */
export async function deleteDialUrl({
  chromeApi,
  url,
  bookmarkId,
}: {
  chromeApi: DeleteDialChrome;
  url: string;
  /** Известный id закладки (если есть) */
  bookmarkId?: string | number | null;
}): Promise<{ removedBookmarkIds: string[]; historyDeleted: boolean }> {
  const removedBookmarkIds: string[] = [];
  if (!url || !/^https?:\/\//i.test(url)) {
    return { removedBookmarkIds, historyDeleted: false };
  }

  const bm = chromeApi.bookmarks;
  if (bm) {
    const ids = new Set<string>();
    if (bookmarkId != null && String(bookmarkId).length) {
      ids.add(String(bookmarkId));
    }
    // Поиск по URL — на случай другого id / дублей закладок
    await asPromise((done) => {
      try {
        bm.search({ url }, (results) => {
          for (const r of results || []) {
            if (r?.id) ids.add(String(r.id));
          }
          done();
        });
      } catch {
        done();
      }
    });
    for (const id of ids) {
      await asPromise((done) => {
        try {
          bm.remove(id, done);
          removedBookmarkIds.push(id);
        } catch {
          done();
        }
      });
    }
  }

  let historyDeleted = false;
  const hist = chromeApi.history;
  if (hist?.deleteUrl) {
    await asPromise((done) => {
      try {
        hist.deleteUrl({ url }, () => {
          historyDeleted = true;
          done();
        });
      } catch {
        done();
      }
    });
  }

  return { removedBookmarkIds, historyDeleted };
}
