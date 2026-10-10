import { defineConfig } from 'vite';

export default defineConfig({
  plugins:[{
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
