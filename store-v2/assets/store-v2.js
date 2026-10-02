(function(){
const products={
 digital:{id:'digital',name:'NEX COLLECTION',type:'DIGITAL / 01',price:49,unit:'SAR',label:'منتج رقمي',description:'مجموعة رقمية تجريبية لعرض طريقة تقديم المنتجات الرقمية داخل VAZ Store 2.0. سيتم استبدال الوصف والسعر والملفات بعد اعتماد المنتج النهائي.',delivery:'تسليم رقمي بعد تأكيد الدفع في النسخة الإنتاجية.'},
 physical:{id:'physical',name:'VAZ OBJECT',type:'PHYSICAL / 02',price:120,unit:'SAR',label:'منتج فعلي',description:'عنصر فعلي تجريبي لتوضيح صفحة المنتج وخيارات الشحن. لا يمثل مخزونًا أو منتجًا متاحًا للبيع حاليًا.',delivery:'الشحن ومدة التوصيل غير مفعّلين في هذه النسخة.'},
 service:{id:'service',name:'CREATIVE IDENTITY',type:'SERVICE / 03',price:350,unit:'SAR',label:'خدمة إبداعية',description:'مثال توضيحي لخدمة تصميم هوية إبداعية. نطاق العمل والمخرجات والمدة النهائية تحدد عند اعتماد باقات الخدمات.',delivery:'تنفيذ الخدمة يتم بالتنسيق مع العميل بعد اعتماد الطلب.'}
};
const key='vazStoreV2Cart';
const read=()=>{try{return JSON.parse(localStorage.getItem(key)||'[]')}catch(e){return []}};
const save=items=>localStorage.setItem(key,JSON.stringify(items));
const money=n=>new Intl.NumberFormat('ar-SA',{style:'currency',currency:'SAR',maximumFractionDigits:0}).format(n);
const cartCount=()=>document.querySelectorAll('[data-cart-count]').forEach(el=>el.textContent=read().reduce((s,x)=>s+x.qty,0));
const add=id=>{const p=products[id];if(!p)return;const items=read();const found=items.find(x=>x.id===id);if(found)found.qty+=1;else items.push({id,qty:1});save(items);cartCount();};
const page=document.body.dataset.page;
if(page==='product'){
 const id=new URLSearchParams(location.search).get('id')||'digital';const p=products[id]||products.digital;
 document.querySelector('[data-name]').textContent=p.name;document.querySelector('[data-type]').textContent=p.type;document.querySelector('[data-description]').textContent=p.description;document.querySelector('[data-price]').textContent=money(p.price);document.querySelector('[data-delivery]').textContent=p.delivery;document.querySelector('[data-art]').textContent=p.name.split(' ')[0];
 document.querySelector('[data-add]').addEventListener('click',()=>{add(p.id);const msg=document.querySelector('[data-message]');msg.textContent='تمت إضافة العنصر إلى السلة التجريبية.';});
}
if(page==='cart'){
 const root=document.querySelector('[data-items]');
 const render=()=>{const items=read();if(!items.length){root.innerHTML='<p class="description">السلة فارغة حاليًا. تصفح المنتجات التجريبية للبدء.</p>';document.querySelector('[data-total]').textContent=money(0);document.querySelector('[data-checkout]').hidden=true;return}
 root.innerHTML=items.map(x=>{const p=products[x.id];return '<div class="item"><div><h3>'+p.name+'</h3><p>'+p.label+' · الكمية: '+x.qty+'</p></div><div class="item-side"><strong>'+money(p.price*x.qty)+'</strong><button class="remove" data-remove="'+p.id+'">إزالة</button></div></div>'}).join('');
 document.querySelector('[data-total]').textContent=money(items.reduce((s,x)=>s+products[x.id].price*x.qty,0));document.querySelector('[data-checkout]').hidden=false;
 root.querySelectorAll('[data-remove]').forEach(b=>b.addEventListener('click',()=>{save(read().filter(x=>x.id!==b.dataset.remove));render();cartCount()}));};
 render();
}
if(page==='checkout'){
 const items=read();const summary=document.querySelector('[data-summary]');
 const total=items.reduce((s,x)=>s+(products[x.id]?.price||0)*x.qty,0);
 summary.innerHTML=items.length?items.map(x=>'<div class="summary"><span>'+products[x.id].name+' × '+x.qty+'</span><strong>'+money(products[x.id].price*x.qty)+'</strong></div>').join(''):'<p class="description">السلة فارغة. ارجع إلى المتجر لإضافة منتج.</p>';
 document.querySelector('[data-total]').textContent=money(total);
 document.querySelector('form').addEventListener('submit',e=>{e.preventDefault();document.querySelector('[data-result]').textContent='تم التحقق من النموذج محليًا فقط. لم يتم إرسال بياناتك أو إنشاء طلب أو تنفيذ أي عملية دفع.';});
}
cartCount();
})();