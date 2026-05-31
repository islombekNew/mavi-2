// ============================================================
// MAVI TRAVERTIN — HAQIQIY MAHSULOTLAR
// Narxlar: Naqt summasi / Shot orqali
// img: "images/product-nomi.jpg" (380×285px)
// ============================================================
const PRODUCTS = [
  {
    id:1, cat:'travertin',
    name:'Travertin 25 KG',
    desc:'Premium travertin — 25 kg qadoqlangan. Yuqori sifatli tosh qoplama uchun.',
    price:'115 000', price2:'125 000', unit:'qop',
    badge:'HIT', img:'', imgLabel:'380×285px'
  },
  {
    id:2, cat:'travertin',
    name:'Travertin Lak 1 KG',
    desc:'Travertin sirtini himoya qiluvchi lak. 1 kg qadoq.',
    price:'45 000', price2:'49 000', unit:'kg',
    badge:'', img:'', imgLabel:'380×285px'
  },
  {
    id:3, cat:'travertin',
    name:'Travertin Jemchug Lak 1 KG',
    desc:'Marvarid effektli travertin laki. Sirt go\'zalligini oshiradi.',
    price:'60 000', price2:'64 000', unit:'kg',
    badge:'YANGI', img:'', imgLabel:'380×285px'
  },
  {
    id:4, cat:'travertin',
    name:'Travertin Gruntovka 20 KG',
    desc:'Travertin uchun maxsus gruntovka. 20 kg qadoq. Yopishimlilikni oshiradi.',
    price:'220 000', price2:'245 000', unit:'qop',
    badge:'', img:'', imgLabel:'380×285px'
  },
  {
    id:5, cat:'astar',
    name:'Astar Gruntovka 5 KG',
    desc:'Universal astar gruntovka. 5 kg qadoq. Qurilish ishlari uchun.',
    price:'20 000', price2:'24 000', unit:'qop',
    badge:'', img:'', imgLabel:'380×285px'
  },
  {
    id:6, cat:'astar',
    name:'Astar Gruntovka 5 KG (Kuchli)',
    desc:'Kuchaytirilgan formulali astar gruntovka. Namlik va zamburug\'ga qarshi.',
    price:'70 000', price2:'74 000', unit:'qop',
    badge:'PREMIUM', img:'', imgLabel:'380×285px'
  },
  {
    id:7, cat:'rodban',
    name:'Rodban Dodasi Pachka 25 KG',
    desc:'Rodban qo\'shimchasi — 25 kg pachka. Beton mustahkamligi uchun.',
    price:'23 000', price2:'26 000', unit:'pachka',
    badge:'', img:'', imgLabel:'380×285px'
  },
  {
    id:8, cat:'rodban',
    name:'Rodban Navalka 1 KG',
    desc:'Rodban navalka — 1 kg. Kichik hajmdagi qurilish ishlari uchun.',
    price:'800', price2:'950', unit:'kg',
    badge:'', img:'', imgLabel:'380×285px'
  },
  {
    id:9, cat:'kley',
    name:'Kley Dodasi Pachka 25 KG',
    desc:'Yuqori qo\'shilishli plitka kleyi. 25 kg pachka. Har qanday sirt uchun.',
    price:'25 000', price2:'28 000', unit:'pachka',
    badge:'HIT', img:'', imgLabel:'380×285px'
  },
  {
    id:10, cat:'kley',
    name:'Kley Navalka 1 KG',
    desc:'Kley navalka — 1 kg. Kichik ta\'mirlash ishlari uchun qulay.',
    price:'900', price2:'1 050', unit:'kg',
    badge:'', img:'', imgLabel:'380×285px'
  },
  {
    id:11, cat:'pena',
    name:'Pena Suvoq 1 KG',
    desc:'Pena suvoq materiyal. 1 kg qadoq. Yumshoq va oson surtiladi.',
    price:'1 200', price2:'1 450', unit:'kg',
    badge:'', img:'', imgLabel:'380×285px'
  },
  {
    id:12, cat:'polistro',
    name:'Polistro Tyaga / Pok Tyaga 1 Metr',
    desc:'Polistrol tyaga va pok tyaga — 1 metr. Narx hajmga qarab.',
    price:'8 000–65 000', price2:'10 000–85 000', unit:'m',
    badge:'NOYOB', img:'', imgLabel:'380×285px'
  },
  {
    id:13, cat:'shpaklovka',
    name:'Shpaklovka Glat Navalka 1 KG',
    desc:'Silliq shpaklovka — 1 kg. Devor va shift tekislash uchun.',
    price:'1 100', price2:'1 350', unit:'kg',
    badge:'', img:'', imgLabel:'380×285px'
  },
  {
    id:14, cat:'shpaklovka',
    name:'Glat Dodasi Pachka 20 KG',
    desc:'Glat shpaklovka qo\'shimchasi. 20 kg pachka. Ko\'p hajmli ishlar uchun.',
    price:'30 000', price2:'32 000', unit:'pachka',
    badge:'', img:'', imgLabel:'380×285px'
  },
  {
    id:15, cat:'vodaemulsiya',
    name:'Vodaemulsiya Moyushaya 20 KG',
    desc:'Yog\'li vodaemulsiya bo\'yoq. 20 kg qadoq. Devor va shift bo\'yash uchun.',
    price:'180 000', price2:'195 000', unit:'qop',
    badge:'', img:'', imgLabel:'380×285px'
  },
  {
    id:16, cat:'vodaemulsiya',
    name:'Vodaemulsiya Moyushaya 10 KG',
    desc:'Yog\'li vodaemulsiya bo\'yoq. 10 kg qadoq. Kichik hajmli bo\'yash uchun.',
    price:'90 000', price2:'105 000', unit:'qop',
    badge:'', img:'', imgLabel:'380×285px'
  },
  {
    id:17, cat:'otachento',
    name:'Otachento Tosh SZ 1 KG',
    desc:'Otachento tosh tozalovchi vosita SZ seriyasi. 1 kg qadoq.',
    price:'95 000', price2:'100 000', unit:'kg',
    badge:'', img:'', imgLabel:'380×285px'
  },
  {
    id:18, cat:'otachento',
    name:'Otachento Toshli 1 KG',
    desc:'Otachento toshli tozalovchi. 1 kg. Tosh yuzalarni saqlash uchun.',
    price:'120 000', price2:'125 000', unit:'kg',
    badge:'YANGI', img:'', imgLabel:'380×285px'
  },
  {
    id:19, cat:'kraska',
    name:'Kraska PF-115 1 Bonka',
    desc:'PF-115 moyga asoslangan kraska. 1 bonka. Metal va yog\'och uchun.',
    price:'110 000', price2:'120 000', unit:'bonka',
    badge:'', img:'', imgLabel:'380×285px'
  },
  {
    id:20, cat:'travertin',
    name:'Travertin Premium Seti',
    desc:'Travertin + Lak + Gruntovka — to\'liq komplekt. Eng qulay narxda.',
    price:'350 000', price2:'385 000', unit:'set',
    badge:'KOMPLEKT', img:'', imgLabel:'380×285px'
  },
];

function catLabel(cat) {
  const m = {
    travertin:'Travertin', astar:'Astar', rodban:'Rodban',
    kley:'Kley', pena:'Pena', polistro:'Polistro',
    shpaklovka:'Shpaklovka', vodaemulsiya:'Vodaemulsiya',
    otachento:'Otachento', kraska:'Kraska'
  };
  return m[cat] || cat;
}
