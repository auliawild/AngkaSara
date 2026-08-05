import { describe, it, expect } from "vitest";
import {
  menitLalu,
  statusKehadiran,
  labelWaktuLalu,
  hariSama,
  ringkasHarian,
  gabungRiwayat,
  AMBANG_ONLINE_MENIT,
  type AktivitasRingkas,
  type CheckpointRingkas,
} from "@/lib/pantau";

const now = new Date("2026-08-05T10:00:00");
const menitLalu2 = (m: number) => new Date(now.getTime() - m * 60_000);

describe("pantau — status kehadiran", () => {
  it("menitLalu: null = tak hingga, selisih benar", () => {
    expect(menitLalu(null, now)).toBe(Number.POSITIVE_INFINITY);
    expect(menitLalu(menitLalu2(3), now)).toBeCloseTo(3, 5);
  });

  it("statusKehadiran: online ≤5mnt, baru ≤30mnt, selebihnya lama", () => {
    expect(statusKehadiran(menitLalu2(1), now)).toBe("online");
    expect(statusKehadiran(menitLalu2(AMBANG_ONLINE_MENIT), now)).toBe("online");
    expect(statusKehadiran(menitLalu2(10), now)).toBe("baru");
    expect(statusKehadiran(menitLalu2(45), now)).toBe("lama");
    expect(statusKehadiran(null, now)).toBe("lama");
  });

  it("labelWaktuLalu: ramah bahasa Indonesia", () => {
    expect(labelWaktuLalu(null, now)).toBe("belum pernah");
    expect(labelWaktuLalu(menitLalu2(0.5), now)).toBe("baru saja");
    expect(labelWaktuLalu(menitLalu2(3), now)).toBe("3 mnt lalu");
    expect(labelWaktuLalu(menitLalu2(120), now)).toBe("2 jam lalu");
    expect(labelWaktuLalu(menitLalu2(60 * 24), now)).toBe("kemarin");
    expect(labelWaktuLalu(menitLalu2(60 * 24 * 3), now)).toBe("3 hari lalu");
  });

  it("hariSama: bandingkan hari kalender lokal", () => {
    expect(hariSama(new Date("2026-08-05T23:59:00"), new Date("2026-08-05T00:01:00"))).toBe(true);
    expect(hariSama(new Date("2026-08-05T23:59:00"), new Date("2026-08-06T00:01:00"))).toBe(false);
  });
});

const akt = (domain: string, over: Partial<AktivitasRingkas> = {}): AktivitasRingkas => ({
  domain,
  category: "Pecahan",
  level: "Level 5",
  activity: "Pecahan Lv5",
  score: 80,
  points: 120,
  stars: 3,
  wpm: null,
  createdAt: now,
  ...over,
});

describe("pantau — ringkas harian", () => {
  it("menghitung num & lit HARI INI saja", () => {
    const data = [
      akt("NUMERASI"),
      akt("NUMERASI", { createdAt: menitLalu2(30) }),
      akt("LITERASI"),
      akt("NUMERASI", { createdAt: new Date("2026-08-04T10:00:00") }), // kemarin — diabaikan
    ];
    expect(ringkasHarian(data, now)).toEqual({ num: 2, lit: 1, total: 3 });
  });
});

describe("pantau — gabung riwayat", () => {
  const cp: CheckpointRingkas = {
    period: "2026-08",
    total: 70,
    numerasi: 75,
    literasi: 65,
    benarNum: 6,
    totalNum: 8,
    benarLit: 5,
    totalLit: 8,
    submittedAt: menitLalu2(120),
  };

  it("gabung SKIBA/SKIBACA/Check Point → kronologis terbaru dulu", () => {
    const data = [
      akt("NUMERASI", { createdAt: menitLalu2(5) }),
      akt("LITERASI", { createdAt: menitLalu2(200), activity: "Mobil Ayah", wpm: 67 }),
    ];
    const r = gabungRiwayat(data, [cp]);
    expect(r).toHaveLength(3);
    expect(r.map((x) => x.jenis)).toEqual(["SKIBA", "CHECKPOINT", "SKIBACA"]); // 5mnt, 120mnt, 200mnt
    expect(r[0].judul).toBe("Pecahan Lv5");
    expect(r[1].judul).toBe("Check Point 2026-08");
    expect(r[2].wpm).toBe(67);
  });

  it("Check Point tanpa submittedAt diabaikan", () => {
    expect(gabungRiwayat([], [{ ...cp, submittedAt: null }])).toHaveLength(0);
  });
});
