import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';

export default defineConfig({
  plugins:[{
    name:'sentinel-eye-brand',
    transformIndexHtml:{order:'pre',handler:html=>{
      const logo=readFileSync(new URL('./public/brand/sentinel-eye.svg',import.meta.url),'utf8');
      const mark=logo.match(/<g id="sentinel-eye-mark"[\s\S]*?<\/g>/)?.[0];
      if(!mark)throw new Error('The Sentinel eye vector is missing its mark.');
      // Inline the shared mark in the initial response, including the splash.
      return html.replace('<!-- sentinel-eye-symbol -->',`<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" aria-hidden="true" focusable="false" style="position:absolute;overflow:hidden;pointer-events:none"><symbol id="sentinel-eye" viewBox="0 0 96 64">${mark}</symbol></svg>`);
    }}
  },{
    name:'first-paint-portfolio-css',apply:'build',
    transformIndexHtml:{order:'post',handler:(html,context)=>html.replace(/<link\b[^>]*rel="stylesheet"[^>]*>/g,tag=>{
      if(tag.includes('data-portfolio-fonts'))return tag;
      const href=tag.match(/href="([^"]+)"/)?.[1];
      const asset=href&&context.bundle?.[href.replace(/^\//,'')];
      // Keep the generated CSS file, but include its styles in the initial page
      // so neither the loading screen nor its deadline can reveal unstyled HTML.
      return asset?.type==='asset'?`<style data-portfolio-css>${asset.source}</style>`:tag;
    })}
  }],
  // Preserve previously generated files as well as the original project.
  build: { emptyOutDir: false },
});
