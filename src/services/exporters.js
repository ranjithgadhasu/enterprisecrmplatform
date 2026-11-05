import { downloadFile, toCsv } from "../utils/format";

export function exportCsv(filename, rows) {
  downloadFile(filename, toCsv(rows), "text/csv;charset=utf-8");
}

export function exportJson(filename, data) {
  downloadFile(filename, JSON.stringify(data, null, 2), "application/json");
}
