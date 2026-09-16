import csv
import json
import io

raw_csv = """No.,date,contact,No Telfon,Resolve / Follow Up,Status Leads,assigned_to,answered_at,SLA First Respon,agent_first_reply_time,Source,Iklan by,Remaks FU 1,SOP Sales,Notes
1,"15-Sep-26, 16:19",beloved,85697810875,First Contact,Cold,Fitriyani Dewi,"15-Sep-26, 16:20",0:00:13,0:00:13,Instagram,Apart & WLB,"Minat apartemen, sales FU 1x, belum ada respon cust",❌,
2,"15-Sep-26, 15:29",Hw,87785670007,First Contact,Cold,Ira Rosdiana,"15-Sep-26, 15:30",0:00:45,0:00:45,Instagram,Loft Living View,"Minat Loft Living, sales FU 2x, belum ada respon cust",❌,
3,"15-Sep-26, 15:03",.,85697156692,First Contact,Cold,Kadek Bayu Permana Putra,"15-Sep-26, 15:03",0:00:15,0:00:14,Instagram,SOHO Signature,"Minat SOHO, sales FU 1x, belum ada respon cust",❌,
4,"15-Sep-26, 14:21",Tin,89501255015,First Contact,Cold,Ditto Zulfikar Junaedi,"15-Sep-26, 14:24",0:02:47,0:00:24,Instagram,SOHO Signature,"Minat SOHO, sales FU 2x, belum ada respon cust",❌,
5,"15-Sep-26, 12:45",Inzaghi,81211143498,First Contact,Cold,Fitriyani Dewi,"15-Sep-26, 12:48",0:02:46,0:00:07,Instagram,Loft Living View,"Minat Loft Living, sales FU 2x, belum ada respon cust",❌,
6,"15-Sep-26, 12:23",Imrann,85721678812,First Contact,Cold,Kadek Bayu Permana Putra,"15-Sep-26, 12:26",0:03:12,0:00:40,Instagram,SOHO Signature,"Minat SOHO, sales FU 1x, belum ada respon cust",❌,
7,"15-Sep-26, 11:43",nada,85117173166,Follow Up,Prospect,Yulia Eunike,"15-Sep-26, 11:49",0:05:43,0:01:05,Google,Website,"Unit AP-A 69,81sqm tersedia, diundang survey Rabu 16 Sept",✅,
8,"15-Sep-26, 11:34",reznrr,82110802302,Cari Sewa,Junk,Kadek Bayu Permana Putra,"15-Sep-26, 11:34",0:00:00,0:00:00,Not Detected,Not Detected,"Mahasiswa UMN, cari lokasi shooting film, minta PL sewa & minta visit",,[Ended by sales at 15-Sep-26 11:35 WIB]
9,"15-Sep-26, 10:58",Babydut,83189242343,First Contact,Cold,Ditto Zulfikar Junaedi,"15-Sep-26, 11:01",0:03:08,0:00:20,Instagram,Apart Kampus,"Minat info, sales FU 2x, belum ada respon cust",❌,
10,"15-Sep-26, 9:51",Huda,887437050560,First Contact,Cold,Fitriyani Dewi,"15-Sep-26, 9:54",0:02:57,0:00:20,Instagram,Apart Kampus,"Minat info, sales FU 3x, belum ada respon cust",❌,
11,"15-Sep-26, 0:58",Alfredi,81372855990,Follow Up,Warm,Kadek Bayu Permana Putra,"15-Sep-26, 2:20",0:07:35,0:00:24,Not Detected,Not Detected,"Belum bisa visit (di Batam), tanya harga SOHO 2,8-5,5M",✅,
12,"15-Sep-26, 0:10",Jessie,82128231348,First Contact,Cold,Kadek Bayu Permana Putra,"15-Sep-26, 0:10",0:00:21,0:00:21,Instagram,Apart Kampus,"Minat info, sales FU 1x, belum ada respon cust",❌,
13,"15-Sep-26, 0:07",Jack スノト,8125612700,Follow Up,Prospect,Ira Rosdiana,"15-Sep-26, 0:28",0:05:18,0:00:46,Instagram,SOHO Signature,"Jadwal visit hari Minggu, harga 155sqm 5M & 304sqm 9,8M",✅,
14,"14-Sep-26, 22:36",Berli,87878740395,Strangers,Junk,Fitriyani Dewi,"15-Sep-26, 8:49",0:04:58,0:00:18,Not Detected,Not Detected,"Salah nomor, kira nomor resto Ta Hwa Yuan",,
15,"14-Sep-26, 22:22",ayusita,85971707619,First Contact,Cold,Ditto Zulfikar Junaedi,"14-Sep-26, 22:22",0:00:26,0:00:26,Instagram,Apart Kampus,"Minat info, sales FU 1x, belum ada respon cust",❌,
16,"14-Sep-26, 17:10",Jovanie Lim,81266167700,First Contact,Cold,Yulia Eunike,"14-Sep-26, 17:12",0:01:28,0:01:28,Instagram,Apart Kampus,"Minat info, sales FU 4x, belum ada respon cust",❌,
17,"14-Sep-26, 16:48",Dhiyaul Haq,85719035967,First Contact,Cold,Fitriyani Dewi,"14-Sep-26, 16:50",0:02:32,0:00:24,Instagram,Apart Kampus,"Minat info, sales FU 4x, belum ada respon cust",❌,
18,"14-Sep-26, 16:20",Kenny Adinugroho,8118303024,First Contact,Cold,Kadek Bayu Permana Putra,"14-Sep-26, 16:20",0:00:22,0:00:22,Instagram,SOHO Signature,"Minat SOHO, sales FU 3x, belum ada respon cust",❌,
19,"14-Sep-26, 16:12",Della Adhiani,89696046380,First Contact,Cold,Ditto Zulfikar Junaedi,"14-Sep-26, 16:15",0:02:59,0:00:13,Instagram,SOHO Signature,"Minat SOHO, sales FU 2x, belum ada respon cust",❌,
20,"14-Sep-26, 16:02",MasHadi Primatam4,8111110028,First Contact,Cold,Fitriyani Dewi,"14-Sep-26, 16:05",0:03:04,0:00:18,Instagram,SOHO Signature,"Minat SOHO, sales FU 4x, belum ada respon cust",❌,
21,"14-Sep-26, 15:31",bagas.,85775301259,First Contact,Cold,Kadek Bayu Permana Putra,"14-Sep-26, 15:31",0:00:25,0:00:24,Instagram,Apart Kampus,"Minat info, sales FU 2x, belum ada respon cust",❌,
22,"14-Sep-26, 12:58",Claudius B,82111392084,First Contact,Cold,Ditto Zulfikar Junaedi,"14-Sep-26, 13:01",0:03:06,0:00:50,Instagram,SOHO Signature,"Minat SOHO, sales FU 2x, belum ada respon cust",❌,
23,"14-Sep-26, 12:57",Lusia Djong,87771599225,Strangers,Junk,Kadek Bayu Permana Putra,"14-Sep-26, 12:57",0:00:12,0:00:12,Not Detected,Not Detected,"Salah nomor, kira nomor resto Ta Hwa Yuan",,[Ended by sales at 14-Sep-26 13:06 WIB]
24,"14-Sep-26, 12:36",MufiStore Kaos Custom,82327803457,First Contact,Cold,Fitriyani Dewi,"14-Sep-26, 12:36",0:00:17,0:00:17,Instagram,SOHO Signature,"Minat SOHO, sales FU 3x, belum ada respon cust",❌,
25,"14-Sep-26, 12:31",Cia Ardiansyah,82236325905,Cari Sewa,Junk,Fitriyani Dewi,"14-Sep-26, 12:52",0:21:04,0:00:25,Google,Website,Minta PL sewa bulanan/tahunan 1BR,,
26,"14-Sep-26, 12:07",Winna,81288960815,Strangers,Junk,Fitriyani Dewi,"14-Sep-26, 12:21",0:13:54,0:00:17,Not Detected,Not Detected,"Salah nomor, kira nomor resto (soft opening, jam buka, diskon)",,
27,"14-Sep-26, 11:22",Jenny Theng,81994852768,Strangers,Junk,Kadek Bayu Permana Putra,"14-Sep-26, 11:22",0:00:00,0:00:00,Not Detected,Not Detected,"Salah nomor, tanya lokasi resto (sesi 1 dari 2)",,[Ended by sales at 14-Sep-26 11:22 WIB]
28,"14-Sep-26, 10:56",MasyaAllah,87771229771,Follow Up,Prospect,Ditto Zulfikar Junaedi,"14-Sep-26, 14:57",0:03:13,0:00:26,Instagram,SOHO Signature,"Bu Rita: SOHO 6 karyawan, harga 2,6M, akan atur jadwal show unit",✅,
29,"14-Sep-26, 9:36",AG,87790063666,First Contact,Cold,Fitriyani Dewi,"14-Sep-26, 9:50",0:14:08,0:00:23,Instagram,Loft Living View,"Minat Loft Living, sales FU 4x, belum ada respon cust",❌,
30,"14-Sep-26, 9:33",ALEX HAN,81380778077,Over Budget,Junk,Yulia Eunike,"14-Sep-26, 9:42",0:09:43,0:00:53,Google,Website,"Minta PL apartemen, dapat harga, lalu 'sorry pak budget nya gak masuk'",,
31,"14-Sep-26, 8:15",Dimas SamidunZ,81808081821,First Contact,Cold,Kadek Bayu Permana Putra,"14-Sep-26, 8:34",0:18:20,0:00:26,Instagram,SOHO Signature,"Minat SOHO, sales FU 2x, belum ada respon cust",❌,
32,"14-Sep-26, 2:00",canpi,87821956628,Follow Up,Warm,Fitriyani Dewi,"14-Sep-26, 8:28",2:44:31,0:00:00,Instagram,SOHO Signature,"Rifaldi: minat invest SOHO, aktif respon multi-hari",✅,
33,"13-Sep-26, 22:28",hazel,83135066376,First Contact,Cold,Ira Rosdiana,"13-Sep-26, 22:29",0:00:51,0:00:51,Instagram,SOHO Signature,"Minat SOHO, sales FU 1x, belum ada respon cust",❌,
34,"13-Sep-26, 21:26",Zoma by.U,85196482397,Follow Up,Warm,Kadek Bayu Permana Putra,"13-Sep-26, 21:27",0:00:18,0:00:18,Instagram,SOHO Signature,"Minat SOHO, dapat harga 2-5M & brosur",✅,
35,"13-Sep-26, 21:26",Novia - 23,85770240858,Follow Up,Visited,Ditto Zulfikar Junaedi,"13-Sep-26, 21:35",0:07:43,0:00:27,Tiktok,Tiktok,"Minat SH untuk kantor administrasni bisnis alkohol, compare ruko (Source Leads https://vt.tiktok.com/ZSqHtYVpR/)",✅,
36,"13-Sep-26, 20:10",DVJ,82111386831,First Contact,Cold,Ditto Zulfikar Junaedi,"13-Sep-26, 20:30",0:19:53,0:01:28,Instagram,Apart Kampus,"Minat info, sales FU 1x, belum ada respon cust",❌,
37,"13-Sep-26, 19:31",Pay,895365141738,First Contact,Cold,Kadek Bayu Permana Putra,"13-Sep-26, 19:39",0:07:25,0:00:26,Instagram,Apart Kampus,"Minat info, sales FU 1x, belum ada respon cust",❌,
38,"13-Sep-26, 19:04",feliks adhitama,81338724661,Follow Up,Warm,Ira Rosdiana,"13-Sep-26, 19:03",0:00:43,0:00:43,Google,Website,"2BR, dapat harga & brosur, ditawari private viewing",✅,
39,"13-Sep-26, 17:35",sal,83815405233,First Contact,Cold,Fitriyani Dewi,"13-Sep-26, 17:39",0:03:12,0:00:58,Instagram,Apart Kampus,"Minat info, sales FU 1x, belum ada respon cust",❌,
40,"13-Sep-26, 17:23",Alda,81546866442,Follow Up,Warm,Ira Rosdiana,"13-Sep-26, 17:23",0:00:57,0:00:57,Google,Website,"Minat SOHO, dapat harga per size & katalog, ditawari private viewing",✅,
41,"13-Sep-26, 16:59",Faisal Nugraha,81324580117,Follow Up,Warm,Kadek Bayu Permana Putra,"13-Sep-26, 16:56",0:00:16,0:00:16,Google,Website,"Dibuatkan simulasi cicilan detail (tenor 15th, cicilan 13jt)",✅,
42,"13-Sep-26, 16:35",Ryan,81282794013,Follow Up,Cold,Ditto Zulfikar Junaedi,"13-Sep-26, 16:36",0:00:15,0:00:15,Instagram,Apart Kampus,Cust balas lalu 'Maaf gajadi',✅,[Ended by sales at 13-Sep-26 19:11 WIB]
43,"13-Sep-26, 13:46",Evita Febriyanti,85966466216,Follow Up,Cold,Fitriyani Dewi,"13-Sep-26, 13:49",0:02:59,0:00:16,Google,Website,"Tanya Lifestyle Ground, balas singkat 'Hunian'",✅,
44,"13-Sep-26, 12:39",Jun 郭,85121178717,Strangers,Junk,Ira Rosdiana,"13-Sep-26, 12:40",0:01:35,0:01:35,Not Detected,Not Detected,"Booking resto, sadar 'salah chat', tidak relevan",,
45,"13-Sep-26, 12:15",Natalia Vanessa,811821996,Strangers,Junk,Kadek Bayu Permana Putra,"13-Sep-26, 12:16",0:00:45,0:00:44,Not Detected,Not Detected,"Tanya reservasi resto Ta Hwa Yuan, tidak relevan dgn properti",,[Ended by sales at 14-Sep-26 11:21 WIB]
46,"13-Sep-26, 11:33",Kaleb,81806087602,Strangers,Junk,Ditto Zulfikar Junaedi,"13-Sep-26, 11:33",0:00:00,0:00:00,Not Detected,Not Detected,"Tanya jam buka resto, tidak relevan dgn properti",,[Ended by sales at 13-Sep-26 11:54 WIB]
47,"13-Sep-26, 11:00",Leny Mudiarti,81289857308,Strangers,Junk,Ditto Zulfikar Junaedi,"13-Sep-26, 11:00",0:00:19,0:00:19,Not Detected,Not Detected,"Tanya reservasi resto Tah Wa Yuan, tidak relevan dgn properti",,[Ended by sales at 13-Sep-26 11:07 WIB]
48,"13-Sep-26, 10:55",Charlie,89520001349,Follow Up,Warm,Yulia Eunike,"13-Sep-26, 10:55",1:05:08,0:01:48,Instagram,SOHO Signature,"Tanya cicilan tanpa KPA, cicil ke developer 6x/6bulan",✅,
49,"13-Sep-26, 10:01",ARIL,89668726269,First Contact,Cold,Kadek Bayu Permana Putra,"13-Sep-26, 10:08",0:07:03,0:00:18,Instagram,Apart Kampus,"Minat info, sales FU 1x, belum ada respon cust",❌,
50,"13-Sep-26, 7:10",xxnzm,83192631729,Follow Up,Cold,Ditto Zulfikar Junaedi,"13-Sep-26, 7:46",0:35:03,0:01:05,Instagram,Apart Kampus,Cust balas lalu ngaku 'kepencet min',✅,[Ended by sales at 13-Sep-26 11:54 WIB]
51,"13-Sep-26, 6:50",JR,81398617739,First Contact,Cold,Fitriyani Dewi,"13-Sep-26, 7:45",0:55:58,0:01:48,Instagram,SOHO Signature,"Minat SOHO, sales FU 3x, belum ada respon cust",✅,
52,"13-Sep-26, 4:07",jeniamalia44,89653840009,First Contact,Cold,Kadek Bayu Permana Putra,"13-Sep-26, 4:07",0:00:00,0:00:00,Not Detected,Not Detected,"Chat 'Mlm' doang, belum ada respon sales (sesi 1 dari 2)",❌,[Ended by sales at 13-Sep-26 22:20 WIB]
53,"13-Sep-26, 4:04",kuk,895621548368,First Contact,Cold,Fitriyani Dewi,"13-Sep-26, 7:29",3:25:02,0:00:20,Google,Website,"Minta info dari Google, sales FU 3x, belum ada respon cust",✅,
54,"13-Sep-26, 1:55",Pdd,81281238889,Follow Up,Cold,Kadek Bayu Permana Putra,"13-Sep-26, 2:08",0:12:30,0:00:44,Not Detected,Not Detected,"Minta PL loft apt, dapat harga mulai 2M",✅,
55,"13-Sep-26, 0:28",OSIS//elmira aklidisa,82111924354,First Contact,Cold,Fitriyani Dewi,"13-Sep-26, 6:30",2:19:26,0:00:00,Instagram,Apart Kampus,"Minat info, sales FU 3x, belum ada respon cust",✅,
56,"12-Sep-26, 18:34",vy,8984309696,First Contact,Cold,Kadek Bayu Permana Putra,"12-Sep-26, 18:50",0:16:32,0:00:24,Instagram,Apart Kampus,"Minat info, sales FU 1x, belum ada respon cust",❌,
57,"12-Sep-26, 17:51",Natni,85821717487,Follow Up,Warm,Fitriyani Dewi,"12-Sep-26, 17:51",0:00:19,0:00:19,Google,Website,"Tania: unit AP-B 72,42sqm, dapat harga 2,3M & promo",✅,
58,"12-Sep-26, 14:08",Stenly Steven,87730578488,Buyer,Junk,Kadek Bayu Permana Putra,"12-Sep-26, 14:36",0:06:42,0:02:02,Not Detected,Not Detected,"Handover unit milik ayahnya, tanya proses serah terima (2 sesi chat lanjutan tgl 13)",,[Ended by sales at 15-Sep-26 12:53 WIB]
59,"12-Sep-26, 13:28",bismillah,85781257684,Strangers,Junk,Ditto Zulfikar Junaedi,"12-Sep-26, 13:40",0:11:44,0:00:12,Instagram,SOHO Signature,Trolling bahasa ('ga ngerti Indo' lalu 'gabisa Inggris'),,[Ended by sales at 13-Sep-26 07:47 WIB]
60,"12-Sep-26, 12:06",Lilye,895393340200,Follow Up,Warm,Yulia Eunike,"12-Sep-26, 12:09",0:02:50,0:00:45,Instagram,SOHO Signature,"Tanya harga & cicilan, minta info apart+loft, dapat brosur",✅,
61,"12-Sep-26, 11:20",Dira,81229967078,First Contact,Cold,Fitriyani Dewi,"12-Sep-26, 11:20",0:00:08,0:00:08,Instagram,Apart Kampus,"Minat info, sales FU 4x, belum ada respon cust",✅,
62,"12-Sep-26, 9:34",Gde B,81808803808,Follow Up,Prospect,Ditto Zulfikar Junaedi,"12-Sep-26, 9:35",0:05:02,0:00:15,Instagram,SOHO Signature,"Cicilan 26jt/20th unit 144sqm, setuju arrange tim untuk visit",✅,
63,"12-Sep-26, 6:29",Joyce,81289721377,First Contact,Cold,Fitriyani Dewi,"12-Sep-26, 7:44",1:14:35,0:00:20,Instagram,Loft Living View,"Minat Loft Living, sales FU 4x, belum ada respon cust",✅,
64,"12-Sep-26, 4:35",19,85191435080,Follow Up,Cold,Fitriyani Dewi,"12-Sep-26, 7:54",3:18:43,0:00:16,Instagram,SOHO Signature,"Balas 'Ohh ok' singkat, tidak lanjut jawab kebutuhan huni/invest",✅,
65,"11-Sep-26, 23:10",kok,8211979252,Follow Up,Cold,Ditto Zulfikar Junaedi,"11-Sep-26, 23:11",0:00:11,0:00:11,Instagram,Apart Kampus,Aku coba liat2 dulu yah kak',✅,
66,"11-Sep-26, 23:01",Penn,87896542404,Cari Sewa,Junk,Kadek Bayu Permana Putra,"11-Sep-26, 23:01",0:00:00,0:00:00,Not Detected,Not Detected,"Tanya tipe studio & sewa perbulan, belum ada respon sales",,[Ended by sales at 12-Sep-26 10:45 WIB]
67,"11-Sep-26, 21:56",JSBRdisa,81285132727,First Contact,Cold,Ditto Zulfikar Junaedi,"11-Sep-26, 22:01",0:05:00,0:00:28,Instagram,Apart Kampus,"Minat info, sales FU 3x, belum ada respon cust",❌,
68,"11-Sep-26, 19:38",tdkdkthui,88215923510,First Contact,Cold,Kadek Bayu Permana Putra,"11-Sep-26, 19:43",0:04:49,0:00:24,Instagram,Apart Kampus,"Minat info, sales FU 1x, belum ada respon cust",❌,[Ended by sales at 13-Sep-26 10:17 WIB]
69,"11-Sep-26, 19:34",E,82289427392,Strangers,Junk,Ira Rosdiana,"11-Sep-26, 19:35",0:01:00,0:01:00,Instagram,SOHO Signature,"Kirim spam DP motor, tidak relevan",,[Ended by sales at 11-Sep-26 19:39 WIB]
70,"11-Sep-26, 18:48",Andrie Riomalen,82319592880,First Contact,Cold,Fitriyani Dewi,"11-Sep-26, 18:51",0:03:00,0:00:55,Google,Website,"Minta pricelist dari Google, sales FU 4x, belum ada respon cust",✅,
71,"11-Sep-26, 18:01",Eko Eks Sungai Penuh,81287533143,Follow Up,Warm,Kadek Bayu Permana Putra,"11-Sep-26, 18:06",0:05:34,0:00:48,Google,Website,"Unit AP-A 69,81sqm, tanya harga, dapat 2M cicilan 10jt",✅,
72,"11-Sep-26, 16:50",Sonya Stevana,81219893286,First Contact,Cold,Ira Rosdiana,"11-Sep-26, 16:53",0:02:30,0:00:19,Instagram,SOHO Signature,"Minat SOHO, sales FU 4x, belum ada respon cust",❌,
73,"11-Sep-26, 16:35",elyn,85894088450,Cari Sewa,Junk,Sarah Safira Firdais,"11-Sep-26, 16:35",0:00:25,0:00:24,Google,Website,Mau sewa 2BR utk kuliah,,[Ended by sales at 13-Sep-26 10:22 WIB]
74,"11-Sep-26, 14:53",Yanto LUCAS,81514360191,Strangers,Junk,Kadek Bayu Permana Putra,"11-Sep-26, 15:10",0:17:06,0:00:53,Google,Website,"Cuma nanya nomor telfon resto dimsum, bukan soal properti",,[Ended by sales at 11-Sep-26 15:49 WIB]
75,"11-Sep-26, 14:21",Hari Bowo,87871544509,Follow Up,Warm,Yulia Eunike,"11-Sep-26, 15:25",0:01:42,0:01:42,Instagram,SOHO Signature,"Spesifik tanya unit SHP-H (sold), furniture & unit ready-to-use",✅,
76,"11-Sep-26, 14:05",Sri Mulyaningsih,8111704121,Cari Sewa,Junk,Ira Rosdiana,"11-Sep-26, 14:09",0:04:04,0:01:12,Not Detected,Not Detected,"Mau sewa harian, ditolak (min 1 tahun), 'belum mb terimakasih'",,[Ended by sales at 14-Sep-26 17:06 WIB]
77,"11-Sep-26, 13:04",😘💕🥰🤎,85893070356,First Contact,Cold,Sarah Safira Firdais,"11-Sep-26, 13:05",0:00:14,0:00:14,Instagram,SOHO Signature,"Minat SOHO (kirim 2x), sales FU 1x, belum ada respon cust",❌,[Ended by sales at 13-Sep-26 10:21 WIB]
78,"11-Sep-26, 10:55",fiorentinaskr,88291015538,First Contact,Cold,Kadek Bayu Permana Putra,"11-Sep-26, 11:04",0:08:47,0:01:28,Instagram,Apart Kampus,"Minat info, sales FU 3x, belum ada respon cust",❌,
79,"11-Sep-26, 10:11",Sylvia Agustina,8159138446,Follow Up,Warm,Fitriyani Dewi,"11-Sep-26, 10:11",0:00:20,0:00:20,Google,Website,"Invest aja', dapat harga hunian 2,2M / office 2,8M & brosur",✅,
80,"11-Sep-26, 7:48",Val,82140630156,Follow Up,Warm,Sarah Safira Firdais,"11-Sep-26, 8:00",0:11:32,0:00:20,Instagram,SOHO Signature,"Valentina: tanya start price & minta katalog, dapat harga 2-10M",✅,
81,"11-Sep-26, 6:57",.,87889509458,Follow Up,Warm,Sarah Safira Firdais,"11-Sep-26, 6:59",3:03:13,0:00:00,Google,Website,"Evan: tanya tipe (1BR), minta brosur, diskusi tinggal/invest",✅,
82,"10-Sep-26, 23:03",Remina_Papua_Jayapura,8215095064,First Contact,Cold,Kadek Bayu Permana Putra,"10-Sep-26, 23:03",0:00:25,0:00:25,Instagram,Apart Kampus,"Minat info, sales FU 3x, belum ada respon cust",❌,
83,"10-Sep-26, 16:38",𝒱𝒶𝒶,82199546134,First Contact,Cold,Ditto Zulfikar Junaedi,"10-Sep-26, 16:41",0:02:54,0:00:16,Instagram,Apart Kampus,"Minat info, sales FU 2x, belum ada respon cust",❌,
84,"10-Sep-26, 14:37",AffitrianyR,81323910616,First Contact,Cold,Ira Rosdiana,"10-Sep-26, 14:40",0:03:08,0:00:22,Instagram,SOHO Signature,"Minat SOHO, sales FU 2x, belum ada respon cust",❌,
85,"10-Sep-26, 14:08",Kevin 🇮🇩,81541277051,First Contact,Cold,Sarah Safira Firdais,"10-Sep-26, 14:10",0:01:25,0:01:25,Instagram,SOHO Signature,"Minat SOHO, sales FU 1x (sempat gagal kirim), belum ada respon cust",❌,
86,"10-Sep-26, 12:54",Eric Irawan,8128566308,First Contact,Cold,Fitriyani Dewi,"10-Sep-26, 12:54",0:00:14,0:00:14,Google,Website,"Minta brosur SOHO dari Google, sales FU 1x, belum ada respon cust",✅,
87,"10-Sep-26, 11:55",SIM2,82211037926,Follow Up,Warm,Sarah Safira Firdais,"10-Sep-26, 11:56",0:00:32,0:00:31,Instagram,SOHO Signature,"Pak Halim, tanya kapasitas, ukuran, harga (2-10M) & layout SOHO",✅,[Ended by sales at 12-Sep-26 10:44 WIB]
88,"10-Sep-26, 10:41",Yus,82115590154,Follow Up,Warm,Kadek Bayu Permana Putra,"10-Sep-26, 10:43",0:01:39,0:01:39,Instagram,SOHO Signature,"SOHO 4 karyawan, dikirim layout, masih collect data blm survey",✅,[Ended by sales at 13-Sep-26 10:09 WIB]
89,"10-Sep-26, 10:40",Chen,81991999059,Follow Up,Cold,Ditto Zulfikar Junaedi,"10-Sep-26, 10:45",0:00:27,0:00:27,Instagram,SOHO Signature,"Awalnya bilang harga 'mahal', lalu berulang kali tanya harga sewa (studio, 1BR)",✅,[Ended by sales at 10-Sep-26 15:49 WIB]
90,"10-Sep-26, 9:25",Zaed,818712456,Follow Up,Warm,Yulia Eunike,"10-Sep-26, 9:32",0:07:21,0:00:18,Instagram,SOHO Signature,"Tanya proses KPA/cicilan developer, ruang usaha 3 karyawan, dapat promo PPN DTP 220jt",✅,
91,"10-Sep-26, 9:09",Deriandra Shifani Latifa,81221685575,Cari Sewa,Junk,Ditto Zulfikar Junaedi,"10-Sep-26, 9:10",0:00:49,0:00:49,Google,Website,"Cari sewa apartemen full furnish 2 kamar, diarahkan ke info pembelian saja",,[Ended by sales at 12-Sep-26 14:11 WIB]
92,"10-Sep-26, 6:50",Ariel W,811224844,Follow Up,Warm,Yulia Eunike,"10-Sep-26, 6:53",0:03:17,0:00:31,Instagram,SOHO Signature,"Minat Loft Living & Apartment, tanya ready stok, dikirim brosur",✅,
93,"10-Sep-26, 6:44",F,8118799689,First Contact,Cold,Fitriyani Dewi,"10-Sep-26, 6:47",0:03:18,0:00:48,Instagram,Apart & WLB,"Minat apartemen, sales FU 2x, belum ada respon cust",✅,
94,"09-Sep-26, 20:32",yanto,85893013118,Strangers,Junk,Kadek Bayu Permana Putra,"09-Sep-26, 20:32",0:00:00,0:00:00,Instagram,SOHO Signature,Chat tidak jelas,,[Ended by sales at 09-Sep-26 21:49 WIB]
95,"09-Sep-26, 17:40",a,85710715941,Strangers,Junk,Kadek Bayu Permana Putra,"09-Sep-26, 17:40",0:00:00,0:00:00,Instagram,Apart & WLB,"Chat 'Gada' doang, belum ada respon sales",,[Ended by sales at 09-Sep-26 18:01 WIB]
96,"09-Sep-26, 14:34",Bashar Wannous,85212106558,Cari Sewa,Junk,Kadek Bayu Permana Putra,"09-Sep-26, 14:35",0:00:22,0:00:22,Not Detected,Not Detected,"Cari studio utk disewa, diarahkan ke IG rental",,[Ended by sales at 09-Sep-26 14:43 WIB]
97,"09-Sep-26, 13:53",Dayang Melati - Dynamic,81196911531,First Contact,Cold,Ditto Zulfikar Junaedi,"09-Sep-26, 13:56",0:02:58,0:00:30,Instagram,Apart & WLB,"Minat apartemen, sales FU 2x, belum ada respon cust",❌,
98,"09-Sep-26, 13:43",Yessycharlotte,8176976038,Cari Sewa,Junk,Ira Rosdiana,"09-Sep-26, 13:46",0:02:31,0:00:24,Instagram,Loft Living View,Tanya apakah bisa sewa unit,,
99,"09-Sep-26, 8:52",Gema Ilham,81524661111,Follow Up,Warm,Ditto Zulfikar Junaedi,"09-Sep-26, 8:52",0:07:37,0:00:24,Instagram,Loft Living View,"Minat Loft Living 3+1 kamar (169sqm, 5,9M, sisa 2 unit), tanya pet policy & minta PL",✅,
100,"09-Sep-26, 6:09",Contact 2104,85704135213,Follow Up,Warm,Kadek Bayu Permana Putra,"09-Sep-26, 7:26",1:17:05,0:00:28,Instagram,Apart & WLB,"Minat apartemen, langsung sebut '2BR' sebelum sales balas",✅,[Ended by sales at 13-Sep-26 10:14 WIB]
101,"08-Sep-26, 23:46",Wanda,8118499513,First Contact,Cold,Ira Rosdiana,"08-Sep-26, 23:49",0:03:05,0:00:23,Instagram,Apart & WLB,"Minat apartemen, sales FU 3x, belum ada respon cust",❌,[Ended by sales at 10-Jul-26 12:02 WIB]
102,"08-Sep-26, 21:29",RM Meiza,87885611878,First Contact,Cold,Kadek Bayu Permana Putra,"08-Sep-26, 21:39",0:09:34,0:00:27,Instagram,Apart & WLB,"Minat apartemen, sales FU 3x, belum ada respon cust",❌,[Ended by sales at 14-Sep-26 11:36 WIB]
103,"08-Sep-26, 20:23",Arin Ramadhanty Alfaizah,83854531460,First Contact,Cold,Kadek Bayu Permana Putra,"08-Sep-26, 20:32",0:09:33,0:00:19,Instagram,Apart Kampus,"Minat info, sales FU 3x, belum ada respon cust",❌,[Ended by sales at 14-Sep-26 11:30 WIB]
104,"08-Sep-26, 20:03",bandarr,89699273489,First Contact,Cold,Kadek Bayu Permana Putra,"08-Sep-26, 20:12",0:09:17,0:00:28,Instagram,Apart Kampus,"Minat info, sales FU 3x, belum ada respon cust",❌,[Ended by sales at 13-Sep-26 10:16 WIB]
105,"08-Sep-26, 17:37",tmyyjfri,83177566408,Follow Up,Cold,Ditto Zulfikar Junaedi,"08-Sep-26, 17:43",0:05:19,0:00:25,Instagram,Loft Living View,"Kirim voice note 2x, minat Loft Living",✅,[Ended by sales at 08-Sep-26 17:50 WIB]
106,"08-Sep-26, 17:35",Surya,87761527160,First Contact,Cold,Ditto Zulfikar Junaedi,"08-Sep-26, 17:37",0:02:25,0:00:12,Instagram,Apart Kampus,"Minat info, sales FU 4x, belum ada respon cust",❌,
107,"08-Sep-26, 17:23",.,88973618502,Strangers,Junk,Kadek Bayu Permana Putra,"08-Sep-26, 17:23",0:03:38,0:01:31,Instagram,Apart Kampus,"Kirim foto random, belum ada respon sales sama sekali",,[Ended by sales at 08-Sep-26 17:55 WIB]
108,"08-Sep-26, 16:04",laila,81932356281,First Contact,Cold,Fitriyani Dewi,"08-Sep-26, 16:14",0:09:27,0:00:26,Instagram,Apart Kampus,"Minat info, sales FU 5x, belum ada respon cust",✅,
109,"08-Sep-26, 11:36",Linda Ang,81515008838,Buyer,Junk,Ditto Zulfikar Junaedi,"08-Sep-26, 11:36",0:00:00,0:00:00,Not Detected,Not Detected,"Sudah beli unit, minta kontak admin utk BAST (serah terima)",,[Ended by sales at 08-Sep-26 11:50 WIB]
110,"08-Sep-26, 11:30",Cryogas,82111347777,Follow Up,Warm,Ira Rosdiana,"08-Sep-26, 11:37",0:00:22,0:00:22,Not Detected,Not Detected,"Rey: tanya harga SOHO 2,4M, cicilan KPA 15th DP10%, IPL - masih planning",✅,
111,"08-Sep-26, 10:24",nadine,82282892469,Follow Up,Warm,Fitriyani Dewi,"08-Sep-26, 10:25",0:00:32,0:00:31,Instagram,Apart Kampus,"Broadcast: tanya harga 2BR & availability Loft Living, aktif nanya",✅,
112,"07-Sep-26, 20:31",~,87780020930,First Contact,Cold,Kadek Bayu Permana Putra,"07-Sep-26, 20:58",0:27:16,0:00:22,Instagram,Apart Kampus,"Tanya info, sales FU 1x, belum ada respon cust",❌,[Ended by sales at 11-Sep-26 19:24 WIB]
113,"07-Sep-26, 19:00",Allll,81220711365,First Contact,Cold,Kadek Bayu Permana Putra,"07-Sep-26, 19:00",0:00:38,0:00:38,Instagram,Apart & WLB,"Minat apartemen, sales FU 1x, belum ada respon cust",❌,[Ended by sales at 11-Sep-26 15:04 WIB]
114,"07-Sep-26, 18:18",secret~~~,895389050102,First Contact,Cold,Ditto Zulfikar Junaedi,"07-Sep-26, 18:28",0:09:35,0:00:12,Instagram,Apart Kampus,"Tanya info, sales FU 1x, belum ada respon cust",❌,
115,"07-Sep-26, 18:00",liaa¹³,81383380613,First Contact,Cold,Fitriyani Dewi,"07-Sep-26, 18:21",0:21:08,0:00:26,Instagram,SOHO Signature,"Minat SOHO, sales FU 1x, belum ada respon cust",✅,
116,"07-Sep-26, 11:47",dhina,8561937372,Jualan product,Junk,Kadek Bayu Permana Putra,"07-Sep-26, 11:47",0:00:00,0:00:00,Not Detected,Not Detected,"Vendor tawarkan interior moss wall ke sales, bukan leads properti",,[Ended by sales at 07-Sep-26 12:00 WIB]
117,"07-Sep-26, 11:40",Sonny,81310202040,Follow Up,Cold,Ditto Zulfikar Junaedi,"07-Sep-26, 15:18",0:04:59,0:00:11,Instagram,Loft Living View,"Broadcast, cust balas 'Ya', dapat info Loft Living, belum lanjut detail",✅,
118,"07-Sep-26, 10:08",Ady,8114199923,Follow Up,Warm,Fitriyani Dewi,"07-Sep-26, 11:01",0:06:58,0:00:21,Instagram,SOHO Signature,"Broadcast: butuh SOHO 15-20 karyawan, rekomendasi unit SHS-M 144sqm 4,8M, tanya pricelist",✅,
119,"07-Sep-26, 9:39",Pratama,85878733881,First Contact,Cold,Yulia Eunike,"07-Sep-26, 15:34",0:03:53,0:01:46,Instagram,Loft Living View,"Broadcast dari sales, belum ada respon cust sama sekali",❌,
120,"07-Sep-26, 9:19",Akif Azmi,82111157782,First Contact,Cold,Fitriyani Dewi,"07-Sep-26, 9:27",0:07:26,0:00:15,Instagram,Loft Living View,"Minat Loft Living, sales FU 4x, belum ada respon cust",✅,
121,"07-Sep-26, 7:17",RP,8118889790,Follow Up,Cold,Yulia Eunike,"07-Sep-26, 7:52",0:34:16,0:00:31,Instagram,SOHO Signature,"Broadcast dari sales (Nike), belum ada respon cust sama sekali",✅,
122,"07-Sep-26, 7:16",Yona,81910170929,First Contact,Cold,Fitriyani Dewi,"07-Sep-26, 7:35",0:18:31,0:00:29,Instagram,SOHO Signature,"Tanya info, sales FU 3x (sempat glitch kirim ganda), belum ada respon cust",✅,
123,"07-Sep-26, 7:05",Benedictus Egan,82124204244,First Contact,Cold,Fitriyani Dewi,"07-Sep-26, 7:21",0:16:20,0:00:28,Instagram,SOHO Signature,"Minat SOHO, sales FU 3x, belum ada respon cust",✅,
124,"07-Sep-26, 1:54",daviiia,881012404435,Follow Up,Cold,Kadek Bayu Permana Putra,"07-Sep-26, 1:57",0:02:49,0:00:25,Instagram,Loft Living View,"Minat Loft Living, cust tanya lokasi 'bsd mn', dijawab dekat AEON Mall",✅,[Ended by sales at 10-Sep-26 14:25 WIB]
125,"07-Sep-26, 0:14",🍉🍉🍑,85771622602,First Contact,Cold,Ditto Zulfikar Junaedi,"07-Sep-26, 0:23",0:09:21,0:00:08,Instagram,SOHO Signature,"Minat SOHO, sales FU 3x, belum ada respon cust",❌,
126,"07-Sep-26, 0:05",Ahmed Yousef Saeed Khalifa,81210020646,Cari Sewa,Junk,Kadek Bayu Permana Putra,"07-Sep-26, 0:15",0:09:55,0:00:52,Instagram,Loft Living View,"Tanya 'is it for rent?', diarahkan ke IG rental (@lifeatupperwest)",,[Ended by sales at 07-Sep-26 00:20 WIB]
127,"06-Sep-26, 21:46",Ridha Setya Lestari,81932854787,First Contact,Cold,Kadek Bayu Permana Putra,"06-Sep-26, 22:18",0:32:05,0:00:32,Instagram,Loft Living View,"Minat Loft Living, sales FU 1x, belum ada respon cust",✅,
128,"06-Sep-26, 21:22",Ailina Huang,DM Instagram,Strangers,Junk,Yulia Eunike,"06-Sep-26, 21:28",0:06:00,0:06:00,Instagram,DM Instagram,"Kirim video random tanpa teks/konteks, tanpa nomor telfon",,
129,"06-Sep-26, 21:01",dindoy,82174432366,First Contact,Cold,Kadek Bayu Permana Putra,"06-Sep-26, 21:07",0:06:33,0:01:51,Instagram,Apart Kampus,"Tanya info, sales FU 1x, belum ada respon cust",❌,[Ended by sales at 13-Sep-26 10:16 WIB]
130,"06-Sep-26, 20:48",Yanti Dimaja,82156736254,Follow Up,Warm,Regina Junita,"06-Sep-26, 20:57",0:09:51,0:00:27,Instagram,Apart Kampus,"Tanya harga 2BR (start 2M), ditanya upgrade/investasi",✅,
131,"06-Sep-26, 20:41",Welly,87878363422,Follow Up,Visited,Kadek Bayu Permana Putra,"06-Sep-26, 20:53",0:12:32,0:01:15,Instagram,SOHO Signature,"Minta pricelist SOHO, aktif mau lihat-lihat",✅,[Ended by sales at 10-Sep-26 14:23 WIB]
132,"06-Sep-26, 20:23",akselken,8981231032,First Contact,Cold,Kadek Bayu Permana Putra,"06-Sep-26, 20:30",0:07:02,0:00:21,Instagram,SOHO Signature,"Minat SOHO, sales FU 1x, belum ada respon cust",❌,[Ended by sales at 13-Sep-26 10:14 WIB]
133,"06-Sep-26, 20:12",RALLZZ😝🤪,82363093686,Strangers,Junk,Kadek Bayu Permana Putra,"06-Sep-26, 20:12",0:00:00,0:00:00,Not Detected,Not Detected,"Chat 'p' doang, belum ada respon sales",,"[Ended by sales at 06-Sep-26 21:18 WIB, tanpa respon]"
134,"06-Sep-26, 19:56",Sulthon,895365140963,Follow Up,Cold,Kadek Bayu Permana Putra,"06-Sep-26, 19:57",0:00:31,0:00:31,Instagram,Loft Living View,"Cust balas lalu ngaku 'kepencet', tidak minat",✅,[Ended by sales at 07-Sep-26 11:10 WIB]
135,"06-Sep-26, 19:50",.,85882476730,First Contact,Cold,Regina Junita,"06-Sep-26, 19:50",0:00:20,0:00:20,Instagram,SOHO Signature,"Minat SOHO, sales FU 2x, belum ada respon cust",❌,
136,"06-Sep-26, 17:48",Luqman,81396500200,Follow Up,Warm,Ira Rosdiana,"06-Sep-26, 17:58",0:00:24,0:00:24,Instagram,SOHO Signature,"Tanya harga 2BR (2M, KPA 13jt), sales ajak ketemu di lokasi",✅,
137,"06-Sep-26, 17:46",noname,89689504520,Follow Up,Warm,Ditto Zulfikar Junaedi,"06-Sep-26, 20:29",0:04:56,0:00:15,Instagram,Apart & WLB,"Aktif tanya harga apartemen (2,2M) & loft living (2,4M)",✅,
138,"06-Sep-26, 17:13",🅰️,83187547303,Follow Up,Prospect,Ditto Zulfikar Junaedi,"06-Sep-26, 17:29",0:00:13,0:00:13,Instagram,Loft Living View,Pak Aldi setuju jadwal ketemu di lokasi besok jam 4 sore,✅,[Ended by sales at 09-Sep-26 14:27 WIB]
139,"06-Sep-26, 16:48",VheVhe,82219787878,Follow Up,Cold,Yulia Eunike,"06-Sep-26, 17:23",0:03:52,0:01:06,Instagram,Loft Living View,"Balas minat Apartment, dapat e-brosur, belum lanjut detail",✅,
140,"06-Sep-26, 16:08",Tedd,83897318494,Cari Sewa,Junk,Fitriyani Dewi,"06-Sep-26, 16:10",0:00:27,0:00:27,Google,Website,"Cari hunian buat sewa semalam, tidak tersedia harian",,[Ended by sales at 07-Sep-26 08:19 WIB]
141,"06-Sep-26, 15:29",Yosua,85888815770,Follow Up,Warm,Fitriyani Dewi,"06-Sep-26, 15:27",0:00:17,0:00:17,Instagram,Loft Living View,"Aktif nego 1BR LF-B 76sqm untuk huni, cicilan 12jt/bln",✅,
142,"06-Sep-26, 15:26",bakekok,882006850262,First Contact,Cold,Regina Junita,"06-Sep-26, 15:29",0:02:36,0:00:12,Instagram,SOHO Signature,"Minat SOHO, sales FU 2x, belum ada respon cust",❌,
143,"06-Sep-26, 15:24",em,81517100919,Buyer,Junk,Kadek Bayu Permana Putra,"06-Sep-26, 15:42",0:18:47,0:00:15,Not Detected,Not Detected,"Sudah jadi penghuni (maura), tanya jam operasional gym",,[Ended by sales at 07-Sep-26 12:01 WIB]
144,"06-Sep-26, 15:13",yhes,85319108202,First Contact,Cold,Kadek Bayu Permana Putra,"06-Sep-26, 15:13",0:00:16,0:00:16,Instagram,Loft Living View,"Minat Loft Living, sales FU 1x, belum ada respon cust",❌,[Ended by sales at 13-Sep-26 10:13 WIB]
145,"06-Sep-26, 15:11",mia,83875509493,First Contact,Cold,Regina Junita,"06-Sep-26, 15:12",0:00:15,0:00:15,Instagram,Apart & WLB,"Minat apartemen, sales FU 1x, belum ada respon cust",❌,
146,"06-Sep-26, 14:06",Ginaro,89520249800,Over Budget,Junk,Ditto Zulfikar Junaedi,"06-Sep-26, 14:05",0:05:08,0:00:15,Instagram,Loft Living View,"Tanya sewa & unit di bawah 1M, tidak tersedia",,[Ended by sales at 07-Sep-26 19:07 WIB]
147,"06-Sep-26, 13:29",A,81517011645,Follow Up,Cold,Fitriyani Dewi,"06-Sep-26, 13:29",0:00:20,0:00:20,Instagram,SOHO Signature,"Balas nama 'Abed', tidak lanjut respon",✅,
148,"06-Sep-26, 13:11",BoBì,81273918822,Follow Up,Warm,Kadek Bayu Permana Putra,"06-Sep-26, 13:12",0:00:14,0:00:14,Instagram,Loft Living View,Minat LLF tapi makesure kompor bisa listrik atau ga,✅,[Ended by sales at 08-Sep-26 11:20 WIB]
149,"06-Sep-26, 12:20",m,85759272657,Cari Sewa,Junk,Ira Rosdiana,"06-Sep-26, 12:52",0:12:00,0:00:43,Google,Website,"Awalnya tanya harga, akhirnya tanya sewa tahunan",,
150,"06-Sep-26, 11:17",Sy,81317078441,Cari Sewa,Junk,Regina Junita,"06-Sep-26, 13:07",0:10:06,0:01:11,Google,Website,"Tanya SOHO sewa atau jual, ternyata mau sewa",,[Ended by sales at 07-Sep-26 13:53 WIB]
151,"06-Sep-26, 10:37",J🌻🌿,8986152554,First Contact,Cold,Regina Junita,"06-Sep-26, 10:39",0:02:19,0:00:14,Instagram,Loft Living View,"Minat Loft Living, sales FU 2x, belum ada respon cust",❌,
152,"06-Sep-26, 9:15",Varisha Anindita,81316049080,First Contact,Cold,Fitriyani Dewi,"06-Sep-26, 9:16",0:00:27,0:00:26,Instagram,SOHO Signature,"Minat SOHO, sales FU 5x, belum ada respon cust",✅,
153,"06-Sep-26, 4:41",Bismillah,81112001226,Follow Up,Warm,Ditto Zulfikar Junaedi,"06-Sep-26, 10:23",2:56:15,0:00:59,Instagram,Loft Living View,"Aktif tanya 1BR Loft, dapat harga 2,4M & tanya lokasi",✅,
154,"06-Sep-26, 4:27",rillzy,882019076455,First Contact,Cold,Kadek Bayu Permana Putra,"06-Sep-26, 8:08",3:41:12,0:00:29,Instagram,Apart Kampus,"Minat info, sales FU 1x, belum ada respon cust",❌,[Ended by sales at 13-Sep-26 10:12 WIB]
155,"06-Sep-26, 2:03",gen,8111199672,First Contact,Cold,Yulia Eunike,"06-Sep-26, 7:10",1:23:56,0:00:00,Instagram,Apart Kampus,"Tanya info, sales FU 2x, belum ada respon cust",❌,
156,"06-Sep-26, 0:35",anunkicaumania,85773951194,Follow Up,Cold,Ditto Zulfikar Junaedi,"06-Sep-26, 0:35",3:13:35,0:00:00,Instagram,Loft Living View,"Minat Loft Living (dari Instagram ads), sempat FU sales lalu cust balas 'gajadi deh min'",✅,[Ended by sales at 06-Sep-26 09:29 WIB]
157,"05-Sep-26, 22:26",.,8161474648,Follow Up,Warm,Ditto Zulfikar Junaedi,"05-Sep-26, 22:29",0:02:25,0:00:22,Google,Website,"Ibu Yeye, minta harga & brosur, aktif tanya file (minta via GDrive)",✅,
158,"05-Sep-26, 21:25",Alkes,81188095018,Cari Sewa,Junk,Yulia Eunike,"05-Sep-26, 21:30",0:01:55,0:01:55,Not Detected,Not Detected,"Tanya sewa office & apartemen, diarahkan ke tim sewa (Ibu Mei)",,[Ended by sales at 08-Sep-26 15:46 WIB]
159,"05-Sep-26, 21:24",~Sun,82111890157,First Contact,Cold,Kadek Bayu Permana Putra,"05-Sep-26, 21:29",0:04:42,0:00:24,Instagram,SOHO Signature,"Minat SOHO, sales FU 1x, belum ada respon cust",❌,[Ended by sales at 13-Sep-26 10:12 WIB]
160,"05-Sep-26, 20:46",mll,85148276198,First Contact,Cold,Ditto Zulfikar Junaedi,"05-Sep-26, 20:49",0:02:47,0:00:29,Instagram,SOHO Signature,"Minat SOHO, sales FU 2x, belum ada respon cust",❌,[Ended by sales at 13-Sep-26 19:12 WIB]
161,"05-Sep-26, 19:06",Siti Nurhasanah,85882644504,First Contact,Cold,Kadek Bayu Permana Putra,"05-Sep-26, 19:11",0:05:01,0:00:34,Google,Website,"Minta brosur dari Google, sales FU 1x, belum ada respon cust",❌,[Ended by sales at 13-Sep-26 10:12 WIB]
162,"05-Sep-26, 18:52",Ricko,85777779525,Follow Up,Visited,Ira Rosdiana,"05-Sep-26, 19:03",0:00:30,0:00:30,Instagram,SOHO Signature,"Tanya IPL, virtual office, sewa meeting; setuju jadwal private viewing lusa",✅,
163,"05-Sep-26, 17:13","A,an_Adv indoraya lawfirm",87828870937,Over Budget,Junk,Ditto Zulfikar Junaedi,"05-Sep-26, 19:11",0:00:17,0:00:17,Instagram,SOHO Signature,"Tanya cicilan SOHO (14jt/bln), merasa berat, minta yg 5-6jt/bln",,[Ended by sales at 07-Sep-26 19:09 WIB]
164,"05-Sep-26, 16:55",Santi,81231376088,Follow Up,Cold,Fitriyani Dewi,"05-Sep-26, 16:59",0:03:50,0:01:11,Instagram,Apart Kampus,"Cust balas lalu bilang 'tidak jadi, ternyata jauh'",✅,[Ended by sales at 06-Sep-26 11:21 WIB]
165,"05-Sep-26, 16:47",Rais,81384942325,First Contact,Cold,Regina Junita,"05-Sep-26, 16:54",0:07:19,0:00:14,Instagram,SOHO Signature,"Minat SOHO, sales FU 1x, belum ada respon cust",❌,
166,"05-Sep-26, 16:28",Vendi,8174765893,Follow Up,Visited,Fitriyani Dewi,"05-Sep-26, 16:28",0:00:27,0:00:27,Google,Website,"Dari Google, cust sedang berada di Experience Centre & minta ketemu langsung dengan sales",✅,[Ended by sales at 12-Sep-26 16:37 WIB]
167,"05-Sep-26, 16:10",d,82298709863,First Contact,Cold,Kadek Bayu Permana Putra,"05-Sep-26, 16:21",0:11:40,0:00:16,Instagram,SOHO Signature,"Minat SOHO, sales FU 1x, belum ada respon cust",❌,[Ended by sales at 11-Sep-26 19:14 WIB]
168,"05-Sep-26, 14:44",tanzz suka Spiderman,85719478155,First Contact,Cold,Kadek Bayu Permana Putra,"05-Sep-26, 14:46",0:02:26,0:00:17,Instagram,Loft Living View,"Minat Loft Living, sales FU 1x, belum ada respon cust",❌,[Ended by sales at 11-Sep-26 19:15 WIB]
169,"05-Sep-26, 13:20",Fen,817879900,Follow Up,Prospect,Yulia Eunike,"05-Sep-26, 13:20",0:02:55,0:00:25,Instagram,Apart Kampus,"Nego intensif 1BR vs 2BR utk investasi, minta pricelist, cara bayar, service charge & sinking fund",✅,
170,"05-Sep-26, 12:59",Deidy,89697985670,First Contact,Cold,Ditto Zulfikar Junaedi,"05-Sep-26, 13:03",0:03:03,0:00:16,Instagram,Apart & WLB,"Minat apartemen, sales FU 2x, belum ada respon cust",❌,
171,"05-Sep-26, 10:55",Mutiara Proehoeman,81311509252,First Contact,Cold,Kadek Bayu Permana Putra,"05-Sep-26, 10:56",0:01:24,0:01:24,Instagram,SOHO Signature,"Minat SOHO, sales baru FU 1x, belum ada respon cust",❌,[Ended by sales at 13-Sep-26 10:11 WIB]
172,"05-Sep-26, 9:58",Regina,89632108887,Follow Up,Cold,Regina Junita,"05-Sep-26, 10:07",0:08:47,0:02:03,Instagram,SOHO Signature,"Basa-basi nama sama, belum bahas detail produk",✅,
173,"05-Sep-26, 8:37",🦚,85776254908,First Contact,Cold,Fitriyani Dewi,"05-Sep-26, 8:42",0:04:52,0:00:23,Instagram,Apart Kampus,"Tanya info, sales FU 2x, belum ada respon cust",✅,
174,"04-Sep-26, 20:53",Naufal Ahmad RR,81218160322,Follow Up,Prospect,Yulia Eunike,"04-Sep-26, 20:56",0:03:16,0:01:03,Google,Website,"Cust aktif: mau lihat Loft Living, kasih preferensi kamar; sales tanya jadwal survey",✅,
175,"04-Sep-26, 20:50",Zril,85710903389,First Contact,Cold,Ditto Zulfikar Junaedi,"04-Sep-26, 20:50",0:00:00,0:00:00,Instagram,SOHO Signature,"Minat SOHO, sales FU 5x, belum ada respon cust",❌,[Ended by sales at 07-Sep-26 19:39 WIB]
176,"04-Sep-26, 20:43",awaaa,85693460378,First Contact,Cold,Fitriyani Dewi,"04-Sep-26, 20:43",0:00:18,0:00:18,Instagram,Loft Living View,"Minat Loft Living, sales FU 3x, belum ada respon cust",✅,
177,"04-Sep-26, 18:11",nawraa,81268508310,First Contact,Cold,Ditto Zulfikar Junaedi,"04-Sep-26, 18:14",0:02:40,0:00:10,Instagram,SOHO Signature,"Minat SOHO, sales FU 6x, belum ada respon cust",❌,
178,"04-Sep-26, 18:07",Bagus Adrianto,85697969439,Cari Sewa,Junk,Kadek Bayu Permana Putra,"04-Sep-26, 18:07",0:00:00,0:00:00,Not Detected,Not Detected,"Production house tanya sewa office utk shooting, bukan minat beli",,[Ended by sales at 04-Sep-26 18:35 WIB]
179,"04-Sep-26, 17:39",DW,817888647,Follow Up,Warm,Ira Rosdiana,"04-Sep-26, 17:39",0:00:24,0:00:24,Instagram,Loft Living View,"Aktif tanya tipe (1BR/studio), harga 2.3M, size, cukup detail",✅,
180,"04-Sep-26, 14:42",Margo,81387680361,First Contact,Cold,Ira Rosdiana,"04-Sep-26, 14:42",0:00:21,0:00:21,Google,Website,"Minta pricelist Loft Living, sales jawab harga & tipe, belum ada respon lanjut",❌,[Ended by sales at 13-Sep-26 13:00 WIB]
181,"04-Sep-26, 14:21",Clara Regina,81212222096,Follow Up,Cold,Ditto Zulfikar Junaedi,"04-Sep-26, 14:21",0:00:26,0:00:26,Google,Website,"Balas nama 'Clara', tidak lanjut respon setelah ditanya kebutuhan",✅,
182,"04-Sep-26, 11:35",VL,81519801995,Cari Sewa,Junk,Fitriyani Dewi,"04-Sep-26, 11:36",0:00:31,0:00:31,Google,Website,"Dari Google, eksplisit cari SEWA SOHO per tahun, bukan beli",,[Ended by sales at 05-Sep-26 10:08 WIB]
183,"04-Sep-26, 11:09",za,881024183584,First Contact,Cold,Kadek Bayu Permana Putra,"04-Sep-26, 11:10",0:01:00,0:01:00,Instagram,Apart & WLB,"Minat apartemen, sales FU 2x, belum ada respon cust",❌,[Ended by sales at 10-Sep-26 20:41 WIB]
184,"04-Sep-26, 10:34",Abdul Barkah,87733754130,First Contact,Cold,Ditto Zulfikar Junaedi,"04-Sep-26, 10:37",0:02:47,0:00:19,Instagram,Apart Kampus,"Tanya info, sales FU 3x, belum ada respon cust",❌,
185,"04-Sep-26, 10:03",aaron,89510205665,First Contact,Cold,Kadek Bayu Permana Putra,"04-Sep-26, 10:08",0:05:02,0:00:22,Instagram,Loft Living View,"Minat Loft Living, sales FU 2x, belum ada respon cust",❌,[Ended by sales at 13-Sep-26 10:11 WIB]
186,"04-Sep-26, 9:55",Aliska,82114187262,First Contact,Cold,Ira Rosdiana,"04-Sep-26, 9:55",0:00:35,0:00:34,Instagram,Loft Living View,"Minat Loft Living, sales FU 4x, belum ada respon cust",❌,
187,"04-Sep-26, 9:34",Alif,85811082706,Strangers,Junk,Ditto Zulfikar Junaedi,"04-Sep-26, 9:34",0:00:15,0:00:15,Instagram,Loft Living View,Chat tidak jelas,,[Ended by sales at 05-Sep-26 15:47 WIB]
188,"04-Sep-26, 9:13",Adrian Johan Turangan,811919988,Follow Up,Visited,Fitriyani Dewi,"04-Sep-26, 9:13",0:00:25,0:00:25,Google,Website,"Diskusi harga SOHO detail (4,8M/144sqm & 10,6M/304sqm), lokasi, fasilitas - lalu VISITED langsung ke Marketing Gallery",✅,[Ended by sales at 13-Sep-26 12:52 WIB]
189,"04-Sep-26, 9:02",Arya,87877182007,First Contact,Cold,Kadek Bayu Permana Putra,"04-Sep-26, 9:06",0:03:49,0:01:01,Instagram,SOHO Signature,"Minat SOHO, sales FU 2x, belum ada respon cust",❌,[Ended by sales at 13-Sep-26 10:10 WIB]
190,"04-Sep-26, 7:08",OK,811926805,Follow Up,Prospect,Fitriyani Dewi,"04-Sep-26, 7:27",0:18:13,0:00:25,Instagram,SOHO Signature,"Cust (Bapak Bowo) aktif: 20 karyawan, butuh 155sqm, bidang kesehatan, lokasi Pondok Pinang; sales undang visit Sabtu jam 1",✅,
191,"04-Sep-26, 6:48",EKA 🇯6,818800006,First Contact,Cold,Yulia Eunike,"04-Sep-26, 6:48",0:00:21,0:00:21,Instagram,Apart & WLB,"Chat 'Hi Admin,' tanpa isi, sales FU 6x, belum ada respon cust",❌,
192,"04-Sep-26, 6:35",(-_-),85781380524,First Contact,Cold,Ditto Zulfikar Junaedi,"04-Sep-26, 7:15",0:40:35,0:00:13,Instagram,Loft Living View,"Minat Loft Living, sales FU 4x, belum ada respon cust",✅,
193,"03-Sep-26, 18:20",salsafira larasati,85778861734,First Contact,Cold,Ditto Zulfikar Junaedi,"03-Sep-26, 18:44",0:23:10,0:00:12,Instagram,Loft Living View,"Minat Loft Living, sales FU 7x, belum ada respon cust",❌,
194,"03-Sep-26, 17:27",Anam,85876016745,First Contact,Cold,Ira Rosdiana,"03-Sep-26, 17:27",0:00:15,0:00:15,Instagram,Apart Kampus,"Tanya info, sales FU 4x, belum ada respon cust",❌,
195,"03-Sep-26, 16:49",Evelyn,85210059400,Follow Up,Cold,Ditto Zulfikar Junaedi,"03-Sep-26, 16:49",0:00:10,0:00:10,Instagram,Loft Living View,"Minat Loft Living, cust tanya lokasi, masih basic",✅,[Ended by sales at 12-Sep-26 14:47 WIB]
196,"03-Sep-26, 16:48",~idoo,85975459118,First Contact,Cold,Fitriyani Dewi,"03-Sep-26, 16:49",0:00:23,0:00:23,Instagram,Apart Kampus,"Tanya info, sales FU 7x, belum ada respon cust",✅,
197,"03-Sep-26, 14:58",iqbal,85718447018,Follow Up,Cold,Kadek Bayu Permana Putra,"03-Sep-26, 15:01",0:02:56,0:00:15,Instagram,Apart Kampus,"Balas nama 'Iqbal', tidak lanjut respon setelah ditanya huni/invest",✅,[Ended by sales at 13-Sep-26 10:08 WIB]
198,"03-Sep-26, 14:54",....,85894711509,Cari Sewa,Junk,Kadek Bayu Permana Putra,"03-Sep-26, 15:13",0:18:48,0:00:42,Google,Website,"Arif (Learnext) mau sewa meeting room per jam, bukan minat beli unit",,[Ended by sales at 04-Sep-26 09:07 WIB]
199,"03-Sep-26, 14:16",bim,83142399291,First Contact,Cold,Fitriyani Dewi,"03-Sep-26, 14:16",0:00:35,0:00:35,Instagram,Apart Kampus,"Tanya info, sales FU 10x, belum ada respon cust",✅,[Ended by sales at 09-Sep-26 16:07 WIB]
200,"03-Sep-26, 13:53",AdniL,81213670791,First Contact,Cold,Kadek Bayu Permana Putra,"03-Sep-26, 14:00",0:07:08,0:00:22,Google,Website,"Minta pricelist (dari Google Ads), sales FU 3x, belum ada respon cust",❌,[Ended by sales at 09-Sep-26 14:32 WIB]
201,"03-Sep-26, 13:46",~,89662566862,First Contact,Cold,Ditto Zulfikar Junaedi,"03-Sep-26, 13:49",0:02:57,0:00:49,Instagram,Apart Kampus,"Tanya info, sales FU 9x (brosur & video), belum ada respon cust",✅,[Ended by sales at 14-Sep-26 16:24 WIB]
202,"03-Sep-26, 13:34",Komdko,83892375416,First Contact,Cold,Kadek Bayu Permana Putra,"03-Sep-26, 13:43",0:09:26,0:00:21,Instagram,Apart Kampus,"Tanya info, sales FU 3x, belum ada respon cust",❌,[Ended by sales at 09-Sep-26 14:32 WIB]
203,"03-Sep-26, 10:01",olifaaa oliff,85881802553,First Contact,Cold,Fitriyani Dewi,"03-Sep-26, 10:01",0:00:36,0:00:36,Instagram,Apart Kampus,"Tanya info, sales FU 7x, belum ada respon cust",✅,
204,"03-Sep-26, 9:35",Ara,85695322641,Strangers,Junk,Kadek Bayu Permana Putra,"03-Sep-26, 9:35",0:00:00,0:00:00,Not Detected,Not Detected,"Tanya swimming pool terbuka utk umum & harganya, belum ada respon sales",,[Ended by sales at 03-Sep-26 09:45 WIB]
205,"03-Sep-26, 9:33",dito,85781044163,Follow Up,Cold,Fitriyani Dewi,"03-Sep-26, 9:34",0:00:28,0:00:27,Instagram,Apart Kampus,Aktif chat tapi cust bilang 'hanya lihat-lihat' & 'belum ada niatan' beli,✅,[Ended by sales at 12-Sep-26 11:23 WIB]
206,"03-Sep-26, 7:49",Capt. Chris,81213777529,Follow Up,Warm,Fitriyani Dewi,"03-Sep-26, 7:53",0:03:59,0:00:00,Google,Website,Balas 2x: tanya unit studio & harga; sales masih proses jawab,✅,
207,"03-Sep-26, 6:08",pnde,85692376126,First Contact,Cold,Kadek Bayu Permana Putra,"03-Sep-26, 8:04",1:55:50,0:00:48,Instagram,Apart Kampus,"Tanya info, sales baru FU 1x, belum ada respon cust",❌,[Ended by sales at 09-Sep-26 14:32 WIB]
208,"03-Sep-26, 6:05",z,83854512767,First Contact,Cold,Kadek Bayu Permana Putra,"03-Sep-26, 7:46",1:40:40,0:01:19,Instagram,Apart Kampus,"Tanya info, sales baru FU 1x, belum ada respon cust",❌,[Ended by sales at 10-Sep-26 20:41 WIB]
209,"03-Sep-26, 5:19",Hudri,81617435195,First Contact,Cold,Fitriyani Dewi,"03-Sep-26, 6:23",1:03:54,0:01:04,Instagram,Apart Kampus,"Tanya info, sales baru FU 1x, belum ada respon cust",✅,[Ended by sales at 10-Sep-26 09:09 WIB]
210,"03-Sep-26, 4:56",Aca,81572011344,Strangers,Junk,Ditto Zulfikar Junaedi,"03-Sep-26, 4:56",0:00:00,0:00:00,Not Detected,Not Detected,"Tanya fasilitas gym/renang & PL, belum ada respon dari sales",,[Ended by sales at 03-Sep-26 08:13 WIB]
211,"02-Sep-26, 21:58",isaac,85718930594,First Contact,Cold,Regina Junita,"02-Sep-26, 22:07",0:09:30,0:00:31,Instagram,Apart & WLB,"Minat apartemen, sales FU 2x, belum ada respon cust",❌,
212,"02-Sep-26, 20:08",Wahyu,81804301782,First Contact,Cold,Ira Rosdiana,"02-Sep-26, 20:08",0:00:21,0:00:21,Instagram,Apart Kampus,"Tanya info, sales FU 3x, belum ada respon cust",❌,
213,"02-Sep-26, 20:07",Apid,85778089834,First Contact,Cold,Kadek Bayu Permana Putra,"02-Sep-26, 20:17",0:09:18,0:00:19,Instagram,Apart Kampus,"Tanya info, sales FU 5x, belum ada respon cust",❌,[Ended by sales at 09-Sep-26 14:32 WIB]
214,"02-Sep-26, 18:56",rehanabdiw,85381084349,First Contact,Cold,Kadek Bayu Permana Putra,"02-Sep-26, 18:56",0:00:22,0:00:22,Instagram,Apart Kampus,"Tanya info, sales FU 4x, belum ada respon cust",❌,[Ended by sales at 10-Sep-26 14:29 WIB]
215,"02-Sep-26, 18:40",rapli,85714553525,First Contact,Cold,Regina Junita,"02-Sep-26, 18:45",0:05:07,0:00:18,Instagram,Apart & WLB,"Minat apartemen, sales FU 2x, belum ada respon cust",❌,
216,"02-Sep-26, 18:37",Axel,89679152641,First Contact,Cold,Ira Rosdiana,"02-Sep-26, 18:37",0:00:21,0:00:21,Instagram,Loft Living View,"Minat Loft Living, sales FU intensif 4x, belum ada respon cust",❌,
217,"02-Sep-26, 18:36",Ghibran sH,85110511160,Cari Sewa,Junk,Ditto Zulfikar Junaedi,"02-Sep-26, 18:36",0:00:41,0:00:41,Google,Website,Cust tanya lokasi lalu bilang 'saya mau sewa kak untuk 1 tahun',❌,[Ended by sales at 12-Sep-26 14:11 WIB]
218,"02-Sep-26, 15:09",Haris N Toro,87771110666,Jualan product,Junk,Kadek Bayu Permana Putra,"02-Sep-26, 15:09",0:00:00,0:00:00,Not Detected,Not Detected,"Vendor Balifiber tawarkan jasa internet ke sales, bukan leads properti",,[Ended by sales at 02-Sep-26 15:23 WIB]
219,"02-Sep-26, 14:38",Succesfull,87711010707,Follow Up,Visited,Regina Junita,"02-Sep-26, 14:41",0:03:06,0:00:14,Instagram,Apart & WLB,"Cust (Ernest) benar-benar visit ke lokasi, ketemu di Lobby North/depan Strada Coffee dgn sales",✅,
220,"02-Sep-26, 14:06",6,85899022258,Follow Up,Prospect,Yulia Eunike,"02-Sep-26, 14:07",0:01:51,0:01:50,Instagram,Apart Kampus,"Cust bilang 'soalnya aku mau survei', minta diarahkan datang ke lokasi",❌,
221,"02-Sep-26, 13:18",Bhaskara,81286131921,Follow Up,Prospect,Ira Rosdiana,"02-Sep-26, 13:18",0:00:34,0:00:34,Not Detected,Not Detected,"Tanya harga(2.4M),cicilan,diskon; sales tawarkan jadwal private viewing",✅,
222,"02-Sep-26, 12:40",....,89675617704,First Contact,Cold,Ditto Zulfikar Junaedi,"02-Sep-26, 12:40",0:00:20,0:00:20,Instagram,Apart & WLB,Masih terus di-follow up sales sampai FU ke-7,❌,
223,"02-Sep-26, 12:01",Lusiana,81319081000,Follow Up,Warm,Kadek Bayu Permana Putra,"02-Sep-26, 12:01",0:00:16,0:00:16,Instagram,Apart Kampus,"Tanya harga (2M/2BR, 4M/3BR loft) & tipe kamar, aktif diskusi",✅,[Ended by sales at 09-Sep-26 14:31 WIB]
224,"02-Sep-26, 9:15",william,88293103400,First Contact,Cold,Regina Junita,"02-Sep-26, 9:24",0:09:22,0:00:32,Instagram,Apart & WLB,"Minat apartemen, sales FU 5x, belum ada respon cust",❌,
225,"02-Sep-26, 8:25",Jcfeen,DM instagram,Follow Up,Warm,Kadek Bayu Permana Putra,"02-Sep-26, 8:56",0:27:38,0:30:52,Not Detected,Not Detected,"Tanya PL, IPL (33rb), size 112sqm & budget; masih tanya-tanya lanjut",✅,
226,"02-Sep-26, 7:33",🤏,6287887804672,Strangers,Junk,Kadek Bayu Permana Putra,"02-Sep-26, 7:33",1:34:50,0:00:23,instagram,Apart Kampus,"Cust balas 'cipto', lalu bilang 'ga' & 'kepencet' (salah pencet, tidak minat)",,[Ended by sales at 02-Sep-26 14:51 WIB]
227,"02-Sep-26, 6:50",Yudia/Dd,62818812266,Over buget,Junk,Fitriyani Dewi,"02-Sep-26, 8:14",1:23:49,0:00:20,instagram,Apart & WLB,Over Budget,,[Ended by sales at 03-Sep-26 13:23 WIB]
228,"02-Sep-26, 6:07",Teddy,6281317976617,Follow Up,Warm,Regina Junita,"02-Sep-26, 7:00",0:52:48,0:00:56,instagram,SOHO Signature,"Tanya harga (start 2M) & luas SOHO (69-80/76sqm), aktif diskusi",✅,
229,"02-Sep-26, 5:31",ell,6285766866658,Strangers,Junk,Regina Junita,"02-Sep-26, 5:31",0:00:00,0:00:00,Not Detected,Not Detected,"Kirim 5 foto random tanpa teks (bukan foto properti), sales tidak pernah membalas sama sekali",,[Ended by sales at 04-Sep-26 09:07 WIB]
230,"02-Sep-26, 5:11",Anita Amanda,6285782449591,First Contact,Cold,Regina Junita,"02-Sep-26, 6:50",1:39:19,0:00:00,instagram,SOHO Signature,"Minat SOHO, sales FU 3x, belum ada respon cust",❌,
231,"02-Sep-26, 5:10",Stasya IG @anastassyaspr,6281319957898,Follow Up,Cold,Regina Junita,"02-Sep-26, 7:26",2:15:42,0:00:21,instagram,SOHO Signature,"Cust respon nama & minta lihat detail, sales tanya kebutuhan tinggal/invest, masih tahap awal",✅,
232,"01-Sep-26, 21:48",.,6287796643554,First Contact,Cold,Kadek Bayu Permana Putra,"01-Sep-26, 23:23",1:35:25,0:00:28,instagram,Apart Kampus,"Tanya info detail, sales FU 3x, belum ada respon cust",❌,[Ended by sales at 09-Sep-26 14:30 WIB]
233,"01-Sep-26, 21:05",mumtaz,6281917013853,First Contact,Cold,Fitriyani Dewi,"01-Sep-26, 21:07",0:02:23,0:00:14,instagram,Apart Kampus,"Tanya info, sales FU intensif 5x dalam 2 hari, belum ada respon cust",✅,[Ended by sales at 09-Sep-26 16:03 WIB]
234,"01-Sep-26, 20:53",Rosaline Paramita,6281311578699,Follow Up,Prospect,Regina Junita,"01-Sep-26, 20:53",0:00:25,0:00:25,Google,Apartemen LP 3,"Diskusi detail: harga 2.4M, IPL 33rb, sinking fund, furnished, domisili; bahas jadwal private showing weekend (blm fix)",✅,
235,"01-Sep-26, 19:49",BG _to,6281901251106,Follow Up,Cold,Ira Rosdiana,"01-Sep-26, 19:52",0:03:09,0:00:39,instagram,Apart Kampus,"Cust tanya 'upper west itu apa', dijelaskan office&residence, masih basic",✅,[Ended by sales at 08-Sep-26 12:03 WIB]
236,"01-Sep-26, 17:03",kiaaa,6285381958571,First Contact,Cold,Fitriyani Dewi,"01-Sep-26, 17:05",0:02:57,0:00:27,instagram,Apart Kampus,"Tanya info, sales FU intensif 5x, belum ada respon cust",✅,[Ended by sales at 13-Sep-26 08:30 WIB]
237,"01-Sep-26, 15:51",D3,6281294940707,Strangers,Junk,Regina Junita,"01-Sep-26, 15:57",0:05:18,0:00:23,Not Detected,Not Detected,"Salah sambung, cust kira ini nomor BCA KCU Gading Serpong",,
238,"01-Sep-26, 13:46",fah,6285755120037,Follow Up,Cold,Kadek Bayu Permana Putra,"01-Sep-26, 13:47",0:00:14,0:00:14,Google,Website (APH),"Minat unit AP-H 82,43sqm, balas nama 'Rifa', tidak lanjut respon setelahnya",✅,[Ended by sales at 08-Sep-26 10:57 WIB]
239,"01-Sep-26, 13:40",Habib,6281282260717,First Contact,Cold,Fitriyani Dewi,"01-Sep-26, 13:43",0:02:25,0:00:15,instagram,SOHO Signature,"Minat SOHO Signature, sales FU 7x, belum ada respon cust",✅,[Ended by sales at 09-Sep-26 16:02 WIB]
240,"01-Sep-26, 13:34",Na'tona Eet,62811125656,First Contact,Cold,Regina Junita,"01-Sep-26, 13:39",0:05:17,0:00:18,instagram,Apart & WLB,"Minat apartemen, sales FU intensif 5x, belum ada respon cust",✅,
241,"01-Sep-26, 13:19",achaimupf_,62895627133202,Strangers,Junk,Kadek Bayu Permana Putra,"01-Sep-26, 13:19",0:00:00,0:00:00,instagram,Apart Kampus,Kirim link grup WhatsApp tidak relevan (spam),,[Ended by sales at 01-Sep-26 13:28 WIB]
242,"01-Sep-26, 11:21",Rana Syarifah,6285156133177,First Contact,Cold,Ira Rosdiana,"01-Sep-26, 11:25",0:03:48,0:01:27,instagram,Apart & WLB,"Minat apartemen, sales FU 4x, belum ada respon cust",❌,
243,"01-Sep-26, 10:12",Sera S Notoraharjo,6282114700552,First Contact,Cold,Kadek Bayu Permana Putra,"01-Sep-26, 10:12",0:00:19,0:00:19,instagram,SOHO Signature,"Minat SOHO Signature, sales FU 6x, belum ada respon cust",❌,[Ended by sales at 09-Sep-26 14:36 WIB]
244,"01-Sep-26, 6:25",BUN,6285876657720,Follow Up,Cold,Fitriyani Dewi,"01-Sep-26, 7:13",0:47:36,0:00:26,instagram,Apart Kampus,"Cust (Lie) aktif chat minta nomor WA pribadi sales, belum bahas detail produk",✅,[Ended by sales at 10-Sep-26 09:35 WIB]
245,"01-Sep-26, 5:49",adsta,62895386240458,First Contact,Cold,Fitriyani Dewi,"01-Sep-26, 7:26",1:36:18,0:00:19,instagram,SOHO Signature,"Minat SOHO Signature, sales FU 5x, belum ada respon cust",✅,[Ended by sales at 09-Sep-26 16:02 WIB]
"""

