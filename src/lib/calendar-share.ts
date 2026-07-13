export interface ShareNavigator {
  canShare?: (data?: ShareData) => boolean;
  share?: (data?: ShareData) => Promise<void>;
}

export async function shareOrDownloadCalendar(file: File, navigatorApi: ShareNavigator, downloadFallback: () => void) {
  if (navigatorApi.share && navigatorApi.canShare?.({ files: [file] })) {
    await navigatorApi.share({ files: [file], title: "ランク計画カレンダー", text: "カレンダーへ追加する予定ファイルです。" });
    return "shared" as const;
  }
  downloadFallback();
  return "downloaded" as const;
}
