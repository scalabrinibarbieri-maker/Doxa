
(()=>{
  const removed=new Set(['almeida-1911','1-enoch-pt','jubilees-pt','2-esdras-pt','4-ezra-view']);
  for(const k of removed){try{delete CORPORA[k]}catch(e){}try{delete VERSION_META[k]}catch(e){}try{delete positions[k]}catch(e){}}
  if(removed.has(mode))mode='almeida';
  if(window.parallelState){for(const side of ['A','B']){if(removed.has(parallelState?.[side]?.mode)){parallelState[side].mode='almeida';parallelState[side].book=parallelState[side].book||'Gen';parallelState[side].chapter=Number(parallelState[side].chapter)||1}}}
  try{for(let i=PARALLEL_VERSION_OPTIONS.length-1;i>=0;i--)if(removed.has(PARALLEL_VERSION_OPTIONS[i][0]))PARALLEL_VERSION_OPTIONS.splice(i,1)}catch(e){}
  setTimeout(()=>{try{syncLegacyVersionSelects();renderReader();if(parallelOn)renderParallel()}catch(e){}},0);
})();
