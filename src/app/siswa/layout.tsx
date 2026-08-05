import SiswaTabs from "./bottom-tabs";
import HeartbeatSiswa from "./heartbeat";

/** Layout area siswa: menyisakan ruang untuk tab bar bawah & memasangnya. */
export default function SiswaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col pb-20">
      <HeartbeatSiswa />
      {children}
      <SiswaTabs />
    </div>
  );
}
