export function unoCSSToAppletProcess(str: string) {
  // dot
  if (str.includes('\.'))
    str = str.replace(/\\\./g, '-point-')
  // div
  if (str.includes('\/'))
    str = str.replace(/\\\//g, '-div-')
  // colon
  if (str.includes('\:'))
    str = str.replace(/\\\:/g, '-c-')
  // percent
  if (str.includes('\%'))
    str = str.replace(/\\\%/g, '-pct')
  // !important
  if (str.includes('\!'))
    str = str.replace(/\\\!/g, 'i-')
  // hex
  if (str.includes('\#'))
    str = str.replace(/\\\#/g, '-h-')
  // paren
  if (str.includes('\('))
    str = str.replace(/\\\(/g, 'p-')
  if (str.includes('\)'))
    str = str.replace(/\\\)/g, '-q')
  // square
  if (str.includes('\['))
    str = str.replace(/\\\[/g, 'l-')
  if (str.includes('\]'))
    str = str.replace(/\\\]/g, '-r')
  // x,x to x-comma-x
  if (str.includes('\,'))
    str = str.replace(/\\\,/g, '-comma-')
  return str
}
