const STORAGE_KEY = 'cursorTrailSettings';

function load(cb){
  try{chrome.storage.sync.get([STORAGE_KEY],(res)=>cb(res?.[STORAGE_KEY]||{}));}catch(_){cb({});}
}
function save(next){
  try{chrome.storage.sync.set({[STORAGE_KEY]:next});}catch(_){/* noop */}
}

document.addEventListener('DOMContentLoaded',()=>{
  const toggle = document.getElementById('toggle');
  const openOptions = document.getElementById('open-options');

  load((cfg)=>{
    toggle.checked = cfg.enabled !== false;
  });

  toggle.addEventListener('change',()=>{
    load((cfg)=>{
      const next = { ...cfg, enabled: !!toggle.checked };
      save(next);
    });
  },{passive:true});

  openOptions.addEventListener('click',(e)=>{
    e.preventDefault();
    try{chrome.runtime.openOptionsPage();}catch(_){/* noop */}
  });
});


