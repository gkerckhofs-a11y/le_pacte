export const HOTSPRING=Object.freeze({scenarioId:'les-colons-de-hotspring',scenarioVersion:'1.2.0',skinId:'western'});
export const isHotspring=value=>value?.scenarioId===HOTSPRING.scenarioId;
export const isCurrentHotspring=value=>isHotspring(value)&&value.scenarioVersion===HOTSPRING.scenarioVersion;
export const narrativeRegie=(id,hotspring=false)=>(hotspring?'/hotspring':'/regie')+(id?'?session='+encodeURIComponent(id):'');

export const isCurrentChicago=value=>value?.scenarioId==='cosa-nostra-chicago';
