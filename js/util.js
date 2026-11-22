/* Bağımsız yardımcılar: ZIP (store) ve PDF (JPEG gömme) üreticileri — harici kütüphane yok. */
const crcT=(()=>{const t=[];for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
const crc32=u=>{let c=-1;for(let i=0;i<u.length;i++)c=crcT[(c^u[i])&255]^(c>>>8);return(c^-1)>>>0};
async function makeZip(files){
 const parts=[],cen=[],enc=new TextEncoder(),n=new Date();let off=0;
 const dt=((n.getFullYear()-1980)<<9)|((n.getMonth()+1)<<5)|n.getDate(),tm=(n.getHours()<<11)|(n.getMinutes()<<5)|(n.getSeconds()>>1);
 for(const f of files){
  const d=new Uint8Array(await f.blob.arrayBuffer()),nm=enc.encode(f.name),crc=crc32(d);
  const h=new DataView(new ArrayBuffer(30));
  h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(6,0x0800,true);h.setUint16(10,tm,true);h.setUint16(12,dt,true);
  h.setUint32(14,crc,true);h.setUint32(18,d.length,true);h.setUint32(22,d.length,true);h.setUint16(26,nm.length,true);
  parts.push(h.buffer,nm,d);
  const c=new DataView(new ArrayBuffer(46));
  c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);c.setUint16(8,0x0800,true);c.setUint16(12,tm,true);c.setUint16(14,dt,true);
  c.setUint32(16,crc,true);c.setUint32(20,d.length,true);c.setUint32(24,d.length,true);c.setUint16(28,nm.length,true);c.setUint32(42,off,true);
  cen.push(c.buffer,nm);off+=30+nm.length+d.length}
 const cs=cen.reduce((s,b)=>s+b.byteLength,0),e=new DataView(new ArrayBuffer(22));
 e.setUint32(0,0x06054b50,true);e.setUint16(8,files.length,true);e.setUint16(10,files.length,true);e.setUint32(12,cs,true);e.setUint32(16,off,true);
 return new Blob([...parts,...cen,e.buffer],{type:'application/zip'})}

const TR={ç:'c',Ç:'C',ğ:'g',Ğ:'G',ı:'i',İ:'I',ö:'o',Ö:'O',ş:'s',Ş:'S',ü:'u',Ü:'U'};
/* imgs: [{blob(JPEG),w,h,cap}] → A4 fotokitap PDF (kapak + sayfa başına 1 fotoğraf) */
async function makePDF(title,sub,imgs){
 const enc=new TextEncoder(),ch=[],off=[];let len=0,n=5;const kids=[];
 const push=x=>{const u=typeof x==='string'?enc.encode(x):x;ch.push(u);len+=u.length};
 const obj=(i,body,stream)=>{off[i]=len;push(`${i} 0 obj\n${body}`);if(stream){push('\nstream\n');push(stream);push('\nendstream')}push('\nendobj\n')};
 const A=s=>String(s).replace(/[çÇğĞıİöÖşŞüÜ]/g,c=>TR[c]).replace(/[^\x20-\x7e]/g,'').replace(/[()\\]/g,'\\$&');
 const T=(f,sz,x,y,s)=>`BT /${f} ${sz} Tf ${x.toFixed(1)} ${y.toFixed(1)} Td (${A(s)}) Tj ET\n`;
 const bg='0.957 0.925 0.863 rg 0 0 595 842 re f\n';
 const page=(cs,res,extra='')=>{const c=n++,p=n++,b=enc.encode(cs);obj(c,`<< /Length ${b.length} >>`,b);
  obj(p,`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> ${res} >> /Contents ${c} 0 R >>`);kids.push(p)};
 push('%PDF-1.4\n');
 obj(3,'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
 obj(4,'<< /Type /Font /Subtype /Type1 /BaseFont /Times-Bold /Encoding /WinAnsiEncoding >>');
 page(bg+'0.478 0.294 0.165 rg '+T('F2',38,60,520,title)+T('F1',13,60,488,sub)+'0.706 0.443 0.247 rg 60 470 120 3 re f\n'+T('F1',10,60,60,'RETRO CAMERA  -  A moment from another time.'),'');
 let pn=1;
 for(const im of imgs){
  const ix=n++,s=Math.min(495/im.w,640/im.h),w=im.w*s,h=im.h*s,x=(595-w)/2,y=842-100-h,bytes=new Uint8Array(await im.blob.arrayBuffer());
  obj(ix,`<< /Type /XObject /Subtype /Image /Width ${im.w} /Height ${im.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${bytes.length} >>`,bytes);
  pn++;
  page(bg+`0.82 0.76 0.65 rg ${x-11} ${y-35} ${w+24} ${h+48} re f 1 1 1 rg ${x-12} ${y-36} ${w+24} ${h+48} re f\nq ${w.toFixed(1)} 0 0 ${h.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)} cm /Im Do Q\n0.35 0.23 0.14 rg `+T('F1',10,x,y-24,im.cap)+T('F1',9,292,40,String(pn)),`/XObject << /Im ${ix} 0 R >>`)}
 obj(1,'<< /Type /Catalog /Pages 2 0 R >>');
 obj(2,`<< /Type /Pages /Kids [${kids.map(k=>k+' 0 R').join(' ')}] /Count ${kids.length} >>`);
 const xs=len;push(`xref\n0 ${n}\n0000000000 65535 f \n`);
 for(let i=1;i<n;i++)push(String(off[i]).padStart(10,'0')+' 00000 n \n');
 push(`trailer\n<< /Size ${n} /Root 1 0 R >>\nstartxref\n${xs}\n%%EOF`);
 return new Blob(ch,{type:'application/pdf'})}
