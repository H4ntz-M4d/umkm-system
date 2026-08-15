import { dayjs } from "@repo/utils";

/// Kunci bucket dari backend berbentuk "yyyy-MM"; diubah ke "Agu 2026" agar
/// sumbu grafik tetap pendek namun tahunnya tidak hilang saat rentangnya
/// melewati pergantian tahun.
export function monthLabel(period: string) {
  return dayjs(`${period}-01`).locale("id").format("MMM YYYY");
}
