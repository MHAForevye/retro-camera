/* Kamera çizimleri: özgün, vektörel (viewBox 160×100). Zemin rengi kartın `sw` rengidir; çizimler üstüne oturur. */
const SH='<ellipse cx="80" cy="93" rx="54" ry="4" fill="#000" opacity=".16"/>';
const CAMART={
/* Sunny Compact D3: 2003 ince dijital kompakt */
'cd-2003':`<svg class="cart" viewBox="0 0 160 100" aria-hidden="true">${SH}
<rect x="22" y="28" width="116" height="60" rx="10" fill="#8f9ba7"/><rect x="22" y="28" width="116" height="20" rx="10" fill="#b8c2cb"/><rect x="22" y="40" width="116" height="8" fill="#b8c2cb"/>
<rect x="98" y="20" width="16" height="8" rx="2.5" fill="#56616b"/><rect x="38" y="20" width="12" height="8" rx="2" fill="#6f7b86"/>
<circle cx="58" cy="60" r="22" fill="#5b6670"/><circle cx="58" cy="60" r="17" fill="#1d1612"/><circle cx="58" cy="60" r="10" fill="#2c3f55"/><circle cx="58" cy="60" r="4.5" fill="#101a26"/><circle cx="52" cy="53" r="3.4" fill="#fff" opacity=".65"/>
<rect x="96" y="36" width="28" height="13" rx="3" fill="#eef3f6" stroke="#6f7b86" stroke-width="1.5"/><circle cx="130" cy="58" r="2.6" fill="#d4574a"/>
<text x="94" y="75" font-family="Georgia,serif" font-size="8.5" font-weight="700" letter-spacing="1.2" fill="#46515b">SUNNY</text></svg>`,
/* Amber Film 76: 35 mm SLR */
'film-76':`<svg class="cart" viewBox="0 0 160 100" aria-hidden="true">${SH}
<path d="M60 32 L66 17 H94 L100 32 Z" fill="#dcd6c8"/><rect x="16" y="30" width="128" height="14" rx="4" fill="#dcd6c8"/>
<rect x="16" y="40" width="128" height="48" rx="5" fill="#2b211a"/><g fill="#3d3027"><circle cx="26" cy="52" r="1.2"/><circle cx="34" cy="60" r="1.2"/><circle cx="26" cy="68" r="1.2"/><circle cx="34" cy="76" r="1.2"/><circle cx="126" cy="52" r="1.2"/><circle cx="134" cy="60" r="1.2"/><circle cx="126" cy="68" r="1.2"/><circle cx="134" cy="76" r="1.2"/></g>
<rect x="24" y="23" width="15" height="8" rx="2" fill="#b3ac9c"/><rect x="121" y="23" width="14" height="8" rx="2" fill="#b3ac9c"/><circle cx="128" cy="36" r="2.6" fill="#c14a3a"/>
<circle cx="80" cy="64" r="26" fill="#9c9382"/><circle cx="80" cy="64" r="22" fill="#2c231d"/><circle cx="80" cy="64" r="16" fill="#120e0c"/><circle cx="80" cy="64" r="9" fill="#26323f"/><circle cx="72" cy="56" r="4" fill="#fff" opacity=".6"/>
<text x="80" y="27.5" text-anchor="middle" font-family="Georgia,serif" font-size="7" font-weight="700" letter-spacing="1" fill="#6b5a45">AMBER</text></svg>`,
/* Polar Instant 82: anlık baskı */
'ip-82':`<svg class="cart" viewBox="0 0 160 100" aria-hidden="true">${SH}
<rect x="42" y="12" width="76" height="8" rx="4" fill="#3b2a1d"/><rect x="28" y="18" width="104" height="70" rx="12" fill="#f6f1e6"/><rect x="28" y="18" width="104" height="22" rx="12" fill="#fffaf0"/>
<rect x="28" y="76" width="104" height="3.2" fill="#c14a3a"/><rect x="28" y="79.4" width="104" height="3.2" fill="#e6a23c"/><rect x="28" y="82.8" width="104" height="3.2" fill="#4f8f6c"/>
<circle cx="80" cy="54" r="23" fill="#d7cfbd"/><circle cx="80" cy="54" r="19" fill="#2a231e"/><circle cx="80" cy="54" r="13" fill="#110f0d"/><circle cx="80" cy="54" r="7" fill="#2c3a4a"/><circle cx="73" cy="47" r="3.6" fill="#fff" opacity=".65"/>
<rect x="100" y="25" width="22" height="10" rx="2.5" fill="#e3dccb" stroke="#b9ae97" stroke-width="1.2"/><rect x="38" y="25" width="14" height="10" rx="2.5" fill="#2a3340"/><circle cx="116" cy="62" r="4.6" fill="#c14a3a"/></svg>`,
/* Booth Strip 70: fotoğraf kabini + çıkan şerit */
'pb-70':`<svg class="cart" viewBox="0 0 160 100" aria-hidden="true">${SH}
<rect x="36" y="9" width="72" height="82" rx="6" fill="#3b2a1d"/><rect x="42" y="14" width="60" height="12" rx="2.5" fill="#e9dcc3"/>
<text x="72" y="23.2" text-anchor="middle" font-family="Georgia,serif" font-size="8" font-weight="700" letter-spacing="2" fill="#7a4b2a">BOOTH</text>
<circle cx="72" cy="34" r="3.4" fill="#120e0c" stroke="#b4713f" stroke-width="1.4"/><rect x="45" y="41" width="54" height="46" fill="#a83a32"/>
<path d="M54 41v46M63 41v46M72 41v46M81 41v46M90 41v46" stroke="#7d2a25" stroke-width="1.6"/><rect x="45" y="41" width="54" height="4" fill="#8c2f29"/>
<g transform="rotate(5 126 56)"><rect x="112" y="22" width="26" height="68" rx="2" fill="#fbf8f1" stroke="#d9cfb8" stroke-width="1"/><g fill="#4a3a2c"><rect x="116" y="26" width="18" height="15"/><rect x="116" y="44" width="18" height="15"/><rect x="116" y="62" width="18" height="15"/></g><g fill="#f1e6d2" opacity=".55"><circle cx="122" cy="32" r="3"/><circle cx="122" cy="50" r="3"/><circle cx="122" cy="68" r="3"/></g></g></svg>`,
/* Snapper Point 95: 90'lar point-and-shoot */
'pp-95':`<svg class="cart" viewBox="0 0 160 100" aria-hidden="true">${SH}
<rect x="104" y="21" width="12" height="7" rx="2.5" fill="#c14a3a"/><rect x="18" y="26" width="124" height="60" rx="12" fill="#3a3430"/><rect x="18" y="26" width="124" height="16" rx="12" fill="#4b443e"/><rect x="18" y="36" width="124" height="6" fill="#4b443e"/>
<rect x="112" y="26" width="30" height="60" rx="12" fill="#2b2623"/><rect x="108" y="40" width="3" height="34" rx="1.5" fill="#1d1916"/>
<circle cx="56" cy="60" r="21" fill="#9a9183"/><circle cx="56" cy="60" r="17" fill="#0f0d0c"/><circle cx="56" cy="60" r="11" fill="#1f2c3c"/><circle cx="56" cy="60" r="4.5" fill="#0a1018"/><circle cx="50" cy="54" r="3.4" fill="#fff" opacity=".6"/>
<rect x="86" y="34" width="20" height="11" rx="2.5" fill="#efe9da"/><rect x="30" y="32" width="14" height="8" rx="2" fill="#18222e" stroke="#7d756a" stroke-width="1.2"/>
<text x="86" y="72" font-family="Georgia,serif" font-size="8" font-weight="700" letter-spacing="1" fill="#bdb29f">Snapper</text><text x="86" y="80.5" font-family="Georgia,serif" font-size="6" letter-spacing="1" fill="#8d8374">POINT 95</text></svg>`
};
