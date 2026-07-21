import SiswaTabs from "./bottom-tabs";

/** Layout area siswa: menyisakan ruang untuk tab bar bawah & memasangnya. */
export default function SiswaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col pb-20">
      {children}
      <SiswaTabs />
    </div>
  );
}
