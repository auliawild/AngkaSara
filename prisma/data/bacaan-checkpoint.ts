// AUTO — disalin dari D:\LitNum\assets\soal-literasi.js (bank Check Point, 32 bacaan x 5 soal).
// Kunci SELALU di options[0] (answer:0). Pengacakan opsi terjadi di checkpoint.ts (acakOpsiBacaan).
export interface BacaanSeed {
  id: string;
  jurusan: string;
  title: string;
  text: string;
  questions: { q: string; options: string[]; answer: number }[];
}

/* ============================================================
   BANK BACAAN LITERASI - Check Point
   SMK Negeri 1 Badegan

   Dipakai oleh ujian.html. Bacaan bertema jurusan SMK + tema umum lintas jurusan,
   panjang teks ~95-105 kata, tiap bacaan 5 soal pemahaman.

   Format: {id, jurusan, title, text, questions:[{q, options:[4], answer:index}]}

   CATATAN PENTING: di bank ini kunci SELALU ditaruh di options[0] (answer:0) supaya
   mudah ditulis & diperiksa. Yang MENGACAK posisi opsi adalah acakOpsiBacaan() di
   ujian.html saat soal dibangun. Jangan tampilkan opsi apa adanya dari bank ini --
   jawaban benar akan selalu jatuh di pilihan A.

   Bacaan dirotasi tiap bulan (jendela bergeser 1 tiap bulan, lihat bangunSoal()).
   Dengan 30 bacaan dan 3 bacaan per check point, susunannya baru berulang setelah
   30 bulan; bacaan yang sama baru muncul lagi setelah ~10 bulan.
============================================================ */
export const BACAAN_CHECKPOINT: BacaanSeed[] = [
  {
    id:'tkr-rem', jurusan:'Teknik Kendaraan Ringan (TKR)',
    title:'Merawat Sistem Rem Cakram',
    text:'Sistem rem cakram bekerja dengan menjepit piringan logam memakai kampas rem. Gesekan itulah yang memperlambat laju kendaraan. Karena bekerja dengan gesekan, kampas rem akan menipis seiring pemakaian dan wajib diperiksa berkala. Kampas yang terlalu tipis membuat jarak pengereman memanjang dan piringan bisa tergores. Selain kampas, minyak rem juga perlu diperhatikan. Minyak rem bersifat menyerap air dari udara, sehingga titik didihnya menurun. Jika minyak mendidih, muncul gelembung udara di saluran dan pedal rem terasa kosong saat diinjak. Kondisi ini disebut vapor lock dan sangat berbahaya di jalan menurun. Karena itu bengkel menyarankan penggantian minyak rem setiap dua tahun, meskipun kendaraan jarang dipakai.',
    questions:[
      {q:'Bagaimana cara kerja rem cakram menurut bacaan?', options:['Menjepit piringan logam dengan kampas rem sehingga timbul gesekan','Menyemprotkan udara bertekanan ke roda','Mematikan mesin secara otomatis','Menahan laju dengan magnet pada roda'], answer:0},
      {q:'Mengapa kampas rem harus diperiksa berkala?', options:['Karena menipis akibat gesekan sehingga jarak pengereman memanjang','Karena kampas rem mudah berkarat saat hujan','Karena kampas rem menyerap air dari udara','Karena kampas rem membuat mesin boros bahan bakar'], answer:0},
      {q:'Apa yang menyebabkan turunnya titik didih minyak rem?', options:['Sifat minyak rem yang menyerap air dari udara','Gesekan kampas dengan piringan logam','Pemakaian kendaraan di jalan menurun','Goresan pada permukaan piringan'], answer:0},
      {q:'Apa yang dimaksud vapor lock dalam bacaan?', options:['Munculnya gelembung udara di saluran rem sehingga pedal terasa kosong','Kondisi kampas rem yang habis total','Piringan rem yang tergores dalam','Minyak rem yang membeku saat dingin'], answer:0},
      {q:'Mengapa minyak rem tetap diganti walau kendaraan jarang dipakai?', options:['Karena minyak rem tetap menyerap air dari udara seiring waktu','Karena minyak rem menguap habis dengan sendirinya','Karena kampas rem ikut menipis saat kendaraan diam','Karena minyak rem berubah menjadi padat'], answer:0}
    ]
  },
  {
    id:'tsm-rantai', jurusan:'Teknik Sepeda Motor (TSM)',
    title:'Ketegangan Rantai Sepeda Motor',
    text:'Rantai sepeda motor meneruskan tenaga dari mesin ke roda belakang. Ketegangannya harus tepat, tidak terlalu kencang dan tidak terlalu kendur. Rantai yang terlalu kencang membuat bantalan roda dan gir cepat aus karena menahan beban berlebih. Sebaliknya, rantai yang terlalu kendur dapat melompat dari gir bahkan terlepas saat motor melaju, sehingga membahayakan pengendara. Buku manual umumnya menetapkan jarak main rantai sekitar dua sampai tiga sentimeter saat ditekan di bagian tengah. Pelumasan juga penting karena rantai kering mempercepat keausan dan menimbulkan bunyi berisik. Namun pelumas yang terlalu banyak justru menarik debu dan pasir, membentuk pasta kasar yang mengikis gir. Pembersihan sebelum pelumasan karena itu tidak boleh dilewatkan.',
    questions:[
      {q:'Apa fungsi utama rantai sepeda motor menurut bacaan?', options:['Meneruskan tenaga dari mesin ke roda belakang','Menyaring udara yang masuk ke mesin','Mendinginkan mesin saat melaju','Menyimpan tenaga cadangan mesin'], answer:0},
      {q:'Apa akibat rantai yang terlalu kencang?', options:['Bantalan roda dan gir cepat aus karena menahan beban berlebih','Rantai melompat dari gir saat melaju','Mesin menjadi sulit dinyalakan','Ban belakang cepat botak'], answer:0},
      {q:'Mengapa rantai yang terlalu kendur berbahaya?', options:['Dapat melompat dari gir bahkan terlepas saat motor melaju','Membuat rantai cepat berkarat','Menyebabkan mesin cepat panas','Membuat bahan bakar cepat habis'], answer:0},
      {q:'Berapa jarak main rantai yang umumnya ditetapkan buku manual?', options:['Sekitar dua sampai tiga sentimeter','Sekitar sepuluh sentimeter','Sekitar setengah sentimeter','Sekitar delapan sentimeter'], answer:0},
      {q:'Mengapa pelumas yang berlebihan justru merugikan?', options:['Karena menarik debu dan pasir sehingga membentuk pasta kasar yang mengikis gir','Karena membuat rantai menjadi terlalu kencang','Karena melarutkan cat pada rangka motor','Karena membuat rantai kering lebih cepat'], answer:0}
    ]
  },
  {
    id:'tkj-ip', jurusan:'Teknik Komputer & Jaringan (TKJ)',
    title:'Alamat IP dan Pembagian Jaringan',
    text:'Setiap perangkat dalam jaringan komputer memerlukan alamat IP sebagai identitas agar data terkirim ke tujuan yang benar. Alamat IP terbagi menjadi bagian jaringan dan bagian host. Subnet mask menentukan batas antara kedua bagian tersebut. Perangkat yang memiliki bagian jaringan sama dapat berkomunikasi langsung tanpa perantara. Jika bagian jaringannya berbeda, data harus melewati router terlebih dahulu. Di laboratorium sekolah, alamat IP sering diberikan otomatis oleh server DHCP sehingga siswa tidak perlu mengaturnya satu per satu. Namun perangkat penting seperti printer dan server justru diberi alamat statis. Alasannya, alamat yang berubah-ubah akan menyulitkan pengguna lain menemukan perangkat tersebut di jaringan.',
    questions:[
      {q:'Mengapa setiap perangkat jaringan memerlukan alamat IP?', options:['Sebagai identitas agar data terkirim ke tujuan yang benar','Agar perangkat dapat menyala lebih cepat','Untuk menambah kapasitas penyimpanan','Agar perangkat hemat listrik'], answer:0},
      {q:'Apa fungsi subnet mask menurut bacaan?', options:['Menentukan batas antara bagian jaringan dan bagian host','Mengubah kabel LAN menjadi nirkabel','Menyimpan daftar seluruh pengguna jaringan','Mempercepat kinerja prosesor'], answer:0},
      {q:'Kapan data harus melewati router?', options:['Ketika bagian jaringan dari alamat IP berbeda','Ketika perangkat memakai alamat statis','Ketika server DHCP sedang aktif','Ketika perangkat berada di ruangan yang sama'], answer:0},
      {q:'Apa peran server DHCP di laboratorium sekolah?', options:['Memberikan alamat IP secara otomatis kepada perangkat','Menyimpan seluruh tugas siswa','Mengatur suhu ruangan laboratorium','Mencetak dokumen dari jarak jauh'], answer:0},
      {q:'Mengapa printer dan server diberi alamat statis?', options:['Karena alamat yang berubah-ubah menyulitkan pengguna menemukannya','Karena keduanya tidak mendukung DHCP','Karena keduanya tidak memerlukan alamat IP','Karena alamat statis membuat jaringan lebih murah'], answer:0}
    ]
  },
  {
    id:'kuliner-telur', jurusan:'Kuliner / Tata Boga',
    title:'Rahasia Telur dalam Adonan Kue',
    text:'Telur memegang banyak peran dalam pembuatan kue. Bagian putih telur mengandung protein yang mampu memerangkap udara ketika dikocok, sehingga adonan mengembang dan bertekstur ringan. Kuning telur mengandung lemak dan lesitin yang membuat kue terasa lembut sekaligus membantu mencampurkan air dengan minyak. Suhu telur ternyata berpengaruh besar. Telur bersuhu ruang lebih mudah mengembang daripada telur yang baru keluar dari lemari pendingin. Karena itu banyak juru masak mengeluarkan telur sekitar tiga puluh menit sebelum mengolahnya. Wadah pengocok pun harus benar-benar bersih dan kering. Setetes minyak atau sisa kuning telur saja dapat merusak buih putih telur sehingga adonan gagal mengembang.',
    questions:[
      {q:'Mengapa putih telur membuat adonan mengembang?', options:['Karena proteinnya memerangkap udara ketika dikocok','Karena mengandung lemak dan lesitin','Karena putih telur menyerap air adonan','Karena putih telur menghasilkan panas'], answer:0},
      {q:'Apa peran lesitin pada kuning telur menurut bacaan?', options:['Membantu mencampurkan air dengan minyak','Membuat kue berwarna kecokelatan','Mengeraskan permukaan kue','Mempercepat proses pemanggangan'], answer:0},
      {q:'Mengapa telur sebaiknya bersuhu ruang?', options:['Karena lebih mudah mengembang dibanding telur dingin','Karena rasanya menjadi lebih manis','Karena warnanya lebih cerah','Karena lebih awet disimpan'], answer:0},
      {q:'Berapa lama telur dikeluarkan sebelum diolah?', options:['Sekitar tiga puluh menit','Sekitar lima menit','Sekitar tiga jam','Sekitar satu hari'], answer:0},
      {q:'Mengapa wadah pengocok harus bersih dan kering?', options:['Karena setetes minyak atau sisa kuning telur dapat merusak buih putih telur','Karena wadah kotor membuat kue terasa asin','Karena air membuat telur cepat busuk','Karena wadah basah membuat adonan berwarna gelap'], answer:0}
    ]
  },
  {
    id:'umum-literasi', jurusan:'Umum / Lintas Jurusan',
    title:'Membaca Nota Belanja dengan Teliti',
    text:'Nota belanja bukan sekadar kertas bukti pembayaran. Di dalamnya tercantum nama barang, jumlah, harga satuan, dan total yang harus dibayar. Pembeli yang teliti selalu mencocokkan jumlah barang di nota dengan barang yang benar-benar diterima. Kesalahan pencatatan dapat terjadi, misalnya satu barang terhitung dua kali. Pada bagian bawah nota biasanya terdapat potongan harga atau pajak. Potongan harga mengurangi total, sedangkan pajak menambah total pembayaran. Banyak orang hanya melihat angka paling bawah tanpa memeriksa rinciannya. Padahal kebiasaan memeriksa nota melatih ketelitian sekaligus melindungi hak pembeli. Nota juga menjadi bukti sah ketika barang hendak ditukar atau dikembalikan karena rusak.',
    questions:[
      {q:'Informasi apa saja yang tercantum dalam nota belanja menurut bacaan?', options:['Nama barang, jumlah, harga satuan, dan total pembayaran','Alamat rumah pembeli dan nomor telepon','Nama kasir dan jam istirahat toko','Daftar seluruh barang yang ada di toko'], answer:0},
      {q:'Mengapa pembeli perlu mencocokkan nota dengan barang yang diterima?', options:['Karena kesalahan pencatatan bisa terjadi, misalnya satu barang terhitung dua kali','Karena nota selalu salah cetak','Karena barang di nota tidak pernah sesuai','Karena kasir wajib diawasi pembeli'], answer:0},
      {q:'Apa perbedaan potongan harga dan pajak menurut bacaan?', options:['Potongan harga mengurangi total, sedangkan pajak menambah total','Keduanya sama-sama mengurangi total','Keduanya sama-sama menambah total','Potongan harga menambah total, pajak mengurangi total'], answer:0},
      {q:'Apa kebiasaan keliru yang disebutkan dalam bacaan?', options:['Hanya melihat angka paling bawah tanpa memeriksa rincian','Menyimpan nota terlalu lama','Meminta nota untuk setiap pembelian','Mencocokkan jumlah barang dengan nota'], answer:0},
      {q:'Apa manfaat nota saat barang rusak?', options:['Menjadi bukti sah ketika barang hendak ditukar atau dikembalikan','Menjadi alat tawar-menawar harga','Menjadi pengganti uang pembayaran','Menjadi syarat mendapat barang gratis'], answer:0}
    ]
  },

  /* ---------- TKR ---------- */
  {
    id:'tkr-oli', jurusan:'Teknik Kendaraan Ringan (TKR)',
    title:'Mengapa Oli Mesin Harus Diganti',
    text:'Oli melumasi bagian mesin yang bergesekan sehingga keausan berkurang. Selain melumasi, oli juga membantu mendinginkan mesin dan membawa kotoran ke saringan. Seiring pemakaian, oli tercemar serbuk logam dan sisa pembakaran sehingga warnanya menghitam dan kemampuannya melumasi menurun. Oli yang terlambat diganti membuat gesekan meningkat dan mesin cepat panas. Banyak pemilik kendaraan menunda penggantian karena mesin masih terasa normal. Padahal kerusakan akibat oli kotor berlangsung perlahan dan baru terasa setelah biaya perbaikannya jauh lebih mahal daripada harga oli itu sendiri.',
    questions:[
      {q:'Apa fungsi utama oli menurut bacaan?', options:['Melumasi bagian mesin yang bergesekan sehingga keausan berkurang','Menambah tenaga mesin secara langsung','Membersihkan bodi kendaraan','Mendinginkan ban saat melaju'], answer:0},
      {q:'Selain melumasi, apa dua fungsi oli yang disebutkan?', options:['Membantu mendinginkan mesin dan membawa kotoran ke saringan','Menambah bahan bakar dan menaikkan tekanan ban','Menyalakan lampu dan mengisi aki','Meredam suara klakson dan getaran roda'], answer:0},
      {q:'Mengapa warna oli menghitam seiring pemakaian?', options:['Karena tercemar serbuk logam dan sisa pembakaran','Karena bercampur air hujan','Karena terkena sinar matahari','Karena didinginkan radiator'], answer:0},
      {q:'Apa akibat oli yang terlambat diganti?', options:['Gesekan meningkat dan mesin cepat panas','Mesin menjadi lebih senyap','Bahan bakar menjadi lebih irit','Mesin bertambah tenaganya'], answer:0},
      {q:'Mengapa banyak pemilik menunda penggantian oli?', options:['Karena mesin masih terasa normal padahal kerusakannya berlangsung perlahan','Karena oli sangat sulit dibeli','Karena bengkel selalu penuh','Karena oli baru merusak mesin'], answer:0}
    ]
  },
  {
    id:'tkr-ban', jurusan:'Teknik Kendaraan Ringan (TKR)',
    title:'Tekanan Angin Ban dan Keselamatan',
    text:'Tekanan angin ban yang tepat menentukan keselamatan sekaligus keiritan bahan bakar. Ban yang kurang angin membuat permukaan yang menempel ke jalan melebar sehingga hambatan bertambah dan bahan bakar lebih boros. Dinding ban juga menekuk berlebihan, memanas, dan berisiko pecah saat melaju kencang. Sebaliknya, ban yang kelebihan angin membuat bagian tengahnya cepat aus dan daya cengkeramnya berkurang. Tekanan sebaiknya diperiksa saat ban masih dingin, sebab ban yang baru dipakai menghasilkan panas yang menaikkan angka pengukuran. Ukuran yang dianjurkan tertera pada stiker di sisi pintu pengemudi.',
    questions:[
      {q:'Apa yang ditentukan oleh tekanan angin ban yang tepat?', options:['Keselamatan sekaligus keiritan bahan bakar','Warna dan usia ban','Kecepatan maksimum mesin','Umur pakai aki kendaraan'], answer:0},
      {q:'Mengapa ban yang kurang angin membuat bahan bakar boros?', options:['Karena permukaan yang menempel ke jalan melebar sehingga hambatan bertambah','Karena mesin harus menyalakan pompa angin','Karena ban menjadi lebih ringan','Karena ban menyerap bahan bakar'], answer:0},
      {q:'Apa risiko dinding ban yang menekuk berlebihan?', options:['Memanas dan berisiko pecah saat melaju kencang','Menjadi lebih lentur dan awet','Membuat kemudi lebih ringan','Menurunkan suhu mesin'], answer:0},
      {q:'Apa akibat ban yang kelebihan angin?', options:['Bagian tengahnya cepat aus dan daya cengkeramnya berkurang','Seluruh permukaan ban aus merata','Ban menjadi lebih lengket di jalan','Bahan bakar menjadi jauh lebih irit'], answer:0},
      {q:'Mengapa tekanan diperiksa saat ban masih dingin?', options:['Karena ban yang baru dipakai menghasilkan panas yang menaikkan angka pengukuran','Karena alat ukur rusak bila terkena panas','Karena angin hilang saat ban panas','Karena ban dingin lebih mudah dibuka'], answer:0}
    ]
  },
  {
    id:'tkr-aki', jurusan:'Teknik Kendaraan Ringan (TKR)',
    title:'Merawat Aki Kendaraan',
    text:'Aki menyimpan listrik untuk menyalakan starter, lampu, dan perangkat elektronik kendaraan. Saat mesin hidup, alternator mengisi ulang aki sehingga dayanya kembali penuh. Kendaraan yang jarang dipakai justru membuat aki cepat tekor, sebab aki tetap mengalami pengosongan sedikit demi sedikit tanpa pernah diisi ulang. Kerak putih pada kepala aki menghambat aliran listrik dan membuat starter terasa berat. Terminal yang longgar menimbulkan gejala serupa. Karena itu memanaskan mesin secara berkala dan menjaga kebersihan terminal jauh lebih murah daripada mengganti aki baru.',
    questions:[
      {q:'Apa fungsi aki menurut bacaan?', options:['Menyimpan listrik untuk starter, lampu, dan perangkat elektronik','Menyaring bahan bakar sebelum masuk mesin','Melumasi bagian mesin yang bergesekan','Mendinginkan mesin saat melaju'], answer:0},
      {q:'Apa yang mengisi ulang aki saat mesin hidup?', options:['Alternator','Radiator','Karburator','Kompresor'], answer:0},
      {q:'Mengapa kendaraan yang jarang dipakai membuat aki cepat tekor?', options:['Karena aki tetap mengalami pengosongan sedikit demi sedikit tanpa pernah diisi ulang','Karena aki menguap saat didiamkan','Karena aki menyerap kelembapan udara','Karena alternator bekerja terus meski mesin mati'], answer:0},
      {q:'Apa akibat kerak putih pada kepala aki?', options:['Menghambat aliran listrik dan membuat starter terasa berat','Membuat aki lebih cepat penuh','Menambah daya tahan aki','Melindungi terminal dari karat'], answer:0},
      {q:'Apa saran bacaan agar aki awet?', options:['Memanaskan mesin secara berkala dan menjaga kebersihan terminal','Membiarkan kendaraan tidak dipakai berbulan-bulan','Melepas aki setiap malam','Menyiram aki dengan air biasa'], answer:0}
    ]
  },
  {
    id:'tkr-radiator', jurusan:'Teknik Kendaraan Ringan (TKR)',
    title:'Sistem Pendingin Mesin',
    text:'Mesin menghasilkan panas yang sangat besar saat bekerja. Air pendingin bersirkulasi menyerap panas itu lalu melepaskannya di radiator dengan bantuan kipas dan aliran udara. Termostat mengatur agar air tidak bersirkulasi sebelum mesin mencapai suhu kerja, sehingga mesin cepat panas saat baru dinyalakan. Air radiator sebaiknya memakai cairan khusus, bukan air biasa, karena air biasa meninggalkan kerak dan mempercepat karat. Kebocoran kecil pada selang sering diabaikan padahal dapat membuat mesin kepanasan di tengah perjalanan. Suhu berlebih dapat melengkungkan kepala silinder dan biaya perbaikannya sangat mahal.',
    questions:[
      {q:'Bagaimana panas mesin dilepaskan menurut bacaan?', options:['Air pendingin menyerapnya lalu melepaskannya di radiator dengan bantuan kipas dan udara','Panas keluar sendiri lewat knalpot','Panas diserap oli lalu dibuang ke ban','Panas dialirkan ke aki kendaraan'], answer:0},
      {q:'Apa tugas termostat?', options:['Mengatur agar air tidak bersirkulasi sebelum mesin mencapai suhu kerja','Menyalakan kipas radiator setiap saat','Menambah air radiator secara otomatis','Mengukur tekanan ban kendaraan'], answer:0},
      {q:'Mengapa air biasa tidak dianjurkan untuk radiator?', options:['Karena meninggalkan kerak dan mempercepat karat','Karena harganya jauh lebih mahal','Karena membekukan mesin','Karena membuat mesin terlalu dingin'], answer:0},
      {q:'Mengapa kebocoran kecil pada selang berbahaya?', options:['Dapat membuat mesin kepanasan di tengah perjalanan','Membuat bahan bakar cepat habis','Membuat lampu kendaraan mati','Membuat ban kekurangan angin'], answer:0},
      {q:'Apa akibat suhu mesin yang berlebih?', options:['Dapat melengkungkan kepala silinder dengan biaya perbaikan mahal','Mesin menjadi lebih bertenaga','Oli menjadi lebih bersih','Radiator menjadi lebih awet'], answer:0}
    ]
  },

  /* ---------- TSM ---------- */
  {
    id:'tsm-busi', jurusan:'Teknik Sepeda Motor (TSM)',
    title:'Busi dan Pembakaran Mesin',
    text:'Busi memercikkan bunga api yang membakar campuran bahan bakar dan udara di ruang bakar. Warna kepala busi dapat menceritakan kondisi mesin. Warna cokelat bata menandakan pembakaran berlangsung baik. Busi yang hitam dan basah menunjukkan campuran terlalu banyak bensin, sedangkan warna putih pucat menandakan campuran terlalu miskin dan mesin berisiko kepanasan. Jarak celah busi juga harus sesuai anjuran pabrik, sebab celah yang terlalu lebar membuat percikan lemah dan mesin sulit dinyalakan. Membaca kondisi busi karena itu menjadi cara sederhana namun ampuh untuk mengenali masalah mesin sejak dini.',
    questions:[
      {q:'Apa tugas busi menurut bacaan?', options:['Memercikkan bunga api yang membakar campuran bahan bakar dan udara','Menyaring udara yang masuk ke mesin','Memompa bensin ke ruang bakar','Mendinginkan mesin saat melaju'], answer:0},
      {q:'Apa arti kepala busi berwarna cokelat bata?', options:['Pembakaran berlangsung baik','Campuran terlalu banyak bensin','Campuran terlalu miskin','Busi harus segera dibuang'], answer:0},
      {q:'Apa arti busi yang hitam dan basah?', options:['Campuran terlalu banyak bensin','Campuran terlalu miskin','Pembakaran sudah sempurna','Mesin kekurangan oli'], answer:0},
      {q:'Apa risiko busi berwarna putih pucat?', options:['Campuran terlalu miskin dan mesin berisiko kepanasan','Mesin menjadi terlalu dingin','Bensin menjadi sangat irit tanpa risiko','Busi menjadi lebih awet'], answer:0},
      {q:'Apa akibat celah busi yang terlalu lebar?', options:['Percikan menjadi lemah dan mesin sulit dinyalakan','Percikan menjadi jauh lebih kuat','Mesin menjadi lebih bertenaga','Bahan bakar terbakar sempurna'], answer:0}
    ]
  },
  {
    id:'tsm-remtromol', jurusan:'Teknik Sepeda Motor (TSM)',
    title:'Rem Tromol dan Rem Cakram',
    text:'Sepeda motor umumnya memakai dua jenis rem. Rem tromol bekerja dengan mendorong sepatu rem ke dinding tromol dari dalam. Bentuknya tertutup sehingga lebih terlindung dari air dan debu, namun panas sulit keluar sehingga kemampuan mengeremnya menurun bila dipakai terus-menerus. Rem cakram menjepit piringan yang terbuka sehingga panas cepat terbuang dan pengereman tetap pakem. Kelemahannya, piringan yang terbuka lebih mudah kotor. Banyak motor memakai cakram di depan dan tromol di belakang, sebab beban pengereman terbesar memang bertumpu pada roda depan saat kendaraan melambat.',
    questions:[
      {q:'Bagaimana cara kerja rem tromol?', options:['Mendorong sepatu rem ke dinding tromol dari dalam','Menjepit piringan dari luar','Menahan roda dengan magnet','Mengurangi putaran mesin secara langsung'], answer:0},
      {q:'Apa kelebihan bentuk rem tromol yang tertutup?', options:['Lebih terlindung dari air dan debu','Panasnya cepat terbuang','Bobotnya paling ringan','Harganya paling mahal'], answer:0},
      {q:'Apa kelemahan rem tromol menurut bacaan?', options:['Panas sulit keluar sehingga kemampuan mengerem menurun bila dipakai terus-menerus','Sangat mudah kemasukan debu','Tidak bisa menghentikan motor sama sekali','Piringannya cepat berkarat'], answer:0},
      {q:'Mengapa rem cakram tetap pakem meski dipakai terus?', options:['Karena piringannya terbuka sehingga panas cepat terbuang','Karena tertutup rapat dari udara luar','Karena tidak menimbulkan gesekan','Karena bekerja tanpa kampas rem'], answer:0},
      {q:'Mengapa cakram sering dipasang di roda depan?', options:['Karena beban pengereman terbesar bertumpu pada roda depan saat melambat','Karena roda depan jarang dipakai mengerem','Karena roda belakang tidak boleh direm','Karena cakram tidak muat di roda belakang'], answer:0}
    ]
  },
  {
    id:'tsm-filter', jurusan:'Teknik Sepeda Motor (TSM)',
    title:'Saringan Udara Sepeda Motor',
    text:'Mesin memerlukan udara bersih dalam jumlah besar untuk membakar bahan bakar. Saringan udara menahan debu agar tidak masuk dan mengikis dinding silinder. Saringan yang tersumbat membuat udara yang masuk berkurang sehingga campuran menjadi terlalu kaya bensin. Akibatnya tenaga menurun, bahan bakar boros, dan asap knalpot menghitam. Sebagian saringan berbahan kertas kering tidak boleh dicuci karena seratnya rusak dan justru meloloskan debu. Jenis ini hanya boleh diganti, bukan dibersihkan dengan air. Membaca buku manual sebelum merawat karena itu lebih bijak daripada menebak berdasarkan kebiasaan.',
    questions:[
      {q:'Apa tugas saringan udara?', options:['Menahan debu agar tidak masuk dan mengikis dinding silinder','Menyaring bensin sebelum masuk mesin','Mendinginkan ruang bakar','Meredam suara knalpot'], answer:0},
      {q:'Apa akibat saringan yang tersumbat?', options:['Udara yang masuk berkurang sehingga campuran terlalu kaya bensin','Udara yang masuk bertambah banyak','Mesin menjadi jauh lebih bertenaga','Bahan bakar menjadi sangat irit'], answer:0},
      {q:'Apa tanda campuran terlalu kaya menurut bacaan?', options:['Tenaga menurun, bahan bakar boros, dan asap knalpot menghitam','Mesin berputar makin cepat sendiri','Knalpot mengeluarkan asap putih bersih','Mesin menjadi sangat senyap'], answer:0},
      {q:'Mengapa saringan kertas kering tidak boleh dicuci?', options:['Karena seratnya rusak dan justru meloloskan debu','Karena air membuatnya lebih rapat','Karena kertas menjadi terlalu bersih','Karena mencucinya memakan waktu lama'], answer:0},
      {q:'Apa saran bacaan sebelum merawat saringan?', options:['Membaca buku manual, bukan menebak berdasarkan kebiasaan','Mengikuti saran teman sebengkel','Mencuci semua jenis saringan','Mengganti saringan setiap minggu'], answer:0}
    ]
  },
  {
    id:'tsm-injeksi', jurusan:'Teknik Sepeda Motor (TSM)',
    title:'Motor Injeksi dan Lampu Indikator',
    text:'Motor injeksi mengatur jumlah bensin memakai komputer kecil yang membaca berbagai sensor. Karena takarannya dihitung, mesin lebih irit dan gas buangnya lebih bersih dibanding karburator. Jika ada sensor yang bermasalah, lampu indikator di panel akan menyala atau berkedip dengan pola tertentu. Pola kedipan itu adalah kode kerusakan yang bisa dibaca teknisi memakai buku panduan. Sayangnya banyak pengendara mengabaikan lampu tersebut selama motor masih bisa jalan. Padahal sensor yang dibiarkan rusak membuat konsumsi bensin membengkak dan lama-kelamaan merembet ke komponen lain yang lebih mahal.',
    questions:[
      {q:'Bagaimana motor injeksi mengatur jumlah bensin?', options:['Memakai komputer kecil yang membaca berbagai sensor','Memakai pelampung di dalam karburator','Diatur langsung oleh putaran gas secara mekanis','Ditakar manual oleh pengendara'], answer:0},
      {q:'Apa keunggulan injeksi dibanding karburator?', options:['Lebih irit dan gas buangnya lebih bersih','Suaranya jauh lebih keras','Harganya selalu lebih murah','Tidak memerlukan bensin'], answer:0},
      {q:'Apa arti lampu indikator yang berkedip dengan pola tertentu?', options:['Kode kerusakan yang bisa dibaca teknisi memakai buku panduan','Tanda bensin sudah penuh','Tanda motor siap dipakai','Hiasan panel tanpa arti'], answer:0},
      {q:'Apa kebiasaan keliru pengendara menurut bacaan?', options:['Mengabaikan lampu indikator selama motor masih bisa jalan','Terlalu sering ke bengkel','Membaca buku panduan setiap hari','Mengganti sensor setiap bulan'], answer:0},
      {q:'Apa akibat sensor yang dibiarkan rusak?', options:['Konsumsi bensin membengkak dan merembet ke komponen lain yang lebih mahal','Motor berhenti total seketika','Lampu indikator mati selamanya','Mesin menjadi lebih irit'], answer:0}
    ]
  },

  /* ---------- TKJ ---------- */
  {
    id:'tkj-sandi', jurusan:'Teknik Komputer & Jaringan (TKJ)',
    title:'Kata Sandi yang Kuat',
    text:'Kata sandi yang pendek dapat ditebak komputer dalam hitungan detik karena mesin mampu mencoba jutaan kemungkinan setiap detik. Panjang kata sandi ternyata lebih menentukan daripada sekadar mencampur simbol aneh. Gabungan beberapa kata yang mudah diingat namun tidak berkaitan justru sulit ditebak sekaligus gampang dihafal. Bahaya terbesar bukan hanya sandi yang lemah, melainkan sandi yang dipakai ulang di banyak layanan. Bila satu layanan bocor, penjahat akan mencoba sandi yang sama di layanan lain. Karena itu setiap akun penting sebaiknya memakai sandi yang berbeda.',
    questions:[
      {q:'Mengapa kata sandi pendek berbahaya?', options:['Komputer mampu mencoba jutaan kemungkinan setiap detik','Karena sulit diingat pemiliknya','Karena tidak bisa diketik cepat','Karena ditolak semua layanan'], answer:0},
      {q:'Apa yang lebih menentukan kekuatan sandi menurut bacaan?', options:['Panjangnya, bukan sekadar campuran simbol aneh','Banyaknya angka di akhir','Penggunaan huruf kapital di awal','Kemiripan dengan nama sendiri'], answer:0},
      {q:'Sandi seperti apa yang disarankan bacaan?', options:['Gabungan beberapa kata mudah diingat namun tidak berkaitan','Tanggal lahir yang mudah diingat','Nama panggilan ditambah angka satu','Satu kata pendek berisi simbol'], answer:0},
      {q:'Apa bahaya terbesar menurut bacaan?', options:['Sandi yang dipakai ulang di banyak layanan','Sandi yang terlalu panjang','Sandi yang sering diganti','Sandi yang ditulis di buku catatan'], answer:0},
      {q:'Apa yang dilakukan penjahat bila satu layanan bocor?', options:['Mencoba sandi yang sama di layanan lain','Mengembalikan data yang dicuri','Memberi tahu pemilik akun','Menghapus seluruh akun itu'], answer:0}
    ]
  },
  {
    id:'tkj-backup', jurusan:'Teknik Komputer & Jaringan (TKJ)',
    title:'Mencadangkan Data',
    text:'Kerusakan penyimpanan hampir selalu datang tanpa peringatan. Data tugas, foto, dan pekerjaan bisa hilang dalam sekejap tanpa cadangan. Pedoman yang banyak dipakai menyarankan menyimpan tiga salinan data, pada dua jenis media berbeda, dengan satu salinan disimpan di lokasi terpisah. Salinan di lokasi terpisah penting karena kebakaran atau pencurian dapat melenyapkan komputer beserta hard disk cadangan di sebelahnya sekaligus. Cadangan yang tidak pernah dicoba dipulihkan sesungguhnya belum bisa disebut cadangan. Banyak orang baru sadar berkasnya rusak justru pada saat data itu benar-benar dibutuhkan.',
    questions:[
      {q:'Bagaimana sifat kerusakan penyimpanan menurut bacaan?', options:['Hampir selalu datang tanpa peringatan','Selalu didahului tanda selama berbulan-bulan','Hanya terjadi pada komputer tua','Selalu bisa diperbaiki dengan mudah'], answer:0},
      {q:'Apa isi pedoman pencadangan yang disebutkan?', options:['Tiga salinan, dua jenis media berbeda, satu di lokasi terpisah','Satu salinan di satu tempat saja','Lima salinan pada media yang sama','Dua salinan dalam satu komputer'], answer:0},
      {q:'Mengapa satu salinan harus di lokasi terpisah?', options:['Karena kebakaran atau pencurian dapat melenyapkan komputer dan cadangan di sebelahnya sekaligus','Agar lebih cepat diakses','Agar tidak memenuhi ruangan','Karena diwajibkan pembuat komputer'], answer:0},
      {q:'Kapan cadangan belum bisa disebut cadangan?', options:['Bila tidak pernah dicoba dipulihkan','Bila usianya lebih dari sebulan','Bila disimpan di flashdisk','Bila jumlahnya lebih dari satu'], answer:0},
      {q:'Kapan banyak orang baru sadar berkasnya rusak?', options:['Pada saat data itu benar-benar dibutuhkan','Segera setelah berkas disimpan','Ketika komputer dinyalakan','Saat membeli komputer baru'], answer:0}
    ]
  },
  {
    id:'tkj-wifi', jurusan:'Teknik Komputer & Jaringan (TKJ)',
    title:'Jaringan Nirkabel dan Hambatannya',
    text:'Jaringan nirkabel mengirim data memakai gelombang radio, sehingga kekuatan sinyalnya melemah seiring jarak. Dinding beton dan lemari logam menyerap atau memantulkan gelombang lebih kuat daripada partisi kayu. Karena itu penempatan titik akses di tengah ruangan dan agak tinggi biasanya memberi jangkauan lebih merata daripada di sudut lantai. Perangkat lain seperti oven gelombang mikro dapat mengganggu karena bekerja pada rentang gelombang yang berdekatan. Menambah jumlah titik akses di ruangan sempit tidak selalu menolong, sebab sinyal yang saling bertumpang tindih justru dapat mengganggu satu sama lain.',
    questions:[
      {q:'Bagaimana jaringan nirkabel mengirim data?', options:['Memakai gelombang radio yang melemah seiring jarak','Memakai kabel tembaga tipis','Memakai cahaya lampu ruangan','Memakai getaran suara'], answer:0},
      {q:'Bahan apa yang paling mengganggu gelombang menurut bacaan?', options:['Dinding beton dan lemari logam','Partisi kayu tipis','Kaca jendela bening','Kain gorden'], answer:0},
      {q:'Di mana titik akses sebaiknya ditempatkan?', options:['Di tengah ruangan dan agak tinggi','Di sudut lantai paling bawah','Di dalam lemari logam','Di balik dinding beton'], answer:0},
      {q:'Perangkat apa yang disebut dapat mengganggu sinyal?', options:['Oven gelombang mikro','Kipas angin biasa','Lampu meja','Mesin cuci'], answer:0},
      {q:'Mengapa menambah titik akses tidak selalu menolong?', options:['Karena sinyal yang saling bertumpang tindih dapat mengganggu satu sama lain','Karena titik akses tidak bisa dipasang berdekatan','Karena listrik menjadi padam','Karena sinyal menjadi terlalu kuat'], answer:0}
    ]
  },
  {
    id:'tkj-phishing', jurusan:'Teknik Komputer & Jaringan (TKJ)',
    title:'Mengenali Penipuan Daring',
    text:'Penipuan daring bekerja dengan memancing korban menyerahkan sendiri data pentingnya. Pesan penipu biasanya menekan korban agar cepat bertindak, misalnya mengaku akun akan diblokir dalam satu jam. Rasa panik membuat orang berhenti berpikir dan langsung menekan tautan. Alamat situs palsu sering hanya berbeda satu huruf dari yang asli sehingga lolos dari pengamatan sekilas. Cara paling aman bukan menilai tampilan pesannya, melainkan tidak menekan tautan di pesan sama sekali dan membuka layanan itu lewat alamat resmi yang diketik sendiri. Lembaga resmi juga tidak pernah meminta kata sandi lewat pesan.',
    questions:[
      {q:'Bagaimana cara kerja penipuan daring menurut bacaan?', options:['Memancing korban menyerahkan sendiri data pentingnya','Membobol server layanan secara paksa','Merusak perangkat korban dari jauh','Mencuri komputer secara langsung'], answer:0},
      {q:'Apa ciri khas pesan penipu?', options:['Menekan korban agar cepat bertindak, misalnya mengaku akun akan diblokir','Menggunakan bahasa yang sangat santai','Tidak pernah menyebut nama layanan','Selalu dikirim lewat surat pos'], answer:0},
      {q:'Mengapa alamat situs palsu sulit dikenali?', options:['Sering hanya berbeda satu huruf dari yang asli','Selalu memakai huruf besar semua','Tidak pernah memiliki alamat','Panjangnya sepuluh kali lipat'], answer:0},
      {q:'Apa cara paling aman menurut bacaan?', options:['Tidak menekan tautan di pesan dan membuka layanan lewat alamat resmi yang diketik sendiri','Menilai tampilan pesan dengan teliti','Membalas pesan untuk memastikan','Menekan tautan memakai perangkat lain'], answer:0},
      {q:'Apa yang tidak pernah dilakukan lembaga resmi?', options:['Meminta kata sandi lewat pesan','Mengirim pemberitahuan resmi','Menyediakan alamat situs','Menutup akun yang bermasalah'], answer:0}
    ]
  },

  /* ---------- Kuliner ---------- */
  {
    id:'kuliner-higiene', jurusan:'Kuliner / Tata Boga',
    title:'Kebersihan Tangan di Dapur',
    text:'Tangan adalah jalur paling sering memindahkan kuman ke makanan. Mencuci tangan dengan sabun selama sekitar dua puluh detik jauh lebih ampuh daripada sekadar membasahinya sebentar, sebab sabun mengangkat lemak tempat kuman menempel. Sarung tangan sekali pakai tidak menggantikan cuci tangan dan justru berbahaya bila dipakai terus-menerus untuk berbagai pekerjaan. Bahaya lain adalah pencemaran silang, yaitu ketika pisau bekas memotong ayam mentah dipakai memotong sayuran segar tanpa dicuci. Karena itu dapur profesional memisahkan talenan berdasarkan warna agar bahan mentah dan bahan siap santap tidak pernah bertemu.',
    questions:[
      {q:'Mengapa tangan menjadi perhatian utama di dapur?', options:['Karena tangan paling sering memindahkan kuman ke makanan','Karena tangan mudah terluka','Karena tangan sulit dibersihkan','Karena tangan menyerap bau makanan'], answer:0},
      {q:'Mengapa mencuci dengan sabun lebih ampuh?', options:['Sabun mengangkat lemak tempat kuman menempel','Sabun membunuh seluruh kuman seketika','Sabun membuat tangan menjadi kesat','Sabun menambah aroma pada makanan'], answer:0},
      {q:'Bagaimana kedudukan sarung tangan sekali pakai?', options:['Tidak menggantikan cuci tangan dan berbahaya bila dipakai terus-menerus','Menggantikan cuci tangan sepenuhnya','Wajib dipakai sepanjang hari','Hanya untuk memotong sayuran'], answer:0},
      {q:'Apa yang dimaksud pencemaran silang dalam bacaan?', options:['Pisau bekas ayam mentah dipakai memotong sayuran segar tanpa dicuci','Makanan yang tercampur bumbu berlebihan','Dua juru masak bekerja bersamaan','Makanan disimpan terlalu lama'], answer:0},
      {q:'Mengapa talenan dipisahkan berdasarkan warna?', options:['Agar bahan mentah dan bahan siap santap tidak pernah bertemu','Agar dapur terlihat lebih indah','Agar mudah dihitung jumlahnya','Agar talenan lebih awet'], answer:0}
    ]
  },
  {
    id:'kuliner-suhu', jurusan:'Kuliner / Tata Boga',
    title:'Zona Suhu Berbahaya',
    text:'Bakteri pada makanan berkembang paling cepat pada rentang suhu antara lima sampai enam puluh derajat, yang sering disebut zona berbahaya. Dalam rentang itu jumlah bakteri dapat berlipat ganda hanya dalam dua puluh menit. Karena itu makanan matang tidak boleh dibiarkan di suhu ruang lebih dari dua jam. Makanan panas harus dijaga tetap panas dan makanan dingin tetap dingin. Yang menipu, makanan yang sudah tercemar sering tidak berubah bau maupun rasanya. Mengandalkan penciuman untuk menilai keamanan makanan karena itu merupakan kebiasaan yang berisiko.',
    questions:[
      {q:'Pada suhu berapa bakteri berkembang paling cepat?', options:['Antara lima sampai enam puluh derajat','Di bawah nol derajat','Di atas seratus derajat','Tepat pada nol derajat'], answer:0},
      {q:'Seberapa cepat bakteri berlipat ganda di zona berbahaya?', options:['Dalam dua puluh menit','Dalam dua hari','Dalam sepuluh jam','Dalam satu minggu'], answer:0},
      {q:'Berapa lama makanan matang boleh berada di suhu ruang?', options:['Tidak lebih dari dua jam','Tidak lebih dari dua hari','Boleh berapa lama saja','Tepat sepuluh jam'], answer:0},
      {q:'Apa yang menipu dari makanan yang sudah tercemar?', options:['Sering tidak berubah bau maupun rasanya','Selalu berubah warna mencolok','Selalu mengeluarkan asap','Menjadi jauh lebih berat'], answer:0},
      {q:'Mengapa mengandalkan penciuman itu berisiko?', options:['Karena makanan tercemar sering tidak berbau berbeda','Karena hidung mudah lelah','Karena bau makanan selalu hilang','Karena penciuman hanya bekerja saat panas'], answer:0}
    ]
  },
  {
    id:'kuliner-label', jurusan:'Kuliner / Tata Boga',
    title:'Membaca Label Kemasan',
    text:'Label kemasan memuat keterangan yang sering dilewatkan pembeli. Daftar bahan disusun berurutan dari yang paling banyak, sehingga bahan yang tertulis paling depan adalah isi terbesar produk itu. Bila gula tertulis di urutan pertama, produk tersebut sebagian besar memang gula. Keterangan gizi biasanya dihitung per takaran saji, bukan per kemasan. Satu bungkus yang berisi tiga takaran saji berarti angkanya harus dikalikan tiga bila dihabiskan sekaligus. Banyak orang keliru mengira angka itu berlaku untuk seluruh isi kemasan, sehingga asupan gula dan garamnya jauh melebihi perkiraan sendiri.',
    questions:[
      {q:'Bagaimana daftar bahan disusun pada label?', options:['Berurutan dari yang paling banyak','Berdasarkan abjad','Berdasarkan harga bahan','Secara acak tanpa aturan'], answer:0},
      {q:'Apa artinya bila gula tertulis di urutan pertama?', options:['Produk tersebut sebagian besar memang gula','Produk itu bebas gula','Gula hanya sedikit ditambahkan','Gula ditambahkan paling akhir'], answer:0},
      {q:'Keterangan gizi biasanya dihitung berdasarkan apa?', options:['Per takaran saji, bukan per kemasan','Per kemasan utuh','Per kilogram produk','Per hari pemakaian'], answer:0},
      {q:'Berapa kali angka gizi dikalikan bila kemasan berisi tiga takaran saji dan dihabiskan sekaligus?', options:['Tiga kali','Tetap satu kali','Dua kali','Setengah kali'], answer:0},
      {q:'Apa akibat kekeliruan membaca takaran saji?', options:['Asupan gula dan garam jauh melebihi perkiraan sendiri','Makanan menjadi lebih sehat','Label menjadi tidak berlaku','Harga produk menjadi lebih mahal'], answer:0}
    ]
  },
  {
    id:'kuliner-pisau', jurusan:'Kuliner / Tata Boga',
    title:'Pisau Tumpul Justru Berbahaya',
    text:'Banyak orang mengira pisau tajam lebih berbahaya daripada pisau tumpul. Kenyataannya justru sebaliknya. Pisau tumpul memerlukan tenaga dorong lebih besar dan mudah tergelincir dari permukaan bahan, sehingga arah tergelincirnya sulit dikendalikan dan sering mengenai jari. Pisau tajam menggigit bahan dengan tekanan ringan sehingga gerakannya terkendali. Talenan yang bergeser juga menjadi sumber kecelakaan, dan meletakkan kain lembap di bawahnya membuat talenan diam. Kebiasaan lain yang berbahaya adalah menaruh pisau di bak cuci penuh air, sebab pisau menjadi tidak terlihat oleh orang yang mencuci berikutnya.',
    questions:[
      {q:'Apa anggapan keliru yang disebut di awal bacaan?', options:['Pisau tajam lebih berbahaya daripada pisau tumpul','Pisau tumpul tidak bisa memotong','Talenan tidak perlu dijaga','Pisau harus selalu direndam'], answer:0},
      {q:'Mengapa pisau tumpul lebih berbahaya?', options:['Perlu tenaga dorong lebih besar dan mudah tergelincir sehingga sulit dikendalikan','Karena karatnya beracun','Karena bentuknya lebih berat','Karena tidak bisa dipegang erat'], answer:0},
      {q:'Apa keunggulan pisau tajam?', options:['Menggigit bahan dengan tekanan ringan sehingga gerakannya terkendali','Tidak pernah melukai sama sekali','Tidak memerlukan talenan','Memotong tanpa disentuh'], answer:0},
      {q:'Bagaimana mencegah talenan bergeser?', options:['Meletakkan kain lembap di bawahnya','Menekannya dengan pisau','Meletakkannya di tepi meja','Membasahi seluruh permukaannya'], answer:0},
      {q:'Mengapa menaruh pisau di bak cuci penuh air berbahaya?', options:['Pisau menjadi tidak terlihat oleh orang yang mencuci berikutnya','Air membuat pisau berkarat seketika','Pisau menjadi tumpul dalam air','Air membuat pisau melengkung'], answer:0}
    ]
  },

  /* ---------- TPTUP ---------- */
  {
    id:'tptup-acrumah', jurusan:'Teknik Pemanasan, Tata Udara & Pendinginan (TPTUP)',
    title:'Merawat AC di Rumah',
    text:'AC yang jarang dirawat bekerja makin berat tanpa disadari pemiliknya. Debu yang menumpuk pada saringan menghambat aliran udara sehingga ruangan lambat dingin dan tagihan listrik naik. Unit di luar ruangan juga perlu ruang bebas agar panas terbuang lancar; menutupinya dengan tanaman atau barang justru membuat kompresor bekerja pada tekanan tinggi. Menyetel suhu paling rendah tidak membuat ruangan cepat dingin, sebab AC bekerja pada kecepatan yang sama dan hanya berhenti lebih lambat. Suhu sekitar dua puluh empat derajat umumnya sudah nyaman sekaligus hemat.',
    questions:[
      {q:'Apa akibat debu yang menumpuk pada saringan?', options:['Aliran udara terhambat sehingga ruangan lambat dingin dan listrik naik','Ruangan menjadi jauh lebih dingin','AC menjadi lebih awet','Kompresor berhenti bekerja'], answer:0},
      {q:'Mengapa unit luar ruangan perlu ruang bebas?', options:['Agar panas terbuang lancar','Agar terlihat lebih rapi','Agar mudah dicat ulang','Agar tidak terkena hujan'], answer:0},
      {q:'Apa akibat menutupi unit luar dengan tanaman atau barang?', options:['Kompresor bekerja pada tekanan tinggi','Ruangan menjadi lebih sejuk','Listrik menjadi lebih hemat','Suara AC menjadi lebih halus'], answer:0},
      {q:'Apakah menyetel suhu paling rendah membuat ruangan cepat dingin?', options:['Tidak, AC bekerja pada kecepatan sama dan hanya berhenti lebih lambat','Ya, ruangan langsung dingin seketika','Ya, kompresor berputar dua kali lipat','Tidak, AC justru mati sendiri'], answer:0},
      {q:'Berapa suhu yang disebut nyaman sekaligus hemat?', options:['Sekitar dua puluh empat derajat','Sekitar enam belas derajat','Sekitar tiga puluh derajat','Sekitar sepuluh derajat'], answer:0}
    ]
  },
  {
    id:'tptup-kulkas', jurusan:'Teknik Pemanasan, Tata Udara & Pendinginan (TPTUP)',
    title:'Kulkas yang Hemat Listrik',
    text:'Kulkas bekerja sepanjang hari sehingga kebiasaan kecil sangat memengaruhi tagihan listrik. Memasukkan makanan yang masih panas memaksa mesin bekerja lebih lama untuk membuang panas tambahan itu. Kulkas yang diisi terlalu padat menghalangi udara dingin bersirkulasi, sehingga sebagian bahan tidak dingin merata. Sebaliknya, kulkas yang hampir kosong juga kurang hemat karena udara dingin cepat keluar setiap pintu dibuka. Karet pintu yang sudah keras membuat udara dingin bocor terus-menerus tanpa terlihat. Menempatkan kulkas rapat ke dinding atau dekat kompor juga membuat pembuangan panas terganggu.',
    questions:[
      {q:'Mengapa kebiasaan kecil sangat memengaruhi tagihan listrik kulkas?', options:['Karena kulkas bekerja sepanjang hari','Karena kulkas memakai daya paling besar di rumah','Karena kulkas mudah rusak','Karena listrik kulkas dihitung terpisah'], answer:0},
      {q:'Apa akibat memasukkan makanan yang masih panas?', options:['Mesin bekerja lebih lama untuk membuang panas tambahan','Makanan menjadi cepat basi','Kulkas langsung mati','Freezer menjadi lebih dingin'], answer:0},
      {q:'Apa akibat kulkas yang diisi terlalu padat?', options:['Udara dingin terhalang bersirkulasi sehingga bahan tidak dingin merata','Kulkas menjadi lebih hemat','Pintu tidak bisa ditutup','Makanan menjadi beku semua'], answer:0},
      {q:'Mengapa kulkas yang hampir kosong kurang hemat?', options:['Udara dingin cepat keluar setiap pintu dibuka','Mesin berhenti bekerja total','Rak menjadi mudah patah','Lampu menyala terus-menerus'], answer:0},
      {q:'Apa bahaya karet pintu yang sudah keras?', options:['Udara dingin bocor terus-menerus tanpa terlihat','Pintu menjadi terlalu rapat','Kulkas menjadi terlalu dingin','Listrik menjadi lebih hemat'], answer:0}
    ]
  },

  /* ---------- Umum / lintas jurusan ---------- */
  {
    id:'umum-k3', jurusan:'Umum / Lintas Jurusan',
    title:'Keselamatan Kerja Bukan Formalitas',
    text:'Aturan keselamatan kerja sering dianggap merepotkan oleh pekerja yang sudah berpengalaman. Justru pekerja berpengalaman lah yang kerap lengah, sebab rasa terbiasa menumpulkan kewaspadaan. Kecelakaan di bengkel jarang disebabkan satu kesalahan besar; biasanya beberapa hal kecil menumpuk, misalnya lantai licin, penerangan kurang, dan pelindung mata yang ditinggalkan karena hanya sebentar. Kata "cuma sebentar" adalah alasan yang paling sering muncul dalam laporan kecelakaan. Aturan keselamatan hampir selalu lahir dari kejadian nyata yang sudah melukai seseorang, bukan dari kekhawatiran yang dikarang di belakang meja.',
    questions:[
      {q:'Siapa yang justru kerap lengah menurut bacaan?', options:['Pekerja berpengalaman, sebab rasa terbiasa menumpulkan kewaspadaan','Pekerja yang baru masuk','Pekerja yang paling muda','Pengawas lapangan'], answer:0},
      {q:'Bagaimana kecelakaan di bengkel biasanya terjadi?', options:['Beberapa hal kecil menumpuk, bukan satu kesalahan besar','Selalu karena satu kesalahan fatal','Selalu karena alat yang rusak','Selalu karena cuaca buruk'], answer:0},
      {q:'Apa contoh hal kecil yang menumpuk?', options:['Lantai licin, penerangan kurang, dan pelindung mata yang ditinggalkan','Alat yang terlalu banyak','Pekerja yang terlalu sedikit','Ruangan yang terlalu luas'], answer:0},
      {q:'Alasan apa yang paling sering muncul dalam laporan kecelakaan?', options:['"Cuma sebentar"','"Alatnya rusak"','"Tidak ada yang memberi tahu"','"Sudah terlalu malam"'], answer:0},
      {q:'Dari mana aturan keselamatan hampir selalu lahir?', options:['Dari kejadian nyata yang sudah melukai seseorang','Dari kekhawatiran yang dikarang di belakang meja','Dari kebiasaan pekerja lama','Dari usulan pembuat alat'], answer:0}
    ]
  },
  {
    id:'umum-jadwal', jurusan:'Umum / Lintas Jurusan',
    title:'Membaca Jadwal Keberangkatan',
    text:'Papan jadwal memuat kolom keberangkatan, tujuan, dan keterangan. Angka jam biasanya ditulis dalam format dua puluh empat jam, sehingga pukul 14.30 berarti setengah tiga sore. Kolom keterangan sering luput dibaca padahal paling menentukan; tulisan "kecuali hari libur" berarti perjalanan itu tidak berjalan pada tanggal merah. Beberapa jadwal juga hanya berlaku pada hari kerja. Penumpang yang hanya melihat jam keberangkatan tanpa membaca keterangan berisiko menunggu kendaraan yang memang tidak beroperasi hari itu. Membaca tabel ternyata menuntut ketelitian yang sama seperti membaca paragraf.',
    questions:[
      {q:'Apa saja kolom yang dimuat papan jadwal?', options:['Keberangkatan, tujuan, dan keterangan','Harga, warna, dan nomor kursi','Nama sopir dan jumlah penumpang','Cuaca dan jarak tempuh'], answer:0},
      {q:'Apa arti pukul 14.30 dalam format dua puluh empat jam?', options:['Setengah tiga sore','Setengah tiga pagi','Pukul empat sore','Pukul dua belas siang'], answer:0},
      {q:'Kolom apa yang sering luput dibaca padahal paling menentukan?', options:['Keterangan','Tujuan','Jam keberangkatan','Nomor kendaraan'], answer:0},
      {q:'Apa arti tulisan "kecuali hari libur"?', options:['Perjalanan itu tidak berjalan pada tanggal merah','Perjalanan hanya ada saat libur','Perjalanan berjalan setiap hari','Perjalanan diberi potongan harga'], answer:0},
      {q:'Apa risiko penumpang yang hanya melihat jam keberangkatan?', options:['Menunggu kendaraan yang memang tidak beroperasi hari itu','Membayar ongkos dua kali lipat','Turun di tujuan yang salah','Kehilangan tiket perjalanan'], answer:0}
    ]
  },
  {
    id:'umum-menabung', jurusan:'Umum / Lintas Jurusan',
    title:'Menabung dan Bunga Berbunga',
    text:'Menabung sedikit demi sedikit secara rutin sering lebih efektif daripada menunggu punya uang besar. Bunga tabungan dihitung dari saldo yang mengendap, dan bunga yang diperoleh ikut menghasilkan bunga pada periode berikutnya. Peristiwa inilah yang disebut bunga berbunga, dan pengaruhnya baru terasa nyata setelah bertahun-tahun. Prinsip yang sama berlaku pada utang. Sisa cicilan yang belum dibayar juga dikenai bunga yang menumpuk, sehingga utang kecil dapat membengkak bila terus ditunda. Memahami arah kerja bunga membuat seseorang tahu kapan ia menguntungkan dan kapan justru merugikan.',
    questions:[
      {q:'Apa yang disarankan bacaan tentang cara menabung?', options:['Menabung sedikit demi sedikit secara rutin','Menunggu sampai punya uang besar','Menabung sekali dalam setahun','Menabung hanya saat ada sisa'], answer:0},
      {q:'Dari apa bunga tabungan dihitung?', options:['Dari saldo yang mengendap','Dari jumlah setoran pertama saja','Dari lama membuka rekening','Dari jumlah penarikan'], answer:0},
      {q:'Apa yang disebut bunga berbunga?', options:['Bunga yang diperoleh ikut menghasilkan bunga pada periode berikutnya','Bunga yang dibayarkan dua kali','Bunga yang dihapus tiap tahun','Bunga yang dibagi rata'], answer:0},
      {q:'Kapan pengaruh bunga berbunga terasa nyata?', options:['Setelah bertahun-tahun','Dalam hitungan hari','Seketika saat menabung','Hanya pada bulan pertama'], answer:0},
      {q:'Bagaimana prinsip yang sama berlaku pada utang?', options:['Sisa cicilan dikenai bunga yang menumpuk sehingga utang kecil dapat membengkak','Utang tidak pernah dikenai bunga','Bunga utang selalu dihapus','Utang berkurang sendiri seiring waktu'], answer:0}
    ]
  },
  {
    id:'umum-grafik', jurusan:'Umum / Lintas Jurusan',
    title:'Grafik Bisa Menyesatkan',
    text:'Grafik memudahkan kita melihat pola yang sulit ditangkap dari deretan angka. Namun tampilan grafik dapat menyesatkan bila sumbunya tidak dimulai dari nol. Selisih yang sebenarnya kecil bisa terlihat seperti lonjakan besar hanya karena skalanya dipangkas. Judul dan satuan juga menentukan makna; angka "20" bisa berarti dua puluh unit atau dua puluh ribu unit. Pembaca yang teliti selalu memeriksa sumbu, satuan, dan rentang waktunya sebelum menarik kesimpulan. Grafik yang hanya menampilkan tiga bulan terakhir dapat menyembunyikan kenyataan bahwa angka itu sesungguhnya menurun sepanjang tahun.',
    questions:[
      {q:'Apa manfaat utama grafik menurut bacaan?', options:['Memudahkan melihat pola yang sulit ditangkap dari deretan angka','Membuat laporan terlihat mahal','Menggantikan seluruh angka','Mempercepat perhitungan'], answer:0},
      {q:'Kapan tampilan grafik bisa menyesatkan?', options:['Bila sumbunya tidak dimulai dari nol','Bila memakai warna terlalu banyak','Bila digambar dengan tangan','Bila judulnya terlalu panjang'], answer:0},
      {q:'Apa akibat skala yang dipangkas?', options:['Selisih yang kecil terlihat seperti lonjakan besar','Semua angka menjadi hilang','Grafik menjadi lebih jujur','Pola menjadi tidak terlihat'], answer:0},
      {q:'Mengapa satuan penting menurut bacaan?', options:['Angka "20" bisa berarti dua puluh unit atau dua puluh ribu unit','Satuan menentukan warna grafik','Satuan mempercepat pembacaan','Satuan menggantikan judul'], answer:0},
      {q:'Apa yang dapat disembunyikan grafik tiga bulan terakhir?', options:['Kenyataan bahwa angkanya menurun sepanjang tahun','Nama pembuat grafik','Jumlah responden','Warna aslinya'], answer:0}
    ]
  },
  {
    id:'umum-jejak', jurusan:'Umum / Lintas Jurusan',
    title:'Jejak Digital yang Menetap',
    text:'Unggahan di media sosial sering dianggap sementara, padahal jejaknya jauh lebih awet daripada dugaan pemiliknya. Sebuah unggahan dapat disalin atau ditangkap layar orang lain dalam hitungan detik, sehingga menghapus unggahan asli tidak menghapus salinan yang sudah tersebar. Banyak perusahaan kini menelusuri jejak digital calon pekerja sebelum wawancara. Candaan yang dulu terasa lucu bagi remaja bisa dibaca dengan sudut pandang berbeda oleh perekrut bertahun-tahun kemudian. Cara paling aman bukan menghapus jejak setelah bermasalah, melainkan berpikir sejenak sebelum menekan tombol unggah.',
    questions:[
      {q:'Apa anggapan keliru tentang unggahan media sosial?', options:['Dianggap sementara padahal jejaknya jauh lebih awet','Dianggap sulit dibuat','Dianggap tidak dilihat siapa pun','Dianggap selalu berbayar'], answer:0},
      {q:'Mengapa menghapus unggahan asli tidak cukup?', options:['Karena salinan atau tangkapan layar sudah tersebar','Karena tombol hapus tidak berfungsi','Karena unggahan otomatis kembali','Karena penghapusan butuh biaya'], answer:0},
      {q:'Apa yang kini dilakukan banyak perusahaan?', options:['Menelusuri jejak digital calon pekerja sebelum wawancara','Melarang pekerja memakai media sosial','Membuatkan akun untuk pelamar','Menghapus akun pelamar'], answer:0},
      {q:'Mengapa candaan lama bisa bermasalah?', options:['Bisa dibaca dengan sudut pandang berbeda oleh perekrut bertahun-tahun kemudian','Karena bahasanya berubah','Karena candaan selalu dilarang','Karena tidak ada yang menertawakannya'], answer:0},
      {q:'Apa cara paling aman menurut bacaan?', options:['Berpikir sejenak sebelum menekan tombol unggah','Menghapus jejak setelah bermasalah','Membuat akun baru setiap tahun','Mengunci semua akun selamanya'], answer:0}
    ]
  },
  {
    id:'umum-wawancara', jurusan:'Umum / Lintas Jurusan',
    title:'Bersiap Menghadapi Wawancara Kerja',
    text:'Wawancara kerja bukan sekadar menguji keterampilan teknis. Pewawancara juga menilai kesungguhan, cara berkomunikasi, dan kesiapan calon pekerja. Pelamar yang mencari tahu bidang usaha perusahaan sebelum datang biasanya lebih mudah menjawab dengan tepat sasaran. Menjawab dengan contoh nyata jauh lebih meyakinkan daripada pernyataan umum seperti "saya pekerja keras". Kejujuran mengakui hal yang belum dikuasai justru sering dinilai baik, apalagi bila disertai kemauan belajar. Kesalahan yang sering terjadi bukan pada jawaban yang salah, melainkan pada pelamar yang datang tanpa persiapan sama sekali dan berharap bisa berbicara seadanya.',
    questions:[
      {q:'Apa yang dinilai pewawancara selain keterampilan teknis?', options:['Kesungguhan, cara berkomunikasi, dan kesiapan','Tinggi badan dan usia','Jumlah teman pelamar','Merek pakaian yang dipakai'], answer:0},
      {q:'Apa manfaat mencari tahu bidang usaha perusahaan?', options:['Lebih mudah menjawab dengan tepat sasaran','Bisa meminta gaji lebih tinggi','Bisa melewati tahap wawancara','Tidak perlu membawa berkas'], answer:0},
      {q:'Cara menjawab seperti apa yang lebih meyakinkan?', options:['Menjawab dengan contoh nyata','Menjawab dengan pernyataan umum','Menjawab sesingkat mungkin','Menjawab dengan istilah rumit'], answer:0},
      {q:'Bagaimana penilaian terhadap kejujuran mengakui hal yang belum dikuasai?', options:['Sering dinilai baik, apalagi bila disertai kemauan belajar','Selalu membuat pelamar gagal','Dianggap tidak sopan','Membuat wawancara dihentikan'], answer:0},
      {q:'Apa kesalahan yang sering terjadi menurut bacaan?', options:['Datang tanpa persiapan dan berharap bisa berbicara seadanya','Memberi jawaban yang salah','Datang terlalu awal','Membawa terlalu banyak berkas'], answer:0}
    ]
  },
  {
    id:'umum-belanja', jurusan:'Umum / Lintas Jurusan',
    title:'Diskon yang Tidak Selalu Untung',
    text:'Tulisan diskon besar di etalase belum tentu berarti harga termurah. Sebagian penjual menaikkan harga terlebih dahulu sebelum memberi potongan, sehingga harga akhirnya sama saja. Penawaran "beli dua gratis satu" juga menguntungkan hanya bila barang itu memang dibutuhkan; bila tidak, uang tetap keluar untuk barang yang menumpuk. Cara paling sederhana menilai penawaran adalah membandingkan harga per satuan, bukan harga per kemasan. Kemasan besar tidak selalu lebih murah per satuannya. Pembeli yang terburu-buru karena takut kehabisan justru paling mudah terjebak, sebab keputusan cepat jarang disertai perhitungan.',
    questions:[
      {q:'Mengapa tulisan diskon besar belum tentu berarti termurah?', options:['Sebagian penjual menaikkan harga dulu sebelum memberi potongan','Karena diskon selalu palsu','Karena harga tidak pernah berubah','Karena diskon hanya untuk anggota'], answer:0},
      {q:'Kapan penawaran "beli dua gratis satu" menguntungkan?', options:['Hanya bila barang itu memang dibutuhkan','Selalu menguntungkan dalam keadaan apa pun','Hanya bila harganya mahal','Hanya pada akhir pekan'], answer:0},
      {q:'Apa cara paling sederhana menilai penawaran?', options:['Membandingkan harga per satuan, bukan per kemasan','Melihat ukuran tulisan diskon','Menanyakan pada penjual','Memilih kemasan terbesar'], answer:0},
      {q:'Apa yang dikatakan bacaan tentang kemasan besar?', options:['Tidak selalu lebih murah per satuannya','Selalu lebih murah per satuannya','Selalu lebih mahal per satuannya','Harganya selalu sama'], answer:0},
      {q:'Pembeli seperti apa yang paling mudah terjebak?', options:['Yang terburu-buru karena takut kehabisan','Yang membandingkan harga','Yang membawa daftar belanja','Yang datang pada pagi hari'], answer:0}
    ]
  },
  {
    id:'umum-tidur', jurusan:'Umum / Lintas Jurusan',
    title:'Tidur dan Daya Ingat',
    text:'Tidur bukan waktu yang terbuang, melainkan saat otak menata ingatan yang diperoleh sepanjang hari. Selama tidur, ingatan baru dipindahkan ke penyimpanan yang lebih tahan lama. Karena itu belajar semalam suntuk menjelang ujian sering merugikan; bahan memang sempat dibaca, tetapi tanpa tidur otak tidak sempat menatanya sehingga mudah lupa keesokan harinya. Cahaya layar gawai pada malam hari juga menipu otak seolah hari masih terang, sehingga rasa kantuk datang terlambat. Belajar sedikit demi sedikit beberapa hari sebelumnya, disertai tidur cukup, terbukti jauh lebih membekas.',
    questions:[
      {q:'Apa yang terjadi pada otak selama tidur?', options:['Otak menata ingatan yang diperoleh sepanjang hari','Otak berhenti bekerja sepenuhnya','Otak menghapus seluruh ingatan','Otak hanya mengistirahatkan mata'], answer:0},
      {q:'Ke mana ingatan baru dipindahkan selama tidur?', options:['Ke penyimpanan yang lebih tahan lama','Ke bagian tubuh lainnya','Ke ingatan sementara','Ke luar dari otak'], answer:0},
      {q:'Mengapa belajar semalam suntuk sering merugikan?', options:['Tanpa tidur otak tidak sempat menata bahan sehingga mudah lupa','Karena bahan tidak sempat dibaca','Karena mata menjadi rusak','Karena ujian selalu pagi hari'], answer:0},
      {q:'Apa pengaruh cahaya layar gawai pada malam hari?', options:['Menipu otak seolah hari masih terang sehingga kantuk datang terlambat','Membuat mata cepat mengantuk','Mempercepat penataan ingatan','Membuat ingatan lebih kuat'], answer:0},
      {q:'Cara belajar seperti apa yang terbukti lebih membekas?', options:['Sedikit demi sedikit beberapa hari sebelumnya disertai tidur cukup','Semalam suntuk sebelum ujian','Sambil menonton layar gawai','Hanya membaca satu kali'], answer:0}
    ]
  },
  {
    id:'umum-limbah', jurusan:'Umum / Lintas Jurusan',
    title:'Mengelola Limbah Praktik di Sekolah',
    text:'Kegiatan praktik di SMK menghasilkan berbagai limbah, mulai dari oli bekas, potongan logam, sisa kabel, hingga minyak goreng bekas. Limbah tersebut tidak boleh dibuang sembarangan karena dapat mencemari tanah dan air. Oli bekas termasuk limbah berbahaya sebab satu liter oli mampu mencemari ribuan liter air bersih. Karena itu bengkel sekolah menampung oli bekas dalam drum khusus dan menyerahkannya kepada pengumpul resmi. Sebagian limbah justru bernilai ekonomi. Potongan logam dapat dijual kembali, sedangkan minyak goreng bekas kini banyak diolah menjadi bahan bakar alternatif. Pemilahan sejak awal menjadi kunci. Limbah yang telanjur tercampur jauh lebih sulit dan mahal untuk diolah kembali.',
    questions:[
      {q:'Mengapa limbah praktik tidak boleh dibuang sembarangan?', options:['Karena dapat mencemari tanah dan air','Karena jumlahnya sangat sedikit','Karena baunya mengganggu siswa','Karena dilarang oleh pengumpul resmi'], answer:0},
      {q:'Mengapa oli bekas disebut limbah berbahaya?', options:['Karena satu liter oli mampu mencemari ribuan liter air bersih','Karena oli bekas mudah terbakar di udara terbuka','Karena oli bekas tidak dapat dijual kembali','Karena oli bekas menghasilkan bau menyengat'], answer:0},
      {q:'Bagaimana bengkel sekolah menangani oli bekas?', options:['Menampungnya dalam drum khusus lalu menyerahkan ke pengumpul resmi','Menyiramkannya ke tanah kosong','Membakarnya di halaman belakang','Mencampurnya dengan minyak goreng bekas'], answer:0},
      {q:'Limbah apa yang kini diolah menjadi bahan bakar alternatif?', options:['Minyak goreng bekas','Potongan logam','Sisa kabel','Oli bekas'], answer:0},
      {q:'Mengapa pemilahan sejak awal menjadi kunci?', options:['Karena limbah yang telanjur tercampur lebih sulit dan mahal diolah kembali','Karena pemilahan membuat limbah menjadi lebih banyak','Karena pengumpul resmi hanya menerima limbah tercampur','Karena pemilahan menghilangkan nilai ekonomi limbah'], answer:0}
    ]
  }
];
