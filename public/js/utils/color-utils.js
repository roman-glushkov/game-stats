export class ColorUtils {
  get(name) {
    if (!name) return "#4f8cff";
    const colors = [
      "#4f8cff",
      "#22c55e",
      "#ef4444",
      "#f59e0b",
      "#8b5cf6",
      "#06b6d4",
      "#ec4899",
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }
}
