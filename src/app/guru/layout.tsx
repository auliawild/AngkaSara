import BottomTabs from "./bottom-tabs";

/** Layout area guru: menyisakan ruang untuk tab bar bawah (mobile) & memasangnya. */
export default function GuruLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col pb-20">
      {children}
      <BottomTabs />
    </div>
  );
}
