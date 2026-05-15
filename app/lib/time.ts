export function formatPostTime(dateStr: string): string {
  const date = new Date(dateStr);
  const diff = Date.now() - date.getTime();
  const min = Math.floor(diff / 60000);

  if (min < 1) return "방금";
  if (min < 60) return `${min}분전`;

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const time = `${hours}:${minutes}`;

  if (min < 24 * 60) return time;

  return `${date.getMonth() + 1}/${date.getDate()} ${time}`;
}
