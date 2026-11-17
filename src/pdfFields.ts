export const importFields=['title','authors','year','journal','keywords','abstract','design','findings'] as const;
export type ImportField=typeof importFields[number];
export const importLabels:Record<ImportField,string>={title:'文獻名稱',authors:'文獻作者',year:'文獻年份',journal:'發表期刊',keywords:'文獻關鍵字',abstract:'文獻摘要',design:'研究設計',findings:'研究發現'};
