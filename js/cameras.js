/* Sabit kamera profilleri: yalnızca ürün ekibi değiştirir. Kullanıcı arayüzünde ayar yoktur.
   Tüm modeller ücretsizdir (is_free: true). Marka adları özgündür; gerçek model adı kullanılacaksa doğrulayın. */
const CAMERAS=[
{id:'cd-2003',brand:'Sunny',model:'Compact D3',era:'2003',category:'Compact Digital',version:1,layout:'white',aspect:4/3,flash:true,is_free:true,sw:'#cfd8e0',
 p:{contrast:1.15,sat:1.2,bright:1.08,warm:-4,grain:6,vignette:.12,fade:0}},
{id:'film-76',brand:'Amber',model:'Film 76',era:'1976',category:'Film Camera',version:1,layout:'full',aspect:3/4,flash:false,is_free:true,sw:'#c98f55',
 p:{contrast:.95,sat:.95,bright:1.02,warm:22,grain:18,vignette:.25,fade:.12}},
{id:'ip-82',brand:'Polar',model:'Instant 82',era:'1982',category:'Instant Print',version:1,layout:'white',aspect:1,flash:true,is_free:true,sw:'#e8d9b5',
 p:{contrast:.9,sat:.9,bright:1.06,warm:12,grain:10,vignette:.2,fade:.2}},
{id:'pb-70',brand:'Booth',model:'Strip 70',era:'1970',category:'Photo Booth',version:1,layout:'strip',aspect:1,flash:true,is_free:true,sw:'#8d7b68',
 p:{contrast:1.25,sat:.25,bright:1.03,warm:8,grain:16,vignette:.3,fade:.1},frames:3},
{id:'pp-95',brand:'Snapper',model:'Point 95',era:'1995',category:'Classic Point-and-Shoot',version:1,layout:'full',aspect:3/4,flash:true,is_free:true,sw:'#b9a37e',
 p:{contrast:1.1,sat:1.1,bright:1.1,warm:15,grain:12,vignette:.18,fade:.05}}
];
