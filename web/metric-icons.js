// Scoped to the five top indicators. Shared/map icons intentionally unchanged.
const paths={
 building:'M4 24V6a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v18M18 12h5a1 1 0 0 1 1 1v11M2 24h24M8 9h2m3 0h1M8 13h2m3 0h1M8 17h2m3 0h1M9 24v-4h4v4M21 16v2m0 3v3',
 monitor:'M4 5h20a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1ZM14 21v4m-5 0h10',
 box:'m14 2 11 6v13L14 27 3 21V8zM3 8l11 6 11-6M14 14v13M8.5 5l11 6',
 clipboard:'M10 5H6a1 1 0 0 0-1 1v19a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-4M11 2h6a1 1 0 0 1 1 1v4h-8V3a1 1 0 0 1 1-1ZM9 16l3 3 7-8',
 file:'M6 2h11l6 6v17a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1ZM16 2v7h7M9 13h10M9 17h10M9 21h7'
};
export function metricIcon(name){return `<svg class="metric-glyph" viewBox="0 0 28 29" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name]}"/></svg>`;}