reader = csv.DictReader(io.StringIO(raw_csv.strip()))
records = []
for row in reader:
    no_val = int(row['No.'])
    rec = {
        "no": no_val,
        "date": row['date'].strip(),
        "contact": row['contact'].strip(),
        "phone": row['No Telfon'].strip(),
        "resolve": row['Resolve / Follow Up'].strip(),
        "status": row['Status Leads'].strip(),
        "assigned": row['assigned_to'].strip(),
        "answeredAt": row['answered_at'].strip(),
        "firstResponseTime": row['SLA First Respon'].strip(),
        "agentFirstReplyTime": row['agent_first_reply_time'].strip(),
        "source": row['Source'].strip(),
        "adSource": row['Iklan by'].strip(),
        "remarks": row['Remaks FU 1'].strip(),
        "sop": row['SOP Sales'].strip() if row['SOP Sales'] else None,
        "notes": row['Notes'].strip() if row['Notes'] else None
    }
    records.append(rec)

print(f"Total parsed records: {len(records)}")

ts_content = "import { ExcelRowInput } from '../types';\n\n"
ts_content += f"// Dataset Leads September 2026 Updated (Total: {len(records)} leads, up to 15 Sept 2026)\n"
ts_content += "export const EXCEL_LEADS_SEPTEMBER: ExcelRowInput[] = "
ts_content += json.dumps(records, indent=2, ensure_ascii=False) + ";\n"

with open("src/data/leadsSeptemberData.ts", "w", encoding="utf-8") as f:
    f.write(ts_content)

print("Updated src/data/leadsSeptemberData.ts successfully.")
