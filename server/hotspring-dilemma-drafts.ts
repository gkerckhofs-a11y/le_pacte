export function checkedDilemmaDraft(input){
 const fields={title:120,situation:6000,question:500,pour:2500,contre:2500};
 return Object.fromEntries(Object.entries(fields).map(([key,max])=>{
  const value=typeof input?.[key]==='string'?input[key].trim():'';
  if(value.length>max||(!value&&key==='title'))throw new Error('Renseignez le titre et respectez la longueur des champs.');
  return [key,value];
 }));
}
